/**
 * アセット解決ユーティリティのテスト
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ASSETS,
  checkAssetExists,
  clearAssetCache,
  getAssetCacheStats,
  getCriticalAssets,
  resolveAssetPath,
} from './assets';

// モックの設定
vi.mock('./env', () => ({
  getAppConfig: vi.fn(() => ({
    app: {
      basePath: '',
    },
  })),
}));

describe('Assets Utility', () => {
  beforeEach(() => {
    clearAssetCache();
  });

  describe('resolveAssetPath', () => {
    it('should handle empty or invalid inputs', () => {
      expect(resolveAssetPath('')).toBe('');
      expect(resolveAssetPath(null as unknown as string)).toBe('');
      expect(resolveAssetPath(undefined as unknown as string)).toBe('');
    });

    it('should sanitize dangerous characters', () => {
      const dangerousPath = 'test<script>alert("xss")</script>';
      const result = resolveAssetPath(dangerousPath);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should prevent path traversal attacks', () => {
      const maliciousPath = '../../../etc/passwd';
      const result = resolveAssetPath(maliciousPath);
      expect(result).toBe('');
    });

    it('should handle HTTPS URLs correctly', () => {
      const httpsUrl = 'https://example.com/image.png';
      const result = resolveAssetPath(httpsUrl);
      expect(result).toBe(httpsUrl);
    });

    it('should resolve asset paths correctly', () => {
      const assetPath = 'ano_icon01.png';
      const result = resolveAssetPath(assetPath);
      expect(result).toBe('/assets/ano_icon01.png');
    });

    it('should cache resolved paths', () => {
      const assetPath = 'test-icon.png';

      // 初回呼び出し
      const result1 = resolveAssetPath(assetPath);
      const stats1 = getAssetCacheStats();

      // 2回目呼び出し（キャッシュから取得）
      const result2 = resolveAssetPath(assetPath);
      const stats2 = getAssetCacheStats();

      expect(result1).toBe(result2);
      expect(stats1.size).toBe(1);
      expect(stats2.size).toBe(1); // キャッシュサイズは変わらない
      expect(stats2.entries).toContain(assetPath);
    });
  });

  describe('ASSETS constant', () => {
    it('should have all required icon categories', () => {
      expect(ASSETS.ICONS).toBeDefined();
      expect(ASSETS.ICONS.ANO).toBeDefined();
      expect(ASSETS.ICONS.SHI).toBeDefined();
      expect(ASSETS.ICONS.AREA_MAP).toBeDefined();
      expect(ASSETS.ICONS.MARKERS).toBeDefined();
    });

    it('should have all required title assets', () => {
      expect(ASSETS.TITLE).toBeDefined();
      expect(ASSETS.TITLE.ROW1).toBeDefined();
      expect(ASSETS.TITLE.ROW2).toBeDefined();
    });

    it('should have resolved asset paths', () => {
      expect(ASSETS.ICONS.ANO[1]).toMatch(/^\/assets\//);
      expect(ASSETS.ICONS.MARKERS.CURRENT_LOCATION).toMatch(/^\/assets\//);
      expect(ASSETS.TITLE.ROW1).toMatch(/^\/assets\//);
    });
  });

  describe('checkAssetExists', () => {
    it('should return false for non-existent assets', async () => {
      // fetchをモック
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const exists = await checkAssetExists('/non-existent.png');
      expect(exists).toBe(false);
    });

    it('should return true for existing assets', async () => {
      // fetchをモック（成功レスポンス）
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      } as Response);

      const exists = await checkAssetExists('/existing.png');
      expect(exists).toBe(true);
    });
  });

  describe('getCriticalAssets', () => {
    it('should return array of critical asset paths', () => {
      const criticalAssets = getCriticalAssets();

      expect(Array.isArray(criticalAssets)).toBe(true);
      expect(criticalAssets.length).toBeGreaterThan(0);
      expect(criticalAssets).toContain(ASSETS.ICONS.MARKERS.CURRENT_LOCATION);
      expect(criticalAssets).toContain(ASSETS.ICONS.MARKERS.RECOMMEND);
    });
  });

  describe('cache management', () => {
    it('should clear cache correctly', () => {
      // キャッシュにデータを追加
      resolveAssetPath('test1.png');
      resolveAssetPath('test2.png');

      expect(getAssetCacheStats().size).toBe(2);

      clearAssetCache();
      expect(getAssetCacheStats().size).toBe(0);
    });

    it('should limit cache size', () => {
      // キャッシュサイズ制限をテスト（101個のアイテムを追加）
      for (let i = 0; i < 101; i++) {
        resolveAssetPath(`test${i}.png`);
      }

      const stats = getAssetCacheStats();
      expect(stats.size).toBeLessThanOrEqual(100);
    });
  });
});
