import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YearSelector } from './year-selector';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn()
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/dashboard')
}));

// Mock server actions
vi.mock('@/actions/year', () => ({
  setYear: vi.fn()
}));

describe('components/YearSelector', () => {
  const mockProps = {
    currentYear: 2024,
    availableYears: [2022, 2023, 2024, 2025]
  };

  it('should render year selector with current year', () => {
    render(<YearSelector {...mockProps} />);
    
    // Should show current year as selected
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024年度')).toBeInTheDocument();
  });

  it('should render all available years in options', async () => {
    render(<YearSelector {...mockProps} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.click(select);
    
    // Should show all available years
    await waitFor(() => {
      expect(screen.getByText('2022年度')).toBeInTheDocument();
      expect(screen.getByText('2023年度')).toBeInTheDocument();
      expect(screen.getByText('2024年度')).toBeInTheDocument();
      expect(screen.getByText('2025年度')).toBeInTheDocument();
    });
  });

  it('should handle year change', async () => {
    const mockSetYear = vi.fn();
    vi.mocked(setYear).mockImplementation(mockSetYear);
    
    render(<YearSelector {...mockProps} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2023' } });
    
    await waitFor(() => {
      expect(mockSetYear).toHaveBeenCalledWith(2023);
    });
  });

  it('should handle empty available years', () => {
    render(<YearSelector currentYear={2024} availableYears={[]} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(<YearSelector {...mockProps} className="custom-class" />);
    
    const container = screen.getByRole('combobox').closest('div');
    expect(container).toHaveClass('custom-class');
  });
});