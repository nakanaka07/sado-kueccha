/**
 * 🔧 Google Sheets 設定・定数定義
 *
 * @description シート設定、列マッピング、戦略定義を一元管理
 * @version 1.1.0 - 統合設定への移行
 */

import { CACHE_CONFIG, SHEETS_DATA_CONFIG } from '../config';

// 統合設定からの再エクスポート
export { GOOGLE_SHEETS_API, LOAD_STRATEGIES } from '../config';

// 後方互換性のためのエイリアス
const { COLUMNS, CASHLESS_TRUE_VALUES, DEFAULT_RANGE } = SHEETS_DATA_CONFIG;
const { TTL: CACHE_TTL } = CACHE_CONFIG;

export { CACHE_TTL, CASHLESS_TRUE_VALUES, COLUMNS, DEFAULT_RANGE };
