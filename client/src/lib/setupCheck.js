import { supabase } from "./supabase";

/**
 * Setup Check Utility
 * Verifies that the database is properly configured and ready to use
 */

export const setupCheck = {
  /**
   * Check if Supabase is configured
   */
  isSupabaseConfigured() {
    return supabase !== null;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    if (!supabase) return false;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  },

  /**
   * Check if the transactions table exists and is accessible
   */
  async checkTransactionsTable() {
    if (!supabase) {
      return { exists: false, error: "Supabase not configured" };
    }

    try {
      const { data: _data, error } = await supabase
        .from("transactions")
        .select("id")
        .limit(1);

      if (error) {
        return {
          exists: false,
          error: error.message,
          hint: "Run the schema.sql script in your Supabase SQL Editor",
        };
      }

      return { exists: true, accessible: true };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  },

  /**
   * Check if the work_days table exists and is accessible
   */
  async checkWorkDaysTable() {
    if (!supabase) {
      return { exists: false, error: "Supabase not configured" };
    }

    try {
      const { data: _data, error } = await supabase
        .from("work_days")
        .select("id")
        .limit(1);

      if (error) {
        return {
          exists: false,
          error: error.message,
          hint: "Run the schema.sql script in your Supabase SQL Editor",
        };
      }

      return { exists: true, accessible: true };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  },

  /**
   * Check if the categories table exists and is accessible
   */
  async checkCategoriesTable() {
    if (!supabase) {
      return { exists: false, error: "Supabase not configured" };
    }

    try {
      const { data: _data, error } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (error) {
        return {
          exists: false,
          error: error.message,
          hint: "Run the schema.sql script in your Supabase SQL Editor",
        };
      }

      return { exists: true, accessible: true };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  },

  /**
   * Check if the user_settings table exists and is accessible
   */
  async checkUserSettingsTable() {
    if (!supabase) {
      return { exists: false, error: "Supabase not configured" };
    }

    try {
      const { data: _data, error } = await supabase
        .from("user_settings")
        .select("id")
        .limit(1);

      if (error) {
        return {
          exists: false,
          error: error.message,
          hint: "Run the schema.sql script in your Supabase SQL Editor",
        };
      }

      return { exists: true, accessible: true };
    } catch (error) {
      return {
        exists: false,
        error: error.message,
      };
    }
  },

  /**
   * Run all checks and return a comprehensive report
   */
  async runAllChecks() {
    const report = {
      timestamp: new Date().toISOString(),
      supabaseConfigured: this.isSupabaseConfigured(),
      authenticated: false,
      tables: {},
    };

    // Check authentication
    if (report.supabaseConfigured) {
      report.authenticated = await this.isAuthenticated();
    }

    // Check all tables
    report.tables.transactions = await this.checkTransactionsTable();
    report.tables.work_days = await this.checkWorkDaysTable();
    report.tables.categories = await this.checkCategoriesTable();
    report.tables.user_settings = await this.checkUserSettingsTable();

    // Determine overall status
    report.allTablesExist = Object.values(report.tables).every((t) => t.exists);
    report.ready = report.supabaseConfigured && report.allTablesExist;

    return report;
  },

  /**
   * Print a formatted setup report to console
   */
  async printSetupReport() {
    const report = await this.runAllChecks();

    console.group("🔍 Money Pilot Setup Check");
    console.log("Timestamp:", report.timestamp);
    console.log(
      "Supabase Configured:",
      report.supabaseConfigured ? "✅" : "❌",
    );
    console.log("User Authenticated:", report.authenticated ? "✅" : "❌");

    console.group("📊 Database Tables");
    for (const [table, status] of Object.entries(report.tables)) {
      if (status.exists) {
        console.log(`${table}: ✅`);
      } else {
        console.log(`${table}: ❌`);
        console.log(`  Error: ${status.error}`);
        if (status.hint) {
          console.log(`  Hint: ${status.hint}`);
        }
      }
    }
    console.groupEnd();

    console.log(
      "\nOverall Status:",
      report.ready ? "✅ READY" : "❌ NOT READY",
    );

    if (!report.ready) {
      console.log("\n🛠️ Next Steps:");
      if (!report.supabaseConfigured) {
        console.log("1. Create a .env file with your Supabase credentials");
        console.log("   VITE_SUPABASE_URL=your-url");
        console.log("   VITE_SUPABASE_ANON_KEY=your-key");
      }
      if (!report.allTablesExist) {
        console.log("2. Run the schema.sql script in Supabase SQL Editor");
        console.log("   Location: Money-Pilot/supabase/schema.sql");
      }
      if (!report.authenticated) {
        console.log("3. Sign up or log in to create your account");
      }
    }

    console.groupEnd();

    return report;
  },

  /**
   * Get a user-friendly error message for common issues
   */
  getUserFriendlyError(error) {
    const errorString = error?.message || error?.toString() || "";

    if (
      errorString.includes("relation") &&
      errorString.includes("does not exist")
    ) {
      return {
        title: "Database niet geconfigureerd",
        message:
          "De database tabellen zijn nog niet aangemaakt. Voer het schema.sql script uit in je Supabase SQL Editor.",
        action: "Ga naar Supabase → SQL Editor → Run schema.sql",
      };
    }

    if (errorString.includes("JWT") || errorString.includes("expired")) {
      return {
        title: "Sessie verlopen",
        message: "Je sessie is verlopen. Log opnieuw in.",
        action: "Klik op uitloggen en log opnieuw in",
      };
    }

    if (errorString.includes("not configured")) {
      return {
        title: "Supabase niet geconfigureerd",
        message: "Je .env file ontbreekt of is niet correct ingesteld.",
        action: "Check je .env file met de Supabase credentials",
      };
    }

    if (errorString.includes("violates row-level security")) {
      return {
        title: "Toegang geweigerd",
        message:
          "Je hebt geen toegang tot deze data. Dit kan een RLS policy probleem zijn.",
        action: "Check of de RLS policies correct zijn ingesteld in Supabase",
      };
    }

    if (errorString.includes("duplicate key")) {
      return {
        title: "Duplicaat gevonden",
        message: "Deze data bestaat al in de database.",
        action: "Gebruik een andere waarde of update de bestaande record",
      };
    }

    if (errorString.includes("violates foreign key")) {
      return {
        title: "Referentie fout",
        message: "De data verwijst naar een niet-bestaande record.",
        action: "Check of alle gerelateerde data bestaat",
      };
    }

    if (errorString.includes("violates check constraint")) {
      return {
        title: "Validatie fout",
        message: "De data voldoet niet aan de database validatie regels.",
        action: "Check je invoer en probeer opnieuw",
      };
    }

    // Default error
    return {
      title: "Onbekende fout",
      message: errorString || "Er is een onbekende fout opgetreden.",
      action: "Check de browser console voor meer details",
    };
  },
};

// Export individual functions for convenience
export const {
  isSupabaseConfigured,
  isAuthenticated,
  checkTransactionsTable,
  checkWorkDaysTable,
  checkCategoriesTable,
  checkUserSettingsTable,
  runAllChecks,
  printSetupReport,
  getUserFriendlyError,
} = setupCheck;

// Auto-run setup check in development mode
if (import.meta.env.DEV) {
  // Run check after a short delay to let everything initialize
  setTimeout(() => {
    setupCheck.printSetupReport();
  }, 2000);
}

export default setupCheck;
