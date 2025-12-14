import { Link, useLocation } from "react-router-dom";
import useStore from "../../store/useStore";

const MobileNav = () => {
  const location = useLocation();
  const { isSidebarOpen, closeSidebar, toggleSidebar, user } = useStore();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      section: "Overzicht",
      items: [
        {
          name: "Dashboard",
          icon: "lucide:layout-dashboard",
          path: "/",
        },
        {
          name: "Transacties",
          icon: "lucide:wallet",
          path: "/transactions",
        },
        {
          name: "Analytics",
          icon: "lucide:bar-chart-3",
          path: "/analytics",
        },
        {
          name: "Periodes",
          icon: "lucide:calendar-clock",
          path: "/periods",
        },
        {
          name: "Werkdagen",
          icon: "lucide:briefcase",
          path: "/workdays",
        },
      ],
    },
    {
      section: "Beheer",
      items: [
        {
          name: "Categorieën",
          icon: "lucide:tags",
          path: "/categories",
        },
        {
          name: "Instellingen",
          icon: "lucide:settings-2",
          path: "/settings",
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-4 py-3">
        <div className="font-semibold tracking-tighter text-lg text-zinc-900 dark:text-white">
          SALARIS.
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
          <iconify-icon
            icon="lucide:menu"
            width="24"
            style={{ strokeWidth: "1.5" }}
          />
        </button>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo and Close Button */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="font-semibold tracking-tighter text-lg text-zinc-900 dark:text-white">
            SALARIS.
          </div>
          <button
            onClick={closeSidebar}
            className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <iconify-icon
              icon="lucide:x"
              width="20"
              style={{ strokeWidth: "1.5" }}
            />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-8 overflow-y-auto flex-1">
          {navItems.map((section) => (
            <div key={section.section} className="space-y-1">
              <p className="px-2 text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-2 uppercase tracking-wider">
                {section.section}
              </p>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <iconify-icon
                    icon={item.icon}
                    width="16"
                    style={{ strokeWidth: "1.5" }}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-xs font-medium tracking-tight">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : "JD"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {user?.email || "user@example.com"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileNav;
