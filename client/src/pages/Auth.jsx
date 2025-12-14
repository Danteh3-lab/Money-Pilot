import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/supabase";
import useStore from "../store/useStore";

const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Vul alle velden in");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens bevatten");
      return false;
    }

    if (!isLogin && !formData.fullName) {
      setError("Vul je naam in");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { user } = await auth.signIn(formData.email, formData.password);
        setUser(user);
        navigate("/");
      } else {
        const { user } = await auth.signUp(formData.email, formData.password, {
          full_name: formData.fullName,
        });
        setUser(user);
        navigate("/");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        err.message || "Er is een fout opgetreden. Probeer het opnieuw.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-military-50 dark:bg-military-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tighter text-military-900 dark:text-white mb-2">
            SALARIS.
          </h1>
          <p className="text-sm text-military-600 dark:text-military-400">
            Beheer je financiën met gemak
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-military-100 dark:bg-military-900 rounded-2xl border border-military-300 dark:border-military-700 shadow-lg p-8 animate-fade-in">
          <div className="flex gap-2 mb-6 bg-military-200 dark:bg-military-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin
                  ? "bg-gold-gradient text-military-950 dark:text-white shadow-md font-semibold"
                  : "text-military-600 dark:text-military-400"
              }`}
            >
              Inloggen
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin
                  ? "bg-gold-gradient text-military-950 dark:text-white shadow-md font-semibold"
                  : "text-military-600 dark:text-military-400"
              }`}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-military-800 dark:text-military-200 mb-1.5">
                  Volledige naam
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jan Doe"
                  className="w-full px-4 py-2.5 bg-military-50 dark:bg-military-800 border border-military-300 dark:border-military-700 rounded-lg text-military-900 dark:text-white placeholder:text-military-500 dark:placeholder:text-military-500 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-military-800 dark:text-military-200 mb-1.5">
                E-mailadres
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jan@example.com"
                className="w-full px-4 py-2.5 bg-military-50 dark:bg-military-800 border border-military-300 dark:border-military-700 rounded-lg text-military-900 dark:text-white placeholder:text-military-500 dark:placeholder:text-military-500 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-military-800 dark:text-military-200 mb-1.5">
                Wachtwoord
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-military-50 dark:bg-military-800 border border-military-300 dark:border-military-700 rounded-lg text-military-900 dark:text-white placeholder:text-military-500 dark:placeholder:text-military-500 focus:outline-none focus:ring-2 focus:ring-gold-500 dark:focus:ring-gold-400 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold-gradient text-military-950 font-semibold py-3 rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-military-950 border-t-transparent rounded-full animate-spin" />
                  Bezig...
                </>
              ) : (
                <>{isLogin ? "Inloggen" : "Account aanmaken"}</>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-military-600 dark:text-military-400 hover:text-military-900 dark:hover:text-white transition-colors"
              >
                Wachtwoord vergeten?
              </button>
            </div>
          )}
        </div>

        {/* Demo credentials hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-military-600 dark:text-military-400">
            Demo versie - Maak een account aan om te beginnen
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
