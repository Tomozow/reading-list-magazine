import Dexie, { Table } from 'dexie';
import { EnhancedEntry, DatabaseStats, FilterOptions, SortOptions } from '../models/ReadingListEntry';

/**
 * リーディングリストマガジンのデータベースクラス
 * Dexie.jsを使用してIndexedDBを管理
 */
class ReadingListDatabase extends Dexie {
  // テーブル定義
  entries!: Table<EnhancedEntry, string>;
  
  // データベース・メタデータ
  private readonly DB_NAME = 'ReadingListMagazineDB';
  private readonly CURRENT_VERSION = 2; // バージョンを上げました
  
  constructor() {
    super('ReadingListMagazineDB');
    
    // スキーマ定義とインデックス設定
    this.version(1).stores({
      entries: 'id, url, title, addTime, lastUpdateTime, isRead, siteName'
    });
    
    // データベースのマイグレーション - バージョン2に更新
    this.version(2).stores({
      entries: 'id, url, title, addTime, lastUpdateTime, isRead, siteName, domain, contentExtracted, lastReadTime, *tags'
    }).upgrade(tx => {
      // 既存のデータを新しいスキーマに移行
      return tx.table('entries').toCollection().modify(entry => {
        // ドメイン名をURLから抽出して追加
        if (entry.url && !entry.domain) {
          try {
            const urlObj = new URL(entry.url);
            entry.domain = urlObj.hostname.replace('www.', '');
          } catch (error) {
            console.error('Failed to extract domain from URL:', error);
            entry.domain = '';
          }
        }
        
        // その他の新しいフィールドにデフォルト値を設定
        entry.contentExtracted = !!entry.content;
        entry.lastReadTime = entry.isRead ? (entry.lastUpdateTime || entry.addTime) : undefined;
        entry.tags = [];
      });
    });
  }
  
  /**
   * データベースのすべてのエントリを取得
   */
  async getAllEntries(): Promise<EnhancedEntry[]> {
    return await this.entries.toArray();
  }
  
  /**
   * エントリをIDで取得
   * @param id エントリID
   */
  async getEntryById(id: string): Promise<EnhancedEntry | undefined> {
    return await this.entries.get(id);
  }
  
  /**
   * エントリをURLで検索
   * @param url 検索するURL
   */
  async getEntryByUrl(url: string): Promise<EnhancedEntry | undefined> {
    return await this.entries.where('url').equals(url).first();
  }
  
  /**
   * フィルターを適用してエントリを取得
   * @param options フィルタリングオプション
   * @param sort ソートオプション
   */
  async getFilteredEntries(
    options: FilterOptions = {},
    sort: SortOptions = { field: 'addTime', direction: 'desc' }
  ): Promise<EnhancedEntry[]> {
    // クエリを構築
    let collection = this.entries.toCollection();
    
    // 既読/未読のフィルタリング
    if (options.showRead === false) {
      collection = collection.filter(entry => !entry.isRead);
    } else if (options.showRead === true) {
      collection = collection.filter(entry => entry.isRead);
    }
    
    // ドメインによるフィルタリング
    if (options.domain) {
      collection = collection.filter(entry => entry.domain === options.domain);
    }
    
    // 日付範囲によるフィルタリング
    if (options.dateRange && options.dateRange.length === 2) {
      const [startDate, endDate] = options.dateRange;
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      collection = collection.filter(entry => {
        const time = entry.addTime;
        return time >= startTime && time <= endTime;
      });
    }
    
    // タグによるフィルタリング
    if (options.tags && options.tags.length > 0) {
      collection = collection.filter(entry => {
        if (!entry.tags) return false;
        return options.tags!.some(tag => entry.tags!.includes(tag));
      });
    }
    
    // 検索語によるフィルタリング（単純な部分一致）
    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      collection = collection.filter(entry => {
        return (
          (entry.title && entry.title.toLowerCase().includes(term)) ||
          (entry.content && entry.content.toLowerCase().includes(term)) ||
          (entry.excerpt && entry.excerpt.toLowerCase().includes(term)) ||
          (entry.author && entry.author.toLowerCase().includes(term)) ||
          (entry.siteName && entry.siteName.toLowerCase().includes(term))
        );
      });
    }
    
    // 結果を配列として取得
    let results = await collection.toArray();
    
    // ソート処理
    results.sort((a, b) => {
      let valueA: any = a[sort.field] ?? 0;
      let valueB: any = b[sort.field] ?? 0;
      
      // 文字列の場合は大文字小文字を区別せずに比較
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      // 順序に基づいて比較
      const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      
      // 降順の場合は結果を反転
      return sort.direction === 'asc' ? compareResult : -compareResult;
    });
    
