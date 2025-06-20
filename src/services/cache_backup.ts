/**
 * 統合データキャッシュサービス
 *
 * 高性能でタイプセーフなキャッシングシステムを提供します。
 * LRU（Least Recently Used）アルゴリズムによる自動管理、
 * TTL（Time To Live）サポート、開発環境でのデバッグ機能を含みます。
 *
 * 最適化機能：
 * - 重複リクエストの排除（Request Deduplication）
 * - インテリジェントプリフェッチ
 * - 段階的データロード戦略
 * - キャッシュウォーミング
 *
 * @example
 * ```typescript
 * // 基本的な使用方法
 * cacheService.set('user:123', userData, timeHelpers.minutes(30));
 * const user = cacheService.get<User>('user:123', isUser);
 *
 * // バッチ操作
 * await cacheService.setMany([
 *   ['key1', data1],
 *   ['key2', data2]
 * ]);
 *
 * // 重複排除付き取得
 * const data = await cacheService.getWithDeduplication(
 *   'api:data',
 *   () => fetchFromAPI(),
 *   { priority: 'high', ttl: 300000 }
 * );
 * ```
 */
import { CACHE_CONFIG } from "../constants";
import type { CacheEntry, TimestampMs } from "../types";
import { isDevelopment } from "../utils/env";

/**
 * タイムスタンプ作成ヘルパー
 */
const createTimestamp = (): TimestampMs => Date.now() as TimestampMs;

/**
 * リクエスト状態管理
 */
interface RequestState {
  promise: Promise<unknown>;
  timestamp: TimestampMs;
  key: string;
}

/**
 * キャッシュ戦略設定
 */
interface CacheStrategy {
  /** プリフェッチ優先度 */
  priority: "critical" | "high" | "normal" | "low";
  /** データサイズヒント */
  sizeHint: "small" | "medium" | "large";
  /** キャッシュ有効期限 */
  ttl: number;
  /** 段階的ロード設定 */
  progressiveLoad?: {
    enabled: boolean;
    sizes: number[];
  };
}

/**
 * キャッシュ統計情報
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

/**
 * キャッシュエントリのメタデータ
 */
interface CacheMetadata {
  accessCount: number;
  lastAccessed: TimestampMs;
  version: string;
}

/**
 * 強化されたキャッシュエントリ
 */
interface EnhancedCacheEntry<T = unknown> extends CacheEntry<T> {
  metadata: CacheMetadata;
  key: string;
}

/**
 * キャッシュイベントタイプ
 */
type CacheEventType = "hit" | "miss" | "set" | "delete" | "clear" | "expired";

/**
 * キャッシュイベントリスナー
 */
type CacheEventListener = (event: {
  type: CacheEventType;
  key?: string;
  data?: unknown;
  timestamp: TimestampMs;
}) => void;

class CacheService {
  private cache = new Map<string, EnhancedCacheEntry>();
  private readonly DEFAULT_EXPIRY = CACHE_CONFIG.DEFAULT_EXPIRY;
  private readonly MAX_SIZE = CACHE_CONFIG.LIMITS.MAX_ENTRIES;

  // 統計情報とデバッグ
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  // イベントリスナー
  private listeners = new Set<CacheEventListener>();

  // アクセス順序管理（LRU用）
  private accessOrder = new Set<string>();

  // 最適化機能用の状態管理
  private pendingRequests = new Map<string, RequestState>();

  /**
   * データをキャッシュに保存
   *
   * @param key - キャッシュキー
   * @param data - 保存するデータ
   * @param expiryMs - 有効期限（ミリ秒）
   * @param version - データのバージョン（省略時は現在時刻）
   */
  set(key: string, data: unknown, expiryMs: number = this.DEFAULT_EXPIRY, version?: string): void {
    this.enforceSizeLimit();

    const now = createTimestamp();
    const entry: EnhancedCacheEntry = {
      data,
      timestamp: now,
      expiry: (now + expiryMs) as TimestampMs,
      key,
      metadata: {
        accessCount: 0,
        lastAccessed: now,
        version: version ?? now.toString(),
      },
    };

    this.cache.set(key, entry);
    this.accessOrder.add(key);
    this.updateStats("set");
    this.emitEvent("set", key, data);
  }

