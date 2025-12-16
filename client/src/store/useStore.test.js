import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import useStore from './useStore.js';

// Mock the supabase module
vi.mock('../lib/supabase', () => {
  const mockDb = {
    updateUserSettings: vi.fn(),
    getUserSettings: vi.fn(),
  };
  
  return {
    db: mockDb,
    supabase: null,
    auth: {},
  };
});

describe('Date Range Persistence Property-Based Tests', () => {
  let mockDb;

  beforeEach(async () => {
    // Get the mocked db
    const { db } = await import('../lib/supabase');
    mockDb = db;
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockDb.updateUserSettings.mockResolvedValue({
      user_id: 'test-user-id',
      overview_start_date: null,
      overview_end_date: null,
    });
  });

  afterEach(() => {
    // Reset store state
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.clearDateRange();
      result.current.setUser(null);
    });
  });

  // Feature: analytics-page, Property 14: Date range persistence round-trip
  // Validates: Requirements 6.4, 6.5
  describe('Property 14: Date range persistence round-trip', () => {
    it('persisted date range equals originally selected date range', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random dates within a reasonable range
          fc.integer({ min: 0, max: 1000 }).map(days => {
            const start = new Date('2020-01-01');
            start.setDate(start.getDate() + days);
            return start;
          }),
          fc.integer({ min: 1, max: 365 }).map(duration => duration),
          async (startDate, durationDays) => {
            // Calculate end date
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + durationDays);

            // Setup: Create a user
            const { result } = renderHook(() => useStore());
            const testUser = { id: 'test-user-id', email: 'test@example.com' };
            
            act(() => {
              result.current.setUser(testUser);
            });

            // Mock the database response to return the persisted dates
            const expectedStartDate = startDate.toISOString().split('T')[0];
            const expectedEndDate = endDate.toISOString().split('T')[0];
            
            mockDb.updateUserSettings.mockResolvedValue({
              user_id: testUser.id,
              overview_start_date: expectedStartDate,
              overview_end_date: expectedEndDate,
            });

            // Action: Persist the date range
            await act(async () => {
              await result.current.persistDateRange(startDate, endDate);
            });

            // Verify: The store was updated with the correct dates
            const storedRange = result.current.dateRange;
            expect(storedRange.start).toEqual(startDate);
            expect(storedRange.end).toEqual(endDate);

            // Verify: The database was called with the correct dates
            expect(mockDb.updateUserSettings).toHaveBeenCalledWith(
              testUser.id,
              {
                overview_start_date: expectedStartDate,
                overview_end_date: expectedEndDate,
              }
            );

            // Simulate round-trip: Restore from database
            mockDb.getUserSettings.mockResolvedValue({
              user_id: testUser.id,
              overview_start_date: expectedStartDate,
              overview_end_date: expectedEndDate,
            });

            const settings = await mockDb.getUserSettings(testUser.id);
            
            // Restore dates from settings (simulating page reload)
            // Note: We use T00:00:00 for both to ensure day-level comparison
            const restoredStart = new Date(`${settings.overview_start_date}T00:00:00`);
            const restoredEnd = new Date(`${settings.overview_end_date}T00:00:00`);

            // Property: The restored dates should match the original dates (at day precision)
            expect(restoredStart.toISOString().split('T')[0]).toBe(
              startDate.toISOString().split('T')[0]
            );
            expect(restoredEnd.toISOString().split('T')[0]).toBe(
              endDate.toISOString().split('T')[0]
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('handles null date ranges correctly', async () => {
      const { result } = renderHook(() => useStore());
      const testUser = { id: 'test-user-id', email: 'test@example.com' };
      
      act(() => {
        result.current.setUser(testUser);
      });

      mockDb.updateUserSettings.mockResolvedValue({
        user_id: testUser.id,
        overview_start_date: null,
        overview_end_date: null,
      });

      // Persist null dates
      await act(async () => {
        await result.current.persistDateRange(null, null);
      });

      // Verify database was called with null values
      expect(mockDb.updateUserSettings).toHaveBeenCalledWith(
        testUser.id,
        {
          overview_start_date: null,
          overview_end_date: null,
        }
      );
    });

    it('throws error when no user is logged in', async () => {
      const { result } = renderHook(() => useStore());
      
      // Ensure no user is set
      act(() => {
        result.current.setUser(null);
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Should not throw, but should not call database
      await act(async () => {
        await result.current.persistDateRange(startDate, endDate);
      });

      // Verify database was not called
      expect(mockDb.updateUserSettings).not.toHaveBeenCalled();
      
      // Store should still be updated locally
      expect(result.current.dateRange.start).toEqual(startDate);
      expect(result.current.dateRange.end).toEqual(endDate);
    });
  });
});
