const EmptyState = ({
  icon = "lucide:bar-chart-3",
  title = "No data available",
  description,
  action,
  actionLabel,
  onAction,
}) => {
  return (
    <div 
      className="flex items-center justify-center h-full min-h-[200px] text-zinc-400 dark:text-zinc-600"
      role="status"
      aria-live="polite"
    >
      <div className="text-center max-w-sm px-4">
        <iconify-icon
          icon={icon}
          width="48"
          className="mb-3 opacity-50 mx-auto"
          aria-hidden="true"
        />
        <p className="text-sm text-zinc-900 dark:text-white font-medium mb-1">
          {title}
        </p>
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            {description}
          </p>
        )}
        {action && actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
