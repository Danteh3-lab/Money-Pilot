import { useState, useEffect } from "react";
import { setupCheck } from "../../lib/setupCheck";

const DatabaseSetupGuide = ({ onClose, onRetry }) => {
  const [report, setReport] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkSetup = async () => {
    setIsChecking(true);
    const result = await setupCheck.runAllChecks();
    setReport(result);
    setIsChecking(false);
  };

  useEffect(() => {
    checkSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _copySchemaToClipboard = () => {
    const schemaUrl = `https://supabase.com/dashboard/project/scocvdumlbslqzduvelr/sql/new`;
    navigator.clipboard.writeText(schemaUrl);
    // Future: add UI feedback for copy success
  };

  const handleRetry = async () => {
    await checkSetup();
    if (report?.ready && onRetry) {
      onRetry();
    }
  };

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Database setup controleren...
          </p>
        </div>
      </div>
    );
  }

  if (report?.ready) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <iconify-icon
              icon="lucide:check-circle"
              width="32"
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
            Database is Klaar!
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Je database is correct ingesteld en klaar voor gebruik.
          </p>
          <button
            onClick={onClose || (() => window.location.reload())}
            className="w-full px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Doorgaan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
              Database Setup Vereist
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Volg deze stappen om je database in te stellen
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <iconify-icon
                icon="lucide:x"
                width="20"
                className="text-zinc-600 dark:text-zinc-400"
              />
            </button>
          )}
        </div>

        {/* Status Overview */}
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
            Status Overzicht
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Supabase Geconfigureerd
              </span>
              <span>
                {report?.supabaseConfigured ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">❌</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Ingelogd</span>
              <span>
                {report?.authenticated ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Transactions Tabel
              </span>
              <span>
                {report?.tables?.transactions?.exists ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">❌</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Work Days Tabel
              </span>
              <span>
                {report?.tables?.work_days?.exists ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">❌</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Categories Tabel
              </span>
              <span>
                {report?.tables?.categories?.exists ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">❌</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="space-y-4 mb-6">
          {/* Step 1: Supabase Project */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  1
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Open Supabase SQL Editor
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Ga naar je Supabase project en open de SQL Editor
                </p>
                <a
                  href="https://supabase.com/dashboard/project/scocvdumlbslqzduvelr/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <iconify-icon icon="lucide:external-link" width="14" />
                  Open SQL Editor
                </a>
              </div>
            </div>
          </div>

          {/* Step 2: Copy Schema */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  2
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Kopieer Schema Script
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Open het bestand{" "}
                  <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-xs">
                    Money-Pilot/supabase/schema.sql
                  </code>{" "}
                  en kopieer de inhoud
                </p>
                <div className="bg-zinc-800 dark:bg-zinc-950 rounded-md p-3 text-xs font-mono text-zinc-300 mb-2 overflow-x-auto">
                  <div className="text-zinc-500 mb-1">
                    -- Enable UUID extension
                  </div>
                  <div>CREATE EXTENSION IF NOT EXISTS "uuid-ossp";</div>
                  <div className="text-zinc-500 mt-2">-- Create tables...</div>
                  <div className="text-zinc-600">...</div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-600">
                  💡 Tip: Het bestand bevindt zich in je project folder
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Run Script */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  3
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Voer Script Uit
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Plak het script in de SQL Editor en klik op "Run" (of druk
                  Ctrl+Enter)
                </p>
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2">
                  <iconify-icon
                    icon="lucide:info"
                    width="16"
                    className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Dit maakt alle benodigde tabellen, indexen, en security
                    policies aan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Verify */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gold-100 dark:bg-gold-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-gold-600 dark:text-gold-400">
                  4
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">
                  Controleer Setup
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Klik op "Setup Controleren" om te verifiëren dat alles correct
                  is ingesteld
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Details */}
        {report && !report.ready && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <iconify-icon
                icon="lucide:alert-circle"
                width="18"
                className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5"
              />
              <div>
                <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200 mb-1">
                  Setup Niet Compleet
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  {!report.supabaseConfigured &&
                    "Supabase is niet geconfigureerd. "}
                  {!report.allTablesExist && "Database tabellen ontbreken. "}
                  {!report.authenticated && "Je bent niet ingelogd. "}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isChecking ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
                Controleren...
              </>
            ) : (
              <>
                <iconify-icon icon="lucide:refresh-cw" width="16" />
                Setup Controleren
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Sluiten
            </button>
          )}
        </div>

        {/* Help Link */}
        <div className="mt-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-600">
            Hulp nodig? Bekijk de{" "}
            <a
              href="https://github.com/yourusername/money-pilot#setup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              setup documentatie
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetupGuide;
