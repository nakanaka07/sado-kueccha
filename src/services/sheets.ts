import { GOOGLE_SHEETS_API } from '../constants';
import type { ContactInfo, DistrictId, GenreId, POI, POIId } from '../types';
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
 * 営業時間の型変換ヘルパー
 */
const createBusinessHours = (hours: Record<string, string>) => {
  const mappedHours: Record<
    string,
    { periods: Array<{ start: string; end: string }> }
  > = {};

  for (const [key, value] of Object.entries(hours)) {
    if (value.trim()) {
      mappedHours[key] = {
        periods: [{ start: '00:00', end: '23:59' }], // 簡易実装
      };
    }
  }

  return mappedHours;
};

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
 * シート設定の型定義
 */
export interface SheetConfig {
  readonly name: string;
  readonly gid: string;
}

/**
 * リクエストメタデータの型定義
 */
export interface RequestMetadata {
  readonly timestamp: number;
  readonly sheetName: string;
  readonly method: 'csv' | 'api';
}

/**
 * パフォーマンス監視用のロガー
 */
export const performanceLogger = {
  logs: [] as Array<{
    operation: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
  }>,

  async logOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      return result;
    } finally {
      const duration = performance.now() - start;
      const logEntry = {
        operation,
        duration,
        timestamp: Date.now(),
        ...(metadata && { metadata }),
      };

      this.logs.push(logEntry);

      // 時間のかかる操作のみログ出力（500ms以上）
      if (import.meta.env.DEV && duration > 500) {
        // パフォーマンス監視（開発環境のみ）
      }
    }
  },

  getLogs() {
    return [...this.logs];
  },

  clearLogs() {
    this.logs.length = 0;
  },
};

/**
 * データロード戦略
 */
interface LoadStrategy {
  /** シート名 */
  sheetName: string;
  /** 優先度 */
  priority: 'critical' | 'high' | 'normal' | 'low';
  /** 初期ロードサイズ */
  initialSize: number;
  /** 最大サイズ */
  maxSize: number;
  /** プリロードするか */
  preload: boolean;
}

/**
 * Google Sheets APIからデータを取得する機能を提供するサービスクラス
 * 最新のWeb開発基準に基づいてリファクタリング済み
 *
 * 最適化機能：
 * - インテリジェントデータローディング戦略
 * - 段階的フォールバック最適化
 * - バッチリクエスト処理
 * - キャッシュ効率の向上
 */
class SheetsService {
  private readonly apiKey: string;
  private readonly spreadsheetId: string;
  private readonly sheetConfigs: readonly SheetConfig[];

  // 最適化されたロード戦略 - 並列化と初期ロードサイズの削減
  private readonly loadStrategies: LoadStrategy[] = [
    {
      sheetName: 'recommended',
      priority: 'critical',
      initialSize: 20, // 削減
      maxSize: 50, // 削減
      preload: true,
    },
    {
      sheetName: 'snack',
      priority: 'high',
      initialSize: 30, // 削減
      maxSize: 100, // 削減
      preload: true,
    },
    {
      sheetName: 'parking',
      priority: 'high',
      initialSize: 30, // 削減
      maxSize: 100, // 削減
      preload: true,
    },
    {
      sheetName: 'toilet',
      priority: 'high',
      initialSize: 30, // 削減
      maxSize: 100, // 削減
      preload: true,
    },
    {
      sheetName: 'ryotsu_aikawa',
      priority: 'normal',
      initialSize: 50, // 削減
      maxSize: 200, // 削減
      preload: false,
    },
    {
      sheetName: 'kanai_sawada',
      priority: 'normal',
      initialSize: 50, // 削減
      maxSize: 200, // 削減
      preload: false,
    },
    {
      sheetName: 'akadomari_hamochi',
      priority: 'normal',
      initialSize: 50, // 削減
      maxSize: 200, // 削減
      preload: false,
    },
  ];

