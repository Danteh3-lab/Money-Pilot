import { useMemo } from 'react';
import { format } from 'date-fns';
import MetricCard from './MetricCard';
import {
  calculateAverageDailySpending,
  findHighestExpense,
  calculateSavingsRate,
  calculateWorkDaySalary,
} from '../../lib/analytics';

const KeyMetricsGrid = ({ transactions, workDays, dateRange }) => {
  const metrics = useMemo(() => {
    // Calculate total income (including work day salary)
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const workDaySalary = calculateWorkDaySalary(workDays);
    const totalIncomeWithSalary = totalIncome + workDaySalary;

    // Calculate total expenses
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    // Calculate metrics
    const avgDailySpending = calculateAverageDailySpending(transactions, dateRange);
    const highestExpense = findHighestExpense(transactions);
    const totalTransactions = transactions.length;
    const savingsRate = calculateSavingsRate(totalIncomeWithSalary, totalExpenses);

    return {
      avgDailySpending,
      highestExpense,
      totalTransactions,
      savingsRate,
      isNegativeSavingsRate: savingsRate < 0,
    };
  }, [transactions, workDays, dateRange]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <MetricCard
        title="Avg Daily Spending"
        value={metrics.avgDailySpending}
        format="currency"
        currency="SRD"
        icon="mdi:cash-multiple"
        iconColor="blue"
        subtitle={`Based on ${metrics.totalTransactions} transactions`}
      />

      <MetricCard
        title="Highest Expense"
        value={metrics.highestExpense?.amount ? Math.abs(metrics.highestExpense.amount) : 0}
        format="currency"
        currency="SRD"
        icon="mdi:trending-up"
        iconColor="rose"
        subtitle={
          metrics.highestExpense
            ? `${metrics.highestExpense.category} • ${format(
                new Date(metrics.highestExpense.date),
                'MMM dd'
              )}`
            : 'No expenses'
        }
      />

      <MetricCard
        title="Total Transactions"
        value={metrics.totalTransactions}
        format="number"
        icon="mdi:receipt-text"
        iconColor="amber"
      />

      <MetricCard
        title="Savings Rate"
        value={metrics.savingsRate}
        format="percentage"
        icon={metrics.isNegativeSavingsRate ? 'mdi:alert-circle' : 'mdi:piggy-bank'}
        iconColor={metrics.isNegativeSavingsRate ? 'rose' : 'emerald'}
        isNegative={metrics.isNegativeSavingsRate}
        subtitle={
          metrics.isNegativeSavingsRate
            ? 'Spending exceeds income'
            : 'Income minus expenses'
        }
      />
    </div>
  );
};

export default KeyMetricsGrid;
