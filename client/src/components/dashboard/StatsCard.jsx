const StatsCard = ({
  title,
  value,
  currency = "SRD",
  icon,
  iconColor = "emerald",
  subtitle,
  subtitleIcon,
  progress,
  progressColor = "emerald",
  trend,
  trendValue,
  children,
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

  const progressColorClasses = {
    emerald: "bg-emerald-500 dark:bg-emerald-400",
    rose: "bg-rose-500 dark:bg-rose-400",
    blue: "bg-blue-500 dark:bg-blue-400",
    zinc: "bg-zinc-900 dark:bg-zinc-100",
    gold: "bg-gold-500 dark:bg-gold-400",
    military: "bg-military-600 dark:bg-military-400",
  };

  const trendColorClasses = {
    positive:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950",
    negative: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950",
    neutral: "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800",
  };

  return (
    <div className="bg-military-100 dark:bg-military-900 rounded-xl border border-military-300/80 dark:border-military-700 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] relative overflow-hidden group animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-medium text-military-600 dark:text-military-400 uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <div className={`p-1.5 rounded-md ${iconColorClasses[iconColor]}`}>
            <iconify-icon icon={icon} width="16" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-xs text-military-500 dark:text-military-500 font-medium translate-y-[-2px]">
          {currency}
        </span>
        <span className="text-2xl font-semibold text-military-900 dark:text-white tracking-tight tabular-nums">
          {value}
        </span>
      </div>

      {/* Subtitle section */}
      {(subtitle || subtitleIcon || trend || trendValue) && (
        <div className="mt-4 pt-4 border-t border-military-200 dark:border-military-800">
          {/* Subtitle with icon */}
          {subtitle && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-military-600 dark:text-military-400">
                {subtitleIcon && (
                  <iconify-icon icon={subtitleIcon} width="14" />
                )}
                <span>{subtitle}</span>
              </div>
            </div>
          )}

          {/* Trend indicator */}
          {trend && trendValue && (
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`flex items-center px-1.5 py-0.5 rounded font-medium ${trendColorClasses[trend]}`}
              >
                {trend === "positive" && "+"}
                {trendValue}
              </span>
              <span className="text-military-500 dark:text-military-500">
                t.o.v. vorige periode
              </span>
            </div>
          )}

          {/* Custom children content */}
          {children}
        </div>
      )}

      {/* Progress bar at bottom */}
      {progress !== undefined && (
        <div
          className="absolute bottom-0 left-0 h-1 rounded-bl-xl transition-all duration-500"
          style={{
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
          }}
        >
          <div className={`h-full ${progressColorClasses[progressColor]}`} />
        </div>
      )}
    </div>
  );
};

export default StatsCard;