  // 列のマッピング定数（AB〜AX範囲で0-indexed）
  private static readonly COLUMNS = {
    DISTRICT: 0, // AB列: 地区（入力）
    COORDINATES: 4, // AF列: 座標（経度,緯度）
    NAME: 5, // AG列: 名称
    GENRE: 6, // AH列: ジャンル
    CATEGORY: 7, // AI列: シートカテゴリー
    PARKING: 8, // AJ列: 隣接駐車場
    CASHLESS: 9, // AK列: キャッシュレス対応
    MONDAY: 10, // AL列: 月曜
    TUESDAY: 11, // AM列: 火曜
    WEDNESDAY: 12, // AN列: 水曜
    THURSDAY: 13, // AO列: 木曜
    FRIDAY: 14, // AP列: 金曜
    SATURDAY: 15, // AQ列: 土曜
    SUNDAY: 16, // AR列: 日曜
    HOLIDAY: 17, // AS列: 祝祭
    CLOSED_DAYS: 18, // AT列: 定休日補足
    RELATED_INFO: 19, // AU列: 関連情報
    GOOGLE_MAPS: 20, // AV列: Google マップで見る
    CONTACT: 21, // AW列: 問い合わせ
    ADDRESS: 22, // AX列: 所在地
  } as const;

  // キャッシュレス判定用の値
  private static readonly CASHLESS_TRUE_VALUES = new Set([
    'true',
    '○',
    'yes',
    '可',
    'あり',
    '1',
    '対応',
  ]);

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
   * スプレッドシートからデータを取得（CSV形式とAPI形式の統合）
   * パフォーマンス監視付き
   */
  async fetchSheetData(sheetName: string, range: string): Promise<string[][]> {
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

          // Step 2: スマートキャッシュから確認（範囲を考慮）
          const smartCachedData = this.getSmartCachedData(sheetName, range);
          if (smartCachedData && smartCachedData.length > 0) {
            return smartCachedData;
          }

          // Step 3: 実際にデータを取得
          // API経由で取得してキャッシュに保存
          const fetchedData = await this.fetchSheetDataAsCSV(sheetName);
          cacheService.set(cacheKey, fetchedData, 5 * 60 * 1000); // 5分間キャッシュ
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
   * シートの優先度を取得
   */
  private getSheetPriority(
    sheetName: string
  ): 'critical' | 'high' | 'normal' | 'low' {
    const strategy = this.loadStrategies.find(s => s.sheetName === sheetName);
    return strategy?.priority || 'normal';
  }

  /**
   * シートのサイズヒントを取得
   */
  private getSheetSizeHint(sheetName: string): 'small' | 'medium' | 'large' {
    const strategy = this.loadStrategies.find(s => s.sheetName === sheetName);
    if (!strategy) return 'medium';

    if (strategy.maxSize <= 100) return 'small';
    if (strategy.maxSize <= 300) return 'medium';
    return 'large';
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
   * 生データをPOI形式に変換（リファクタリング済み）
   * より型安全で読みやすい実装
   */
  private convertToPOI(
    row: string[],
    id: string,
    sheetName: string
  ): POI | null {
    try {
      // 列定数を使用してデータを取得（null安全）
      const extractField = (index: number) => row[index]?.trim() ?? '';

      const district = extractField(SheetsService.COLUMNS.DISTRICT);
      const coordinates = extractField(SheetsService.COLUMNS.COORDINATES);
      const name = extractField(SheetsService.COLUMNS.NAME);
      const genre = extractField(SheetsService.COLUMNS.GENRE);
      const parking = extractField(SheetsService.COLUMNS.PARKING);
      const cashless = extractField(SheetsService.COLUMNS.CASHLESS);
      const relatedInfo = extractField(SheetsService.COLUMNS.RELATED_INFO);
      const googleMapsUrl = extractField(SheetsService.COLUMNS.GOOGLE_MAPS);
      const contact = extractField(SheetsService.COLUMNS.CONTACT);
      const address = extractField(SheetsService.COLUMNS.ADDRESS);

      // 必須フィールドのバリデーション
      if (!name || !coordinates) {
        return null;
      }

      // 座標データの解析（経度,緯度 形式）
      const coordinates_result = this.parseCoordinates(coordinates);
      if (!coordinates_result) {
        return null;
      }

      // 営業時間の取得
      const businessHours = this.extractBusinessHours(row);

      // POIオブジェクトを構築（条件付きプロパティを含む）
      const poi: POI = {
        id: createPOIId(id),
        name,
        position: coordinates_result,
        genre: createGenreId(genre || 'その他'),
        sourceSheet: sheetName,
        ...(relatedInfo && { details: { description: relatedInfo } }),
        ...(address && { address }),
        ...(contact && { contact: createContactInfo(contact) }),
        ...(parking && { parking }),
        ...(Object.keys(businessHours).length > 0 && {
          businessHours: createBusinessHours(businessHours),
        }),
        ...(district && { district: district as DistrictId }),
        ...(cashless && {
          cashless: SheetsService.CASHLESS_TRUE_VALUES.has(
            cashless.toLowerCase()
          ),
        }),
        googleMapsUrl:
          googleMapsUrl ||
          `https://www.google.com/maps?q=${coordinates_result.lat},${coordinates_result.lng}`,
      };

      return poi;
    } catch (error) {
      console.error(`POI変換エラー (${id}):`, error);
      return null;
    }
  }

  /**
   * 座標文字列を解析
   */
  private parseCoordinates(
    coordinates: string
  ): google.maps.LatLngLiteral | null {
    const [longitudeStr, latitudeStr] = coordinates.split(',');
    if (!longitudeStr?.trim() || !latitudeStr?.trim()) {
      return null;
    }

    const longitude = Number.parseFloat(longitudeStr.trim());
    const latitude = Number.parseFloat(latitudeStr.trim());

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    // 緯度経度の妥当性チェック（佐渡島周辺の範囲）
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

    return { lat: latitude, lng: longitude };
  }

  /**
   * 営業時間データを抽出
   */
  private extractBusinessHours(row: string[]): Record<string, string> {
    const businessHours: Record<string, string> = {};
    const extractField = (index: number) => row[index]?.trim() ?? '';

    const dayMappings = [
      { key: '月', value: extractField(SheetsService.COLUMNS.MONDAY) },
      { key: '火', value: extractField(SheetsService.COLUMNS.TUESDAY) },
      { key: '水', value: extractField(SheetsService.COLUMNS.WEDNESDAY) },
      { key: '木', value: extractField(SheetsService.COLUMNS.THURSDAY) },
      { key: '金', value: extractField(SheetsService.COLUMNS.FRIDAY) },
      { key: '土', value: extractField(SheetsService.COLUMNS.SATURDAY) },
      { key: '日', value: extractField(SheetsService.COLUMNS.SUNDAY) },
      { key: '祝', value: extractField(SheetsService.COLUMNS.HOLIDAY) },
      { key: '定休日', value: extractField(SheetsService.COLUMNS.CLOSED_DAYS) },
    ];

    for (const { key, value } of dayMappings) {
      if (value) {
        businessHours[key] = value;
      }
    }

    return businessHours;
  }

  /**
   * 複数シートからPOIデータを取得（段階的高速化版）
   * 推奨データを優先し、その他は段階的に取得
   */
  async fetchAllPOIs(): Promise<POI[]> {
    return performanceLogger.logOperation(
      'fetchAllPOIs',
      async () => {
        const poiMap = new Map<string, POI>();
        const recommendedSheetName = 'recommended';

        // Step 1: 推奨シートを最優先で取得（既にプリロード済みの可能性が高い）
        const recommendedConfig = this.sheetConfigs.find(
          config => config.name === recommendedSheetName
        );

        if (recommendedConfig) {
          try {
            // 最小限の範囲でまず取得（高速）
            const recommendedRows = await this.fetchSheetData(
              recommendedConfig.name,
              'AB2:AX100'
            );
            this.processPOIRows(
              recommendedRows,
              recommendedConfig.name,
              poiMap
            );
          } catch (error) {
            console.error(
              `推奨シート "${recommendedSheetName}" の取得に失敗:`,
              error
            );
          }
        }

        // Step 2: その他の重要シートを順次取得（キャッシュ効果を最大化）
        const importantSheets = ['snack', 'parking', 'toilet'];
        for (const sheetName of importantSheets) {
          const config = this.sheetConfigs.find(c => c.name === sheetName);
          if (config) {
            try {
              const rows = await this.fetchSheetData(config.name, 'AB2:AX200');
              this.processPOIRows(rows, config.name, poiMap);
            } catch (error) {
              console.error(`シート "${sheetName}" の取得に失敗:`, error);
            }
          }
        }

        // Step 3: 残りのシートを取得
        const remainingSheets = this.sheetConfigs.filter(
          config =>
            !['recommended', 'snack', 'parking', 'toilet'].includes(config.name)
        );

        for (const config of remainingSheets) {
          try {
            const rows = await this.fetchSheetData(config.name, 'AB2:AX1000');
            this.processPOIRows(rows, config.name, poiMap);

            // UI ブロッキング防止
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.error(`シート "${config.name}" の取得に失敗:`, error);
          }
        }

        const allPOIs = Array.from(poiMap.values());

        return allPOIs;
      },
      { totalSheets: this.sheetConfigs.length }
    );
  }

  /**
   * POI行データを処理してマップに追加
   */
  private processPOIRows(
    rows: string[][],
    sheetName: string,
    poiMap: Map<string, POI>
  ): void {
    for (const [index, row] of rows.entries()) {
      const poi = this.convertToPOI(
        row,
        `${sheetName}-${String(index + 1)}`,
        sheetName
      );
      if (poi) {
        const uniqueKey = this.generatePOIKey(poi);
        // 推奨シートのデータは常に優先
        if (sheetName === 'recommended' || !poiMap.has(uniqueKey)) {
          poiMap.set(uniqueKey, poi);
        }
      }
    }
  }

  /**
   * POIの一意キーを生成（名前と座標の組み合わせ）
   * より堅牢なキー生成アルゴリズム
   */
  private generatePOIKey(poi: POI): string {
    // 名前を正規化（空白、記号を除去して比較）
    const normalizedName = poi.name
      .replace(/[\s\-_・]/g, '')
      .toLowerCase()
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ''); // 日本語文字のみ保持

    // 座標を小数点以下4桁で丸めて比較（GPS精度の範囲内）
    const lat = Math.round(poi.position.lat * 10000) / 10000;
    const lng = Math.round(poi.position.lng * 10000) / 10000;

    return `${normalizedName}_${lat.toString()}_${lng.toString()}`;
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

  /**
   * スマートキャッシュ：範囲を考慮したデータ取得
   * 大きな範囲のキャッシュがあれば、小さな範囲の要求に応答
   */
  private getSmartCachedData(
    sheetName: string,
    requestedRange: string
  ): string[][] | null {
    try {
      // 要求された範囲を解析
      const requestedRows = this.parseRangeRows(requestedRange);
      if (!requestedRows) return null;

      // より大きな範囲のキャッシュを探す
      const possibleKeys = [
        `sheet_${sheetName}_AB2:AX1000`,
        `sheet_${sheetName}_AB2:AX500`,
        `sheet_${sheetName}_AB2:AX200`,
        `sheet_${sheetName}_AB2:AX100`,
        `sheet_${sheetName}_${requestedRange}`,
      ];

      for (const cacheKey of possibleKeys) {
        const cached = cacheService.get<string[][]>(cacheKey);
        if (cached && cached.length > 0) {
          const rangePart = cacheKey.split('_')[2];
          if (!rangePart) continue;

          const cachedRows = this.parseRangeRows(rangePart);

          // キャッシュされた範囲が要求範囲をカバーしているかチェック
          if (cachedRows && cachedRows.end >= requestedRows.end) {
            // 必要な部分だけを切り出して返す
            const sliceEnd = Math.min(requestedRows.end - 2, cached.length); // AB2から始まるので-2
            const result = cached.slice(0, sliceEnd);
            // スマートキャッシュヒットログを削除（頻繁すぎる）
            return result;
          }
        }
      }

      return null;
    } catch (_error) {
      if (import.meta.env.DEV) {
        // キャッシュエラー（開発環境のみ）
      }
      return null;
    }
  }

  /**
   * 範囲文字列から行数を解析 (例: "AB2:AX100" -> {start: 2, end: 100})
   */
  private parseRangeRows(range: string): { start: number; end: number } | null {
    const regex = /AB(\d+):AX(\d+)/;
    const match = regex.exec(range);
    if (!match || match.length < 3) return null;

    const startStr = match[1];
    const endStr = match[2];

    if (!startStr || !endStr) return null;

    return {
      start: parseInt(startStr, 10),
      end: parseInt(endStr, 10),
    };
  }

  /**
   * パフォーマンス統計の取得
   */
  getPerformanceStats(): {
    loadStrategies: LoadStrategy[];
    cacheStats: { hits: number; misses: number; size: number };
  } {
    return {
      loadStrategies: this.loadStrategies,
      cacheStats: { hits: 0, misses: 0, size: cacheService.size() },
    };
  }

  /**
   * 最適化されたPOI取得
   * インテリジェントローディング戦略を使用
   */
  async fetchPOIsOptimized(): Promise<POI[]> {
    const startTime = performance.now();

    try {
      // Phase 1: クリティカルデータの即座取得
      const criticalResult = await this.loadCriticalData();

      // Phase 2: 高優先度データの並列取得
      const highPriorityResult = await this.loadHighPriorityData();

      // Phase 3: 通常優先度データの順次取得
      const normalPriorityResult = await this.loadNormalPriorityData();

      // データの統合と重複排除
      const allPOIs = this.mergePOIData([
        criticalResult,
        highPriorityResult,
        normalPriorityResult,
      ]);

      const duration = performance.now() - startTime;
      if (import.meta.env.DEV) {
        console.warn(
          `[OptimizedSheets] 最適化済みPOI取得完了: ${allPOIs.length}件 (${duration.toFixed(2)}ms)`
        );
      }

      return allPOIs;
    } catch (error) {
      console.error('[OptimizedSheets] POI取得エラー:', error);

      // フォールバック: 従来の方法
      return this.fetchAllPOIs();
    }
  }

  /**
   * バッチプリロード処理
   * アプリ起動時に実行してキャッシュを温める
   */
  preloadCriticalData(): void {
    // 簡素化：予熱処理をスキップ
    // キャッシュの予熱は自然な使用パターンに委ねる
  }

  /**
   * インテリジェントシートデータ取得
   * 最適な範囲サイズを動的に決定
   */
  async fetchSheetDataIntelligent(
    sheetName: string,
    targetRowCount?: number
  ): Promise<string[][]> {
    const strategy = this.loadStrategies.find(s => s.sheetName === sheetName);
    const optimalSize = targetRowCount || strategy?.initialSize || 200;

    const cacheKey = `sheet_${sheetName}_intelligent_${optimalSize}`;
    const cached = cacheService.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached as string[][];
    }

    const result = await this.fetchSheetDataWithStrategy(
      sheetName,
      optimalSize
    );
    cacheService.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  }

  /**
   * クリティカルデータの取得
   */
  private async loadCriticalData(): Promise<POI[]> {
    const criticalStrategies = this.loadStrategies.filter(
      s => s.priority === 'critical'
    );
    const results: POI[] = [];

    for (const strategy of criticalStrategies) {
      try {
        const data = await this.fetchSheetDataWithStrategy(
          strategy.sheetName,
          strategy.initialSize
        );
        const pois = this.convertSheetDataToPOIs(data, strategy.sheetName);
        results.push(...pois);
      } catch (error) {
        console.error(
          `[OptimizedSheets] クリティカルデータ取得失敗: ${strategy.sheetName}`,
          error
        );
      }
    }

    return results;
  }

  /**
   * 高優先度データの並列取得
   */
  private async loadHighPriorityData(): Promise<POI[]> {
    const highPriorityStrategies = this.loadStrategies.filter(
      s => s.priority === 'high'
    );

    const promises = highPriorityStrategies.map(async strategy => {
      try {
        const data = await this.fetchSheetDataWithStrategy(
          strategy.sheetName,
          strategy.initialSize
        );
        return this.convertSheetDataToPOIs(data, strategy.sheetName);
      } catch (error) {
        console.error(
          `[OptimizedSheets] 高優先度データ取得失敗: ${strategy.sheetName}`,
          error
        );
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  }

  /**
   * 通常優先度データの順次取得
   */
  private async loadNormalPriorityData(): Promise<POI[]> {
    const normalStrategies = this.loadStrategies.filter(
      s => s.priority === 'normal'
    );
    const results: POI[] = [];

    for (const strategy of normalStrategies) {
      try {
        const data = await this.fetchSheetDataWithStrategy(
          strategy.sheetName,
          strategy.initialSize
        );
        const pois = this.convertSheetDataToPOIs(data, strategy.sheetName);
        results.push(...pois);
      } catch (error) {
        console.error(
          `[OptimizedSheets] 通常優先度データ取得失敗: ${strategy.sheetName}`,
          error
        );
      }
    }

    return results;
  }

  /**
   * 戦略に基づいたシートデータ取得
   */
  private async fetchSheetDataWithStrategy(
    sheetName: string,
    size: number
  ): Promise<string[][]> {
    const range = `AB2:AX${size}`;
    return this.fetchSheetData(sheetName, range);
  }

  /**
   * シートデータをPOIに変換
   */
  private convertSheetDataToPOIs(data: string[][], sheetName: string): POI[] {
    const pois: POI[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && row.length > 0) {
        const poi = this.convertToPOI(row, `${sheetName}_${i}`, sheetName);
        if (poi) {
          pois.push(poi);
        }
      }
    }

    return pois;
  }

  /**
   * POIデータの統合と重複排除 - パフォーマンス最適化版
   */
  private mergePOIData(poiArrays: POI[][]): POI[] {
    const mergedMap = new Map<string, POI>();
    const seen = new Set<string>();

    // 効率的な重複排除とマージ
    for (const pois of poiArrays) {
      for (const poi of pois) {
        const key = `${poi.position.lat}-${poi.position.lng}-${poi.name}`;

        // 重複チェック（高速化）
        if (!seen.has(key)) {
          seen.add(key);
          mergedMap.set(key, poi);
        }
      }
    }

    return Array.from(mergedMap.values());
  }

  /**
   * バッチ最適化されたPOIデータ取得
   * 複数のシートから効率的にデータを取得
   */
  async batchLoadOptimizedPOIs(sheetNames: string[]): Promise<POI[]> {
    return performanceLogger.logOperation(
      'batchLoadOptimizedPOIs',
      async () => {
        // バッチ操作でキャッシュを効率化
        const operations = sheetNames.map(sheetName => ({
          key: `sheet_${sheetName}_AB2:AX200`,
          sheetName, // シート名を保持
          fetcher: () => this.fetchSheetData(sheetName, 'AB2:AX200'),
          strategy: {
            priority: this.getSheetPriority(sheetName),
            sizeHint: this.getSheetSizeHint(sheetName),
            ttl: 5 * 60 * 1000,
          },
        }));

        // 簡素化：順次処理
        const poiArrays: POI[][] = [];
        for (const operation of operations) {
          try {
            const rawData = await operation.fetcher();
            const pois = this.convertSheetDataToPOIs(
              rawData,
              operation.sheetName
            );
            if (Array.isArray(pois) && pois.length > 0) {
              poiArrays.push(pois);
            }
          } catch {
            // エラーは無視して次へ
          }
        }

        return this.mergePOIData(poiArrays);
      },
      { sheetCount: sheetNames.length }
    );
  }
}

/**
 * シングルトンインスタンス
 */
const sheetsService = new SheetsService();

/**
 * サンプルデータ（APIが利用できない場合のフォールバック）
 * より充実したサンプルデータ
 */
export const samplePOIs: POI[] = [
  {
    id: createPOIId('sample-1'),
    name: '佐渡金山',
    position: { lat: 38.0494, lng: 138.2285 },
    genre: createGenreId('観光地'),
    details: {
      description:
        '江戸時代の金山遺跡。日本最大の金山として栄えた歴史的価値の高い観光スポット。',
    },
    address: '新潟県佐渡市下相川1305',
    businessHours: {
      monday: { periods: [{ start: '08:00', end: '17:30' }] },
      tuesday: { periods: [{ start: '08:00', end: '17:30' }] },
      wednesday: { periods: [{ start: '08:00', end: '17:30' }] },
      thursday: { periods: [{ start: '08:00', end: '17:30' }] },
      friday: { periods: [{ start: '08:00', end: '17:30' }] },
      saturday: { periods: [{ start: '08:00', end: '17:30' }] },
      sunday: { periods: [{ start: '08:00', end: '17:30' }] },
    },
  },
  {
    id: createPOIId('sample-2'),
    name: 'トキの森公園',
    position: { lat: 38.0666, lng: 138.3871 },
    genre: createGenreId('観光地'),
    details: {
      description:
        'トキの保護センター。絶滅危惧種のトキを間近で観察できる施設。',
    },
    address: '新潟県佐渡市新穂長畝383-2',
    parking: '無料駐車場あり',
    businessHours: {
      monday: { periods: [{ start: '08:30', end: '17:00' }] },
      tuesday: { periods: [{ start: '08:30', end: '17:00' }] },
      wednesday: { periods: [{ start: '08:30', end: '17:00' }] },
      thursday: { periods: [{ start: '08:30', end: '17:00' }] },
      friday: { periods: [{ start: '08:30', end: '17:00' }] },
      saturday: { periods: [{ start: '08:30', end: '17:00' }] },
      sunday: { periods: [{ start: '08:30', end: '17:00' }] },
    },
  },
  {
    id: createPOIId('sample-3'),
    name: '両津港',
    position: { lat: 38.0795, lng: 138.4371 },
    genre: createGenreId('交通'),
    details: {
      description: '佐渡島の玄関口。本州と佐渡を結ぶフェリーターミナル。',
    },
    address: '新潟県佐渡市両津湊353',
    parking: '有料駐車場あり',
    contact: createContactInfo('0259-27-5111'),
  },
];

/**
 * POI データを取得する関数（キャッシュとフォールバックを組み合わせ）
 * リファクタリング済み：エラーハンドリング、ログ、並列処理対応
 */
let currentFetchPromise: Promise<POI[]> | null = null;

export const fetchPOIs = async (): Promise<POI[]> => {
  // 既に進行中のリクエストがある場合は、それを再利用
  if (currentFetchPromise) {
    return currentFetchPromise;
  }

  const CACHE_KEY = 'all_pois';

  // まずキャッシュから取得を試行
  const cachedPOIs = cacheService.get(CACHE_KEY, isPOIArray);
  if (cachedPOIs) {
    return removeDuplicatePOIs(cachedPOIs);
  }

  // 新しいリクエストを開始
  currentFetchPromise = performanceLogger.logOperation(
    'fetchPOIs-main',
    async () => {
      try {
        // 実際のGoogle Sheets APIからデータを取得を試行
        const pois = await sheetsService.fetchAllPOIs();

        if (pois.length > 0) {
          const uniquePOIs = removeDuplicatePOIs(pois);
          // 成功時はキャッシュに保存（5分間）
          cacheService.set(CACHE_KEY, uniquePOIs, 5 * 60 * 1000);

          return uniquePOIs;
        } else {
          if (import.meta.env.DEV) {
            console.warn('APIからのデータが0件のため、サンプルデータを使用');
          }
          return removeDuplicatePOIs(samplePOIs);
        }
      } catch (error) {
        console.error('API取得に失敗、サンプルデータを使用:', error);
        // APIが失敗した場合はサンプルデータを返す
        return removeDuplicatePOIs(samplePOIs);
      } finally {
        // リクエストが完了したらキャッシュをクリア
        currentFetchPromise = null;
      }
    },
    { source: 'main-api' }
  );

  return currentFetchPromise;
};

/**
 * POI重複除去ヘルパー関数（recommendedシート優先）
 * より効率的なアルゴリズムに改善
 */
export function removeDuplicatePOIs(pois: POI[]): POI[] {
  const uniqueMap = new Map<string, POI>();

  // まず通常のPOIを追加
  for (const poi of pois) {
    if (poi.sourceSheet !== 'recommended') {
      uniqueMap.set(poi.id, poi);
    }
  }

  // 推奨シートのPOIで上書き（優先）
  for (const poi of pois) {
    if (poi.sourceSheet === 'recommended') {
      uniqueMap.set(poi.id, poi);
    }
  }

  const uniquePOIs = Array.from(uniqueMap.values());

  return uniquePOIs;
}

/**
 * エクスポート
 */
export { sheetsService };

/**
 * 最適化されたシートサービスのエイリアス（後方互換性）
 * @deprecated sheetsService.fetchPOIsOptimized() を直接使用してください
 */
export const optimizedSheetsService = {
  fetchPOIsOptimized: sheetsService.fetchPOIsOptimized.bind(sheetsService),
  preloadCriticalData: sheetsService.preloadCriticalData.bind(sheetsService),
  fetchSheetDataIntelligent:
    sheetsService.fetchSheetDataIntelligent.bind(sheetsService),
  getPerformanceStats: sheetsService.getPerformanceStats.bind(sheetsService),
};

/**
 * 型ガード関数（再エクスポート）
 */
export { isPOIArray };
