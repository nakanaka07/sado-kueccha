/**
 * 🌐 Google Sheets API クライアント
 *
 * @description API呼び出し、CSV取得、パーシング機能を提供
 * @version 1.0.0 - sheets.ts から分割
 */

import { GOOGLE_SHEETS_API } from '../../constants';
import { getAppConfig } from '../../utils/env';
import { getSheetsConfig } from '../../utils/sheetsConfig';
import { cacheService } from '../cache';
import { CACHE_TTL, DEFAULT_RANGE } from './config';
import { performanceLogger } from './performance';
import { SheetsApiError, type SheetConfig } from './types';

/**
 * Google Sheets API クライアント
 */
export class SheetsApiClient {
  private readonly apiKey: string;
  private readonly spreadsheetId: string;
  private readonly sheetConfigs: SheetConfig[];

  constructor() {
    const config = getAppConfig();
    this.apiKey = config.data.sheetsApiKey;
    this.spreadsheetId = config.data.spreadsheetId;

    // 新しい統合シート設定を使用
    const sheetsConfig = getSheetsConfig();

    this.sheetConfigs = [
      // おすすめの飲食店をピックアップしたデータ
      this.parseSheetConfig(sheetsConfig.recommended),
      // 両津・相川地区のデータ
      this.parseSheetConfig(sheetsConfig.ryotsuAikawa),
      // 金井・佐和田・新穂・畑野・真野地区のデータ
      this.parseSheetConfig(sheetsConfig.kanaiSawada),
      // 赤泊・羽茂・小木地区のデータ
      this.parseSheetConfig(sheetsConfig.akadomariHamochi),
      // スナック営業している店舗のデータ
      this.parseSheetConfig(sheetsConfig.snacks),
      // 公共トイレの位置情報のデータ
      this.parseSheetConfig(sheetsConfig.toilets),
      // 公共の駐車場のデータ
      this.parseSheetConfig(sheetsConfig.parking),
    ].filter((configItem): configItem is SheetConfig => configItem !== null);
  }

  /**
   * シート設定文字列を解析（例: "おすすめ:1043711248"）
   */
  private parseSheetConfig(configStr: string | undefined): SheetConfig | null {
    if (!configStr) return null;
    const [name, gid] = configStr.split(':');
    return name && gid ? { name: name.trim(), gid: gid.trim() } : null;
  }

  /**
   * シート設定を取得
   */
  getSheetConfigs(): SheetConfig[] {
    return this.sheetConfigs;
  }

  /**
   * スプレッドシートからデータを取得（CSV形式とAPI形式の統合）
   * パフォーマンス監視付き
   */
  async fetchSheetData(
    sheetName: string,
    range: string = DEFAULT_RANGE
  ): Promise<string[][]> {
    return performanceLogger.logOperation(
      `fetchSheetData-${sheetName}`,
      async () => {
        try {
          // Step 1: 重複リクエスト排除付きでキャッシュから確認
          const cacheKey = `sheet_${sheetName}_${range}`;

          // キャッシュから取得を試行
          const cachedData = cacheService.get(cacheKey);
          if (cachedData && Array.isArray(cachedData)) {
            return cachedData as string[][];
          }

          // Step 2: 実際にデータを取得
          // CSV経由で取得してキャッシュに保存
          const fetchedData = await this.fetchSheetDataAsCSV(sheetName);
          cacheService.set(cacheKey, fetchedData, CACHE_TTL.SHORT);
          return fetchedData;
        } catch (_csvError) {
          if (import.meta.env.DEV) {
            // CSV取得失敗時のフォールバック（開発環境のみ）
          }
          return await this.fetchSheetDataViaAPI(sheetName, range);
        }
      },
      { sheetName, range, method: 'hybrid' }
    );
  }

