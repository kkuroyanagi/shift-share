import { describe, it, expect, vi } from 'vitest';
import { getSelectedYear } from './year';

// Mock the cookies function
vi.mock('next/headers', () => ({
  cookies: vi.fn()
}));

// Mock the utils function
vi.mock('@/lib/utils', () => ({
  getCurrentFiscalYear: vi.fn()
}));

import { cookies } from 'next/headers';
import { getCurrentFiscalYear } from '@/lib/utils';

const mockCookies = vi.mocked(cookies);
const mockGetCurrentFiscalYear = vi.mocked(getCurrentFiscalYear);

describe('lib/year', () => {
  describe('getSelectedYear', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return cookie value when valid', async () => {
      const mockStore = {
        get: vi.fn().mockReturnValue({ value: '2024' })
      };
      mockCookies.mockResolvedValue(mockStore as any);

      const result = await getSelectedYear();
      expect(result).toBe(2024);
      expect(mockStore.get).toHaveBeenCalledWith('fiscal-year');
    });

    it('should return current fiscal year when no cookie', async () => {
      const mockStore = {
        get: vi.fn().mockReturnValue(undefined)
      };
      mockCookies.mockResolvedValue(mockStore as any);
      mockGetCurrentFiscalYear.mockReturnValue(2023);

      const result = await getSelectedYear();
      expect(result).toBe(2023);
      expect(mockGetCurrentFiscalYear).toHaveBeenCalled();
    });

    it('should return current fiscal year when cookie value is invalid', async () => {
      const mockStore = {
        get: vi.fn().mockReturnValue({ value: 'invalid' })
      };
      mockCookies.mockResolvedValue(mockStore as any);
      mockGetCurrentFiscalYear.mockReturnValue(2023);

      const result = await getSelectedYear();
      expect(result).toBe(2023);
      expect(mockGetCurrentFiscalYear).toHaveBeenCalled();
    });

    it('should return current fiscal year when cookie year is out of range', async () => {
      const mockStore = {
        get: vi.fn().mockReturnValue({ value: '1999' }) // Too old
      };
      mockCookies.mockResolvedValue(mockStore as any);
      mockGetCurrentFiscalYear.mockReturnValue(2023);

      let result = await getSelectedYear();
      expect(result).toBe(2023);

      // Test upper bound
      mockStore.get.mockReturnValue({ value: '2101' }); // Too new
      result = await getSelectedYear();
      expect(result).toBe(2023);
    });

    it('should accept valid year ranges', async () => {
      const mockStore = {
        get: vi.fn()
      };
      mockCookies.mockResolvedValue(mockStore as any);

      // Test lower bound
      mockStore.get.mockReturnValue({ value: '2020' });
      let result = await getSelectedYear();
      expect(result).toBe(2020);

      // Test upper bound
      mockStore.get.mockReturnValue({ value: '2100' });
      result = await getSelectedYear();
      expect(result).toBe(2100);
    });
  });
});