/**
 * パフォーマンス最適化：懐疑的ローディング戦略
 *
 * @description
 * - Critical First: 重要なデータを最優先
 * - Progressive Loading: 段階的なデータ読み込み
 * - Smart Caching: インテリジェントなキャッシュ戦略
 */

import { CACHE_CONFIG } from '../constants';
import { cacheService } from '../services/cache';
import type { POI } from '../types';
import { isDevelopment } from './env';

export interface ProgressiveLoadingState {
  phase: 'initial' | 'critical' | 'secondary' | 'complete';
  progress: number;
  totalItems: number;
  loadedItems: number;
  error?: string;
}

export class ProgressiveDataLoader {
  private state: ProgressiveLoadingState = {
    phase: 'initial',
    progress: 0,
    totalItems: 0,
    loadedItems: 0,
  };

  private readonly listeners = new Set<
    (state: ProgressiveLoadingState) => void
  >();

  /**
   * 段階的データローディング
   */
  async loadData(): Promise<POI[]> {
    this.updateState({ phase: 'initial', progress: 0 });

    try {
      // Phase 1: Critical data (推奨スポット)
      this.updateState({ phase: 'critical', progress: 10 });
      const criticalData = await this.loadCriticalData();
      this.updateState({ progress: 40, loadedItems: criticalData.length });

      // Phase 2: Secondary data (その他のスポット)
      this.updateState({ phase: 'secondary', progress: 50 });
      const secondaryData = await this.loadSecondaryData();

      // Merge data
      const allData = [...criticalData, ...secondaryData];
      this.updateState({
        phase: 'complete',
        progress: 100,
        totalItems: allData.length,
        loadedItems: allData.length,
      });

      return allData;
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0,
      });
      throw error;
    }
  }

  /**
   * Critical data (推奨スポット) を優先読み込み
   */
  private async loadCriticalData(): Promise<POI[]> {
    const cacheKey = 'critical_pois';
    const cached = cacheService.get<POI[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Import services dynamically to avoid initial bundle bloat
    const { sheetsService } = await import('../services/sheets');

    try {
      const recommendedRows = await sheetsService.fetchSheetData(
        'recommended',
        'AB2:AX100'
      );
      const snackRows = await sheetsService.fetchSheetData('snack', 'AB2:AX50');

      // Convert to POI (simplified for critical path)
      const criticalPOIs: POI[] = [];

      // Process recommended first
      for (const [index, row] of recommendedRows.entries()) {
        const poi = this.convertRowToPOI(row, `rec-${index}`, 'recommended');
        if (poi) criticalPOIs.push(poi);
      }

      // Add popular snack spots
      for (const [index, row] of snackRows.slice(0, 10).entries()) {
        const poi = this.convertRowToPOI(row, `snack-${index}`, 'snack');
        if (poi) criticalPOIs.push(poi);
      }

      // Cache with longer TTL for critical data
      cacheService.set(cacheKey, criticalPOIs, CACHE_CONFIG.TTL.SHEETS * 2);

      return criticalPOIs;
    } catch (error) {
      if (isDevelopment()) {
        console.warn(
          'Critical data loading failed, falling back to cache:',
          error
        );
      }
      return [];
    }
  }

  /**
   * Secondary data (その他のスポット) を遅延読み込み
   */
  private async loadSecondaryData(): Promise<POI[]> {
    const cacheKey = 'secondary_pois';
    const cached = cacheService.get<POI[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Load remaining data in background
    const { sheetsService } = await import('../services/sheets');

    try {
      const secondarySheets = [
        'parking',
        'toilet',
        'akadomari_hamochi',
        'kanai_sawada',
        'ryotsu_aikawa',
      ];
      const secondaryPOIs: POI[] = [];

      // Process in smaller batches to avoid blocking
      for (const sheetName of secondarySheets) {
        try {
          const rows = await sheetsService.fetchSheetData(
            sheetName,
            'AB2:AX200'
          );

          for (const [index, row] of rows.entries()) {
            const poi = this.convertRowToPOI(
              row,
              `${sheetName}-${index}`,
              sheetName
            );
            if (poi) secondaryPOIs.push(poi);

            // Yield control periodically
            if (index % 20 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
            }
          }
        } catch (error) {
          if (isDevelopment()) {
            console.warn(`Failed to load ${sheetName}:`, error);
          }
        }
      }

      cacheService.set(cacheKey, secondaryPOIs, CACHE_CONFIG.TTL.SHEETS);
      return secondaryPOIs;
    } catch (error) {
      if (isDevelopment()) {
        console.warn('Secondary data loading failed:', error);
      }
      return [];
    }
  }

  /**
   * Simplified POI conversion for performance
   */
  private convertRowToPOI(
    row: string[],
    id: string,
    sourceSheet: string
  ): POI | null {
    try {
      const name = row[0]?.trim();
      const coordinates = row[1]?.trim();

      if (!name || !coordinates) return null;

      const [lngStr, latStr] = coordinates.split(',');
      const lng = Number(lngStr?.trim());
      const lat = Number(latStr?.trim());

      if (isNaN(lat) || isNaN(lng)) return null;

      return {
        id: id as POI['id'],
        name,
        position: { lat, lng },
        genre: (row[2]?.trim() || 'その他') as POI['genre'],
        sourceSheet,
        googleMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * 状態更新とリスナー通知
   */
  private updateState(updates: Partial<ProgressiveLoadingState>): void {
    this.state = { ...this.state, ...updates };
    // エラーハンドリング付きでリスナーに通知
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('🚨 ProgressiveLoader リスナーエラー:', error);
      }
    });
  }

  /**
   * 進捗リスナーの登録
   */
  onStateChange(
    listener: (state: ProgressiveLoadingState) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 現在の状態を取得
   */
  getState(): ProgressiveLoadingState {
    return { ...this.state };
  }
}

export const progressiveDataLoader = new ProgressiveDataLoader();
