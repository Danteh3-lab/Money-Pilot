const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = "blue",
  trend,
  trendValue,
  isNegative = false,
  format = "currency",
  currency = "SRD",
}) => {
  const iconColorClasses = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
    blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
    gold: "bg-gold-50 dark:bg-gold-950 text-gold-600 dark:text-gold-400",
    military:
      "bg-military-50 dark:bg-military-950 text-military-600 dark:text-military-400",
  };

  const trendColorClasses = {
    positive:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950",
    negative: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950",
    neutral: "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800",
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return "—";
    
    if (format === "currency") {
      return parseFloat(val).toFixed(2);
    } else if (format === "percentage") {
      return `${parseFloat(val).toFixed(1)}%`;
    } else if (format === "number") {
      return val.toString();
    }
    return val;
  };

  const displayValue = formatValue(value);
  const showCurrency = format === "currency" && value !== null && value !== undefined;

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl border ${
        isNegative
          ? "border-rose-300 dark:border-rose-800"
          : "border-zinc-200 dark:border-zinc-800"
      } p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in`}
      role="article"
      aria-label={`${title}: ${displayValue}${showCurrency ? ` ${currency}` : ''}`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide"
          id={`metric-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {title}
        </h3>
        {icon && (
          <div 
            className={`p-1.5 rounded-md ${iconColorClasses[iconColor]}`}
            aria-hidden="true"
          >
            <iconify-icon icon={icon} width="16" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1" aria-describedby={`metric-${title.replace(/\s+/g, '-').toLowerCase()}`}>
        {showCurrency && (
          <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium translate-y-[-2px]" aria-hidden="true">
            {currency}
          </span>
        )}
        <span
          className={`text-xl sm:text-2xl font-semibold tracking-tight tabular-nums ${
            isNegative
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-900 dark:text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {displayValue}
        </span>
      </div>

      {(subtitle || (trend && trendValue !== undefined)) && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {subtitle && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </div>
          )}

          {trend && trendValue !== undefined && (
            <div className="flex items-center gap-2 text-xs mt-2">
              <span
                className={`flex items-center px-1.5 py-0.5 rounded font-medium ${trendColorClasses[trend]}`}
              >
                {trend === "positive" && "+"}
                {trendValue}
              </span>
              <span className="text-zinc-500 dark:text-zinc-500">
                vs previous period
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
