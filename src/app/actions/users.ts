"use server";

import { User } from "../types/User";
import { createSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export async function getUsers() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { success: false, error: "Erreur lors de la récupération des utilisateurs", data: [] };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get users error:", error);
    return { success: false, error: "Une erreur est survenue", data: [] };
  }
}

export async function createUser(user: User) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (!response.ok) {
      return { success: false, error: "Erreur lors de la création de l'utilisateur" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function loginAction(
  prevState: { success: boolean; error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Identifiants incorrects",
      };
    }

    const data = await response.json();

    if (!data.token) {
      return {
        success: false,
        error: "Token non reçu",
      };
    }

    await createSession(data.token, email, data.userId?.toString());
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la connexion",
    };
  }

  redirect("/dashboard");
}

export async function signup(
  prevState:
    | { errors?: Record<string, string[]>; message?: string }
    | undefined,
  formData: FormData
) {
  const lastname = formData.get("lastname") as string;
  const firstname = formData.get("firstname") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation basique
  const errors: Record<string, string[]> = {};

  if (!lastname || lastname.trim().length < 2) {
    errors.lastname = ["Le nom doit contenir au moins 2 caractères"];
  }

  if (!firstname || firstname.trim().length < 2) {
    errors.firstname = ["Le prénom doit contenir au moins 2 caractères"];
  }

  if (!email || !email.includes("@")) {
    errors.email = ["Veuillez entrer une adresse email valide"];
  }

  if (!password || password.length < 8) {
    errors.password = ["Le mot de passe doit contenir au moins 8 caractères"];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/auth/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lastname: lastname.trim(),
          firstname: firstname.trim(),
          email: email.trim(),
          password,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        message:
          errorData.message || "Une erreur est survenue lors de l'inscription",
      };
    }

    const data = await response.json();

    // Connexion automatique après inscription
    if (data.newUser) {
      const loginResponse = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        }
      );

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.token) {
          await createSession(
            loginData.token,
            email,
            loginData.userId?.toString()
          );
        }
      }
    }
  } catch (error) {
    console.error("Signup error:", error);
    return {
      message: "Une erreur est survenue lors de l'inscription",
    };
  }

  redirect("/dashboard");
}
