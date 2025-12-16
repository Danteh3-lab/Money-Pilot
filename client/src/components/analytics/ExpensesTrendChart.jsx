import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { aggregateDailyExpenses } from '../../lib/analytics';
import ChartContainer from './ChartContainer';
import EmptyState from './EmptyState';

const ExpensesTrendChart = ({
  transactions = [],
  dateRange,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    return aggregateDailyExpenses(transactions, dateRange);
  }, [transactions, dateRange]);

  // Check if we have any expense data
  const hasExpenses = useMemo(() => {
    return transactions.some(t => t.type === 'expense');
  }, [transactions]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            {data.formattedDate}
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            SRD {data.amount.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate summary for screen readers
  const totalExpenses = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.amount, 0);
  }, [chartData]);

  const chartDescription = useMemo(() => {
    if (!hasExpenses || chartData.length === 0) {
      return "No expense data available";
    }
    return `Line chart showing daily expenses over time. Total expenses: SRD ${totalExpenses.toFixed(2)} across ${chartData.length} days.`;
  }, [hasExpenses, chartData.length, totalExpenses]);

  return (
    <ChartContainer
      title="Expenses Trend"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div aria-label={chartDescription}>
        {!hasExpenses || chartData.length === 0 ? (
          <EmptyState
            icon="lucide:trending-down"
            title="No expenses yet"
            description="Add expense transactions to see your spending trends over time"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300} className="touch-manipulation">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
              aria-label="Daily expenses line chart"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                stroke="currentColor"
                className="text-zinc-500 dark:text-zinc-400"
                style={{ fontSize: '11px' }}
                tick={{ fontSize: 11 }}
                label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
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
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
                animationEasing="ease-in-out"
                name="Daily Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartContainer>
  );
};

export default ExpensesTrendChart;
