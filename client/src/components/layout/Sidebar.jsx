import { Link, useLocation } from "react-router-dom";
import useStore from "../../store/useStore";

const Sidebar = () => {
  const location = useLocation();
  const { user, closeSidebar } = useStore();

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
    <aside className="hidden lg:flex w-64 flex-col border-r border-military-200 dark:border-military-800 bg-military-100 dark:bg-military-900 h-full fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-military-200 dark:border-military-800 bg-gold-gradient">
        <div className="font-semibold tracking-tighter text-lg text-military-950 dark:text-white">
          SALARIS.
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-8 overflow-y-auto flex-1">
        {navItems.map((section) => (
          <div key={section.section} className="space-y-1">
            <p className="px-2 text-xs font-medium text-military-600 dark:text-military-400 mb-2 uppercase tracking-wider">
              {section.section}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-gold-500 dark:bg-gold-600 text-military-950 dark:text-white shadow-md"
                    : "text-military-700 dark:text-military-300 hover:text-military-900 dark:hover:text-white hover:bg-military-200 dark:hover:bg-military-800/50"
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
      <div className="p-4 border-t border-military-200 dark:border-military-800 bg-military-200 dark:bg-military-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-gradient text-military-950 flex items-center justify-center text-xs font-medium tracking-tight shadow-lg">
            {user?.email ? user.email.substring(0, 2).toUpperCase() : "JD"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-military-900 dark:text-white truncate">
              {user?.user_metadata?.full_name || "User"}
            </p>
            <p className="text-xs text-military-600 dark:text-military-400 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
