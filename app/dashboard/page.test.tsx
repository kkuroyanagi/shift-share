import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../src/test/utils';
import DashboardPage from './page';

// Mock database and dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => mockDbQuery),
    from: vi.fn(() => mockDbQuery),
  }
}));

vi.mock('@/lib/year', () => ({
  getSelectedYear: vi.fn()
}));

import { getSelectedYear } from '@/lib/year';
const mockGetSelectedYear = vi.mocked(getSelectedYear);

const mockDbQuery = {
  select: vi.fn(() => mockDbQuery),
  from: vi.fn(() => mockDbQuery),
  where: vi.fn(() => mockDbQuery),
  innerJoin: vi.fn(() => mockDbQuery),
  limit: vi.fn(() => mockDbQuery),
  orderBy: vi.fn(() => mockDbQuery),
  // Return empty arrays by default to simulate no data
  then: vi.fn((callback) => callback([])),
  // Mock as promise-like
  [Symbol.toStringTag]: 'Promise'
};

describe('app/dashboard/page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelectedYear.mockResolvedValue(2024);
  });

  it('should render no fiscal year message when no fiscal year exists', async () => {
    // Mock db query to return empty result for fiscal year
    const mockQuery = vi.fn().mockResolvedValue([]);
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callback([]);
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({})
    });

    render(DashboardComponent);

    expect(screen.getByText('年度が設定されていません。')).toBeInTheDocument();
    expect(screen.getByText('管理者ページで年度を作成してください。')).toBeInTheDocument();
  });

  it('should render dashboard title and year when fiscal year exists', async () => {
    // Mock fiscal year exists
    const mockFiscalYear = [{ id: 1, year: 2024, isActive: true }];
    let callCount = 0;
    
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callCount++;
      if (callCount === 1) {
        // First call: fiscal year query
        callback(mockFiscalYear);
      } else {
        // Subsequent calls: assignments and workers
        callback([]);
      }
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({})
    });

    render(DashboardComponent);

    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('2024年度')).toBeInTheDocument();
  });

  it('should render month selector with all fiscal months', async () => {
    const mockFiscalYear = [{ id: 1, year: 2024, isActive: true }];
    let callCount = 0;
    
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callCount++;
      if (callCount === 1) {
        callback(mockFiscalYear);
      } else {
        callback([]);
      }
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({})
    });

    render(DashboardComponent);

    // Check for month selector
    expect(screen.getByText('年度全体')).toBeInTheDocument();
    expect(screen.getByText('4月')).toBeInTheDocument();
    expect(screen.getByText('5月')).toBeInTheDocument();
    expect(screen.getByText('12月')).toBeInTheDocument();
    expect(screen.getByText('1月')).toBeInTheDocument();
    expect(screen.getByText('3月')).toBeInTheDocument();
  });

  it('should render fairness score card', async () => {
    const mockFiscalYear = [{ id: 1, year: 2024, isActive: true }];
    let callCount = 0;
    
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callCount++;
      if (callCount === 1) {
        callback(mockFiscalYear);
      } else {
        callback([]);
      }
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({})
    });

    render(DashboardComponent);

    expect(screen.getByText('公平性スコア')).toBeInTheDocument();
    expect(screen.getByText('乖離の標準偏差（小さいほど公平）')).toBeInTheDocument();
  });

  it('should render employee table headers', async () => {
    const mockFiscalYear = [{ id: 1, year: 2024, isActive: true }];
    let callCount = 0;
    
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callCount++;
      if (callCount === 1) {
        callback(mockFiscalYear);
      } else {
        callback([]);
      }
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({})
    });

    render(DashboardComponent);

    expect(screen.getByText('従業員別 勤務時間')).toBeInTheDocument();
    expect(screen.getByText('名前')).toBeInTheDocument();
    expect(screen.getByText('希望時間')).toBeInTheDocument();
    expect(screen.getByText('確定')).toBeInTheDocument();
    expect(screen.getByText('仮割当')).toBeInTheDocument();
    expect(screen.getByText('乖離')).toBeInTheDocument();
    expect(screen.getByText('乖離率')).toBeInTheDocument();
  });

  it('should show no employees message when no workers exist', async () => {
    const mockFiscalYear = [{ id: 1, year: 2024, isActive: true }];
    let callCount = 0;
    
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callCount++;
      if (callCount === 1) {
        callback(mockFiscalYear);
      } else {
        callback([]); // No workers
      }
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({})
    });

    render(DashboardComponent);

    expect(screen.getByText('従業員が登録されていません')).toBeInTheDocument();
  });

  it('should handle month parameter correctly', async () => {
    const mockFiscalYear = [{ id: 1, year: 2024, isActive: true }];
    let callCount = 0;
    
    vi.mocked(mockDbQuery.then).mockImplementation((callback) => {
      callCount++;
      if (callCount === 1) {
        callback(mockFiscalYear);
      } else {
        callback([]);
      }
      return Promise.resolve();
    });

    const DashboardComponent = await DashboardPage({
      searchParams: Promise.resolve({ month: '4' })
    });

    render(DashboardComponent);

    // Should highlight April when month=4 is selected
    const aprilLink = screen.getByText('4月').closest('a');
    expect(aprilLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});