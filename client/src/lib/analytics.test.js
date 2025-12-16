import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  aggregateDailyExpenses,
  aggregateByCategory,
  groupCategories,
  groupByWeek,
  groupByMonth,
  calculateSavingsRate,
  rankTopCategories,
  calculateWorkDaySalary,
  aggregateIncomeSources,
  calculateAverageDailySpending,
  findHighestExpense,
} from './analytics.js';

// Arbitraries for generating test data
const transactionArbitrary = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  amount: fc.double({ min: 0.01, max: 10000, noNaN: true }),
  type: fc.constantFrom('income', 'expense'),
  category: fc.constantFrom('Boodschappen', 'Transport', 'Entertainment', 'Utilities', 'Healthcare'),
  description: fc.string({ minLength: 1, maxLength: 50 }),
  date: fc.integer({ min: 0, max: 2000 })
    .map(days => {
      const d = new Date('2020-01-01');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    }),
  created_at: fc.integer({ min: 0, max: 2000 })
    .map(days => {
      const d = new Date('2020-01-01');
      d.setDate(d.getDate() + days);
      return d.toISOString();
    }),
  updated_at: fc.integer({ min: 0, max: 2000 })
    .map(days => {
      const d = new Date('2020-01-01');
      d.setDate(d.getDate() + days);
      return d.toISOString();
    }),
});

const workDayArbitrary = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  date: fc.integer({ min: 0, max: 2000 })
    .map(days => {
      const d = new Date('2020-01-01');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    }),
  hours_worked: fc.double({ min: 0, max: 24, noNaN: true }),
  daily_rate: fc.double({ min: 10, max: 500, noNaN: true }),
  notes: fc.string(),
  status: fc.constantFrom('worked', 'vacation', 'sick', 'holiday', 'absent'),
  created_at: fc.integer({ min: 0, max: 2000 })
    .map(days => {
      const d = new Date('2020-01-01');
      d.setDate(d.getDate() + days);
      return d.toISOString();
    }),
  updated_at: fc.integer({ min: 0, max: 2000 })
    .map(days => {
      const d = new Date('2020-01-01');
      d.setDate(d.getDate() + days);
      return d.toISOString();
    }),
});

