"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { verifyEmailAction } from "../actions/users";
import { LuCircleCheck, LuCircleX, LuLoader } from "react-icons/lu";

type Props = { token: string | null };

export default function VerifyEmail({ token }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleVerifyEmail = useCallback(async () => {
    if (!token) {
      setIsError(true);
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyEmailAction(token);
      if (!result.success) {
        setIsError(true);
      }
    } catch (e) {
      console.error(e);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    handleVerifyEmail();
  }, [handleVerifyEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="relative">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-800 border-2 border-cyan-500/30 rounded-xl">
              <LuLoader className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                Vérification en cours
              </h2>
              <p className="text-zinc-500 text-sm">
                Veuillez patienter pendant que nous validons votre adresse
                e-mail
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-8">
          {/* Icon */}
          <div className="text-center">
            {isError ? (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-950/50 border-2 border-red-500/30 rounded-xl mb-4">
                <LuCircleX className="w-10 h-10 text-red-400" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-950/50 border-2 border-green-500/30 rounded-xl mb-4">
                <LuCircleCheck className="w-10 h-10 text-green-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">
              {isError ? "Erreur de vérification" : "Email vérifié"}
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {isError
                ? "Une erreur est survenue lors de la vérification de votre adresse e-mail. Le lien a peut-être expiré ou est invalide."
                : "Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant accéder à votre espace de commandement."}
            </p>
          </div>

          {/* Action button */}
          <div className="pt-4">
            {isError ? (
              <Link
                href="/login"
                className="block w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-wide rounded-lg transition-all duration-200 border-2 border-zinc-700 hover:border-cyan-500/50 text-center"
              >
                Retour à la connexion
              </Link>
            ) : (
              <Link
                href="/arene"
                className="block w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold uppercase tracking-wide rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 text-center"
              >
                Accéder au jeu
              </Link>
            )}
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-zinc-600 text-sm mt-6 font-medium">
          © 2025 CORE DEFENDER — TOUS DROITS RÉSERVÉS
        </p>
      </div>
    </div>
  );
}
