import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn()
  }))
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn()
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn()
  }
}));

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock environment variables if needed
process.env.NODE_ENV = 'test';