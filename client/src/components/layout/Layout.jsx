import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import useStore from "../../store/useStore";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Header from "./Header";

const Layout = () => {
  const { isDarkMode } = useStore();

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="bg-military-50 dark:bg-military-950 text-military-900 dark:text-military-50 h-screen flex overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col h-full overflow-hidden mt-14 lg:mt-0">
        {/* Header */}
        <Header />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-military-50/50 dark:bg-military-950/50">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
