/**
 * フィルター機能の型定義
 * 型安全性とパフォーマンスを考慮したフィルターシステム
 */

import type { EntityId } from "./common";

// フィルター状態のキーをブランド型で型安全に管理
export type FilterKey = keyof FilterState;

/**
 * フィルター状態の型定義
 * アプリケーションの表示制御を行う状態管理
 */
export interface FilterState {
  // 表示/非表示フィルター
  readonly showToilets: boolean;
  readonly showParking: boolean;
  readonly showRecommended: boolean;
  readonly showRyotsuAikawa: boolean;
  readonly showKanaiSawada: boolean;
  readonly showAkadomariHamochi: boolean;
  readonly showSnacks: boolean;
  // クラスタリング制御
  readonly enableClustering: boolean;
}

/**
 * フィルターカテゴリの型定義
 * UIでのグループ化とアクセシビリティ対応
 */
export type FilterCategory = "facilities" | "dining" | "nightlife" | "display";

/**
 * フィルターオプションの詳細定義
 * 各フィルターの設定と表示情報
 */
export interface FilterOption {
  readonly key: FilterKey;
  readonly icon: string;
  readonly description: string;
  readonly category: FilterCategory;
  readonly accessibilityLabel?: string;
  readonly tooltip?: string;
  readonly priority?: number; // 表示順序用
}

/**
 * フィルターカテゴリグループの定義
 * UIでのカテゴリ別表示用
 */
export interface FilterCategoryGroup {
  readonly id: EntityId;
  readonly label: string;
  readonly icon: string;
  readonly description?: string;
  readonly options: readonly FilterOption[];
  readonly collapsible?: boolean;
  readonly defaultExpanded?: boolean;
}

// プリセットフィルターの型定義（より厳密な定義）
export type FilterPreset = "all" | "gourmet" | "facilities" | "nightlife" | "none" | "default";

/**
 * プリセット設定の型定義
 * 基底状態とオーバーライドの組み合わせ
 */
export interface PresetConfig {
  readonly name: string;
  readonly description?: string;
  readonly baseState?: DeepPartial<FilterState>;
  readonly overrides: Partial<FilterState>;
  readonly metadata?: {
    readonly createdAt?: number;
    readonly version?: string;
    readonly tags?: readonly string[];
  };
}

/**
 * 統計情報の型定義
 * パフォーマンス監視とUX向上のための情報
 */
export interface FilterStats {
  readonly total: number;
  readonly visible: number;
  readonly hidden: number;
  readonly sheetStats: Readonly<Record<string, number>>;
  readonly visibleSheetStats: Readonly<Record<string, number>>;
  readonly lastUpdated: number;
  readonly performance?: {
    readonly filterTime: number;
    readonly renderTime: number;
  };
}

/**
 * フィルター変更イベントの型定義
 */
export interface FilterChangeEvent {
  readonly key: FilterKey;
  readonly oldValue: boolean;
  readonly newValue: boolean;
  readonly timestamp: number;
  readonly source: "user" | "preset" | "system";
}

/**
 * 部分更新用のヘルパー型
 */
