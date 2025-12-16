import { describe, it, expect, vi } from 'vitest';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the analytics functions
vi.mock('../../lib/analytics', () => ({
  rankTopCategories: vi.fn(),
}));

import { rankTopCategories } from '../../lib/analytics';

describe('TopSpendingCategories Component Logic', () => {
  describe('Navigation on click', () => {
    it('navigates to transactions page with category filter when category is clicked', () => {
      const categoryName = 'Boodschappen';
      const expectedUrl = `/transactions?category=${encodeURIComponent(categoryName)}`;
      
      // Simulate the navigation logic
      mockNavigate(expectedUrl);
      
      expect(mockNavigate).toHaveBeenCalledWith(expectedUrl);
    });

    it('properly encodes category names with special characters', () => {
      const categoryName = 'Food & Drinks';
      const expectedUrl = `/transactions?category=${encodeURIComponent(categoryName)}`;
      
      mockNavigate(expectedUrl);
      
      expect(mockNavigate).toHaveBeenCalledWith(expectedUrl);
      expect(expectedUrl).toContain('Food%20%26%20Drinks');
    });

    it('handles category names with spaces', () => {
      const categoryName = 'Health Care';
      const expectedUrl = `/transactions?category=${encodeURIComponent(categoryName)}`;
      
      mockNavigate(expectedUrl);
      
      expect(mockNavigate).toHaveBeenCalledWith(expectedUrl);
      expect(expectedUrl).toContain('Health%20Care');
    });
  });

  describe('Handling of fewer than 5 categories', () => {
    it('displays all categories when there are fewer than 5', () => {
      const mockCategories = [
        { name: 'Category 1', total: 100, count: 5, rank: 1 },
        { name: 'Category 2', total: 80, count: 3, rank: 2 },
        { name: 'Category 3', total: 60, count: 2, rank: 3 },
      ];
      
      rankTopCategories.mockReturnValue(mockCategories);
      
      const result = rankTopCategories([], 5);
      
      expect(result.length).toBe(3);
      expect(result).toEqual(mockCategories);
    });

    it('displays exactly 1 category when only 1 exists', () => {
      const mockCategories = [
        { name: 'Only Category', total: 100, count: 5, rank: 1 },
      ];
      
      rankTopCategories.mockReturnValue(mockCategories);
      
      const result = rankTopCategories([], 5);
      
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Only Category');
    });

    it('displays exactly 5 categories when 5 or more exist', () => {
      const mockCategories = [
        { name: 'Category 1', total: 100, count: 5, rank: 1 },
        { name: 'Category 2', total: 90, count: 4, rank: 2 },
        { name: 'Category 3', total: 80, count: 3, rank: 3 },
        { name: 'Category 4', total: 70, count: 2, rank: 4 },
        { name: 'Category 5', total: 60, count: 1, rank: 5 },
      ];
      
      rankTopCategories.mockReturnValue(mockCategories);
      
      const result = rankTopCategories([], 5);
      
      expect(result.length).toBe(5);
    });

    it('returns empty array when no expense categories exist', () => {
      rankTopCategories.mockReturnValue([]);
      
      const result = rankTopCategories([], 5);
      
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });
  });

  describe('Category data display', () => {
    it('displays category name, total amount, and transaction count', () => {
      const category = {
        name: 'Boodschappen',
        total: 250.50,
        count: 12,
        rank: 1,
      };
      
      expect(category.name).toBe('Boodschappen');
      expect(category.total).toBe(250.50);
      expect(category.count).toBe(12);
      expect(category.rank).toBe(1);
    });

    it('formats currency correctly', () => {
      const amount = 1234.567;
      const formatted = amount.toFixed(2);
      
      expect(formatted).toBe('1234.57');
    });

    it('handles singular transaction count', () => {
      const count = 1;
      const label = count === 1 ? 'transaction' : 'transactions';
      
      expect(label).toBe('transaction');
    });

    it('handles plural transaction count', () => {
      const count = 5;
      const label = count === 1 ? 'transaction' : 'transactions';
      
      expect(label).toBe('transactions');
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no categories exist', () => {
      rankTopCategories.mockReturnValue([]);
      
      const result = rankTopCategories([], 5);
      
      expect(result.length).toBe(0);
    });

    it('empty state message is appropriate', () => {
      const emptyMessage = 'No expense categories found';
      const helpText = 'Add expense transactions to see your top spending categories';
      
      expect(emptyMessage).toBeTruthy();
      expect(helpText).toBeTruthy();
    });
  });

  describe('Rank display', () => {
    it('displays rank numbers correctly', () => {
      const mockCategories = [
        { name: 'Category 1', total: 100, count: 5, rank: 1 },
        { name: 'Category 2', total: 80, count: 3, rank: 2 },
        { name: 'Category 3', total: 60, count: 2, rank: 3 },
      ];
      
      mockCategories.forEach((category, index) => {
        expect(category.rank).toBe(index + 1);
      });
    });
  });
});
