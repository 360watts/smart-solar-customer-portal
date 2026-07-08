"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequestError } from "@/lib/auth";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [employeeAppUrl, setEmployeeAppUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEmployeeAppUrl(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof AuthRequestError && err.employeeAppUrl) {
        setEmployeeAppUrl(err.employeeAppUrl);
      }
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] as const },
    }),
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      {/* Ambient atmosphere — restrained, off-axis glow mesh rather than a flat backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(circle, #2FBF71 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-48 -right-24 w-[480px] h-[480px] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #E9B949 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md"
      >
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          className="flex items-center justify-center gap-3 mb-10"
        >
          <div className="relative w-12 h-12 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ background: "radial-gradient(circle, rgba(47,191,113,0.3) 0%, rgba(47,191,113,0) 72%)" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <Image
              src="/final-logo-png-4x-2.png"
              alt="360watts"
              width={38}
              height={28}
              priority
              className="relative h-8 w-auto object-contain logo-glow"
            />
          </div>
          <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            360watts
          </span>
        </motion.div>

        <div className="glass-green rounded-2xl p-8">
          <motion.div custom={0.08} initial="hidden" animate="visible" variants={fieldVariants}>
            <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Welcome back
            </h1>
            <p className="text-muted-foreground text-base mb-8">
              Sign in to your solar dashboard
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div custom={0.16} initial="hidden" animate="visible" variants={fieldVariants}>
              <label className="block text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                Email
              </label>
              <div className="group relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-white/4 border border-border rounded-lg pl-9 pr-4 py-3 text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </motion.div>

            <motion.div custom={0.22} initial="hidden" animate="visible" variants={fieldVariants}>
              <label className="block text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="group relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/4 border border-border rounded-lg pl-9 pr-4 py-3 text-foreground placeholder:text-muted-foreground text-base focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.25 }}
                className="text-base bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 overflow-hidden"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
                {employeeAppUrl && (
                  <a
                    href={employeeAppUrl}
                    className="inline-flex items-center gap-1.5 mt-2 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    Go to the staff app
                    <ExternalLink size={11} />
                  </a>
                )}
              </motion.div>
            )}

            <motion.button
              custom={0.28}
              initial="hidden"
              animate="visible"
              variants={fieldVariants}
              type="submit"
              disabled={loading}
              whileHover={loading ? undefined : { scale: 1.01 }}
              whileTap={loading ? undefined : { scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <motion.p
            custom={0.34}
            initial="hidden"
            animate="visible"
            variants={fieldVariants}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            Need help?{" "}
            <a href="mailto:hello@360watts.com" className="text-primary hover:underline">
              Contact support
            </a>
          </motion.p>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 360watts Energy Pvt Ltd
        </p>
      </motion.div>
    </div>
  );
}
