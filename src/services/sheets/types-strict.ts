/**
 * 🎯 Google Sheets サービス厳密型定義
 *
 * @description 型安全性を最大限に強化したSheets API関連の型定義
 * @version 2.0.0 - 完全な型安全性対応
 */

import type { ContactInfo, GenreId, POICategory, POIId } from '../../types';

/**
 * ブランド型用の安全なキャスト関数
 */
export const createPOIId = (id: string): POIId => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid POI ID: must be a non-empty string');
  }
  return id.trim() as POIId;
};

export const createGenreId = (genre: string): GenreId => {
  if (!genre || typeof genre !== 'string' || genre.trim().length === 0) {
    throw new Error('Invalid Genre ID: must be a non-empty string');
  }
  return genre.trim() as GenreId;
};

export const createContactInfo = (contact: string): ContactInfo => {
  if (!contact || typeof contact !== 'string') {
    return { phone: '' };
  }
  return { phone: contact.trim() };
};

/**
 * 営業時間の型定義
 */
export interface OperatingHours {
  readonly monday?: string;
  readonly tuesday?: string;
  readonly wednesday?: string;
  readonly thursday?: string;
  readonly friday?: string;
  readonly saturday?: string;
  readonly sunday?: string;
  readonly holiday?: string;
}

/**
 * 時間形式の型定義
 */
export type TimeFormat = `${number}${number}:${number}${number}`;

/**
 * 時間バリデーター
 */
export const isValidTimeFormat = (time: string): time is TimeFormat => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

/**
 * 営業時間パーサー
 */
export function parseBusinessHours(
  hoursStr: string | undefined | null
): OperatingHours {
  if (!hoursStr || typeof hoursStr !== 'string' || hoursStr.trim() === '') {
    return {};
  }

  try {
    const cleaned = hoursStr.trim();

    // "定休日" や "休業" の場合
    if (/^(定休日|休業|closed|休み)$/i.test(cleaned)) {
      return {};
    }

    // "9:00-17:00" 形式の場合
    const timeRangePattern = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;
    const timeRangeResult = timeRangePattern.exec(cleaned);

    if (timeRangeResult) {
      const [, startHour, startMin, endHour, endMin] = timeRangeResult;

      if (startHour && startMin && endHour && endMin) {
        const start = `${startHour.padStart(2, '0')}:${startMin}`;
        const end = `${endHour.padStart(2, '0')}:${endMin}`;

        if (isValidTimeFormat(start) && isValidTimeFormat(end)) {
          const timeStr = `${start}-${end}`;
          return {
            monday: timeStr,
            tuesday: timeStr,
            wednesday: timeStr,
            thursday: timeStr,
            friday: timeStr,
            saturday: timeStr,
            sunday: timeStr,
          };
        }
      }
    }

    return {};
  } catch {
    return {};
  }
}

/**
 * カテゴリマッピング設定
 */
export const CATEGORY_MAPPING: Readonly<
  Record<POICategory, readonly string[]>
> = {
  recommended: ['おすすめ', 'recommended', '推奨'] as const,
  food: [
    'レストラン',
    '食事',
    '料理',
    'restaurant',
    'dining',
    'カフェ',
    'cafe',
    'ラーメン',
    'ramen',
  ] as const,
  sightseeing: ['観光', 'tourism', 'sightseeing', '見学'] as const,
  accommodation: ['宿泊', 'hotel', 'accommodation', 'ホテル', '旅館'] as const,
  transportation: ['交通', 'transport', 'station', '駅', 'バス'] as const,
  shopping: ['ショッピング', 'shopping', '買い物', '店舗'] as const,
  entertainment: [
    'バー',
    'bar',
    'スナック',
    'snack',
    '娯楽',
    'entertainment',
  ] as const,
  nature: ['自然', 'nature', '公園', 'park'] as const,
  culture: ['文化', 'culture', '博物館', 'museum'] as const,
  sports: ['スポーツ', 'sports', '運動'] as const,
  other: ['その他', 'other', 'トイレ', 'toilet', '駐車場', 'parking'] as const,
} as const;

/**
 * シート設定の型定義
 */
export interface SheetConfig {
  readonly name: string;
  readonly gid: string;
}

/**
 * シート設定のバリデーター
 */
export const isValidSheetConfig = (config: unknown): config is SheetConfig => {
  return (
    typeof config === 'object' &&
    config !== null &&
    'name' in config &&
    'gid' in config &&
    typeof (config as { name: unknown }).name === 'string' &&
    typeof (config as { gid: unknown }).gid === 'string' &&
    (config as { name: string }).name.trim().length > 0 &&
    (config as { gid: string }).gid.trim().length > 0
  );
};

/**
 * リクエストメタデータの型定義
 */
export interface RequestMetadata {
  readonly timestamp: number;
  readonly sheetName: string;
  readonly method: 'csv' | 'api';
  readonly requestId?: string;
  readonly userAgent?: string;
}

/**
 * ロード戦略の型定義
 */
export interface LoadStrategy {
  readonly sheetName: string;
  readonly priority: 'critical' | 'high' | 'normal' | 'low';
  readonly initialSize: number;
  readonly maxSize: number;
  readonly preload: boolean;
}

/**
 * パフォーマンス監視ログエントリの型定義
 */
export interface PerformanceLogEntry {
  readonly operation: string;
  readonly duration: number;
  readonly timestamp: number;
  readonly success?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * データ品質レポートの型定義
 */
export interface DataQualityReport {
  readonly totalRows: number;
  readonly validRows: number;
  readonly invalidRows: number;
  readonly successRate: number;
  readonly issues: readonly string[];
  readonly warnings: readonly string[];
  readonly processedAt: number;
}

/**
 * 座標のバリデーション
 */
export const validateCoordinates = (
  coordStr: string
): { lat: number; lng: number } | null => {
  if (!coordStr || typeof coordStr !== 'string') return null;

  const trimmed = coordStr.trim();

  // "緯度,経度" 形式をチェック
  const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
  const coordResult = coordPattern.exec(trimmed);

  if (!coordResult) return null;

  const latStr = coordResult[1];
  const lngStr = coordResult[2];

  if (!latStr || !lngStr) return null;

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  // 緯度・経度の範囲チェック
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

  return { lat, lng };
};

/**
 * カテゴリ判定関数
 */
export const categorizeFromGenre = (genre: string): POICategory => {
  if (!genre || typeof genre !== 'string') return 'other';

  const normalized = genre.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(keyword => normalized.includes(keyword.toLowerCase()))) {
      return category as POICategory;
    }
  }

  return 'other';
};

/**
 * 型ガード：POIカテゴリかどうかをチェック
 */
export const isPOICategory = (value: unknown): value is POICategory => {
  return typeof value === 'string' && value in CATEGORY_MAPPING;
};

/**
 * 型ガード：文字列かどうかをチェック
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * 型ガード：文字列配列かどうかをチェック
 */
export const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
};

/**
 * 安全な文字列取得ヘルパー
 */
export const safeGetString = (value: unknown, defaultValue = ''): string => {
  return isString(value) ? value.trim() : defaultValue;
};

/**
 * 必須フィールドチェック
 */
export const hasRequiredFields = (
  name: unknown,
  coordinates: unknown,
  genre: unknown
): boolean => {
  return Boolean(
    isString(name) &&
      name.trim().length > 0 &&
      isString(coordinates) &&
      coordinates.trim().length > 0 &&
      isString(genre) &&
      genre.trim().length > 0
  );
};
