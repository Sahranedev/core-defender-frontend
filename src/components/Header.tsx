"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "🎮" },
    { href: "/leaderboard", label: "Classements", icon: "🏆" },
  ];

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Core Defender</h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Stratégie & Défense
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-red-600/20 transition-all duration-200 flex items-center gap-2 border border-slate-700 hover:border-red-500/50"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
