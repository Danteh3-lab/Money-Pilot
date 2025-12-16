# Analytics Page Design Document

## Overview

The Analytics page provides comprehensive financial insights through interactive visualizations and key metrics. It transforms raw transaction and work day data into actionable intelligence, helping users understand spending patterns, income sources, and budget performance. The page is built as a React component that integrates with the existing Money-Pilot architecture, using Recharts for visualizations and Zustand for state management.

## Architecture

### Component Structure

```
Analytics (Page Component)
├── AnalyticsHeader (Date range selector, page title)
├── KeyMetricsGrid
│   ├── MetricCard (Average daily spending)
│   ├── MetricCard (Highest expense)
│   ├── MetricCard (Total transactions)
│   └── MetricCard (Savings rate)
├── ChartsGrid
│   ├── ExpensesTrendChart (Line chart)
│   ├── CategoryBreakdownChart (Pie chart)
│   ├── IncomeVsExpensesChart (Bar chart)
│   └── IncomeSourcesChart (Horizontal bar chart)
├── TopSpendingCategories (Ranked list)
└── MonthlyComparisonTable (6-month comparison)
```

### Data Flow

1. **Page Load**: Analytics component fetches transactions, work days, and user settings from Supabase
2. **State Management**: Data is stored in Zustand store and filtered based on selected date range
3. **Computation**: Analytics calculations are performed using memoized functions
4. **Rendering**: Charts and metrics are rendered with computed data
5. **Interaction**: User interactions (date range changes, chart clicks) update filters and trigger re-computation

### Integration Points

- **Zustand Store**: Reads transactions, workDays, dateRange, userSettings
- **Supabase**: Fetches data via existing `db` helper functions
- **Recharts**: Used for all chart visualizations
- **React Router**: Navigation to transactions page with filters
- **date-fns**: Date manipulation and formatting

## Components and Interfaces

### Analytics (Main Page Component)

**Props**: None (uses Zustand store)

**State**:
- `isLoading: boolean` - Loading state for data fetching
- `error: Error | null` - Error state for failed operations
- `viewMode: 'week' | 'month'` - Toggle for income vs expenses chart

**Key Functions**:
- `loadAnalyticsData()` - Fetches all required data
- `calculateMetrics()` - Computes key financial metrics
- `handleDateRangeChange(start, end)` - Updates date range filter

### KeyMetricsGrid

**Props**:
- `transactions: Transaction[]`
- `workDays: WorkDay[]`
- `dateRange: { start: Date, end: Date }`

**Computed Metrics**:
- Average daily spending
- Highest single expense
- Total transaction count
- Savings rate percentage

### ExpensesTrendChart

**Props**:
- `transactions: Transaction[]`
- `dateRange: { start: Date, end: Date }`

**Data Structure**:
```typescript
interface DailyExpense {
  date: string;
  amount: number;
  formattedDate: string;
}
```

**Behavior**:
- Groups expenses by day
- Displays line chart with date on X-axis, amount on Y-axis
- Shows tooltip on hover with exact amount and date

### CategoryBreakdownChart

**Props**:
- `transactions: Transaction[]`

**Data Structure**:
```typescript
interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  count: number;
}
```

**Behavior**:
- Aggregates expenses by category
- Groups categories beyond 8 into "Overig"
- Displays pie chart with percentages
- Highlights segment on click and shows category transactions

### IncomeVsExpensesChart

**Props**:
- `transactions: Transaction[]`
- `workDays: WorkDay[]`
- `viewMode: 'week' | 'month'`

**Data Structure**:
```typescript
interface PeriodComparison {
  period: string;
  income: number;
  expenses: number;
  net: number;
}
```

**Behavior**:
- Groups transactions by week or month
- Includes work day salary in income
- Displays grouped bar chart
- Colors bars based on income vs expenses

### IncomeSourcesChart

**Props**:
- `transactions: Transaction[]`
- `workDays: WorkDay[]`

**Data Structure**:
```typescript
interface IncomeSource {
  category: string;
  amount: number;
  isFromWorkDays: boolean;
}
```

**Behavior**:
- Aggregates income by category
- Calculates salary from work days
- Displays horizontal bar chart
- Shows tooltip with category and amount

### TopSpendingCategories

**Props**:
- `transactions: Transaction[]`
- `onCategoryClick: (category: string) => void`

**Data Structure**:
```typescript
interface TopCategory {
  name: string;
  total: number;
  count: number;
  rank: number;
}
```

