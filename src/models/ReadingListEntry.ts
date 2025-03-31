// リーディングリストエントリのインターフェース定義
export interface ReadingListEntry {
  id: string;
  url: string;
  title: string;
  addTime: number; // タイムスタンプ
  lastUpdateTime?: number;
  isRead: boolean;
}

// 拡張されたエントリのインターフェース（スクレイピングしたデータを含む）
export interface EnhancedEntry extends ReadingListEntry {
  content?: string;   // 記事の本文
  excerpt?: string;   // 記事の抜粋
  imageUrl?: string;  // サムネイル画像URL
  siteName?: string;  // サイト名
  author?: string;    // 著者名
  publishDate?: string; // 公開日
  domain?: string;    // ドメイン名（検索・フィルタリング用）
  contentExtracted?: boolean; // コンテンツが抽出済みかどうか
  lastReadTime?: number; // 最後に読んだ時間
  tags?: string[];    // タグ（将来的な機能拡張用）
}

// フィルタリングのオプションインターフェース
export interface FilterOptions {
  showRead?: boolean;
  dateRange?: [Date, Date] | null;
  domain?: string | null;
  searchTerm?: string | null;
  tags?: string[] | null; // タグによるフィルタリング
}

// ソートのオプションインターフェース
export interface SortOptions {
  field: 'addTime' | 'title' | 'lastUpdateTime' | 'lastReadTime' | 'publishDate';
  direction: 'asc' | 'desc';
}

// コンテンツ抽出オプションインターフェース
export interface ContentExtractionOptions {
  includeImages?: boolean;
  maxImageSize?: number;
  includeLinks?: boolean;
  sanitizeHtml?: boolean;
}

// データベース統計情報インターフェース
export interface DatabaseStats {
  totalEntries: number;
  readEntries: number;
  unreadEntries: number;
  averageContentLength: number;
  oldestEntryDate: number;
  newestEntryDate: number;
  totalStorageUsed: number; // バイト単位
}
