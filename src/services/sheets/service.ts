/**
 * 🏗️ Google Sheets メインサービス
 *
 * @description sheets.ts の統合されたAPI - 高レベルなサービス層
 * @version 1.1.0 - Phase 2 最適化版（Worker統合、リアクティブキャッシュ）
 */

import type { POI } from '../../types';
import { cacheService } from '../cache';
import { SheetsApiClient } from './client';
import { CACHE_TTL, LOAD_STRATEGIES } from './config';
import { SheetsDataConverter } from './converter';
import { performanceLogger } from './performance';
import { reactiveCacheManager, setupPOICacheStrategy } from './reactive-cache';
import { SheetsApiError } from './types';
import { workerAdapter } from './worker-adapter';

/**
 * セマフォア（同時実行数制限）ユーティリティ
 */
class Semaphore {
  private permits: number;
  private readonly waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const nextResolve = this.waitQueue.shift();
      if (nextResolve) {
        this.permits--;
        nextResolve();
      }
    }
  }
}

/**
 * Google Sheets サービスのメインクラス
 * 外部API、データ変換、キャッシュ、パフォーマンス監視を統合
 * Phase 2: Worker統合、リアクティブキャッシュ、高度な最適化
 */
export class GoogleSheetsService {
  private readonly apiClient: SheetsApiClient;
  private readonly dataConverter: SheetsDataConverter;
  private cacheInitialized = false;

  constructor() {
    this.apiClient = new SheetsApiClient();
    this.dataConverter = new SheetsDataConverter();
    this.initializeAdvancedFeatures();
  }

  /**
   * Phase 2 高度機能の初期化
   */
  private initializeAdvancedFeatures(): void {
    if (this.cacheInitialized) return;

    // リアクティブキャッシュ戦略を設定
    setupPOICacheStrategy();
    this.cacheInitialized = true;
  }

  /**
   * 指定されたシートからPOIデータを取得
   * 統合されたキャッシュ・エラーハンドリング・パフォーマンス監視付き
   * Phase 2: Worker統合、リアクティブキャッシュ対応
   */
  async fetchPOIData(
    sheetName: string,
    options: {
      useCache?: boolean;
      skipInvalid?: boolean;
      maxRetries?: number;
      useWorker?: boolean;
    } = {}
  ): Promise<POI[]> {
    const {
      useCache = true,
      skipInvalid = true,
      maxRetries = 3,
      useWorker = true,
    } = options;

    return performanceLogger.logOperation(
      `fetchPOIData-${sheetName}`,
      async () => {
        // キャッシュチェック
        if (useCache) {
          const cacheKey = `poi_${sheetName}`;
          const cachedPOIs = cacheService.get(cacheKey);
          if (cachedPOIs && Array.isArray(cachedPOIs)) {
            return cachedPOIs as POI[];
          }
        }

        // リトライ機能付きでデータ取得
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const rawData = await this.apiClient.fetchSheetData(sheetName);

            // Phase 2: Worker統合による非同期データ変換
            let poiData: POI[];
            if (useWorker && rawData.length > 50) {
              // 大きなデータセットの場合はWorkerを使用
              try {
                poiData = await workerAdapter.convertToPOIsAsync(
                  rawData,
                  sheetName
                );
                performanceLogger.recordCacheHit(); // Worker使用をカウント
              } catch (_workerError) {
                // Workerが失敗した場合はメインスレッドでフォールバック
                poiData = await this.dataConverter.convertToPOI(
                  sheetName,
                  rawData,
                  { skipInvalid }
                );
                performanceLogger.recordCacheMiss();
              }
            } else {
              // 小さなデータセット、またはWorker無効時はメインスレッドで実行
              poiData = await this.dataConverter.convertToPOI(
                sheetName,
                rawData,
                { skipInvalid }
              );
            }

            // Phase 2: リアクティブキャッシュに保存
            if (useCache && poiData.length > 0) {
              const cacheKey = `poi_${sheetName}`;
              reactiveCacheManager.update(cacheKey, poiData, CACHE_TTL.LONG);
            }

            return poiData;
          } catch (error) {
            lastError =
              error instanceof Error ? error : new Error('Unknown error');

            if (attempt < maxRetries) {
              // 指数バックオフでリトライ
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
        }

        throw new SheetsApiError(
          `${maxRetries}回の試行後にデータ取得に失敗: ${lastError?.message}`,
          undefined,
          `シート: ${sheetName}`
        );
      },
      { sheetName, useCache, skipInvalid, maxRetries }
    );
  }