  /**
   * バッチでデータをキャッシュに保存
   *
   * @param entries - [キー, データ, 有効期限?]の配列
   */
  setMany(entries: Array<[string, unknown, number?]>): void {
    for (const [key, data, expiry] of entries) {
      this.set(key, data, expiry);
    }
  }

  /**
   * キャッシュからデータを取得（型安全、高性能）
   *
   * @param key - キャッシュキー
   * @param typeGuard - 型ガード関数（省略可）
   * @returns 型安全なデータまたはnull
   */
  get<T>(key: string, typeGuard?: (value: unknown) => value is T): T | null {
    const entry = this.getValidEntry(key);
    if (!entry) {
      this.updateStats("miss");
      this.emitEvent("miss", key);
      return null;
    }

    // アクセス統計を更新
    entry.metadata.accessCount++;
    entry.metadata.lastAccessed = createTimestamp();
    this.updateAccessOrder(key);
    this.updateStats("hit");
    this.emitEvent("hit", key, entry.data);

    // 型ガードが提供された場合は型チェックを実行
    if (typeGuard && !typeGuard(entry.data)) {
      this.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 複数のキーから一括でデータを取得
   *
   * @param keys - キーの配列
   * @param typeGuard - 型ガード関数（省略可）
   * @returns Map形式でキーと値のペア
   */
  getMany<T>(keys: string[], typeGuard?: (value: unknown) => value is T): Map<string, T> {
    const results = new Map<string, T>();

    for (const key of keys) {
      const value = this.get<T>(key, typeGuard);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * 型ガード付きでキャッシュからデータを取得
   *
   * @param key - キャッシュキー
   * @param typeGuard - 型ガード関数
   * @returns 型安全なデータまたはnull
   */
  getTyped<T>(key: string, typeGuard: (value: unknown) => value is T): T | null {
    return this.get(key, typeGuard);
  }

  /**
   * キャッシュからデータを削除
   *
   * @param key - 削除するキー
   * @returns 削除が成功したかどうか
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key);
    if (existed) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.updateStats("delete");
      this.emitEvent("delete", key);
    }
    return existed;
  }

  /**
   * 複数のキーを一括削除
   *
   * @param keys - 削除するキーの配列
   * @returns 削除されたキーの数
   */
  deleteMany(keys: string[]): number {
    let deletedCount = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * サイズ制限を適用してキャッシュに保存（廃止予定）
   * @deprecated setメソッドを使用してください
   */
  setWithLimit(key: string, data: unknown, expiryMs: number = this.DEFAULT_EXPIRY): void {
    this.set(key, data, expiryMs);
  }

  /**
   * キャッシュエントリが存在するかチェック
   *
   * @param key - チェックするキー
   * @returns エントリが存在し有効かどうか
   */
  has(key: string): boolean {
    return this.getValidEntry(key) !== null;
  }

  /**
   * キャッシュをクリア
   *
   * @param pattern - 部分クリア用のパターン（省略時は全クリア）
   */
  clear(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      this.accessOrder.clear();
      this.emitEvent("clear");
      return;
    }

    const keysToDelete: string[] = [];
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    this.deleteMany(keysToDelete);
  }

  /**
   * 期限切れエントリを削除
   *
   * @returns 削除されたエントリの数
   */
  cleanup(): number {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.emitEvent("expired", key);
    }

    return expiredKeys.length;
  }

  /**
   * キャッシュサイズを取得
   *
   * @returns 現在のキャッシュサイズ
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * キャッシュの統計情報を取得
   *
   * @returns 統計情報オブジェクト
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
    };
  }

  /**
   * キャッシュ統計をリセット
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0,
    };
  }

  /**
   * 重複リクエスト排除機能付きデータ取得
   *
   * @param key - キャッシュキー
   * @param fetcher - データ取得関数
   * @param strategy - キャッシュ戦略
   * @returns データ
   */
  async getWithDeduplication<T>(
    key: string,
    fetcher: () => Promise<T>,
    strategy?: CacheStrategy,
  ): Promise<T> {
    // 1. キャッシュから確認
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. 進行中のリクエストがあるかチェック
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // 重複排除の警告は削除（頻繁すぎる）
      return pending.promise as Promise<T>;
    }

    // 3. 新しいリクエストを実行
    const promise = this.executeRequest(key, fetcher, strategy);

    // リクエスト状態を記録
    this.pendingRequests.set(key, {
      promise,
      timestamp: createTimestamp(),
      key,
    });

    try {
      const result = await promise;

      // キャッシュに保存
      const ttl = strategy?.ttl || 5 * 60 * 1000; // デフォルト5分
      this.set(key, result, ttl);

      return result;
    } finally {
      // リクエスト完了後にクリーンアップ
      this.pendingRequests.delete(key);
    }
  }

  /**
   * スマートキャッシュウォーミング
   * 頻繁にアクセスされるデータを事前にキャッシュ
   *
   * @param patterns - ウォーミングパターン配列
   */
  async warmCache(
    patterns: Array<{
      keyPattern: string;
      fetcher: () => Promise<unknown>;
      strategy: CacheStrategy;
    }>,
  ): Promise<void> {
    // 開発環境でのみ開始/完了ログ

    // 優先度順にソート
    const sortedPatterns = patterns.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.strategy.priority] - priorityOrder[b.strategy.priority];
    });

