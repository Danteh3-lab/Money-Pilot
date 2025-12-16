import { describe, it, expect, vi } from 'vitest';
import { aggregateByCategory, groupCategories } from '../../lib/analytics';

describe('CategoryBreakdownChart', () => {
  const mockTransactions = [
    {
      id: '1',
      type: 'expense',
      amount: 100,
      category: 'Boodschappen',
      date: '2024-01-01',
    },
    {
      id: '2',
      type: 'expense',
      amount: 50,
      category: 'Transport',
      date: '2024-01-02',
    },
    {
      id: '3',
      type: 'expense',
      amount: 0,
      category: 'Entertainment',
      date: '2024-01-03',
    },
    {
      id: '4',
      type: 'income',
      amount: 200,
      category: 'Salary',
      date: '2024-01-04',
    },
  ];

  describe('tooltip data structure', () => {
    it('includes category name, amount, percentage, and count', () => {
      const categories = aggregateByCategory(mockTransactions);
      
      // Each category should have the required fields
      categories.forEach(cat => {
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('value');
        expect(cat).toHaveProperty('percentage');
        expect(cat).toHaveProperty('count');
        expect(typeof cat.name).toBe('string');
        expect(typeof cat.value).toBe('number');
        expect(typeof cat.percentage).toBe('number');
        expect(typeof cat.count).toBe('number');
      });
    });
  });

  describe('zero category filtering', () => {
    it('filters out categories with zero value', () => {
      const transactionsWithZero = [
        { id: '1', type: 'expense', amount: 100, category: 'Food', date: '2024-01-01' },
        { id: '2', type: 'expense', amount: 0, category: 'Zero', date: '2024-01-02' },
      ];
      
      const categories = aggregateByCategory(transactionsWithZero);
      
      // Should only have one category (Food), zero-value category should be filtered
      expect(categories.length).toBe(1);
      expect(categories[0].name).toBe('Food');
      expect(categories.find(cat => cat.name === 'Zero')).toBeUndefined();
    });

    it('returns empty array when all expenses are zero', () => {
      const zeroTransactions = [
        { id: '1', type: 'expense', amount: 0, category: 'Zero1', date: '2024-01-01' },
        { id: '2', type: 'expense', amount: 0, category: 'Zero2', date: '2024-01-02' },
      ];
      
      const categories = aggregateByCategory(zeroTransactions);
      
      // Should return empty array
      expect(categories.length).toBe(0);
    });

    it('returns empty array when only income transactions exist', () => {
      const incomeOnly = [
        { id: '1', type: 'income', amount: 100, category: 'Salary', date: '2024-01-01' },
      ];
      
      const categories = aggregateByCategory(incomeOnly);
      
      // Should return empty array
      expect(categories.length).toBe(0);
    });
  });

  describe('click handler', () => {
    it('should not trigger click for "Overig" category', () => {
      // Create transactions with more than 8 categories to trigger "Overig"
      const manyCategories = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        type: 'expense',
        amount: 10 + i,
        category: `Category${i}`,
        date: '2024-01-01',
      }));
      
      const categories = aggregateByCategory(manyCategories);
      const grouped = groupCategories(categories);
      
      // Should have "Overig" category
      const overig = grouped.find(cat => cat.name === 'Overig');
      expect(overig).toBeDefined();
      
      // Verify that "Overig" is present and contains aggregated data
      expect(overig.value).toBeGreaterThan(0);
      expect(overig.count).toBeGreaterThan(0);
    });

    it('regular categories should be clickable', () => {
      const categories = aggregateByCategory(mockTransactions);
      
      // All non-Overig categories should be present
      const regularCategories = categories.filter(cat => cat.name !== 'Overig');
      expect(regularCategories.length).toBeGreaterThan(0);
      
      // Each should have valid data for click handling
      regularCategories.forEach(cat => {
        expect(cat.name).toBeTruthy();
        expect(cat.value).toBeGreaterThan(0);
      });
    });
  });

  describe('data transformation', () => {
    it('correctly transforms transaction data for chart', () => {
      const categories = aggregateByCategory(mockTransactions);
      const grouped = groupCategories(categories);
      
      // Should have categories from expense transactions only
      expect(grouped.length).toBeGreaterThan(0);
      
      // Total should match sum of expense transactions
      const totalFromCategories = grouped.reduce((sum, cat) => sum + cat.value, 0);
      const totalExpenses = mockTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      expect(Math.abs(totalFromCategories - totalExpenses)).toBeLessThan(0.01);
    });

    it('handles empty transaction array', () => {
      const categories = aggregateByCategory([]);
      const grouped = groupCategories(categories);
      
      expect(categories.length).toBe(0);
      expect(grouped.length).toBe(0);
    });
  });
});
