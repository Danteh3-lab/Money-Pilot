import { useEffect, useCallback } from "react";
import useStore from "../store/useStore";
import { db } from "../lib/supabase";
import StatsCard from "../components/dashboard/StatsCard";
import ExpensesChart from "../components/dashboard/ExpensesChart";
import QuickAddTransaction from "../components/dashboard/QuickAddTransaction";
import TransactionsTable from "../components/dashboard/TransactionsTable";

const normalizeTransactionType = (type) => {
  if (!type) return type;
  const t = String(type).toLowerCase().trim();

  // Normalize Dutch/EN variants to store's expected values:
  // - "income" | "expense"
  if (t === "inkomen" || t === "income") return "income";
  if (t === "uitgave" || t === "expense") return "expense";

  return t;
};

const normalizeTransactions = (rows) =>
  (rows || []).map((t) => ({
    ...t,
    type: normalizeTransactionType(t.type),
  }));

const Dashboard = () => {
  const {
    user,
    setTransactions,
    workDays,
    setWorkDays,
    setCategories,
    userSettings,
    setUserSettings,
    isLoading,
    setLoading,
    getEstimatedSalary,
    getTotalExpenses,
    getBalance,
  } = useStore();

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [transactionsData, workDaysData, categoriesData, settingsData] =
        await Promise.all([
          db.getTransactions(user.id),
          db.getWorkDays(user.id),
          db.getCategories(user.id),
          db.getUserSettings(user.id),
        ]);

      setTransactions(normalizeTransactions(transactionsData));
      setWorkDays(workDaysData || []);
      setCategories(categoriesData || []);

      if (settingsData) {
        setUserSettings(settingsData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    setTransactions,
    setWorkDays,
    setCategories,
    setUserSettings,
    setLoading,
  ]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const estimatedSalary = getEstimatedSalary();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();

  // Calculate percentage spent
  const percentSpent =
    estimatedSalary > 0
      ? ((totalExpenses / estimatedSalary) * 100).toFixed(0)
      : 0;

  // Calculate progress for salary card (days worked)
  const workDaysCount = workDays.length;
  const expectedWorkDays = 22; // Average work days per month
  const workProgress = (workDaysCount / expectedWorkDays) * 100;

  // Calculate expense trend (mock for now)
  const expenseTrend = "+12%";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimated Salary Card */}
        <StatsCard
          title="Geschat Salaris"
          value={estimatedSalary.toFixed(2)}
          currency="SRD"
          icon="lucide:coins"
          iconColor="emerald"
          subtitle={`${workDaysCount} Dagen gewerkt`}
          subtitleIcon="lucide:briefcase"
          progress={workProgress}
          progressColor="emerald"
        >
          <div className="flex items-center justify-end text-xs">
            <span className="text-zinc-400 dark:text-zinc-500 tabular-nums">
              @ {userSettings.dailyRate.toFixed(2)}
            </span>
          </div>
        </StatsCard>

        {/* Expenses Card */}
        <StatsCard
          title="Uitgaven"
          value={totalExpenses.toFixed(2)}
          currency="SRD"
          icon="lucide:trending-down"
          iconColor="rose"
          trend="positive"
          trendValue={expenseTrend}
        />

        {/* Balance Card */}
        <StatsCard
          title="Resterend Budget"
          value={balance.toFixed(2)}
          currency="SRD"
          icon="lucide:pie-chart"
          iconColor="blue"
        >
          <div className="w-full">
            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
              <span>Verbruikt</span>
              <span className="font-medium">{percentSpent}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              />
            </div>
          </div>
        </StatsCard>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart/Analytics Area */}
        <div className="lg:col-span-2">
          <ExpensesChart />
        </div>

        {/* Quick Add Transaction */}
        <div>
          <QuickAddTransaction />
        </div>
      </div>

      {/* Transactions List */}
      <TransactionsTable />
    </div>
  );
};

export default Dashboard;
