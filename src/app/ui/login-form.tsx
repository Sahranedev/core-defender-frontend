"use client";

import { loginAction } from "../actions/users";
import { useActionState } from "react";
import { LuMail, LuLock } from "react-icons/lu";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}
      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-bold text-zinc-300 uppercase tracking-wide"
        >
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LuMail className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="votre.email@exemple.com"
            required
            className="block w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-zinc-300 uppercase tracking-wide"
        >
          Mot de passe
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LuLock className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="block w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-white placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-cyan-500 text-zinc-950 font-bold py-3 px-4 rounded-lg hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-wide"
      >
        {isPending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