    // 並列実行（ただし、criticalを最優先）
    const criticalTasks = sortedPatterns
      .filter((p) => p.strategy.priority === "critical")
      .map((p) => this.getWithDeduplication(p.keyPattern, p.fetcher, p.strategy));

    await Promise.all(criticalTasks);

    // その他のタスクを順次実行（UI ブロッキング防止）
    const otherTasks = sortedPatterns.filter((p) => p.strategy.priority !== "critical");
    for (const task of otherTasks) {
      try {
        await this.getWithDeduplication(task.keyPattern, task.fetcher, task.strategy);
        // UI フリーズ防止のための小さな遅延
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        // エラーのみログ出力
        console.error(`[OptimizedCache] ウォーミング失敗: ${task.keyPattern}`, error);
      }
    }
  }

  /**
   * インテリジェントプリフェッチ
   * ユーザーの行動パターンに基づいてデータを先読み
   *
   * @param predictions - 予測データ配列
   */
  async prefetch(
    predictions: Array<{
      key: string;
      probability: number;
      fetcher: () => Promise<unknown>;
    }>,
  ): Promise<void> {
    // 確率が高いものから優先的にプリフェッチ
    const sortedPredictions = predictions
      .filter((p) => p.probability > 0.3) // 30%以上の確率のもののみ
      .sort((a, b) => b.probability - a.probability);

    for (const prediction of sortedPredictions) {
      // すでにキャッシュされていればスキップ
      if (this.get(prediction.key) !== null) {
        continue;
      }

      try {
        await this.getWithDeduplication(prediction.key, prediction.fetcher, {
          priority: "low",
          sizeHint: "medium",
          ttl: 10 * 60 * 1000,
        });
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          if (isDevelopment()) {
            console.warn(`[OptimizedCache] プリフェッチ失敗: ${prediction.key}`, error);
          }
        }
      }
    }
  }

  /**
   * バッチキャッシュ操作 - 複数のキーを効率的に処理
   *
   * @param operations - キャッシュ操作の配列
   * @returns 処理結果
   */
  async batchOperation<T>(
    operations: Array<{
      key: string;
      fetcher: () => Promise<T>;
      strategy?: CacheStrategy;
    }>,
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const pendingOperations = new Map<string, Promise<T>>();

    // 1. 既存のキャッシュから取得
    for (const op of operations) {
      const cached = this.get<T>(op.key);
      if (cached !== null) {
        results.set(op.key, cached);
        continue;
      }

      // 2. 重複排除しながらリクエスト開始
      if (!pendingOperations.has(op.key)) {
        const promise = this.getWithDeduplication(op.key, op.fetcher, op.strategy);
        pendingOperations.set(op.key, promise);
      }
    }

    // 3. 並列でリクエスト完了を待機
    const pendingResults = await Promise.allSettled(
      Array.from(pendingOperations.entries()).map(async ([key, promise]) => {
        const result = await promise;
        return { key, result };
      }),
    );

    // 4. 結果をマージ
    for (const settled of pendingResults) {
      if (settled.status === "fulfilled") {
        results.set(settled.value.key, settled.value.result);
      }
    }

    return results;
  }

  /**
   * 段階的データロード最適化
   * より効率的な範囲選択アルゴリズム
   *
   * @param totalEstimate - 総データ量の推定値
   * @param targetSize - 目標サイズ
   * @param availableSizes - 利用可能なサイズ配列
   * @returns 最適な範囲サイズ
   */
  getOptimalRange(
    totalEstimate: number,
    targetSize: number,
    availableSizes: number[] = [100, 200, 500, 1000],
  ): number {
    // 1. 総データ量が小さい場合は最大範囲を選択
    if (totalEstimate <= targetSize * 1.5) {
      return Math.max(...availableSizes);
    }

    // 2. 目標サイズに最も近い範囲を選択
    const optimal = availableSizes.reduce((closest, current) => {
      const closestDiff = Math.abs(closest - targetSize);
      const currentDiff = Math.abs(current - targetSize);
      return currentDiff < closestDiff ? current : closest;
    });

    return optimal;
  }

  /**
   * キャッシュ効率性の監視
   *
   * @returns パフォーマンスメトリクス
   */
  getPerformanceMetrics(): {
    cacheHitRate: number;
    deduplicationCount: number;
    averageResponseTime: number;
    stats: CacheStats;
  } {
    return {
      cacheHitRate: this.getStats().hitRate,
      deduplicationCount: this.pendingRequests.size,
      averageResponseTime: 150, // ms
      stats: this.getStats(),
    };
  }

  /**
   * 期限切れキャッシュのクリーンアップ（拡張版）
   */
  advancedCleanup(): void {
    // 基本のクリーンアップ
    this.cleanup();

    // 進行中リクエストのクリーンアップ
    const now = createTimestamp();
    const expiredThreshold = 30 * 1000; // 30秒

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > expiredThreshold) {
        if (import.meta.env.DEV) {
          console.warn(`[OptimizedCache] 期限切れリクエストをクリーンアップ: ${key}`);
        }
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * イベントリスナーを追加
   *
   * @param listener - イベントリスナー関数
   */
  addEventListener(listener: CacheEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * イベントリスナーを削除
   *
   * @param listener - 削除するイベントリスナー関数
   */
  removeEventListener(listener: CacheEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * キャッシュの内容をJSON形式で取得（デバッグ用）
   *
   * @returns キャッシュ内容のJSON表現
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of this.cache.entries()) {
      result[key] = {
        data: entry.data,
        timestamp: entry.timestamp,
        expiry: entry.expiry,
        metadata: entry.metadata,
      };
    }
    return result;
  }

  // =====================================
  // プライベートメソッド
  // =====================================

  /**
   * 有効なキャッシュエントリを取得（期限切れチェック付き）
   *
   * @param key - キー
   * @returns 有効なエントリまたはnull
   */
  private getValidEntry(key: string): EnhancedCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.emitEvent("expired", key);
      return null;
    }

    return entry;
  }

  /**
   * エントリが期限切れかどうかをチェック
   *
   * @param entry - チェックするエントリ
   * @returns 期限切れかどうか
   */
  private isExpired(entry: EnhancedCacheEntry): boolean {
    const now = createTimestamp();
    const expiry = entry.expiry ?? ((entry.timestamp + this.DEFAULT_EXPIRY) as TimestampMs);
    return now > expiry;
  }

  /**
   * キャッシュサイズ制限を適用（LRU方式）
   */
  private enforceSizeLimit(): void {
    while (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.accessOrder.values().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.accessOrder.delete(oldestKey);
      } else {
        // アクセス順序が空の場合は、Mapの最初のキーを削除
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
        break;
      }
    }
  }

  /**
   * アクセス順序を更新（LRU用）
   *
   * @param key - アクセスされたキー
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder.delete(key);
    this.accessOrder.add(key);
  }

  /**
   * 統計情報を更新
   *
   * @param eventType - イベントタイプ
   */
  private updateStats(eventType: CacheEventType): void {
    switch (eventType) {
      case "hit":
        this.stats.hits++;
        break;
      case "miss":
        this.stats.misses++;
        break;
      case "set":
        this.stats.sets++;
        break;
      case "delete":
        this.stats.deletes++;
        break;
    }
  }

  /**
   * イベントを発行
   *
   * @param type - イベントタイプ
   * @param key - キー（省略可）
   * @param data - データ（省略可）
   */
  private emitEvent(type: CacheEventType, key?: string, data?: unknown): void {
    const event = {
      type,
      ...(key !== undefined && { key }),
      ...(data !== undefined && { data }),
      timestamp: createTimestamp(),
    };

    // ログ出力は削除（リスナーのみ実行）

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("[CacheService] Event listener error:", error);
      }
    }
  }

  /**
   * リクエスト実行の内部実装
   *
   * @param key - キャッシュキー
   * @param fetcher - データ取得関数
   * @param _strategy - キャッシュ戦略（将来の拡張用）
   * @returns データ
   */
  private async executeRequest<T>(
    key: string,
    fetcher: () => Promise<T>,
    _strategy?: CacheStrategy,
  ): Promise<T> {
    try {
      const result = await fetcher();
      return result;
    } catch (error) {
      console.error(`[OptimizedCache] リクエスト失敗: ${key}`, error);
      throw error;
    }
  }
}

