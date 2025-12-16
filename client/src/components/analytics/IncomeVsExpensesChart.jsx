import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { groupByWeek, groupByMonth } from '../../lib/analytics';
import ChartContainer from './ChartContainer';
import EmptyState from './EmptyState';

const IncomeVsExpensesChart = ({
  transactions = [],
  workDays = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [viewMode, setViewMode] = useState('week');

  // Transform data for the chart based on view mode
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    if (viewMode === 'week') {
      return groupByWeek(transactions, workDays);
    } else {
      return groupByMonth(transactions, workDays);
    }
  }, [transactions, workDays, viewMode]);

  // Check if we have any data
  const hasData = useMemo(() => {
    return transactions.length > 0 || (workDays && workDays.length > 0);
  }, [transactions, workDays]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="text-xs font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                SRD {entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate summary for screen readers
  const chartSummary = useMemo(() => {
    if (!hasData || chartData.length === 0) {
      return "No income or expense data available";
    }
    const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
    return `Bar chart comparing income versus expenses by ${viewMode}. Total income: SRD ${totalIncome.toFixed(2)}, Total expenses: SRD ${totalExpenses.toFixed(2)} across ${chartData.length} ${viewMode === 'week' ? 'weeks' : 'months'}.`;
  }, [hasData, chartData, viewMode]);

  // View mode toggle actions - Touch-friendly on mobile
  const viewModeToggle = (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1" role="group" aria-label="View mode selection">
      <button
        onClick={() => setViewMode('week')}
        className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-medium rounded transition-colors touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
          viewMode === 'week'
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`}
        aria-pressed={viewMode === 'week'}
        aria-label="View weekly data"
      >
        Weekly
      </button>
      <button
        onClick={() => setViewMode('month')}
        className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-medium rounded transition-colors touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
          viewMode === 'month'
            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
        }`}
        aria-pressed={viewMode === 'month'}
        aria-label="View monthly data"
      >
        Monthly
      </button>
    </div>
  );

  return (
    <ChartContainer
      title="Income vs Expenses"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      actions={viewModeToggle}
    >
      <div aria-label={chartSummary}>
        {!hasData || chartData.length === 0 ? (
          <EmptyState
            icon="lucide:bar-chart-3"
            title="No data yet"
            description="Add transactions or work days to see income vs expenses comparison"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300} className="touch-manipulation">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 20, bottom: 20 }}
              barCategoryGap="20%"
              aria-label="Income versus expenses bar chart"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <XAxis
                dataKey="period"
                stroke="currentColor"
                className="text-zinc-500 dark:text-zinc-400"
                style={{ fontSize: '10px' }}
                tick={{ fontSize: 10 }}
                height={60}
              />
              <YAxis
                tickFormatter={(value) => `${value}`}
                stroke="currentColor"
                className="text-zinc-500 dark:text-zinc-400"
                style={{ fontSize: '11px' }}
                tick={{ fontSize: 11 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                iconType="rect"
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                aria-label="Income bars"
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                aria-label="Expense bars"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartContainer>
  );
};

export default IncomeVsExpensesChart;
