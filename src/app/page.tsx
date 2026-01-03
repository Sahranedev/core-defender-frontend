import Link from "next/link";
import { LuShield, LuZap, LuUsers, LuArrowRight } from "react-icons/lu";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border-2 border-cyan-500/30 rounded-xl">
            <LuShield className="w-10 h-10 text-cyan-400" />
          </div>

          {/* Title */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight">
              CORE <span className="text-cyan-400">DEFENDER</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto font-medium">
              Jeu de stratégie en temps réel multijoueur
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-zinc-500 max-w-xl mx-auto">
            Construisez votre empire, défendez votre territoire et dominez le
            classement mondial
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/login"
              className="group relative px-8 py-4 bg-cyan-500 text-zinc-950 font-bold rounded-lg hover:bg-cyan-400 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transform hover:scale-105 min-w-[220px] uppercase text-sm tracking-wide"
            >
              <span className="flex items-center justify-center gap-2">
                Se connecter
                <LuArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              href="/signup"
              className="group px-8 py-4 bg-zinc-900 border-2 border-zinc-800 text-white font-bold rounded-lg hover:border-cyan-500/50 hover:bg-zinc-800 transition-all min-w-[220px] uppercase text-sm tracking-wide"
            >
              Créer un compte
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-4 hover:border-cyan-500/30 transition-all group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-800 rounded-lg group-hover:bg-cyan-500/10 transition-all">
                <LuZap className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                Temps Réel
              </h3>
              <p className="text-zinc-500">Action instantanée avec Socket.IO</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-4 hover:border-cyan-500/30 transition-all group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-800 rounded-lg group-hover:bg-cyan-500/10 transition-all">
                <LuUsers className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                Multijoueur
              </h3>
              <p className="text-zinc-500">
                Affrontez des joueurs du monde entier
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-4 hover:border-cyan-500/30 transition-all group">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-zinc-800 rounded-lg group-hover:bg-cyan-500/10 transition-all">
                <LuShield className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                Sécurisé
              </h3>
              <p className="text-zinc-500">
                Protection de vos données garantie
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-zinc-600 text-sm pt-12 font-medium">
            © 2025 CORE DEFENDER — TOUS DROITS RÉSERVÉS
          </p>
        </div>
      </div>
    </div>
  );
}
