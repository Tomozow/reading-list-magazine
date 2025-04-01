import { ReadingListEntry, EnhancedEntry, FilterOptions, SortOptions, DatabaseStats } from '../models/ReadingListEntry';
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
      await db.bulkAddEntries(mockReadingListEntries);
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
      const entries = await chrome.readingList.query({}) || [];
      
      // APIから取得したデータを変換
      return Array.isArray(entries) ? entries.map(entry => ({
        id: entry.id,
        url: entry.url,
        title: entry.title,
        addTime: entry.addTime,
        lastUpdateTime: entry.lastUpdateTime || entry.addTime,
        isRead: false // Chrome API では既読状態が提供されていないため初期値はfalse
      })) : [];
    } catch (error) {
      console.error('Failed to fetch reading list:', error);
      
      // デバッグモードの場合はモックデータを返す
      if (this.isDebugMode) {
        return [...mockReadingListEntries];
      }
      
      return [];
    }
  }