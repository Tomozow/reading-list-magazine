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
}

// フィルタリングのオプションインターフェース
export interface FilterOptions {
  showRead?: boolean;
  dateRange?: [Date, Date] | null;
  domain?: string | null;
  searchTerm?: string | null;
}

// ソートのオプションインターフェース
export interface SortOptions {
  field: 'addTime' | 'title' | 'lastUpdateTime';
  direction: 'asc' | 'desc';
}
