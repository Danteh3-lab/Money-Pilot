# Implementation Plan

- [x] 1. Create analytics utility functions and data transformations






  - Create `client/src/lib/analytics.js` with calculation functions
  - Implement daily expense aggregation function
  - Implement category aggregation and grouping logic
  - Implement weekly/monthly grouping functions
  - Implement top categories ranking with tie-breaking
  - Implement savings rate calculation
  - Implement work day salary calculation
  - _Requirements: 1.1, 2.1, 2.5, 3.2, 3.3, 4.1, 4.4, 5.1, 5.5, 7.2_

- [x] 1.1 Write property test for daily expense aggregation


  - **Property 1: Daily expense aggregation correctness**
  - **Validates: Requirements 1.1, 1.3**

- [x] 1.2 Write property test for category breakdown totals

  - **Property 2: Category breakdown totals match**
  - **Validates: Requirements 2.1**

- [x] 1.3 Write property test for category grouping threshold

  - **Property 3: Category grouping threshold**
  - **Validates: Requirements 2.5**

- [x] 1.4 Write property test for weekly grouping

  - **Property 4: Weekly grouping correctness**
  - **Validates: Requirements 3.2**

- [x] 1.5 Write property test for monthly grouping

  - **Property 5: Monthly grouping correctness**
  - **Validates: Requirements 3.3**

- [x] 1.6 Write property test for savings rate calculation

  - **Property 10: Savings rate formula**
  - **Validates: Requirements 4.4**

- [x] 1.7 Write property test for top categories ranking

  - **Property 11: Top categories ranking**
  - **Validates: Requirements 5.1, 5.5**

- [x] 2. Create shared analytics components










  - Create `client/src/components/analytics/MetricCard.jsx` for displaying key metrics
  - Create `client/src/components/analytics/ChartContainer.jsx` wrapper with loading/error states
  - Create `client/src/components/analytics/EmptyState.jsx` for no-data scenarios
  - Implement responsive grid layouts for charts
  - Add dark mode support to all components
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.1, 10.1, 10.2, 10.3_

- [x] 2.1 Write unit tests for MetricCard component


  - Test metric display with various values
  - Test negative savings rate styling
  - Test empty/null value handling
  - _Requirements: 4.5_


- [x] 3. Implement ExpensesTrendChart component









  - Create `client/src/components/analytics/ExpensesTrendChart.jsx`
  - Implement line chart using Recharts
  - Add daily expense data transformation
  - Implement tooltip with amount and date
  - Add empty state for no expenses
  - Add chart animation
  - Handle date range filtering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3.1 Write property test for expenses trend data transformation


  - **Property 1: Daily expense aggregation correctness**
  - **Validates: Requirements 1.1, 1.3**

- [x] 3.2 Write unit tests for ExpensesTrendChart


  - Test tooltip data structure
  - Test empty state rendering
  - _Requirements: 1.2, 1.4_

- [x] 4. Implement CategoryBreakdownChart component







  - Create `client/src/components/analytics/CategoryBreakdownChart.jsx`
  - Implement pie chart using Recharts
  - Add category aggregation with percentage calculation
  - Implement "Overig" grouping for 8+ categories
  - Add click handler to highlight segment and show transactions
  - Implement tooltip with category, amount, and percentage
  - Filter out zero-value categories
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4.1 Write property test for category breakdown


  - **Property 2: Category breakdown totals match**
  - **Property 3: Category grouping threshold**
  - **Validates: Requirements 2.1, 2.5**

- [x] 4.2 Write unit tests for CategoryBreakdownChart


  - Test tooltip data structure
  - Test zero category filtering
  - Test click handler
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 5. Implement IncomeVsExpensesChart component





  - Create `client/src/components/analytics/IncomeVsExpensesChart.jsx`
  - Implement grouped bar chart using Recharts
  - Add weekly/monthly view toggle
  - Implement weekly grouping logic
  - Implement monthly grouping logic
  - Include work day salary in income calculation
  - Add color coding (green for income, red for expenses)
  - Implement tooltip with period and amounts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Write property tests for income vs expenses grouping


  - **Property 4: Weekly grouping correctness**
  - **Property 5: Monthly grouping correctness**
  - **Property 6: Income vs expenses color assignment**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 5.2 Write unit tests for IncomeVsExpensesChart


  - Test view mode toggle
  - Test tooltip data
  - Test color assignment logic
  - _Requirements: 3.5_

- [x] 6. Implement IncomeSourcesChart component





  - Create `client/src/components/analytics/IncomeSourcesChart.jsx`
  - Implement horizontal bar chart using Recharts
  - Add income category aggregation
  - Calculate and include work day salary as "Salaris (Werkdagen)"
  - Implement tooltip with category and amount
  - Add empty state for no income
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 6.1 Write property test for income sources aggregation


  - **Property 15: Income sources aggregation**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 6.2 Write unit tests for IncomeSourcesChart


  - Test work day salary calculation
  - Test tooltip data
  - Test empty state
  - _Requirements: 7.4, 7.5_

