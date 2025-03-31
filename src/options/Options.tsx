import React from 'react';

const Options: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Reading List Magazine - 設定</h1>
          <p className="text-gray-600 mt-2">
            拡張機能の設定をカスタマイズできます
          </p>
        </header>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">一般設定</h2>
          <div className="space-y-4">
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>ブラウザ起動時にマガジンビューを自動で開く</span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>リーディングリストの変更を自動同期する</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">表示設定</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2">テーマ</label>
              <select className="w-full p-2 border rounded">
                <option>ライトモード</option>
                <option>ダークモード</option>
                <option>システム設定に合わせる</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">データ管理</h2>
          <div className="space-y-4">
            <button className="btn bg-red-500 hover:bg-red-600">
              キャッシュをクリア
            </button>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          Reading List Magazine v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Options;
