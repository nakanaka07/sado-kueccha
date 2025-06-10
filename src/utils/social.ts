// SNS関連の定数
export const SNS_ICONS = {
  "twitter.com": "🐦",
  "x.com": "🐦",
  "instagram.com": "📷",
  "facebook.com": "📘",
  "youtube.com": "🎥",
  "tiktok.com": "🎵",
  default: "🔗",
} as const;

// SNS関連のユーティリティ関数
export class SocialUtils {
  // SNSアイコンを判定
  static getSNSIcon(url: string): string {
    for (const [domain, icon] of Object.entries(SNS_ICONS)) {
      if (domain !== "default" && url.includes(domain)) {
        return icon;
      }
    }
    return SNS_ICONS.default;
  }

  // URLを検出してリンク化する関数
  static linkifyText(text: string, linkClassName: string = "info-window-link") {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return {
          type: "link" as const,
          key: index,
          href: part,
          icon: this.getSNSIcon(part),
          className: linkClassName,
        };
      }
      return {
        type: "text" as const,
        key: index,
        content: part,
      };
    });
  }
}
