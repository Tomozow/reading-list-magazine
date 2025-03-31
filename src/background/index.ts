// バックグラウンドスクリプト
import readingListService from '../services/readingListService';
import { mockChromeReadingListAPI } from '../services/mockData';

console.log('Reading List Magazine: Background script started');

// デバッグモードの場合は必要に応じてモックを初期化
if (process.env.NODE_ENV === 'development') {
  mockChromeReadingListAPI();
}

// ReadingListServiceの初期化
(async () => {
  try {
    await readingListService.initialize();
    console.log('Reading List Magazine: Service initialized');
  } catch (error) {
    console.error('Reading List Magazine: Service initialization failed', error);
  }
})();

// リーディングリストイベントリスナー
chrome.readingList.onEntryAdded.addListener(async (entry) => {
  console.log('Reading List Entry Added:', entry);
  await readingListService.handleEntryAdded(entry);
});

chrome.readingList.onEntryDeleted.addListener(async (id) => {
  console.log('Reading List Entry Deleted:', id);
  await readingListService.handleEntryDeleted(id);
});

chrome.readingList.onEntryUpdated.addListener(async (entry) => {
  console.log('Reading List Entry Updated:', entry);
  await readingListService.handleEntryUpdated(entry);
});

// 拡張機能インストール/更新時のハンドラー
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Reading List Magazine: Extension installed');
    
    // 初期設定処理
    await readingListService.initialize();
    await readingListService.syncReadingList();
    
  } else if (details.reason === 'update') {
    console.log('Reading List Magazine: Extension updated');
    
    // 更新時の処理
    await readingListService.initialize();
    await readingListService.syncReadingList();
  }
});

// ブラウザアクションクリック時のハンドラー
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'magazine.html' });
});

// 定期的な同期処理（オプション）
const SYNC_INTERVAL_MINUTES = 30;
setInterval(async () => {
  console.log('Running periodic sync...');
  await readingListService.syncReadingList();
}, SYNC_INTERVAL_MINUTES * 60 * 1000);

// メッセージハンドラー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncReadingList') {
    // 同期リクエストの処理
    readingListService.syncReadingList()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // sendResponseを非同期で使用するために必要
  }
  
  if (request.action === 'addEntry') {
    // エントリ追加リクエストの処理
    const { url, title } = request;
    readingListService.addEntry(url, title)
      .then((id) => sendResponse({ success: true, id }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'deleteEntry') {
    // エントリ削除リクエストの処理
    const { id } = request;
    readingListService.deleteEntry(id)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'updateReadStatus') {
    // 既読状態更新リクエストの処理
    const { id, isRead } = request;
    readingListService.updateReadStatus(id, isRead)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
