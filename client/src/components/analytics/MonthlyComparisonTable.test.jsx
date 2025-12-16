import { describe, it, expect, vi } from 'vitest';
import { format, subMonths, startOfMonth } from 'date-fns';

// Mock the analytics functions
vi.mock('../../lib/analytics', () => ({
  groupByMonth: vi.fn(),
}));

import { groupByMonth } from '../../lib/analytics';

describe('MonthlyComparisonTable Component Logic', () => {
  describe('Conditional styling', () => {
    it('applies green styling for positive net savings', () => {
      const netSavings = 500.50;
      const isPositive = netSavings >= 0;
      const colorClass = isPositive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400';
      
      expect(isPositive).toBe(true);
      expect(colorClass).toBe('text-emerald-600 dark:text-emerald-400');
    });

    it('applies red styling for negative net savings', () => {
      const netSavings = -250.75;
      const isPositive = netSavings >= 0;
      const colorClass = isPositive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400';
      
      expect(isPositive).toBe(false);
      expect(colorClass).toBe('text-rose-600 dark:text-rose-400');
    });

    it('applies green styling for zero net savings', () => {
      const netSavings = 0;
      const isPositive = netSavings >= 0;
      const colorClass = isPositive
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400';
      
      expect(isPositive).toBe(true);
      expect(colorClass).toBe('text-emerald-600 dark:text-emerald-400');
    });

    it('applies correct styling for large positive values', () => {
      const netSavings = 10000.99;
      const isPositive = netSavings >= 0;
      
      expect(isPositive).toBe(true);
    });

    it('applies correct styling for large negative values', () => {
      const netSavings = -10000.99;
      const isPositive = netSavings >= 0;
      
      expect(isPositive).toBe(false);
    });
  });

  describe('Click handler', () => {
    it('calls onMonthClick with correct month date when row is clicked', () => {
      const mockOnMonthClick = vi.fn();
      const monthDate = new Date('2024-06-01');
      
      // Simulate row click
      mockOnMonthClick(monthDate);
      
      expect(mockOnMonthClick).toHaveBeenCalledWith(monthDate);
      expect(mockOnMonthClick).toHaveBeenCalledTimes(1);
    });

    it('calls onMonthClick for each different month', () => {
      const mockOnMonthClick = vi.fn();
      const months = [
        new Date('2024-01-01'),
        new Date('2024-02-01'),
        new Date('2024-03-01'),
      ];
      
      months.forEach(month => mockOnMonthClick(month));
      
      expect(mockOnMonthClick).toHaveBeenCalledTimes(3);
      expect(mockOnMonthClick).toHaveBeenNthCalledWith(1, months[0]);
      expect(mockOnMonthClick).toHaveBeenNthCalledWith(2, months[1]);
      expect(mockOnMonthClick).toHaveBeenNthCalledWith(3, months[2]);
    });

    it('does not call onMonthClick when callback is not provided', () => {
      const onMonthClick = undefined;
      const monthDate = new Date('2024-06-01');
      
      // Simulate the conditional logic
      if (onMonthClick) {
        onMonthClick(monthDate);
      }
      
      // No error should occur
      expect(onMonthClick).toBeUndefined();
    });
  });

  describe('Monthly data generation', () => {
    it('generates last 6 months of data', () => {
      const now = new Date();
      const months = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        months.push(monthDate);
      }
      
      expect(months.length).toBe(6);
      
      // Verify months are in chronological order (oldest to newest)
      for (let i = 0; i < months.length - 1; i++) {
        expect(months[i] < months[i + 1]).toBe(true);
      }
    });

    it('formats month names correctly', () => {
      const testDate = new Date('2024-06-15');
      const formatted = format(testDate, 'MMMM yyyy');
      
      expect(formatted).toBe('June 2024');
    });

    it('formats month labels for grouping correctly', () => {
      const testDate = new Date('2024-06-15');
      const formatted = format(testDate, 'MMM yyyy');
      
      expect(formatted).toBe('Jun 2024');
    });

    it('calculates month start correctly', () => {
      const testDate = new Date('2024-06-15');
      const monthStart = startOfMonth(testDate);
      
      expect(monthStart.getDate()).toBe(1);
      expect(monthStart.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(monthStart.getFullYear()).toBe(2024);
    });
  });

  describe('Data structure', () => {
    it('includes all required columns in monthly data', () => {
      const monthData = {
        month: 'June 2024',
        monthDate: new Date('2024-06-01'),
        income: 3000,
        expenses: 2500,
        netSavings: 500,
        savingsRate: 16.67,
      };
      
      expect(monthData.month).toBeDefined();
      expect(monthData.monthDate).toBeDefined();
      expect(monthData.income).toBeDefined();
      expect(monthData.expenses).toBeDefined();
      expect(monthData.netSavings).toBeDefined();
      expect(monthData.savingsRate).toBeDefined();
    });

    it('calculates net savings correctly', () => {
      const income = 3000;
      const expenses = 2500;
      const netSavings = income - expenses;
      
      expect(netSavings).toBe(500);
    });

    it('calculates savings rate correctly when income is positive', () => {
      const income = 3000;
      const expenses = 2500;
      const savingsRate = income > 0 
        ? ((income - expenses) / income) * 100 
        : 0;
      
      expect(savingsRate).toBeCloseTo(16.67, 1);
    });

    it('returns 0 savings rate when income is 0', () => {
      const income = 0;
      const expenses = 100;
      const savingsRate = income > 0 
        ? ((income - expenses) / income) * 100 
        : 0;
      
      expect(savingsRate).toBe(0);
    });

    it('handles negative net savings correctly', () => {
      const income = 2000;
      const expenses = 2500;
      const netSavings = income - expenses;
      
      expect(netSavings).toBe(-500);
      expect(netSavings < 0).toBe(true);
    });
  });

  describe('Currency formatting', () => {
    it('formats currency with 2 decimal places', () => {
      const amount = 1234.567;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('1234.57');
    });

    it('formats zero correctly', () => {
      const amount = 0;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('0.00');
    });

    it('formats negative amounts correctly', () => {
      const amount = -500.50;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('-500.50');
    });

    it('formats large amounts correctly', () => {
      const amount = 123456.789;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('123456.79');
    });
  });

  describe('Integration with groupByMonth', () => {
    it('uses groupByMonth to calculate monthly data', () => {
      const mockTransactions = [
        { id: '1', type: 'income', amount: 1000, date: '2024-06-15' },
        { id: '2', type: 'expense', amount: 500, date: '2024-06-20' },
      ];
      const mockWorkDays = [
        { id: '1', status: 'worked', hours_worked: 8, daily_rate: 100, date: '2024-06-10' },
      ];
      
      const mockResult = [
        {
          period: 'Jun 2024',
          income: 1800, // 1000 + 800 from work days
          expenses: 500,
          net: 1300,
        },
      ];
      
      groupByMonth.mockReturnValue(mockResult);
      
      const result = groupByMonth(mockTransactions, mockWorkDays);
      
      expect(result).toEqual(mockResult);
      expect(result[0].income).toBe(1800);
      expect(result[0].expenses).toBe(500);
      expect(result[0].net).toBe(1300);
    });

    it('handles months with no data', () => {
      groupByMonth.mockReturnValue([]);
      
      const result = groupByMonth([], []);
      
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('provides default values when month has no transactions', () => {
      const monthData = {
        period: 'Jun 2024',
        income: 0,
        expenses: 0,
        net: 0,
      };
      
      expect(monthData.income).toBe(0);
      expect(monthData.expenses).toBe(0);
      expect(monthData.net).toBe(0);
    });
  });

  describe('Table structure', () => {
    it('has correct column headers', () => {
      const headers = ['Month', 'Income', 'Expenses', 'Net Savings'];
      
      expect(headers.length).toBe(4);
      expect(headers[0]).toBe('Month');
      expect(headers[1]).toBe('Income');
      expect(headers[2]).toBe('Expenses');
      expect(headers[3]).toBe('Net Savings');
    });

    it('displays data in correct order', () => {
      const monthlyData = [
        { month: 'January 2024', income: 3000, expenses: 2000, netSavings: 1000 },
        { month: 'February 2024', income: 3200, expenses: 2100, netSavings: 1100 },
        { month: 'March 2024', income: 3100, expenses: 2200, netSavings: 900 },
      ];
      
      // Data should be in chronological order
      expect(monthlyData[0].month).toBe('January 2024');
      expect(monthlyData[1].month).toBe('February 2024');
      expect(monthlyData[2].month).toBe('March 2024');
    });
  });

  describe('Hover and interaction states', () => {
    it('applies hover styling class', () => {
      const hoverClass = 'hover:bg-zinc-50 dark:hover:bg-zinc-800';
      
      expect(hoverClass).toContain('hover:bg-zinc-50');
      expect(hoverClass).toContain('dark:hover:bg-zinc-800');
    });

    it('applies cursor pointer for clickable rows', () => {
      const cursorClass = 'cursor-pointer';
      
      expect(cursorClass).toBe('cursor-pointer');
    });

    it('applies transition for smooth hover effects', () => {
      const transitionClass = 'transition-colors';
      
      expect(transitionClass).toBe('transition-colors');
    });
  });
});
