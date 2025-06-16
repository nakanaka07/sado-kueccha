// 統合データキャッシュサービス
import { CACHE_CONFIG } from "../constants";
import type { CacheEntry } from "../types/common";

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_EXPIRY = CACHE_CONFIG.DEFAULT_EXPIRY;
  private readonly MAX_SIZE = CACHE_CONFIG.MAX_ENTRIES;

  /**
   * データをキャッシュに保存
   */
  set(key: string, data: unknown, expiryMs: number = this.DEFAULT_EXPIRY): void {
    this.enforceSizeLimit();

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    this.cache.set(key, entry);
  }

  /**
   * キャッシュからデータを取得（型安全）
   */
  get<T>(key: string, typeGuard?: (value: unknown) => value is T): T | null {
    const entry = this.getValidEntry(key);
    if (!entry) {
      return null;
    }

    // 型ガードが提供された場合は型チェックを実行
    if (typeGuard && !typeGuard(entry.data)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 型ガード付きでキャッシュからデータを取得
   */
  getTyped<T>(key: string, typeGuard: (value: unknown) => value is T): T | null {
    return this.get(key, typeGuard);
  }

  /**
   * サイズ制限を適用してキャッシュに保存
   */
  setWithLimit(key: string, data: unknown, expiryMs: number = this.DEFAULT_EXPIRY): void {
    this.set(key, data, expiryMs);
  }

  /**
   * キャッシュエントリが存在するかチェック
   */
  has(key: string): boolean {
    return this.getValidEntry(key) !== null;
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * キャッシュサイズを取得
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 有効なキャッシュエントリを取得（期限切れチェック付き）
   */
  private getValidEntry(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * エントリが期限切れかどうかをチェック
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const expiry = entry.expiry ?? this.DEFAULT_EXPIRY;
    return now - entry.timestamp > expiry;
  }

  /**
   * キャッシュサイズ制限を適用（LRU方式）
   */
  private enforceSizeLimit(): void {
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }
}

export const cacheService = new CacheService();
