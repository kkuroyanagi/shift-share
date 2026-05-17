import { describe, it, expect } from 'vitest';
import { render, screen } from '../src/test/utils';
import { PatternPreview } from './pattern-preview';
import { createMockWorker } from '../src/test/utils';

describe('components/PatternPreview', () => {
  const mockPattern = {
    id: 1,
    workerId: 1,
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockWorker = createMockWorker();

  it('should render pattern preview with worker name and day', () => {
    render(
      <PatternPreview 
        pattern={mockPattern} 
        worker={mockWorker}
      />
    );

    expect(screen.getByText('Test Worker')).toBeInTheDocument();
    expect(screen.getByText('月')).toBeInTheDocument(); // Monday in Japanese
    expect(screen.getByText('09:00-17:00')).toBeInTheDocument();
  });

  it('should render inactive pattern with different styling', () => {
    const inactivePattern = { ...mockPattern, isActive: false };
    
    render(
      <PatternPreview 
        pattern={inactivePattern} 
        worker={mockWorker}
      />
    );

    const container = screen.getByText('Test Worker').closest('div');
    expect(container).toHaveClass('opacity-50');
  });

  it('should render all days of week correctly', () => {
    const days = [
      { dayOfWeek: 0, expected: '日' },
      { dayOfWeek: 1, expected: '月' },
      { dayOfWeek: 2, expected: '火' },
      { dayOfWeek: 3, expected: '水' },
      { dayOfWeek: 4, expected: '木' },
      { dayOfWeek: 5, expected: '金' },
      { dayOfWeek: 6, expected: '土' }
    ];

    days.forEach(({ dayOfWeek, expected }) => {
      const pattern = { ...mockPattern, dayOfWeek };
      const { unmount } = render(
        <PatternPreview pattern={pattern} worker={mockWorker} />
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('should format time correctly', () => {
    const timeVariations = [
      { startTime: '08:30', endTime: '16:30', expected: '08:30-16:30' },
      { startTime: '13:00', endTime: '22:00', expected: '13:00-22:00' },
      { startTime: '00:00', endTime: '08:00', expected: '00:00-08:00' }
    ];

    timeVariations.forEach(({ startTime, endTime, expected }) => {
      const pattern = { ...mockPattern, startTime, endTime };
      const { unmount } = render(
        <PatternPreview pattern={pattern} worker={mockWorker} />
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle missing worker gracefully', () => {
    render(
      <PatternPreview pattern={mockPattern} worker={undefined} />
    );

    expect(screen.getByText('Unknown Worker')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <PatternPreview 
        pattern={mockPattern} 
        worker={mockWorker}
        className="custom-class"
      />
    );

    const container = screen.getByText('Test Worker').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('should show pattern duration', () => {
    render(
      <PatternPreview pattern={mockPattern} worker={mockWorker} />
    );

    // 09:00-17:00 = 8 hours
    expect(screen.getByText('8h')).toBeInTheDocument();
  });

  it('should handle overnight shifts', () => {
    const overnightPattern = {
      ...mockPattern,
      startTime: '22:00',
      endTime: '06:00'
    };
    
    render(
      <PatternPreview pattern={overnightPattern} worker={mockWorker} />
    );

    expect(screen.getByText('22:00-06:00')).toBeInTheDocument();
    // Should show negative duration or handle overnight calculation
    expect(screen.getByText('-16h')).toBeInTheDocument();
  });
});