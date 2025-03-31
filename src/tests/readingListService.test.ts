import readingListService from '../services/readingListService';
import db from '../services/database';
import { EnhancedEntry } from '../models/ReadingListEntry';

// モック設定
jest.mock('../services/database', () => ({
  getAllEntries: jest.fn(),
  getEntryById: jest.fn(),
  getEntryByUrl: jest.fn(),
  getFilteredEntries: jest.fn(),
  addEntry: jest.fn(),
  bulkAddEntries: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  bulkDeleteEntries: jest.fn(),
  getDatabaseStats: jest.fn(),
  clearDatabase: jest.fn()
}));

describe('ReadingListService', () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
  });

  describe('初期化と同期', () => {
    it('サービスが正常に初期化されること', async () => {
      // Chrome APIが利用可能な場合のモック設定
      chrome.readingList.query.mockResolvedValueOnce([
        { id: 'chrome-1', url: 'https://example.com', title: 'Example', addTime: Date.now() }
      ]);

      await readingListService.initialize();
      expect(chrome.readingList.query).toHaveBeenCalled();
      expect(db.bulkAddEntries).toHaveBeenCalled();
    });

    it('リーディングリストとデータベースが同期されること', async () => {
      // モックデータの設定
      const apiEntries = [
        { id: 'chrome-1', url: 'https://example.com/1', title: 'Example 1', addTime: Date.now() },
        { id: 'chrome-2', url: 'https://example.com/2', title: 'Example 2', addTime: Date.now() }
      ];
      const dbEntries = [
        { id: 'chrome-1', url: 'https://example.com/1', title: 'Old Title', addTime: Date.now() - 1000, isRead: true },
        { id: 'chrome-3', url: 'https://example.com/3', title: 'Example 3', addTime: Date.now() - 2000, isRead: false }
      ];

      // モックの設定
      chrome.readingList.query.mockResolvedValueOnce(apiEntries);
      (db.getAllEntries as jest.MockedFunction<typeof db.getAllEntries>).mockResolvedValueOnce(dbEntries);

      await readingListService.syncReadingList();

      // 新しいエントリの追加を確認
      expect(db.bulkAddEntries).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'chrome-2' })
        ])
      );

      // 既存エントリの更新を確認
      expect(db.updateEntry).toHaveBeenCalledWith('chrome-1', expect.any(Object));

      // 削除されたエントリの削除を確認
      expect(db.bulkDeleteEntries).toHaveBeenCalledWith(['chrome-3']);
    });
  });

  describe('基本的なAPIアクセス', () => {
    it('すべてのエントリを取得できること', async () => {
      const mockEntries = [
        { id: 'entry-1', url: 'https://example.com/1', title: 'Example 1', addTime: Date.now(), isRead: false },
        { id: 'entry-2', url: 'https://example.com/2', title: 'Example 2', addTime: Date.now(), isRead: true }
      ];
      (db.getAllEntries as jest.MockedFunction<typeof db.getAllEntries>).mockResolvedValueOnce(mockEntries);

      const entries = await readingListService.getAllEntries();
      expect(entries).toEqual(mockEntries);
      expect(db.getAllEntries).toHaveBeenCalled();
    });

    it('IDでエントリを取得できること', async () => {
      const mockEntry = { id: 'entry-1', url: 'https://example.com', title: 'Example', addTime: Date.now(), isRead: false };
      (db.getEntryById as jest.MockedFunction<typeof db.getEntryById>).mockResolvedValueOnce(mockEntry);

      const entry = await readingListService.getEntryById('entry-1');
      expect(entry).toEqual(mockEntry);
      expect(db.getEntryById).toHaveBeenCalledWith('entry-1');
    });

    it('フィルターを適用してエントリを取得できること', async () => {
      const mockEntries = [
        { id: 'entry-1', url: 'https://example.com/1', title: 'Example 1', addTime: Date.now(), isRead: false }
      ];
      (db.getFilteredEntries as jest.MockedFunction<typeof db.getFilteredEntries>).mockResolvedValueOnce(mockEntries);

      const options = { showRead: false };
      const sort = { field: 'addTime', direction: 'desc' };
      const entries = await readingListService.getFilteredEntries(options, sort);
      expect(entries).toEqual(mockEntries);
      expect(db.getFilteredEntries).toHaveBeenCalledWith(options, sort);
    });
  });

  describe('エントリ管理', () => {
    it('新しいエントリを追加できること', async () => {
      const url = 'https://example.com/new';
      const title = '新しい記事';
      const entryId = 'new-id';

      chrome.readingList.addEntry.mockResolvedValueOnce(entryId);
      (db.addEntry as jest.MockedFunction<typeof db.addEntry>).mockResolvedValueOnce(entryId);

      const result = await readingListService.addEntry(url, title);
      expect(result).toBe(entryId);
      expect(chrome.readingList.addEntry).toHaveBeenCalledWith({ url, title });
      expect(db.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: entryId,
          url,
          title,
          isRead: false
        })
      );
    });

    it('エントリを更新できること', async () => {
      const id = 'entry-1';
      const changes = { title: '更新されたタイトル', url: 'https://example.com/updated' };

      await readingListService.updateEntry(id, changes);
      expect(db.updateEntry).toHaveBeenCalledWith(id, changes);
      expect(chrome.readingList.updateEntry).toHaveBeenCalledWith(id, changes);
    });

    it('既読状態を更新できること', async () => {
      const id = 'entry-1';
      const isRead = true;

      await readingListService.updateReadStatus(id, isRead);
      expect(db.updateEntry).toHaveBeenCalledWith(id, expect.objectContaining({
        isRead,
        lastUpdateTime: expect.any(Number),
        lastReadTime: expect.any(Number)
      }));
    });

    it('エントリを削除できること', async () => {
      const id = 'entry-1';

      await readingListService.deleteEntry(id);
      expect(chrome.readingList.removeEntry).toHaveBeenCalledWith(id);
      expect(db.deleteEntry).toHaveBeenCalledWith(id);
    });
  });

  describe('イベントハンドリング', () => {
    it('エントリ追加イベントを処理できること', async () => {
      const entry = { 
        id: 'event-1', 
        url: 'https://example.com/event', 
        title: 'Event Entry', 
        addTime: Date.now(),
        lastUpdateTime: Date.now()
      };

      await readingListService.handleEntryAdded(entry);
      expect(db.addEntry).toHaveBeenCalledWith(expect.objectContaining({
        id: entry.id,
        url: entry.url,
        title: entry.title
      }));
    });

    it('エントリ削除イベントを処理できること', async () => {
      const id = 'event-1';

      await readingListService.handleEntryDeleted(id);
      expect(db.deleteEntry).toHaveBeenCalledWith(id);
    });

    it('エントリ更新イベントを処理できること', async () => {
      const entry = { 
        id: 'event-1', 
        url: 'https://example.com/updated', 
        title: 'Updated Entry', 
        addTime: Date.now(),
        lastUpdateTime: Date.now()
      };

      await readingListService.handleEntryUpdated(entry);
      expect(db.updateEntry).toHaveBeenCalledWith(entry.id, expect.objectContaining({
        title: entry.title,
        url: entry.url
      }));
    });
  });

  describe('タグ管理', () => {
    it('エントリのタグを更新できること', async () => {
      const id = 'entry-1';
      const tags = ['tech', 'tutorial', 'javascript'];

      await readingListService.updateTags(id, tags);
      expect(db.updateEntry).toHaveBeenCalledWith(id, { tags });
    });
  });

  describe('統計情報', () => {
    it('データベースの統計情報を取得できること', async () => {
      const mockStats = {
        totalEntries: 10,
        readEntries: 3,
        unreadEntries: 7,
        averageContentLength: 500,
        oldestEntryDate: Date.now() - 86400000 * 30,
        newestEntryDate: Date.now(),
        totalStorageUsed: 1024 * 100
      };
      
      (db.getDatabaseStats as jest.MockedFunction<typeof db.getDatabaseStats>).mockResolvedValueOnce(mockStats);
      
      const stats = await readingListService.getDatabaseStats();
      expect(stats).toEqual(mockStats);
      expect(db.getDatabaseStats).toHaveBeenCalled();
    });
  });
});