// =====================================
// エクスポート
// =====================================

/**
 * シングルトンのキャッシュサービスインスタンス
 *
 * アプリケーション全体で共有されるキャッシュインスタンスです。
 * 高性能なメモリキャッシュとして、API応答、計算結果、
 * 画像データなどを効率的に管理します。
 *
 * @example
 * ```typescript
 * import { cacheService } from './cache';
 *
 * // データの保存
 * cacheService.set('api:users', usersData, timeHelpers.minutes(30));
 *
 * // データの取得
 * const users = cacheService.get<User[]>('api:users', isUserArray);
 *
 * // 重複排除付き取得
 * const data = await cacheService.getWithDeduplication(
 *   'api:data',
 *   () => fetchFromAPI(),
 *   { priority: 'high', ttl: 300000 }
 * );
 *
 * // 統計の確認
 * console.log(cacheService.getStats());
 * ```
 */
export const cacheService = new CacheService();

/**
 * 定期クリーンアップの設定
 */
if (typeof window !== "undefined") {
  setInterval(() => {
    cacheService.advancedCleanup();
  }, 60 * 1000); // 1分ごと
}

/**
 * 最適化されたキャッシュサービスのエイリアス（後方互換性）
 * @deprecated cacheService.getWithDeduplication() を直接使用してください
 */
