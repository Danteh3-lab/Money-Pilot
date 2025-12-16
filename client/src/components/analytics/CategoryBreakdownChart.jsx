import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { aggregateByCategory, groupCategories } from '../../lib/analytics';
import ChartContainer from './ChartContainer';
import EmptyState from './EmptyState';

// Color palette for categories
const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
];

const CategoryBreakdownChart = ({
  transactions = [],
  isLoading = false,
  error = null,
  onRetry,
  onCategoryClick,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    
    const categories = aggregateByCategory(transactions);
    const grouped = groupCategories(categories);
    
    return grouped;
  }, [transactions]);

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
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
            {data.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            SRD {data.value.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {data.percentage.toFixed(1)}% of total
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {data.count} transaction{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle segment click
  const handleClick = (data, index) => {
    setActiveIndex(index === activeIndex ? null : index);
    if (onCategoryClick && data.name !== 'Overig') {
      onCategoryClick(data.name);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (event, data, index) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(data, index);
    }
  };

  // Custom label for pie segments
  const renderLabel = (entry) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  // Calculate summary for screen readers
  const totalExpenses = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const chartDescription = useMemo(() => {
    if (!hasExpenses || chartData.length === 0) {
      return "No expense data available";
    }
    const categoryList = chartData.map(c => `${c.name}: SRD ${c.value.toFixed(2)} (${c.percentage.toFixed(1)}%)`).join(', ');
    return `Pie chart showing expense breakdown by category. Total expenses: SRD ${totalExpenses.toFixed(2)}. Categories: ${categoryList}`;
  }, [hasExpenses, chartData, totalExpenses]);

  return (
    <ChartContainer
      title="Category Breakdown"
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
    >
      <div aria-label={chartDescription}>
        {!hasExpenses || chartData.length === 0 ? (
          <EmptyState
            icon="lucide:pie-chart"
            title="No expenses yet"
            description="Add expense transactions to see your spending breakdown by category"
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={handleClick}
                animationDuration={800}
                animationEasing="ease-out"
                aria-label="Category expense distribution"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={activeIndex === index ? '#000' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{
                      cursor: entry.name !== 'Overig' ? 'pointer' : 'default',
                      opacity: activeIndex === null || activeIndex === index ? 1 : 0.6,
                    }}
                    tabIndex={entry.name !== 'Overig' ? 0 : -1}
                    role={entry.name !== 'Overig' ? 'button' : undefined}
                    aria-label={`${entry.name}: SRD ${entry.value.toFixed(2)}, ${entry.percentage.toFixed(1)}% of total expenses. ${entry.name !== 'Overig' ? 'Press Enter to view transactions.' : ''}`}
                    onKeyDown={(e) => handleKeyDown(e, entry, index)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartContainer>
  );
};

export default CategoryBreakdownChart;
