import db from '../services/database';
import { EnhancedEntry, FilterOptions, SortOptions } from '../models/ReadingListEntry';

// テスト用のサンプルデータ
const sampleEntries: EnhancedEntry[] = [
  {
    id: 'test-1',
    url: 'https://example.com/article1',
    title: 'テスト記事1',
    addTime: Date.now() - 86400000 * 7, // 1週間前
    lastUpdateTime: Date.now() - 86400000 * 5,
    isRead: false,
    siteName: 'Example Blog',
    domain: 'example.com',
    tags: ['tech', 'news']
  },
  {
    id: 'test-2',
    url: 'https://example.com/article2',
    title: 'テスト記事2',
    addTime: Date.now() - 86400000 * 5, // 5日前
    lastUpdateTime: Date.now() - 86400000 * 4,
    isRead: true,
    siteName: 'Example Blog',
    domain: 'example.com',
    lastReadTime: Date.now() - 86400000 * 3,
    contentExtracted: true,
    content: 'これはテスト記事2の内容です。',
    tags: ['design']
  },
  {
    id: 'test-3',
    url: 'https://example2.com/article3',
    title: 'テスト記事3',
    addTime: Date.now() - 86400000 * 3, // 3日前
    lastUpdateTime: Date.now() - 86400000 * 2,
    isRead: false,
    siteName: 'Another Blog',
    domain: 'example2.com',
    excerpt: 'これはテスト記事3の抜粋です。'
  }
];

