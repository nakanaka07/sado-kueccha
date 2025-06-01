// 統合データキャッシュサービス
import { CACHE_CONFIG } from "../constants";
import type { CacheEntry } from "../types/common";

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_EXPIRY = CACHE_CONFIG.DEFAULT_EXPIRY;
  private readonly MAX_SIZE = CACHE_CONFIG.MAX_ENTRIES;
  set(key: string, data: unknown, expiryMs: number = this.DEFAULT_EXPIRY): void {
    // サイズ制限チェック
    this.enforceSize();

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    this.cache.set(key, entry);
  }

  private enforceSize(): void {
    if (this.cache.size >= this.MAX_SIZE) {
      // 最古のエントリを削除（LRU方式）
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  get(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const expiry = entry.expiry ?? this.DEFAULT_EXPIRY;
    if (now - entry.timestamp > expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // 型安全な取得メソッド（型ガード付き）
  getTyped<T>(key: string, typeGuard: (value: unknown) => value is T): T | null {
    const value = this.get(key);
    if (value === null || value === undefined) {
      return null;
    }

    if (typeGuard(value)) {
      return value;
    }

    // 型が一致しない場合はキャッシュから削除
    this.cache.delete(key);
    return null;
  }

  // キャッシュクリア
  clear(): void {
    this.cache.clear();
  }

  // キャッシュサイズ制限付きセット
  setWithLimit(key: string, data: unknown, expiryMs?: number, maxSize: number = 10): void {
    if (this.cache.size >= maxSize) {
      // 最古のエントリを削除
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.set(key, data, expiryMs);
  }

  // キャッシュサイズ取得
  size(): number {
    return this.cache.size;
  }

  // キャッシュエントリ存在確認
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    const now = Date.now();
    const expiry = entry.expiry ?? this.DEFAULT_EXPIRY;
    if (now - entry.timestamp > expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const cacheService = new CacheService();
