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
const AGENT_COLORS = { fixed_timer: "#ef4444", q_learning: "#3b82f6", sarsa: "#22c55e" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const TT = { background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e4e4e7", fontSize: 12 }

export default function Overview({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p style={{ color: "var(--text-muted)" }}>No data available</p>

  // Find best metrics across all scenarios
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

  const rush = cmp.rush_hour?.agents || {}
  const ftW = rush.fixed_timer?.metrics?.avg_wait_time || 1
  const qlW = rush.q_learning?.metrics?.avg_wait_time || 0
  const saW = rush.sarsa?.metrics?.avg_wait_time || 0
  const bestRLW = Math.min(qlW, saW)
  const waitPct = (((ftW - bestRLW) / ftW) * 100).toFixed(1)

  const ftTP = rush.fixed_timer?.metrics?.avg_throughput || 1
  const qlTP = rush.q_learning?.metrics?.avg_throughput || 0
  const tpPct = (((qlTP - ftTP) / ftTP) * 100).toFixed(1)

  const ftE = rush.fixed_timer?.metrics?.avg_emissions || 1
  const qlE = rush.q_learning?.metrics?.avg_emissions || 0
  const ePct = (((ftE - qlE) / ftE) * 100).toFixed(1)

  const kpis = [
    { icon: Zap, label: "Peak Throughput", value: bestTP.v?.toFixed(0), unit: "vehicles/episode",
      badge: "+" + tpPct + "% vs Fixed", pos: +tpPct > 0, color: "#3b82f6", glow: "glow-blue" },
    { icon: Clock, label: "Wait Reduction", value: waitPct + "%", unit: "in rush hour",
      badge: Math.round(ftW - bestRLW) + " steps saved", pos: true, color: "#22c55e", glow: "glow-green" },
    { icon: Wind, label: "Emission Savings", value: ePct + "%", unit: "CO\u2082 reduced",
      badge: Math.round(ftE - qlE) + " kg saved", pos: +ePct > 0, color: "#f59e0b", glow: "glow-amber" },
    { icon: Shield, label: "Safety Score", value: bestSafe.v?.toFixed(1), unit: "/ 100",
      badge: (bestSafe.ag || "").replace("_", " "), pos: true, color: "#a855f7", glow: "glow-violet" },
  ]

  // Economic calculations
  const waitRedMin = (ftW - bestRLW) * 0.5 / 16
  const vehHr = 750
  const savPerIntHr = waitRedMin * vehHr * 0.8125 * 1.2
  const annualVoT = savPerIntHr * 700 * 4 * 300
  const fuelPerHr = (waitRedMin / 60) * vehHr * 0.6
  const annualFuelL = fuelPerHr * 700 * 4 * 300
  const annualFuelAED = annualFuelL * 3.23
  const annualCO2 = annualFuelL * 2.31 / 1000
  const annualCarbonAED = annualCO2 * 75
  const totalAED = annualVoT + annualFuelAED + annualCarbonAED

  const barData = Object.entries(rush).map(([ag, ad]) => ({
    agent: AGENT_LABELS[ag],
    Throughput: Math.round(ad.metrics.avg_throughput),
    "Wait Time": Math.round(ad.metrics.avg_wait_time),
    Safety: Math.round(ad.metrics.avg_safety_score),
    fill: AGENT_COLORS[ag],
  }))

  const norm = cmp.normal?.agents || {}
  const radarData = [
    { metric: "Throughput", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.min(100,(d.metrics.avg_throughput/6000)*100)])) },
    { metric: "Low Wait", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_wait_time/80)])) },
    { metric: "Safety", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], d.metrics.avg_safety_score])) },
    { metric: "Low Emissions", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_emissions)])) },
  ]

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card" style={{ "--accent": k.color }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: k.color + "18" }}>
                <k.icon size={16} style={{ color: k.color }}/>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {k.label}
              </span>
            </div>
            <div className={"glow-number " + k.glow}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{k.unit}</div>
            <div style={{ marginTop: 10 }}>
              <span className={k.pos ? "badge-green" : "badge-red"} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: k.pos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                color: k.pos ? "#4ade80" : "#f87171" }}>
                {k.pos ? String.fromCharCode(9650) : String.fromCharCode(9660)} {k.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Economic Impact */}
      <div className="card" style={{ background: "linear-gradient(135deg, var(--bg-card) 0%, #1a1a2e 100%)", borderLeft: "3px solid #06b6d4" }}>
        <div className="section-head">
          <div className="section-icon" style={{ background: "rgba(6,182,212,0.12)" }}>
            <DollarSign size={15} style={{ color: "#06b6d4" }}/>
          </div>
          <span>Economic Impact Analysis</span>
          <span style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 400, marginLeft: "auto" }}>
            Projected city-wide annual savings (700 intersections)
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { icon: DollarSign, label: "Total Annual Savings", val: "AED " + (totalAED/1e6).toFixed(1) + "M", color: "#06b6d4", sub: "Combined economic value" },
            { icon: Clock, label: "Value of Time Saved", val: "AED " + (annualVoT/1e6).toFixed(1) + "M", color: "#3b82f6", sub: "Based on Dubai avg salary" },
            { icon: Fuel, label: "Fuel Cost Reduction", val: "AED " + (annualFuelAED/1e6).toFixed(1) + "M", color: "#f59e0b", sub: (annualFuelL/1e6).toFixed(2) + "M liters saved" },
            { icon: Leaf, label: "Carbon Credit Revenue", val: "AED " + (annualCarbonAED/1000).toFixed(0) + "K", color: "#22c55e", sub: annualCO2.toFixed(0) + " tons CO\u2082 reduced" },
          ].map((e, i) => (
            <div key={i} className="metric-box">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <e.icon size={13} style={{ color: e.color }}/>
                <span className="metric-label" style={{ marginBottom: 0 }}>{e.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: e.color }}>{e.val}</div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>{e.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row: Bar + Radar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card card-blue">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(59,130,246,0.12)" }}>
              <TrendingUp size={14} style={{ color: "#3b82f6" }}/>
            </div>
            Rush Hour Performance
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="agent" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={TT}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
              <Bar dataKey="Throughput" fill="#3b82f6" radius={[6,6,0,0]}/>
              <Bar dataKey="Wait Time" fill="#ef4444" radius={[6,6,0,0]}/>
              <Bar dataKey="Safety" fill="#22c55e" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-violet">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(168,85,247,0.12)" }}>
              <Shield size={14} style={{ color: "#a855f7" }}/>
            </div>
            Agent Performance Profile
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)"/>
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 10 }}/>
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]}/>
              <Radar name="Fixed Timer" dataKey="Fixed Timer" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={2}/>
              <Radar name="Q-Learning" dataKey="Q-Learning" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2}/>
              <Radar name="SARSA" dataKey="SARSA" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={2}/>
              <Legend wrapperStyle={{ fontSize: 10 }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intersection Map */}
      <div className="card card-emerald">
        <div className="section-head">
          <div className="section-icon" style={{ background: "rgba(16,185,129,0.12)" }}>
            <Zap size={14} style={{ color: "#10b981" }}/>
          </div>
          Dubai 4x4 Intersection Network
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {NAMES.map((name, i) => {
            const zones = ["#3b82f6","#a855f7","#f59e0b","#22c55e"]
            const zoneColor = zones[Math.floor(i / 4)]
            return (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "1px solid var(--border-dim)",
                borderTop: "2px solid " + zoneColor }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-white)" }}>{name}</div>
                <div style={{ fontSize: 9, color: zoneColor, fontWeight: 600, marginTop: 2 }}>
                  {["Deira","Downtown","Jumeirah","South Dubai"][Math.floor(i / 4)]}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