describe('ReadingListDatabase', () => {
  // 各テスト前にデータベースをクリアし、サンプルデータを投入
  beforeEach(async () => {
    await db.clearDatabase();
    await db.bulkAddEntries(sampleEntries);
  });

  // すべてのテスト終了後にデータベースをクリア
  afterAll(async () => {
    await db.clearDatabase();
  });

  // 基本的なCRUD操作のテスト
  describe('基本的なCRUD操作', () => {
    it('すべてのエントリを取得できること', async () => {
      const entries = await db.getAllEntries();
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.id).sort()).toEqual(['test-1', 'test-2', 'test-3'].sort());
    });

    it('IDでエントリを取得できること', async () => {
      const entry = await db.getEntryById('test-2');
      expect(entry).toBeDefined();
      expect(entry?.title).toBe('テスト記事2');
      expect(entry?.isRead).toBe(true);
    });

    it('URLでエントリを取得できること', async () => {
      const entry = await db.getEntryByUrl('https://example.com/article1');
      expect(entry).toBeDefined();
      expect(entry?.id).toBe('test-1');
    });

    it('新しいエントリを追加できること', async () => {
      const newEntry: EnhancedEntry = {
        id: 'test-4',
        url: 'https://example3.com/article4',
        title: '新しいテスト記事',
        addTime: Date.now(),
        isRead: false,
        domain: 'example3.com'
      };

      await db.addEntry(newEntry);
      const retrievedEntry = await db.getEntryById('test-4');
      expect(retrievedEntry).toBeDefined();
      expect(retrievedEntry?.title).toBe('新しいテスト記事');
    });

    it('エントリを更新できること', async () => {
      await db.updateEntry('test-1', {
        title: '更新されたタイトル',
        isRead: true
      });

      const updatedEntry = await db.getEntryById('test-1');
      expect(updatedEntry?.title).toBe('更新されたタイトル');
      expect(updatedEntry?.isRead).toBe(true);
      expect(updatedEntry?.lastUpdateTime).toBeGreaterThan(sampleEntries[0].lastUpdateTime || 0);
    });

    it('エントリを削除できること', async () => {
      await db.deleteEntry('test-3');
      
      const deletedEntry = await db.getEntryById('test-3');
      expect(deletedEntry).toBeUndefined();
      
      const remainingEntries = await db.getAllEntries();
      expect(remainingEntries).toHaveLength(2);
    });

    it('複数のエントリを一括で削除できること', async () => {
      await db.bulkDeleteEntries(['test-1', 'test-2']);
      
      const entries = await db.getAllEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('test-3');
    });
  });

  // フィルタリングとソートのテスト
  describe('フィルタリングとソート', () => {
    it('既読/未読でフィルタリングできること', async () => {
      // 未読エントリのみ
      let options: FilterOptions = { showRead: false };
      let entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(2);
      expect(entries.every(e => !e.isRead)).toBe(true);

      // 既読エントリのみ
      options = { showRead: true };
      entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('test-2');
    });

    it('ドメインでフィルタリングできること', async () => {
      const options: FilterOptions = { domain: 'example.com' };
      const entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.domain === 'example.com')).toBe(true);
    });

    it('検索語でフィルタリングできること', async () => {
      // タイトルで検索
      let options: FilterOptions = { searchTerm: 'テスト記事2' };
      let entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('test-2');

      // 内容で検索
      options = { searchTerm: 'テスト記事2の内容' };
      entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('test-2');

      // 抜粋で検索
      options = { searchTerm: '抜粋' };
      entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('test-3');
    });

    it('タグでフィルタリングできること', async () => {
      const options: FilterOptions = { tags: ['tech'] };
      const entries = await db.getFilteredEntries(options);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('test-1');
    });

    it('追加日時でソートできること', async () => {
      // 昇順
      let sort: SortOptions = { field: 'addTime', direction: 'asc' };
      let entries = await db.getFilteredEntries({}, sort);
      expect(entries[0].id).toBe('test-1'); // 最も古い
      expect(entries[2].id).toBe('test-3'); // 最も新しい

      // 降順
      sort = { field: 'addTime', direction: 'desc' };
      entries = await db.getFilteredEntries({}, sort);
      expect(entries[0].id).toBe('test-3'); // 最も新しい
      expect(entries[2].id).toBe('test-1'); // 最も古い
    });

    it('タイトルでソートできること', async () => {
      const sort: SortOptions = { field: 'title', direction: 'asc' };
      const entries = await db.getFilteredEntries({}, sort);
      expect(entries.map(e => e.id)).toEqual(['test-1', 'test-2', 'test-3']);
    });
  });

  // 統計情報のテスト
  describe('統計情報', () => {
    it('データベース統計を取得できること', async () => {
      const stats = await db.getDatabaseStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.readEntries).toBe(1);
      expect(stats.unreadEntries).toBe(2);
      expect(stats.oldestEntryDate).toBe(sampleEntries[0].addTime);
      expect(stats.newestEntryDate).toBe(sampleEntries[2].addTime);
    });

    it('ドメイン統計を取得できること', async () => {
      const domainStats = await db.getDomainStats();
      expect(domainStats).toHaveLength(2);
      expect(domainStats[0].domain).toBe('example.com');
      expect(domainStats[0].count).toBe(2);
      expect(domainStats[1].domain).toBe('example2.com');
      expect(domainStats[1].count).toBe(1);
    });

    it('タグ統計を取得できること', async () => {
      const tagStats = await db.getTagStats();
      expect(tagStats).toHaveLength(2);
      expect(tagStats.find(t => t.tag === 'tech')?.count).toBe(1);
      expect(tagStats.find(t => t.tag === 'design')?.count).toBe(1);
    });
  });

  // マイグレーションとバージョン管理のテスト
  describe('マイグレーションとバージョン管理', () => {
    it('レガシーデータを新しいスキーマに移行できること', async () => {
      // 古いバージョン形式のサンプルデータを作成
      await db.clearDatabase();
      
      // db.entries というプロパティはテーブルなので直接アクセスできない
      // 代わりに、一旦古いエントリを追加してから更新することでテストする
      const legacyEntry: EnhancedEntry = {
        id: 'legacy-1',
        url: 'https://legacy.com/article',
        title: 'レガシー記事',
        addTime: Date.now() - 86400000 * 10,
        isRead: true
        // domain や contentExtracted は含まれていない
      };
      
      await db.addEntry(legacyEntry);
      
      // エントリを取得して適切に移行されているか確認
      const migratedEntry = await db.getEntryById('legacy-1');
      expect(migratedEntry).toBeDefined();
      expect(migratedEntry?.domain).toBe('legacy.com'); // ドメインが抽出されているか
      expect(migratedEntry?.contentExtracted).toBe(false); // contentExtracted が設定されているか
      expect(migratedEntry?.lastReadTime).toBeDefined(); // lastReadTime が設定されているか
      expect(migratedEntry?.tags).toEqual([]); // 空の tags 配列が設定されているか
    });
  });
});