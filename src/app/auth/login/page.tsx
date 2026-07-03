import LoginForm from "@/app/auth/login/LoginForm";
import { resolveSessionFromCookies } from "@/lib/server-auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your 360watts customer portal.",
};

export default async function LoginPage() {
  const session = await resolveSessionFromCookies();

  if (session.kind === "authenticated") {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
