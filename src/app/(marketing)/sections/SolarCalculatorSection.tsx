"use client";

import { useState, useEffect, useRef } from "react";
import CountUp from "react-countup";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  MessageCircle,
  Share2,
  Copy,
  Gauge,
  PiggyBank,
  Ruler,
  SunMedium,
  Wallet2,
  Zap,
} from "lucide-react";
import { calculateSolarRequirementsFromBill, BillInputs } from "@/lib/solar-physics";
import { reduceMotion, revealVariant, staggerMotionProps } from "../lib/motion";
import { use3DTilt } from "../lib/use3DTilt";

function ResultStatTilt({ children }: { children: React.ReactNode }) {
  const tilt = use3DTilt({ maxDeg: 4, disabled: reduceMotion });
  return (
    <div style={tilt.wrapperStyle} className="min-w-0">
      <motion.div
        style={tilt.cardStyle}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        className="h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function SolarCalculatorSection() {
  const [billAmount, setBillAmount] = useState<string>("");
  const [estimatedUnits, setEstimatedUnits] = useState<number | undefined>();
  const [calcResult, setCalcResult] = useState<ReturnType<
    typeof calculateSolarRequirementsFromBill
  > | null>(() => {
    try {
      return calculateSolarRequirementsFromBill({ billingCycle: "Bi-Monthly" });
    } catch {
      return null;
    }
  });
  const [hasAttemptedCalculation, setHasAttemptedCalculation] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [, setIsCalcVisible] = useState(false);
  const [isResultVisible, setIsResultVisible] = useState(false);
  const [calcGlow, setCalcGlow] = useState({ x: 50, y: 50 });
  const [isCalcHovering] = useState(false);

  const calculatorRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const calcRafRef = useRef<number | null>(null);
  const resultRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      // Client-only feature detection fallback — must run post-hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCalcVisible(true);
      setIsResultVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === calculatorRef.current) setIsCalcVisible(entry.isIntersecting);
          if (entry.target === resultRef.current) setIsResultVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );
    if (calculatorRef.current) observer.observe(calculatorRef.current);
    if (resultRef.current) observer.observe(resultRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      // Intentionally reads each ref's value at unmount time (whatever RAF is
      // in flight then), not a value captured at effect-setup time.
      if (calcRafRef.current !== null) cancelAnimationFrame(calcRafRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (resultRafRef.current !== null) cancelAnimationFrame(resultRafRef.current);
    };
  }, []);

  const handleBillAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && !/[eE+\-]/.test(value))) {
      if (value === "0" || value === "") setBillAmount("");
      else {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue > 0) setBillAmount(value);
      }
    }
  };

  const handleEstimatedUnitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^\d+$/.test(value) && !/[eE+\-]/.test(value))) {
      setEstimatedUnits(value ? Number(value) : undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "e" || e.key === "E" || e.key === "+" || e.key === "-") e.preventDefault();
  };

  const handleCalculatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedCalculation(true);
    const billAmountNum = billAmount ? Number(billAmount) : undefined;
    const estimatedUnitsNum = estimatedUnits;
    if (billAmountNum && billAmountNum > 0 && estimatedUnitsNum && estimatedUnitsNum > 0) {
      alert(
        "Please enter either bill amount OR estimated units, not both. Choose the option you're more comfortable with."
      );
      return;
    }
    if (
      (!billAmountNum || billAmountNum <= 0) &&
      (!estimatedUnitsNum || estimatedUnitsNum <= 0)
    ) {
      alert(
        "Please enter either a bill amount (₹) or estimated bi-monthly units (kWh) to calculate your solar requirements."
      );
      return;
    }
    if (billAmountNum !== undefined && billAmountNum <= 0) {
      alert("Bill amount must be greater than 0.");
      return;
    }
    const bill: BillInputs = {
      totalBillAmount: billAmountNum,
      estimatedUnits: estimatedUnitsNum,
      billingCycle: "Bi-Monthly",
    };
    try {
      const result = calculateSolarRequirementsFromBill(bill);
      setCalcResult(result);
      setShowResults(true);
      setIsResultVisible(true);
      setTimeout(() => {
        document.getElementById("solar-calculator-result")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 100);
    } catch (err) {
      console.error("Calculation error:", err);
      alert(
        "There was an error calculating your solar requirements. Please check your inputs and try again."
      );
      setCalcResult(null);
      setShowResults(false);
    }
  };

  const generateShareText = () => {
    if (!calcResult) return "";
    return `360watts is happy to guide your solar journey !!

Your initial solar estimate from our website www.360watts.com is,

System Size: ${calcResult.recommendedCapacityKw.toFixed(1)} kW
Solar Panels: ${calcResult.panelCount} panels
Annual Generation: ${calcResult.annualGenerationKwh.toLocaleString()} kWh
Estimated Cost: ₹${(calcResult.estimatedCost / 100000).toFixed(1)}L
Annual Savings: ₹${(calcResult.annualSavings / 1000).toFixed(0)}k

For a detailed quotation, we recommend you to submit your energy bill for the last 1 to 2 years in the link below (--> https://360watts.com/contact)

Feel free to call us at +91 9087610051, via phone call or WhatsApp.`;
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(generateShareText())}`, "_blank");
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out my solar calculator results from 360watts!");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, "_blank");
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(generateShareText().substring(0, 200) + "...");
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      alert("Results copied to clipboard!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = generateShareText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert("Results copied to clipboard!");
    }
  };

  /** Use native share sheet on mobile/tablet when available (Web Share API); otherwise open custom dropdown (desktop). */
  const handleShareClick = async () => {
    if (!calcResult) return;
    if (showShareOptions) {
      setShowShareOptions(false);
      return;
    }
    const canUseNativeShare = typeof navigator !== "undefined" && "share" in navigator;
    if (canUseNativeShare) {
      try {
        await navigator.share({
          title: "My solar estimate – 360watts",
          text: generateShareText(),
          url: typeof window !== "undefined" ? window.location.href : "",
        });
        setShowShareOptions(false);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") setShowShareOptions(true);
        else setShowShareOptions(true);
      }
    } else {
      setShowShareOptions(true);
    }
  };

  useEffect(() => {
    if (!showShareOptions) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowShareOptions(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showShareOptions]);

  const handleCalcMouseMove = (e: React.MouseEvent) => {
    if (!calculatorRef.current || typeof requestAnimationFrame === "undefined") return;
    const { clientX, clientY } = e;
    if (calcRafRef.current !== null) cancelAnimationFrame(calcRafRef.current);
    calcRafRef.current = requestAnimationFrame(() => {
      const rect = calculatorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setCalcGlow({
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
    });
  };

  type StatItem = {
    label: string;
    value: number;
    decimals: number;
    suffix: string;
    helper: string;
    icon: typeof Gauge;
    accent: string;
    prefix: string;
  };

  const primaryStats: StatItem[] = calcResult
    ? [
        {
          label: "System Size",
          value: calcResult.recommendedCapacityKw,
          decimals: 2,
          suffix: "kW",
          helper: "Sized for your roof & bill",
          icon: Gauge,
          accent: "from-[#dcfce7] to-[#f5fff9]",
          prefix: "",
        },
        {
          label: "Savings",
          value: calcResult.annualSavings / 1000,
          decimals: 1,
          prefix: "Rs ",
          suffix: "k/yr",
          helper: "Versus current bill",
          icon: PiggyBank,
          accent: "from-[#e0f2fe] to-[#f7fff9]",
        },
        {
          label: "Estimated Cost",
          value: calcResult.estimatedCost / 100000,
          decimals: 2,
          prefix: "Rs ",
          suffix: "L",
          helper: "Turnkey incl. installation",
          icon: Wallet2,
          accent: "from-[#f1f5f9] to-[#f7fff9]",
        },
      ]
    : [];

  const secondaryStats: StatItem[] = calcResult
    ? [
        {
          label: "No. of Panels",
          value: calcResult.panelCount,
          decimals: 0,
          suffix: "panels",
          helper: "TOP CON, 550-600W",
          icon: SunMedium,
          accent: "from-[#e0f2fe] to-[#f7fff9]",
          prefix: "",
        },
        {
          label: "Estimated Annual Generation",
          value: calcResult.annualGenerationKwh,
          decimals: 0,
          suffix: "kWh",
          helper: "Based on 4.5-5 sun hours/day",
          icon: Zap,
          accent: "from-[#fef9c3] to-[#fffaf0]",
          prefix: "",
        },
        {
          label: "Net Present Value",
          value: calcResult.npv / 100000,
          decimals: 1,
          prefix: "Rs ",
          suffix: "L",
          helper: "25-year profit potential",
          icon: Calculator,
          accent: "from-[#fef3c7] to-[#fffbeb]",
        },
        {
          label: "Space Required",
          value: calcResult.requiredAreaSqFt,
          decimals: 0,
          suffix: "sq.ft",
          helper: "Shadow-free usable area",
          icon: Ruler,
          accent: "from-[#dcfce7] to-[#f7fff9]",
          prefix: "",
        },
      ]
    : [];

  return (
    <>
      <section id="solar-calculator" className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-16 md:py-20 min-w-0 overflow-x-hidden">
        <div
          ref={calculatorRef}
          className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] bg-linear-to-br from-[#0f2418] via-[#0c1e14] to-[#0f2f1e] text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] border border-white/10"
          style={{ opacity: 1, transform: "none" }}
          onMouseMove={handleCalcMouseMove}
        >
          <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#04713a]/20 blur-3xl" aria-hidden="true" />
          <div className="absolute right-[-120px] bottom-[-80px] h-64 w-64 rounded-full bg-[#3b82f6]/15 blur-3xl" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isCalcHovering ? 1 : 0,
              background: `radial-gradient(180px circle at ${calcGlow.x}% ${calcGlow.y}%, rgba(255,255,255,0.14), transparent 55%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative grid lg:grid-cols-[1.05fr_1fr] min-w-0 gap-4 sm:gap-0">
            <div className="p-4 sm:p-6 md:p-10 lg:p-12 flex flex-col gap-3 sm:gap-6">
              <span className="inline-flex items-center gap-2 w-fit px-2 sm:px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] sm:text-sm font-semibold tracking-[0.12em] uppercase">
                <Calculator className="w-3 h-3 sm:w-4 sm:h-4" />
                Solar Calculator
              </span>
              <div className="space-y-1.5 sm:space-y-3">
                <h2 className="font-['Urbanist'] font-bold text-[17px] sm:text-3xl md:text-[34px] leading-tight text-white">
                  Curious? Calculate your home&apos;s solar potential
                </h2>
                <p className="font-['Poppins'] text-[12px] sm:text-lg text-white max-w-xl">
                  Drop in a few details to preview system size, energy generation, and savings before a site survey.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] sm:text-base text-white">
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>We respond with a refined quote within one business day.</span>
              </div>
            </div>
            <form
              onSubmit={handleCalculatorSubmit}
              className="bg-white text-[#0a0a0a] rounded-2xl sm:rounded-3xl m-2 sm:m-3 shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col gap-3 sm:gap-6 min-w-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2">
                  <label className="font-['Poppins'] text-[12px] sm:text-base text-[#0a0a0a]">
                    Bi-Monthly Bill Amount (₹)
                  </label>
                  <div className="bg-[#f7fff9] border border-[#d7eadd] rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-3 shadow-[0_6px_20px_rgba(0,0,0,0.03)] min-h-11 flex items-center">
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none text-[14px] sm:text-[15px] min-h-6"
                      placeholder="e.g. 2500"
                      value={billAmount}
                      onChange={handleBillAmountChange}
                      onKeyDown={handleKeyDown}
                      min={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Bi-monthly bill amount in rupees"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[12px] text-[#4a5565]">
                    Total from your latest TANGEDCO bill. OR use units below.
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2">
                  <label className="font-['Poppins'] text-[12px] sm:text-base text-[#0a0a0a]">
                    OR Estimated Bi-Monthly Units (kWh)
                  </label>
                  <div className="bg-[#f7fff9] border border-[#d7eadd] rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-3 shadow-[0_6px_20px_rgba(0,0,0,0.03)] min-h-11 flex items-center">
                    <input
                      type="number"
                      className="w-full bg-transparent outline-none text-[14px] sm:text-[15px] min-h-6"
                      placeholder="e.g. 400"
                      value={estimatedUnits ?? ""}
                      onChange={handleEstimatedUnitsChange}
                      onKeyDown={handleKeyDown}
                      min={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Estimated bi-monthly units in kWh"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[12px] text-[#4a5565]">
                    Bi-monthly consumption in kWh. OR use bill amount above.
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-11 bg-linear-to-r from-[#ffd166] via-[#ffb347] to-[#ff6b00] text-white font-semibold text-[14px] sm:text-base px-5 sm:px-8 py-3 rounded-lg sm:rounded-xl shadow-[0_10px_30px_rgba(255,107,0,0.25)] hover:opacity-95 active:scale-95 transition order-2 sm:order-1"
                >
                  Calculate
                </button>
                <p className="text-[10px] sm:text-[14px] text-[#4a5565] font-['Poppins'] order-1 sm:order-2">
                  Instant preview—no OTP or payment needed.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showResults && (
          <motion.section
            id="solar-calculator-result"
            className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 min-w-0"
            ref={resultRef}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="relative rounded-[20px] sm:rounded-[28px] border border-[#d7eadd] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
              {/* Clip blur orbs only so dropdown is not cut off */}
              <div className="absolute inset-0 overflow-hidden rounded-[20px] sm:rounded-[28px] pointer-events-none" aria-hidden="true">
                <div className="absolute -top-10 left-6 h-32 w-32 rounded-full bg-[#dcfce7] blur-3xl" />
                <div className="absolute bottom-[-80px] right-[-40px] h-48 w-48 rounded-full bg-[#e0f2fe] blur-3xl" />
              </div>
              <div className="relative p-4 sm:p-6 md:p-10 flex flex-col gap-3 sm:gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <div className="inline-block px-3 py-1 bg-linear-to-r from-[#dcfce7] to-[#ddefff] rounded-full">
                      <span className="text-[11px] sm:text-[13px] font-semibold text-[#015c40] font-['Urbanist']">
                        Instant results
                      </span>
                    </div>
                    <h3 className="font-['Urbanist'] font-bold text-[18px] sm:text-[28px] md:text-[32px] text-[#0a0a0a] leading-tight">
                      Your instant solar estimate
                    </h3>
                    <p className="text-[11px] sm:text-sm md:text-base text-[#4a5565] max-w-2xl font-['Poppins']">
                      Based on your inputs. Final proposal after our on-site survey.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end md:justify-start gap-2 w-full md:w-auto min-w-0">
                    <div className="relative flex justify-end md:justify-start">
                      <button
                        type="button"
                        id="share-result-trigger"
                        onClick={handleShareClick}
                        disabled={!calcResult}
                        aria-expanded={showShareOptions}
                        aria-haspopup="menu"
                        aria-controls="share-result-menu"
                        aria-label="Share result"
                        className={`rounded-full border text-[12px] sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#04713a] focus-visible:ring-offset-2 min-h-12 min-w-12 sm:min-h-11 sm:min-w-0 px-4 py-2.5 sm:py-2 active:scale-[0.98] ${
                          calcResult
                            ? "bg-[#eef2ff] border-[#dcdafc] text-[#312e81] hover:bg-[#e0e7ff] cursor-pointer"
                            : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <Share2 className="w-4 h-4 shrink-0" aria-hidden />
                        Share
                      </button>
                    {showShareOptions && calcResult && (
                      <div
                        id="share-result-menu"
                        ref={shareDropdownRef}
                        role="menu"
                        aria-label="Share options"
                        className="absolute top-full mt-2 left-0 right-auto sm:left-auto sm:right-8 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[100] w-34 sm:w-37 max-w-[calc(100vw-2rem)]"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            shareViaWhatsApp();
                            setShowShareOptions(false);
                          }}
                          className="w-full px-2.5 py-2.5 sm:py-1.5 min-h-11 text-left hover:bg-gray-50 flex items-center gap-2 text-[11px] sm:text-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#04713a]"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                          </svg>
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            shareViaFacebook();
                            setShowShareOptions(false);
                          }}
                          className="w-full px-2.5 py-2.5 sm:py-1.5 min-h-11 text-left hover:bg-gray-50 flex items-center gap-2 text-[11px] sm:text-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#04713a]"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            shareViaTwitter();
                            setShowShareOptions(false);
                          }}
                          className="w-full px-2.5 py-2.5 sm:py-1.5 min-h-11 text-left hover:bg-gray-50 flex items-center gap-2 text-[11px] sm:text-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#04713a]"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                          Twitter
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            copyToClipboard();
                            setShowShareOptions(false);
                          }}
                          className="w-full px-2.5 py-2.5 sm:py-1.5 min-h-11 text-left hover:bg-gray-50 flex items-center gap-2 text-[11px] sm:text-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#04713a]"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-600 shrink-0" aria-hidden />
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

                {calcResult && primaryStats.length > 0 ? (
                  <>
                    <div
                      className="flex flex-wrap items-center gap-2 rounded-xl border-l-4 border-[#04713a] bg-linear-to-r from-[#dcfce7] to-[#f7fff9] px-3 py-2.5 sm:px-5 sm:py-4"
                      role="status"
                      aria-live="polite"
                    >
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#04713a] shrink-0 mt-0.5" aria-hidden />
                      <p className="font-['Poppins'] text-[12px] sm:text-[15px] text-[#0a0a0a] leading-snug">
                        A <span className="font-['Urbanist'] font-bold text-[#0a0a0a]">{calcResult.recommendedCapacityKw.toFixed(1)} kW</span> system could save you <span className="font-['Urbanist'] font-bold text-[#0a0a0a]">₹{(calcResult.annualSavings / 1000).toFixed(0)}k/yr</span> — estimated investment <span className="font-['Urbanist'] font-bold text-[#0a0a0a]">₹{(calcResult.estimatedCost / 100000).toFixed(1)}L</span>.
                      </p>
                    </div>

                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
                      {...(reduceMotion ? {} : staggerMotionProps)}
                    >
                      {primaryStats.map((stat) => {
                        const Icon = stat.icon;
                        const staticValue = stat.value.toLocaleString(undefined, { maximumFractionDigits: stat.decimals });
                        return (
                          <ResultStatTilt key={stat.label}>
                            <motion.div
                              variants={revealVariant}
                              className="group relative overflow-hidden rounded-2xl sm:rounded-[20px] border-2 border-[#04713a]/25 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 sm:p-5 flex flex-col gap-1.5 sm:gap-2 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] min-w-0 h-full"
                            >
                            <div className={`absolute inset-0 bg-linear-to-br ${stat.accent} opacity-80 transition-transform duration-300 group-hover:scale-105`} aria-hidden="true" />
                            <div className="relative flex items-start justify-between gap-2 sm:gap-3">
                              <p className="font-['Poppins'] text-[13px] sm:text-[15px] text-[#0a0a0a] leading-tight">{stat.label}</p>
                              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 border border-[#d7eadd] shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.25 shrink-0">
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#0a0a0a] group-hover:text-[#0f2f1e]" aria-hidden />
                              </span>
                            </div>
                            <div className="relative flex items-baseline gap-1 flex-wrap">
                              <span className="font-['Urbanist'] font-bold text-[28px] sm:text-[34px] md:text-[38px] text-[#0a0a0a] leading-none">
                                {isResultVisible && !reduceMotion ? (
                                  <CountUp key={`${stat.label}-${isResultVisible}`} end={stat.value} duration={1.25} decimals={stat.decimals} separator="," prefix={stat.prefix} />
                                ) : (
                                  `${stat.prefix}${staticValue}`
                                )}
                              </span>
                              {stat.suffix ? <span className="font-['Poppins'] text-[14px] sm:text-[16px] text-[#4a5565] leading-none">{stat.suffix}</span> : null}
                            </div>
                            {stat.helper ? <p className="relative font-['Poppins'] text-[12px] sm:text-sm text-[#4a5565] leading-relaxed">{stat.helper}</p> : null}
                            </motion.div>
                          </ResultStatTilt>
                        );
                      })}
                    </motion.div>

                    <motion.div
                      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
                      {...(reduceMotion
                        ? {}
                        : {
                            initial: "hidden" as const,
                            whileInView: "visible" as const,
                            viewport: { once: true, amount: 0.1 },
                            // Big numbers land first, detail cascades in after — not two
                            // staggers racing in parallel. delayChildren waits out the
                            // primary grid's own stagger + reveal duration before starting.
                            variants: {
                              hidden: {},
                              visible: { transition: { staggerChildren: 0.1, delayChildren: primaryStats.length * 0.1 + 0.45 } },
                            },
                          })}
                    >
                      {secondaryStats.map((stat) => {
                        const Icon = stat.icon;
                        const staticValue = stat.value.toLocaleString(undefined, { maximumFractionDigits: stat.decimals });
                        return (
                          <ResultStatTilt key={stat.label}>
                            <motion.div
                              variants={revealVariant}
                              className="group relative overflow-hidden rounded-2xl sm:rounded-[20px] border border-[#e2efe6] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-3 sm:p-5 flex flex-col gap-1 sm:gap-2 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] min-w-0 h-full"
                            >
                            <div className={`absolute inset-0 bg-linear-to-br ${stat.accent} opacity-80 transition-transform duration-300 group-hover:scale-105`} aria-hidden="true" />
                            <div className="relative flex items-start justify-between gap-2 sm:gap-3">
                              <p className="font-['Poppins'] text-[11px] sm:text-[15px] text-[#0a0a0a] leading-tight line-clamp-2 sm:line-clamp-none">{stat.label}</p>
                              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 border border-[#d7eadd] shadow-sm shrink-0">
                                <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#0a0a0a] group-hover:text-[#0f2f1e]" aria-hidden />
                              </span>
                            </div>
                            <div className="relative flex items-baseline gap-1 flex-wrap">
                              <span className="font-['Urbanist'] font-bold text-[22px] sm:text-[30px] md:text-[32px] text-[#0a0a0a] leading-none">
                                {isResultVisible && !reduceMotion ? (
                                  <CountUp key={`${stat.label}-${isResultVisible}`} end={stat.value} duration={1.25} decimals={stat.decimals} separator="," prefix={stat.prefix} />
                                ) : (
                                  `${stat.prefix}${staticValue}`
                                )}
                              </span>
                              {stat.suffix ? <span className="font-['Poppins'] text-[12px] sm:text-[16px] text-[#4a5565] leading-none">{stat.suffix}</span> : null}
                            </div>
                            {stat.helper ? <p className="relative font-['Poppins'] text-[10px] sm:text-sm text-[#4a5565] leading-relaxed line-clamp-2 sm:line-clamp-none">{stat.helper}</p> : null}
                            </motion.div>
                          </ResultStatTilt>
                        );
                      })}
                    </motion.div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-center min-h-55 py-8 sm:py-12">
                    <div className="inline-block px-3 py-1 bg-linear-to-r from-[#dcfce7] to-[#ddefff] rounded-full">
                      <span className="text-[11px] sm:text-[13px] font-semibold text-[#015c40] font-['Urbanist']">Instant results</span>
                    </div>
                    {hasAttemptedCalculation ? (
                      <>
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center" aria-hidden>
                          <Calculator className="w-8 h-8 text-orange-600" />
                        </div>
                        <h3 className="font-['Urbanist'] font-bold text-[18px] sm:text-[20px] text-[#0a0a0a] mb-2">
                          Enter your details to see results
                        </h3>
                        <p className="text-sm text-[#4a5565] font-['Poppins'] max-w-md">
                          Please enter either your monthly bill amount or estimated electricity consumption to calculate your solar system requirements.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center" aria-hidden>
                          <Calculator className="w-8 h-8 text-[#015c40]" />
                        </div>
                        <h3 className="font-['Urbanist'] font-bold text-[18px] sm:text-[20px] text-[#0a0a0a] mb-2">
                          Ready to calculate
                        </h3>
                        <p className="text-sm text-[#4a5565] font-['Poppins'] max-w-md">
                          Fill in your electricity bill amount or monthly units above, then click Calculate to see your personalized solar system estimate.
                        </p>
                      </>
                    )}
                  </div>
                )}

              <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-linear-to-r from-[#f0fdf4] to-[#f7fff9] border border-[#d7eadd] rounded-2xl sm:rounded-[20px]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2 min-w-0">
                    <h4 className="font-['Urbanist'] font-bold text-[16px] sm:text-[20px] text-[#0a0a0a]">
                      Ready to go solar?
                    </h4>
                    <p className="text-[12px] sm:text-sm text-[#4a5565] max-w-lg">
                      Free consultation: we visit your home, assess your roof, and provide a customized proposal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full sm:w-auto min-h-11 bg-linear-to-r from-[#ffd166] via-[#ffb347] to-[#ff6b00] text-white font-semibold text-[14px] sm:text-base px-5 sm:px-8 py-3 rounded-xl shadow-[0_10px_30px_rgba(255,107,0,0.25)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00] focus-visible:ring-offset-2 shrink-0"
                    aria-label="Get free consultation"
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden />
                    Get Free Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
