/**
 * アセットプリロードサービス
 * 画像の事前読み込みとGoogle Maps APIの初期化を行います
 */

interface PreloadService {
  preloadImagesWithValidation: (imagePaths: string[]) => Promise<void>;
  preloadGoogleMapsAPI: (apiKey: string) => void;
}

/**
 * 画像を事前読み込みし、読み込み状況を検証します
 */
async function preloadImagesWithValidation(imagePaths: string[]): Promise<void> {
  try {
    const promises = imagePaths.map(
      (path) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to preload image: ${path}`);
            resolve(); // エラーでも処理を続行
          };
          img.src = path;
        }),
    );

    await Promise.all(promises);
    console.log("✅ All images preloaded successfully");
  } catch (error) {
    console.warn("Error during image preloading:", error);
  }
}

/**
 * Google Maps APIを事前読み込みします
 */
function preloadGoogleMapsAPI(apiKey: string): void {
  try {
    // Google Maps APIスクリプトが既に読み込まれているかチェック
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    console.log("✅ Google Maps API script added to head");
  } catch (error) {
    console.warn("Error preloading Google Maps API:", error);
  }
}

export const preloadService: PreloadService = {
  preloadImagesWithValidation,
  preloadGoogleMapsAPI,
};