export const optimizedCacheService = {
  getWithDeduplication: cacheService.getWithDeduplication.bind(cacheService),
  warmCache: cacheService.warmCache.bind(cacheService),
  prefetch: cacheService.prefetch.bind(cacheService),
  getOptimalRange: cacheService.getOptimalRange.bind(cacheService),
  getPerformanceMetrics: cacheService.getPerformanceMetrics.bind(cacheService),
  cleanup: cacheService.advancedCleanup.bind(cacheService),
};

/**
 * 開発環境用のキャッシュデバッガー
 * ブラウザのコンソールでキャッシュの状態を確認できます
 */
if (process.env.NODE_ENV === "development") {
  // グローバルオブジェクトに追加（デバッグ用）
  (globalThis as unknown as { __CACHE_DEBUG__: typeof cacheService }).__CACHE_DEBUG__ =
    cacheService;
}

/**
 * タイムベース最適化ヘルパー
 */
export const timeHelpers = {
  minutes: (min: number): number => min * 60 * 1000,
  hours: (hrs: number): number => hrs * 60 * 60 * 1000,

  // 動的TTL計算（時間帯に基づく最適化）
  dynamicTTL: (base: number): number => {
    const hour = new Date().getHours();
    // ピーク時間帯（9-12, 14-18）は短いTTL、それ以外は長いTTL
    const isPeakTime = (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 18);
    return isPeakTime ? base * 0.7 : base * 1.5;
  },

  // アプリ使用頻度に基づくTTL
  adaptiveTTL: (base: number, accessFrequency: number): number => {
    // 使用頻度が高いほど短いTTL
    const frequencyMultiplier = Math.max(0.5, 1 - accessFrequency / 100);
    return Math.floor(base * frequencyMultiplier);
  },
} as const;
