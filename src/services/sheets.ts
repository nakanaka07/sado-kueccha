import type { POI } from "../types/google-maps";
import { cacheService } from "./cache";

// POI配列の型ガード
function isPOIArray(value: unknown): value is POI[] {
  return (
    Array.isArray(value) &&
    (value.length === 0 ||
      (typeof value[0] === "object" &&
        value[0] !== null &&
        "id" in value[0] &&
        "name" in value[0] &&
        "position" in value[0]))
  );
}

// Google Sheets APIからデータを取得する機能
class SheetsService {
  private apiKey: string;
  private spreadsheetId: string;
  private sheetConfigs: Array<{ name: string; gid: string }>;

  // 列のマッピング定数（AB〜AX範囲で0-indexed）
  private readonly COLUMNS = {
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

  constructor() {
    this.apiKey = String(
      import.meta.env["VITE_GOOGLE_SHEETS_API_KEY"] ||
        import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] ||
        "",
    );
    this.spreadsheetId = String(import.meta.env["VITE_GOOGLE_SPREADSHEET_ID"] || "");

    // .envからシート設定を読み込み
    this.sheetConfigs = [
      // おすすめの飲食店をピックアップしたデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_RECOMMENDED"] || ""),
      // 両津・相川地区のデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_RYOTSU_AIKAWA"] || ""),
      // 金井・佐和田・新穂・畑野・真野地区のデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_KANAI_SAWADA"] || ""),
      // 赤泊・羽茂・小木地区のデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_AKADOMARI_HAMOCHI"] || ""),
      // スナック営業している店舗のデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_SNACK"] || ""),
      // 公共トイレの位置情報のデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_TOILET"] || ""),
      // 公共の駐車場のデータ
      this.parseSheetConfig(import.meta.env["VITE_SHEET_PARKING"] || ""),
    ].filter((config): config is { name: string; gid: string } => config !== null);
  } // シート設定文字列を解析（例: "おすすめ:1043711248"）
  private parseSheetConfig(configStr: string): { name: string; gid: string } | null {
    if (!configStr) return null;
    const [name, gid] = configStr.split(":");
    return name && gid ? { name: name.trim(), gid: gid.trim() } : null;
  }

  // スプレッドシートからデータを取得（CSV形式とAPI形式の統合）
  async fetchSheetData(sheetName: string, range: string): Promise<string[][]> {
    try {
      return await this.fetchSheetDataAsCSV(sheetName);
    } catch (csvError) {
      console.log(`CSV形式での取得に失敗、API形式を試行: ${String(csvError)}`);
      return await this.fetchSheetDataViaAPI(sheetName, range);
    }
  } // CSV形式でスプレッドシートからデータを取得（公開スプレッドシート用）
  private async fetchSheetDataAsCSV(sheetName: string): Promise<string[][]> {
    if (!this.spreadsheetId) {
      throw new Error("スプレッドシートIDが設定されていません。");
    }

    // 設定から対応するGIDを取得
    const sheetConfig = this.sheetConfigs.find((config) => config.name === sheetName);
    if (!sheetConfig) {
      console.warn(
        `利用可能な設定:`,
        this.sheetConfigs.map((c) => c.name),
      );
      throw new Error(`シート "${sheetName}" の設定が見つかりません。`);
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${sheetConfig.gid}&range=AB:AX`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`CSV取得失敗: ${response.status.toString()} ${response.statusText}`);
    }

    const csvText = await response.text();
    const data: string[][] = this.parseCSV(csvText);
    return data.slice(1); // ヘッダー行をスキップ
  } // API形式でスプレッドシートからデータを取得（従来の方法）
  private async fetchSheetDataViaAPI(sheetName: string, range: string): Promise<string[][]> {
    if (!this.apiKey) {
      throw new Error(
        "Google Sheets APIキーが設定されていません。環境変数 VITE_GOOGLE_SHEETS_API_KEY または VITE_GOOGLE_MAPS_API_KEY を設定してください。",
      );
    }

    if (!this.spreadsheetId) {
      throw new Error(
        "スプレッドシートIDが設定されていません。環境変数 VITE_GOOGLE_SPREADSHEET_ID を設定してください。",
      );
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(sheetName)}!${range}?key=${this.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API呼び出し失敗:`, {
        status: response.status,
        statusText: response.statusText,
        url: url.replace(this.apiKey, "[HIDDEN]"),
        errorResponse: errorText,
      });

      if (response.status === 403) {
        throw new Error(`Google Sheets APIへのアクセスが拒否されました（403）。
考えられる原因：
1. APIキーにGoogle Sheets APIの権限がない
2. スプレッドシートが非公開設定になっている
3. Google Cloud ConsoleでSheets APIが有効になっていない
スプレッドシートを「リンクを知っている全員が閲覧可能」に設定するか、適切なAPIキーを使用してください。`);
      }

      throw new Error(`HTTP error! status: ${response.status.toString()}`);
    }

