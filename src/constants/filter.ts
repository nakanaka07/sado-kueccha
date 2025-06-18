/**
 * 🔍 フィルター・検索システム - 2025年最新実装
 *
 * @description
 * - 高性能フィルタリングエンジン
 * - 型安全なプリセット管理
 * - アクセシビリティ対応UI
 * - リアルタイム統計情報
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { FilterOption, FilterPreset, FilterState, PresetConfig } from "../types/filter";

/**
 * デフォルトフィルター状態
 *
 * @description 初期表示時の最適な設定
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  showToilets: false,
  showParking: false,
  showRecommended: true,
  showRyotsuAikawa: true,
  showKanaiSawada: true,
  showAkadomariHamochi: true,
  showSnacks: false,
  enableClustering: true,
} as const satisfies FilterState;

/**
 * フィルターオプション定義
 *
 * @description ユーザーが選択可能なフィルター項目
 */
export const FILTER_OPTIONS: readonly FilterOption[] = [
  // 施設関連
  {
    key: "showToilets",
    icon: "🚻",
    description: "トイレ施設を表示",
    category: "facilities",
    priority: 1,
    accessibilityLabel: "トイレ施設の表示切り替え",
  },
  {
    key: "showParking",
    icon: "🅿️",
    description: "駐車場を表示",
    category: "facilities",
    priority: 2,
    accessibilityLabel: "駐車場の表示切り替え",
  },

  // グルメ・観光関連
  {
    key: "showRecommended",
    icon: "⭐",
    description: "おすすめスポットを表示",
    category: "dining",
    priority: 3,
    accessibilityLabel: "おすすめスポットの表示切り替え",
  },
  {
    key: "showRyotsuAikawa",
    icon: "🏔️",
    description: "両津・相川\nエリアを表示",
    category: "dining",
    priority: 4,
    accessibilityLabel: "両津・相川エリアの表示切り替え",
  },
  {
    key: "showKanaiSawada",
    icon: "🌾",
    description: "金井・佐和田・新穂・畑野・真野\nエリアを表示",
    category: "dining",
    priority: 5,
    accessibilityLabel: "中央エリアの表示切り替え",
  },
  {
    key: "showAkadomariHamochi",
    icon: "🌊",
    description: "赤泊・羽茂・小木\nエリアを表示",
    category: "dining",
    priority: 6,
    accessibilityLabel: "南部エリアの表示切り替え",
  },

  // ナイトライフ
  {
    key: "showSnacks",
    icon: "🍻",
    description: "スナック営業店舗を表示",
    category: "nightlife",
    priority: 7,
    accessibilityLabel: "スナック営業店舗の表示切り替え",
  },
] as const satisfies readonly FilterOption[];

/**
 * カテゴリ別グループ化
 *
 * @description フィルターオプションの論理的分類
 */
export const FILTER_CATEGORIES = [
  {
    id: "facilities" as const,
    label: "施設",
    icon: "🏢",
    description: "基本的な施設・インフラ",
    options: FILTER_OPTIONS.filter((option) => option.category === "facilities"),
    collapsible: true,
    defaultExpanded: false,
  },
  {
    id: "dining" as const,
    label: "グルメ",
    icon: "🍽️",
    description: "飲食店・観光スポット",
    options: FILTER_OPTIONS.filter((option) => option.category === "dining"),
    collapsible: true,
    defaultExpanded: true,
  },
  {
    id: "nightlife" as const,
    label: "ナイトライフ",
    icon: "🍸",
    description: "夜間営業・大人向け施設",
    options: FILTER_OPTIONS.filter((option) => option.category === "nightlife"),
    collapsible: true,
    defaultExpanded: false,
  },
] as const;

/**
 * データソースマッピング
 *
 * @description Google Sheetsとフィルターの対応関係
 */
export const SHEET_FILTER_MAPPING: Readonly<Record<string, keyof FilterState>> = {
  // 施設系
  toilets: "showToilets",
  parking: "showParking",

  // 地域系
  recommended: "showRecommended",
  ryotsu_aikawa: "showRyotsuAikawa",
  kanai_sawada: "showKanaiSawada",
  akadomari_hamochi: "showAkadomariHamochi",

  // 特殊カテゴリ
  snacks: "showSnacks",

  // エイリアス（下位互換性）
  ryotsu: "showRyotsuAikawa",
  aikawa: "showRyotsuAikawa",
  kanai: "showKanaiSawada",
  sawada: "showKanaiSawada",
  akadomari: "showAkadomariHamochi",
  hamochi: "showAkadomariHamochi",
  ogi: "showAkadomariHamochi",
} as const;

/**
 * フィルタープリセット設定
 *
 * @description よく使用される組み合わせの事前定義
 */
