// SNS関連の型定義
export interface LinkPart {
  readonly type: "link";
  readonly key: number;
  readonly href: string;
  readonly icon: string;
  readonly className: string;
}

export interface TextPart {
  readonly type: "text";
  readonly key: number;
  readonly content: string;
}

export type ParsedTextPart = LinkPart | TextPart;

// SNS関連の定数（defaultを分離して型安全性を向上）
const SNS_DOMAIN_ICONS = {
  "twitter.com": "🐦",
  "x.com": "🐦",
  "instagram.com": "📷",
  "facebook.com": "📘",
  "youtube.com": "🎥",
  "tiktok.com": "🎵",
} as const;

type SNSDomain = keyof typeof SNS_DOMAIN_ICONS;

const DEFAULT_LINK_ICON = "🔗";

// より精密なURL正規表現（句読点や括弧を適切に処理）
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+[^\s<>"{}|\\^`[\].,;:!?)])/g;

/**
 * URLからSNSアイコンを取得する
 * @param url - 判定するURL
 * @returns SNSアイコン文字列
 */
export function getSNSIcon(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // ドメインの完全一致または適切なサブドメイン一致をチェック
    const domainKeys = Object.keys(SNS_DOMAIN_ICONS) as SNSDomain[];
    for (const domain of domainKeys) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return SNS_DOMAIN_ICONS[domain];
      }
    }

    return DEFAULT_LINK_ICON;
  } catch {
    // 無効なURLの場合はデフォルトアイコンを返す
    return DEFAULT_LINK_ICON;
  }
}

/**
 * テキスト内のURLを検出してパースする
 * @param text - パース対象のテキスト
 * @param linkClassName - リンクに適用するCSSクラス名
 * @returns パース済みテキスト部分の配列
 */
export function parseTextWithLinks(
  text: string,
  linkClassName: string = "info-window-link",
): ParsedTextPart[] {
  if (!text || typeof text !== "string") {
    return [
      {
        type: "text",
        key: 0,
        content: text || "",
      },
    ];
  }

  const parts = text.split(URL_REGEX);
  const result: ParsedTextPart[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part) continue; // 空文字列をスキップ

    if (part.match(URL_REGEX)) {
      result.push({
        type: "link",
        key: i,
        href: part,
        icon: getSNSIcon(part),
        className: linkClassName,
      });
    } else {
      result.push({
        type: "text",
        key: i,
        content: part,
      });
    }
  }

  return result;
}

// 後方互換性のためのエイリアス（廃止予定）
/** @deprecated parseTextWithLinksを使用してください */
export const linkifyText = parseTextWithLinks;
