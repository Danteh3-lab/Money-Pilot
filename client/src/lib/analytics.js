import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  parseISO,
  isWithinInterval,
  eachDayOfInterval,
} from 'date-fns';

/**
 * Aggregates expenses by day for the given date range
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} dateRange - Object with start and end Date objects
 * @returns {Array} Array of {date: string, amount: number, formattedDate: string}
 */
export function aggregateDailyExpenses(transactions, dateRange) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  // Group expenses by date
  const expensesByDate = {};
  
  expenseTransactions.forEach(transaction => {
    const date = format(parseISO(transaction.date), 'yyyy-MM-dd');
    if (!expensesByDate[date]) {
      expensesByDate[date] = 0;
    }
    expensesByDate[date] += Math.abs(transaction.amount);
  });

  // Convert to array and sort by date
  return Object.entries(expensesByDate)
    .map(([date, amount]) => ({
      date,
      amount,
      formattedDate: format(parseISO(date), 'MMM dd, yyyy'),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregates transactions by category
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Array of {name: string, value: number, percentage: number, count: number}
 */
export function aggregateByCategory(transactions) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0) {
    return [];
  }

  // Group by category
  const categoryData = {};
  let totalExpenses = 0;

  expenseTransactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    const amount = Math.abs(transaction.amount);
    
    if (!categoryData[category]) {
      categoryData[category] = { total: 0, count: 0 };
    }
    
    categoryData[category].total += amount;
    categoryData[category].count += 1;
    totalExpenses += amount;
  });

  // Convert to array with percentages
  const categories = Object.entries(categoryData)
    .map(([name, data]) => ({
      name,
      value: data.total,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      count: data.count,
    }))
    .filter(cat => cat.value > 0) // Filter out zero-value categories
    .sort((a, b) => b.value - a.value);

  return categories;
}

/**
 * Groups categories, combining smaller ones into "Overig" if more than 8 categories
 * @param {Array} categories - Array of category objects from aggregateByCategory
 * @returns {Array} Array with max 9 items (8 categories + "Overig")
 */
export function groupCategories(categories) {
  if (!categories || categories.length <= 8) {
    return categories;
  }

  // Take top 8 categories
  const topCategories = categories.slice(0, 8);
  const otherCategories = categories.slice(8);

  // Sum up the "other" categories
  const overigTotal = otherCategories.reduce((sum, cat) => sum + cat.value, 0);
  const overigCount = otherCategories.reduce((sum, cat) => sum + cat.count, 0);
  
  // Recalculate total for percentage
  const total = categories.reduce((sum, cat) => sum + cat.value, 0);

  return [
    ...topCategories,
    {
      name: 'Overig',
      value: overigTotal,
      percentage: total > 0 ? (overigTotal / total) * 100 : 0,
      count: overigCount,
    },
  ];
}

/**
 * Groups transactions by week
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} dateRange - Object with start and end Date objects
 * @returns {Array} Array of {period: string, income: number, expenses: number, net: number}
 */
