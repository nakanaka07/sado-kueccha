/**
 * 🔄 リアクティブキャッシュシステム
 *
 * @description イベント駆動型のキャッシュ無効化と更新システム
 * @version 1.0.0 - Phase 2 最適化
 */

import { cacheService } from '../cache';

/**
 * キャッシュイベント型定義
 */
interface CacheEvent {
  type: 'invalidate' | 'update' | 'prefetch';
  key: string;
  data?: unknown;
  dependencies?: string[];
}

/**
 * キャッシュリスナー型定義
 */
type CacheListener = (event: CacheEvent) => void;

/**
 * リアクティブキャッシュクラス
 * 依存関係に基づく自動キャッシュ無効化とリアクティブな更新
 */
export class ReactiveCacheManager {
  private readonly listeners = new Map<string, Set<CacheListener>>();
  private readonly dependencies = new Map<string, Set<string>>();

  /**
   * キャッシュイベントリスナーを登録
   */
  subscribe(pattern: string, listener: CacheListener): () => void {
    if (!this.listeners.has(pattern)) {
      this.listeners.set(pattern, new Set());
    }
    const listeners = this.listeners.get(pattern);
    if (listeners) {
      listeners.add(listener);
    }

    // unsubscribe function を返す
    return () => {
      const listeners = this.listeners.get(pattern);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(pattern);
        }
      }
    };
  }

  /**
   * キャッシュ依存関係を設定
   */
  setDependency(key: string, dependsOn: string[]): void {
    this.dependencies.set(key, new Set(dependsOn));
  }

  /**
   * リアクティブにキャッシュを無効化
   */
  invalidate(key: string): void {
    // 直接無効化
    cacheService.delete(key);

    // 依存関係に基づく無効化
    this.invalidateDependents(key);

    // イベント発火
    this.emit({
      type: 'invalidate',
      key,
    });
  }

  /**
   * キャッシュを更新
   */
  update(key: string, data: unknown, ttl?: number): void {
    cacheService.set(key, data, ttl);

    this.emit({
      type: 'update',
      key,
      data,
    });
  }

  /**
   * プリフェッチ指示
   */
  prefetch(key: string, dependencies?: string[]): void {
    this.emit({
      type: 'prefetch',
      key,
      dependencies,
    });
  }

  /**
   * 依存するキーを無効化
   */
  private invalidateDependents(changedKey: string): void {
    for (const [key, deps] of this.dependencies.entries()) {
      if (deps.has(changedKey)) {
        cacheService.delete(key);
        this.invalidateDependents(key); // 連鎖的無効化
      }
    }
  }

  /**
   * イベントを発火
   */
  private emit(event: CacheEvent): void {
    for (const [pattern, listeners] of this.listeners.entries()) {
      if (this.matchPattern(event.key, pattern)) {
        for (const listener of listeners) {
          try {
            listener(event);
          } catch (error) {
            console.error('Cache listener error:', error);
          }
        }
      }
    }
  }

  /**
   * パターンマッチング（簡易版）
   */
  private matchPattern(key: string, pattern: string): boolean {
    // ワイルドカード対応（例: "poi_*" は "poi_recommended" にマッチ）
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    }
    return key === pattern;
  }
}

// シングルトンインスタンス
export const reactiveCacheManager = new ReactiveCacheManager();

/**
 * POI データのキャッシュ戦略を設定
 */
export function setupPOICacheStrategy(): void {
  // POI データの依存関係を設定
  reactiveCacheManager.setDependency('poi_all', [
    'poi_recommended',
    'poi_snack',
    'poi_parking',
    'poi_toilet',
    'poi_ryotsu_aikawa',
    'poi_kanai_sawada',
    'poi_akadomari_hamochi',
  ]);

  // シートデータの変更時にPOIキャッシュを無効化
  reactiveCacheManager.subscribe('sheet_*', event => {
    if (event.type === 'invalidate') {
      const sheetName = event.key.replace('sheet_', '');
      reactiveCacheManager.invalidate(`poi_${sheetName}`);
    }
  });

  // フィルタリング結果のキャッシュを設定
  reactiveCacheManager.setDependency('filtered_*', ['poi_all']);

  // POI データ変更時にフィルタ結果を無効化
  reactiveCacheManager.subscribe('poi_*', event => {
    if (event.type === 'invalidate' || event.type === 'update') {
      // すべてのフィルタ結果をクリア
      reactiveCacheManager.invalidate('filtered_*');
    }
  });
}
