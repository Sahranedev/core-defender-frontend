"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { LuShield, LuSwords, LuTrophy, LuLogOut, LuUser } from "react-icons/lu";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/arene", label: "Arène", icon: LuSwords },
    { href: "/leaderboard", label: "Classements", icon: LuTrophy },
    { href: "/profile", label: "Profil", icon: LuUser },
  ];

  return (
    <header className="bg-zinc-950 border-b border-zinc-800/50 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/arene" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-zinc-900 border-2 border-cyan-500/30 rounded-lg flex items-center justify-center group-hover:border-cyan-500/50 transition-all">
              <LuShield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-tight">
                Core Defender
              </h1>
              <p className="text-xs text-zinc-500 font-medium hidden sm:block">
                STRATÉGIE & DÉFENSE
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 flex items-center gap-2 uppercase tracking-wide ${
                    isActive
                      ? "bg-cyan-500 text-zinc-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 rounded-lg font-bold text-sm text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200 flex items-center gap-2 border border-zinc-800 hover:border-red-800 uppercase tracking-wide"
            >
              <LuLogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
