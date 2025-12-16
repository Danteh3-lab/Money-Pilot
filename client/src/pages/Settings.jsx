import { useState, useEffect } from "react";
import useStore from "../store/useStore";
import { db } from "../lib/supabase";

const Settings = () => {
  const { user, setUserSettings } = useStore();
  const [formData, setFormData] = useState({
    daily_rate: 89.95,
    default_hours: 40.0,
    hourly_rate: 11.24,
    currency: "SRD",
    date_format: "dd MMM, HH:mm",
    dark_mode: false,
    language: "nl",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [rateMode, setRateMode] = useState("hourly"); // 'hourly' or 'daily'

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const userSettings = await db.getUserSettings(user.id);

      // Default values for new users
      const defaultSettings = {
        daily_rate: 89.95,
        default_hours: 40.0,
        currency: "SRD",
        date_format: "dd MMM, HH:mm",
        dark_mode: false,
        language: "nl",
      };

      const settings = userSettings || defaultSettings;
      const weeklyHours = settings.default_hours || 40.0;
      const dailyHours = weeklyHours / 5; // Assuming 5 workdays
      const hourlyRate = settings.daily_rate
        ? (settings.daily_rate / dailyHours).toFixed(2)
        : 11.24;

      setFormData({
        daily_rate: settings.daily_rate || 89.95,
        default_hours: weeklyHours,
        hourly_rate: parseFloat(hourlyRate),
        currency: settings.currency || "SRD",
        date_format: settings.date_format || "dd MMM, HH:mm",
        dark_mode: settings.dark_mode || false,
        language: settings.language || "nl",
      });

      if (userSettings) {
        setUserSettings(userSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Set default values on error
      setFormData({
        daily_rate: 89.95,
        default_hours: 40.0,
        hourly_rate: 11.24,
        currency: "SRD",
        date_format: "dd MMM, HH:mm",
        dark_mode: false,
        language: "nl",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };

      // Auto-calculate related values
      const dailyHours = parseFloat(updated.default_hours) / 5; // Weekly hours / 5 workdays

      if (name === "hourly_rate" && rateMode === "hourly") {
        updated.daily_rate = (parseFloat(value) * dailyHours).toFixed(2);
      } else if (name === "daily_rate" && rateMode === "daily") {
        updated.hourly_rate = (parseFloat(value) / dailyHours).toFixed(2);
      } else if (name === "default_hours") {
        const newDailyHours = parseFloat(value) / 5;
        if (rateMode === "hourly") {
          updated.daily_rate = (updated.hourly_rate * newDailyHours).toFixed(2);
        } else {
          updated.hourly_rate = (updated.daily_rate / newDailyHours).toFixed(2);
        }
      }

      return updated;
    });
  };

  const handleRateModeChange = (mode) => {
    setRateMode(mode);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setSaveMessage(null);

    const settingsToSave = {
      daily_rate: parseFloat(formData.daily_rate),
      default_hours: parseFloat(formData.default_hours),
      currency: formData.currency,
      date_format: formData.date_format,
      dark_mode: formData.dark_mode,
      language: formData.language,
    };

    try {
      await db.updateUserSettings(user.id, settingsToSave);
      setUserSettings(settingsToSave);

      setSaveMessage({
        type: "success",
        text: "Instellingen succesvol opgeslagen!",
      });

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      console.error("Error details:", {
        message: error.message,
        user_id: user?.id,
        settings: settingsToSave,
      });

      let errorMessage = "Fout bij opslaan van instellingen";

      if (error.message?.includes("not configured")) {
        errorMessage = "Database niet geconfigureerd. Check je .env file.";
      } else if (error.message?.includes("JWT")) {
        errorMessage = "Sessie verlopen. Log opnieuw in.";
      } else if (error.message?.includes("user_settings")) {
        errorMessage = "Database tabel ontbreekt. Voer het schema uit.";
      } else if (error.message) {
        errorMessage = `Fout: ${error.message}`;
      }

      setSaveMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Instellingen
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Pas je werkuren, uurloon en voorkeuren aan
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Work Configuration Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:briefcase"
                width="20"
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Werk Configuratie
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Stel je standaard werkuren en tarieven in
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Default Working Hours */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Standaard Werkuren per Week
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="default_hours"
                  step="1"
                  min="0"
                  max="168"
                  value={formData.default_hours}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                  uur/week
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Standaard: 40 uur/week = 8 uur/dag (5 werkdagen)
              </p>
            </div>

            {/* Rate Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Tarief Modus
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRateModeChange("hourly")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    rateMode === "hourly"
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <iconify-icon
                    icon="lucide:clock"
                    width="16"
                    className="inline mr-2"
                  />
                  Uurloon
                </button>
                <button
                  type="button"
                  onClick={() => handleRateModeChange("daily")}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    rateMode === "daily"
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <iconify-icon
                    icon="lucide:calendar"
                    width="16"
                    className="inline mr-2"
                  />
                  Dagtarief
                </button>
              </div>
            </div>

            {/* Rate Input */}
            {rateMode === "hourly" ? (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Uurloon
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 dark:text-zinc-400">
                    {formData.currency}
                  </span>
                  <input
                    type="number"
                    name="hourly_rate"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 pl-16 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all font-medium tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                    /uur
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Dagtarief: {formData.currency} {formData.daily_rate} (
                  {(formData.default_hours / 5).toFixed(1)} uur/dag)
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Dagtarief
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 dark:text-zinc-400">
                    {formData.currency}
                  </span>
                  <input
                    type="number"
                    name="daily_rate"
                    step="0.01"
                    min="0"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 pl-16 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all font-medium tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500">
                    /dag
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Uurloon: {formData.currency} {formData.hourly_rate} per uur
                </p>
              </div>
            )}

            {/* Calculation Preview */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <iconify-icon
                  icon="lucide:calculator"
                  width="18"
                  className="text-emerald-600 dark:text-emerald-400 mt-0.5"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                    Berekeningsvoorbeeld
                  </h4>
                  <div className="space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                    <div className="flex justify-between">
                      <span>1 uur:</span>
                      <span className="font-medium">
                        {formData.currency} {formData.hourly_rate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {(formData.default_hours / 5).toFixed(1)} uur (1 dag):
                      </span>
                      <span className="font-medium">
                        {formData.currency} {formData.daily_rate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{formData.default_hours} uur (1 week):</span>
                      <span className="font-medium">
                        {formData.currency}{" "}
                        {(parseFloat(formData.daily_rate) * 5).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-emerald-200 dark:border-emerald-800">
                      <span>4 weken (maand):</span>
                      <span className="font-bold">
                        {formData.currency}{" "}
                        {(parseFloat(formData.daily_rate) * 20).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:globe"
                width="20"
                className="text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Regionale Instellingen
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Valuta en taal voorkeuren
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Valuta
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all appearance-none"
              >
                <option value="SRD">SRD - Surinaamse Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - Britse Pond</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Taal
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all appearance-none"
              >
                <option value="nl">Nederlands</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:palette"
                width="20"
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Weergave
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Thema en weergave voorkeuren
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <iconify-icon
                  icon="lucide:moon"
                  width="20"
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Donkere Modus
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Schakel naar donker thema
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="dark_mode"
                  checked={formData.dark_mode}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-900 dark:peer-focus:ring-zinc-100 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-white"></div>
              </label>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Datum Formaat
              </label>
              <select
                name="date_format"
                value={formData.date_format}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent transition-all appearance-none"
              >
                <option value="dd MMM, HH:mm">14 Dec, 15:30</option>
                <option value="dd/MM/yyyy">14/12/2024</option>
                <option value="MM/dd/yyyy">12/14/2024</option>
                <option value="yyyy-MM-dd">2024-12-14</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`p-4 rounded-lg ${
              saveMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <iconify-icon
                icon={
                  saveMessage.type === "success"
                    ? "lucide:check-circle"
                    : "lucide:alert-circle"
                }
                width="18"
              />
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                Bezig met opslaan...
              </>
            ) : (
              <>
                <iconify-icon icon="lucide:save" width="18" />
                Instellingen Opslaan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <iconify-icon
            icon="lucide:info"
            width="18"
            className="text-blue-600 dark:text-blue-400 mt-0.5"
          />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Tarieven Uitleg
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Je kunt kiezen tussen <strong>uurloon</strong> of{" "}
              <strong>dagtarief</strong>. Stel je{" "}
              <strong>werkuren per week</strong> in (standaard 40 uur = 5 dagen
              × 8 uur). Het systeem berekent automatisch je dagtarief en
              uurloon. Deze instellingen worden gebruikt als standaard bij het
              aanmaken van nieuwe werkdagen, maar je kunt ze per dag nog
              aanpassen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
