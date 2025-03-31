import React, { useState } from 'react';
import ArticleCard from './components/ArticleCard';

// 仮のデータモデル
interface Article {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  excerpt?: string;
  dateAdded: string;
  siteName?: string;
  isRead: boolean;
}

const Magazine: React.FC = () => {
  // 仮のデータ
  const [articles] = useState<Article[]>([
    {
      id: '1',
      title: 'Reactでの効率的な状態管理テクニック',
      url: 'https://example.com/react-state-management',
      thumbnail: 'https://via.placeholder.com/300x200',
      excerpt: 'Reactアプリケーションでの効率的な状態管理について解説します。Redux、Context API、Zustandなどの比較も...',
      dateAdded: '2025-03-30T12:00:00Z',
      siteName: 'React Dev Blog',
      isRead: false
    },
    {
      id: '2',
      title: 'TypeScriptの進化: 5.0の新機能まとめ',
      url: 'https://example.com/typescript-5-features',
      thumbnail: 'https://via.placeholder.com/300x200',
      excerpt: 'TypeScript 5.0がリリースされ、多くの新機能が追加されました。このバージョンでの主な変更点と...',
      dateAdded: '2025-03-29T10:30:00Z',
      siteName: 'TS Weekly',
      isRead: true
    },
    {
      id: '3',
      title: 'Chrome拡張機能開発のベストプラクティス',
      url: 'https://example.com/chrome-extension-best-practices',
      thumbnail: 'https://via.placeholder.com/300x200',
      excerpt: 'Chrome拡張機能を開発する際のベストプラクティスやTips、実装パターンについて解説します...',
      dateAdded: '2025-03-28T15:45:00Z',
      siteName: 'Chrome Developer Blog',
      isRead: false
    }
  ]);

  // 検索クエリ状態
  const [searchQuery, setSearchQuery] = useState('');

  // 検索処理
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // 検索結果フィルタリング
  const filteredArticles = articles.filter(article => 
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600">Reading List Magazine</h1>
            <div className="w-full max-w-md ml-4">
              <input
                type="text"
                placeholder="記事を検索..."
                className="w-full p-2 border rounded-md"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">
            すべての記事 ({filteredArticles.length})
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
              日付順
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
              未読のみ
            </button>
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">記事が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Magazine;