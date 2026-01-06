"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { callCreateSession } from "../actions/users";

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
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/auth/verify-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        await callCreateSession(
          data.token,
          data.email,
          data.userId?.toString()
        );
      } else {
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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          {isError ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isError ? "Erreur" : "Adresse e-mail vérifiée"}
        </h1>

        <p className="text-sm text-gray-600 mb-8">
          {isError
            ? "Une erreur est survenue lors de la vérification de votre adresse e-mail."
            : "Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant vous connecter."}
        </p>

        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Accéder au jeu
        </Link>
      </div>
    </div>
  );
}
