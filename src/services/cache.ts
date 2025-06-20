/**
 * シンプルなキャッシュサービス
 * LRU（Least Recently Used）アルゴリズムによる基本的なキャッシング機能を提供
 */
import { CACHE_CONFIG } from "../constants";
import type { TimestampMs } from "../types";
import { isDevelopment } from "../utils/env";

/**
 * タイムスタンプ作成ヘルパー
 */
const createTimestamp = (): TimestampMs => Date.now() as TimestampMs;

/**
 * 基本的なキャッシュエントリ
 */
interface SimpleCacheEntry {
  key: string;
  data: unknown;
  timestamp: TimestampMs;
  lastAccessed: TimestampMs;
  ttl?: number;
}

/**
 * シンプルなキャッシュサービス
 */
class CacheService {
  private cache = new Map<string, SimpleCacheEntry>();
  private readonly maxSize: number;

  constructor() {
    this.maxSize = CACHE_CONFIG.MEMORY.MAX_SIZE;
  }

  /**
   * キャッシュからデータを取得
   */
  get<T>(key: string, validator?: (value: unknown) => value is T): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // TTL チェック
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    // アクセス時刻を更新
    entry.lastAccessed = createTimestamp();
    
    if (validator && !validator(entry.data)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * キャッシュにデータを保存
   */
  set(key: string, data: unknown, ttl?: number): void {
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = createTimestamp();
    const entry: SimpleCacheEntry = {
      key,
      data,
      timestamp: now,
      lastAccessed: now,
      ttl: ttl || CACHE_CONFIG.MEMORY.TTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * キャッシュから削除
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
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
   * エントリが期限切れかチェック
   */
  private isExpired(entry: SimpleCacheEntry): boolean {
    if (!entry.ttl) return false;
    return createTimestamp() - entry.timestamp > entry.ttl;
  }

  /**
   * LRU に基づいて最も古いエントリを削除
   */
  private evictLRU(): void {
    let oldestKey = "";
    let oldestTime = createTimestamp();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 統計情報を取得（開発環境のみ）
   */
  getStats() {
    if (!isDevelopment()) return null;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// シングルトンインスタンス
export const cacheService = new CacheService();
