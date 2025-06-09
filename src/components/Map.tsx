import type { MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SADO_ISLAND } from "../constants";
import { FilterService } from "../services/filter";
import { fetchPOIs } from "../services/sheets";
import { isClusterPOI } from "../types/common";
import type { FilterState } from "../types/filter";
import type { ClusterablePOI, POI } from "../types/google-maps";
import { getAppConfig } from "../utils/env";
import { GoogleMarkerCluster } from "./GoogleMarkerCluster";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";

// アニメーション設定定数
const ANIMATION_CONFIG = {
  PAN_DELAY: 400, // パンアニメーション完了待ち時間（ms）
  ZOOM_STEPS_PER_LEVEL: 4, // ズーム1レベルあたりのステップ数
  ZOOM_STEP_INTERVAL: 25, // 各ズームステップの間隔（ms）
  DEFAULT_ZOOM_INCREMENT: 2, // デフォルトのズーム増分
} as const;

// マップインスタンス取得用ヘルパー
function MapInstanceCapture({ onMapInstance }: { onMapInstance: (map: google.maps.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapInstance(map);
    }
  }, [map, onMapInstance]);

  return null;
}

interface MapComponentProps {
  className?: string;
  onMapLoaded?: () => void;
  /** 既存のGoogle Mapsマーカー（POI）をクリック可能にするかどうか（デフォルト: false） */
  enableClickableIcons?: boolean;
  /** フィルター状態 */
  filterState?: FilterState;
  /** POIデータ（外部から提供される場合） */
  pois?: POI[];
  /** コントロールの順番設定（上から下への順序） */
  controlOrder?: ("fullscreen" | "zoom" | "streetView" | "mapType")[];
}

/**
 * Google Mapsコンポーネント
 *
 * コントロールの順番を指定するには、controlOrderプロパティを使用します：
 * 例：
 * <MapComponent
 *   controlOrder={['zoom', 'fullscreen', 'mapType', 'streetView']}
 * />
 *
 * デフォルト順序（右上から）：
 * 1. マップタイプ
 * 2. フルスクリーン
 * 3. ズーム
 * 4. ストリートビュー
 *
 * 利用可能なコントロール：
 * - 'fullscreen': フルスクリーン
 * - 'zoom': ズーム
 * - 'streetView': ストリートビュー
 * - 'mapType': マップタイプ
 */

