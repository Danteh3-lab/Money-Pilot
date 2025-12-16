import { useMemo, useState, useEffect } from "react";
import useStore from "../store/useStore";
import { db } from "../lib/supabase";
import TransactionFormModal from "../components/transactions/TransactionFormModal";

/**
 * Transactions Page (UI + functional client-side filters)
 *
 * Notes:
 * - This page filters the transactions already loaded into the Zustand store.
 * - If you want server-side pagination / filtering later, we can move filtering into db queries.
 */
const Transactions = () => {
  const {
    transactions = [],
    categories = [],
    searchQuery,
    setSearchQuery,
    selectedTransactions,
    toggleTransactionSelection,
    clearTransactionSelection,
    removeTransactions,
    setTransactions,
    user,
  } = useStore();

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all"); // all | income | expense
  const [categoryFilter, setCategoryFilter] = useState("all"); // category name or "all"
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("date_desc"); // date_desc | date_asc | amount_desc | amount_asc

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load transactions on mount
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await db.getTransactions(user.id);
        setTransactions(data || []);
      } catch (error) {
        console.error("Error loading transactions:", error);
        alert("Fout bij laden van transacties. Probeer opnieuw.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [user, setTransactions]);

  const normalizedCategories = useMemo(() => {
    if (Array.isArray(categories) && categories.length > 0) return categories;

    // Fallback categories (only used if store has none loaded yet)
    return [
      { id: "Boodschappen", name: "Boodschappen" },
      { id: "Vervoer", name: "Vervoer" },
      { id: "Vaste Lasten", name: "Vaste Lasten" },
    ];
  }, [categories]);

  const filtered = useMemo(() => {
    let result = Array.isArray(transactions) ? [...transactions] : [];

    // Search
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(s) ||
          t.category?.toLowerCase().includes(s),
      );
    }

    // Type
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Category (store uses string category)
    if (categoryFilter !== "all") {
      result = result.filter((t) => (t.category ?? "") === categoryFilter);
    }

    // Amount range
    const min = minAmount === "" ? null : Number(minAmount);
    const max = maxAmount === "" ? null : Number(maxAmount);

    if (min !== null && !Number.isNaN(min)) {
      result = result.filter((t) => Number(t.amount) >= min);
    }
    if (max !== null && !Number.isNaN(max)) {
      result = result.filter((t) => Number(t.amount) <= max);
    }

    // Sort
    const byDate = (t) => new Date(t.date).getTime();
    const byAmount = (t) => Number(t.amount);

    if (sortBy === "date_desc") result.sort((a, b) => byDate(b) - byDate(a));
    if (sortBy === "date_asc") result.sort((a, b) => byDate(a) - byDate(b));
    if (sortBy === "amount_desc")
      result.sort((a, b) => byAmount(b) - byAmount(a));
    if (sortBy === "amount_asc")
      result.sort((a, b) => byAmount(a) - byAmount(b));

    return result;
  }, [
    transactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    minAmount,
    maxAmount,
    sortBy,
  ]);

  const totalIncome = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filtered],
  );

  const totalExpense = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [filtered],
  );

  const balance = totalIncome - totalExpense;

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const allSelectedOnPage =
    pageItems.length > 0 &&
    pageItems.every((t) => selectedTransactions.includes(t.id));

  const resetPagination = () => setCurrentPage(1);

  const clearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date_desc");
    setShowFilters(false);
    clearTransactionSelection();
    resetPagination();
  };

  const handleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      // Unselect only those on this page
      pageItems.forEach((t) => {
        if (selectedTransactions.includes(t.id))
          toggleTransactionSelection(t.id);
      });
      return;
    }

    // Select all on this page
    pageItems.forEach((t) => {
      if (!selectedTransactions.includes(t.id))
        toggleTransactionSelection(t.id);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    const ok = window.confirm(
      `Weet je zeker dat je ${selectedTransactions.length} transactie(s) wilt verwijderen?`,
    );
    if (!ok) return;

    setIsDeleting(true);
    try {
      // Delete from Supabase
      await db.deleteTransactions(selectedTransactions);

      // Update store
      removeTransactions(selectedTransactions);
      clearTransactionSelection();

      alert(
        `${selectedTransactions.length} transactie(s) succesvol verwijderd.`,
      );
    } catch (error) {
      console.error("Error deleting transactions:", error);
      alert("Fout bij verwijderen. Probeer opnieuw.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setShowModal(true);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    // Optionally reload or just let the store update handle it
    // For now, the modal already updates the store
  };

  const pillClass = (type) => {
    if (type === "income") {
      return "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Transacties laden...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Transacties
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Beheer en filter al je inkomsten en uitgaven
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              // Placeholder: we can wire CSV export later
              alert("Export komt binnenkort.");
            }}
          >
            <iconify-icon icon="lucide:download" width="16" />
            Export
          </button>

          <button
            type="button"
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2"
            onClick={handleAddNew}
          >
            <iconify-icon icon="lucide:plus" width="16" />
            Nieuwe Transactie
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <iconify-icon icon="lucide:arrow-down-left" width="16" />
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Inkomsten
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            SRD {totalIncome.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Gebaseerd op {filtered.length} transactie(s)
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <iconify-icon icon="lucide:arrow-up-right" width="16" />
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Uitgaven
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            SRD {totalExpense.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Gebaseerd op {filtered.length} transactie(s)
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <iconify-icon icon="lucide:wallet" width="16" />
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Saldo
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            SRD {balance.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Gebaseerd op {filtered.length} transactie(s)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
              <iconify-icon
                icon="lucide:search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                width="16"
              />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPagination();
                }}
                type="text"
                placeholder="Zoeken op beschrijving of categorie..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                resetPagination();
              }}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Alle Types</option>
              <option value="income">Inkomsten</option>
              <option value="expense">Uitgaven</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                resetPagination();
              }}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Alle Categorieën</option>
              {normalizedCategories.map((c) => (
                <option key={c.id ?? c.name} value={c.name ?? c.id}>
                  {c.name ?? c.id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
              title="Wis alle filters"
            >
              <iconify-icon icon="lucide:x" width="16" />
              Wis
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${
                showFilters
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              <iconify-icon icon="lucide:sliders-horizontal" width="16" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Bedrag Range
              </label>
              <div className="flex gap-2">
                <input
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    resetPagination();
                  }}
                  type="number"
                  placeholder="Min"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                />
                <input
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    resetPagination();
                  }}
                  type="number"
                  placeholder="Max"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Sorteren
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  resetPagination();
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="date_desc">Datum (Nieuw - Oud)</option>
                <option value="date_asc">Datum (Oud - Nieuw)</option>
                <option value="amount_desc">Bedrag (Hoog - Laag)</option>
                <option value="amount_asc">Bedrag (Laag - Hoog)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Resultaten
              </label>
              <div className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-600 dark:text-zinc-300">
                {filtered.length} transactie(s)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {selectedTransactions.length}
            </span>{" "}
            geselecteerd
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearTransactionSelection}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-2"
            >
              <iconify-icon icon="lucide:x" width="16" />
              Deselecteer
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <iconify-icon icon="lucide:trash-2" width="16" />
              {isDeleting ? "Verwijderen..." : "Verwijderen"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Alle Transacties
            </h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Pagina {page} / {totalPages}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSelectAllOnPage}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            {allSelectedOnPage ? "Deselecteer pagina" : "Selecteer pagina"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Beschrijving
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Categorie
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Bedrag
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Type
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    Geen transacties gevonden met deze filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    onClick={() => handleEdit(t)}
                  >
                    <td
                      className="px-6 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(t.id)}
                        onChange={() => toggleTransactionSelection(t.id)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                      {t.date ? new Date(t.date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-3 text-sm text-zinc-900 dark:text-white">
                      {t.description || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {t.category || "Onbekend"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-zinc-900 dark:text-white tabular-nums">
                      SRD {Number(t.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-md border ${pillClass(
                          t.type,
                        )}`}
                      >
                        {t.type === "income" ? "Inkomsten" : "Uitgaven"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vorige
          </button>

          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {filtered.length === 0
              ? "0 resultaten"
              : `${startIndex + 1}-${Math.min(
                  startIndex + itemsPerPage,
                  filtered.length,
                )} van ${filtered.length}`}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volgende
          </button>
        </div>
      </div>

      {/* Small footer hint */}
      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        Tip: Deze pagina filtert de transacties die al geladen zijn. Als je
        "alles ooit" wilt zien met snelle performance, kunnen we server-side
        filtering + pagination toevoegen.
      </p>

      {/* Transaction Form Modal */}
      <TransactionFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleModalSuccess}
        transaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;
