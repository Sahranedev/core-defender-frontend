"use client";

import { signup } from "@/app/actions/users";
import { useActionState } from "react";
import { LuUser, LuMail, LuLock, LuCircleX } from "react-icons/lu";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="space-y-5">
      {/* lastname Field */}
      <div className="space-y-2">
        <label
          htmlFor="lastname"
          className="block text-sm font-bold text-zinc-300 uppercase tracking-wide"
        >
          Nom
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LuUser className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            id="lastname"
            name="lastname"
            type="text"
            placeholder="Votre nom"
            required
            className="block w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-white placeholder-zinc-500"
          />
        </div>
        {state?.errors?.lastname && (
          <div className="space-y-1">
            {state.errors.lastname.map((error) => (
              <p
                key={error}
                className="text-sm text-red-400 flex items-center gap-1"
              >
                <LuCircleX className="w-4 h-4" />
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="firstname"
          className="block text-sm font-bold text-zinc-300 uppercase tracking-wide"
        >
          Prénom
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LuUser className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            id="firstname"
            name="firstname"
            type="text"
            placeholder="Votre prénom"
            required
            className="block w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none text-white placeholder-zinc-500"
          />
        </div>
        {state?.errors?.firstname && (
          <div className="space-y-1">
            {state.errors.firstname.map((error) => (
              <p
                key={error}
                className="text-sm text-red-400 flex items-center gap-1"
              >
                <LuCircleX className="w-4 h-4" />
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

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
        {state?.errors?.email && (
          <div className="space-y-1">
            {state.errors.email.map((error) => (
              <p
                key={error}
                className="text-sm text-red-400 flex items-center gap-1"
              >
                <LuCircleX className="w-4 h-4" />
                {error}
              </p>
            ))}
          </div>
        )}
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
        {state?.errors?.password && (
          <div className="bg-amber-950/50 border border-amber-800 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-amber-400">
              Le mot de passe doit :
            </p>
            <ul className="space-y-1">
              {state.errors.password.map((error) => (
                <li
                  key={error}
                  className="text-sm text-amber-400/80 flex items-start gap-2"
                >
                  <LuCircleX className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Global Error Message */}
      {state?.message && (
        <div className="bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-lg flex items-start gap-2">
          <LuCircleX className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{state.message}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        disabled={pending}
        type="submit"
        className="w-full bg-cyan-500 text-zinc-950 font-bold py-3 px-4 rounded-lg hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-wide"
      >
        {pending ? "Création en cours..." : "Créer mon compte"}
      </button>
    </form>
  );
}
