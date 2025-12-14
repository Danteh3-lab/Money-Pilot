import { useState } from "react";
import useStore from "../../store/useStore";
import { format, parseISO } from "date-fns";
import { db } from "../../lib/supabase";

const TransactionsTable = () => {
  const {
    transactions,
    selectedTransactions,
    toggleTransactionSelection,
    clearTransactionSelection,
    removeTransactions,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(search) ||
      transaction.category?.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const allSelected =
    currentTransactions.length > 0 &&
    currentTransactions.every((t) => selectedTransactions.includes(t.id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearTransactionSelection();
    } else {
      currentTransactions.forEach((t) => {
        if (!selectedTransactions.includes(t.id)) {
          toggleTransactionSelection(t.id);
        }
      });
    }
  };

  const handleDelete = async () => {
    if (selectedTransactions.length === 0) return;

    const confirmed = window.confirm(
      `Weet je zeker dat je ${selectedTransactions.length} transactie(s) wilt verwijderen?`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await db.deleteTransactions(selectedTransactions);
      removeTransactions(selectedTransactions);
      clearTransactionSelection();
    } catch (error) {
      console.error("Error deleting transactions:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de transacties");
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category, type) => {
    if (type === "income") {
      return "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800";
    }
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
            Recente Transacties
          </h2>
          {selectedTransactions.length > 0 && (
            <>
              <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedTransactions.length} geselecteerd
              </span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium disabled:opacity-50"
              >
                {isDeleting ? "Verwijderen..." : "Verwijder"}
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <iconify-icon
              icon="lucide:search"
              width="14"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            />
            <input
              type="text"
              placeholder="Zoeken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors w-40 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            />
          </div>
          <button className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
            <iconify-icon icon="lucide:filter" width="14" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {currentTransactions.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="pl-6 pr-4 py-3 font-medium w-8">
                  <label className="custom-checkbox flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="hidden"
                    />
                    <div className="w-3.5 h-3.5 border border-zinc-300 dark:border-zinc-600 rounded-sm flex items-center justify-center transition-colors bg-white dark:bg-zinc-900">
                      <svg
                        className="hidden w-2.5 h-2.5 text-white dark:text-zinc-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </label>
                </th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Beschrijving</th>
                <th className="px-4 py-3 font-medium">Categorie</th>
                <th className="px-4 py-3 font-medium text-right pr-6">
                  Bedrag
                </th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-50 dark:divide-zinc-800">
              {currentTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="pl-6 pr-4 py-3.5">
                    <label className="custom-checkbox flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(transaction.id)}
                        onChange={() =>
                          toggleTransactionSelection(transaction.id)
                        }
                        className="hidden"
                      />
                      <div className="w-3.5 h-3.5 border border-zinc-200 dark:border-zinc-700 rounded-sm flex items-center justify-center transition-colors bg-white dark:bg-zinc-900 group-hover:border-zinc-300 dark:group-hover:border-zinc-600">
                        <svg
                          className="hidden w-2.5 h-2.5 text-white dark:text-zinc-900"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </label>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 whitespace-nowrap text-xs">
                    {format(parseISO(transaction.date), "dd MMM, HH:mm")}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-white">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getCategoryColor(
                        transaction.category,
                        transaction.type,
                      )}`}
                    >
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right font-medium tabular-nums pr-6 ${
                      transaction.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-900 dark:text-white"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"} SRD{" "}
                    {parseFloat(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 dark:text-zinc-600">
            <iconify-icon
              icon="lucide:inbox"
              width="48"
              className="mb-3 opacity-50"
            />
            <p className="text-sm font-medium">Geen transacties gevonden</p>
            <p className="text-xs mt-1">
              {searchQuery
                ? "Probeer een andere zoekterm"
                : "Voeg je eerste transactie toe om te beginnen"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/30 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Toont {startIndex + 1}-
            {Math.min(endIndex, filteredTransactions.length)} van{" "}
            {filteredTransactions.length} resultaten
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-all"
            >
              Vorige
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-all"
            >
              Volgende
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;
