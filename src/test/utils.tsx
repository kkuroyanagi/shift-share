import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Custom render function for testing React components with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Test data generators
export const createMockWorker = (overrides = {}) => ({
  id: 1,
  name: 'Test Worker',
  email: 'test@example.com',
  desiredHoursPerMonth: 160,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockShiftSlot = (overrides = {}) => ({
  id: 1,
  fiscalYearId: 1,
  date: '2024-04-01',
  startTime: '09:00',
  endTime: '17:00',
  requiredWorkers: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockShiftAssignment = (overrides = {}) => ({
  id: 1,
  shiftSlotId: 1,
  workerId: 1,
  status: 'confirmed' as const,
  assignedAt: new Date(),
  ...overrides
});

export const createMockFiscalYear = (overrides = {}) => ({
  id: 1,
  year: 2024,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Mock database queries
export const mockDbQuery = (result: any) => {
  const query = vi.fn(() => ({
    select: vi.fn(() => query),
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    innerJoin: vi.fn(() => query),
    leftJoin: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    groupBy: vi.fn(() => query),
    having: vi.fn(() => query),
    execute: vi.fn(() => Promise.resolve(result)),
    all: vi.fn(() => Promise.resolve(result)),
    get: vi.fn(() => Promise.resolve(result[0] || null))
  }));
  
  return query();
};

// Common test helpers
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

export const expectLoadingState = () => {
  expect(screen.getByText('Loading...')).toBeInTheDocument();
};

// Time helpers for testing
export const mockCurrentDate = (date: string | Date) => {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
  return mockDate;
};

// re-export everything
export * from '@testing-library/react';
export { customRender as render };