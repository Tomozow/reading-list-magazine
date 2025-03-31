import { ReadingListEntry, EnhancedEntry } from '../models/ReadingListEntry';
import db from './database';
import { mockReadingListEntries } from './mockData';

/**
 * リーディングリストのサービスクラス
 * Chrome API とのやり取りやデータベース操作を行う
 */
class ReadingListService {
  private isInitialized = false;
  private isDebugMode = process.env.NODE_ENV === 'development';
  
  /**
   * サービスの初期化
   * - Chrome APIの存在チェック
   * - イベントリスナーの設定
   * - 初期同期の実行
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Chrome APIが利用可能か確認
      if (typeof chrome !== 'undefined' && chrome.readingList) {
        console.log('Reading List Magazine: Chrome Reading List API available');
        
        // 初期同期を実行
        await this.syncReadingList();
        
        this.isInitialized = true;
      } else {
        console.warn('Reading List Magazine: Chrome Reading List API not available, using mock data');
        
        // デバッグモードの場合はモックデータを使用
        if (this.isDebugMode) {
          await this.importMockData();
        }
        
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize ReadingListService:', error);
    }
  }
  
  /**
   * デバッグ用モックデータをインポート
   */
  private async importMockData(): Promise<void> {
    try {
      // モックデータを使用してデータベースを初期化
      await db.entries.bulkPut(mockReadingListEntries);
      console.log('Imported mock data to database');
    } catch (error) {
      console.error('Failed to import mock data:', error);
    }
  }
  
  /**
   * Chrome APIからリーディングリストのエントリを取得
   */
  async fetchReadingList(): Promise<ReadingListEntry[]> {
    try {
      // Chrome API を使用してリーディングリストを取得
      const entries = await chrome.readingList.query({});
      
      // APIから取得したデータを変換
      return entries.map(entry => ({
        id: entry.id,
        url: entry.url,
        title: entry.title,
        addTime: entry.addTime,
        lastUpdateTime: entry.lastUpdateTime || entry.addTime,
        isRead: false // Chrome API では既読状態が提供されていないため初期値はfalse
      }));
    } catch (error) {
      console.error('Failed to fetch reading list:', error);
      
      // デバッグモードの場合はモックデータを返す
      if (this.isDebugMode) {
        return [...mockReadingListEntries];
      }
      
      return [];
    }
  }

  /**
   * すべてのエントリをデータベースから取得
   */
  async getAllEntries(): Promise<EnhancedEntry[]> {
    try {
      return await db.entries.toArray();
    } catch (error) {
      console.error('Failed to get entries from database:', error);
      return [];
    }
  }
  
  /**
   * 指定されたIDのエントリを取得
   */
  async getEntryById(id: string): Promise<EnhancedEntry | undefined> {
    try {
      return await db.entries.get(id);
    } catch (error) {
      console.error(`Failed to get entry (ID: ${id}):`, error);
      return undefined;
    }
  }

  /**
   * リーディングリストとローカルデータベースを同期
   */
  async syncReadingList(): Promise<void> {
    try {
      // Chrome APIからリーディングリストを取得
      const apiEntries = await this.fetchReadingList();
      
      // 現在のデータベースのエントリを取得
      const dbEntries = await this.getAllEntries();
      const dbEntryIds = new Set(dbEntries.map(entry => entry.id));
      
      // 新しいエントリをデータベースに追加
      const newEntries = apiEntries.filter(entry => !dbEntryIds.has(entry.id));
      
      if (newEntries.length > 0) {
        // 新しいエントリをデータベースに追加
        await db.entries.bulkAdd(newEntries);
        console.log(`Added ${newEntries.length} new entries to database`);
      }
      
      // APIに存在するエントリの情報を更新
      const existingEntries = apiEntries.filter(entry => dbEntryIds.has(entry.id));
      for (const entry of existingEntries) {
        const dbEntry = dbEntries.find(e => e.id === entry.id);
        if (dbEntry) {
          // タイトルまたはURLが変更されている場合は更新
          if (entry.title !== dbEntry.title || entry.url !== dbEntry.url) {
            await db.entries.update(entry.id, {
              title: entry.title,
              url: entry.url,
              lastUpdateTime: Date.now()
            });
          }
        }
      }
      
      // APIには存在しないがDBに存在するエントリを削除（削除されたエントリ）
      const apiEntryIds = new Set(apiEntries.map(entry => entry.id));
      const deletedEntries = dbEntries.filter(entry => !apiEntryIds.has(entry.id));
      
      if (deletedEntries.length > 0) {
        // 削除されたエントリをデータベースからも削除
        await db.entries.bulkDelete(deletedEntries.map(entry => entry.id));
        console.log(`Removed ${deletedEntries.length} deleted entries from database`);
      }
    } catch (error) {
      console.error('Failed to sync reading list:', error);
    }
  }

