const ChartContainer = ({
  title,
  children,
  isLoading = false,
  error = null,
  onRetry,
  actions,
  className = "",
}) => {
  if (error) {
    return (
      <div
        className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col animate-fade-in ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <iconify-icon
              icon="lucide:alert-circle"
              width="48"
              className="mb-3 text-rose-500 dark:text-rose-400"
              aria-hidden="true"
            />
            <p className="text-sm text-zinc-900 dark:text-white font-medium mb-1">
              Failed to load chart
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              {error.message || "An error occurred while loading the data"}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                aria-label={`Retry loading ${title}`}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col animate-fade-in ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={`Loading ${title}`}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" aria-hidden="true" />
          {actions && <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" aria-hidden="true" />}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Loading chart data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col animate-fade-in ${className}`}
      role="region"
      aria-label={`${title} chart`}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 
          className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight"
          id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {title}
        </h2>
        {actions && <div role="toolbar" aria-label={`${title} controls`}>{actions}</div>}
      </div>
      <div className="flex-1 w-full" role="img" aria-labelledby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