    return results;
  }
  
  /**
   * 新しいエントリを追加
   * @param entry 追加するエントリ
   */
  async addEntry(entry: EnhancedEntry): Promise<string> {
    return await this.entries.add(entry);
  }
  
  /**
   * 複数のエントリを一括追加
   * @param entries 追加するエントリの配列
   */
  async bulkAddEntries(entries: EnhancedEntry[]): Promise<void> {
    await this.entries.bulkAdd(entries);
  }
  
  /**
   * エントリを更新
   * @param id 更新するエントリのID
   * @param changes 変更内容
   */
  async updateEntry(id: string, changes: Partial<EnhancedEntry>): Promise<void> {
    await this.entries.update(id, {
      ...changes,
      lastUpdateTime: Date.now()
    });
  }
  
  /**
   * 複数のエントリを一括更新
   * @param entries 更新する {id, changes} オブジェクトの配列
   */
  async bulkUpdateEntries(entries: { id: string; changes: Partial<EnhancedEntry> }[]): Promise<void> {
    await this.transaction('rw', this.entries, async () => {
      for (const { id, changes } of entries) {
        await this.entries.update(id, {
          ...changes,
          lastUpdateTime: Date.now()
        });
      }
    });
  }
  
  /**
   * エントリを削除
   * @param id 削除するエントリのID
   */
  async deleteEntry(id: string): Promise<void> {
    await this.entries.delete(id);
  }
  
  /**
   * 複数のエントリを一括削除
   * @param ids 削除するエントリIDの配列
   */
  async bulkDeleteEntries(ids: string[]): Promise<void> {
    await this.entries.bulkDelete(ids);
  }
  
  /**
   * データベースの統計情報を取得
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const entries = await this.entries.toArray();
    
    // 基本的な統計情報を計算
    const totalEntries = entries.length;
    const readEntries = entries.filter(entry => entry.isRead).length;
    const unreadEntries = totalEntries - readEntries;
    
    // 日付情報
    const times = entries.map(entry => entry.addTime);
    const oldestEntryDate = times.length > 0 ? Math.min(...times) : Date.now();
    const newestEntryDate = times.length > 0 ? Math.max(...times) : Date.now();
    
    // コンテンツの平均長さ
    let totalContentLength = 0;
    let entriesWithContent = 0;
    
    entries.forEach(entry => {
      if (entry.content) {
        totalContentLength += entry.content.length;
        entriesWithContent++;
      }
    });
    
    const averageContentLength = entriesWithContent > 0 
      ? Math.round(totalContentLength / entriesWithContent) 
      : 0;
    
    // 概算のストレージ使用量（バイト単位）
    let totalStorageUsed = 0;
    
    entries.forEach(entry => {
      // JSONとして文字列化したサイズを概算
      const entryString = JSON.stringify(entry);
      totalStorageUsed += entryString.length * 2; // UTF-16エンコーディングを想定
    });
    
    return {
      totalEntries,
      readEntries,
      unreadEntries,
      averageContentLength,
      oldestEntryDate,
      newestEntryDate,
      totalStorageUsed
    };
  }
  
  /**
   * すべてのドメインと各ドメインのエントリ数を取得
   */
  async getDomainStats(): Promise<{ domain: string; count: number }[]> {
    const entries = await this.entries.toArray();
    
    // ドメインごとにカウント
    const domainCount: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.domain) {
        domainCount[entry.domain] = (domainCount[entry.domain] || 0) + 1;
      }
    });
    
    // 配列に変換してカウント順にソート
    const result = Object.entries(domainCount).map(([domain, count]) => ({ domain, count }));
    result.sort((a, b) => b.count - a.count);
    
    return result;
  }
  
  /**
   * すべてのタグと各タグのエントリ数を取得
   */
  async getTagStats(): Promise<{ tag: string; count: number }[]> {
    const entries = await this.entries.toArray();
    
    // タグごとにカウント
    const tagCount: Record<string, number> = {};
    
    entries.forEach(entry => {
      if (entry.tags && entry.tags.length > 0) {
        entry.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    
    // 配列に変換してカウント順にソート
    const result = Object.entries(tagCount).map(([tag, count]) => ({ tag, count }));
    result.sort((a, b) => b.count - a.count);
    
    return result;
  }
  
  /**
   * データベースをクリア（すべてのエントリを削除）
   */
  async clearDatabase(): Promise<void> {
    await this.entries.clear();
  }
  
  /**
   * エントリが存在するかチェック
   * @param id チェックするエントリID
   */
  async entryExists(id: string): Promise<boolean> {
    const count = await this.entries.where('id').equals(id).count();
    return count > 0;
  }
  
  /**
   * エントリ数を取得
   */
  async getEntryCount(): Promise<number> {
    return await this.entries.count();
  }
}

// データベースインスタンスのシングルトン
const db = new ReadingListDatabase();

export default db;
