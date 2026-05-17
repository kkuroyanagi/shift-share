import { describe, it, expect } from 'vitest';
import {
  cn,
  getCurrentFiscalYear,
  getFiscalYearRange,
  dayOfWeekName,
  formatTime,
  timeToMinutes,
  durationMinutes,
  formatMinutes,
  stdDev
} from './utils';

describe('lib/utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });
  });

  describe('getCurrentFiscalYear', () => {
    it('should return current year for April-March', () => {
      const aprilDate = new Date(2024, 3, 15); // April 15, 2024
      expect(getCurrentFiscalYear(aprilDate)).toBe(2024);
      
      const marchDate = new Date(2024, 2, 15); // March 15, 2024
      expect(getCurrentFiscalYear(marchDate)).toBe(2023);
    });

    it('should handle year boundary correctly', () => {
      const april1 = new Date(2024, 3, 1); // April 1, 2024
      expect(getCurrentFiscalYear(april1)).toBe(2024);
      
      const march31 = new Date(2024, 2, 31); // March 31, 2024
      expect(getCurrentFiscalYear(march31)).toBe(2023);
    });
  });

  describe('getFiscalYearRange', () => {
    it('should return correct fiscal year range', () => {
      const range = getFiscalYearRange(2024);
      expect(range.start).toEqual(new Date(2024, 3, 1)); // April 1, 2024
      expect(range.end).toEqual(new Date(2025, 2, 31)); // March 31, 2025
    });
  });

  describe('dayOfWeekName', () => {
    it('should return correct Japanese day names', () => {
      expect(dayOfWeekName(0)).toBe('日');
      expect(dayOfWeekName(1)).toBe('月');
      expect(dayOfWeekName(2)).toBe('火');
      expect(dayOfWeekName(3)).toBe('水');
      expect(dayOfWeekName(4)).toBe('木');
      expect(dayOfWeekName(5)).toBe('金');
      expect(dayOfWeekName(6)).toBe('土');
    });

    it('should return empty string for invalid day', () => {
      expect(dayOfWeekName(7)).toBe('');
      expect(dayOfWeekName(-1)).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(formatTime('09:30:00')).toBe('09:30');
      expect(formatTime('14:45:30')).toBe('14:45');
      expect(formatTime('00:00:00')).toBe('00:00');
    });
  });

  describe('timeToMinutes', () => {
    it('should convert time to minutes correctly', () => {
      expect(timeToMinutes('09:30')).toBe(570); // 9*60 + 30
      expect(timeToMinutes('14:45')).toBe(885); // 14*60 + 45
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('23:59')).toBe(1439); // 23*60 + 59
    });
  });

  describe('durationMinutes', () => {
    it('should calculate duration correctly', () => {
      expect(durationMinutes('09:00', '17:00')).toBe(480); // 8 hours
      expect(durationMinutes('09:30', '12:30')).toBe(180); // 3 hours
      expect(durationMinutes('14:00', '14:30')).toBe(30); // 30 minutes
    });

    it('should handle negative duration', () => {
      expect(durationMinutes('17:00', '09:00')).toBe(-480);
    });
  });

  describe('formatMinutes', () => {
    it('should format positive minutes correctly', () => {
      expect(formatMinutes(60)).toBe('1h');
      expect(formatMinutes(90)).toBe('1h30m');
      expect(formatMinutes(480)).toBe('8h');
      expect(formatMinutes(45)).toBe('0h45m');
    });

    it('should format negative minutes correctly', () => {
      expect(formatMinutes(-60)).toBe('-1h');
      expect(formatMinutes(-90)).toBe('-1h30m');
      expect(formatMinutes(-480)).toBe('-8h');
    });

    it('should handle zero minutes', () => {
      expect(formatMinutes(0)).toBe('0h');
    });
  });

  describe('stdDev', () => {
    it('should calculate standard deviation correctly', () => {
      expect(stdDev([1, 2, 3, 4, 5])).toBeCloseTo(1.414, 2);
      expect(stdDev([2, 4, 6, 8])).toBeCloseTo(2.236, 2);
      expect(stdDev([5, 5, 5, 5])).toBe(0);
    });

    it('should handle empty array', () => {
      expect(stdDev([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(stdDev([5])).toBe(0);
    });

    it('should handle mixed positive and negative values', () => {
      expect(stdDev([-2, -1, 0, 1, 2])).toBeCloseTo(1.414, 2);
    });
  });
});