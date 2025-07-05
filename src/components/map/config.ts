/**
 * Map component configuration
 * すべてのマップ関連設定を統一管理
 *
 * @version 1.0.0
 * @since 2025-06-30
 */

import type { POI } from '../../types/poi';

/**
 * マーカー設定の型定義
 */
export interface MarkerConfig {
  keywords: string[];
  icon: string | null;
  style: {
    background: string;
    borderColor: string;
    glyphColor: string;
  };
}

/**
 * クラスタリング設定の型定義
 */
export interface ClusteringConfig {
  mode: 'simple' | 'advanced';
  maxMarkers: Record<number, number>;
  enableAnimations: boolean;
  enablePulse: boolean;
}

/**
 * アニメーション設定の型定義
 */
export interface AnimationConfig {
  duration: {
    bounce: number;
    pulse: number;
    expand: number;
  };
  timing: {
    fast: string;
    medium: string;
    slow: string;
  };
}

/**
 * マーカー設定
 */
export const MARKER_CONFIGS: Record<string, MarkerConfig> = {
  toilet: {
    keywords: ['トイレ', 'toilet', 'お手洗い'],
    icon: null, // ASSETSから動的に取得
    style: {
      background: '#8B4513',
      borderColor: '#654321',
      glyphColor: 'white',
    },
  },
  parking: {
    keywords: ['駐車', 'parking', 'パーキング'],
    icon: null, // ASSETSから動的に取得
    style: {
      background: '#2E8B57',
      borderColor: '#1F5F3F',
      glyphColor: 'white',
    },
  },
  normal: {
    keywords: [],
    icon: null,
    style: {
      background: '#4285F4',
      borderColor: '#1A73E8',
      glyphColor: 'white',
    },
  },
} as const;

/**
 * クラスタリング設定
 */
export const CLUSTERING_CONFIG: ClusteringConfig = {
  mode: 'advanced',
  maxMarkers: {
    15: 200, // ズームレベル15以上
    12: 100, // ズームレベル12以上
    0: 50,   // デフォルト
  },
  enableAnimations: true,
  enablePulse: true,
} as const;

/**
 * アニメーション設定
 */
export const ANIMATION_CONFIG: AnimationConfig = {
  duration: {
    bounce: 600,
    pulse: 3000,
    expand: 800,
  },
  timing: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    medium: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
} as const;

/**
 * パフォーマンス設定
 */
export const PERFORMANCE_CONFIG = {
  incrementalRendering: {
    initialBatch: 50,
    batchSize: 25,
    batchDelay: 16, // 1フレーム
  },
  virtualization: {
    enabled: true,
    itemHeight: 50,
    overscan: 5,
  },
  memoryManagement: {
    maxCachedMarkers: 1000,
    cleanupInterval: 30000, // 30秒
  },
} as const;

/**
 * マーカーの種類を判定するユーティリティ関数
 */
export const getMarkerType = (poi: POI): keyof typeof MARKER_CONFIGS => {
  const name = poi.name.toLowerCase();
  const genre = poi.genre.toLowerCase();
  const combined = `${name} ${genre}`;

  for (const [type, config] of Object.entries(MARKER_CONFIGS)) {
    if (type === 'normal') continue;
    if (config.keywords.some(keyword => combined.includes(keyword))) {
      return type;
    }
  }
  
  return 'normal';
};

/**
 * おすすめPOIかどうかを判定するユーティリティ関数
 */
export const isRecommendedPOI = (poi: POI): boolean => {
  return Boolean(
    poi.sourceSheet === 'recommended' || 
    poi.genre === 'recommend' ||
    poi.sourceSheet?.toLowerCase().includes('recommend') ||
    poi.sourceSheet?.toLowerCase().includes('おすすめ')
  );
};

/**
 * ズームレベルに基づく最大マーカー数を取得
 */
export const getMaxMarkersForZoom = (zoom: number): number => {
  const zoomLevels = Object.keys(CLUSTERING_CONFIG.maxMarkers)
    .map(Number)
    .sort((a, b) => b - a); // 降順ソート

  for (const level of zoomLevels) {
    if (zoom >= level) {
      const maxMarkers = CLUSTERING_CONFIG.maxMarkers[level];
      return maxMarkers ?? 50; // undefinedの場合はデフォルト値
    }
  }

  return CLUSTERING_CONFIG.maxMarkers[0] ?? 50; // undefinedの場合はデフォルト値
};

/**
 * POIの優先度を計算（おすすめマーカーを優先）
 */
export const calculatePOIPriority = (poi: POI): number => {
  let priority = 0;
  
  // おすすめマーカーは最高優先度
  if (isRecommendedPOI(poi)) {
    priority += 1000;
  }
  
  // カテゴリ別優先度
  const markerType = getMarkerType(poi);
  switch (markerType) {
    case 'toilet':
      priority += 100;
      break;
    case 'parking':
      priority += 90;
      break;
    default:
      priority += 50;
  }
  
  return priority;
};

/**
 * POIリストを優先度順にソートする
 */
export const sortPOIsByPriority = (pois: POI[]): POI[] => {
  return [...pois].sort((a, b) => {
    const priorityA = calculatePOIPriority(a);
    const priorityB = calculatePOIPriority(b);
    return priorityB - priorityA; // 降順
  });
};

/**
 * 開発環境用のデバッグ設定
 */
export const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  logMarkerOperations: false,
  logPerformanceMetrics: true,
  showBoundingBoxes: false,
} as const;
