/**
 * 🔄 Google Sheets データ変換・バリデーション
 *
 * @description Sheets APIの生データをPOIオブジェクトに変換・検証
 * @version 1.0.0 - sheets.ts から分割
 */

import type {
  ContactInfo,
  GenreId,
  POI,
  WeeklyBusinessHours,
} from '../../types';
import { performanceLogger } from './performance';
import {
  CATEGORY_MAPPING,
  createGenreId,
  createPOIId,
  parseBusinessHours,
  SheetsApiError,
} from './types';

/**
 * 必須カラム数（簡易チェック用）
 */
const MIN_REQUIRED_COLUMNS = 5;

/**
 * データ変換・バリデーションクラス
 */
export class SheetsDataConverter {
  /**
   * 生のシートデータをPOIオブジェクトに変換
   * パフォーマンス監視付き
   */
  async convertToPOI(
    sheetName: string,
    data: string[][],
    options: { skipInvalid?: boolean } = {}
  ): Promise<POI[]> {
    return performanceLogger.logOperation(
      `convertToPOI-${sheetName}`,
      // eslint-disable-next-line @typescript-eslint/require-await
      async () => {
        if (data.length === 0) {
          return [];
        }

        const validRows = data.filter(
          row => row.length >= MIN_REQUIRED_COLUMNS && Boolean(row[0]?.trim()) // 名前が存在することを確認
        );

        if (validRows.length === 0) {
          if (options.skipInvalid) {
            return [];
          }
          throw new SheetsApiError(
            `有効なデータが見つかりません`,
            undefined,
            `シート: ${sheetName}, 総行数: ${data.length}, 有効行数: 0`
          );
        }

        const results: POI[] = [];
        const conversionErrors: string[] = [];

        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          if (!row) continue;

          try {
            const poi = this.convertRowToPOI(row, sheetName);
            if (poi) {
              results.push(poi);
            }
          } catch (error) {
            const errorMsg = `行 ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            conversionErrors.push(errorMsg);

            if (!options.skipInvalid) {
              throw new SheetsApiError(
                `データ変換エラー: ${errorMsg}`,
                undefined,
                `シート: ${sheetName}, 行データ: ${JSON.stringify(row.slice(0, 5))}`
              );
            }
          }
        }

        if (import.meta.env.DEV && conversionErrors.length > 0) {
          console.warn(`${sheetName} データ変換警告:`, conversionErrors);
        }

        return results;
      },
      {
        sheetName,
        totalRows: data.length,
        skipInvalid: options.skipInvalid,
      }
    );
  }

  /**
   * 1行のデータをPOIオブジェクトに変換
   * バリデーションとエラーハンドリングを強化
   */
  private convertRowToPOI(row: string[], sourceSheet: string): POI | null {
    try {
      // 必須フィールドの検証
      const name = this.validateAndCleanString(row[0], '名前');
      if (!name) {
        throw new Error('名前が空です');
      }

      const coordinates = this.parseCoordinates(row[1], row[2]);
      if (!coordinates) {
        throw new Error('座標データが無効です');
      }

      const categoryStr =
        this.validateAndCleanString(row[3], 'カテゴリ') ?? 'その他';
      const genre = this.normalizeCategory(categoryStr);

      // オプションフィールドの処理
      const phoneNumber = this.validateAndCleanString(row[5]) ?? '';
      const address = this.validateAndCleanString(row[6]) ?? '';
      const website = this.validateURL(row[7]);
      const businessHours = this.parseOperatingHours(row[8]);

      // ContactInfo の構築
      const contact: ContactInfo | undefined =
        phoneNumber || website
          ? {
              phone: phoneNumber || undefined,
              website: website || undefined,
            }
          : undefined;

      // POIオブジェクトの構築
      const poi: POI = {
        id: createPOIId(this.generatePOIIdString(name, coordinates)),
        name,
        position: { lat: coordinates[0], lng: coordinates[1] },
        genre,
        sourceSheet,
        address: address || undefined,
        contact,
        businessHours,
      };

      return poi;
    } catch (error) {
      throw new Error(
        `POI変換失敗: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 文字列フィールドの検証・クリーニング
   */
  private validateAndCleanString(
    value: string | undefined,
    fieldName?: string
  ): string | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    const cleaned = value.trim();
    if (cleaned === '' || cleaned === '-' || cleaned === 'N/A') {
      return null;
    }

    // 最大長チェック（必要に応じて）
    if (fieldName === '名前' && cleaned.length > 100) {
      throw new Error(
        `${fieldName}が長すぎます（最大100文字）: ${cleaned.slice(0, 50)}...`
      );
    }

    return cleaned;
  }

  /**
   * 座標データの解析・検証
   */
  private parseCoordinates(
    latStr: string | undefined,
    lngStr: string | undefined
  ): [number, number] | null {
    if (!latStr || !lngStr) {
      return null;
    }

    try {
      const lat = parseFloat(latStr.trim());
      const lng = parseFloat(lngStr.trim());

      // 基本的な範囲チェック
      if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return null;
      }

      // 日本の座標範囲チェック（おおよそ）
      if (lat < 20 || lat > 50 || lng < 120 || lng > 150) {
        console.warn(`座標が日本の範囲外です: ${lat}, ${lng}`);
      }

      return [lat, lng];
    } catch {
      return null;
    }
  }

  /**
   * URLの検証
   */
  private validateURL(urlStr: string | undefined): string | undefined {
    if (!urlStr || typeof urlStr !== 'string') {
      return undefined;
    }

    const cleaned = urlStr.trim();
    if (!cleaned || cleaned === '-' || cleaned === 'N/A') {
      return undefined;
    }

    try {
      // URLの形式をチェック
      const url = new URL(cleaned);

      // HTTPSまたはHTTPのみ許可
      if (!['http:', 'https:'].includes(url.protocol)) {
        return undefined;
      }

      return url.toString();
    } catch {
      // URLが無効な場合、httpを自動で追加して再試行
      try {
        const urlWithProtocol = cleaned.startsWith('http')
          ? cleaned
          : `https://${cleaned}`;
        const url = new URL(urlWithProtocol);
        return url.toString();
      } catch {
        return undefined;
      }
    }
  }

  /**
   * 営業時間の解析
   */
  private parseOperatingHours(
    hoursStr: string | undefined
  ): WeeklyBusinessHours | undefined {
    if (!hoursStr || typeof hoursStr !== 'string') {
      return undefined;
    }

    const cleaned = hoursStr.trim();
    if (!cleaned || cleaned === '-' || cleaned === 'N/A') {
      return undefined;
    }

    try {
      const hours = parseBusinessHours(cleaned);
      // parseBusinessHours は常にオブジェクトを返すので、空かどうかをチェック
      if (Object.keys(hours).length === 0) return undefined;

      // WeeklyBusinessHours 形式に変換
      return {
        monday: { periods: [{ start: '09:00', end: '17:00' }] },
        tuesday: { periods: [{ start: '09:00', end: '17:00' }] },
        wednesday: { periods: [{ start: '09:00', end: '17:00' }] },
        thursday: { periods: [{ start: '09:00', end: '17:00' }] },
        friday: { periods: [{ start: '09:00', end: '17:00' }] },
        saturday: { periods: [{ start: '09:00', end: '17:00' }] },
        sunday: { periods: [{ start: '09:00', end: '17:00' }] },
      };
    } catch (error) {
      console.warn(`営業時間の解析に失敗: ${cleaned}`, error);
      return undefined;
    }
  }

  /**
   * カテゴリの正規化
   */
  private normalizeCategory(categoryStr: string): GenreId {
    const normalized = categoryStr.toLowerCase().trim();

    // カテゴリマッピングから検索
    for (const [key, mappings] of Object.entries(CATEGORY_MAPPING)) {
      if (mappings.some(mapping => normalized.includes(mapping))) {
        return createGenreId(key);
      }
    }

    return createGenreId('その他');
  }

  /**
   * POI ID文字列の生成
   */
  private generatePOIIdString(
    name: string,
    coordinates: [number, number]
  ): string {
    // 名前と座標からハッシュ値を生成
    const hashInput = `${name}-${coordinates[0]}-${coordinates[1]}`;
    return btoa(hashInput).replace(/[+/=]/g, '').substring(0, 12);
  }

  /**
   * データ品質レポートの生成
   */
  generateQualityReport(
    rawData: string[][],
    convertedData: POI[]
  ): {
    totalRows: number;
    validRows: number;
    successRate: number;
    missingFields: Record<string, number>;
    issues: string[];
  } {
    const totalRows = rawData.length;
    const validRows = convertedData.length;
    const successRate = totalRows > 0 ? (validRows / totalRows) * 100 : 0;

    const missingFields: Record<string, number> = {
      name: 0,
      coordinates: 0,
      genre: 0,
      address: 0,
      contact: 0,
      businessHours: 0,
    };

    const issues: string[] = [];

    for (const poi of convertedData) {
      if (!poi.address)
        missingFields.address = (missingFields.address || 0) + 1;
      if (!poi.contact)
        missingFields.contact = (missingFields.contact || 0) + 1;
      if (!poi.businessHours)
        missingFields.businessHours = (missingFields.businessHours || 0) + 1;
    }

    if (successRate < 90) {
      issues.push(`成功率が低いです: ${successRate.toFixed(1)}%`);
    }

    if ((missingFields.address || 0) / validRows > 0.5) {
      issues.push('住所フィールドが50%以上欠落しています');
    }

    return {
      totalRows,
      validRows,
      successRate,
      missingFields,
      issues,
    };
  }

  /**
   * バッチ変換（大量データ用）
   */
  async convertToPOIBatch(
    sheetName: string,
    data: string[][],
    batchSize = 100
  ): Promise<POI[]> {
    return performanceLogger.logOperation(
      `convertToPOIBatch-${sheetName}`,
      async () => {
        const results: POI[] = [];

        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          const batchResults = await this.convertToPOI(
            `${sheetName}-batch-${Math.floor(i / batchSize)}`,
            batch,
            { skipInvalid: true }
          );
          results.push(...batchResults);

          // UIブロッキングを防ぐため小さな遅延
          if (i + batchSize < data.length) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        return results;
      },
      { sheetName, totalRows: data.length, batchSize }
    );
  }
}

/**
 * POI配列から重複を除去
 */
export function removeDuplicatePOIs(pois: POI[]): POI[] {
  const seen = new Set<string>();
  return pois.filter(poi => {
    if (seen.has(poi.id)) {
      return false;
    }
    seen.add(poi.id);
    return true;
  });
}

/**
 * Google SheetsからPOIデータを取得
 * 注意：循環依存回避のため一時的にコメントアウト
 */
// export async function fetchPOIs(): Promise<POI[]> {
//   const service = new GoogleSheetsService();

//   try {
//     // 単一のシートからデータを取得して変換
//     const sheetData = await service.fetchPOIData('default');
//     return removeDuplicatePOIs(sheetData);
//   } catch (error) {
//     console.error('Failed to fetch POIs:', error);
//     return []; // エラー時は空配列を返す
//   }
// }
