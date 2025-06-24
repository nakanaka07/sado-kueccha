/**
 * 🚀 シンプルなプリロードサービス - Phase 2最適化版
 *
 * @description 実際に必要な機能のみに特化したプリロードシステム
 * @version 2.0.0 - 構造最適化
 */

import { isDevelopment } from '../utils/env';
import { cacheService } from './cache';

/**
 * プリロード結果の基本情報
 */
export interface PreloadResult {
  succeeded: number;
  failed: number;
  succeededPaths: string[];
  failedPaths: Array<{ path: string; error: string }>;
  totalDuration: number;
}

/**
 * Google Maps API読み込み状態
 */
export interface GoogleMapsLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * シンプルなプリロードマネージャー
 */
class SimplePreloadManager {
  private readonly googleMapsState: GoogleMapsLoadState = {
    isLoaded: false,
    isLoading: false,
  };

  /**
   * 最適化されたプリロードを開始
   */
  async startOptimizedPreload(): Promise<void> {
    const startTime = performance.now();

    try {
      // 並列でプリロードを実行
      await Promise.allSettled([
        this.preloadCriticalAssets(),
        this.preloadCriticalData(),
      ]);

      const duration = performance.now() - startTime;

      if (isDevelopment()) {
        console.warn(`✅ プリロード完了: ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      if (isDevelopment()) {
        console.warn('⚠️ プリロード失敗:', error);
      }
    }
  }

  /**
   * 重要なアセットのプリロード
   */
  private async preloadCriticalAssets(): Promise<void> {
    const criticalImages = [
      '/assets/title_row1.png',
      '/assets/title_row2.png',
      '/assets/current_location.png',
    ];

    const promises = criticalImages.map(async src => {
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            resolve();
          };
          img.onerror = () => {
            reject(new Error(`Failed to load ${src}`));
          };
          img.src = src;
        });
      } catch (error) {
        if (isDevelopment()) {
          console.warn(`画像読み込み失敗: ${src}`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 重要なデータのプリロード
   */
  private async preloadCriticalData(): Promise<void> {
    try {
      // キャッシュされたデータがあるかチェック
      const cachedData = cacheService.get('critical-pois');
      if (cachedData) {
        if (isDevelopment()) {
          console.warn('✅ キャッシュからデータ読み込み完了');
        }
        return;
      }

      // バックグラウンドでシートサービスを読み込み
      const { sheetsService } = await import('./sheets');
      const criticalPOIs = await sheetsService.fetchPOIsOptimized();

      // キャッシュに保存
      cacheService.set('critical-pois', criticalPOIs, 7200000); // 2時間

      if (isDevelopment()) {
        console.warn(`✅ 重要POIデータ読み込み完了: ${criticalPOIs.length}件`);
      }
    } catch (error) {
      if (isDevelopment()) {
        console.warn('重要データの読み込み失敗:', error);
      }
    }
  }

  /**
   * Google Maps APIの読み込み状態を取得
   */
  getGoogleMapsState(): GoogleMapsLoadState {
    return { ...this.googleMapsState };
  }

  /**
   * プリロード統計を取得
   */
  getStats() {
    return {
      googleMaps: this.googleMapsState,
      cache: cacheService.getStats(),
    };
  }
}

// シングルトンインスタンス
export const preloadManager = new SimplePreloadManager();
