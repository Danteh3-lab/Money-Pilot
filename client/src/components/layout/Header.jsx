import { useState } from "react";
import useStore from "../../store/useStore";
import { format } from "date-fns";
import { auth } from "../../lib/supabase";

const Header = ({ title = "Overzicht" }) => {
  const { isDarkMode, toggleDarkMode, dateRange, clearUser } = useStore();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const formatDateRange = () => {
    if (dateRange.start && dateRange.end) {
      return `${format(new Date(dateRange.start), "dd MMM")} - ${format(new Date(dateRange.end), "dd MMM")}`;
    }
    return "15 Okt - 15 Nov";
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await auth.signOut();
      clearUser();
      // Router will likely handle redirect based on user state
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 border-b border-military-200 dark:border-military-800 bg-military-100/50 dark:bg-military-900/50 backdrop-blur-sm flex items-center justify-between px-6 z-30 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-military-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <span className="h-4 w-px bg-military-300 dark:bg-military-700"></span>

        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 text-sm text-military-700 dark:text-military-300 bg-military-100 dark:bg-military-800 border border-military-300 dark:border-military-700 rounded-md px-2 py-1 hover:border-gold-500 dark:hover:border-gold-600 transition-colors cursor-pointer group"
          >
            <iconify-icon
              icon="lucide:calendar"
              width="14"
              className="text-military-500 dark:text-military-500 group-hover:text-gold-600 dark:group-hover:text-gold-400"
            />
            <span className="font-medium tabular-nums">
              {formatDateRange()}
            </span>
            <iconify-icon
              icon="lucide:chevron-down"
              width="14"
              className="text-military-500 dark:text-military-500"
            />
          </button>

          {/* Date Picker Dropdown - Placeholder for now */}
          {showDatePicker && (
            <div className="absolute top-full mt-2 left-0 bg-military-100 dark:bg-military-900 border border-military-200 dark:border-military-800 rounded-lg shadow-lg p-4 min-w-[300px] z-50">
              <p className="text-xs text-military-600 dark:text-military-400 mb-2">
                Date range picker coming soon
              </p>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-xs text-military-700 dark:text-military-400 hover:text-military-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-military-700 dark:text-military-300 border border-military-300 dark:border-military-700 rounded-md hover:bg-military-200 dark:hover:bg-military-800 transition-all"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <iconify-icon
            icon={isDarkMode ? "lucide:sun" : "lucide:moon"}
            width="14"
          />
          {isDarkMode ? "Light" : "Dark"}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-military-700 dark:text-military-300 border border-military-300 dark:border-military-700 rounded-md hover:bg-military-200 dark:hover:bg-military-800 transition-all disabled:opacity-50"
        >
          <iconify-icon icon="lucide:log-out" width="14" />
          {isLoggingOut ? "..." : "Logout"}
        </button>

        {/* Export Button */}
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-military-700 dark:text-military-300 border border-military-300 dark:border-military-700 rounded-md hover:bg-military-200 dark:hover:bg-military-800 transition-all">
          <iconify-icon icon="lucide:download" width="14" />
          Export
        </button>

        {/* New Transaction Button */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-military-950 bg-gold-gradient hover:shadow-lg shadow-sm transition-all rounded-md font-semibold">
          <iconify-icon icon="lucide:plus" width="14" />
          <span className="hidden sm:inline">Nieuwe Transactie</span>
          <span className="sm:hidden">Nieuw</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