- [x] 7. Implement KeyMetricsGrid component





  - Create `client/src/components/analytics/KeyMetricsGrid.jsx`
  - Calculate average daily spending metric
  - Calculate highest expense metric
  - Calculate total transactions metric
  - Calculate savings rate metric
  - Display metrics using MetricCard components
  - Add conditional styling for negative savings rate
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7.1 Write property tests for metrics calculations


  - **Property 7: Average daily spending calculation**
  - **Property 8: Maximum expense identification**
  - **Property 9: Transaction count accuracy**
  - **Property 10: Savings rate formula**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 7.2 Write unit tests for KeyMetricsGrid


  - Test negative savings rate styling
  - Test edge cases (no transactions, zero income)
  - _Requirements: 4.5_

- [x] 8. Implement TopSpendingCategories component





  - Create `client/src/components/analytics/TopSpendingCategories.jsx`
  - Implement category ranking logic with tie-breaking
  - Display top 5 categories (or fewer if less exist)
  - Show category name, total amount, and transaction count
  - Add click handler to navigate to transactions page with category filter
  - Handle empty state (no categories)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.1 Write property tests for top categories


  - **Property 11: Top categories ranking**
  - **Property 12: Top categories data completeness**
  - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 8.2 Write unit tests for TopSpendingCategories


  - Test navigation on click
  - Test handling of fewer than 5 categories
  - _Requirements: 5.3, 5.4_

- [x] 9. Implement MonthlyComparisonTable component





  - Create `client/src/components/analytics/MonthlyComparisonTable.jsx`
  - Generate last 6 months of data
  - Calculate income, expenses, and net savings per month
  - Display table with month name, income, expenses, net savings columns
  - Add conditional styling (green for positive, red for negative)
  - Add click handler to update date range filter
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9.1 Write property test for monthly comparison data


  - **Property 16: Monthly comparison data structure**
  - **Validates: Requirements 8.1, 8.2**

- [x] 9.2 Write unit tests for MonthlyComparisonTable


  - Test conditional styling
  - Test click handler
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 10. Implement main Analytics page component





  - Create `client/src/pages/Analytics.jsx`
  - Set up page layout with responsive grid
  - Implement data fetching from Supabase
  - Add loading skeleton states
  - Add error handling with retry button
  - Integrate all chart components
  - Integrate KeyMetricsGrid
  - Integrate TopSpendingCategories
  - Integrate MonthlyComparisonTable
  - Connect to global date range filter from Zustand store
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.5, 10.1, 10.2, 10.3_

- [x] 10.1 Write property tests for date range filtering


  - **Property 13: Date range filtering consistency**
  - **Property 14: Date range persistence round-trip**
  - **Validates: Requirements 6.1, 6.3, 6.4, 6.5**

- [x] 10.2 Write integration tests for Analytics page


  - Test page load and data fetching
  - Test loading states
  - Test error handling
  - Test responsive layout changes
  - _Requirements: 9.1, 9.5, 10.1, 10.2, 10.3_

- [x] 11. Implement date range persistence







  - Update Zustand store to persist date range changes
  - Add database update when date range changes
  - Restore date range from user settings on page load
  - Handle default to current month when no range saved
  - _Requirements: 6.4, 6.5_

- [x] 11.1 Write property test for date range persistence


  - **Property 14: Date range persistence round-trip**
  - **Validates: Requirements 6.4, 6.5**

- [x] 12. Add performance optimizations





  - Add useMemo for expensive calculations
  - Memoize chart data transformations
  - Add debouncing for date range filter changes
  - Implement lazy loading for chart libraries
  - Add loading skeletons for better perceived performance
  - _Requirements: 9.2, 9.3, 9.4_

- [x] 13. Implement responsive design





  - Add mobile layout (vertical stacking)
  - Add tablet layout (2-column grid)
  - Add desktop layout (3-column grid)
  - Test chart resizing at different breakpoints
  - Add touch-friendly interactions for mobile
  - Test orientation changes on mobile
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13.1 Write unit tests for responsive layouts


  - Test layout changes at breakpoints
  - Test orientation change handling
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 14. Add accessibility features





  - Add ARIA labels to all charts
  - Implement keyboard navigation for interactive elements
  - Add screen reader announcements for data updates
  - Test with screen readers
  - Ensure focus indicators are visible
  - Test color contrast in light and dark modes
  - _Requirements: All requirements (accessibility is cross-cutting)_

- [x] 15. Update App.jsx routing




  - Replace ComingSoon placeholder with Analytics component
  - Verify navigation works from sidebar
  - Test route protection (requires authentication)
  - _Requirements: All requirements_

- [x] 16. Final checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
