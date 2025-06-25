/// <reference types="vitest/globals" />
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// テスト環境のセットアップ
Object.defineProperty(global, 'ResizeObserver', {
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// より包括的なGoogle Maps APIモック
Object.defineProperty(window, 'google', {
  value: {
    maps: {
      Map: vi.fn().mockImplementation(() => ({
        setCenter: vi.fn(),
        setZoom: vi.fn(),
        fitBounds: vi.fn(),
        addListener: vi.fn(),
        getCenter: vi.fn(() => ({ lat: 38.0549, lng: 138.3691 })),
        getZoom: vi.fn(() => 10),
      })),
      Marker: vi.fn().mockImplementation(() => ({
        setMap: vi.fn(),
        setPosition: vi.fn(),
        setVisible: vi.fn(),
        getPosition: vi.fn(() => ({ lat: 38.0549, lng: 138.3691 })),
        addListener: vi.fn(),
      })),
      InfoWindow: vi.fn().mockImplementation(() => ({
        open: vi.fn(),
        close: vi.fn(),
        setContent: vi.fn(),
        getContent: vi.fn(),
      })),
      MarkerClusterer: vi.fn().mockImplementation(() => ({
        addMarkers: vi.fn(),
        clearMarkers: vi.fn(),
        setMap: vi.fn(),
      })),
      LatLng: vi
        .fn()
        .mockImplementation((lat: number, lng: number) => ({ lat, lng })),
      LatLngBounds: vi.fn().mockImplementation(() => ({
        extend: vi.fn(),
        contains: vi.fn(),
        getNorthEast: vi.fn(),
        getSouthWest: vi.fn(),
      })),
      geometry: {
        spherical: {
          computeDistanceBetween: vi.fn(() => 1000),
          computeHeading: vi.fn(() => 45),
        },
      },
      event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        trigger: vi.fn(),
      },
      places: {
        PlacesService: vi.fn().mockImplementation(() => ({
          nearbySearch: vi.fn(),
          textSearch: vi.fn(),
          getDetails: vi.fn(),
        })),
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
        },
      },
    },
  },
});

// Web APIs のモック
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Geolocation API のモック
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(
      (success: (position: GeolocationPosition) => void) => {
        const mockPosition: GeolocationPosition = {
          coords: {
            latitude: 38.0549,
            longitude: 138.3691,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: vi.fn(),
          } as GeolocationCoordinates,
          timestamp: Date.now(),
          toJSON: vi.fn(),
        };
        success(mockPosition);
      }
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// IntersectionObserver のモック
Object.defineProperty(window, 'IntersectionObserver', {
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});

// matchMedia のモック
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// requestIdleCallback のモック
Object.defineProperty(window, 'requestIdleCallback', {
  value: vi.fn((callback: () => void) => {
    return setTimeout(() => {
      callback();
    }, 0);
  }),
});

Object.defineProperty(window, 'cancelIdleCallback', {
  value: vi.fn(),
});

// Worker のモック
Object.defineProperty(window, 'Worker', {
  value: vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
  })),
});

// Performance API のモック
Object.defineProperty(window, 'performance', {
  value: {
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    now: vi.fn(() => Date.now()),
    timing: {},
    navigation: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    getEntries: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    clearResourceTimings: vi.fn(),
    setResourceTimingBufferSize: vi.fn(),
    toJSON: vi.fn(),
  },
});