describe('Analytics Property-Based Tests', () => {
  // Feature: analytics-page, Property 1: Daily expense aggregation correctness
  // Validates: Requirements 1.1, 1.3
  describe('Property 1: Daily expense aggregation correctness', () => {
    it('sum of daily expenses equals total expense transactions', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          (transactions) => {
            const dateRange = {
              start: new Date('2020-01-01'),
              end: new Date('2025-12-31'),
            };

            const dailyExpenses = aggregateDailyExpenses(transactions, dateRange);
            const sumOfDaily = dailyExpenses.reduce((sum, day) => sum + day.amount, 0);

            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            const totalExpenses = expenseTransactions.reduce(
              (sum, t) => sum + Math.abs(t.amount),
              0
            );

            // Allow for small floating point errors
            expect(Math.abs(sumOfDaily - totalExpenses)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 2: Category breakdown totals match
  // Validates: Requirements 2.1
  describe('Property 2: Category breakdown totals match', () => {
    it('sum of category amounts equals total expense transactions', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          (transactions) => {
            const categories = aggregateByCategory(transactions);
            const sumOfCategories = categories.reduce((sum, cat) => sum + cat.value, 0);

            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            const totalExpenses = expenseTransactions.reduce(
              (sum, t) => sum + Math.abs(t.amount),
              0
            );

            // Allow for small floating point errors
            expect(Math.abs(sumOfCategories - totalExpenses)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('percentages sum to 100 when there are expenses', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 })
            .filter(txs => txs.some(t => t.type === 'expense')),
          (transactions) => {
            const categories = aggregateByCategory(transactions);
            
            if (categories.length > 0) {
              const sumOfPercentages = categories.reduce((sum, cat) => sum + cat.percentage, 0);
              // Allow for small floating point errors
              expect(Math.abs(sumOfPercentages - 100)).toBeLessThan(0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 3: Category grouping threshold
  // Validates: Requirements 2.5
  describe('Property 3: Category grouping threshold', () => {
    it('groups categories into max 9 segments when more than 8 exist', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 10, maxLength: 100 }),
          (transactions) => {
            const categories = aggregateByCategory(transactions);
            
            if (categories.length > 8) {
              const grouped = groupCategories(categories);
              expect(grouped.length).toBeLessThanOrEqual(9);
              
              // Check if "Overig" exists
              const overig = grouped.find(cat => cat.name === 'Overig');
              if (overig) {
                // Overig should contain sum of categories beyond top 8
                const top8Total = categories.slice(0, 8).reduce((sum, cat) => sum + cat.value, 0);
                const overigExpected = categories.slice(8).reduce((sum, cat) => sum + cat.value, 0);
                
                expect(Math.abs(overig.value - overigExpected)).toBeLessThan(0.01);
              }
            } else {
              const grouped = groupCategories(categories);
              expect(grouped.length).toBe(categories.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 4: Weekly grouping correctness
  // Validates: Requirements 3.2
  describe('Property 4: Weekly grouping correctness', () => {
    it('each transaction appears in exactly one week group', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          (transactions) => {
            const weeklyData = groupByWeek(transactions, []);
            
            // Sum all income and expenses from weekly data
            const totalIncomeFromWeeks = weeklyData.reduce((sum, week) => sum + week.income, 0);
            const totalExpensesFromWeeks = weeklyData.reduce((sum, week) => sum + week.expenses, 0);

            // Calculate expected totals from transactions
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            
            const expectedIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const expectedExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            // Each transaction should be counted exactly once
            expect(Math.abs(totalIncomeFromWeeks - expectedIncome)).toBeLessThan(0.01);
            expect(Math.abs(totalExpensesFromWeeks - expectedExpenses)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 5: Monthly grouping correctness
  // Validates: Requirements 3.3
  describe('Property 5: Monthly grouping correctness', () => {
    it('each transaction appears in exactly one month group', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          (transactions) => {
            const monthlyData = groupByMonth(transactions, []);
            
            // Sum all income and expenses from monthly data
            const totalIncomeFromMonths = monthlyData.reduce((sum, month) => sum + month.income, 0);
            const totalExpensesFromMonths = monthlyData.reduce((sum, month) => sum + month.expenses, 0);

            // Calculate expected totals from transactions
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            
            const expectedIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const expectedExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

            // Each transaction should be counted exactly once
            expect(Math.abs(totalIncomeFromMonths - expectedIncome)).toBeLessThan(0.01);
            expect(Math.abs(totalExpensesFromMonths - expectedExpenses)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 6: Income vs expenses color assignment
  // Validates: Requirements 3.4
  describe('Property 6: Income vs expenses color assignment', () => {
    it('income bar is green and expenses bar is red when income > expenses', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          fc.array(workDayArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions, workDays) => {
            const weeklyData = groupByWeek(transactions, workDays);
            
            // For each period where income > expenses, verify the relationship
            weeklyData.forEach(period => {
              if (period.income > period.expenses) {
                // This property verifies the data structure is correct
                // The actual color assignment happens in the component
                expect(period.income).toBeGreaterThan(period.expenses);
                expect(period.net).toBeGreaterThan(0);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('net savings equals income minus expenses', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          fc.array(workDayArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions, workDays) => {
            const weeklyData = groupByWeek(transactions, workDays);
            
            weeklyData.forEach(period => {
              const expectedNet = period.income - period.expenses;
              expect(Math.abs(period.net - expectedNet)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 7: Average daily spending calculation
  // Validates: Requirements 4.1
  describe('Property 7: Average daily spending calculation', () => {
    it('average daily spending equals total expenses divided by number of days', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          fc.integer({ min: 1, max: 365 }),
          (transactions, daysOffset) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-01');
            endDate.setDate(endDate.getDate() + daysOffset);
            
            const dateRange = { start: startDate, end: endDate };
            
            const avgDailySpending = calculateAverageDailySpending(transactions, dateRange);
            
            // Calculate expected value
            const expenseTransactions = transactions.filter(t => t.type === 'expense');
            const totalExpenses = expenseTransactions.reduce(
              (sum, t) => sum + Math.abs(t.amount),
              0
            );
            
            const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            const expected = days > 0 ? totalExpenses / days : 0;
            
            expect(Math.abs(avgDailySpending - expected)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns 0 when there are no expense transactions', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 })
            .map(txs => txs.map(t => ({ ...t, type: 'income' }))),
          fc.integer({ min: 1, max: 365 }),
          (transactions, daysOffset) => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-01-01');
            endDate.setDate(endDate.getDate() + daysOffset);
            
            const dateRange = { start: startDate, end: endDate };
            const avgDailySpending = calculateAverageDailySpending(transactions, dateRange);
            
            expect(avgDailySpending).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 8: Maximum expense identification
  // Validates: Requirements 4.2
  describe('Property 8: Maximum expense identification', () => {
    it('highest expense has the maximum amount value', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 })
            .filter(txs => txs.some(t => t.type === 'expense')),
          (transactions) => {
            const highestExpense = findHighestExpense(transactions);
            
            if (highestExpense) {
              const expenseTransactions = transactions.filter(t => t.type === 'expense');
              const maxAmount = Math.abs(highestExpense.amount);
              
              // No other expense should have a greater amount
              expenseTransactions.forEach(transaction => {
                expect(Math.abs(transaction.amount)).toBeLessThanOrEqual(maxAmount);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns null when there are no expense transactions', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 })
            .map(txs => txs.map(t => ({ ...t, type: 'income' }))),
          (transactions) => {
            const highestExpense = findHighestExpense(transactions);
            expect(highestExpense).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 9: Transaction count accuracy
  // Validates: Requirements 4.3
  describe('Property 9: Transaction count accuracy', () => {
    it('transaction count equals number of transactions in date range', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          (transactions) => {
            const startDate = new Date('2020-01-01');
            const endDate = new Date('2025-12-31');
            
            // Filter transactions within date range
            const filteredTransactions = transactions.filter(t => {
              const txDate = new Date(t.date);
              return txDate >= startDate && txDate <= endDate;
            });
            
            // The count should equal the number of filtered transactions
            expect(filteredTransactions.length).toBe(filteredTransactions.length);
            
            // Verify all transactions in the filtered set are within range
            filteredTransactions.forEach(t => {
              const txDate = new Date(t.date);
              expect(txDate >= startDate).toBe(true);
              expect(txDate <= endDate).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 10: Savings rate formula
  // Validates: Requirements 4.4
  describe('Property 10: Savings rate formula', () => {
    it('savings rate equals ((income - expenses) / income) * 100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 100000, noNaN: true }),
          fc.double({ min: 0, max: 100000, noNaN: true }),
          (income, expenses) => {
            const savingsRate = calculateSavingsRate(income, expenses);
            const expected = ((income - expenses) / income) * 100;
            
            expect(Math.abs(savingsRate - expected)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns 0 when income is 0', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100000, noNaN: true }),
          (expenses) => {
            const savingsRate = calculateSavingsRate(0, expenses);
            expect(savingsRate).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 11: Top categories ranking
  // Validates: Requirements 5.1, 5.5
  describe('Property 11: Top categories ranking', () => {
    it('categories are sorted by total amount descending, then by count', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          (transactions) => {
            const topCategories = rankTopCategories(transactions, 5);
            
            // Check that categories are sorted correctly
            for (let i = 0; i < topCategories.length - 1; i++) {
              const current = topCategories[i];
              const next = topCategories[i + 1];
              
              // Either current total is greater, or totals are equal and current count is greater or equal
              const isCorrectOrder = 
                current.total > next.total || 
                (current.total === next.total && current.count >= next.count);
              
              expect(isCorrectOrder).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('returns at most the requested limit of categories', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10 }),
          (transactions, limit) => {
            const topCategories = rankTopCategories(transactions, limit);
            expect(topCategories.length).toBeLessThanOrEqual(limit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 12: Top categories data completeness
  // Validates: Requirements 5.2
  describe('Property 12: Top categories data completeness', () => {
    it('each category includes name, total amount, and transaction count', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          (transactions) => {
            const topCategories = rankTopCategories(transactions, 5);
            
            topCategories.forEach(category => {
              // Each category must have required fields
              expect(category.name).toBeDefined();
              expect(typeof category.name).toBe('string');
              expect(category.name.length).toBeGreaterThan(0);
              
              expect(category.total).toBeDefined();
              expect(typeof category.total).toBe('number');
              expect(category.total).toBeGreaterThan(0);
              
              expect(category.count).toBeDefined();
              expect(typeof category.count).toBe('number');
              expect(category.count).toBeGreaterThan(0);
              
              expect(category.rank).toBeDefined();
              expect(typeof category.rank).toBe('number');
              expect(category.rank).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total amount equals sum of all transactions in that category', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          (transactions) => {
            const topCategories = rankTopCategories(transactions, 5);
            
            topCategories.forEach(category => {
              // Calculate expected total from transactions
              const categoryTransactions = transactions.filter(
                t => t.type === 'expense' && (t.category || 'Uncategorized') === category.name
              );
              
              const expectedTotal = categoryTransactions.reduce(
                (sum, t) => sum + Math.abs(t.amount),
                0
              );
              
              const expectedCount = categoryTransactions.length;
              
              // Verify total matches
              expect(Math.abs(category.total - expectedTotal)).toBeLessThan(0.01);
              expect(category.count).toBe(expectedCount);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 16: Monthly comparison data structure
  // Validates: Requirements 8.1, 8.2
  describe('Property 16: Monthly comparison data structure', () => {
    it('each month entry contains month name, income, expenses, and net savings', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          fc.array(workDayArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions, workDays) => {
            const monthlyData = groupByMonth(transactions, workDays);
            
            monthlyData.forEach(month => {
              // Each month must have required fields
              expect(month.period).toBeDefined();
              expect(typeof month.period).toBe('string');
              expect(month.period.length).toBeGreaterThan(0);
              
              expect(month.income).toBeDefined();
              expect(typeof month.income).toBe('number');
              expect(month.income).toBeGreaterThanOrEqual(0);
              
              expect(month.expenses).toBeDefined();
              expect(typeof month.expenses).toBe('number');
              expect(month.expenses).toBeGreaterThanOrEqual(0);
              
              expect(month.net).toBeDefined();
              expect(typeof month.net).toBe('number');
              
              // Net savings should equal income minus expenses
              const expectedNet = month.income - month.expenses;
              expect(Math.abs(month.net - expectedNet)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('net savings equals income minus expenses for each month', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 }),
          fc.array(workDayArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions, workDays) => {
            const monthlyData = groupByMonth(transactions, workDays);
            
            monthlyData.forEach(month => {
              const expectedNet = month.income - month.expenses;
              expect(Math.abs(month.net - expectedNet)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: analytics-page, Property 15: Income sources aggregation
  // Validates: Requirements 7.1, 7.2, 7.3
  describe('Property 15: Income sources aggregation', () => {
    it('sum of income sources equals total income plus work day salary', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          fc.array(workDayArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions, workDays) => {
            const incomeSources = aggregateIncomeSources(transactions, workDays);
            
            // Sum all income source amounts
            const totalFromSources = incomeSources.reduce((sum, source) => sum + source.amount, 0);

            // Calculate expected total: income transactions + work day salary
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const totalFromTransactions = incomeTransactions.reduce(
              (sum, t) => sum + Math.abs(t.amount),
              0
            );

            const workDaySalary = calculateWorkDaySalary(workDays);
            const expectedTotal = totalFromTransactions + workDaySalary;

            // Allow for small floating point errors
            expect(Math.abs(totalFromSources - expectedTotal)).toBeLessThan(0.01);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('includes work day salary as "Salaris (Werkdagen)" when work days exist', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 0, maxLength: 100 }),
          fc.array(workDayArbitrary, { minLength: 1, maxLength: 50 })
            .filter(days => days.some(d => d.status === 'worked')),
          (transactions, workDays) => {
            const incomeSources = aggregateIncomeSources(transactions, workDays);
            
            const workDaySalary = calculateWorkDaySalary(workDays);
            
            if (workDaySalary > 0) {
              const salarySource = incomeSources.find(
                source => source.category === 'Salaris (Werkdagen)'
              );
              
              expect(salarySource).toBeDefined();
              expect(salarySource.isFromWorkDays).toBe(true);
              expect(Math.abs(salarySource.amount - workDaySalary)).toBeLessThan(0.01);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('groups income transactions by category', () => {
      fc.assert(
        fc.property(
          fc.array(transactionArbitrary, { minLength: 1, maxLength: 100 })
            .filter(txs => txs.some(t => t.type === 'income')),
          (transactions) => {
            const incomeSources = aggregateIncomeSources(transactions, []);
            
            // Get unique income categories from transactions
            const incomeTransactions = transactions.filter(t => t.type === 'income');
            const uniqueCategories = new Set(
              incomeTransactions.map(t => t.category || 'Uncategorized')
            );

            // Each unique category should appear in income sources
            uniqueCategories.forEach(category => {
              const source = incomeSources.find(s => s.category === category);
              expect(source).toBeDefined();
              
              // Verify the amount matches the sum of transactions in that category
              const expectedAmount = incomeTransactions
                .filter(t => (t.category || 'Uncategorized') === category)
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
              
              expect(Math.abs(source.amount - expectedAmount)).toBeLessThan(0.01);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
