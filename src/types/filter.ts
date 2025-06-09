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
}

export interface FilterOption {
  key: keyof FilterState;
  label: string;
  icon: string;
  description?: string;
  category: "facilities" | "dining" | "nightlife";
}

export interface FilterCategory {
  id: string;
  label: string;
  icon: string;
  options: FilterOption[];
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
};

// フィルターオプションの定義
export const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "showToilets",
    label: "トイレ",
    icon: "🚻",
    description: "トイレ施設を表示",
    category: "facilities",
  },
  {
    key: "showParking",
    label: "駐車場",
    icon: "🅿️",
    description: "駐車場を表示",
    category: "facilities",
  },
  {
    key: "showRecommended",
    label: "おすすめ",
    icon: "⭐",
    description: "おすすめスポットを表示",
    category: "dining",
  },
  {
    key: "showRyotsuAikawa",
    label: "両津・相川",
    icon: "🏔️",
    description: "両津・相川エリアを表示",
    category: "dining",
  },
  {
    key: "showKanaiSawada",
    label: "金井・佐和田",
    icon: "🌾",
    description: "金井・佐和田エリアを表示",
    category: "dining",
  },
  {
    key: "showAkadomariHamochi",
    label: "赤泊・羽茂",
    icon: "🌊",
    description: "赤泊・羽茂エリアを表示",
    category: "dining",
  },
  {
    key: "showSnacks",
    label: "スナック",
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

// シート名とフィルターキーのマッピング
export const SHEET_FILTER_MAPPING: Record<string, keyof FilterState> = {
  toilet: "showToilets",
  parking: "showParking",
  recommended: "showRecommended",
  ryotsu_aikawa: "showRyotsuAikawa",
  kanai_sawada: "showKanaiSawada",
  akadomari_hamochi: "showAkadomariHamochi",
  snack: "showSnacks",
};
