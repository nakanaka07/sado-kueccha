// データキャッシュサービス
interface CacheEntry {
  data: unknown;
  timestamp: number;
  expiry: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_EXPIRY = 15 * 60 * 1000; // 15分間に延長（パフォーマンス向上）

  set(key: string, data: unknown, expiryMs: number = this.DEFAULT_EXPIRY): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    this.cache.set(key, entry);
  }
  get(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.expiry) {
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

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const cacheService = new CacheService();