export function groupByWeek(transactions, workDays = []) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const weeklyData = {};

  // Process transactions
  transactions.forEach(transaction => {
    const date = parseISO(transaction.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    const weekLabel = format(weekStart, 'MMM dd');

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        period: weekLabel,
        income: 0,
        expenses: 0,
        net: 0,
      };
    }

    const amount = Math.abs(transaction.amount);
    if (transaction.type === 'income') {
      weeklyData[weekKey].income += amount;
    } else {
      weeklyData[weekKey].expenses += amount;
    }
  });

  // Add work day salary to income
  if (workDays && workDays.length > 0) {
    workDays.forEach(workDay => {
      if (workDay.status === 'worked') {
        const date = parseISO(workDay.date);
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        const weekLabel = format(weekStart, 'MMM dd');

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            period: weekLabel,
            income: 0,
            expenses: 0,
            net: 0,
          };
        }

        const salary = workDay.hours_worked * workDay.daily_rate;
        weeklyData[weekKey].income += salary;
      }
    });
  }

  // Calculate net and convert to array
  return Object.entries(weeklyData)
    .map(([key, data]) => ({
      ...data,
      net: data.income - data.expenses,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Groups transactions by month
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} workDays - Array of work day objects
 * @returns {Array} Array of {period: string, income: number, expenses: number, net: number}
 */
export function groupByMonth(transactions, workDays = []) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const monthlyData = {};

  // Process transactions
  transactions.forEach(transaction => {
    const date = parseISO(transaction.date);
    const monthKey = format(date, 'yyyy-MM');
    const monthLabel = format(date, 'MMM yyyy');

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        period: monthLabel,
        income: 0,
        expenses: 0,
        net: 0,
      };
    }

    const amount = Math.abs(transaction.amount);
    if (transaction.type === 'income') {
      monthlyData[monthKey].income += amount;
    } else {
      monthlyData[monthKey].expenses += amount;
    }
  });

  // Add work day salary to income
  if (workDays && workDays.length > 0) {
    workDays.forEach(workDay => {
      if (workDay.status === 'worked') {
        const date = parseISO(workDay.date);
        const monthKey = format(date, 'yyyy-MM');
        const monthLabel = format(date, 'MMM yyyy');

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            period: monthLabel,
            income: 0,
            expenses: 0,
            net: 0,
          };
        }

        const salary = workDay.hours_worked * workDay.daily_rate;
        monthlyData[monthKey].income += salary;
      }
    });
  }

  // Calculate net and convert to array
  return Object.entries(monthlyData)
    .map(([key, data]) => ({
      ...data,
      net: data.income - data.expenses,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Ranks categories by total spending with tie-breaking by transaction count
 * @param {Array} transactions - Array of transaction objects
 * @param {number} limit - Maximum number of categories to return (default: 5)
 * @returns {Array} Array of {name: string, total: number, count: number, rank: number}
 */
export function rankTopCategories(transactions, limit = 5) {
  const categories = aggregateByCategory(transactions);
  
  if (categories.length === 0) {
    return [];
  }

  // Sort by total (descending), then by count (descending) for tie-breaking
  const sorted = categories.sort((a, b) => {
    if (b.value !== a.value) {
      return b.value - a.value;
    }
    return b.count - a.count;
  });

  // Take top N and add rank
  return sorted.slice(0, limit).map((cat, index) => ({
    name: cat.name,
    total: cat.value,
    count: cat.count,
    rank: index + 1,
  }));
}

/**
 * Calculates savings rate as a percentage
 * @param {number} income - Total income
 * @param {number} expenses - Total expenses
 * @returns {number} Savings rate as percentage (can be negative)
 */
export function calculateSavingsRate(income, expenses) {
  if (income === 0) {
    return 0;
  }
  return ((income - expenses) / income) * 100;
}

/**
 * Calculates total salary from work days
 * @param {Array} workDays - Array of work day objects
 * @returns {number} Total salary
 */
export function calculateWorkDaySalary(workDays) {
  if (!workDays || workDays.length === 0) {
    return 0;
  }

  return workDays
    .filter(day => day.status === 'worked')
    .reduce((total, day) => {
      return total + (day.hours_worked * day.daily_rate);
    }, 0);
}

/**
 * Calculates average daily spending
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} dateRange - Object with start and end Date objects
 * @returns {number} Average daily spending
 */
export function calculateAverageDailySpending(transactions, dateRange) {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0 || !dateRange) {
    return 0;
  }

  const totalExpenses = expenseTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  const days = Math.ceil(
    (dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24)
  ) + 1;

  return days > 0 ? totalExpenses / days : 0;
}

/**
 * Finds the highest expense transaction
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object|null} Transaction with highest expense amount
 */
export function findHighestExpense(transactions) {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0) {
    return null;
  }

  return expenseTransactions.reduce((max, transaction) => {
    const amount = Math.abs(transaction.amount);
    const maxAmount = Math.abs(max.amount);
    return amount > maxAmount ? transaction : max;
  });
}

/**
 * Aggregates income by source including work day salary
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} workDays - Array of work day objects
 * @returns {Array} Array of {category: string, amount: number, isFromWorkDays: boolean}
 */
export function aggregateIncomeSources(transactions, workDays = []) {
  const incomeSources = {};

  // Process income transactions
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  
  incomeTransactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    if (!incomeSources[category]) {
      incomeSources[category] = { amount: 0, isFromWorkDays: false };
    }
    incomeSources[category].amount += Math.abs(transaction.amount);
  });

  // Add work day salary
  const workDaySalary = calculateWorkDaySalary(workDays);
  if (workDaySalary > 0) {
    incomeSources['Salaris (Werkdagen)'] = {
      amount: workDaySalary,
      isFromWorkDays: true,
    };
  }

  // Convert to array
  return Object.entries(incomeSources)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      isFromWorkDays: data.isFromWorkDays,
    }))
    .sort((a, b) => b.amount - a.amount);
}
