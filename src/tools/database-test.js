/**
 * データベース機能の動作確認用のスクリプト
 * 
 * 使用方法:
 * 1. 拡張機能のデバッグモードを有効にする
 * 2. 拡張機能のバックグラウンドページのDevToolsを開く
 * 3. このスクリプトをコンソールに貼り付けて実行
 */

// テストデータ
const testEntries = [
  {
    id: 'test-1',
    url: 'https://example.com/article1',
    title: 'テスト記事1',
    addTime: Date.now() - 86400000 * 7, // 1週間前
    lastUpdateTime: Date.now() - 86400000 * 5,
    isRead: false,
    siteName: 'Example Blog',
    domain: 'example.com',
    tags: ['tech', 'news']
  },
  {
    id: 'test-2',
    url: 'https://example.com/article2',
    title: 'テスト記事2',
    addTime: Date.now() - 86400000 * 5, // 5日前
    lastUpdateTime: Date.now() - 86400000 * 4,
    isRead: true,
    siteName: 'Example Blog',
    domain: 'example.com',
    lastReadTime: Date.now() - 86400000 * 3,
    contentExtracted: true,
    content: 'これはテスト記事2の内容です。',
    tags: ['design']
  },
  {
    id: 'test-3',
    url: 'https://example2.com/article3',
    title: 'テスト記事3',
    addTime: Date.now() - 86400000 * 3, // 3日前
    lastUpdateTime: Date.now() - 86400000 * 2,
    isRead: false,
    siteName: 'Another Blog',
    domain: 'example2.com',
    excerpt: 'これはテスト記事3の抜粋です。'
  }
];

// データベーステスト用のメソッド
async function testDatabase() {
  try {
    // データベースにアクセス
    if (!window.db) {
      console.error('データベースにアクセスできません。バックグラウンドページで実行してください。');
      return;
    }
    
    console.log('==== データベーステスト開始 ====');
    
    // 既存データの確認
    console.log('初期データ確認中...');
    const initialEntries = await window.db.getAllEntries();
    console.log(`初期エントリ数: ${initialEntries.length}`);
    
    // データベースのクリア
    console.log('データベースをクリア中...');
    await window.db.clearDatabase();
    
    // テストデータの挿入
    console.log('テストデータ挿入中...');
    await window.db.bulkAddEntries(testEntries);
    const countAfterAdd = await window.db.getEntryCount();
    console.log(`挿入後のエントリ数: ${countAfterAdd}`);
    
    if (countAfterAdd !== testEntries.length) {
      console.error('データ挿入エラー: 期待したエントリ数と一致しません。');
      return;
    }
    
    // データの取得テスト
    console.log('データ取得テスト...');
    const allEntries = await window.db.getAllEntries();
    console.log('全エントリ:', allEntries);
    
    // IDによる取得テスト
    const entryById = await window.db.getEntryById('test-2');
    console.log('ID "test-2" のエントリ:', entryById);
    
    // URLによる取得テスト
    const entryByUrl = await window.db.getEntryByUrl('https://example.com/article1');
    console.log('URL "https://example.com/article1" のエントリ:', entryByUrl);
    
    // フィルタリングテスト
    console.log('フィルタリングテスト...');
    
    // 未読エントリのフィルタリング
    const unreadEntries = await window.db.getFilteredEntries({ showRead: false });
    console.log('未読エントリ:', unreadEntries);
    
    // ドメインによるフィルタリング
    const domainEntries = await window.db.getFilteredEntries({ domain: 'example.com' });
    console.log('example.comのエントリ:', domainEntries);
    
    // 検索によるフィルタリング
    const searchEntries = await window.db.getFilteredEntries({ searchTerm: 'テスト記事2' });
    console.log('「テスト記事2」を含むエントリ:', searchEntries);
    
    // タグによるフィルタリング
    const tagEntries = await window.db.getFilteredEntries({ tags: ['tech'] });
    console.log('「tech」タグのエントリ:', tagEntries);
    
    // エントリ更新テスト
    console.log('エントリ更新テスト...');
    await window.db.updateEntry('test-1', {
      title: '更新されたタイトル',
      isRead: true,
      tags: ['tech', 'updated']
    });
    
    const updatedEntry = await window.db.getEntryById('test-1');
    console.log('更新後のエントリ:', updatedEntry);
    
    // 統計情報テスト
    console.log('統計情報テスト...');
    const stats = await window.db.getDatabaseStats();
    console.log('データベース統計:', stats);
    
    const domainStats = await window.db.getDomainStats();
    console.log('ドメイン統計:', domainStats);
    
    const tagStats = await window.db.getTagStats();
    console.log('タグ統計:', tagStats);
    
    // エントリ削除テスト
    console.log('エントリ削除テスト...');
    await window.db.deleteEntry('test-3');
    
    const remainingEntries = await window.db.getAllEntries();
    console.log('削除後のエントリ数:', remainingEntries.length);
    
    // 一括削除のテスト
    console.log('一括削除テスト...');
    await window.db.bulkDeleteEntries(['test-1', 'test-2']);
    
    const finalEntries = await window.db.getAllEntries();
    console.log('最終エントリ数:', finalEntries.length);
    
    // 元のデータを復元
    if (initialEntries.length > 0) {
      console.log('元のデータを復元中...');
      await window.db.bulkAddEntries(initialEntries);
      const restoredCount = await window.db.getEntryCount();
      console.log(`復元後のエントリ数: ${restoredCount}`);
    }
    
    console.log('==== データベーステスト完了 ====');
    return { success: true };
  } catch (error) {
    console.error('データベーステスト中にエラーが発生しました:', error);
    return { success: false, error };
  }
}

