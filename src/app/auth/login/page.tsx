import LoginForm from "@/app/auth/login/LoginForm";
import { resolveSessionFromCookies } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await resolveSessionFromCookies();

  if (session.kind === "authenticated") {
    redirect("/");
  }

  return <LoginForm />;
}
