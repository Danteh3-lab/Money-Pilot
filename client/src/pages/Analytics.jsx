import { useEffect, useState, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import useStore from '../store/useStore';
import { db } from '../lib/supabase';
import KeyMetricsGrid from '../components/analytics/KeyMetricsGrid';

// Lazy load chart components for better initial load performance
const ExpensesTrendChart = lazy(() => import('../components/analytics/ExpensesTrendChart'));
const CategoryBreakdownChart = lazy(() => import('../components/analytics/CategoryBreakdownChart'));
const IncomeVsExpensesChart = lazy(() => import('../components/analytics/IncomeVsExpensesChart'));
const IncomeSourcesChart = lazy(() => import('../components/analytics/IncomeSourcesChart'));
const TopSpendingCategories = lazy(() => import('../components/analytics/TopSpendingCategories'));
const MonthlyComparisonTable = lazy(() => import('../components/analytics/MonthlyComparisonTable'));

const Analytics = () => {
  const {
    user,
    transactions,
    setTransactions,
    workDays,
    setWorkDays,
    dateRange,
    setDateRange,
    persistDateRange,
    setUserSettings,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Debounce timer ref for date range persistence
  const dateRangeDebounceRef = useRef(null);

  // Get filtered transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!dateRange.start || !dateRange.end) {
      return transactions;
    }

    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Get filtered work days based on date range
  const filteredWorkDays = useMemo(() => {
    if (!dateRange.start || !dateRange.end) {
      return workDays;
    }

    return workDays.filter((wd) => {
      const date = new Date(wd.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [workDays, dateRange]);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build filter for server-side date range filtering
      const filter = {};
      if (dateRange?.start && dateRange?.end) {
        filter.startDate = new Date(dateRange.start).toISOString();
        filter.endDate = new Date(dateRange.end).toISOString();
      }

      // Load all data in parallel
      const [transactionsData, workDaysData, settingsData] = await Promise.all([
        db.getTransactions(user.id, filter),
        db.getWorkDays(user.id, filter),
        db.getUserSettings(user.id),
      ]);

      setTransactions(transactionsData || []);
      setWorkDays(workDaysData || []);
      
      if (settingsData) {
        setUserSettings(settingsData);
      }
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user, dateRange, setTransactions, setWorkDays, setUserSettings]);

  // Initialize: Load settings and restore date range
  useEffect(() => {
    const initAnalytics = async () => {
      if (!user) return;

      try {
        // Load user settings to restore date range
        const settings = await db.getUserSettings(user.id);
        
        if (settings) {
          setUserSettings(settings);

          // Restore date range from settings
          const start = settings.overview_start_date;
          const end = settings.overview_end_date;

          if (start && end) {
            setDateRange(
              new Date(`${start}T00:00:00`),
              new Date(`${end}T23:59:59`)
            );
          } else {
            // Default to current month
            const now = new Date();
            setDateRange(startOfMonth(now), endOfMonth(now));
          }
        } else {
          // No settings found, default to current month
          const now = new Date();
          setDateRange(startOfMonth(now), endOfMonth(now));
        }
      } catch (err) {
        console.error('Error initializing analytics:', err);
        // Default to current month on error
        const now = new Date();
        setDateRange(startOfMonth(now), endOfMonth(now));
      }
    };

    initAnalytics();
  }, [user, setUserSettings, setDateRange]);

  // Load data when date range changes
  useEffect(() => {
    if (user && dateRange.start && dateRange.end) {
      loadAnalyticsData();
    }
  }, [user, dateRange.start, dateRange.end, loadAnalyticsData]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  // Handle month click from monthly comparison table with debouncing
  const handleMonthClick = useCallback(
    async (monthDate) => {
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      
      // Clear any pending debounced calls
      if (dateRangeDebounceRef.current) {
        clearTimeout(dateRangeDebounceRef.current);
      }
      
      // Update UI immediately for better UX
      setDateRange(start, end);
      
      // Debounce the database persistence (500ms delay)
      dateRangeDebounceRef.current = setTimeout(async () => {
        try {
          await persistDateRange(start, end);
        } catch (err) {
          console.error('Error persisting date range:', err);
        }
      }, 500);
    },
    [persistDateRange, setDateRange]
  );
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (dateRangeDebounceRef.current) {
        clearTimeout(dateRangeDebounceRef.current);
      }
    };
  }, []);

  // Chart loading skeleton component
  const ChartSkeleton = () => (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-4" />
      <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded" />
    </div>
  );

  // Loading skeleton
  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6" role="status" aria-live="polite" aria-busy="true" aria-label="Loading analytics data">
        {/* Skeleton for metrics grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 animate-pulse"
              aria-hidden="true"
            >
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-4" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* Skeleton for charts - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <ChartSkeleton key={i} />
          ))}
        </div>
        <span className="sr-only">Loading analytics charts and metrics...</span>
      </div>
    );
  }

  // Error state with retry
  if (error && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]" role="alert" aria-live="assertive">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
            <iconify-icon
              icon="lucide:alert-circle"
              width="32"
              className="text-rose-600 dark:text-rose-400"
            />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Failed to load analytics
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {error.message || 'An error occurred while loading your analytics data'}
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            aria-label="Retry loading analytics data"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" role="main" aria-label="Analytics Dashboard">
      {/* Key Metrics Grid - Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop */}
      <section aria-label="Key Financial Metrics">
        <KeyMetricsGrid
          transactions={filteredTransactions}
          workDays={filteredWorkDays}
          dateRange={dateRange}
        />
      </section>

      {/* Charts Grid - Responsive: 1 col mobile, 2 cols tablet, 2 cols desktop */}
      <section aria-label="Financial Charts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <ExpensesTrendChart
              transactions={filteredTransactions}
              dateRange={dateRange}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
            />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <CategoryBreakdownChart
              transactions={filteredTransactions}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
            />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <IncomeVsExpensesChart
              transactions={filteredTransactions}
              workDays={filteredWorkDays}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
            />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <IncomeSourcesChart
              transactions={filteredTransactions}
              workDays={filteredWorkDays}
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
            />
          </Suspense>
        </div>
      </section>

      {/* Bottom Section - Responsive: 1 col mobile, 2 cols tablet/desktop */}
      <section aria-label="Spending Analysis and Monthly Comparison">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Suspense fallback={<ChartSkeleton />}>
            <TopSpendingCategories transactions={filteredTransactions} />
          </Suspense>

          <Suspense fallback={<ChartSkeleton />}>
            <MonthlyComparisonTable
              transactions={transactions}
              workDays={workDays}
              onMonthClick={handleMonthClick}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