**Behavior**:
- Ranks categories by total spending
- Shows top 5 (or fewer if less exist)
- Handles ties by transaction count
- Navigates to transactions page on click

### MonthlyComparisonTable

**Props**:
- `transactions: Transaction[]`
- `workDays: WorkDay[]`
- `onMonthClick: (month: Date) => void`

**Data Structure**:
```typescript
interface MonthlyData {
  month: string;
  monthDate: Date;
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
}
```

**Behavior**:
- Shows last 6 months of data
- Calculates income, expenses, net savings per month
- Colors net savings (green for positive, red for negative)
- Updates date range filter on row click

## Data Models

### Transaction (Existing)
```typescript
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string; // ISO date string
  created_at: string;
  updated_at: string;
}
```

### WorkDay (Existing)
```typescript
interface WorkDay {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  hours_worked: number;
  daily_rate: number;
  notes: string;
  status: 'worked' | 'vacation' | 'sick' | 'holiday' | 'absent';
  created_at: string;
  updated_at: string;
}
```

### AnalyticsData (Computed)
```typescript
interface AnalyticsData {
  metrics: {
    avgDailySpending: number;
    highestExpense: Transaction | null;
    totalTransactions: number;
    savingsRate: number;
  };
  expensesTrend: DailyExpense[];
  categoryBreakdown: CategoryData[];
  incomeVsExpenses: PeriodComparison[];
  incomeSources: IncomeSource[];
  topCategories: TopCategory[];
  monthlyComparison: MonthlyData[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Daily expense aggregation correctness

*For any* set of expense transactions and date range, the sum of all daily expense amounts in the trend chart should equal the total of all expense transactions within that date range.

**Validates: Requirements 1.1, 1.3**

### Property 2: Category breakdown totals match

*For any* set of expense transactions, the sum of all category amounts in the pie chart should equal the total of all expense transactions.

**Validates: Requirements 2.1**

### Property 3: Category grouping threshold

*For any* set of expense transactions with more than 8 unique categories, the pie chart should contain exactly 9 segments (8 individual categories plus "Overig"), and the "Overig" segment should contain the sum of all remaining categories.

**Validates: Requirements 2.5**

### Property 4: Weekly grouping correctness

*For any* set of transactions, when grouped by week, each transaction should appear in exactly one week group, and the week group should contain all transactions whose dates fall within that week's start and end dates.

**Validates: Requirements 3.2**

### Property 5: Monthly grouping correctness

*For any* set of transactions, when grouped by month, each transaction should appear in exactly one month group, and the month group should contain all transactions whose dates fall within that month.

**Validates: Requirements 3.3**

### Property 6: Income vs expenses color assignment

*For any* time period with calculated income and expenses, if income is greater than expenses, the income bar should be assigned green color, and the expenses bar should be assigned red color.

**Validates: Requirements 3.4**

### Property 7: Average daily spending calculation

*For any* set of expense transactions and date range, the average daily spending should equal the total expenses divided by the number of days in the date range.

**Validates: Requirements 4.1**

### Property 8: Maximum expense identification

*For any* non-empty set of expense transactions, the highest expense should be the transaction with the maximum amount value, and no other transaction should have a greater amount.

**Validates: Requirements 4.2**

### Property 9: Transaction count accuracy

*For any* set of transactions and date range filter, the total transaction count should equal the number of transactions whose dates fall within the date range.

**Validates: Requirements 4.3**

### Property 10: Savings rate formula

*For any* calculated income and expenses where income is greater than zero, the savings rate should equal ((income - expenses) / income) × 100.

**Validates: Requirements 4.4**

### Property 11: Top categories ranking

*For any* set of expense transactions, the top 5 categories should be sorted by total amount in descending order, and when two categories have equal amounts, they should be sorted by transaction count in descending order.

**Validates: Requirements 5.1, 5.5**

### Property 12: Top categories data completeness

*For any* category in the top spending list, the category data should include name, total amount, and transaction count, and the total amount should equal the sum of all transactions in that category.

**Validates: Requirements 5.2**

### Property 13: Date range filtering consistency

*For any* date range selection, all charts and metrics should display data only for transactions whose dates fall within the selected start and end dates (inclusive).

**Validates: Requirements 6.1, 6.3**

### Property 14: Date range persistence round-trip

*For any* date range selection, after persisting to user settings and reloading the page, the restored date range should equal the originally selected date range.

**Validates: Requirements 6.4, 6.5**

### Property 15: Income sources aggregation

*For any* set of income transactions, the sum of all income source amounts (including work day salary) should equal the total income from transactions plus the calculated salary from work days.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 16: Monthly comparison data structure

*For any* 6-month comparison, each month entry should contain month name, total income, total expenses, and net savings, where net savings equals income minus expenses.

**Validates: Requirements 8.1, 8.2**

## Error Handling

### Data Fetching Errors
- Display error message with retry button
- Log error details to console
- Preserve existing data if available
- Show partial data with warning if some requests fail

### Empty Data States
- Show friendly empty state messages for charts with no data
- Provide guidance on how to add data (e.g., "Add transactions to see analytics")
- Display zero values for metrics instead of hiding them

### Invalid Date Ranges
- Validate that end date is after start date
- Default to current month if invalid range provided
- Show validation error message to user

### Calculation Errors
- Handle division by zero in savings rate calculation
- Handle missing or null values in transactions
- Default to zero for invalid numeric values
- Log calculation errors for debugging

### Chart Rendering Errors
- Wrap charts in error boundaries
- Display fallback UI if chart fails to render
- Provide option to view raw data as table

## Testing Strategy

### Unit Tests

**Calculation Functions**:
- Test average daily spending with various transaction sets
- Test highest expense identification with edge cases (ties, single transaction)
- Test savings rate calculation including negative rates
- Test category aggregation with empty categories
- Test date grouping (daily, weekly, monthly) with boundary dates

**Data Transformation**:
- Test transaction filtering by date range
- Test category grouping and "Overig" creation
- Test work day salary calculation
- Test monthly comparison data generation

**Sorting and Ranking**:
- Test top categories sorting with ties
- Test category ranking with equal amounts
- Test handling of fewer than 5 categories

### Property-Based Tests

Property-based tests will be written using `fast-check` (JavaScript property testing library) to verify universal properties across randomly generated inputs.

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test must include a comment referencing the design document property:
```javascript
// Feature: analytics-page, Property 1: Daily expense aggregation correctness
```

**Key Properties to Test**:
- Daily/weekly/monthly aggregation preserves total amounts
- Category breakdown sums equal total expenses
- Date range filtering is consistent across all components
- Sorting and ranking maintain correct order
- Round-trip persistence of date range settings

### Integration Tests

**Page Load**:
- Test that all components render without errors
- Test that data is fetched on mount
- Test loading states display correctly

**User Interactions**:
- Test date range changes update all charts
- Test category click navigates to transactions page
- Test month click updates date range filter
- Test view mode toggle updates chart

**Responsive Behavior**:
- Test layout changes at mobile/tablet/desktop breakpoints
- Test chart resizing maintains readability

### Performance Tests

**Large Datasets**:
- Test with 1000+ transactions
- Measure render time for all charts
- Verify calculations complete within acceptable time

**Filter Changes**:
- Measure time to update visualizations after filter change
- Verify UI remains responsive during calculations

## Performance Optimization

### Memoization
- Use `useMemo` for expensive calculations (aggregations, sorting)
- Memoize chart data transformations
- Cache filtered transaction sets

### Lazy Loading
- Load chart libraries only when needed
- Defer rendering of below-the-fold charts
- Use React.lazy for code splitting

### Data Pagination
- Limit initial data fetch to current month
- Load historical data on demand
- Implement virtual scrolling for large tables

### Debouncing
- Debounce date range filter changes
- Debounce search/filter inputs
- Throttle chart resize events

## Responsive Design

### Mobile (< 768px)
- Stack all charts vertically
- Full-width components
- Simplified tooltips
- Touch-friendly interactions
- Reduced chart complexity (fewer data points)

### Tablet (768px - 1024px)
- 2-column grid for charts
- Side-by-side metrics cards
- Optimized chart sizes
- Hover and touch support

### Desktop (> 1024px)
- 3-column grid where appropriate
- Full-featured charts
- Detailed tooltips
- Keyboard navigation support
- Larger data visualizations

### Accessibility
- ARIA labels for charts
- Keyboard navigation for interactive elements
- Screen reader announcements for data updates
- High contrast mode support
- Focus indicators for all interactive elements

## Dark Mode Support

All charts and components must support dark mode:
- Use theme-aware colors from Tailwind
- Adjust chart colors for dark backgrounds
- Ensure text remains readable
- Test contrast ratios meet WCAG standards

## Future Enhancements

- Export analytics as PDF/CSV
- Custom date range presets (last 30 days, last quarter, etc.)
- Budget goals and tracking
- Spending predictions based on trends
- Category-specific insights and recommendations
- Comparison with previous periods
- Anomaly detection for unusual spending
