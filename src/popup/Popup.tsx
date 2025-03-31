import React, { useEffect, useState } from 'react';

const Popup: React.FC = () => {
  const [readingListCount, setReadingListCount] = useState<number>(0);

  useEffect(() => {
    // 拡張機能の初期化コードはここに記述
    const fetchReadingListCount = async () => {
      try {
        // TODO: 実際のリーディングリスト件数を取得する実装
        setReadingListCount(10); // 仮の値
      } catch (error) {
        console.error('Error fetching reading list:', error);
      }
    };

    fetchReadingListCount();
  }, []);

  const openMagazineView = () => {
    chrome.tabs.create({ url: 'magazine.html' });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-72 p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-blue-600">Reading List Magazine</h1>
      </div>
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm">
          リーディングリストに <span className="font-bold">{readingListCount}</span> 件の記事があります
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={openMagazineView}
          className="btn w-full flex items-center justify-center"
        >
          マガジンビューを開く
        </button>
        <button
          onClick={openOptions}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          設定
        </button>
      </div>
    </div>
  );
};

export default Popup;