// パフォーマンステスト用のメソッド
async function testDatabasePerformance(entryCount = 100) {
  try {
    if (!window.db) {
      console.error('データベースにアクセスできません。バックグラウンドページで実行してください。');
      return;
    }
    
    console.log(`==== データベースパフォーマンステスト (${entryCount}件) 開始 ====`);
    
    // テスト前にデータベースをクリア
    await window.db.clearDatabase();
    
    // 大量のテストデータを生成
    const bulkTestEntries = [];
    const startTime = Date.now();
    
    for (let i = 0; i < entryCount; i++) {
      bulkTestEntries.push({
        id: `perf-${i}`,
        url: `https://example.com/article${i}`,
        title: `パフォーマンステスト記事 ${i}`,
        addTime: startTime - (Math.random() * 86400000 * 30),
        isRead: Math.random() > 0.5,
        domain: `example${i % 10}.com`,
        tags: i % 5 === 0 ? ['performance', 'test'] : (i % 3 === 0 ? ['test'] : [])
      });
    }
    
    // 一括挿入パフォーマンス測定
    console.log('一括挿入テスト...');
    const insertStartTime = performance.now();
    await window.db.bulkAddEntries(bulkTestEntries);
    const insertEndTime = performance.now();
    const insertTime = insertEndTime - insertStartTime;
    console.log(`${entryCount}件のエントリ挿入時間: ${insertTime.toFixed(2)}ms (平均: ${(insertTime / entryCount).toFixed(2)}ms/エントリ)`);
    
    // 全件取得パフォーマンス測定
    console.log('全件取得テスト...');
    const getAllStartTime = performance.now();
    const allEntries = await window.db.getAllEntries();
    const getAllEndTime = performance.now();
    const getAllTime = getAllEndTime - getAllStartTime;
    console.log(`${allEntries.length}件のエントリ取得時間: ${getAllTime.toFixed(2)}ms`);
    
    // フィルタリングパフォーマンス測定
    console.log('フィルタリングテスト...');
    const filterStartTime = performance.now();
    const filteredEntries = await window.db.getFilteredEntries({ domain: 'example5.com' });
    const filterEndTime = performance.now();
    const filterTime = filterEndTime - filterStartTime;
    console.log(`ドメインフィルタリング時間: ${filterTime.toFixed(2)}ms (${filteredEntries.length}件)`);
    
    // 検索パフォーマンス測定
    console.log('検索テスト...');
    const searchStartTime = performance.now();
    const searchEntries = await window.db.getFilteredEntries({ searchTerm: 'パフォーマンス' });
    const searchEndTime = performance.now();
    const searchTime = searchEndTime - searchStartTime;
    console.log(`検索時間: ${searchTime.toFixed(2)}ms (${searchEntries.length}件)`);
    
    // 統計情報パフォーマンス測定
    console.log('統計情報取得テスト...');
    const statsStartTime = performance.now();
    const stats = await window.db.getDatabaseStats();
    const statsEndTime = performance.now();
    const statsTime = statsEndTime - statsStartTime;
    console.log(`統計情報取得時間: ${statsTime.toFixed(2)}ms`);
    
    // クリーンアップ
    console.log('クリーンアップ中...');
    await window.db.clearDatabase();
    
    console.log('==== データベースパフォーマンステスト完了 ====');
    return {
      success: true,
      results: {
        insertTime,
        getAllTime,
        filterTime,
        searchTime,
        statsTime,
        entryCount
      }
    };
  } catch (error) {
    console.error('パフォーマンステスト中にエラーが発生しました:', error);
    return { success: false, error };
  }
}

// データベースマイグレーションのテスト
async function testDatabaseMigration() {
  try {
    if (!window.db) {
      console.error('データベースにアクセスできません。バックグラウンドページで実行してください。');
      return;
    }
    
    console.log('==== データベースマイグレーションテスト開始 ====');
    
    // 古いバージョン形式のエントリを作成
    await window.db.clearDatabase();
    
    const legacyEntry = {
      id: 'legacy-1',
      url: 'https://legacy.com/article',
      title: 'レガシー記事',
      addTime: Date.now() - 86400000 * 10,
      isRead: true
      // domain や contentExtracted は含まれていない
    };
    
    console.log('レガシーエントリの追加...');
    await window.db.addEntry(legacyEntry);
    
    // エントリを取得して適切に移行されているか確認
    console.log('マイグレーション結果の確認...');
    const migratedEntry = await window.db.getEntryById('legacy-1');
    console.log('移行後のエントリ:', migratedEntry);
    
    // 検証
    const checks = [
      { name: 'ドメイン抽出', result: !!migratedEntry.domain },
      { name: 'contentExtracted設定', result: migratedEntry.contentExtracted === false },
      { name: 'lastReadTime設定', result: !!migratedEntry.lastReadTime },
      { name: 'tags配列設定', result: Array.isArray(migratedEntry.tags) }
    ];
    
    console.log('検証結果:');
    checks.forEach(check => {
      console.log(`- ${check.name}: ${check.result ? '成功' : '失敗'}`);
    });
    
    // クリーンアップ
    await window.db.clearDatabase();
    
    console.log('==== データベースマイグレーションテスト完了 ====');
    return { success: true, checks };
  } catch (error) {
    console.error('マイグレーションテスト中にエラーが発生しました:', error);
    return { success: false, error };
  }
}

// 使用例
console.log('データベーステストツールが読み込まれました。');
console.log('以下のコマンドで各テストを実行できます:');
console.log('- testDatabase() - 基本的なデータベース機能のテスト');
console.log('- testDatabasePerformance(100) - パフォーマンステスト (引数はエントリ数)');
console.log('- testDatabaseMigration() - マイグレーション機能のテスト');
