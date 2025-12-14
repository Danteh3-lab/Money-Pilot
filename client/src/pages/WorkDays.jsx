import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isSameDay,
  parseISO,
  getDay,
} from "date-fns";
import { nl } from "date-fns/locale";
import useStore from "../store/useStore";
import { db } from "../lib/supabase";

const WorkDays = () => {
  const { user, userSettings } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workDays, setWorkDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDay, setEditingDay] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    hours_worked: (userSettings?.default_hours || 40.0) / 5, // Convert weekly to daily
    daily_rate: userSettings?.daily_rate || 89.95,
    notes: "",
    status: "worked", // worked, vacation, sick, holiday, absent
  });

  useEffect(() => {
    if (user) {
      loadWorkDays();
    }
  }, [user, currentMonth]);

  useEffect(() => {
    if (user && !isLoading && workDays.length >= 0) {
      autoAddTodayWorkDay();
    }
  }, [user, isLoading, workDays.length]);

  const loadWorkDays = async () => {
    setIsLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const days = await db.getWorkDays(user.id);

      // Filter for current month
      const monthDays = (days || []).filter((wd) => {
        const wdDate = parseISO(wd.date);
        return wdDate >= start && wdDate <= end;
      });

      setWorkDays(monthDays);
    } catch (error) {
      console.error("Error loading work days:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoAddTodayWorkDay = async () => {
    if (!user) return;

    try {
      const today = new Date();

      // Skip weekends
      if (isWeekend(today)) {
        console.log("Today is weekend, skipping auto-add");
        return;
      }

      // Fetch latest work days to ensure we have current data
      const allWorkDays = await db.getWorkDays(user.id);
      const exists = allWorkDays.some((wd) =>
        isSameDay(parseISO(wd.date), today),
      );

      if (!exists) {
        const workDay = {
          user_id: user.id,
          date: format(today, "yyyy-MM-dd"),
          hours_worked: (userSettings?.default_hours || 40.0) / 5,
          daily_rate: userSettings?.daily_rate || 89.95,
          notes: "Automatisch toegevoegd",
        };

        const created = await db.createWorkDay(workDay);
        setWorkDays((prev) => [...prev, created]);

        // Show notification
        setNotification({
          type: "success",
          message: `✨ Werkdag ${format(today, "dd MMM")} automatisch toegevoegd!`,
        });
        setTimeout(() => setNotification(null), 4000);

        console.log("Today's workday added automatically");
      }
    } catch (error) {
      console.error("Error auto-adding today's work day:", error);
    }
  };

  const clearAllWorkDays = async () => {
    if (
      !confirm(
        "Weet je zeker dat je ALLE werkdagen wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
      )
    ) {
      return;
    }

    setIsGenerating(true);
    try {
      // Delete all work days for current month
      const monthWorkDays = workDays.filter((wd) => {
        const wdDate = parseISO(wd.date);
        return (
          wdDate >= startOfMonth(currentMonth) &&
          wdDate <= endOfMonth(currentMonth)
        );
      });

      for (const wd of monthWorkDays) {
        await db.deleteWorkDay(wd.id);
      }

      setWorkDays((prev) =>
        prev.filter((wd) => {
          const wdDate = parseISO(wd.date);
          return !(
            wdDate >= startOfMonth(currentMonth) &&
            wdDate <= endOfMonth(currentMonth)
          );
        }),
      );

      alert(`${monthWorkDays.length} werkdagen verwijderd!`);
    } catch (error) {
      console.error("Error clearing work days:", error);
      alert("Fout bij verwijderen van werkdagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const autoGenerateWorkDays = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const allDays = eachDayOfInterval({ start, end });

      // Filter only weekdays (Monday-Friday)
      const weekdays = allDays.filter((day) => !isWeekend(day));

      // Check which days don't exist yet
      const newWorkDays = [];
      for (const day of weekdays) {
        const exists = workDays.some((wd) => isSameDay(parseISO(wd.date), day));

        if (!exists) {
          const workDay = {
            user_id: user.id,
            date: format(day, "yyyy-MM-dd"),
            hours_worked: (userSettings?.default_hours || 40.0) / 5, // Convert weekly to daily
            daily_rate: userSettings?.daily_rate || 89.95,
            notes: "Auto-gegenereerd",
          };

          const created = await db.createWorkDay(workDay);
          newWorkDays.push(created);
        }
      }

      if (newWorkDays.length > 0) {
        setWorkDays((prev) => [...prev, ...newWorkDays]);
        alert(`${newWorkDays.length} werkdagen toegevoegd!`);
      } else {
        alert("Alle werkdagen zijn al toegevoegd voor deze maand.");
      }
    } catch (error) {
      console.error("Error auto-generating work days:", error);
      alert("Fout bij automatisch genereren van werkdagen");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDayClick = (date) => {
    const workDay = getWorkDayForDate(date);

    if (workDay) {
      // Edit existing workday
      setEditingDay(date);
      setEditForm({
        hours_worked:
          workDay.hours_worked || (userSettings?.default_hours || 40.0) / 5,
        daily_rate: workDay.daily_rate || userSettings?.daily_rate || 89.95,
        notes: workDay.notes || "",
        status: workDay.status || "worked",
      });
    } else if (!isWeekend(date)) {
      // Create new workday for weekday
      setEditingDay(date);
      setEditForm({
        hours_worked: (userSettings?.default_hours || 40.0) / 5, // Convert weekly to daily
        daily_rate: userSettings?.daily_rate || 89.95,
        notes: "",
        status: "worked",
      });
    }
  };

  const handleSaveWorkDay = async () => {
    if (!editingDay || !user) return;

    try {
      const workDay = getWorkDayForDate(editingDay);
      const dateString = format(editingDay, "yyyy-MM-dd");

      if (workDay) {
        // Update existing
        const updated = await db.updateWorkDay(workDay.id, {
          hours_worked: parseFloat(editForm.hours_worked),
          daily_rate: parseFloat(editForm.daily_rate),
          notes: editForm.notes,
          status: editForm.status,
        });

        setWorkDays((prev) =>
          prev.map((wd) => (wd.id === workDay.id ? updated : wd)),
        );
      } else {
        // Create new
        const newWorkDay = {
          user_id: user.id,
          date: dateString,
          hours_worked: parseFloat(editForm.hours_worked),
          daily_rate: parseFloat(editForm.daily_rate),
          notes: editForm.notes,
          status: editForm.status,
        };

        const created = await db.createWorkDay(newWorkDay);
        setWorkDays((prev) => [...prev, created]);
      }

      setEditingDay(null);
    } catch (error) {
      console.error("Error saving work day:", error);
      alert("Fout bij opslaan werkdag");
    }
  };

  const handleDeleteWorkDay = async (id) => {
    if (!confirm("Weet je zeker dat je deze werkdag wilt verwijderen?")) return;

    try {
      await db.deleteWorkDay(id);
      setWorkDays((prev) => prev.filter((wd) => wd.id !== id));
    } catch (error) {
      console.error("Error deleting work day:", error);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add empty days at start to align with Monday
    const firstDayOfWeek = getDay(start);
    const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    return {
      emptyDays: Array(emptyDays).fill(null),
      days,
    };
  };

  const getWorkDayForDate = (date) => {
    return workDays.find((wd) => {
      const wdDate = parseISO(wd.date);
      return isSameDay(wdDate, date);
    });
  };

  const calculateMonthlyStats = () => {
    const monthWorkDays = workDays.filter((wd) => {
      const wdDate = parseISO(wd.date);
      return (
        wdDate >= startOfMonth(currentMonth) &&
        wdDate <= endOfMonth(currentMonth)
      );
    });

    const totalHours = monthWorkDays.reduce(
      (sum, wd) => sum + parseFloat(wd.hours_worked || 0),
      0,
    );
    const totalEarnings = monthWorkDays.reduce((sum, wd) => {
      const hours = parseFloat(wd.hours_worked || 0);
      const rate = parseFloat(wd.daily_rate || 0);
      const dailyHours = parseFloat(userSettings?.default_hours || 40) / 5; // Convert weekly to daily
      return sum + rate * (hours / dailyHours);
    }, 0);

    return {
      daysWorked: monthWorkDays.length,
      totalHours: totalHours.toFixed(1),
      totalEarnings: totalEarnings.toFixed(2),
    };
  };

  const stats = calculateMonthlyStats();

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1),
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "vacation":
        return "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100";
      case "sick":
        return "bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-100";
      case "holiday":
        return "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100";
      case "absent":
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400";
      default:
        return "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100";
    }
  };

  const { emptyDays, days } = getDaysInMonth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Werkdagen
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Automatisch dagelijks toegevoegd • Klik op een dag om aan te passen
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoGenerateWorkDays}
            disabled={isGenerating}
            title="Voeg alle ontbrekende werkdagen van deze maand toe (ma-vr)"
            className="bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                <iconify-icon icon="lucide:calendar-plus" width="16" />
                Vul Ontbrekende Dagen
              </>
            )}
          </button>
          <button
            onClick={clearAllWorkDays}
            disabled={isGenerating}
            title="Verwijder alle werkdagen van deze maand"
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <iconify-icon icon="lucide:trash-2" width="16" />
            Wis Deze Maand
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:calendar-check"
                width="20"
                className="text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Dagen Gewerkt
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.daysWorked}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:clock"
                width="20"
                className="text-purple-600 dark:text-purple-400"
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Totale Uren
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {stats.totalHours}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
              <iconify-icon
                icon="lucide:dollar-sign"
                width="20"
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Totaal Verdiend
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                SRD {stats.totalEarnings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: nl })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <iconify-icon
                icon="lucide:chevron-left"
                width="20"
                className="text-zinc-600 dark:text-zinc-400"
              />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Vandaag
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <iconify-icon
                icon="lucide:chevron-right"
                width="20"
                className="text-zinc-600 dark:text-zinc-400"
              />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 pb-2"
            >
              {day}
            </div>
          ))}

          {/* Empty days for alignment */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const workDay = getWorkDayForDate(day);
            const isToday = isSameDay(day, new Date());
            const hasWork = !!workDay;
            const isWeekendDay = isWeekend(day);

            return (
              <button
                key={index}
                onClick={() => !isWeekendDay && handleDayClick(day)}
                disabled={isWeekendDay}
                className={`
                  aspect-square p-2 rounded-lg text-sm font-medium transition-all relative
                  ${isToday ? "ring-2 ring-zinc-900 dark:ring-white" : ""}
                  ${
                    isWeekendDay
                      ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                      : hasWork
                        ? `${getStatusColor(workDay.status)} hover:opacity-80 cursor-pointer`
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                  }
                `}
              >
                <div className="text-xs">{format(day, "d")}</div>
                {hasWork && (
                  <>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <div className="text-[10px] font-bold">
                        {workDay.hours_worked}h
                      </div>
                    </div>
                    {workDay.notes === "Automatisch toegevoegd" && (
                      <div className="absolute top-1 right-1">
                        <iconify-icon
                          icon="lucide:sparkles"
                          width="10"
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            Legenda:
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950" />
              <span className="text-zinc-600 dark:text-zinc-400">Gewerkt</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950" />
              <span className="text-zinc-600 dark:text-zinc-400">Vakantie</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-rose-100 dark:bg-rose-950" />
              <span className="text-zinc-600 dark:text-zinc-400">Ziek</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-950" />
              <span className="text-zinc-600 dark:text-zinc-400">Feestdag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
              <span className="text-zinc-600 dark:text-zinc-400">
                Niet gewerkt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {format(editingDay, "dd MMMM yyyy", { locale: nl })}
              </h3>
              <button
                onClick={() => setEditingDay(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <iconify-icon
                  icon="lucide:x"
                  width="20"
                  className="text-zinc-600 dark:text-zinc-400"
                />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "worked",
                      label: "Gewerkt",
                      icon: "lucide:briefcase",
                    },
                    {
                      value: "vacation",
                      label: "Vakantie",
                      icon: "lucide:plane",
                    },
                    {
                      value: "sick",
                      label: "Ziek",
                      icon: "lucide:thermometer",
                    },
                    {
                      value: "holiday",
                      label: "Feestdag",
                      icon: "lucide:party-popper",
                    },
                  ].map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          status: status.value,
                        }))
                      }
                      className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                        editForm.status === status.value
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                          : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <iconify-icon icon={status.icon} width="14" />
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours Worked */}
              {editForm.status === "worked" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Uren Gewerkt
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={editForm.hours_worked}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          hours_worked: e.target.value,
                        }))
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Dagtarief (SRD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.daily_rate}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          daily_rate: e.target.value,
                        }))
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  Notities (optioneel)
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows="3"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none"
                  placeholder="Bijv. projectnaam of reden"
                />
              </div>

              {/* Earnings Preview */}
              {editForm.status === "worked" && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">
                        Uurloon:
                      </span>
                      <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                        SRD{" "}
                        {(
                          parseFloat(editForm.daily_rate) /
                          ((userSettings?.default_hours || 40) / 5)
                        ).toFixed(2)}{" "}
                        /uur
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">
                        Verdiensten deze dag:
                      </span>
                      <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        SRD{" "}
                        {(
                          (parseFloat(editForm.hours_worked) /
                            ((userSettings?.default_hours || 40) / 5)) *
                          parseFloat(editForm.daily_rate)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {getWorkDayForDate(editingDay) && (
                  <button
                    onClick={() => {
                      handleDeleteWorkDay(getWorkDayForDate(editingDay).id);
                      setEditingDay(null);
                    }}
                    className="px-4 py-2 bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-100 rounded-lg text-sm font-medium hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors"
                  >
                    Verwijderen
                  </button>
                )}
                <button
                  onClick={() => setEditingDay(null)}
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveWorkDay}
                  className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            <iconify-icon
              icon={
                notification.type === "success"
                  ? "lucide:check-circle"
                  : "lucide:alert-circle"
              }
              width="20"
            />
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 hover:opacity-80"
            >
              <iconify-icon icon="lucide:x" width="16" />
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <iconify-icon
            icon="lucide:info"
            width="18"
            className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Automatische Werkdag Tracking
            </h4>
            <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
              <p>
                <strong>📅 Dagelijks automatisch toegevoegd:</strong> Elke
                werkdag wordt automatisch toegevoegd wanneer je de app opent
                (ma-vr, weekenden worden overgeslagen).
              </p>
              <p>
                <strong>✏️ Aanpasbaar:</strong> Klik op een dag om uren, tarief,
                status of notities aan te passen. Markeer dagen als Vakantie,
                Ziek, of Feestdag.
              </p>
              <p>
                <strong>🔧 Instellingen:</strong> Pas je standaard werkuren en
                tarief aan via Instellingen → Werk Configuratie.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkDays;
