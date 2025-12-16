import { useMemo, useCallback } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { groupByMonth } from '../../lib/analytics';

/**
 * MonthlyComparisonTable component displays a comparison of the last 6 months
 * @param {Object} props
 * @param {Array} props.transactions - Array of transaction objects
 * @param {Array} props.workDays - Array of work day objects
 * @param {Function} props.onMonthClick - Callback when a month row is clicked
 */
const MonthlyComparisonTable = ({ transactions, workDays, onMonthClick }) => {
  const monthlyData = useMemo(() => {
    // Generate last 6 months
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Filter transactions for this month
      const monthTransactions = transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      // Filter work days for this month
      const monthWorkDays = workDays.filter(wd => {
        const workDayDate = parseISO(wd.date);
        return workDayDate >= monthStart && workDayDate <= monthEnd;
      });
      
      // Calculate income, expenses, and net savings
      const grouped = groupByMonth(monthTransactions, monthWorkDays);
      const monthData = grouped.find(g => g.period === format(monthDate, 'MMM yyyy')) || {
        period: format(monthDate, 'MMM yyyy'),
        income: 0,
        expenses: 0,
        net: 0,
      };
      
      months.push({
        month: format(monthDate, 'MMMM yyyy'),
        monthDate: monthDate,
        income: monthData.income,
        expenses: monthData.expenses,
        netSavings: monthData.net,
        savingsRate: monthData.income > 0 
          ? ((monthData.income - monthData.expenses) / monthData.income) * 100 
          : 0,
      });
    }
    
    return months;
  }, [transactions, workDays]);

  // Memoize row click handler
  const handleRowClick = useCallback((monthDate) => {
    if (onMonthClick) {
      onMonthClick(monthDate);
    }
  }, [onMonthClick]);

  // Handle keyboard navigation for table rows
  const handleKeyDown = useCallback((event, monthDate) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(monthDate);
    }
  }, [handleRowClick]);

  return (
    <div 
      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6"
      role="region"
      aria-label="Monthly financial comparison"
    >
      <h3 
        className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-3 sm:mb-4"
        id="monthly-comparison-heading"
      >
        Monthly Comparison
      </h3>
      <div className="overflow-x-hidden -mx-4 sm:-mx-6">
        <div className="inline-block min-w-full align-middle px-4 sm:px-6">
          <table 
            className="w-full"
            role="table"
            aria-labelledby="monthly-comparison-heading"
            aria-describedby="monthly-comparison-description"
          >
            <caption id="monthly-comparison-description" className="sr-only">
              Last 6 months of income, expenses, and net savings. Click on a row to filter analytics by that month.
            </caption>
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th 
                  scope="col"
                  className="text-left py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap"
                >
                  Month
                </th>
                <th 
                  scope="col"
                  className="text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap"
                >
                  Income
                </th>
                <th 
                  scope="col"
                  className="text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap"
                >
                  Expenses
                </th>
                <th 
                  scope="col"
                  className="text-right py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white whitespace-nowrap"
                >
                  Net Savings
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month) => (
                <tr
                  key={month.month}
                  onClick={() => handleRowClick(month.monthDate)}
                  onKeyDown={(e) => handleKeyDown(e, month.monthDate)}
                  className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors touch-manipulation active:bg-zinc-100 dark:active:bg-zinc-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-zinc-900"
                  tabIndex={0}
                  role="button"
                  aria-label={`${month.month}: Income SRD ${month.income.toFixed(2)}, Expenses SRD ${month.expenses.toFixed(2)}, Net Savings SRD ${month.netSavings.toFixed(2)}. Click to filter by this month.`}
                >
                  <th 
                    scope="row"
                    className="py-2.5 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-zinc-900 dark:text-white whitespace-nowrap font-normal text-left"
                  >
                    {month.month}
                  </th>
                  <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-right text-zinc-900 dark:text-white whitespace-nowrap">
                    SRD {month.income.toFixed(2)}
                  </td>
                  <td className="py-2.5 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-right text-zinc-900 dark:text-white whitespace-nowrap">
                    SRD {month.expenses.toFixed(2)}
                  </td>
                  <td className={`py-2.5 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm text-right font-semibold whitespace-nowrap ${
                    month.netSavings >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    <span aria-label={month.netSavings >= 0 ? 'Positive savings' : 'Negative savings'}>
                      SRD {month.netSavings.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyComparisonTable;