type DeepPartial<T> = {
  readonly [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// デフォルトのフィルター状態（const assertionで型安全性を保証）
export const DEFAULT_FILTER_STATE = {
  showToilets: false,
  showParking: false,
  showRecommended: true,
  showRyotsuAikawa: true,
  showKanaiSawada: true,
  showAkadomariHamochi: true,
  showSnacks: false,
  enableClustering: true,
} as const satisfies FilterState;

// フィルターカテゴリー定義（型安全性とイミュータビリティを保証）
export const FILTER_CATEGORIES = [
  {
    id: "facilities" as EntityId,
    label: "施設",
    icon: "🏢",
    description: "公共施設やサービス施設",
    options: [
      {
        key: "showToilets" as const,
        icon: "🚻",
        description: "トイレ",
        category: "facilities" as const,
        accessibilityLabel: "トイレの表示切り替え",
        priority: 1,
      },
      {
        key: "showParking" as const,
        icon: "🅿️",
        description: "駐車場",
        category: "facilities" as const,
        accessibilityLabel: "駐車場の表示切り替え",
        priority: 2,
      },
    ],
  },
  {
    id: "dining" as EntityId,
    label: "グルメ",
    icon: "🍽️",
    description: "レストラン・飲食店",
    options: [
      {
        key: "showRecommended" as const,
        icon: "⭐",
        description: "おすすめ",
        category: "dining" as const,
        accessibilityLabel: "おすすめ店舗の表示切り替え",
        priority: 1,
      },
      {
        key: "showRyotsuAikawa" as const,
        icon: "🍜",
        description: "両津・相川エリア",
        category: "dining" as const,
        accessibilityLabel: "両津・相川エリアの店舗表示切り替え",
        priority: 2,
      },
      {
        key: "showKanaiSawada" as const,
        icon: "🍱",
        description: "金井・佐和田エリア",
        category: "dining" as const,
        accessibilityLabel: "金井・佐和田エリアの店舗表示切り替え",
        priority: 3,
      },
      {
        key: "showAkadomariHamochi" as const,
        icon: "🍣",
        description: "赤泊・羽茂エリア",
        category: "dining" as const,
        accessibilityLabel: "赤泊・羽茂エリアの店舗表示切り替え",
        priority: 4,
      },
    ],
  },
  {
    id: "nightlife" as EntityId,
    label: "ナイトライフ",
    icon: "🍸",
    description: "夜間営業の飲食店",
    options: [
      {
        key: "showSnacks" as const,
        icon: "🍻",
        description: "スナック・バー",
        category: "nightlife" as const,
        accessibilityLabel: "スナック・バーの表示切り替え",
        priority: 1,
      },
    ],
  },
  {
    id: "display" as EntityId,
    label: "表示設定",
    icon: "⚙️",
    description: "地図表示の設定",
    options: [
      {
        key: "enableClustering" as const,
        icon: "🔗",
        description: "マーカーをクラスタリング",
        category: "display" as const,
        accessibilityLabel: "マーカークラスタリングの有効/無効切り替え",
        tooltip: "マーカーが密集している場合にグループ化して表示します",
        priority: 1,
      },
    ],
  },
] as const satisfies readonly FilterCategoryGroup[];

// プリセット設定定義（型安全性とイミュータビリティを保証）
export const PRESET_CONFIGS = {
  all: {
    name: "全て表示",
    description: "全てのカテゴリを表示します",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showToilets: true,
      showParking: true,
      showRecommended: true,
      showRyotsuAikawa: true,
      showKanaiSawada: true,
      showAkadomariHamochi: true,
      showSnacks: true,
      enableClustering: true,
    },
  },
  gourmet: {
    name: "グルメ",
    description: "飲食店のみを表示します",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showRecommended: true,
      showRyotsuAikawa: true,
      showKanaiSawada: true,
      showAkadomariHamochi: true,
      enableClustering: true,
    },
  },
  facilities: {
    name: "施設",
    description: "公共施設のみを表示します",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showToilets: true,
      showParking: true,
      showRecommended: false,
      showRyotsuAikawa: false,
      showKanaiSawada: false,
      showAkadomariHamochi: false,
      enableClustering: false, // 施設は個別表示の方が見やすい
    },
  },
  nightlife: {
    name: "ナイトライフ",
    description: "夜間営業店のみを表示します",
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showSnacks: true,
      showRecommended: false,
      showRyotsuAikawa: false,
      showKanaiSawada: false,
      showAkadomariHamochi: false,
      enableClustering: true,
    },
  },
  none: {
    name: "非表示",
    description: "全てのマーカーを非表示にします",
    overrides: {
      showToilets: false,
      showParking: false,
      showRecommended: false,
      showRyotsuAikawa: false,
      showKanaiSawada: false,
      showAkadomariHamochi: false,
      showSnacks: false,
      enableClustering: false, // 何も表示しない場合はクラスタリングも無効
    },
  },
  default: {
    name: "デフォルト",
    description: "デフォルトの表示設定です",
    overrides: DEFAULT_FILTER_STATE,
  },
} as const satisfies Readonly<Record<FilterPreset, PresetConfig>>;

// 型ガード関数
export const isFilterKey = (key: string): key is FilterKey => {
  return key in DEFAULT_FILTER_STATE;
};

export const isFilterPreset = (preset: string): preset is FilterPreset => {
  return preset in PRESET_CONFIGS;
};

export const isFilterCategory = (category: string): category is FilterCategory => {
  const validCategories: FilterCategory[] = ["facilities", "dining", "nightlife", "display"];
  return validCategories.includes(category as FilterCategory);
};

/**
 * フィルター状態の変更を型安全に行うヘルパー型
 */
export type FilterStateUpdate = Partial<FilterState>;

/**
 * フィルター操作のアクションタイプ
 */
export type FilterAction =
  | { type: "SET_FILTER"; key: FilterKey; value: boolean }
  | { type: "APPLY_PRESET"; preset: FilterPreset }
  | { type: "RESET_FILTERS" }
  | { type: "TOGGLE_FILTER"; key: FilterKey }
  | { type: "UPDATE_MULTIPLE"; updates: FilterStateUpdate };

/**
 * フィルターコンテキストの型定義
 */
export interface FilterContextValue {
  readonly state: FilterState;
  readonly stats: FilterStats;
  readonly dispatch: (action: FilterAction) => void;
  readonly applyPreset: (preset: FilterPreset) => void;
  readonly toggleFilter: (key: FilterKey) => void;
  readonly resetFilters: () => void;
}
