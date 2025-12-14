import { useCallback, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { auth, supabase } from "./lib/supabase";
import useStore from "./store/useStore";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import SetupRequired from "./pages/SetupRequired";
import WorkDays from "./pages/WorkDays";
import Settings from "./pages/Settings";

// Placeholder component for unimplemented pages
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center animate-fade-in">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <iconify-icon
          icon="lucide:construction"
          width="32"
          className="text-zinc-400 dark:text-zinc-600"
        />
      </div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Deze pagina is nog in ontwikkeling
      </p>
    </div>
  </div>
);

function App() {
  const { user, setUser, clearUser, setLoading } = useStore();

  // Check if Supabase is configured (must NOT cause conditional hook calls)
  const isSupabaseConfigured = useMemo(() => supabase !== null, []);

  const checkUser = useCallback(async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        clearUser();
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  }, [setUser, clearUser, setLoading]);

  useEffect(() => {
    // If Supabase isn't configured, don't attempt auth/session work.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check for existing session on app start / refresh
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        clearUser();
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [isSupabaseConfigured, checkUser, setLoading, setUser, clearUser]);

  // Render setup page if not configured (AFTER hooks run)
  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <Auth />}
        />

        {/* Protected Routes */}
        <Route element={user ? <Layout /> : <Navigate to="/auth" replace />}>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/transactions"
            element={<ComingSoon title="Transacties" />}
          />
          <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
          <Route path="/periods" element={<ComingSoon title="Periodes" />} />
          <Route path="/workdays" element={<WorkDays />} />
          <Route
            path="/categories"
            element={<ComingSoon title="Categorieën" />}
          />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
