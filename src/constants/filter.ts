/**
 * フィルター関連の定数定義
 */

import type {
  FilterCategory,
  FilterOption,
  FilterPreset,
  FilterState,
  PresetConfig,
} from "../types/filter";

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

// フィルターオプションの定義
export const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "showToilets",
    icon: "🚻",
    description: "トイレ施設を表示",
    category: "facilities",
  },
  {
    key: "showParking",
    icon: "🅿️",
    description: "駐車場を表示",
    category: "facilities",
  },
  {
    key: "showRecommended",
    icon: "⭐",
    description: "おすすめスポットを表示",
    category: "dining",
  },
  {
    key: "showRyotsuAikawa",
    icon: "🏔️",
    description: "両津・相川\nエリアを表示",
    category: "dining",
  },
  {
    key: "showKanaiSawada",
    icon: "🌾",
    description: "金井・佐和田・新穂・畑野・真野\nエリアを表示",
    category: "dining",
  },
  {
    key: "showAkadomariHamochi",
    icon: "🌊",
    description: "赤泊・羽茂・小木\nエリアを表示",
    category: "dining",
  },
  {
    key: "showSnacks",
    icon: "🍻",
    description: "スナック営業店舗を表示",
    category: "nightlife",
  },
];

// カテゴリ別グループ化
export const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: "facilities",
    label: "施設",
    icon: "🏢",
    options: FILTER_OPTIONS.filter((option) => option.category === "facilities"),
  },
  {
    id: "dining",
    label: "グルメ",
    icon: "🍽️",
    options: FILTER_OPTIONS.filter((option) => option.category === "dining"),
  },
  {
    id: "nightlife",
    label: "ナイトライフ",
    icon: "🍸",
    options: FILTER_OPTIONS.filter((option) => option.category === "nightlife"),
  },
];

// シート名とフィルターキーのマッピング設定
export const SHEET_FILTER_MAPPING: Record<string, keyof FilterState> = {
  toilets: "showToilets",
  parking: "showParking",
  recommended: "showRecommended",
  ryotsu_aikawa: "showRyotsuAikawa",
  kanai_sawada: "showKanaiSawada",
  akadomari_hamochi: "showAkadomariHamochi",
  snacks: "showSnacks",
} as const;

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
    },
  },
  gourmet: {
    baseState: DEFAULT_FILTER_STATE,
    overrides: {
      showRecommended: true,
      showRyotsuAikawa: true,
      showKanaiSawada: true,
      showAkadomariHamochi: true,
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
    },
  },
  default: {
    overrides: DEFAULT_FILTER_STATE,
  },
} as const;
