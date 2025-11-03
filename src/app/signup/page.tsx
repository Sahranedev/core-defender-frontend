import SignupForm from "@/app/ui/signup-form";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Créer un compte
            </h1>
            <p className="text-gray-600">
              Rejoignez-nous et commencez l&apos;aventure
            </p>
          </div>

          {/* Form */}
          <SignupForm />

          {/* Footer */}
          <div className="pt-4 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <p className="text-center text-white/80 text-sm mt-6">
          © 2025 King Builders. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
