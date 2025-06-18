/**
 * 🌐 SNS・ソーシャルメディア関連ユーティリティ
 * 最新のSNSプラットフォームとセキュリティ対策に対応
 */

// 🎭 SNS関連の型定義（強化版）
export interface LinkPart {
  readonly type: "link";
  readonly key: number;
  readonly href: string;
  readonly icon: string;
  readonly className: string;
  readonly platform?: string; // プラットフォーム識別用
  readonly isSecure?: boolean; // HTTPS判定
}

export interface TextPart {
  readonly type: "text";
  readonly key: number;
  readonly content: string;
}

export type ParsedTextPart = LinkPart | TextPart;

// 🔗 SNS関連の定数（2024年版・拡張対応）
const SNS_DOMAIN_ICONS = {
  "twitter.com": { icon: "🐦", platform: "Twitter" },
  "x.com": { icon: "🐦", platform: "X (Twitter)" },
  "instagram.com": { icon: "📷", platform: "Instagram" },
  "facebook.com": { icon: "📘", platform: "Facebook" },
  "youtube.com": { icon: "🎥", platform: "YouTube" },
  "tiktok.com": { icon: "🎵", platform: "TikTok" },
  "linkedin.com": { icon: "💼", platform: "LinkedIn" },
  "discord.com": { icon: "💬", platform: "Discord" },
  "github.com": { icon: "🐙", platform: "GitHub" },
  "reddit.com": { icon: "🔴", platform: "Reddit" },
  "pinterest.com": { icon: "📌", platform: "Pinterest" },
  "snapchat.com": { icon: "👻", platform: "Snapchat" },
  "telegram.org": { icon: "✈️", platform: "Telegram" },
  "whatsapp.com": { icon: "💬", platform: "WhatsApp" },
  "line.me": { icon: "💚", platform: "LINE" },
} as const;

type SNSDomain = keyof typeof SNS_DOMAIN_ICONS;

const DEFAULT_LINK_CONFIG = {
  icon: "🔗",
  platform: "Webサイト",
} as const;

// 🛡️ より精密で安全なURL正規表現（セキュリティ強化版）
const URL_REGEX =
  /(https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*)?(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)/g;

/**
 * 🔍 URLからSNSアイコンとプラットフォーム情報を取得
 * @param url - 判定するURL
 * @returns SNS情報オブジェクト
 */
export function getSNSInfo(url: string): { icon: string; platform: string; isSecure: boolean } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const isSecure = urlObj.protocol === "https:";

    // ドメインの完全一致または適切なサブドメイン一致をチェック
    const domainKeys = Object.keys(SNS_DOMAIN_ICONS) as SNSDomain[];
    for (const domain of domainKeys) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        const snsInfo = SNS_DOMAIN_ICONS[domain];
        return {
          icon: snsInfo.icon,
          platform: snsInfo.platform,
          isSecure,
        };
      }
    }

    return {
      icon: DEFAULT_LINK_CONFIG.icon,
      platform: DEFAULT_LINK_CONFIG.platform,
      isSecure,
    };
  } catch {
    // 無効なURLの場合はデフォルト設定を返す
    return {
      icon: DEFAULT_LINK_CONFIG.icon,
      platform: DEFAULT_LINK_CONFIG.platform,
      isSecure: false,
    };
  }
}

/**
 * 🧩 テキスト内のURLを検出してパース（セキュリティ強化版）
 * XSS攻撃を防ぐためのサニタイゼーション機能付き
 * @param text - パース対象のテキスト
 * @param linkClassName - リンクに適用するCSSクラス名
 * @returns パース済みテキスト部分の配列
 */
export function parseTextWithLinks(
  text: string,
  linkClassName = "info-window-link",
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

  // テキストをサニタイズ（基本的なXSS対策）
  const sanitizedText = sanitizeText(text);
  const parts = sanitizedText.split(URL_REGEX);
  const result: ParsedTextPart[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part) continue; // 空文字列をスキップ

    if (part.match(URL_REGEX)) {
      const snsInfo = getSNSInfo(part);

      result.push({
        type: "link",
        key: i,
        href: part,
        icon: snsInfo.icon,
        className: linkClassName,
        platform: snsInfo.platform,
        isSecure: snsInfo.isSecure,
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

/**
 * 🛡️ テキストのサニタイゼーション（XSS対策）
 * @param text - サニタイズ対象のテキスト
 * @returns サニタイズ済みテキスト
 */
function sanitizeText(text: string): string {
  return text.replace(/[<>&"']/g, (match) => {
    const escapeMap: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return escapeMap[match] || match;
  });
}

/**
 * 🔗 URLの妥当性を検証（セキュリティチェック付き）
 * @param url - 検証するURL
 * @returns 有効なURLの場合true
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // HTTPまたはHTTPSのみ許可
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // ローカルホストやプライベートIPアドレスをチェック
    const hostname = urlObj.hostname.toLowerCase();
    const privateIpPattern = /^172\.(1[6-9]|2[0-9]|3[01])\./;
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      privateIpPattern.exec(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 📱 SNSシェア用URLを生成（新機能）
 * @param platform - SNSプラットフォーム
 * @param options - シェアオプション
 * @returns シェア用URL
 */
export function generateShareUrl(
  platform: string,
  options: {
    url: string;
    text?: string;
    hashtags?: string[];
  },
): string | null {
  const { url, text = "", hashtags = [] } = options;

  if (!isValidUrl(url)) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const encodedHashtags = hashtags.map((tag) => encodeURIComponent(tag)).join(",");

  switch (platform.toLowerCase()) {
    case "twitter":
    case "x":
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}${
        hashtags.length > 0 ? `&hashtags=${encodedHashtags}` : ""
      }`;

    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    case "line":
      return `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;

    case "copy":
      // クリップボードコピー用（特別なケース）
      return url;

    default:
      return null;
  }
}

/**
 * 📊 SNSリンクの統計情報を取得（新機能）
 * @param parsedParts - パース済みテキスト部分
 * @returns 統計情報
 */
export function getSocialMediaStats(parsedParts: ParsedTextPart[]): {
  totalLinks: number;
  socialLinks: number;
  platforms: string[];
  secureLinks: number;
} {
  const linkParts = parsedParts.filter((part): part is LinkPart => part.type === "link");

  const socialPlatforms = Object.values(SNS_DOMAIN_ICONS).map((info) => info.platform);
  const socialLinks = linkParts.filter(
    (link) => link.platform && (socialPlatforms as readonly string[]).includes(link.platform),
  );

  const platforms = Array.from(
    new Set(
      linkParts
        .map((link) => link.platform)
        .filter((platform): platform is string => Boolean(platform)),
    ),
  );

  const secureLinks = linkParts.filter((link) => link.isSecure).length;

  return {
    totalLinks: linkParts.length,
    socialLinks: socialLinks.length,
    platforms,
    secureLinks,
  };
}
