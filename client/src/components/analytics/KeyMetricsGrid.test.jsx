import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KeyMetricsGrid from './KeyMetricsGrid';

describe('KeyMetricsGrid', () => {
  const createTransaction = (overrides = {}) => ({
    id: '1',
    user_id: 'user-1',
    amount: 100,
    type: 'expense',
    category: 'Boodschappen',
    description: 'Test transaction',
    date: '2024-01-15',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  });

  const createWorkDay = (overrides = {}) => ({
    id: '1',
    user_id: 'user-1',
    date: '2024-01-15',
    hours_worked: 8,
    daily_rate: 50,
    notes: '',
    status: 'worked',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  });

  const defaultDateRange = {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  };

  describe('negative savings rate styling', () => {
    it('displays negative savings rate in red with warning indicator', () => {
      const transactions = [
        createTransaction({ amount: 1000, type: 'expense' }),
        createTransaction({ amount: 500, type: 'income' }),
      ];

      render(
        <KeyMetricsGrid
          transactions={transactions}
          workDays={[]}
          dateRange={defaultDateRange}
        />
      );

      // Check that savings rate is displayed
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      
      // Check for negative indicator text
      expect(screen.getByText('Spending exceeds income')).toBeInTheDocument();
    });

    it('displays positive savings rate with normal styling', () => {
      const transactions = [
        createTransaction({ amount: 500, type: 'expense' }),
        createTransaction({ amount: 1000, type: 'income' }),
      ];

      render(
        <KeyMetricsGrid
          transactions={transactions}
          workDays={[]}
          dateRange={defaultDateRange}
        />
      );

      // Check that savings rate is displayed
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      
      // Check for positive indicator text
      expect(screen.getByText('Income minus expenses')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles no transactions gracefully', () => {
      render(
        <KeyMetricsGrid
          transactions={[]}
          workDays={[]}
          dateRange={defaultDateRange}
        />
      );

      // Should display all metric cards
      expect(screen.getByText('Avg Daily Spending')).toBeInTheDocument();
      expect(screen.getByText('Highest Expense')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();

      // Should show 0 transactions
      expect(screen.getByText('0')).toBeInTheDocument();
      
      // Should show "No expenses" for highest expense
      expect(screen.getByText('No expenses')).toBeInTheDocument();
    });

    it('handles zero income correctly', () => {
      const transactions = [
        createTransaction({ amount: 500, type: 'expense' }),
      ];

      render(
        <KeyMetricsGrid
          transactions={transactions}
          workDays={[]}
          dateRange={defaultDateRange}
        />
      );

      // With zero income, savings rate should be 0
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('includes work day salary in income calculation', () => {
      const transactions = [
        createTransaction({ amount: 500, type: 'expense' }),
      ];
      
      const workDays = [
        createWorkDay({ hours_worked: 8, daily_rate: 100 }), // 800 income
      ];

      render(
        <KeyMetricsGrid
          transactions={transactions}
          workDays={workDays}
          dateRange={defaultDateRange}
        />
      );

      // With 800 income from work days and 500 expenses, savings rate should be positive
      // (800 - 500) / 800 * 100 = 37.5%
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
      expect(screen.getByText('Income minus expenses')).toBeInTheDocument();
    });

    it('displays correct transaction count', () => {
      const transactions = [
        createTransaction({ id: '1', amount: 100, type: 'expense' }),
        createTransaction({ id: '2', amount: 200, type: 'expense' }),
        createTransaction({ id: '3', amount: 300, type: 'income' }),
      ];

      render(
        <KeyMetricsGrid
          transactions={transactions}
          workDays={[]}
          dateRange={defaultDateRange}
        />
      );

      // Should show 3 transactions
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Based on 3 transactions')).toBeInTheDocument();
    });

    it('displays highest expense with category and date', () => {
      const transactions = [
        createTransaction({ id: '1', amount: 100, type: 'expense', category: 'Food', date: '2024-01-10' }),
        createTransaction({ id: '2', amount: 500, type: 'expense', category: 'Rent', date: '2024-01-15' }),
        createTransaction({ id: '3', amount: 200, type: 'expense', category: 'Transport', date: '2024-01-20' }),
      ];

      render(
        <KeyMetricsGrid
          transactions={transactions}
          workDays={[]}
          dateRange={defaultDateRange}
        />
      );

      // Should show highest expense (500) with category and date
      expect(screen.getByText('Highest Expense')).toBeInTheDocument();
      expect(screen.getByText(/Rent/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1[45]/)).toBeInTheDocument(); // Allow for timezone differences
    });
  });
});
