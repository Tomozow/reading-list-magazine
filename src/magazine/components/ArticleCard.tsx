import React from 'react';

// Articleインターフェースのインポート
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

interface ArticleCardProps {
  article: Article;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 記事を開く処理
  const openArticle = () => {
    chrome.tabs.create({ url: article.url });
  };

  return (
    <div 
      className={`card hover:shadow-lg transition-shadow duration-300 ${
        article.isRead ? 'opacity-75' : ''
      }`}
    >
      {article.thumbnail && (
        <div className="aspect-video overflow-hidden">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
            onClick={openArticle}
          >
            {article.title}
          </h3>
          {article.isRead ? (
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              既読
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
              未読
            </span>
          )}
        </div>
        {article.excerpt && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">{article.excerpt}</p>
        )}
        <div className="flex justify-between items-center text-xs text-gray-500">
          {article.siteName && <span>{article.siteName}</span>}
          <span>{formatDate(article.dateAdded)}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
