import { useCallback, useEffect, useState } from "react";
import { preloadGoogleMapsAPI, preloadImagesWithValidation } from "../services/preload";
import { fetchPOIs } from "../services/sheets";
import type { FilterState, POI } from "../types";
import { DEFAULT_FILTER_STATE } from "../types/filter";
import { ASSETS } from "../utils/assets";
import { getAppConfig, isDevelopment } from "../utils/env";

interface AppState {
  loading: boolean;
  mapLoading: boolean;
  poisLoading: boolean;
  fadeOut: boolean;
  pois: POI[];
  filterState: FilterState;
}

interface AppStateActions {
  handleMapLoaded: () => void;
  handleFilterChange: (newFilterState: FilterState) => void;
}

/**
 * アプリケーション全体の状態管理を行うカスタムフック
 * 初期化、データ読み込み、状態管理を統合
 */
export const useAppState = (): AppState & AppStateActions => {
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [poisLoading, setPoisLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [filterState, setFilterState] = useState<FilterState>(() => ({
    ...DEFAULT_FILTER_STATE,
  }));

  // アセットとAPIの事前読み込み
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const startTime = performance.now();

        if (isDevelopment()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          const imagesToPreload = [
            ASSETS.ICONS.AREA_MAP[1],
            ASSETS.ICONS.AREA_MAP[2],
            ASSETS.ICONS.AREA_MAP[3],
            ASSETS.ICONS.MARKERS.CURRENT_LOCATION,
            ASSETS.ICONS.MARKERS.FACING_NORTH,
            ASSETS.ICONS.MARKERS.PARKING,
            ASSETS.ICONS.MARKERS.RECOMMEND,
            ASSETS.TITLE.ROW1,
            ASSETS.ICONS.MARKERS.TOILETTE,
          ];

          await preloadImagesWithValidation(imagesToPreload);
        }

        const { maps } = getAppConfig();
        const { apiKey: googleMapsApiKey } = maps;
        if (googleMapsApiKey) {
          preloadGoogleMapsAPI(googleMapsApiKey);
        }

        const endTime = performance.now();
        const minDisplayTime = 300;
        const remainingTime = Math.max(0, minDisplayTime - (endTime - startTime));
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
        setLoading(false);
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setLoading(false);
      }
    };

    void preloadAssets();
  }, []);

  // POIデータの読み込み
  useEffect(() => {
    let isMounted = true;

    const loadPOIs = async () => {
      try {
        setPoisLoading(true);
        const data = await fetchPOIs();
        if (isMounted) {
          setPois(data);
        }
      } catch {
        if (isMounted) {
          setPois([]);
        }
      } finally {
        if (isMounted) {
          setPoisLoading(false);
        }
      }
    };

    void loadPOIs();

    return () => {
      isMounted = false;
    };
  }, []);

  // マップロード完了ハンドラー
  const handleMapLoaded = useCallback(() => {
    if (poisLoading) {
      return;
    }

    const animateOut = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFadeOut(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMapLoading(false);
    };

    void animateOut();
  }, [poisLoading]);

  // POI読み込み完了後にマップロードハンドラーを再実行
  useEffect(() => {
    if (!poisLoading) {
      handleMapLoaded();
    }
  }, [poisLoading, handleMapLoaded]);

  // フィルタ変更ハンドラー
  const handleFilterChange = useCallback((newFilterState: FilterState) => {
    setFilterState(newFilterState);
  }, []);

  return {
    loading,
    mapLoading,
    poisLoading,
    fadeOut,
    pois,
    filterState,
    handleMapLoaded,
    handleFilterChange,
  };
};
