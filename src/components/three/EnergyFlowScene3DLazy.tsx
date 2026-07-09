"use client";

import dynamic from "next/dynamic";

const EnergyFlowScene3D = dynamic(() => import("./EnergyFlowScene3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-105 rounded-xl border border-white/8 bg-black/20 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/25 border-t-emerald-400 animate-spin" />
    </div>
  ),
});

export default function EnergyFlowScene3DLazy() {
  return <EnergyFlowScene3D />;
}