  /**
   * 新しいエントリをリーディングリストとデータベースに追加
   */
  async addEntry(url: string, title: string): Promise<string | null> {
    try {
      // Chrome APIを使用してリーディングリストにエントリを追加
      const id = await chrome.readingList.addEntry({ url, title });
      
      // 追加されたエントリを取得
      const entry: ReadingListEntry = {
        id,
        url,
        title,
        addTime: Date.now(),
        lastUpdateTime: Date.now(),
        isRead: false
      };
      
      // データベースに追加
      await db.entries.add(entry);
      
      return id;
    } catch (error) {
      console.error('Failed to add entry:', error);
      return null;
    }
  }

  /**
   * エントリを更新
   */
  async updateEntry(id: string, data: Partial<EnhancedEntry>): Promise<void> {
    try {
      // データベース内のエントリを更新
      await db.entries.update(id, {
        ...data,
        lastUpdateTime: Date.now()
      });
      
      // Chrome APIでも更新（タイトルとURLの変更のみサポート）
      if (data.title || data.url) {
        await chrome.readingList.updateEntry(id, {
          title: data.title,
          url: data.url
        });
      }
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  }

  /**
   * エントリの既読状態を更新
   */
  async updateReadStatus(id: string, isRead: boolean): Promise<void> {
    try {
      await db.entries.update(id, { 
        isRead,
        lastUpdateTime: Date.now() 
      });
    } catch (error) {
      console.error('Failed to update read status:', error);
    }
  }

  /**
   * エントリを削除
   */
  async deleteEntry(id: string): Promise<void> {
    try {
      // リーディングリストからエントリを削除
      await chrome.readingList.removeEntry(id);
      
      // データベースからも削除
      await db.entries.delete(id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  }
  
  /**
   * 単一エントリの追加イベントハンドラ
   */
  async handleEntryAdded(entry: chrome.readingList.ReadingListEntry): Promise<void> {
    try {
      const newEntry: ReadingListEntry = {
        id: entry.id,
        url: entry.url,
        title: entry.title,
        addTime: entry.addTime,
        lastUpdateTime: entry.lastUpdateTime || entry.addTime,
        isRead: false
      };
      
      // データベースに追加
      await db.entries.put(newEntry);
      console.log('Reading List Entry added to database:', newEntry.title);
    } catch (error) {
      console.error('Failed to handle entry added event:', error);
    }
  }
  
  /**
   * 単一エントリの削除イベントハンドラ
   */
  async handleEntryDeleted(id: string): Promise<void> {
    try {
      // データベースから削除
      await db.entries.delete(id);
      console.log('Reading List Entry deleted from database. ID:', id);
    } catch (error) {
      console.error('Failed to handle entry deleted event:', error);
    }
  }
  
  /**
   * 単一エントリの更新イベントハンドラ
   */
  async handleEntryUpdated(entry: chrome.readingList.ReadingListEntry): Promise<void> {
    try {
      // データベース内のエントリを更新
      await db.entries.update(entry.id, {
        title: entry.title,
        url: entry.url,
        lastUpdateTime: entry.lastUpdateTime || Date.now()
      });
      console.log('Reading List Entry updated in database:', entry.title);
    } catch (error) {
      console.error('Failed to handle entry updated event:', error);
    }
  }
}

export default new ReadingListService();
