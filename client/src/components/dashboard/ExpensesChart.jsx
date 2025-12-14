import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import useStore from "../../store/useStore";

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs px-3 py-2 rounded shadow-lg">
        <p className="font-medium">SRD {payload[0].value.toFixed(2)}</p>
        <p className="text-zinc-300 dark:text-zinc-600 text-[10px] mt-0.5">
          {format(parseISO(payload[0].payload.date), "dd MMM yyyy")}
        </p>
      </div>
    );
  }
  return null;
};

const ExpensesChart = ({ timeView = "week" }) => {
  const { transactions, isDarkMode } = useStore();

  // Process transactions into daily expenses
  const processChartData = () => {
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense",
    );

    // Group by day
    const dailyExpenses = {};
    expenseTransactions.forEach((transaction) => {
      const date = format(parseISO(transaction.date), "yyyy-MM-dd");
      if (!dailyExpenses[date]) {
        dailyExpenses[date] = 0;
      }
      dailyExpenses[date] += parseFloat(transaction.amount);
    });

    // Convert to array for chart
    const chartData = Object.entries(dailyExpenses).map(([date, amount]) => ({
      date,
      dayName: format(parseISO(date), "EEEEEE"), // Short day name (Mo, Tu, etc.)
      amount: parseFloat(amount.toFixed(2)),
    }));

    // Sort by date
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Take last 7 days for week view
    if (timeView === "week") {
      return chartData.slice(-7);
    }

    return chartData;
  };

  const data = processChartData();

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 min-h-[300px] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          Uitgaven per dag
        </h2>
        <div className="flex gap-2">
          <button className="px-2 py-1 text-xs font-medium text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            Week
          </button>
          <button className="px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            Maand
          </button>
        </div>
      </div>

      <div className="flex-1 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDarkMode ? "#27272a" : "#f4f4f5"}
              />
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkMode ? "#71717a" : "#a1a1aa",
                  fontSize: 10,
                  fontWeight: 500,
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkMode ? "#71717a" : "#a1a1aa",
                  fontSize: 10,
                  fontWeight: 500,
                }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: isDarkMode ? "#27272a" : "#f4f4f5" }}
              />
              <Bar
                dataKey="amount"
                fill={isDarkMode ? "#52525b" : "#e4e4e7"}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                activeBar={{ fill: isDarkMode ? "#f4f4f5" : "#18181b" }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
            <div className="text-center">
              <iconify-icon
                icon="lucide:bar-chart-3"
                width="48"
                className="mb-2 opacity-50"
              />
              <p className="text-sm">Geen uitgaven om weer te geven</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesChart;
