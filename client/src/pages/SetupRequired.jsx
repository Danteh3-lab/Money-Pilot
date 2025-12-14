import { useState } from "react";

const SetupRequired = () => {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl mb-4">
            <iconify-icon
              icon="lucide:settings"
              width="32"
              className="text-amber-600 dark:text-amber-400"
            />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Setup Required
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Let's get Money Pilot configured and ready to use
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-8 mb-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <iconify-icon
                icon="lucide:alert-triangle"
                width="20"
                className="text-amber-600 dark:text-amber-400 mt-0.5"
              />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Environment Variables Missing
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Your Supabase configuration is not set up yet. Follow the steps below to get started.
                </p>
              </div>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Create a Supabase Project
                </h3>
              </div>
              <div className="ml-11">
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">supabase.com</a></li>
                  <li>Click "Start your project" and sign up/log in</li>
                  <li>Create a new project (choose a name and password)</li>
                  <li>Wait ~2 minutes for setup to complete</li>
                </ol>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Run the Database Schema
                </h3>
              </div>
              <div className="ml-11">
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>In your Supabase dashboard, click "SQL Editor"</li>
                  <li>Click "New query"</li>
                  <li>Open the file <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">supabase/schema.sql</code></li>
                  <li>Copy all the SQL code and paste it into the editor</li>
                  <li>Click "Run" to create all tables</li>
                </ol>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Get Your API Keys
                </h3>
              </div>
              <div className="ml-11">
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>In Supabase, go to Settings → API</li>
                  <li>Copy your <strong>Project URL</strong></li>
                  <li>Copy your <strong>anon/public</strong> key (NOT service_role)</li>
                </ol>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Configure Environment Variables
                </h3>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Create a <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">.env</code> file in the <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">client</code> directory:
                </p>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-lg p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <pre>
VITE_SUPABASE_URL=your_project_url_here{"\n"}
VITE_SUPABASE_ANON_KEY=your_anon_key_here
                  </pre>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Replace the values with your actual Supabase credentials.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Restart the Dev Server
                </h3>
              </div>
              <div className="ml-11">
                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Stop the current server (Ctrl+C)</li>
                  <li>Run <code className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-xs">npm run dev</code> again</li>
                  <li>Refresh this page</li>
                  <li>You're all set! 🎉</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
              Need Help?
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://github.com/yourusername/money-pilot/blob/main/QUICKSTART.md"
                className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <iconify-icon icon="lucide:book-open" width="16" />
                Quick Start Guide
              </a>
              <a
                href="https://supabase.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                <iconify-icon icon="lucide:external-link" width="16" />
                Supabase Docs
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            Once configured, you'll be able to create an account and start tracking your finances.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupRequired;
