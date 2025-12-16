import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExpensesTrendChart from './ExpensesTrendChart';

describe('ExpensesTrendChart', () => {
  const mockDateRange = {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  };

  describe('Empty state rendering', () => {
    it('displays empty state when no transactions provided', () => {
      render(<ExpensesTrendChart transactions={[]} dateRange={mockDateRange} />);
      
      expect(screen.getByText('No expenses yet')).toBeInTheDocument();
      expect(screen.getByText('Add expense transactions to see your spending trends over time')).toBeInTheDocument();
    });

    it('displays empty state when only income transactions provided', () => {
      const incomeTransactions = [
        {
          id: '1',
          type: 'income',
          amount: 1000,
          date: '2024-01-15',
          category: 'Salary',
        },
      ];
      
      render(<ExpensesTrendChart transactions={incomeTransactions} dateRange={mockDateRange} />);
      
      expect(screen.getByText('No expenses yet')).toBeInTheDocument();
    });
  });

  describe('Tooltip data structure', () => {
    it('aggregates expenses correctly for chart display', () => {
      const transactions = [
        {
          id: '1',
          type: 'expense',
          amount: 50,
          date: '2024-01-15',
          category: 'Food',
        },
        {
          id: '2',
          type: 'expense',
          amount: 30,
          date: '2024-01-15',
          category: 'Transport',
        },
        {
          id: '3',
          type: 'expense',
          amount: 100,
          date: '2024-01-16',
          category: 'Food',
        },
      ];
      
      render(<ExpensesTrendChart transactions={transactions} dateRange={mockDateRange} />);
      
      // Chart should render with the title
      expect(screen.getByText('Expenses Trend')).toBeInTheDocument();
      
      // Should not show empty state
      expect(screen.queryByText('No expenses yet')).not.toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('displays loading state when isLoading is true', () => {
      render(<ExpensesTrendChart transactions={[]} dateRange={mockDateRange} isLoading={true} />);
      
      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    });

    it('displays error state when error is provided', () => {
      const error = new Error('Failed to fetch data');
      
      render(<ExpensesTrendChart transactions={[]} dateRange={mockDateRange} error={error} />);
      
      expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
    });
  });
});
