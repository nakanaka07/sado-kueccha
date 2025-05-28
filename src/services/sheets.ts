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
  private sheetNameMap: Map<string, string>;

  constructor() {
    this.apiKey = String(
      import.meta.env["VITE_GOOGLE_SHEETS_API_KEY"] ||
        import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] ||
        "",
    );
    this.spreadsheetId = String(import.meta.env["VITE_GOOGLE_SPREADSHEET_ID"] || ""); // .envからシート設定を読み込み
    this.sheetConfigs = [
      this.parseSheetConfig(import.meta.env["VITE_SHEET_RECOMMENDED"] || ""),
      this.parseSheetConfig(import.meta.env["VITE_SHEET_RYOTSU_AIKAWA"] || ""),
      this.parseSheetConfig(import.meta.env["VITE_SHEET_KANAI_SAWADA"] || ""),
      this.parseSheetConfig(import.meta.env["VITE_SHEET_AKADOMARI_HAMOCHI"] || ""),
      this.parseSheetConfig(import.meta.env["VITE_SHEET_SNACK"] || ""),
      this.parseSheetConfig(import.meta.env["VITE_SHEET_TOILET"] || ""),
      this.parseSheetConfig(import.meta.env["VITE_SHEET_PARKING"] || ""),
    ].filter((config): config is { name: string; gid: string } => config !== null);

    // シート名のマッピング（英語名から日本語名への変換）
    this.sheetNameMap = new Map([
      ["recommended", "おすすめ"],
      ["ryotsu_aikawa", "両津・相川地区"],
      ["kanai_sawada", "金井・佐和田・新穂・畑野・真野地区"],
      ["akadomari_hamochi", "赤泊・羽茂・小木地区"],
      ["snack", "スナック"],
      ["toilet", "公共トイレ"],
      ["parking", "駐車場"],
    ]);
  }
  // シート設定文字列を解析（例: "おすすめ:1043711248"）
  private parseSheetConfig(configStr: string): { name: string; gid: string } | null {
    if (!configStr) return null;
    const [name, gid] = configStr.split(":");
    return name && gid ? { name: name.trim(), gid: gid.trim() } : null;
  }
  // シート名の解決（英語名または日本語名を受け取り、日本語名を返す）
  private resolveSheetName(inputName: string): string {
    // 英語名から日本語名への変換を試行
    const mappedName = this.sheetNameMap.get(inputName);
    if (mappedName) {
      return mappedName;
    }
    // 日本語名の場合はそのまま返す
    return inputName;
  }

  // 設定から英語キーを取得（設定検索用）
  private getConfigKey(sheetName: string): string {
    // 日本語名から英語キーを逆引きする
    for (const [englishKey, japaneseName] of this.sheetNameMap.entries()) {
      if (japaneseName === sheetName) {
        return englishKey;
      }
    }
    // 英語キーの場合はそのまま返す
    return sheetName;
  } // スプレッドシートからデータを取得（まずCSV形式を試し、失敗したらAPI形式を試す）
  async fetchSheetData(sheetName: string, range: string): Promise<string[][]> {
    // 最初にCSV形式で取得を試行（公開スプレッドシートの場合はこれで動作する）
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

    // シート名を解決（英語名→日本語名）
    const resolvedSheetName = this.resolveSheetName(sheetName);

    // 設定検索用のキーを取得（英語キー）
    const configKey = this.getConfigKey(resolvedSheetName);

    // 設定から対応するGIDを取得（英語キーで検索）
    const sheetConfig = this.sheetConfigs.find((config) => config.name === configKey);
    if (!sheetConfig) {
      console.warn(
        `利用可能な設定:`,
        this.sheetConfigs.map((c) => c.name),
      );
      throw new Error(`シート "${configKey}" (${resolvedSheetName}) の設定が見つかりません。`);
    }
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${sheetConfig.gid}&range=AB:AX`;
    try {
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`CSV取得失敗: ${response.status.toString()} ${response.statusText}`);
      }
      const csvText = await response.text();
      const data: string[][] = this.parseCSV(csvText); // ヘッダー行をスキップ（A2:Z1000の範囲に合わせる）
      return data.slice(1); // ヘッダー行をスキップ
    } catch (error) {
      console.error(`CSV取得エラー:`, error);
      throw error;
    }
  }
  // API形式でスプレッドシートからデータを取得（従来の方法）
  private async fetchSheetDataViaAPI(sheetName: string, range: string): Promise<string[][]> {
    // APIキーとスプレッドシートIDのチェック
    if (!this.apiKey) {
      throw new Error(
        "Google Sheets APIキーが設定されていません。環境変数 VITE_GOOGLE_SHEETS_API_KEY または VITE_GOOGLE_MAPS_API_KEY を設定してください。",
      );
    }

    if (!this.spreadsheetId) {
      throw new Error(
        "スプレッドシートIDが設定されていません。環境変数 VITE_GOOGLE_SPREADSHEET_ID を設定してください。",
      );
    } // シート名を解決（英語名→日本語名）
    const resolvedSheetName = this.resolveSheetName(sheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${encodeURIComponent(resolvedSheetName)}!${range}?key=${this.apiKey}`;
    try {
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
    } catch (error) {
      console.error("Sheets API呼び出しエラー:", error);
      throw error;
    }
  }
  // 生データをPOI形式に変換
  private convertToPOI(row: string[], id: string): POI | null {
    try {
      // 実際の列構成（AB〜AXの範囲で0-indexedの配列）:
      // AB列(0): 地区（入力）, AF列(4): 座標（経度,緯度）, AG列(5): 名称, AH列(6): ジャンル, AI列(7): カテゴリー
      // AJ列(8): 駐車場情報, AK列(9): キャッシュレス, AL列(10): 月曜, AM列(11): 火曜, AN列(12): 水曜, AO列(13): 木曜, AP列(14): 金曜
      // AQ列(15): 土曜, AR列(16): 日曜, AS列(17): 祝祭, AT列(18): 定休日について, AU列(19): 関連情報, AV列(20): Google マップで見る
      // AW列(21): 問い合わせ, AX列(22): 所在地

      // AB〜AX範囲での列番号（0-indexed）
      const district = row[0] || ""; // AB列: 地区（入力）
      const coordinates = row[4] || ""; // AF列: 座標（経度,緯度）
      const name = row[5] || ""; // AG列: 名称
      const genre = row[6] || ""; // AH列: ジャンル
      const category = row[7] || ""; // AI列: カテゴリー
      const parking = row[8] || ""; // AJ列: 駐車場情報
      const cashless = row[9] || ""; // AK列: キャッシュレス
      const monday = row[10] || ""; // AL列: 月曜
      const tuesday = row[11] || ""; // AM列: 火曜
      const wednesday = row[12] || ""; // AN列: 水曜
      const thursday = row[13] || ""; // AO列: 木曜
      const friday = row[14] || ""; // AP列: 金曜
      const saturday = row[15] || ""; // AQ列: 土曜
      const sunday = row[16] || ""; // AR列: 日曜
      const holiday = row[17] || ""; // AS列: 祝祭
      const closedDays = row[18] || ""; // AT列: 定休日について
      const relatedInfo = row[19] || ""; // AU列: 関連情報
      const googleMapsUrl = row[20] || ""; // AV列: Google マップで見る
      const contact = row[21] || ""; // AW列: 問い合わせ
      const address = row[22] || ""; // AX列: 所在地

      // 必須フィールドのチェック
      if (!name.trim() || !coordinates.trim()) {
        return null;
      } // AF列の座標データを解析（経度,緯度 形式）
      const coordParts = coordinates.split(",");
      if (coordParts.length !== 2 || !coordParts[0] || !coordParts[1]) {
        return null;
      }
      const longitudeStr = coordParts[0].trim();
      const latitudeStr = coordParts[1].trim();
      const longitude = parseFloat(longitudeStr); // 東経
      const latitude = parseFloat(latitudeStr); // 北緯

      if (isNaN(latitude) || isNaN(longitude)) {
        return null;
      }

      // POIオブジェクトを構築
      const poi: POI = {
        id,
        name: name.trim(),
        position: { lat: latitude, lng: longitude },
        genre: genre.trim() || "その他",
      };

      // オプションフィールドを条件付きで追加
      if (category.trim()) {
        poi.category = category.trim();
      }

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
      }

      // 営業時間の処理（曜日別情報を統合）
      const businessHoursData: string[] = [];
      if (monday.trim()) businessHoursData.push(`月: ${monday.trim()}`);
      if (tuesday.trim()) businessHoursData.push(`火: ${tuesday.trim()}`);
      if (wednesday.trim()) businessHoursData.push(`水: ${wednesday.trim()}`);
      if (thursday.trim()) businessHoursData.push(`木: ${thursday.trim()}`);
      if (friday.trim()) businessHoursData.push(`金: ${friday.trim()}`);
      if (saturday.trim()) businessHoursData.push(`土: ${saturday.trim()}`);
      if (sunday.trim()) businessHoursData.push(`日: ${sunday.trim()}`);
      if (holiday.trim()) businessHoursData.push(`祝: ${holiday.trim()}`);
      if (closedDays.trim()) businessHoursData.push(`定休日: ${closedDays.trim()}`);

      if (businessHoursData.length > 0) {
        poi.businessHours = {
          general: businessHoursData.join(", "),
        };
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
  }
  // 複数シートからPOIデータを取得
  async fetchAllPOIs(): Promise<POI[]> {
    const allPOIs: POI[] = [];

    for (const config of this.sheetConfigs) {
      try {
        const range = "AB2:AX1000"; // 必要な列（AB〜AX）のみを取得
        // 設定の英語キーから日本語名に変換してAPIを呼び出す
        const japaneseName = this.sheetNameMap.get(config.name) || config.name;
        const rows = await this.fetchSheetData(japaneseName, range);

        rows.forEach((row, index) => {
          const poi = this.convertToPOI(row, `${config.name}-${String(index + 1)}`);
          if (poi) {
            allPOIs.push(poi);
          }
        });
      } catch (error) {
        console.error(`シート "${config.name}" の取得に失敗:`, error);
        // エラーが発生してもその他のシートの処理は続行
      }
    }

    return allPOIs;
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
