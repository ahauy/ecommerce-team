import '@testing-library/jest-dom';
import { vi } from 'vitest';

(globalThis as unknown as { jest: typeof vi }).jest = vi;

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
