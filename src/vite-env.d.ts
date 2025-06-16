/// <reference types="vite/client" />

// Vite環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_CACHE_TTL?: string;
  readonly VITE_SHEETS_RECOMMENDED?: string;
  readonly VITE_SHEETS_TOILETS?: string;
  readonly VITE_SHEETS_PARKING?: string;
  readonly VITE_SHEETS_RYOTSU_AIKAWA?: string;
  readonly VITE_SHEETS_KANAI_SAWADA?: string;
  readonly VITE_SHEETS_AKADOMARI_HAMOCHI?: string;
  readonly VITE_SHEETS_SNACKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// CSSファイルの型定義
declare module "*.css" {
  const content: string;
  export default content;
}