    const data = (await response.json()) as { values?: string[][] };
    return data.values || [];
  } // 生データをPOI形式に変換
  private convertToPOI(row: string[], id: string, sheetName: string): POI | null {
    try {
      // 列定数を使用してデータを取得
      const district = row[this.COLUMNS.DISTRICT] || "";
      const coordinates = row[this.COLUMNS.COORDINATES] || "";
      const name = row[this.COLUMNS.NAME] || "";
      const genre = row[this.COLUMNS.GENRE] || "";
      const parking = row[this.COLUMNS.PARKING] || "";
      const cashless = row[this.COLUMNS.CASHLESS] || "";
      const monday = row[this.COLUMNS.MONDAY] || "";
      const tuesday = row[this.COLUMNS.TUESDAY] || "";
      const wednesday = row[this.COLUMNS.WEDNESDAY] || "";
      const thursday = row[this.COLUMNS.THURSDAY] || "";
      const friday = row[this.COLUMNS.FRIDAY] || "";
      const saturday = row[this.COLUMNS.SATURDAY] || "";
      const sunday = row[this.COLUMNS.SUNDAY] || "";
      const holiday = row[this.COLUMNS.HOLIDAY] || "";
      const closedDays = row[this.COLUMNS.CLOSED_DAYS] || "";
      const relatedInfo = row[this.COLUMNS.RELATED_INFO] || "";
      const googleMapsUrl = row[this.COLUMNS.GOOGLE_MAPS] || "";
      const contact = row[this.COLUMNS.CONTACT] || "";
      const address = row[this.COLUMNS.ADDRESS] || "";
      if (!name.trim() || !coordinates.trim()) {
        return null;
      }

      // 座標データを解析（経度,緯度 形式）
      const [longitudeStr, latitudeStr] = coordinates.split(",");
      if (!longitudeStr || !latitudeStr) {
        return null;
      }

      const longitude = parseFloat(longitudeStr.trim()); // 東経
      const latitude = parseFloat(latitudeStr.trim()); // 北緯

      if (isNaN(latitude) || isNaN(longitude)) {
        return null;
      }

      // POIオブジェクトを構築
      const poi: POI = {
        id,
        name: name.trim(),
        position: { lat: latitude, lng: longitude },
        genre: genre.trim() || "その他",
        sourceSheet: sheetName, // ソースシート情報を追加
      };

      // オプションフィールドを条件付きで追加

      if (relatedInfo.trim()) {
        poi.description = relatedInfo.trim();
      }

      if (address.trim()) {
        poi.address = address.trim();
      }

      if (contact.trim()) {
        poi.contact = contact.trim();
      }

      if (parking.trim()) {
        poi.parking = parking.trim();
      }

      // キャッシュレス対応の判定
      if (cashless.trim()) {
        const cashlessValue = cashless.trim().toLowerCase();
        poi.cashless =
          cashlessValue === "true" ||
          cashlessValue === "○" ||
          cashlessValue === "yes" ||
          cashlessValue === "可" ||
          cashlessValue === "あり";
      } // 営業時間の処理（曜日別情報を個別に保存）
      const businessHours: Record<string, string> = {};

      if (monday.trim()) businessHours["月"] = monday.trim();
      if (tuesday.trim()) businessHours["火"] = tuesday.trim();
      if (wednesday.trim()) businessHours["水"] = wednesday.trim();
      if (thursday.trim()) businessHours["木"] = thursday.trim();
      if (friday.trim()) businessHours["金"] = friday.trim();
      if (saturday.trim()) businessHours["土"] = saturday.trim();
      if (sunday.trim()) businessHours["日"] = sunday.trim();
      if (holiday.trim()) businessHours["祝"] = holiday.trim();
      if (closedDays.trim()) businessHours["定休日"] = closedDays.trim();

      // 営業時間データが存在する場合のみ設定
      if (Object.keys(businessHours).length > 0) {
        poi.businessHours = businessHours;
      }

      // Google Maps URLの処理（スプレッドシートから提供される場合とデフォルト生成）
      if (googleMapsUrl.trim()) {
        poi.googleMapsUrl = googleMapsUrl.trim();
      } else if (latitude && longitude) {
        poi.googleMapsUrl = `https://www.google.com/maps?q=${latitude.toString()},${longitude.toString()}`;
      }

      // 地区情報を追加の情報として保存
      if (district.trim()) {
        poi.district = district.trim();
      }

      return poi;
    } catch (error) {
      console.error("POI変換エラー:", row, error);
      return null;
    }
  } // 複数シートからPOIデータを取得（推奨シート優先）
  async fetchAllPOIs(): Promise<POI[]> {
    const poiMap = new Map<string, POI>();
    const recommendedSheetName = "recommended"; // VITE_SHEET_RECOMMENDEDの名前

    // まず推奨シート以外のすべてのシートからデータを取得
    for (const config of this.sheetConfigs) {
      if (config.name === recommendedSheetName) continue; // 推奨シートはスキップ

      try {
        const range = "AB2:AX1000"; // 必要な列（AB〜AX）のみを取得
        const rows = await this.fetchSheetData(config.name, range);

        rows.forEach((row, index) => {
          const poi = this.convertToPOI(row, `${config.name}-${String(index + 1)}`, config.name);
          if (poi) {
            const uniqueKey = this.generatePOIKey(poi);
            poiMap.set(uniqueKey, poi);
          }
        });
      } catch (error) {
        console.error(`シート "${config.name}" の取得に失敗:`, error);
        // エラーが発生してもその他のシートの処理は続行
      }
    }

    // 次に推奨シートのデータを取得し、重複する場合は上書き
    const recommendedConfig = this.sheetConfigs.find(
      (config) => config.name === recommendedSheetName,
    );
    if (recommendedConfig) {
      try {
        const range = "AB2:AX1000";
        const rows = await this.fetchSheetData(recommendedConfig.name, range);

        rows.forEach((row, index) => {
          const poi = this.convertToPOI(
            row,
            `${recommendedConfig.name}-${String(index + 1)}`,
            recommendedConfig.name,
          );
          if (poi) {
            const uniqueKey = this.generatePOIKey(poi);
            const existingPOI = poiMap.get(uniqueKey);

            if (existingPOI) {
              // 推奨シートで既存データを上書き（ログ出力なし）
            }

            // 推奨シートのデータで既存データを上書き（優先）
            poiMap.set(uniqueKey, poi);
          }
        });
      } catch (error) {
        console.error(`推奨シート "${recommendedConfig.name}" の取得に失敗:`, error);
      }
    }

    return Array.from(poiMap.values());
  }

  // POIの一意キーを生成（名前と座標の組み合わせ）
  private generatePOIKey(poi: POI): string {
    // 名前を正規化（空白、記号を除去して比較）
    const normalizedName = poi.name.replace(/[\s\-_・]/g, "").toLowerCase();
    // 座標を小数点以下4桁で丸めて比較（GPS精度の範囲内）
    const lat = Math.round(poi.position.lat * 10000) / 10000;
    const lng = Math.round(poi.position.lng * 10000) / 10000;
    return `${normalizedName}_${lat.toString()}_${lng.toString()}`;
  }

  // CSVテキストを解析してstring[][]に変換
  private parseCSV(csvText: string): string[][] {
    const lines = csvText.split("\n");
    const data: string[][] = [];

    for (const line of lines) {
      if (line.trim()) {
        // 簡単なCSVパース（カンマ区切り、基本的な引用符対応）
        const row = this.parseCSVLine(line);
        data.push(row);
      }
    }

    return data;
  }

  // 1行のCSVを解析
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // 次の文字も"の場合はエスケープされた"
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // 次の"をスキップ
        } else {
          inQuotes = false;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else if (char) {
        current += char;
      }
    }

    // 最後のフィールドを追加
    result.push(current.trim());

    return result;
  }
}

