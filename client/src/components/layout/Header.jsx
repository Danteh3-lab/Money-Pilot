import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import useStore from "../../store/useStore";
import { format } from "date-fns";
import { auth, db } from "../../lib/supabase";

const Header = ({ title = "Overzicht" }) => {
  const {
    user,
    isDarkMode,
    setDarkMode,
    dateRange,
    setDateRange,
    clearDateRange,
    clearUser,
  } = useStore();

  const location = useLocation();
  const isTransactionsPage = location.pathname === "/transactions";

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);

  // Local draft values for simple "Van/Tot" picker
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  const datePickerRef = useRef(null);

  const toDateOnlyString = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  useEffect(() => {
    // Keep draft inputs in sync with global dateRange when it changes
    const start = dateRange?.start ? new Date(dateRange.start) : null;
    const end = dateRange?.end ? new Date(dateRange.end) : null;

    setDraftStart(start ? format(start, "yyyy-MM-dd") : "");
    setDraftEnd(end ? format(end, "yyyy-MM-dd") : "");
  }, [dateRange?.start, dateRange?.end]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!showDatePicker) return;
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showDatePicker]);

  const formatDateRange = () => {
    if (dateRange?.start && dateRange?.end) {
      return `${format(new Date(dateRange.start), "dd MMM")} - ${format(new Date(dateRange.end), "dd MMM")}`;
    }
    return "Alles";
  };

  const handleToggleDarkMode = async () => {
    const next = !isDarkMode;

    // Update UI immediately
    setDarkMode(next);

    // Persist per account
    if (!user?.id) return;

    try {
      await db.updateUserSettings(user.id, { dark_mode: next });
    } catch (error) {
      console.error("[DarkMode] Failed to persist dark mode:", error);
    }
  };

  const applyDateRange = async () => {
    if (!draftStart || !draftEnd) return;

    const start = new Date(`${draftStart}T00:00:00`);
    const end = new Date(`${draftEnd}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    // Ensure start <= end
    const s = start <= end ? start : end;
    const e = start <= end ? end : start;

    // Update UI immediately
    setDateRange(s, e);

    // Persist per account (DATE fields)
    if (!user?.id) {
      console.warn("[Overzicht] Cannot save date range: no user is logged in");
    } else {
      const overview_start_date = toDateOnlyString(s);
      const overview_end_date = toDateOnlyString(e);

      console.log("[Overzicht] Saving date range to Supabase user_settings:", {
        user_id: user.id,
        overview_start_date,
        overview_end_date,
      });

      if (overview_start_date && overview_end_date) {
        try {
          setIsSavingOverview(true);
          const saved = await db.updateUserSettings(user.id, {
            overview_start_date,
            overview_end_date,
          });
          console.log(
            "[Overzicht] Save success. Returned user_settings row:",
            saved,
          );
        } catch (error) {
          console.error("[Overzicht] Save FAILED:", error);
        } finally {
          setIsSavingOverview(false);
        }
      } else {
        console.warn("[Overzicht] Not saving: invalid date conversion", {
          draftStart,
          draftEnd,
          overview_start_date,
          overview_end_date,
        });
      }
    }

    setShowDatePicker(false);
  };

  const resetDateRange = async () => {
    clearDateRange();
    setDraftStart("");
    setDraftEnd("");
    setShowDatePicker(false);

    // Also clear persisted overview range for this account
    if (user?.id) {
      try {
        setIsSavingOverview(true);
        await db.updateUserSettings(user.id, {
          overview_start_date: null,
          overview_end_date: null,
        });
      } catch (error) {
        console.error("Error clearing overview date range:", error);
      } finally {
        setIsSavingOverview(false);
      }
    }
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

        <div className="relative" ref={datePickerRef}>
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

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-full mt-2 left-0 bg-military-100 dark:bg-military-900 border border-military-200 dark:border-military-800 rounded-lg shadow-lg p-4 min-w-[320px] z-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-military-700 dark:text-military-300 mb-1">
                    Van
                  </label>
                  <input
                    type="date"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="w-full bg-white/70 dark:bg-military-800 border border-military-300 dark:border-military-700 rounded-md px-2 py-1.5 text-xs text-military-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-military-700 dark:text-military-300 mb-1">
                    Tot
                  </label>
                  <input
                    type="date"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="w-full bg-white/70 dark:bg-military-800 border border-military-300 dark:border-military-700 rounded-md px-2 py-1.5 text-xs text-military-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  type="button"
                  onClick={resetDateRange}
                  className="text-xs font-medium text-military-700 dark:text-military-300 hover:text-military-900 dark:hover:text-white"
                >
                  Reset
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-1.5 text-xs font-medium text-military-700 dark:text-military-300 border border-military-300 dark:border-military-700 rounded-md hover:bg-military-200 dark:hover:bg-military-800 transition-all"
                  >
                    Sluiten
                  </button>
                  <button
                    type="button"
                    onClick={applyDateRange}
                    disabled={!draftStart || !draftEnd || isSavingOverview}
                    className="px-3 py-1.5 text-xs font-semibold text-military-950 bg-gold-gradient hover:shadow-lg shadow-sm transition-all rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingOverview ? "Opslaan..." : "Toepassen"}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-military-600 dark:text-military-400 mt-3">
                Tip: deze periode wordt gebruikt voor grafieken en totals.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={handleToggleDarkMode}
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
        {!isTransactionsPage && (
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-military-950 bg-gold-gradient hover:shadow-lg shadow-sm transition-all rounded-md font-semibold">
            <iconify-icon icon="lucide:plus" width="14" />
            <span className="hidden sm:inline">Nieuwe Transactie</span>
            <span className="sm:hidden">Nieuw</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
