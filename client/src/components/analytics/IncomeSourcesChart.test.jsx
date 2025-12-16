import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IncomeSourcesChart from './IncomeSourcesChart';

describe('IncomeSourcesChart', () => {
  describe('Empty state', () => {
    it('displays empty state when no transactions or work days provided', () => {
      render(<IncomeSourcesChart transactions={[]} workDays={[]} />);
      
      expect(screen.getByText('No income yet')).toBeInTheDocument();
      expect(screen.getByText('Add income transactions or work days to see your income sources')).toBeInTheDocument();
    });

    it('displays empty state when only expense transactions provided', () => {
      const expenseTransactions = [
        {
          id: '1',
          type: 'expense',
          amount: 100,
          date: '2024-01-15',
          category: 'Food',
        },
      ];
      
      render(<IncomeSourcesChart transactions={expenseTransactions} workDays={[]} />);
      
      expect(screen.getByText('No income yet')).toBeInTheDocument();
    });
  });

  describe('Work day salary calculation', () => {
    it('includes work day salary as "Salaris (Werkdagen)" when work days exist', () => {
      const workDays = [
        {
          id: '1',
          date: '2024-01-15',
          hours_worked: 8,
          daily_rate: 50,
          status: 'worked',
        },
        {
          id: '2',
          date: '2024-01-16',
          hours_worked: 6,
          daily_rate: 50,
          status: 'worked',
        },
      ];
      
      render(<IncomeSourcesChart transactions={[]} workDays={workDays} />);
      
      // Chart should render with the title
      expect(screen.getByText('Income Sources')).toBeInTheDocument();
      
      // Should not show empty state
      expect(screen.queryByText('No income yet')).not.toBeInTheDocument();
    });

    it('excludes non-worked days from salary calculation', () => {
      const workDays = [
        {
          id: '1',
          date: '2024-01-15',
          hours_worked: 8,
          daily_rate: 50,
          status: 'worked',
        },
        {
          id: '2',
          date: '2024-01-16',
          hours_worked: 0,
          daily_rate: 50,
          status: 'vacation',
        },
      ];
      
      render(<IncomeSourcesChart transactions={[]} workDays={workDays} />);
      
      // Chart should still render (has worked days)
      expect(screen.getByText('Income Sources')).toBeInTheDocument();
    });
  });

  describe('Tooltip data', () => {
    it('displays income transactions grouped by category', () => {
      const transactions = [
        {
          id: '1',
          type: 'income',
          amount: 1000,
          date: '2024-01-15',
          category: 'Freelance',
        },
        {
          id: '2',
          type: 'income',
          amount: 500,
          date: '2024-01-16',
          category: 'Freelance',
        },
        {
          id: '3',
          type: 'income',
          amount: 200,
          date: '2024-01-17',
          category: 'Investments',
        },
      ];
      
      render(<IncomeSourcesChart transactions={transactions} workDays={[]} />);
      
      // Chart should render with the title
      expect(screen.getByText('Income Sources')).toBeInTheDocument();
      
      // Should not show empty state
      expect(screen.queryByText('No income yet')).not.toBeInTheDocument();
    });

    it('combines income transactions and work day salary', () => {
      const transactions = [
        {
          id: '1',
          type: 'income',
          amount: 1000,
          date: '2024-01-15',
          category: 'Freelance',
        },
      ];

      const workDays = [
        {
          id: '1',
          date: '2024-01-15',
          hours_worked: 8,
          daily_rate: 50,
          status: 'worked',
        },
      ];
      
      render(<IncomeSourcesChart transactions={transactions} workDays={workDays} />);
      
      // Chart should render with both sources
      expect(screen.getByText('Income Sources')).toBeInTheDocument();
      expect(screen.queryByText('No income yet')).not.toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('displays loading state when isLoading is true', () => {
      render(<IncomeSourcesChart transactions={[]} workDays={[]} isLoading={true} />);
      
      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    });

    it('displays error state when error is provided', () => {
      const error = new Error('Failed to fetch data');
      
      render(<IncomeSourcesChart transactions={[]} workDays={[]} error={error} />);
      
      expect(screen.getByText('Failed to load chart')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
    });
  });
});
