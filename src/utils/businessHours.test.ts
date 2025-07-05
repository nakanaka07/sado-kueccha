/**
 * 営業時間管理ユーティリティのテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParsedHours, StatusType } from '../types/poi';
import {
  isCurrentlyOpen,
  parseTimeString,
  STATUS_CONFIG,
} from './businessHours';

describe('Business Hours Utility', () => {
  beforeEach(() => {
    try {
      vi.useFakeTimers();
    } catch {
      // フェイクタイマーが既に設定されている場合はスキップ
    }
    vi.setSystemTime(new Date('2024-06-26T14:30:00+09:00'));
  });

  afterEach(() => {
    try {
      vi.useRealTimers();
    } catch {
      // エラーが発生してもテストは続行
    }
  });

  describe('parseTimeString', () => {
    it('should handle empty or invalid inputs', () => {
      expect(parseTimeString('')).toEqual({ type: 'unknown' });
      expect(parseTimeString('-')).toEqual({ type: 'unknown' });
      expect(parseTimeString(null as unknown as string)).toEqual({
        type: 'unknown',
      });
    });

    it('should parse 24-hour business correctly', () => {
      expect(parseTimeString('24時間営業')).toEqual({ type: '24h' });
      expect(parseTimeString('24h営業')).toEqual({ type: '24h' });
      expect(parseTimeString('24時間')).toEqual({ type: '24h' });
    });

    it('should parse closed status correctly', () => {
      expect(parseTimeString('定休日')).toEqual({ type: 'closed' });
      expect(parseTimeString('休業日')).toEqual({ type: 'closed' });
      expect(parseTimeString('閉店')).toEqual({ type: 'closed' });
    });

    it('should parse normal business hours correctly', () => {
      const result = parseTimeString('09:00-18:00');
      expect(result).toEqual({
        type: 'normal',
        start: 900,
        end: 1800,
      });
    });

    it('should parse various time formats', () => {
      expect(parseTimeString('10:30-21:45')).toEqual({
        type: 'normal',
        start: 1030,
        end: 2145,
      });

      expect(parseTimeString('8:00-17:00')).toEqual({
        type: 'normal',
        start: 800,
        end: 1700,
      });
    });

    it('should handle irregular hours', () => {
      const result = parseTimeString('営業時間はお問い合わせください');
      expect(result).toEqual({
        type: 'irregular',
        note: '営業時間はお問い合わせください',
      });
    });
  });

  describe('isCurrentlyOpen', () => {
    it('should handle 24h business', () => {
      const hours: ParsedHours = { type: '24h' };
      expect(isCurrentlyOpen(hours)).toBe('24h');
    });

    it('should handle closed business', () => {
      const hours: ParsedHours = { type: 'closed' };
      expect(isCurrentlyOpen(hours)).toBe('closed');
    });

    it('should handle unknown hours', () => {
      const hours: ParsedHours = { type: 'unknown' };
      expect(isCurrentlyOpen(hours)).toBe('unknown');
    });

    it('should handle irregular hours', () => {
      const hours: ParsedHours = {
        type: 'irregular',
        note: 'お問い合わせください',
      };
      expect(isCurrentlyOpen(hours)).toBe('confirmation-needed');
    });

    it('should check normal business hours correctly', () => {
      // 現在時刻: 14:30 (1430)

      // 営業中の場合
      const openHours: ParsedHours = {
        type: 'normal',
        start: 900, // 9:00
        end: 1800, // 18:00
      };
      expect(isCurrentlyOpen(openHours)).toBe('open');

      // 営業時間外の場合（午前）
      const beforeHours: ParsedHours = {
        type: 'normal',
        start: 1500, // 15:00
        end: 2000, // 20:00
      };
      expect(isCurrentlyOpen(beforeHours)).toBe('time-outside');

      // 営業時間外の場合（午後）
      const afterHours: ParsedHours = {
        type: 'normal',
        start: 800, // 8:00
        end: 1400, // 14:00
      };
      expect(isCurrentlyOpen(afterHours)).toBe('time-outside');
    });

    it('should handle edge cases for business hours', () => {
      // 営業開始時刻ちょうど
      vi.setSystemTime(new Date('2024-06-26T09:00:00+09:00'));

      const exactStartHours: ParsedHours = {
        type: 'normal',
        start: 900,
        end: 1800,
      };
      expect(isCurrentlyOpen(exactStartHours)).toBe('open');

      // 営業終了時刻ちょうど
      vi.setSystemTime(new Date('2024-06-26T18:00:00+09:00'));
      expect(isCurrentlyOpen(exactStartHours)).toBe('open');
    });
  });

  describe('STATUS_CONFIG', () => {
    it('should have all required status types', () => {
      const requiredStatuses: StatusType[] = [
        'open',
        'closed',
        'unknown',
        '24h',
        'time-outside',
        'confirmation-needed',
        'temporarily-closed',
        'permanently-closed',
        'opening-soon',
        'closing-soon',
      ];

      requiredStatuses.forEach(status => {
        expect(STATUS_CONFIG[status]).toBeDefined();
        expect(STATUS_CONFIG[status].text).toBeDefined();
        expect(STATUS_CONFIG[status].icon).toBeDefined();
        expect(STATUS_CONFIG[status].colorClass).toBeDefined();
        expect(STATUS_CONFIG[status].ariaLabel).toBeDefined();
        expect(STATUS_CONFIG[status].priority).toBeDefined();
        expect(STATUS_CONFIG[status].description).toBeDefined();
      });
    });

    it('should have correct priority ordering', () => {
      expect(STATUS_CONFIG.open.priority).toBeGreaterThan(
        STATUS_CONFIG.closed.priority
      );
      expect(STATUS_CONFIG['24h'].priority).toBeGreaterThan(
        STATUS_CONFIG['time-outside'].priority
      );
      expect(STATUS_CONFIG['permanently-closed'].priority).toBe(0);
    });

    it('should have appropriate icons', () => {
      expect(STATUS_CONFIG.open.icon).toBe('🟢');
      expect(STATUS_CONFIG.closed.icon).toBe('🔴');
      expect(STATUS_CONFIG.unknown.icon).toBe('⚪');
      expect(STATUS_CONFIG['opening-soon'].icon).toBe('🟡');
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow from parsing to status check', () => {
      // 1. 営業時間文字列をパース
      const hoursString = '10:00-19:00';
      const parsedHours = parseTimeString(hoursString);

      // 2. 現在の営業状態をチェック
      const status = isCurrentlyOpen(parsedHours!);

      // 3. ステータス設定を取得
      const statusConfig = STATUS_CONFIG[status];

      expect(parsedHours).toEqual({
        type: 'normal',
        start: 1000,
        end: 1900,
      });
      expect(status).toBe('open'); // 14:30は営業時間内
      expect(statusConfig.text).toBe('営業中');
      expect(statusConfig.priority).toBe(10);
    });

    it('should handle various business scenarios', () => {
      const scenarios = [
        {
          input: '24時間営業',
          expectedStatus: '24h',
          expectedText: '24時間営業',
        },
        {
          input: '定休日',
          expectedStatus: 'closed',
          expectedText: '定休日',
        },
        {
          input: '営業時間不明',
          expectedStatus: 'unknown',
          expectedText: '営業時間不明',
        },
      ];

      scenarios.forEach(scenario => {
        const parsed = parseTimeString(scenario.input);
        const status = isCurrentlyOpen(parsed!);
        const config = STATUS_CONFIG[status];

        expect(status).toBe(scenario.expectedStatus);
        expect(config.text).toBe(scenario.expectedText);
      });
    });
  });
});
