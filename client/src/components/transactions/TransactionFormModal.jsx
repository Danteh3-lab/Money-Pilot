import { useState, useEffect } from "react";
import { format } from "date-fns";
import useStore from "../../store/useStore";
import { db } from "../../lib/supabase";

/**
 * TransactionFormModal
 *
 * Dual-purpose modal for creating and editing transactions.
 * - If `transaction` prop is null/undefined: CREATE mode
 * - If `transaction` prop is an object: EDIT mode (pre-fills form)
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onSuccess: (transaction) => void (called after successful create/update)
 * - transaction: object | null (for edit mode)
 */
const TransactionFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  transaction = null,
}) => {
  const { user, categories, addTransaction, updateTransaction } = useStore();

  const isEditMode = Boolean(transaction?.id);

  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && transaction) {
      setFormData({
        type: transaction.type || "expense",
        amount: transaction.amount?.toString() || "",
        category: transaction.category || "",
        description: transaction.description || "",
        date: transaction.date
          ? format(new Date(transaction.date), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      });
    }
  }, [isEditMode, transaction]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setErrors({});
    }
  }, [isOpen]);

  const normalizedCategories = Array.isArray(categories)
    ? categories
    : [
        { id: "Salaris", name: "Salaris" },
        { id: "Freelance", name: "Freelance" },
        { id: "Boodschappen", name: "Boodschappen" },
        { id: "Vervoer", name: "Vervoer" },
        { id: "Vaste Lasten", name: "Vaste Lasten" },
        { id: "Overig", name: "Overig" },
      ];

  const incomeCategories = normalizedCategories.filter((c) =>
    ["Salaris", "Freelance", "Bonus", "Overig Inkomen"].includes(c.name)
  );
  const expenseCategories = normalizedCategories.filter(
    (c) => !["Salaris", "Freelance", "Bonus", "Overig Inkomen"].includes(c.name)
  );

  const currentCategories =
    formData.type === "income" ? incomeCategories : expenseCategories;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category:
        newType === "income"
          ? incomeCategories[0]?.name || "Salaris"
          : expenseCategories[0]?.name || "Boodschappen",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Bedrag moet groter zijn dan 0";
    }

    if (!formData.category?.trim()) {
      newErrors.category = "Categorie is verplicht";
    }

    if (!formData.date) {
      newErrors.date = "Datum is verplicht";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSaving(true);

    try {
      const payload = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString(),
        user_id: user.id,
      };

      if (isEditMode) {
        // Update existing transaction
        const updated = await db.updateTransaction(transaction.id, payload);
        updateTransaction(transaction.id, updated);
        alert("Transactie succesvol bijgewerkt!");
      } else {
        // Create new transaction
        const created = await db.createTransaction(payload);
        addTransaction(created);
        alert("Transactie succesvol toegevoegd!");
      }

      if (onSuccess) onSuccess(isEditMode ? transaction : payload);
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert(
        `Fout bij ${isEditMode ? "bijwerken" : "toevoegen"} van transactie. Probeer opnieuw.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {isEditMode ? "Transactie Bewerken" : "Nieuwe Transactie"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <iconify-icon
              icon="lucide:x"
              width="20"
              className="text-zinc-500 dark:text-zinc-400"
            />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type
            </label>
            <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  formData.type === "expense"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <iconify-icon
                  icon="lucide:arrow-up-right"
                  width="16"
                  className="inline mr-1"
                />
                Uitgave
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  formData.type === "income"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <iconify-icon
                  icon="lucide:arrow-down-left"
                  width="16"
                  className="inline mr-1"
                />
                Inkomst
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label
              htmlFor="amount"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Bedrag (SRD) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                errors.amount
                  ? "border-rose-500 dark:border-rose-500"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            />
            {errors.amount && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {errors.amount}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label
              htmlFor="category"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Categorie *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                errors.category
                  ? "border-rose-500 dark:border-rose-500"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <option value="">Selecteer categorie...</option>
              {currentCategories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {errors.category}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Beschrijving (optioneel)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Bijv. Albert Heijn boodschappen"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label
              htmlFor="date"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Datum *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                errors.date
                  ? "border-rose-500 dark:border-rose-500"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            />
            {errors.date && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                {errors.date}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuleer
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditMode ? "Bijwerken..." : "Toevoegen..."}
                </>
              ) : (
                <>
                  <iconify-icon
                    icon={isEditMode ? "lucide:save" : "lucide:plus"}
                    width="16"
                  />
                  {isEditMode ? "Bijwerken" : "Toevoegen"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
