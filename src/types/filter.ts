/**
 * フィルター機能の型定義
 */

export interface FilterState {
  // 表示/非表示フィルター
  showToilets: boolean;
  showParking: boolean;
  showRecommended: boolean;
  showRyotsuAikawa: boolean;
  showKanaiSawada: boolean;
  showAkadomariHamochi: boolean;
  showSnacks: boolean;
  // クラスタリング制御
  enableClustering: boolean;
}

export interface FilterOption {
  key: keyof FilterState;
  icon: string;
  description: string;
  category: "facilities" | "dining" | "nightlife" | "display";
}

export interface FilterCategory {
  id: string;
  label: string;
  icon: string;
  options: FilterOption[];
}

// プリセットフィルターの型定義
export type FilterPreset = "all" | "gourmet" | "facilities" | "nightlife" | "none" | "default";

// プリセット設定の型定義
export interface PresetConfig {
  baseState?: Partial<FilterState>;
  overrides: Partial<FilterState>;
}

// 統計情報の型定義
export interface FilterStats {
  total: number;
  visible: number;
  hidden: number;
  sheetStats: Record<string, number>;
  visibleSheetStats: Record<string, number>;
}

// デフォルトのフィルター状態
export const DEFAULT_FILTER_STATE: FilterState = {
  showToilets: false,
  showParking: false,
  showRecommended: true,
  showRyotsuAikawa: true,
  showKanaiSawada: true,
  showAkadomariHamochi: true,
  showSnacks: false,
  enableClustering: true,
};

// フィルターカテゴリー定義
export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "facilities",
    label: "施設",
    icon: "🏢",
    options: [
      {
        key: "showToilets",
        icon: "🚻",
        description: "トイレ",
        category: "facilities",
      },
      {
        key: "showParking",
        icon: "🅿️",
        description: "駐車場",
        category: "facilities",
      },
    ],
  },
  {
    id: "dining",
    label: "グルメ",
    icon: "🍽️",
    options: [
      {
        key: "showRecommended",
        icon: "⭐",
        description: "おすすめ",
        category: "dining",
      },
      {
        key: "showRyotsuAikawa",
        icon: "🍜",
        description: "両津・相川エリア",
        category: "dining",
      },
      {
        key: "showKanaiSawada",
        icon: "🍱",
        description: "金井・佐和田エリア",
        category: "dining",
      },
      {
        key: "showAkadomariHamochi",
        icon: "🍣",
        description: "赤泊・羽茂エリア",
        category: "dining",
      },
    ],
  },
  {
    id: "nightlife",
    label: "ナイトライフ",
    icon: "🍸",
    options: [
      {
        key: "showSnacks",
        icon: "🍻",
        description: "スナック・バー",
        category: "nightlife",
      },
    ],
  },
  {
    id: "display",
    label: "表示設定",
    icon: "⚙️",
    options: [
      {
        key: "enableClustering",
        icon: "🔗",
        description: "マーカーをクラスタリング",
        category: "display",
      },
    ],
  },
];

// プリセット設定定義
export const PRESET_CONFIGS: Record<FilterPreset, PresetConfig> = {
  all: {
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
    overrides: DEFAULT_FILTER_STATE,
  },
};
