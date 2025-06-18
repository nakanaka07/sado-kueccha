/**
 * POI（Point of Interest）関連の型定義
 * 地図上の興味地点を表現する型安全な実装
 */

import type { Brand, Result, TimestampMs } from "./common";
import type { LatLngLiteral } from "./google-maps";

// POI関連のブランド型
export type POIId = Brand<string, "POIId">;
export type ClusterPOIId = Brand<string, "ClusterPOIId">;
export type GenreId = Brand<string, "GenreId">;
export type DistrictId = Brand<string, "DistrictId">;

/**
 * 営業時間の詳細定義
 */
export interface BusinessHoursPeriod {
  readonly start: string; // "HH:MM" format
  readonly end: string; // "HH:MM" format
}

export interface DailyBusinessHours {
  readonly periods: readonly BusinessHoursPeriod[];
  readonly is24Hours?: boolean;
  readonly isClosed?: boolean;
  readonly note?: string;
}

/**
 * 週間営業時間の型定義
 */
export interface WeeklyBusinessHours {
  readonly monday?: DailyBusinessHours;
  readonly tuesday?: DailyBusinessHours;
  readonly wednesday?: DailyBusinessHours;
  readonly thursday?: DailyBusinessHours;
  readonly friday?: DailyBusinessHours;
  readonly saturday?: DailyBusinessHours;
  readonly sunday?: DailyBusinessHours;
  readonly lastUpdated?: TimestampMs;
}

/**
 * POIの連絡先情報
 */
export interface ContactInfo {
  readonly phone?: string;
  readonly email?: string;
  readonly website?: string;
  readonly socialMedia?: {
    readonly facebook?: string;
    readonly instagram?: string;
    readonly twitter?: string;
    readonly line?: string;
  };
}

/**
 * POIの詳細情報
 */
export interface POIDetails {
  readonly description?: string;
  readonly features?: readonly string[];
  readonly tags?: readonly string[];
  readonly images?: readonly string[];
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly priceRange?: "budget" | "moderate" | "expensive" | "luxury";
  readonly accessibility?: {
    readonly wheelchairAccessible?: boolean;
    readonly hasParking?: boolean;
    readonly hasToilet?: boolean;
    readonly hasWifi?: boolean;
  };
}

/**
 * 基本POI型定義
 * 地図上の興味地点を表現する中核的な型
 */
export interface POI {
  readonly id: POIId;
  readonly name: string;
  readonly position: LatLngLiteral;
  readonly genre: GenreId;
  readonly district?: DistrictId;
  readonly sourceSheet?: string;
  readonly address?: string;
  readonly contact?: ContactInfo;
  readonly businessHours?: WeeklyBusinessHours;
  readonly details?: POIDetails;
  readonly parking?: string;
  readonly cashless?: boolean;
  readonly googleMapsUrl?: string;
  readonly createdAt?: TimestampMs;
  readonly updatedAt?: TimestampMs;
  readonly version?: string;
}

/**
 * POIクラスター型定義
 * 複数のPOIをまとめたクラスター情報
 */
export interface POICluster {
  readonly id: ClusterPOIId;
  readonly center: LatLngLiteral;
  readonly size: number;
  readonly pois: readonly POI[];
  readonly bounds?: google.maps.LatLngBounds;
  readonly level: number; // クラスターの階層レベル
  readonly priority?: "high" | "medium" | "low";
  readonly metadata?: {
    readonly averageRating?: number;
    readonly popularGenres?: readonly GenreId[];
    readonly hasRecommended?: boolean;
  };
}

/**
 * クラスタリング可能なPOI型定義
 * マーカークラスタリングで使用
 */
export interface ClusterablePOI extends POI {
  readonly clusterSize?: number;
  readonly offset?: LatLngLiteral;
  readonly originalPois?: readonly POI[];
  readonly center?: LatLngLiteral;
  readonly weight?: number; // クラスタリング重み
  readonly minZoom?: number; // このPOIが表示される最小ズームレベル
  readonly maxZoom?: number; // このPOIが表示される最大ズームレベル
}

/**
 * 営業時間の解析済みデータ
 * より具体的な営業状態を表現
 */
export type ParsedHours =
  | { readonly type: "closed" }
  | { readonly type: "24h" }
  | { readonly type: "unknown" }
  | {
      readonly type: "multiple";
      readonly periods: ReadonlyArray<{ readonly start: number; readonly end: number }>;
    }
  | { readonly type: "normal"; readonly start: number; readonly end: number }
  | { readonly type: "irregular"; readonly note: string };

