"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Mail, Phone, User as UserIcon } from "lucide-react";
import { portalApi } from "@/lib/api";

const inputClass =
  "w-full bg-foreground/5 border border-border rounded-lg px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground";

type Section = "name" | "email" | "phone";

function errMsg(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data
      ?.error ??
    (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data
      ?.detail ??
    fallback
  );
}

/**
 * Editable-profile modal. Name saves directly via updateProfile(); email and
 * phone are security-sensitive so they go through a two-step OTP flow
 * (email OTP via Brevo, phone OTP via WhatsApp) before being applied.
 */
export default function EditProfileModal({
  initialFirst,
  initialLast,
  currentEmail,
  currentPhone,
  onClose,
  onSaved,
}: {
  initialFirst: string;
  initialLast: string;
  currentEmail: string;
  currentPhone: string;
  onClose: () => void;
  onSaved: (updates: { first_name?: string; last_name?: string; email?: string; phone?: string }) => void;
}) {
  const [section, setSection] = useState<Section>("name");

  // Name
  const [first, setFirst] = useState(initialFirst);
  const [last, setLast] = useState(initialLast);
  const [nameState, setNameState] = useState<"idle" | "saving" | "error">("idle");
  const [nameError, setNameError] = useState("");

  // Email — two steps
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<"enter" | "verify">("enter");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "verifying" | "error">("idle");
  const [emailError, setEmailError] = useState("");

  // Phone — two steps
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"enter" | "verify">("enter");
  const [phoneState, setPhoneState] = useState<"idle" | "sending" | "verifying" | "error">("idle");
  const [phoneError, setPhoneError] = useState("");

  async function saveName() {
    setNameState("saving");
    setNameError("");
    try {
      await portalApi.updateProfile({ first_name: first, last_name: last });
      onSaved({ first_name: first, last_name: last });
      setNameState("idle");
    } catch (err) {
      setNameError(errMsg(err, "Failed to update name."));
      setNameState("error");
    }
  }

  async function requestEmailOtp() {
    setEmailState("sending");
    setEmailError("");
    try {
      await portalApi.requestEmailChangeOtp(newEmail);
      setEmailStep("verify");
      setEmailState("idle");
    } catch (err) {
      setEmailError(errMsg(err, "Failed to send verification code."));
      setEmailState("error");
    }
  }

  async function confirmEmailOtp() {
    setEmailState("verifying");
    setEmailError("");
    try {
      await portalApi.confirmEmailChangeOtp(newEmail, emailOtp);
      onSaved({ email: newEmail });
      setEmailStep("enter");
      setNewEmail("");
      setEmailOtp("");
      setEmailState("idle");
    } catch (err) {
      setEmailError(errMsg(err, "Invalid or expired code."));
      setEmailState("error");
    }
  }

  async function requestPhoneOtp() {
    setPhoneState("sending");
    setPhoneError("");
    try {
      await portalApi.requestPhoneChangeOtp(newPhone);
      setPhoneStep("verify");
      setPhoneState("idle");
    } catch (err) {
      setPhoneError(errMsg(err, "Failed to send verification code."));
      setPhoneState("error");
    }
  }

  async function confirmPhoneOtp() {
    setPhoneState("verifying");
    setPhoneError("");
    try {
      await portalApi.confirmPhoneChangeOtp(newPhone, phoneOtp);
      onSaved({ phone: newPhone });
      setPhoneStep("enter");
      setNewPhone("");
      setPhoneOtp("");
      setPhoneState("idle");
    } catch (err) {
      setPhoneError(errMsg(err, "Invalid or expired code."));
      setPhoneState("error");
    }
  }

  const tabs: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "name", label: "Name", icon: <UserIcon size={14} /> },
    { id: "email", label: "Email", icon: <Mail size={14} /> },
    { id: "phone", label: "Phone", icon: <Phone size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md rounded-2xl bg-card border border-border p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-foreground">Edit profile</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 mb-5 rounded-lg bg-foreground/5 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                section === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {section === "name" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">First name</label>
                <input type="text" value={first} onChange={(e) => setFirst(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Last name</label>
                <input type="text" value={last} onChange={(e) => setLast(e.target.value)} className={inputClass} />
              </div>
            </div>
            {nameError && <p className="text-sm text-red-400">{nameError}</p>}
            <button
              onClick={saveName}
              disabled={nameState === "saving" || (!first.trim())}
              className="w-full rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {nameState === "saving" ? "Saving…" : "Save name"}
            </button>
          </div>
        )}

        {section === "email" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current: {currentEmail}</p>
            {emailStep === "enter" ? (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">New email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
                {emailError && <p className="text-sm text-red-400">{emailError}</p>}
                <button
                  onClick={requestEmailOtp}
                  disabled={emailState === "sending" || !newEmail.includes("@")}
                  className="w-full rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {emailState === "sending" ? "Sending code…" : "Send verification code"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to <span className="text-foreground">{newEmail}</span>.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} tracking-[0.4em] text-center font-mono`}
                  placeholder="000000"
                />
                {emailError && <p className="text-sm text-red-400">{emailError}</p>}
                <button
                  onClick={confirmEmailOtp}
                  disabled={emailState === "verifying" || emailOtp.length !== 6}
                  className="w-full rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {emailState === "verifying" ? "Verifying…" : "Confirm email"}
                </button>
                <button
                  onClick={() => { setEmailStep("enter"); setEmailOtp(""); setEmailError(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Use a different email
                </button>
              </>
            )}
          </div>
        )}

        {section === "phone" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Current: {currentPhone || "—"}</p>
            {phoneStep === "enter" ? (
              <>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">New phone</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={inputClass}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Code will be sent via WhatsApp.</p>
                {phoneError && <p className="text-sm text-red-400">{phoneError}</p>}
                <button
                  onClick={requestPhoneOtp}
                  disabled={phoneState === "sending" || newPhone.trim().length < 8}
                  className="w-full rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {phoneState === "sending" ? "Sending code…" : "Send code via WhatsApp"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent via WhatsApp to <span className="text-foreground">{newPhone}</span>.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} tracking-[0.4em] text-center font-mono`}
                  placeholder="000000"
                />
                {phoneError && <p className="text-sm text-red-400">{phoneError}</p>}
                <button
                  onClick={confirmPhoneOtp}
                  disabled={phoneState === "verifying" || phoneOtp.length !== 6}
                  className="w-full rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary font-semibold py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {phoneState === "verifying" ? "Verifying…" : "Confirm phone"}
                </button>
                <button
                  onClick={() => { setPhoneStep("enter"); setPhoneOtp(""); setPhoneError(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Use a different number
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
