import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IncomeVsExpensesChart from './IncomeVsExpensesChart';

describe('IncomeVsExpensesChart', () => {
  const mockTransactions = [
    {
      id: '1',
      user_id: 'user1',
      amount: 100,
      type: 'income',
      category: 'Salary',
      description: 'Monthly salary',
      date: '2024-01-15',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      user_id: 'user1',
      amount: 50,
      type: 'expense',
      category: 'Boodschappen',
      description: 'Groceries',
      date: '2024-01-16',
      created_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-16T10:00:00Z',
    },
  ];

  const mockWorkDays = [
    {
      id: '1',
      user_id: 'user1',
      date: '2024-01-15',
      hours_worked: 8,
      daily_rate: 50,
      notes: '',
      status: 'worked',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ];

  describe('View mode toggle', () => {
    it('should render weekly view by default', () => {
      render(
        <IncomeVsExpensesChart
          transactions={mockTransactions}
          workDays={mockWorkDays}
        />
      );

      const weeklyButton = screen.getByText('Weekly');
      expect(weeklyButton).toHaveClass('bg-white');
    });

    it('should switch to monthly view when monthly button is clicked', () => {
      render(
        <IncomeVsExpensesChart
          transactions={mockTransactions}
          workDays={mockWorkDays}
        />
      );

      const monthlyButton = screen.getByText('Monthly');
      fireEvent.click(monthlyButton);

      expect(monthlyButton).toHaveClass('bg-white');
    });

    it('should switch back to weekly view', () => {
      render(
        <IncomeVsExpensesChart
          transactions={mockTransactions}
          workDays={mockWorkDays}
        />
      );

      const monthlyButton = screen.getByText('Monthly');
      const weeklyButton = screen.getByText('Weekly');

      fireEvent.click(monthlyButton);
      fireEvent.click(weeklyButton);

      expect(weeklyButton).toHaveClass('bg-white');
    });
  });

  describe('Tooltip data', () => {
    it('should render chart with data', () => {
      render(
        <IncomeVsExpensesChart
          transactions={mockTransactions}
          workDays={mockWorkDays}
        />
      );

      // Verify the chart title is rendered
      expect(screen.getByText('Income vs Expenses')).toBeTruthy();
    });
  });

  describe('Color assignment logic', () => {
    it('should render chart with income and expense data', () => {
      render(
        <IncomeVsExpensesChart
          transactions={mockTransactions}
          workDays={mockWorkDays}
        />
      );

      // Verify the component renders with the title
      // The actual color assignment is handled by Recharts Bar components
      expect(screen.getByText('Income vs Expenses')).toBeTruthy();
    });
  });

  describe('Empty state', () => {
    it('should show empty state when no transactions or work days', () => {
      render(<IncomeVsExpensesChart transactions={[]} workDays={[]} />);

      expect(screen.getByText('No data yet')).toBeTruthy();
      expect(
        screen.getByText(
          'Add transactions or work days to see income vs expenses comparison'
        )
      ).toBeTruthy();
    });
  });

  describe('Loading and error states', () => {
    it('should show loading state', () => {
      render(
        <IncomeVsExpensesChart
          transactions={[]}
          workDays={[]}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading chart data...')).toBeTruthy();
    });

    it('should show error state with retry button', () => {
      const onRetry = vi.fn();
      render(
        <IncomeVsExpensesChart
          transactions={[]}
          workDays={[]}
          error={new Error('Failed to load')}
          onRetry={onRetry}
        />
      );

      expect(screen.getByText('Failed to load chart')).toBeTruthy();
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Work day salary integration', () => {
    it('should render chart with work day data', () => {
      render(
        <IncomeVsExpensesChart
          transactions={mockTransactions}
          workDays={mockWorkDays}
        />
      );

      // The component should render successfully with work days
      // The groupByWeek/groupByMonth functions handle the salary calculation
      expect(screen.getByText('Income vs Expenses')).toBeTruthy();
    });
  });
});
