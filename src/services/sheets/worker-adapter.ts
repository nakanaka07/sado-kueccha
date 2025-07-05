/**
 * 🔧 データ変換アダプター (Worker機能削除版)
 *
 * @description React 18最適化機能により、Web Workerは不要となったため、
 * 従来のメインスレッド処理に統一してコードを簡素化
 * @version 2.0.0 - Simplified (Worker removed)
 */

import type { POI } from '../../types';

/**
 * シンプルなデータ変換アダプタークラス
 * メインスレッド処理に統一してパフォーマンスと保守性を両立
 */
export class SheetsWorkerAdapter {
  /**
   * シートデータをPOIに変換（同期処理）
   */
  async convertToPOIsAsync(
    rows: string[][],
    sheetName: string
  ): Promise<POI[]> {
    // 動的インポートでConverterを取得（循環依存を回避）
    const { SheetsDataConverter } = await import('./converter');
    const converter = new SheetsDataConverter();
    return converter.convertToPOI(sheetName, rows, { skipInvalid: true });
  }

  /**
   * アダプター終了（何もしない - 後方互換性のため）
   */
  terminate(): void {
    // Worker機能削除により、何もしない
  }
}

// シングルトンインスタンス
export const workerAdapter = new SheetsWorkerAdapter();
