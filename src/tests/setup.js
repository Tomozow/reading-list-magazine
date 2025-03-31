// Mock indexedDB
require('fake-indexeddb/auto');

// Jest内でESMをCommonJSとして扱うためのワークアラウンド
jest.mock('dexie', () => {
  const actualDexie = jest.requireActual('dexie');
  return {
    __esModule: true,
    default: actualDexie.Dexie,
    ...actualDexie
  };
});

// Mock chrome API
global.chrome = {
  readingList: {
    query: jest.fn().mockResolvedValue([]),
    addEntry: jest.fn().mockImplementation(({url, title}) => Promise.resolve(`mock-${Date.now()}`)),
    removeEntry: jest.fn().mockResolvedValue(undefined),
    updateEntry: jest.fn().mockResolvedValue(undefined),
    onEntryAdded: {
      addListener: jest.fn()
    },
    onEntryDeleted: {
      addListener: jest.fn()
    },
    onEntryUpdated: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined)
    }
  },
  tabs: {
    create: jest.fn().mockResolvedValue({ id: 123 })
  }
};

// Mock window.URL
global.URL.createObjectURL = jest.fn();

// メモリリーク対策のためJestのテストエンバイロンメントをカスタマイズ
jest.setTimeout(10000); // タイムアウト時間を増やす
