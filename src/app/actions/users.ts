"use server";

import { User } from "../types/User";
import { createSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

export async function getUsers() {
  const users = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
  return users.json();
}

export async function createUser(user: User) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
    method: "POST",
    body: JSON.stringify(user),
  });
  return response.json();
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
