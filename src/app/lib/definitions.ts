import { z } from "zod";

export interface SessionPayload {
  userId: string;
  email: string;
  // Ajoutez d'autres propriétés selon vos besoins
  expiresAt?: Date;
}

export const SignupFormSchema = z.object({
  lastname: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .trim(),
  firstname: z
    .string()
    .min(2, { message: "Firstname must be at least 2 characters long." })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
    .regex(/[0-9]/, { message: "Contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Contain at least one special character.",
    })
    .trim(),
});

export const LoginFormSchema = z.object({
  email: z
    .string()
    .email({ message: "Veuillez entrer un email valide." })
    .trim(),
  password: z
    .string()
    .min(1, { message: "Le mot de passe est requis." })
    .trim(),
});

export type FormState =
  | {
      errors?: {
        lastname?: string[];
        firstname?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