export function MapComponent({
  className,
  onMapLoaded,
  enableClickableIcons = false,
  filterState,
  pois: externalPois,
  controlOrder = ["mapType", "fullscreen", "zoom", "streetView"],
}: MapComponentProps) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(SADO_ISLAND.ZOOM.DEFAULT);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // 使用するPOIデータを決定（外部から提供されたものを優先）
  const activePois = useMemo(() => {
    return externalPois && externalPois.length > 0 ? externalPois : pois;
  }, [externalPois, pois]);

  // フィルタされたPOIを計算
  const filteredPois = useMemo(() => {
    if (!filterState) return activePois;
    return FilterService.filterPOIs(activePois, filterState);
  }, [activePois, filterState]);

  // APIキーをメモ化してパフォーマンス向上
  const apiKey = useMemo(() => {
    const { googleMapsApiKey } = getAppConfig();
    return googleMapsApiKey;
  }, []);
  // ライブラリ設定をメモ化 - パフォーマンス最適化のためバージョンを指定
  const libraries = useMemo(() => ["marker"], []);
  const version = useMemo(() => "weekly", []); // 最新の安定版を使用

  // POIデータ読み込み（外部から提供されない場合のみ）
  useEffect(() => {
    // 外部からPOIが提供されている場合はスキップ
    if (externalPois && externalPois.length > 0) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadPOIs = async () => {
      try {
        const data = await fetchPOIs();
        if (isMounted) {
          setPois(data);
        }
      } catch {
        if (isMounted) {
          // エラーハンドリングは必要に応じて実装
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPOIs();

    return () => {
      isMounted = false;
    };
  }, [externalPois]);

  // マップとPOIの準備完了を通知
  useEffect(() => {
    if (!loading && mapReady && onMapLoaded) {
      onMapLoaded();
    }
  }, [loading, mapReady, onMapLoaded]); // クラスターズーム処理
  const zoomToCluster = useCallback(
    (poi: ClusterablePOI) => {
      if (!mapInstance || !isClusterPOI(poi)) return;

      // 型ガードによりClusterPOI型が確定
      if (poi.originalPois.length <= 1) return;

      const bounds = new google.maps.LatLngBounds();
      poi.originalPois.forEach((originalPoi: POI) => {
        bounds.extend(originalPoi.position);
      });

      // クラスターの中心に向かってスムーズに移動
      const center = bounds.getCenter();
      const currentZoom = mapInstance.getZoom() || 10;

      // まず中心にパン（アニメーション付き）
      mapInstance.panTo(center);

      // パンが完了してからズームを段階的に実行
      setTimeout(() => {
        // ターゲットズームレベルを計算
        const tempBounds = new google.maps.LatLngBounds();
        poi.originalPois.forEach((originalPoi: POI) => {
          tempBounds.extend(originalPoi.position);
        });

        // 適切なズームレベルを推定
        const ne = tempBounds.getNorthEast();
        const sw = tempBounds.getSouthWest();
        const latDiff = Math.abs(ne.lat() - sw.lat());
        const lngDiff = Math.abs(ne.lng() - sw.lng());
        const maxDiff = Math.max(latDiff, lngDiff);

        // 距離に基づいてズームレベルを決定
        // クラスタリングが無効化される範囲まで積極的にズーム
        let targetZoom = Math.max(
          currentZoom + ANIMATION_CONFIG.DEFAULT_ZOOM_INCREMENT,
          SADO_ISLAND.ZOOM.DISABLE_CLUSTERING,
        );

        if (maxDiff < 0.001)
          targetZoom = Math.min(currentZoom + 6, SADO_ISLAND.ZOOM.MAX_ZOOM_LEVEL);
        else if (maxDiff < 0.01)
          targetZoom = Math.min(currentZoom + 5, SADO_ISLAND.ZOOM.MAX_ZOOM_LEVEL);
        else if (maxDiff < 0.1)
          targetZoom = Math.min(
            Math.max(
              currentZoom + ANIMATION_CONFIG.DEFAULT_ZOOM_INCREMENT,
              SADO_ISLAND.ZOOM.DISABLE_CLUSTERING,
            ),
            SADO_ISLAND.ZOOM.MAX_ZOOM_LEVEL,
          );

        // ズームレベル制限を適用
        targetZoom = Math.max(
          SADO_ISLAND.ZOOM.MIN_CLUSTER_ZOOM,
          Math.min(SADO_ISLAND.ZOOM.MAX_ZOOM_LEVEL, targetZoom),
        );

        // スムーズなズームアニメーション
        const zoomDiff = targetZoom - currentZoom;
        const steps = Math.abs(zoomDiff) * ANIMATION_CONFIG.ZOOM_STEPS_PER_LEVEL;
        const stepSize = zoomDiff / steps;
        let currentStep = 0;

        const animateZoom = () => {
          if (currentStep < steps) {
            currentStep++;
            const newZoom = currentZoom + stepSize * currentStep;
            mapInstance.setZoom(newZoom);
            setTimeout(animateZoom, ANIMATION_CONFIG.ZOOM_STEP_INTERVAL);
          } else {
            // ズーム完了処理（ログは削除済み）
          }
        };

        animateZoom();
      }, ANIMATION_CONFIG.PAN_DELAY);
    },
    [mapInstance],
  ); // マーカークリック処理
  const handleMarkerClick = useCallback(
    (poi: ClusterablePOI) => {
      if (isClusterPOI(poi)) {
        zoomToCluster(poi);
      } else {
        setSelectedPoi(poi);
      }
    },
    [zoomToCluster],
  );

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // マップクリック時の処理（情報ウィンドウを閉じる）
  const handleMapClick = useCallback(() => {
    if (selectedPoi) {
      setSelectedPoi(null);
    }
  }, [selectedPoi]);

  // マップ準備完了ハンドラー
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // マップインスタンス取得と既存マーカーのイベントリスナー設定
  const handleMapInstanceLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map);

      // コントロールの順番を調整する
      // 少し遅延させてコントロールが完全に初期化された後に実行
      setTimeout(() => {
        const mapDiv = map.getDiv();
        // 右上のコントロールコンテナを取得
        const rightTopControls = mapDiv.querySelectorAll('[style*="right"][style*="top"]');

        // コントロールタイプを識別するヘルパー関数
        const getControlType = (
          element: HTMLElement,
        ): "fullscreen" | "zoom" | "streetView" | "mapType" | "unknown" => {
          // フルスクリーンコントロールの識別
          if (
            element.querySelector('[title*="全画面"]') ||
            element.querySelector('[aria-label*="Toggle fullscreen"]') ||
            element.querySelector('button[title*="fullscreen"]')
          ) {
            return "fullscreen";
          }
          // ズームコントロールの識別
          if (
            element.querySelector('[title*="ズーム"]') ||
            element.querySelector('[aria-label*="Zoom"]') ||
            (element.className.includes("gmnoprint") && element.querySelector("button"))
          ) {
            return "zoom";
          }
          // ストリートビューコントロールの識別
          if (
            element.querySelector('[title*="ストリート"]') ||
            element.querySelector('[aria-label*="Street View"]') ||
            element.querySelector('button[title*="Street View"]')
          ) {
            return "streetView";
          }
          // マップタイプコントロールの識別
          if (
            element.querySelector("select") ||
            element.querySelector('[title*="マップ"]') ||
            element.querySelector('[aria-label*="Map type"]')
          ) {
            return "mapType";
          }
          return "unknown";
        };

        // コントロールを希望の順番で配置
        rightTopControls.forEach((container) => {
          const containerElement = container as HTMLElement;
          const controls = Array.from(containerElement.children) as HTMLElement[];

          // コントロールの種類を識別して順番を調整
          const sortedControls = controls.sort((a, b) => {
            const getControlPriority = (element: HTMLElement): number => {
              const controlType = getControlType(element);
              if (controlType === "unknown") return 999;
              const index = controlOrder.indexOf(controlType);
              return index === -1 ? 999 : index; // 見つからない場合は最後
            };

            return getControlPriority(a) - getControlPriority(b);
          });

          // 並び替えたコントロールを再配置
          sortedControls.forEach((control) => {
            containerElement.appendChild(control);
          });
        });
      }, 1000); // 1秒後に実行（コントロールの初期化を待つ）

      // 既存のGoogle Mapsマーカー（POI）がクリックされたときの処理
      if (!enableClickableIcons) {
        map.addListener("click", (event: google.maps.MapMouseEvent & { placeId?: string }) => {
          // placeIdが存在する場合は既存のGoogle Maps POIがクリックされたということ
          if (event.placeId) {
            // 既存のInfoWindowを閉じる
            if (selectedPoi) {
              setSelectedPoi(null);
            }

            // デフォルトのInfoWindowの表示を防ぐ
            if ("stop" in event && typeof event.stop === "function") {
              event.stop();
            }
          }
          return; // enableClickableIconsがfalseの場合はここで終了
        });
      } else {
        // enableClickableIconsがtrueの場合の処理
        map.addListener("click", (event: google.maps.MapMouseEvent & { placeId?: string }) => {
          if (event.placeId) {
            // 自作のInfoWindowを閉じる
            if (selectedPoi) {
              setSelectedPoi(null);
            }
          } else {
            // 地図の空白部分がクリックされた場合、すべてのInfoWindowを閉じる
            if (selectedPoi) {
              setSelectedPoi(null);
            }

            // 既存のGoogle Maps InfoWindowも閉じる - 複数のセレクターを試行
            const closeGoogleInfoWindow = () => {
              // 複数の可能なCloseボタンセレクターを試行
              const possibleSelectors = [
                'button[aria-label="Close"]',
                '.gm-ui-hover-effect[aria-label="Close"]',
                'button[title="Close"]',
                '.gm-ui-hover-effect[title="Close"]',
                'button[data-value="Close"]',
                ".gm-style-iw-d button",
                ".gm-style-iw-c button",
              ];

              for (const selector of possibleSelectors) {
                const closeButton = document.querySelector(selector);
                if (closeButton && closeButton instanceof HTMLElement) {
                  closeButton.click();
                  return true;
                }
              }

              // 手動でInfoWindowを検索して閉じる
              const infoWindows = document.querySelectorAll(".gm-style-iw");
              if (infoWindows.length > 0) {
                infoWindows.forEach((iw) => {
                  const parent = iw.parentElement;
                  if (parent) {
                    parent.style.display = "none";
                  }
                });
                return true;
              }

              return false;
            };

            // 少し遅延させてInfoWindowが完全に表示された後に閉じる
            setTimeout(closeGoogleInfoWindow, 100);
          }
        });

        // より包括的なMutationObserverでInfoWindowを監視
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const element = node as Element;

                  // InfoWindowまたはその親要素を検索
                  const infoWindows = [
                    ...element.querySelectorAll(".gm-style-iw-c"),
                    ...element.querySelectorAll(".gm-style-iw"),
                    ...(element.classList.contains("gm-style-iw-c") ||
                    element.classList.contains("gm-style-iw")
                      ? [element]
                      : []),
                  ];

                  infoWindows.forEach((infoWindow) => {
                    // 既にイベントリスナーが追加されているかチェック
                    if (!infoWindow.hasAttribute("data-map-click-listener")) {
                      infoWindow.setAttribute("data-map-click-listener", "true");

                      // マップクリックを監視するためのイベントリスナーを追加
                      const mapContainer = document.querySelector(".gm-style");
                      if (mapContainer) {
                        const handleMapClick = (e: Event) => {
                          const target = e.target as Element;
                          // InfoWindow内のクリックでない場合は閉じる
                          if (!infoWindow.contains(target)) {
                            // 複数のCloseボタンセレクターを試行
                            const possibleCloseSelectors = [
                              'button[aria-label="Close"]',
                              'button[title="Close"]',
                              'button[data-value="Close"]',
                              ".gm-ui-hover-effect",
                            ];

                            let closed = false;
                            for (const selector of possibleCloseSelectors) {
                              const closeButton = infoWindow.querySelector(selector);
                              if (closeButton && closeButton instanceof HTMLElement) {
                                closeButton.click();
                                closed = true;
                                break;
                              }
                            }

                            // ボタンが見つからない場合は親要素を非表示にする
                            if (!closed) {
                              const parent = infoWindow.parentElement;
                              if (parent) {
                                parent.style.display = "none";
                              }
                            }
                          }
                        };

                        mapContainer.addEventListener("click", handleMapClick, true);

                        // InfoWindowが削除される際のクリーンアップ
                        const cleanupObserver = new MutationObserver(() => {
                          if (!document.contains(infoWindow)) {
                            mapContainer.removeEventListener("click", handleMapClick, true);
                            cleanupObserver.disconnect();
                          }
                        });

                        cleanupObserver.observe(document.body, {
                          childList: true,
                          subtree: true,
                        });
                      }
                    }
                  });
                }
              });
            }
          });
        });

        // DOM全体を監視
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // クリーンアップ関数を返す
        return () => {
          observer.disconnect();
        };
      }

      return undefined; // 明示的にundefinedを返す
    },
    [selectedPoi, enableClickableIcons, controlOrder],
  );
  // ズーム変更ハンドラー
  const handleCameraChanged = useCallback(
    (event: MapCameraChangedEvent) => {
      const { zoom } = event.detail;
      if (zoom && zoom !== currentZoom) {
        setCurrentZoom(zoom);
      }
    },
    [currentZoom],
  );

  if (loading) {
    return (
      <div className={className}>
        <div className="map-loading">地図を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <APIProvider
        apiKey={apiKey}
        version={version}
        libraries={libraries}
        language="ja"
        region="JP"
        onLoad={handleMapReady}
      >
        {" "}
        <Map
          defaultZoom={11}
          defaultCenter={SADO_ISLAND.CENTER}
          mapId={getAppConfig().googleMapsMapId}
          mapTypeId={google.maps.MapTypeId.TERRAIN}
          gestureHandling="greedy"
          disableDefaultUI={true}
          // コントロールの順番を制御するため、位置を細かく調整
          fullscreenControl={true}
          fullscreenControlOptions={{
            position: google.maps.ControlPosition.TOP_RIGHT,
          }}
          zoomControl={true}
          zoomControlOptions={{
            position: google.maps.ControlPosition.RIGHT_TOP,
          }}
          streetViewControl={true}
          streetViewControlOptions={{
            position: google.maps.ControlPosition.RIGHT_TOP,
          }}
          mapTypeControl={true}
          mapTypeControlOptions={{
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT,
          }}
          scaleControl={true}
          clickableIcons={enableClickableIcons} // プロップで制御可能に
          style={{ width: "100%", height: "100%" }}
          reuseMaps={true}
          onIdle={handleMapReady}
          onCameraChanged={handleCameraChanged}
          onClick={handleMapClick}
        >
          <MapInstanceCapture onMapInstance={handleMapInstanceLoad} />
          <GoogleMarkerCluster
            pois={filteredPois}
            onMarkerClick={handleMarkerClick}
            currentZoom={currentZoom}
          />
          {selectedPoi && <InfoWindow poi={selectedPoi} onClose={handleInfoWindowClose} />}
        </Map>
      </APIProvider>
    </div>
  );
}