/**
 * 営業ステータスの種類
 * より詳細なステータス表現
 */
export type StatusType =
  | "open"
  | "closed"
  | "unknown"
  | "24h"
  | "time-outside"
  | "confirmation-needed"
  | "temporarily-closed"
  | "permanently-closed"
  | "opening-soon"
  | "closing-soon";

/**
 * 営業時間表示用の情報
 * ユーザーへの表示情報を包括
 */
export interface BusinessHoursInfo {
  readonly isOpen: boolean;
  readonly currentStatus: string;
  readonly statusType: StatusType;
  readonly todayHours: string;
  readonly shouldShowTodayHours: boolean;
  readonly nextStatusChange?: {
    readonly time: string;
    readonly status: StatusType;
  };
  readonly confidence: number; // 情報の信頼度 (0-1)
}

/**
 * ステータス設定の型定義
 * UI表示用の設定情報
 */
export interface StatusConfig {
  readonly text: string;
  readonly icon: string;
  readonly colorClass: string;
  readonly ariaLabel: string;
  readonly priority: number; // 表示優先度
  readonly description?: string;
}

/**
 * POI検索・フィルタリング用の型
 */
export interface POISearchCriteria {
  readonly query?: string;
  readonly genres?: readonly GenreId[];
  readonly districts?: readonly DistrictId[];
  readonly bounds?: google.maps.LatLngBounds;
  readonly radius?: number; // メートル単位
  readonly center?: LatLngLiteral;
  readonly isOpen?: boolean;
  readonly hasParking?: boolean;
  readonly cashlessOnly?: boolean;
  readonly minRating?: number;
  readonly priceRange?: ReadonlyArray<POIDetails["priceRange"]>;
}

/**
 * POI検索結果の型
 */
export interface POISearchResult {
  readonly pois: readonly POI[];
  readonly total: number;
  readonly hasMore: boolean;
  readonly query: POISearchCriteria;
  readonly executionTime: number;
  readonly suggestions?: readonly string[];
}

/**
 * POI更新履歴の型
 */
export interface POIUpdateHistory {
  readonly poiId: POIId;
  readonly changes: ReadonlyArray<{
    readonly field: keyof POI;
    readonly oldValue: unknown;
    readonly newValue: unknown;
    readonly timestamp: TimestampMs;
    readonly source: string;
  }>;
}

/**
 * POI バリデーション結果
 */
export interface POIValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<{
    readonly field: keyof POI;
    readonly message: string;
    readonly severity: "error" | "warning" | "info";
  }>;
  readonly suggestions?: readonly string[];
}

// 型ガード関数
export const isPOI = (value: unknown): value is POI => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    "id" in candidate &&
    "name" in candidate &&
    "position" in candidate &&
    "genre" in candidate &&
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.genre === "string"
  );
};

export const isPOICluster = (value: unknown): value is POICluster => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    "id" in candidate &&
    "center" in candidate &&
    "size" in candidate &&
    "pois" in candidate &&
    typeof candidate.id === "string" &&
    typeof candidate.size === "number" &&
    Array.isArray(candidate.pois)
  );
};

export const isStatusType = (value: string): value is StatusType => {
  const validStatuses: StatusType[] = [
    "open",
    "closed",
    "unknown",
    "24h",
    "time-outside",
    "confirmation-needed",
    "temporarily-closed",
    "permanently-closed",
    "opening-soon",
    "closing-soon",
  ];
  return validStatuses.includes(value as StatusType);
};

/**
 * POI操作のヘルパー型
 */
export type POIOperation =
  | { type: "create"; poi: Omit<POI, "id" | "createdAt" | "updatedAt"> }
  | { type: "update"; id: POIId; changes: Partial<POI> }
  | { type: "delete"; id: POIId }
  | { type: "bulk_update"; updates: ReadonlyArray<{ id: POIId; changes: Partial<POI> }> };

/**
 * POI操作結果の型
 */
export type POIOperationResult = Result<
  POI | POI[] | null,
  {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  }
>;

/**
 * POIコンテキストの型定義
 */
export interface POIContextValue {
  readonly pois: readonly POI[];
  readonly clusters: readonly POICluster[];
  readonly loading: boolean;
  readonly error?: Error;
  readonly searchPOIs: (criteria: POISearchCriteria) => Promise<POISearchResult>;
  readonly getPOIById: (id: POIId) => POI | undefined;
  readonly updatePOI: (id: POIId, changes: Partial<POI>) => Promise<POIOperationResult>;
  readonly validatePOI: (poi: Partial<POI>) => POIValidationResult;
}
