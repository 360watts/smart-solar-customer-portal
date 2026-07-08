import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unauthorized",
  description: "This account does not have access to the 360watts customer portal.",
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-border bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          Unauthorized
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          This portal is for customer accounts only. Please use the employee application for staff access.
        </p>
      </div>
    </div>
  );
}
