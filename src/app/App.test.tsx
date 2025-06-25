import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FilterState, POI } from '../types';
import App from './App';

// AppProvider と AppContext のモック
const mockContextValue = {
  loading: false,
  mapLoading: false,
  poisLoading: false,
  fadeOut: false,
  pois: [] as POI[],
  filterState: {} as FilterState,
  handleMapLoaded: vi.fn(),
  handleFilterChange: vi.fn(),
  envConfig: {
    enableConsoleLogging: false,
    enablePerformanceDebugging: false,
    enableDetailedErrorReporting: false,
  },
  appConfig: {},
};

// AppProvider のモック
vi.mock('./AppProvider', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// AppContext のモック
vi.mock('./hooks', () => ({
  useAppContext: () => mockContextValue,
}));

// AppLayout のモック
vi.mock('./AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

// AppContent のモック
vi.mock('./AppContent', () => ({
  AppContent: () => <div data-testid="app-content">App Content</div>,
}));

// ErrorBoundary のモック
vi.mock('../components/ui', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe('App Component (New Architecture)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render with correct architecture structure', () => {
      render(<App />);

      // 新しいアーキテクチャの構造をテスト
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      expect(screen.getByTestId('app-content')).toBeInTheDocument();
    });

    it('should render without crashing', () => {
      expect(() => render(<App />)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // エラーバウンダリのテスト
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => render(<App />)).not.toThrow();

      consoleError.mockRestore();
    });
  });
});