// シングルトンインスタンス
const sheetsService = new SheetsService();

// サンプルデータ（APIが利用できない場合のフォールバック）
export const samplePOIs: POI[] = [
  {
    id: "sample-1",
    name: "佐渡金山",
    position: { lat: 38.0494, lng: 138.2285 },
    genre: "観光地",
    description: "江戸時代の金山遺跡",
  },
  {
    id: "sample-2",
    name: "トキの森公園",
    position: { lat: 38.0666, lng: 138.3871 },
    genre: "観光地",
    description: "トキの保護センター",
  },
  {
    id: "sample-3",
    name: "両津港",
    position: { lat: 38.0795, lng: 138.4371 },
    genre: "交通",
    description: "佐渡島の玄関口",
  },
];

// POI データを取得する関数（キャッシュとフォールバックを組み合わせ）
export const fetchPOIs = async (): Promise<POI[]> => {
  const CACHE_KEY = "all_pois"; // まずキャッシュから取得を試行
  const cachedPOIs = cacheService.getTyped(CACHE_KEY, isPOIArray);
  if (cachedPOIs) {
    console.log(`キャッシュから${String(cachedPOIs.length)}件のPOIを取得しました`);
    return cachedPOIs;
  }

  try {
    // 実際のGoogle Sheets APIからデータを取得を試行
    const pois = await sheetsService.fetchAllPOIs();

    if (pois.length > 0) {
      console.log(`Sheets APIから${String(pois.length)}件のPOIを取得しました`);
      // 成功時はキャッシュに保存（5分間）
      cacheService.set(CACHE_KEY, pois, 5 * 60 * 1000);
      return pois;
    } else {
      console.warn("Sheets APIからデータを取得できませんでした。サンプルデータを使用します。");
      return samplePOIs;
    }
  } catch (error) {
    console.error("POIデータの取得に失敗しました。サンプルデータを使用します:", error);
    // APIが失敗した場合はサンプルデータを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(samplePOIs);
      }, 100);
    });
  }
};

export { sheetsService };
