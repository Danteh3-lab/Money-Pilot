import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  parseISO,
  subDays,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  isSameDay,
  isValid,
} from "date-fns";
import { nl } from "date-fns/locale";
import useStore from "../../store/useStore";

// Custom tooltip component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs px-3 py-2 rounded shadow-lg z-50">
        <p className="font-medium">SRD {payload[0].value.toFixed(2)}</p>
        <p className="text-zinc-300 dark:text-zinc-600 text-[10px] mt-0.5">
          {data.fullDate}
        </p>
      </div>
    );
  }
  return null;
};

const ExpensesChart = () => {
  const { transactions, isDarkMode, dateRange } = useStore();
  const [view, setView] = useState("week"); // 'week' | 'month'

  const data = useMemo(() => {
    // Week/Month should control the range.
    // If a global date range (Overzicht picker) exists, we "anchor" to its end date,
    // but still show only the last 7/30 days depending on the view.
    const hasGlobalRange = Boolean(dateRange?.start && dateRange?.end);

    const anchorEnd = hasGlobalRange
      ? endOfDay(new Date(dateRange.end))
      : endOfDay(new Date());

    const rangeStart =
      view === "week"
        ? startOfDay(subDays(anchorEnd, 6))
        : startOfDay(subDays(anchorEnd, 29));

    const rangeEnd = anchorEnd;

    // Generate all dates in the interval to ensure we have entries for days with 0 expenses
    const dates = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense",
    );

    return dates.map((date) => {
      // Sum expenses for this specific date (guard against invalid/missing dates)
      const dayExpenses = expenseTransactions
        .filter((t) => {
          if (!t?.date) return false;
          const parsed = parseISO(t.date);
          if (!isValid(parsed)) return false;
          return isSameDay(parsed, date);
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Labels:
      // - Week: weekday name (Mon/Tue in NL)
      // - Month: day-of-month number
      const label =
        view === "week"
          ? format(date, "EE", { locale: nl })
          : format(date, "d");

      return {
        date: date.toISOString(),
        label,
        amount: parseFloat(dayExpenses.toFixed(2)),
        fullDate: format(date, "d MMMM yyyy", { locale: nl }),
      };
    });
  }, [transactions, view, dateRange]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 min-h-[300px] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
          Uitgaven per dag
        </h2>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              view === "week"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              view === "month"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Maand
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        {data.every((d) => d.amount === 0) ? (
          <div className="flex items-center justify-center h-full text-zinc-400 dark:text-zinc-600">
            <div className="text-center">
              <iconify-icon
                icon="lucide:bar-chart-3"
                width="48"
                className="mb-2 opacity-50"
              />
              <p className="text-sm">Geen uitgaven in deze periode</p>
              <p className="text-xs mt-1 text-zinc-400 dark:text-zinc-600">
                Pas eventueel je Overzicht-datums aan of voeg een uitgave toe
                binnen dit bereik.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDarkMode ? "#27272a" : "#f4f4f5"}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: isDarkMode ? "#71717a" : "#a1a1aa",
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                  dy={10}
                  interval={data.length > 10 ? "preserveStartEnd" : 0}
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
                  cursor={{
                    fill: isDarkMode ? "#27272a" : "#f4f4f5",
                    opacity: 0.4,
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill={isDarkMode ? "#52525b" : "#e4e4e7"}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={view === "week" ? 40 : 12}
                  activeBar={{ fill: isDarkMode ? "#f4f4e7" : "#18181b" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesChart;