  /**
   * 全シートからPOIデータを一括取得
   * 並列処理でパフォーマンス最適化
   */
  async fetchAllPOIData(
    options: {
      concurrency?: number;
      useCache?: boolean;
      skipInvalid?: boolean;
    } = {}
  ): Promise<Record<string, POI[]>> {
    const { concurrency = 3, useCache = true, skipInvalid = true } = options;
    const sheetConfigs = LOAD_STRATEGIES.map(strategy => ({
      name: strategy.sheetName,
      gid: '', // GIDは必要に応じて設定
    }));

    return performanceLogger.logOperation(
      'fetchAllPOIData',
      async () => {
        const results: Record<string, POI[]> = {};

        // 並列処理でシートデータを取得（同時実行数制限付き）
        const semaphore = new Semaphore(concurrency);

        const promises = sheetConfigs.map(async config => {
          await semaphore.acquire();
          try {
            const poiData = await this.fetchPOIData(config.name, {
              useCache,
              skipInvalid,
            });
            results[config.name] = poiData;
          } finally {
            semaphore.release();
          }
        });

        await Promise.all(promises);
        return results;
      },
      { sheetCount: sheetConfigs.length, concurrency }
    );
  }

  /**
   * データ品質レポートの生成
   */
  async generateDataQualityReport(): Promise<{
    sheets: Record<string, unknown>;
    summary: {
      totalSheets: number;
      totalPOIs: number;
      averageSuccessRate: number;
      issues: string[];
    };
  }> {
    return performanceLogger.logOperation(
      'generateDataQualityReport',
      async () => {
        const sheetConfigs = LOAD_STRATEGIES.map(strategy => ({
          name: strategy.sheetName,
          gid: '', // GIDは必要に応じて設定
        }));
        const reports: Record<string, unknown> = {};
        let totalPOIs = 0;
        let totalSuccessRate = 0;
        const allIssues: string[] = [];

        for (const config of sheetConfigs) {
          try {
            const rawData = await this.apiClient.fetchSheetData(config.name);
            const poiData = await this.dataConverter.convertToPOI(
              config.name,
              rawData,
              { skipInvalid: true }
            );

            const report = this.dataConverter.generateQualityReport(
              rawData,
              poiData
            );

            reports[config.name] = report;
            totalPOIs += report.validRows;
            totalSuccessRate += report.successRate;
            allIssues.push(
              ...report.issues.map(issue => `${config.name}: ${issue}`)
            );
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : 'Unknown error';
            reports[config.name] = {
              error: errorMsg,
              totalRows: 0,
              validRows: 0,
              successRate: 0,
              issues: [errorMsg],
            };
            allIssues.push(`${config.name}: ${errorMsg}`);
          }
        }

        return {
          sheets: reports,
          summary: {
            totalSheets: sheetConfigs.length,
            totalPOIs,
            averageSuccessRate:
              sheetConfigs.length > 0
                ? totalSuccessRate / sheetConfigs.length
                : 0,
            issues: allIssues,
          },
        };
      }
    );
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    const sheetConfigs = LOAD_STRATEGIES.map(strategy => ({
      name: strategy.sheetName,
      gid: '', // GIDは必要に応じて設定
    }));
    for (const config of sheetConfigs) {
      cacheService.delete(`sheet_${config.name}_A1:Z1000`);
      cacheService.delete(`poi_${config.name}`);
    }
  }

  /**
   * サービス統計情報の取得
   */
  getStatistics(): {
    performance: unknown;
    cache: unknown;
    sheets: unknown;
  } {
    return {
      performance: performanceLogger.getStats(),
      cache: cacheService.getStats() ?? {},
      sheets: {
        configuredSheets: LOAD_STRATEGIES.length,
      },
    };
  }
}

// デフォルトエクスポート（後方互換性のため）
export const googleSheetsService = new GoogleSheetsService();
