import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a dummy client if env vars are missing (for development)
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "⚠️ Missing Supabase environment variables. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
    // Return a mock client that won't break the app
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};

export const supabase = createSupabaseClient();

// Database helper functions
export const db = {
  // Transactions
  async getTransactions(userId, { startDate, endDate } = {}) {
    if (!supabase) throw new Error("Supabase not configured");

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction) {
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error } = await supabase
      .from("transactions")
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(id, updates) {
    const { data, error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) throw error;
  },

  async deleteTransactions(ids) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids);

    if (error) throw error;
  },

  // Categories
  async getCategories(userId) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name");

    if (error) throw error;
    return data;
  },

  async createCategory(category) {
    const { data, error } = await supabase
      .from("categories")
      .insert([category])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Work Days
  async getWorkDays(userId, { startDate, endDate } = {}) {
    let query = supabase
      .from("work_days")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createWorkDay(workDay) {
    const { data, error } = await supabase
      .from("work_days")
      .insert([workDay])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkDay(id, updates) {
    const { data, error } = await supabase
      .from("work_days")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkDay(id) {
    const { error } = await supabase.from("work_days").delete().eq("id", id);

    if (error) throw error;
  },

  // User Settings
  async getUserSettings(userId) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async updateUserSettings(userId, settings) {
    const { data, error } = await supabase
      .from("user_settings")
      // IMPORTANT: specify conflict target so PostgREST can upsert on user_id
      .upsert({ user_id: userId, ...settings }, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Auth helper functions
export const auth = {
  async signUp(email, password, metadata = {}) {
    if (!supabase)
      throw new Error("Supabase not configured. Please set up your .env file.");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    if (!supabase)
      throw new Error("Supabase not configured. Please set up your .env file.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    if (!supabase) return null;

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    if (!supabase) {
      // Return a dummy subscription
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};
