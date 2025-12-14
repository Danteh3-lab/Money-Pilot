import { useState } from "react";
import useStore from "../../store/useStore";
import { db } from "../../lib/supabase";
import { format } from "date-fns";
import { setupCheck } from "../../lib/setupCheck";

const QuickAddTransaction = () => {
  const { user, categories, addTransaction } = useStore();
  const [formData, setFormData] = useState({
    amount: "",
    category: "Boodschappen",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    type: "expense",
  });

  // Update category when type changes
  const handleTypeChange = (newType) => {
    const newCategory = newType === "income" ? "Salaris" : "Boodschappen";
    setFormData((prev) => ({
      ...prev,
      type: newType,
      category: newCategory,
    }));
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Voer een geldig bedrag in");
      return;
    }

    if (!user) {
      setError("Je moet ingelogd zijn om transacties toe te voegen");
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionType =
        formData.type === "income" ? "inkomen" : "uitgave";
      const transaction = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        description:
          formData.description || `${formData.category} ${transactionType}`,
        type: formData.type,
      };

      const newTransaction = await db.createTransaction(transaction);
      addTransaction(newTransaction);

      // Reset form
      setFormData({
        amount: "",
        category: formData.type === "income" ? "Salaris" : "Boodschappen",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        type: formData.type,
      });

      // Show success feedback
      setError(null);
    } catch (err) {
      console.error("Error creating transaction:", err);

      // Use setupCheck utility for user-friendly error messages
      const friendlyError = setupCheck.getUserFriendlyError(err);
      const errorMessage = `${friendlyError.title}: ${friendlyError.message}`;

      setError(errorMessage);

      // Log helpful action to console
      console.warn("💡 Tip:", friendlyError.action);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const defaultExpenseCategories = [
    "Boodschappen",
    "Transport",
    "Huur",
    "Abonnementen",
    "Overig",
  ];
  const defaultIncomeCategories = [
    "Salaris",
    "Freelance",
    "Bonus",
    "Overig Inkomen",
  ];

  const defaultCategories =
    formData.type === "income"
      ? defaultIncomeCategories
      : defaultExpenseCategories;
  const availableCategories =
    categories.length > 0
      ? categories
          .filter((c) => c.type === formData.type || !c.type)
          .map((c) => c.name)
      : defaultCategories;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 flex flex-col animate-fade-in">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight mb-4">
        Snel Toevoegen
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        {/* Type Selection */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                formData.type === "expense"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              Uitgave
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                formData.type === "income"
                  ? "bg-emerald-600 dark:bg-emerald-500 text-white"
                  : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              Inkomsten
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Bedrag (SRD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 text-sm">
              SRD
            </span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              placeholder="0.00"
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 pl-12 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium tabular-nums text-zinc-900 dark:text-white"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Category Select */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Categorie
          </label>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all appearance-none text-zinc-700 dark:text-zinc-300"
              disabled={isSubmitting}
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <iconify-icon
              icon="lucide:chevron-down"
              width="14"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Beschrijving (optioneel)
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Bijv. Albert Heijn"
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            disabled={isSubmitting}
          />
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Datum
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all text-zinc-700 dark:text-zinc-300"
            disabled={isSubmitting}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium py-2.5 rounded-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
              Bezig...
            </>
          ) : (
            <>
              <iconify-icon icon="lucide:plus-circle" width="14" />
              Toevoegen
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default QuickAddTransaction;
