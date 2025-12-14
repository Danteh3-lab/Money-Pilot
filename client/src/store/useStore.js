import { create } from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      // Theme
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (isDarkMode) => set({ isDarkMode }),

      // Sidebar
      isSidebarOpen: false,
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      closeSidebar: () => set({ isSidebarOpen: false }),

      // Transactions
      transactions: [],
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      removeTransactions: (ids) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => !ids.includes(t.id)),
        })),

      // Categories
      categories: [],
      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),

      // Work Days
      workDays: [],
      setWorkDays: (workDays) => set({ workDays }),
      addWorkDay: (workDay) =>
        set((state) => ({
          workDays: [workDay, ...state.workDays],
        })),

      // User Settings
      userSettings: {
        currency: "SRD",
        dailyRate: 89.95,
        dateFormat: "dd MMM, HH:mm",
        darkMode: false,
      },
      setUserSettings: (settings) =>
        set((state) => ({
          userSettings: { ...state.userSettings, ...settings },
        })),

      // Alias for backwards compatibility
      get settings() {
        return get().userSettings;
      },
      setSettings: (settings) => get().setUserSettings(settings),

      // Date Range Filter
      dateRange: {
        start: null,
        end: null,
      },
      setDateRange: (start, end) => set({ dateRange: { start, end } }),
      clearDateRange: () => set({ dateRange: { start: null, end: null } }),

      // Selected transactions (for bulk actions)
      selectedTransactions: [],
      toggleTransactionSelection: (id) =>
        set((state) => ({
          selectedTransactions: state.selectedTransactions.includes(id)
            ? state.selectedTransactions.filter((tid) => tid !== id)
            : [...state.selectedTransactions, id],
        })),
      selectAllTransactions: () =>
        set((state) => ({
          selectedTransactions: state.transactions.map((t) => t.id),
        })),
      clearTransactionSelection: () => set({ selectedTransactions: [] }),

      // Loading states
      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),

      // Search
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Computed values
      getFilteredTransactions: () => {
        const state = get();
        let filtered = state.transactions;

        // Filter by search query
        if (state.searchQuery) {
          filtered = filtered.filter(
            (t) =>
              t.description
                ?.toLowerCase()
                .includes(state.searchQuery.toLowerCase()) ||
              t.category
                ?.toLowerCase()
                .includes(state.searchQuery.toLowerCase()),
          );
        }

        // Filter by date range
        if (state.dateRange.start && state.dateRange.end) {
          filtered = filtered.filter((t) => {
            const date = new Date(t.date);
            return date >= state.dateRange.start && date <= state.dateRange.end;
          });
        }

        return filtered;
      },

      getTotalIncome: () => {
        const state = get();
        return state.transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      },

      getTotalExpenses: () => {
        const state = get();
        return state.transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      },

      getBalance: () => {
        const state = get();
        return state.getTotalIncome() - state.getTotalExpenses();
      },

      getEstimatedSalary: () => {
        const state = get();

        // Estimate salary based on actual work day entries (so it matches "Totaal Verdiend")
        // Supports both snake_case and camelCase fields.
        const defaultDailyRate =
          state.userSettings.dailyRate ??
          state.userSettings.daily_rate ??
          state.settings?.dailyRate ??
          state.settings?.daily_rate ??
          0;

        const defaultDailyHours =
          (state.userSettings.default_hours ??
            state.userSettings.defaultHours ??
            state.settings?.default_hours ??
            state.settings?.defaultHours ??
            40) / 5;

        const total = (state.workDays || []).reduce((sum, wd) => {
          const hours = parseFloat(wd.hours_worked ?? wd.hoursWorked ?? 0) || 0;

          const rate =
            parseFloat(wd.daily_rate ?? wd.dailyRate ?? defaultDailyRate) || 0;

          // If you tracked hours, pay scales with hours vs default daily hours.
          // If hours is 0 (or missing), count it as a full day.
          const multiplier =
            hours > 0 && defaultDailyHours > 0 ? hours / defaultDailyHours : 1;

          return sum + rate * multiplier;
        }, 0);

        return total;
      },
    }),
    {
      name: "money-pilot-storage",
      partialize: (state) => ({
        // isDarkMode is NOT persisted in localStorage - it's stored per account in Supabase user_settings
        userSettings: state.userSettings,
        // dateRange is NOT persisted in localStorage - it's stored per account in Supabase user_settings
      }),
    },
  ),
);

export default useStore;
