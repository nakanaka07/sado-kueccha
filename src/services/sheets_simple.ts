import { GOOGLE_SHEETS_API } from '../constants';
import type { ContactInfo, GenreId, POI, POIId } from '../types';
import { getAppConfig } from '../utils/env';
import { getSheetsConfig } from '../utils/sheetsConfig';
import { isPOIArray } from '../utils/typeGuards';
import { cacheService } from './cache';

/**
 * ブランド型用のキャスト関数
 */
const createPOIId = (id: string): POIId => id as POIId;
const createGenreId = (genre: string): GenreId => genre as GenreId;
const createContactInfo = (contact: string): ContactInfo => ({
  phone: contact,
});

/**
 * Google Sheets APIのエラークラス
 */
export class SheetsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'SheetsApiError';
  }
}

/**
 * シンプルなGoogle Sheetsサービス
 */
class SheetsService {
  private readonly apiKey: string;
  private readonly spreadsheetId: string;

  constructor() {
    const config = getAppConfig();
    this.apiKey = config.data.sheetsApiKey;
    this.spreadsheetId = config.data.spreadsheetId;
  }

  /**
   * シートからデータを取得
   */
  async fetchSheetData(sheetName: string, range = 'A:Z'): Promise<string[][]> {
    const cacheKey = `sheet_${sheetName}_${range}`;

    // キャッシュから確認
    const cached = cacheService.get<string[][]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Google Sheets API経由でデータ取得
      const url = `${GOOGLE_SHEETS_API.API_BASE}/${this.spreadsheetId}/values/${sheetName}!${range}?key=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new SheetsApiError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = (await response.json()) as { values?: string[][] };
      const values: string[][] = data.values ?? [];

      // キャッシュに保存
      cacheService.set(cacheKey, values, 300000); // 5分間キャッシュ

      return values;
    } catch (error) {
      throw new SheetsApiError(
        `Failed to fetch sheet data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * シートデータをPOI配列に変換
   */
  async convertSheetToPOIs(sheetName: string): Promise<POI[]> {
    try {
      const sheetData = await this.fetchSheetData(sheetName);
      if (sheetData.length === 0) return [];

      const [headers, ...rows] = sheetData;
      if (!headers) return [];

      const pois: POI[] = [];

      for (const row of rows) {
        try {
          const poi = this.convertRowToPOI(row, headers, sheetName);
          if (poi) {
            pois.push(poi);
          }
        } catch (_error) {
          // 行変換エラーは無視して継続
          continue;
        }
      }

      return pois;
    } catch (error) {
      throw new SheetsApiError(
        `Failed to convert sheet to POIs: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 行データをPOIに変換
   */
  private convertRowToPOI(
    row: string[],
    headers: string[],
    sheetName: string
  ): POI | null {
    if (row.length < 3) return null;

    const getColumnValue = (columnName: string): string => {
      const index = headers.findIndex(h =>
        h.toLowerCase().includes(columnName.toLowerCase())
      );
      return index >= 0 ? (row[index] || '').trim() : '';
    };

    const name = getColumnValue('name') || getColumnValue('店名') || row[0];
    const latStr = getColumnValue('lat') || getColumnValue('緯度') || row[1];
    const lngStr = getColumnValue('lng') || getColumnValue('経度') || row[2];

    if (!name || !latStr || !lngStr) return null;

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    // 座標の妥当性チェック（佐渡島周辺）
    if (
      latitude < 37.5 ||
      latitude > 38.5 ||
      longitude < 138.0 ||
      longitude > 139.0
    ) {
      if (import.meta.env.DEV) {
        // 座標範囲外警告（開発環境のみ）
      }
    }

    const id = createPOIId(`${sheetName}_${name}_${Date.now()}`);
    const genre = createGenreId(
      getColumnValue('genre') || getColumnValue('ジャンル') || sheetName
    );

    const contact = getColumnValue('phone') || getColumnValue('電話');
    const contactInfo = contact ? createContactInfo(contact) : undefined;

    return {
      id,
      name,
      position: { lat: latitude, lng: longitude },
      genre,
      sourceSheet: sheetName,
      address: getColumnValue('address') || getColumnValue('住所'),
      contact: contactInfo,
      parking: getColumnValue('parking') || getColumnValue('駐車場'),
    };
  }

  /**
   * 全シートからPOIを取得
   */
  async fetchAllPOIs(): Promise<POI[]> {
    const sheetsConfig = getSheetsConfig();
    const allPOIs: POI[] = [];

    const configEntries = Object.entries(sheetsConfig);
    for (const [sheetName, _sheetConfig] of configEntries) {
      try {
        const pois = await this.convertSheetToPOIs(sheetName);
        allPOIs.push(...pois);
      } catch (_error) {
        console.error(`Failed to load sheet ${sheetName}`);
        continue;
      }
    }

    // 型チェック
    if (!isPOIArray(allPOIs)) {
      throw new SheetsApiError('Invalid POI data format');
    }

    return allPOIs;
  }

  /**
   * キャッシュクリア
   */
  clearCache(): void {
    cacheService.clear();
  }
}

// シングルトンインスタンス
export const sheetsService = new SheetsService();
