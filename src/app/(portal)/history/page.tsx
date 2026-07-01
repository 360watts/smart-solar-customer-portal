"use client";

import React, { useState, useEffect } from "react";
import { Zap, TrendingUp, Leaf, ArrowUpRight, Download } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import MetricCard from "@/components/ui/MetricCard";
import DataChart from "@/components/ui/DataChart";
import { COLORS } from "@/lib/tokens";
import { portalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Mock generation values per month index (Jan–Dec)
const MOCK_GEN = [410, 380, 490, 520, 460, 310, 290, 320, 380, 450, 420, 380];
const MOCK_CON = [380, 350, 420, 470, 430, 490, 510, 480, 420, 390, 370, 360];
const MOCK_BUY = [0, 0, 0, 0, 0, 180, 220, 160, 40, 0, 0, 0];
const MOCK_SELL = [30, 30, 70, 50, 30, 0, 0, 0, 0, 60, 50, 20];
const MOCK_SELF_USE = [92, 91, 86, 90, 93, 100, 100, 100, 89, 87, 88, 95];

interface MonthRow {
  month: string;
  gen: number;
  con: number;
  buy: number;
  sell: number;
  selfUse: number;
  savings: number;
}

function calcSavings(gen: number) {
  return Math.round(gen * 0.75 * 6.8);
}

function calcCo2(gen: number) {
  return Math.round(gen * 0.82);
}

function buildMockRows(): MonthRow[] {
  return MONTHS.map((m, i) => ({
    month: m + " 2026",
    gen: MOCK_GEN[i],
    con: MOCK_CON[i],
    buy: MOCK_BUY[i],
    sell: MOCK_SELL[i],
    selfUse: MOCK_SELF_USE[i],
    savings: calcSavings(MOCK_GEN[i]),
  }));
}

function exportCSV(rows: MonthRow[]) {
  const header = "Month,Solar kWh,Consumed kWh,Grid Buy kWh,Grid Sell kWh,Self-Use %,Savings INR";
  const lines = rows.map(
    (r) => `${r.month},${r.gen},${r.con},${r.buy},${r.sell},${r.selfUse},${r.savings}`
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "360watts-history.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function SelfUsePill({ pct }: { pct: number }) {
  const color =
    pct >= 70 ? COLORS.primary : pct >= 50 ? COLORS.amber : COLORS.muted;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {pct}%
    </span>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [chartView, setChartView] = useState<"energy" | "savings">("energy");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.site_id) return;
    setLoading(true);
    portalApi
      .getEnergySummary(user.site_id, { granularity: "monthly" })
      .then((res) => {
        setError("");
        const results: Array<{
          period_start?: string;
          pv_gen_kwh?: number;
          load_kwh?: number;
          grid_import_kwh?: number;
          grid_export_kwh?: number;
        }> = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
        {
          const mapped: MonthRow[] = results.map((r) => {
            const gen = Number(r.pv_gen_kwh) || 0;
            const con = Number(r.load_kwh) || 0;
            const buy = Number(r.grid_import_kwh) || 0;
            const sell = Number(r.grid_export_kwh) || 0;
            const selfUse = gen > 0 ? Math.round(((gen - sell) / gen) * 100) : 0;
            const label = r.period_start
              ? new Date(r.period_start).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
              : "";
            return {
              month: label,
              gen,
              con,
              buy,
              sell,
              selfUse,
              savings: calcSavings(gen),
            };
          });
          setRows(mapped);
        }
      })
      .catch(() => {
        setError("Live history data is unavailable right now.");
      })
      .finally(() => setLoading(false));
  }, [user?.site_id]);

  // Aggregate KPIs
  const totalGen = rows.reduce((s, r) => s + r.gen, 0);
  const totalSavings = rows.reduce((s, r) => s + r.savings, 0);
  const totalCo2 = calcCo2(totalGen);
  const totalExport = rows.reduce((s, r) => s + r.sell, 0);

  // Chart data derived from rows
  const energyChartData = {
    labels: rows.map((r) => r.month.slice(0, 3)),
    datasets: [
      {
        label: "Generation kWh",
        data: rows.map((r) => r.gen),
        backgroundColor: COLORS.primaryMuted,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        label: "Consumption kWh",
        data: rows.map((r) => r.con),
        backgroundColor: COLORS.amberMuted,
        borderColor: COLORS.amber,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const savingsChartData = {
    labels: rows.map((r) => r.month.slice(0, 3)),
    datasets: [
      {
        label: "Savings ₹",
        data: rows.map((r) => r.savings),
        backgroundColor: COLORS.primaryMuted,
        borderColor: COLORS.primary,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold text-foreground mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            History
          </h1>
          <p className="text-muted-foreground text-sm">12-month energy &amp; savings overview</p>
        </div>
        <button
          onClick={() => exportCSV(rows)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-lg hover:bg-primary/10"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {error && (
        <GlassCard>
          <p className="text-sm text-red-300">{error}</p>
        </GlassCard>
      )}

      {/* Annual KPI tiles */}
      <div
        className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${
          loading ? "opacity-50 animate-pulse" : ""
        }`}
      >
        <MetricCard
          title="Total Generated"
          value={totalGen}
          suffix=" kWh"
          icon={Zap}
          trend={{ direction: "up", value: "+8% vs last year" }}
          delay={0}
        />
        <MetricCard
          title="Total Saved"
          value={`₹${totalSavings.toLocaleString("en-IN")}`}
          suffix=""
          icon={TrendingUp}
          trend={{ direction: "up", value: "estimated" }}
          delay={1}
        />
        <MetricCard
          title="CO₂ Avoided"
          value={totalCo2}
          suffix=" kg"
          icon={Leaf}
          trend={{ direction: "up", value: "TN grid factor" }}
          delay={2}
        />
        <MetricCard
          title="Grid Exported"
          value={totalExport}
          suffix=" kWh"
          icon={ArrowUpRight}
          delay={3}
        />
      </div>

      {/* Monthly Trends chart */}
      <GlassCard glow="green">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Monthly Trends
          </h2>
          <div className="flex gap-2">
            {(["energy", "savings"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  chartView === v
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {v === "energy" ? "Energy (kWh)" : "Savings (₹)"}
              </button>
            ))}
          </div>
        </div>
        <DataChart
          type="bar"
          data={chartView === "energy" ? energyChartData : savingsChartData}
          height={220}
        />
      </GlassCard>

      {/* Monthly breakdown table */}
      <GlassCard>
        <h2
          className="text-lg font-semibold text-foreground mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Monthly Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Month",
                  "Solar kWh",
                  "Consumed kWh",
                  "Grid Buy",
                  "Grid Sell",
                  "Self-Use %",
                  "Savings ₹",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs text-muted-foreground font-medium pb-3 pr-4 last:pr-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 hover:bg-white/[0.03] transition-colors ${
                    i % 2 === 1 ? "bg-white/[0.02]" : ""
                  }`}
                >
                  <td className="py-3 pr-4 text-foreground font-medium">{row.month}</td>
                  <td
                    className="py-3 pr-4"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: COLORS.primary,
                    }}
                  >
                    {row.gen}
                  </td>
                  <td
                    className="py-3 pr-4 text-muted-foreground"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {row.con}
                  </td>
                  <td
                    className="py-3 pr-4"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: COLORS.amber,
                    }}
                  >
                    {row.buy}
                  </td>
                  <td
                    className="py-3 pr-4 text-muted-foreground"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {row.sell}
                  </td>
                  <td className="py-3 pr-4">
                    <SelfUsePill pct={row.selfUse} />
                  </td>
                  <td
                    className="py-3"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      color: COLORS.primary,
                    }}
                  >
                    ₹{row.savings.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
