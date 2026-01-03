import SignupForm from "@/app/ui/signup-form";
import Link from "next/link";
import { LuUserPlus, LuArrowRight } from "react-icons/lu";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-800 border-2 border-cyan-500/30 rounded-lg">
                <LuUserPlus className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                  Créer un compte
                </h1>
                <p className="text-zinc-500">
                  Rejoignez la bataille et bâtissez votre empire
                </p>
              </div>
            </div>

            {/* Form */}
            <SignupForm />

            {/* Footer */}
            <div className="pt-4 text-center border-t border-zinc-800">
              <p className="text-zinc-500">
                Déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                >
                  Se connecter
                  <LuArrowRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom text */}
          <p className="text-center text-zinc-600 text-sm mt-6 font-medium">
            © 2025 CORE DEFENDER — TOUS DROITS RÉSERVÉS
          </p>
        </div>
      </div>
    </div>
  );
}
