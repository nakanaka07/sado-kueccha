/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";
import { vi } from "vitest";

// テスト環境のセットアップ
Object.defineProperty(global, "ResizeObserver", {
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Google Maps APIの簡単なモック
Object.defineProperty(window, "google", {
  value: {
    maps: {
      Map: vi.fn(),
      Marker: vi.fn(),
      InfoWindow: vi.fn(),
    },
  },
});