  /**
   * CSV形式でスプレッドシートからデータを取得（公開スプレッドシート用）
   * エラーハンドリングと妥当性チェックを強化
   */
  private async fetchSheetDataAsCSV(sheetName: string): Promise<string[][]> {
    if (!this.spreadsheetId) {
      throw new SheetsApiError(
        'スプレッドシートIDが設定されていません。',
        undefined,
        '環境変数 VITE_GOOGLE_SPREADSHEET_ID を確認してください。'
      );
    }

    // 設定から対応するGIDを取得
    const sheetConfig = this.sheetConfigs.find(
      config => config.name === sheetName
    );
    if (!sheetConfig) {
      throw new SheetsApiError(
        `シート "${sheetName}" の設定が見つかりません。`,
        undefined,
        `利用可能なシート: ${this.sheetConfigs.map(c => c.name).join(', ')}`
      );
    }

    const csvUrl = `${GOOGLE_SHEETS_API.BASE_URL}/${this.spreadsheetId}/${GOOGLE_SHEETS_API.CSV_EXPORT_BASE}&gid=${sheetConfig.gid}&range=${GOOGLE_SHEETS_API.DEFAULT_RANGE}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10秒タイムアウト

      const response = await fetch(csvUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'text/csv',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new SheetsApiError(
          `CSV取得失敗: ${response.status} ${response.statusText}`,
          response.status,
          csvUrl
        );
      }

      const csvText = await response.text();

      if (!csvText.trim()) {
        throw new SheetsApiError(
          'CSVデータが空です',
          undefined,
          `シート: ${sheetName}, URL: ${csvUrl}`
        );
      }

      const data = this.parseCSV(csvText);

      // ヘッダー行をスキップして返す
      return data.slice(1);
    } catch (error) {
      if (error instanceof SheetsApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SheetsApiError(
            'CSV取得がタイムアウトしました',
            408,
            csvUrl
          );
        }
        throw new SheetsApiError(
          `CSV取得中にエラーが発生: ${error.message}`,
          undefined,
          csvUrl
        );
      }

      throw new SheetsApiError('不明なエラーが発生しました', undefined, csvUrl);
    }
  }

  /**
   * API形式でスプレッドシートからデータを取得（従来の方法）
   * エラーハンドリングを改善
   */
  private async fetchSheetDataViaAPI(
    sheetName: string,
    range: string
  ): Promise<string[][]> {
    if (!this.apiKey) {
      throw new SheetsApiError(
        'Google Sheets APIキーが設定されていません。',
        401,
        '環境変数 VITE_GOOGLE_SHEETS_API_KEY を設定してください。'
      );
    }

    if (!this.spreadsheetId) {
      throw new SheetsApiError(
        'スプレッドシートIDが設定されていません。',
        undefined,
        '環境変数 VITE_GOOGLE_SPREADSHEET_ID を設定してください。'
      );
    }

    const url = `${GOOGLE_SHEETS_API.API_BASE}/${this.spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!${range}?key=${this.apiKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 15000); // 15秒タイムアウト

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let details = url;

        if (response.status === 403) {
          errorMessage = `Google Sheets APIへのアクセスが拒否されました（403）。`;
          details = `考えられる原因：
1. APIキーにGoogle Sheets APIの権限がない
2. スプレッドシートが非公開設定になっている
3. Google Cloud ConsoleでSheets APIが有効になっていない

適切なAPIキーを使用するか、スプレッドシートを「リンクを知っている全員が閲覧可能」に設定してください。`;
        } else if (response.status === 404) {
          errorMessage = `スプレッドシートまたはシートが見つかりません（404）。`;
          details = `シート名: ${sheetName}, スプレッドシートID: ${this.spreadsheetId}`;
        }

        throw new SheetsApiError(errorMessage, response.status, details);
      }

      const data = (await response.json()) as { values?: string[][] };
      return data.values ?? [];
    } catch (error) {
      if (error instanceof SheetsApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new SheetsApiError('API取得がタイムアウトしました', 408, url);
        }
        throw new SheetsApiError(
          `API取得中にエラーが発生: ${error.message}`,
          undefined,
          url
        );
      }

      throw new SheetsApiError('不明なエラーが発生しました', undefined, url);
    }
  }

  /**
   * CSVテキストを解析してstring[][]に変換
   * RFC 4180準拠のCSVパーサー
   */
  private parseCSV(csvText: string): string[][] {
    const lines = csvText.split(/\r\n|\n|\r/);
    const data: string[][] = [];

    for (const line of lines) {
      if (line.trim()) {
        const row = this.parseCSVLine(line);
        data.push(row);
      }
    }

    return data;
  }

  /**
   * 1行のCSVを解析（RFC 4180準拠）
   * より堅牢なCSVパーシング実装
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (!inQuotes) {
          inQuotes = true;
        } else if (i + 1 < line.length && line[i + 1] === '"') {
          // エスケープされた引用符
          current += '"';
          i++; // 次の"をスキップ
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else if (char) {
        current += char;
      }

      i++;
    }

    // 最後のフィールドを追加
    result.push(current.trim());

    return result;
  }
}
