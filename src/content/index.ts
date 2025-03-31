// コンテンツスクリプト
console.log('Reading List Magazine: Content script loaded');

// 必要に応じてページ内のコンテンツを抽出するための処理をここに実装
// 例：Readabilityを使用した記事コンテンツの抽出など

// メッセージリスナー（バックグラウンドスクリプトからのメッセージを処理）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractContent') {
    console.log('Extracting content from page');
    
    // TODO: ページコンテンツの抽出処理
    // 実際の実装では、@mozilla/readability ライブラリを使用して
    // ページの本文、タイトル、主要画像などを抽出する
    
    const pageData = {
      title: document.title,
      url: window.location.href,
      content: 'ページコンテンツのプレースホルダー',
      excerpt: 'ページの抜粋のプレースホルダー'
    };
    
    sendResponse({ success: true, data: pageData });
    return true; // 非同期レスポンスを示すためにtrueを返す
  }
});
