export function RiskGauge({ value = 78, label = "Good" }: { value?: number; label?: string }) {
  return <div className="gauge-ring relative grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(#61e6cf ${value * 3.6}deg, rgba(184,211,207,.12) 0deg)` }}><div className="grid h-36 w-36 place-items-center rounded-full bg-[#102321] text-center"><div><p className="text-4xl font-semibold">{value}</p><p className="mt-1 text-xs uppercase tracking-[.18em] text-[#9cb7b5]">{label}</p></div></div></div>;
}
