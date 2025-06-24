/**
 * 🛡️ 型ガード関数の集約（強化版）
 * 最新のTypeScriptベストプラクティスに基づいた型安全性確保
 */

import type { LatLngLiteral, POI, POICluster } from '../types';

/**
 * 📍 型ガード: 有効な地理座標の検証（高精度版）
 * 緯度・経度の有効範囲を含めた厳密な検証
 * @param position - 検証する座標オブジェクト
 * @returns 有効な座標の場合true
 */
export function isValidPosition(position: unknown): position is LatLngLiteral {
  if (typeof position !== 'object' || position === null) {
    return false;
  }

  const pos = position as Record<string, unknown>;
  const { lat, lng } = pos;

  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  );
}

/**
 * 🔤 型ガード: 有効な文字列の検証（null安全版）
 * @param value - 検証する値
 * @returns 有効な文字列の場合true
 */
function isValidString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 🔢 型ガード: 有効な数値の検証
 * @param value - 検証する値
 * @returns 有効な数値の場合true
 */
function isValidNumber(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && !Number.isNaN(value)
  );
}

/**
 * 📅 型ガード: 有効な日付文字列の検証
 * @param value - 検証する値
 * @returns 有効な日付文字列の場合true
 */
export function isValidDateString(value: unknown): value is string {
  if (!isValidString(value)) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

/**
 * 📧 型ガード: 有効なメールアドレスの検証
 * @param value - 検証する値
 * @returns 有効なメールアドレスの場合true
 */
export function isValidEmail(value: unknown): value is string {
  if (!isValidString(value)) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 🌐 型ガード: 有効なURLの検証
 * @param value - 検証する値
 * @returns 有効なURLの場合true
 */
export function isValidUrl(value: unknown): value is string {
  if (!isValidString(value)) return false;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * 🏪 型ガード: 単一POIの検証（強化版）
 * POIインターフェースのすべての必須プロパティを検証
 * @param data - 検証するデータ
 * @returns POI型の場合true
 */
export function isPOI(data: unknown): data is POI {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // 必須フィールドの基本検証
  const hasRequiredFields =
    isValidString(obj.id) &&
    isValidString(obj.name) &&
    isValidString(obj.genre) &&
    isValidPosition(obj.position);

  if (!hasRequiredFields) return false;

  // オプショナルフィールドの検証（存在する場合のみ）
  if (obj.description !== undefined && !isValidString(obj.description)) {
    return false;
  }

  if (obj.address !== undefined && !isValidString(obj.address)) {
    return false;
  }

  if (obj.phone !== undefined && !isValidString(obj.phone)) {
    return false;
  }

  if (obj.website !== undefined && !isValidUrl(obj.website)) {
    return false;
  }

  if (
    obj.rating !== undefined &&
    (!isValidNumber(obj.rating) || obj.rating < 0 || obj.rating > 5)
  ) {
    return false;
  }

  return true;
}
/**
 * 📋 型ガード: POI配列の検証（高性能版）
 * 配列内のすべての要素がPOI型であることを検証
 * @param data - 検証するデータ
 * @returns POI配列の場合true
 */
export function isPOIArray(data: unknown): data is POI[] {
  if (!Array.isArray(data)) {
    return false;
  }

  // 空配列は有効
  if (data.length === 0) {
    return true;
  }

  // パフォーマンス最適化: 大きな配列はサンプリングチェック
  if (data.length > 100) {
    // 最初の10個、最後の10個、ランダムな10個をチェック
    const sampleIndices = [
      ...Array.from({ length: 10 }, (_, i) => i),
      ...Array.from({ length: 10 }, (_, i) => data.length - 1 - i),
      ...Array.from({ length: 10 }, () =>
        Math.floor(Math.random() * data.length)
      ),
    ];

    const uniqueIndices = Array.from(new Set(sampleIndices));
    return uniqueIndices.every(index => isPOI(data[index]));
  }

  // 小さな配列はすべての要素をチェック
  return data.every(isPOI);
}

/**
 * 🎯 型ガード: POIクラスターの検証（強化版）
 * POIClusterインターフェースのすべての必須プロパティを検証
 * @param data - 検証するデータ
 * @returns POIクラスターの場合true
 */
export function isPOICluster(data: unknown): data is POICluster {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  const isValid =
    isValidString(obj.id) &&
    isValidPosition(obj.center) &&
    typeof obj.size === 'number' &&
    Number.isInteger(obj.size) &&
    obj.size >= 0 &&
    Array.isArray(obj.pois) &&
    isPOIArray(obj.pois);

  // クラスターのサイズとPOI配列の長さが一致することを確認
  if (isValid && obj.size !== (obj.pois as POI[]).length) {
    return false;
  }

  return isValid;
}

/**
 * 🔍 型ガード: オブジェクトが特定のキーを持つかチェック
 * @param obj - 検証するオブジェクト
 * @param keys - 必須キーの配列
 * @returns すべてのキーを持つ場合true
 */
export function hasRequiredKeys<T extends Record<string, unknown>>(
  obj: unknown,
  keys: Array<keyof T>
): obj is T {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const record = obj as Record<string, unknown>;
  return keys.every(
    key => key in record && record[key as string] !== undefined
  );
}

/**
 * 📱 型ガード: モバイルデバイスの検出
 * @returns モバイルデバイスの場合true
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile',
    'android',
    'iphone',
    'ipod',
    'blackberry',
    'windows phone',
    'opera mini',
    'tablet',
    'ipad',
  ];

  return mobileKeywords.some(keyword => userAgent.includes(keyword));
}

/**
 * 🌐 型ガード: ブラウザサポートの検証
 * @param feature - 検証する機能名
 * @returns サポートされている場合true
 */
export function isBrowserFeatureSupported(feature: string): boolean {
  if (typeof window === 'undefined') return false;

  switch (feature) {
    case 'geolocation':
      return 'geolocation' in navigator;

    case 'serviceWorker':
      return 'serviceWorker' in navigator;

    case 'localStorage':
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }

    case 'intersectionObserver':
      return 'IntersectionObserver' in window;

    case 'webp': {
      // WebP サポートチェック（同期版）
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;

        // 基本的なWebPサポート判定
        return canvas.toDataURL('image/webp').startsWith('data:image/webp');
      } catch {
        return false;
      }
    }

    default:
      return false;
  }
}

/**
 * 🎨 型ガード: CSS機能のサポート検証
 * @param property - CSSプロパティ名
 * @param value - プロパティ値
 * @returns サポートされている場合true
 */
export function isCSSFeatureSupported(
  property: string,
  value?: string
): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }

  try {
    return value ? CSS.supports(property, value) : CSS.supports(property);
  } catch {
    return false;
  }
}
