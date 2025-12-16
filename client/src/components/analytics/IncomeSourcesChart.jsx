import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { aggregateIncomeSources } from '../../lib/analytics';
import ChartContainer from './ChartContainer';
import EmptyState from './EmptyState';

const IncomeSourcesChart = ({
  transactions = [],
  workDays = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!transactions && !workDays) {
      return [];
    }
    return aggregateIncomeSources(transactions || [], workDays || []);
  }, [transactions, workDays]);

  // Check if we have any income data
  const hasIncome = useMemo(() => {
    return chartData.length > 0 && chartData.some(source => source.amount > 0);
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            {data.category}
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
  const totalIncome = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.amount, 0);
  }, [chartData]);

  const chartDescription = useMemo(() => {
    if (!hasIncome) {
      return "No income data available";
    }
    const sourceList = chartData.map(s => `${s.category}: SRD ${s.amount.toFixed(2)}`).join(', ');
    return `Horizontal bar chart showing income by source. Total income: SRD ${totalIncome.toFixed(2)}. Sources: ${sourceList}`;
  }, [hasIncome, chartData, totalIncome]);

  return (
    <ChartContainer
      title="Income Sources"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div aria-label={chartDescription}>
        {!hasIncome ? (
          <EmptyState
            icon="lucide:trending-up"
            title="No income yet"
            description="Add income transactions or work days to see your income sources"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              aria-label="Income sources horizontal bar chart"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <XAxis
                type="number"
                tickFormatter={(value) => `${value}`}
                stroke="currentColor"
                className="text-zinc-500 dark:text-zinc-400"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="currentColor"
                className="text-zinc-500 dark:text-zinc-400"
                style={{ fontSize: '11px' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
                animationEasing="ease-in-out"
                name="Income Amount"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#10b981"
                    className="hover:opacity-80 transition-opacity"
                    aria-label={`${entry.category}: SRD ${entry.amount.toFixed(2)}`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartContainer>
  );
};

export default IncomeSourcesChart;
