import { EnhancedEntry } from '../models/ReadingListEntry';

/**
 * ウェブページからコンテンツを抽出するサービス
 */
class ContentExtractionService {
  /**
   * 指定されたURLからコンテンツを抽出する
   * @param url 抽出対象のURL
   */
  async extractContent(url: string): Promise<Partial<EnhancedEntry>> {
    try {
      // 新しいタブでURLを開いてコンテンツを抽出（テスト用）
      const tab = await chrome.tabs.create({ url, active: false });
      
      // タブが完全に読み込まれるまで待機
      await new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve(undefined);
          }
        });
      });
      
      // コンテンツスクリプトにメッセージを送信してコンテンツを抽出
      const response = await chrome.tabs.sendMessage(tab.id as number, { action: 'extractContent' });
      
      // タブを閉じる
      await chrome.tabs.remove(tab.id as number);
      
      if (response && response.success) {
        return {
          title: response.data.title,
          excerpt: response.data.excerpt,
          content: response.data.content,
          // 他の抽出データ（画像URL、著者名など）
        };
      }
      
      throw new Error('Content extraction failed');
    } catch (error) {
      console.error('Failed to extract content:', error);
      return {};
    }
  }
  
  /**
   * URLからドメイン名を抽出
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      console.error('Failed to extract domain:', error);
      return '';
    }
  }
}

export default new ContentExtractionService();