export const PRESET_CONFIGS: Readonly<Record<FilterPreset, PresetConfig>> = {
  // 全表示
  all: {
    name: "すべて表示",
    description: "すべてのカテゴリを表示",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showToilets: true,
      showParking: true,
      showRecommended: true,
      showRyotsuAikawa: true,
      showKanaiSawada: true,
      showAkadomariHamochi: true,
      showSnacks: true,
    },
    metadata: {
      createdAt: Date.now(),
      version: "2.0.0",
      tags: ["comprehensive", "complete"],
    },
  },

  // グルメ特化
  gourmet: {
    name: "グルメスポット",
    description: "飲食店・観光スポット中心",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showToilets: false,
      showParking: false,
      showRecommended: true,
      showRyotsuAikawa: true,
      showKanaiSawada: true,
      showAkadomariHamochi: true,
      showSnacks: false,
    },
    metadata: {
      createdAt: Date.now(),
      version: "2.0.0",
      tags: ["dining", "tourism", "popular"],
    },
  },

  // 施設特化
  facilities: {
    name: "基本施設",
    description: "トイレ・駐車場等の基本施設",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showToilets: true,
      showParking: true,
      showRecommended: false,
      showRyotsuAikawa: false,
      showKanaiSawada: false,
      showAkadomariHamochi: false,
      showSnacks: false,
    },
    metadata: {
      createdAt: Date.now(),
      version: "2.0.0",
      tags: ["infrastructure", "essential"],
    },
  },

  // ナイトライフ特化
  nightlife: {
    name: "ナイトライフ",
    description: "夜間営業店舗中心",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showToilets: false,
      showParking: false,
      showRecommended: false,
      showRyotsuAikawa: false,
      showKanaiSawada: false,
      showAkadomariHamochi: false,
      showSnacks: true,
    },
    metadata: {
      createdAt: Date.now(),
      version: "2.0.0",
      tags: ["nightlife", "adult", "evening"],
    },
  },

  // 非表示
  none: {
    name: "すべて非表示",
    description: "すべてのマーカーを非表示",
    overrides: {
      showToilets: false,
      showParking: false,
      showRecommended: false,
      showRyotsuAikawa: false,
      showKanaiSawada: false,
      showAkadomariHamochi: false,
      showSnacks: false,
    },
    metadata: {
      createdAt: Date.now(),
      version: "2.0.0",
      tags: ["minimal", "clean"],
    },
  },

  // デフォルト
  default: {
    name: "デフォルト",
    description: "初期設定",
    overrides: DEFAULT_FILTER_STATE,
    metadata: {
      createdAt: Date.now(),
      version: "2.0.0",
      tags: ["default", "recommended"],
    },
  },
} as const satisfies Readonly<Record<FilterPreset, PresetConfig>>;

/**
 * フィルター操作設定
 *
 * @description ユーザー操作の動作制御
 */
export const FILTER_BEHAVIOR = {
  /** @description 操作応答性 */
  RESPONSIVENESS: {
    /** @description デバウンス遅延（ミリ秒） */
    DEBOUNCE_DELAY: 300,
    /** @description アニメーション時間（ミリ秒） */
    ANIMATION_DURATION: 200,
    /** @description フィルター適用遅延（ミリ秒） */
    APPLY_DELAY: 100,
  },

  /** @description UI動作 */
  UI: {
    /** @description 自動折りたたみ有効 */
    AUTO_COLLAPSE: true,
    /** @description 選択状態の保持 */
    PRESERVE_STATE: true,
    /** @description ローカルストレージ保存 */
    SAVE_TO_STORAGE: true,
    /** @description クリア時の確認 */
    CONFIRM_CLEAR: false,
  },

  /** @description パフォーマンス */
  PERFORMANCE: {
    /** @description バッチ処理サイズ */
    BATCH_SIZE: 50,
    /** @description 仮想化閾値 */
    VIRTUALIZATION_THRESHOLD: 100,
    /** @description 最大同時処理数 */
    MAX_CONCURRENT: 3,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * 検索・ソート設定
 *
 * @description フィルター結果の処理方法
 */
export const FILTER_PROCESSING = {
  /** @description 検索設定 */
  SEARCH: {
    /** @description 最小検索文字数 */
    MIN_QUERY_LENGTH: 2,
    /** @description 最大検索結果数 */
    MAX_RESULTS: 100,
    /** @description あいまい検索閾値 */
    FUZZY_THRESHOLD: 0.8,
    /** @description 検索対象フィールド */
    SEARCHABLE_FIELDS: ["name", "description", "category", "tags"],
  },

  /** @description ソート設定 */
  SORT: {
    /** @description デフォルトソート */
    DEFAULT: "priority",
    /** @description 利用可能なソート項目 */
    AVAILABLE: ["priority", "name", "distance", "popularity"],
    /** @description ソート方向 */
    DIRECTION: "asc",
  },

  /** @description グループ化 */
  GROUPING: {
    /** @description デフォルトグループ */
    DEFAULT: "category",
    /** @description 利用可能なグループ */
    AVAILABLE: ["category", "region", "type"],
    /** @description グループ内ソート */
    SORT_WITHIN_GROUP: true,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * アクセシビリティ設定
 *
 * @description WCAG 2.1 AA準拠の操作性
 */
export const FILTER_ACCESSIBILITY = {
  /** @description キーボード操作 */
  KEYBOARD: {
    /** @description ショートカット有効 */
    ENABLE_SHORTCUTS: true,
    /** @description フォーカス循環 */
    FOCUS_LOOP: true,
    /** @description スキップリンク */
    SKIP_LINKS: true,
  },

  /** @description スクリーンリーダー */
  SCREEN_READER: {
    /** @description ライブリージョン更新 */
    LIVE_UPDATES: true,
    /** @description 詳細説明 */
    DETAILED_DESCRIPTIONS: true,
    /** @description 進捗状況通知 */
    PROGRESS_ANNOUNCEMENTS: true,
  },

  /** @description 視覚的支援 */
  VISUAL: {
    /** @description 高コントラストモード */
    HIGH_CONTRAST: false,
    /** @description 大きなターゲット */
    LARGE_TARGETS: false,
    /** @description モーション削減 */
    REDUCE_MOTION: false,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, boolean>>>>;

/**
 * 下位互換性維持
 * @deprecated v1.x との互換性のため残している。v3.0で削除予定
 */
export const SHEET_MAPPING = SHEET_FILTER_MAPPING;
