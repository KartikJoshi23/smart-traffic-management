import { Zap, Clock, Wind, Shield, DollarSign, Fuel, Leaf, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts"

const NAMES = [
  "Al Rigga","Deira City Centre","Maktoum Bridge","Bur Dubai",
  "SZR Junction","DIFC","Business Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tunnel","Marina JBR",
  "DIP","Academic City","Al Barsha","Airport T3"
]
const ZONE_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"]
const ZONE_NAMES = ["Deira", "Downtown", "Jumeirah", "South"]

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const ttStyle = { background: "#1e1e21", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#f4f4f5" }

export default function Overview({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p style={{ color: "var(--text-tertiary)" }}>No data available</p>

  let bestTP = { v: 0 }, lowWait = { v: Infinity }, lowEmit = { v: Infinity }, bestSafe = { v: 0 }
  Object.entries(cmp).forEach(([sc, sd]) =>
    Object.entries(sd.agents).forEach(([ag, ad]) => {
      const m = ad.metrics
      if (m.avg_throughput > bestTP.v) bestTP = { v: m.avg_throughput, ag, sc }
      if (m.avg_wait_time < lowWait.v) lowWait = { v: m.avg_wait_time, ag, sc }
      if (m.avg_emissions < lowEmit.v) lowEmit = { v: m.avg_emissions, ag, sc }
      if (m.avg_safety_score > bestSafe.v) bestSafe = { v: m.avg_safety_score, ag, sc }
    })
  )

  const rush = cmp.rush_hour?.agents
  const ftWait = rush?.fixed_timer?.metrics?.avg_wait_time || 1
  const qlWait = rush?.q_learning?.metrics?.avg_wait_time || 0
  const saWait = rush?.sarsa?.metrics?.avg_wait_time || 0
  const bestRLWait = Math.min(qlWait, saWait)
  const waitImpPct = (((ftWait - bestRLWait) / ftWait) * 100).toFixed(1)

  const ftTP = rush?.fixed_timer?.metrics?.avg_throughput || 1
  const qlTP = rush?.q_learning?.metrics?.avg_throughput || 0
  const tpImpPct = (((qlTP - ftTP) / ftTP) * 100).toFixed(1)

  const ftEmit = rush?.fixed_timer?.metrics?.avg_emissions || 1
  const qlEmit = rush?.q_learning?.metrics?.avg_emissions || 0
  const emitImpPct = (((ftEmit - qlEmit) / ftEmit) * 100).toFixed(1)

  const barData = rush ? Object.entries(rush).map(([ag, ad]) => ({
    agent: AGENT_LABELS[ag],
    Throughput: Math.round(ad.metrics.avg_throughput),
    "Wait Time": Math.round(ad.metrics.avg_wait_time),
    Safety: Math.round(ad.metrics.avg_safety_score),
  })) : []

  const norm = cmp.normal?.agents || {}
  const radarData = [
    { metric: "Throughput", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.min(100,(d.metrics.avg_throughput/6000)*100)])) },
    { metric: "Low Wait", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_wait_time/80)])) },
    { metric: "Safety", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], d.metrics.avg_safety_score])) },
    { metric: "Low Emission", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_emissions)])) },
  ]

  const kpis = [
    { icon: Zap, label: "Peak Throughput", value: bestTP.v?.toFixed(0), unit: "veh/ep", badge: `+${tpImpPct}% vs Fixed`, positive: parseFloat(tpImpPct) > 0, color: "var(--blue)" },
    { icon: Clock, label: "Wait Reduction", value: waitImpPct + "%", unit: "in rush hour", badge: `${Math.round(ftWait - bestRLWait)} steps saved`, positive: true, color: "var(--green)" },
    { icon: Wind, label: "Emission Savings", value: emitImpPct + "%", unit: "CO\u2082 reduced", badge: `${Math.round(ftEmit - qlEmit)} kg saved`, positive: parseFloat(emitImpPct) > 0, color: "var(--amber)" },
    { icon: Shield, label: "Safety Score", value: bestSafe.v?.toFixed(1), unit: "/ 100", badge: bestSafe.ag?.replace("_"," "), positive: true, color: "var(--violet)" },
  ]

  // Economic calculations
  const VOT_PER_MIN = 0.8125
  const AVG_OCC = 1.2
  const waitRedMin = (ftWait - bestRLWait) * 0.5 / 16
  const vehPerIntHr = 750
  const savPerIntHr = waitRedMin * vehPerIntHr * VOT_PER_MIN * AVG_OCC
  const CITY_INT = 700
  const PEAK_HRS = 4
  const WORK_DAYS = 300
  const annualVoT = savPerIntHr * CITY_INT * PEAK_HRS * WORK_DAYS
  const fuelSavPerIntHr = (waitRedMin / 60) * vehPerIntHr * 0.6
  const annualFuelL = fuelSavPerIntHr * CITY_INT * PEAK_HRS * WORK_DAYS
  const annualFuelAED = annualFuelL * 3.23
  const annualCO2 = annualFuelL * 2.31 / 1000
  const annualCarbonAED = annualCO2 * 75
  const totalAED = annualVoT + annualFuelAED + annualCarbonAED

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Row - each card different color */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card" style={{ "--accent": k.color }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `color-mix(in srgb, ${k.color} 12%, transparent)` }}>
                <k.icon size={14} style={{ color: k.color }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{k.value}</span>
              {k.unit && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.unit}</span>}
            </div>
            {k.badge && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, marginTop: 6, background: k.positive ? "var(--green-dim)" : "var(--red-dim)", color: k.positive ? "var(--green-light)" : "var(--red-light)" }}>
                {k.positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {k.badge}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Economic Impact */}
      <div className="card">
        <div className="section-title">
          <span className="section-dot" style={{ background: "var(--amber)" }} />
          Economic Impact Analysis — Dubai RTA Projection
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { icon: DollarSign, label: "Value of Time Saved", value: `AED ${(annualVoT / 1e6).toFixed(1)}M`, sub: "per year (700 intersections)", color: "var(--green)" },
            { icon: Fuel, label: "Fuel Savings", value: `${(annualFuelL / 1e6).toFixed(2)}M Liters`, sub: `= AED ${(annualFuelAED / 1e6).toFixed(1)}M`, color: "var(--amber)" },
            { icon: Leaf, label: "CO\u2082 Reduction", value: `${annualCO2.toFixed(0)} tons`, sub: `Carbon credits: AED ${(annualCarbonAED / 1e3).toFixed(0)}K`, color: "var(--teal)" },
            { icon: TrendingUp, label: "Total Annual ROI", value: `AED ${(totalAED / 1e6).toFixed(1)}M`, sub: "City-wide projection", color: "var(--violet)" },
          ].map((m, i) => (
            <div key={i} className="metric-card">
              <div className="metric-label"><m.icon size={10} style={{ display: "inline", marginRight: 4 }} />{m.label}</div>
              <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.6, padding: "10px 14px", background: "var(--bg-surface-2)", borderRadius: 8, border: "1px solid var(--border-subtle)", marginTop: 12 }}>
          <strong style={{ color: "var(--text-tertiary)" }}>Methodology:</strong> VoT = AED 0.81/min/person (50% wage rate). Fuel idle: 0.6 L/hr (EPA + AC). CO\u2082: 2.31 kg/L. Peak: 4hr/day, 300 days/yr. Based on {waitImpPct}% rush hour wait reduction. Scaled from 16 to 700 signalized intersections.
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--blue)" }} />
            Rush Hour Performance
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="agent" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="Throughput" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="Wait Time" fill="#F59E0B" radius={[4,4,0,0]} />
              <Bar dataKey="Safety" fill="#8B5CF6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--violet)" }} />
            Agent Capability Profile
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Fixed Timer" dataKey="Fixed Timer" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={2} />
              <Radar name="Q-Learning" dataKey="Q-Learning" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.12} strokeWidth={2} />
              <Radar name="SARSA" dataKey="SARSA" stroke="#10B981" fill="#10B981" fillOpacity={0.12} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intersection Grid */}
      <div className="card">
        <div className="section-title">
          <span className="section-dot" style={{ background: "var(--teal)" }} />
          Dubai Intersection Network (4×4 Grid)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {NAMES.map((name, i) => {
            const row = Math.floor(i / 4)
            return (
              <div key={i} style={{
                background: "var(--bg-surface-2)", borderRadius: 10,
                padding: "12px 14px", border: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${ZONE_COLORS[row]}`
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  INT-{String(i + 1).padStart(2, "0")} · {ZONE_NAMES[row]}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
