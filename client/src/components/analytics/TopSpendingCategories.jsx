import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { rankTopCategories } from '../../lib/analytics';

/**
 * TopSpendingCategories component displays a ranked list of the top 5 expense categories
 * @param {Object} props
 * @param {Array} props.transactions - Array of transaction objects
 */
const TopSpendingCategories = ({ transactions }) => {
  const navigate = useNavigate();
  
  // Memoize expensive ranking calculation
  const topCategories = useMemo(() => {
    return rankTopCategories(transactions, 5);
  }, [transactions]);

  // Memoize click handler
  const handleCategoryClick = useCallback((categoryName) => {
    // Navigate to transactions page with category filter
    navigate(`/transactions?category=${encodeURIComponent(categoryName)}`);
  }, [navigate]);

  // Empty state
  if (topCategories.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-3 sm:mb-4">
          Top Spending Categories
        </h3>
        <div className="text-center py-6 sm:py-8">
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            No expense categories found
          </p>
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 mt-2">
            Add expense transactions to see your top spending categories
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6"
      role="region"
      aria-label="Top spending categories"
    >
      <h3 
        className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white mb-3 sm:mb-4"
        id="top-categories-heading"
      >
        Top Spending Categories
      </h3>
      <nav aria-labelledby="top-categories-heading">
        <ul className="space-y-2 sm:space-y-3" role="list">
          {topCategories.map((category, index) => (
            <li key={category.name}>
              <button
                onClick={() => handleCategoryClick(category.name)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                aria-label={`Rank ${category.rank}: ${category.name}, SRD ${category.total.toFixed(2)}, ${category.count} ${category.count === 1 ? 'transaction' : 'transactions'}. Click to view transactions.`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div 
                    className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      {category.rank}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-zinc-900 dark:text-white truncate">
                      {category.name}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      {category.count} {category.count === 1 ? 'transaction' : 'transactions'}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3 sm:ml-4">
                  <p className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-white">
                    SRD {category.total.toFixed(2)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TopSpendingCategories;
