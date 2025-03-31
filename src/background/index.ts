// バックグラウンドスクリプト
console.log('Reading List Magazine: Background script started');

// リーディングリストイベントリスナー
chrome.readingList.onEntryAdded.addListener((entry) => {
  console.log('Reading List Entry Added:', entry);
  // TODO: ここでデータベースに新しいエントリを追加する処理を実装
});

chrome.readingList.onEntryDeleted.addListener((id) => {
  console.log('Reading List Entry Deleted:', id);
  // TODO: ここでデータベースからエントリを削除する処理を実装
});

chrome.readingList.onEntryUpdated.addListener((entry) => {
  console.log('Reading List Entry Updated:', entry);
  // TODO: ここでデータベース内のエントリを更新する処理を実装
});

// 拡張機能インストール/更新時のハンドラー
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Reading List Magazine: Extension installed');
    // 初期設定処理
  } else if (details.reason === 'update') {
    console.log('Reading List Magazine: Extension updated');
    // 更新時の処理
  }
});

// ブラウザアクションクリック時のハンドラー（必要に応じて）
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'magazine.html' });
});
