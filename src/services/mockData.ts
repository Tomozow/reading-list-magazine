import { ReadingListEntry } from '../models/ReadingListEntry';

// デバッグ用モックデータ
export const mockReadingListEntries: ReadingListEntry[] = [
  {
    id: 'mock-1',
    url: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference',
    title: 'JavaScript リファレンス | MDN',
    addTime: Date.now() - 86400000 * 7, // 1週間前
    isRead: false
  },
  {
    id: 'mock-2',
    url: 'https://reactjs.org/docs/getting-started.html',
    title: 'Getting Started – React',
    addTime: Date.now() - 86400000 * 5, // 5日前
    isRead: true
  },
  {
    id: 'mock-3',
    url: 'https://tailwindcss.com/docs',
    title: 'Documentation - Tailwind CSS',
    addTime: Date.now() - 86400000 * 3, // 3日前
    isRead: false
  },
  {
    id: 'mock-4',
    url: 'https://www.typescriptlang.org/docs/',
    title: 'TypeScript Documentation',
    addTime: Date.now() - 86400000 * 2, // 2日前
    isRead: false
  },
  {
    id: 'mock-5',
    url: 'https://dexie.org/docs/Tutorial/Getting-started',
    title: 'Dexie.js - Getting started',
    addTime: Date.now() - 86400000, // 1日前
    isRead: false
  }
];

// Chrome APIがない環境でもテストできるようにモック関数を提供
export const mockChromeReadingListAPI = () => {
  if (typeof chrome === 'undefined' || !chrome.readingList) {
    const listeners = {
      onEntryAdded: [] as Function[],
      onEntryDeleted: [] as Function[],
      onEntryUpdated: [] as Function[]
    };

    // @ts-ignore - chromeオブジェクトのモック化
    window.chrome = window.chrome || {};
    // @ts-ignore - readingListのモック実装
    chrome.readingList = {
      query: () => Promise.resolve([...mockReadingListEntries]),
      addEntry: (params: { url: string, title: string }) => {
        const newEntry = {
          id: `mock-${Date.now()}`,
          url: params.url,
          title: params.title,
          addTime: Date.now(),
          isRead: false
        };
        mockReadingListEntries.push(newEntry);
        listeners.onEntryAdded.forEach(callback => callback(newEntry));
        return Promise.resolve(newEntry.id);
      },
      removeEntry: (id: string) => {
        const index = mockReadingListEntries.findIndex(entry => entry.id === id);
        if (index !== -1) {
          mockReadingListEntries.splice(index, 1);
          listeners.onEntryDeleted.forEach(callback => callback(id));
        }
        return Promise.resolve();
      },
      updateEntry: (id: string, params: { title?: string, url?: string }) => {
        const entry = mockReadingListEntries.find(entry => entry.id === id);
        if (entry) {
          if (params.title) entry.title = params.title;
          if (params.url) entry.url = params.url;
          listeners.onEntryUpdated.forEach(callback => callback(entry));
        }
        return Promise.resolve();
      },
      onEntryAdded: {
        addListener: (callback: Function) => {
          listeners.onEntryAdded.push(callback);
        }
      },
      onEntryDeleted: {
        addListener: (callback: Function) => {
          listeners.onEntryDeleted.push(callback);
        }
      },
      onEntryUpdated: {
        addListener: (callback: Function) => {
          listeners.onEntryUpdated.push(callback);
        }
      }
    };

    console.log('Chrome Reading List API mocked for development');
  }
};

// DEBUG環境でのみモックを自動的に適用
if (process.env.NODE_ENV === 'development') {
  mockChromeReadingListAPI();
}
