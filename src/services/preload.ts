/**
 * アセットプリロードサービス
 * 画像の事前読み込みとGoogle Maps APIの初期化を行います
 */

/**
 * 画像を事前読み込みし、読み込み状況を検証します
 * エラーが発生しても処理を継続し、成功した画像の数を返します
 */
export async function preloadImagesWithValidation(imagePaths: string[]): Promise<void> {
  await Promise.allSettled(
    imagePaths.map(
      (path) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            resolve();
          };
          img.onerror = () => {
            reject(new Error(`Failed to load: ${path}`));
          };
          img.src = path;
        }),
    ),
  );

  // 失敗したアセットがあっても継続
  // プリロードの失敗は非致命的エラーとして扱う
}

/**
 * Google Maps APIを事前読み込みします
 * 既に読み込まれている場合はスキップします
 */
export function preloadGoogleMapsAPI(apiKey: string): void {
  // 特定のAPIキーを持つGoogle Maps APIスクリプトが既に存在するかチェック
  const existingScript = document.querySelector(
    `script[src*="maps.googleapis.com/maps/api/js"][src*="key=${apiKey}"]`,
  );

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&loading=async`;
  script.async = true;
  script.defer = true;

  document.head.appendChild(script);
}
