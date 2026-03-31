import { Zap, Clock, Wind, Shield, DollarSign, Fuel, Leaf, TrendingUp, Building2 } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"

const NAMES = [
  "Al Rigga","Deira City Centre","Maktoum Bridge","Bur Dubai",
  "SZR Junction","DIFC","Business Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tunnel","Marina JBR",
  "DIP","Academic City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH"]

const AGENT_COLORS = { fixed_timer: "#FF4057", q_learning: "#4A90FF", sarsa: "#00E68C" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const ttStyle = { background: "#0B0F14", border: "1px solid rgba(148,163,184,0.10)", borderRadius: 12, color: "#F0F4F8" }

export default function Overview({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p style={{ color: "var(--text-label)" }}>No data available</p>

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

  const norm = cmp.normal?.agents
  const ftW = norm?.fixed_timer?.metrics?.avg_wait_time || 1
  const qlW = norm?.q_learning?.metrics?.avg_wait_time || 0
  const waitImp = (((ftW - qlW) / ftW) * 100).toFixed(1)
  const ftT = norm?.fixed_timer?.metrics?.avg_throughput || 1
  const qlT = norm?.q_learning?.metrics?.avg_throughput || 0
  const tpImp = (((qlT - ftT) / ftT) * 100).toFixed(1)

  const barData = norm ? Object.entries(norm).map(([ag, ad]) => ({
    agent: AGENT_LABELS[ag],
    Throughput: Math.round(ad.metrics.avg_throughput),
    "Wait Time": Math.round(ad.metrics.avg_wait_time),
    Safety: Math.round(ad.metrics.avg_safety_score),
  })) : []

  const radarData = [
    { m: "Throughput", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], Math.min(100,(d.metrics.avg_throughput/6000)*100)])) },
    { m: "Low Wait", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_wait_time/100)])) },
    { m: "Safety", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], d.metrics.avg_safety_score])) },
    { m: "Low Emissions", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_emissions*20)])) },
  ]

  const kpis = [
    { icon: Zap, label: "Best Throughput", sub: AGENT_LABELS[bestTP.ag], value: bestTP.v?.toFixed(0), unit: "vehicles", badge: "+" + tpImp + "% vs Fixed", positive: true, color: "var(--teal)" },
    { icon: Clock, label: "Lowest Wait Time", sub: AGENT_LABELS[lowWait.ag], value: lowWait.v?.toFixed(1), unit: "steps", badge: "+" + waitImp + "% improved", positive: true, color: "var(--green)" },
    { icon: Wind, label: "Lowest Emissions", sub: AGENT_LABELS[lowEmit.ag], value: lowEmit.v?.toFixed(3), unit: "kg CO\u2082", color: "var(--gold)" },
    { icon: Shield, label: "Best Safety Score", sub: AGENT_LABELS[bestSafe.ag], value: bestSafe.v?.toFixed(1), unit: "/ 100", color: "var(--purple)" },
  ]

  // ── Economic Impact Calculations (Dubai context) ──
  // Dubai avg salary: AED 20,000/month => AED 125/hr => AED 2.08/min
  const DUBAI_VOT_PER_MIN = 2.08
  const AVG_OCCUPANCY = 1.3
  const FUEL_IDLE_LITER_PER_HR = 0.8
  const CO2_PER_LITER = 2.31
  const CARBON_CREDIT_AED = 73 // Dubai Carbon Credit price
  const PEAK_HOURS_PER_DAY = 6
  const SCALE_FACTOR = 45 // scale from 16-intersection sim to city-wide estimate

  const waitReductionSteps = Math.max(0, ftW - qlW)
  const waitReductionMin = waitReductionSteps * 0.5 // 1 step ~ 30 sec
  const vehiclesPerHour = (bestTP.v || 0) * 3
  const votPerHour = waitReductionMin * vehiclesPerHour * DUBAI_VOT_PER_MIN * AVG_OCCUPANCY * SCALE_FACTOR
  const votPerYear = votPerHour * PEAK_HOURS_PER_DAY * 365

  const fuelSavedPerHour = (waitReductionMin / 60) * vehiclesPerHour * FUEL_IDLE_LITER_PER_HR * SCALE_FACTOR
  const fuelSavedPerYear = fuelSavedPerHour * PEAK_HOURS_PER_DAY * 365

  const co2PerHour = fuelSavedPerHour * CO2_PER_LITER
  const co2PerYear = co2PerHour * PEAK_HOURS_PER_DAY * 365 / 1000 // tons
  const carbonCreditRevenue = co2PerYear * CARBON_CREDIT_AED

  const totalAnnualSavings = votPerYear + (fuelSavedPerYear * 2.8) + carbonCreditRevenue // AED 2.8/liter avg fuel price

  const bizMetrics = [
    { icon: DollarSign, label: "Value of Time Saved", perHour: votPerHour, perYear: votPerYear, unit: "AED", color: "#00D4FF", desc: "Reduced commuter waiting cost" },
    { icon: Fuel, label: "Fuel Savings", perHour: fuelSavedPerHour, perYear: fuelSavedPerYear, unit: "Liters", color: "#FFB800", desc: "Reduced idle fuel consumption" },
    { icon: Leaf, label: "CO\u2082 Reduction", perHour: co2PerHour, perYear: co2PerYear, unit: co2PerYear > 1 ? "Tons/yr" : "kg/hr", color: "#00E68C", desc: "Greenhouse gas emission savings" },
    { icon: Building2, label: "Carbon Credits", perHour: 0, perYear: carbonCreditRevenue, unit: "AED", color: "#A78BFA", desc: "Dubai carbon market revenue" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className={"kpi-card fade-up-d" + i} style={{ "--accent-color": k.color }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: k.color.replace(")", ",0.12)").replace("var(", "").replace(")", ""), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
              </div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">
                {k.value}<span className="kpi-unit">{k.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{k.sub}</div>
              {k.badge && <div className={"kpi-badge " + (k.positive ? "positive" : "negative")}>{k.badge}</div>}
            </div>
          )
        })}
      </div>

      {/* ── Economic Impact Analysis ── */}
      <div className="card fade-up" style={{ borderImage: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(255,184,0,0.2)) 1", borderImageSlice: 1, borderWidth: 1, borderStyle: "solid", borderRadius: 16, background: "linear-gradient(135deg, rgba(0,212,255,0.02), rgba(255,184,0,0.02)), var(--bg-card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>
            <TrendingUp size={18} style={{ color: "var(--cyan)" }} />
            {"Economic Impact Analysis \u2014 Dubai RTA Projection"}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--cyan)", letterSpacing: "-0.03em" }}>
              {"AED "}{(totalAnnualSavings / 1e6).toFixed(1)}{"M"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-label)" }}>{"Projected Annual Savings"}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bizMetrics.map((b, i) => {
            const Icon = b.icon
            return (
              <div key={i} style={{ background: "var(--bg-card-alt)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--border-subtle)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: b.color, opacity: 0.6 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: b.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} style={{ color: b.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{b.label}</span>
                </div>
                {b.perHour > 0 && (
                  <div style={{ fontSize: 13, color: "var(--text-label)", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: b.color, fontSize: 16 }}>{b.perHour >= 1000 ? (b.perHour/1000).toFixed(1) + "K" : b.perHour.toFixed(1)}</span>
                    <span style={{ marginLeft: 4 }}>{b.unit}{"/hr"}</span>
                  </div>
                )}
                <div style={{ fontSize: 13, color: "var(--text-label)" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 18 }}>{b.perYear >= 1e6 ? (b.perYear/1e6).toFixed(2) + "M" : b.perYear >= 1000 ? (b.perYear/1000).toFixed(1) + "K" : b.perYear.toFixed(1)}</span>
                  <span style={{ marginLeft: 4 }}>{b.unit}{"/year"}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>{b.desc}</div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(0,212,255,0.04)", borderRadius: 10, border: "1px solid rgba(0,212,255,0.08)", fontSize: 11, color: "var(--text-label)", lineHeight: 1.6 }}>
          {"Methodology: Value of Time (VoT) based on Dubai avg salary AED 20K/month (AED 2.08/min/person). "
          + "Fuel savings at 0.8L/hr idle rate. CO\u2082 at 2.31 kg/liter. Carbon credits at AED 73/ton (Dubai Carbon Exchange). "
          + "Scaled from 16-intersection simulation to city-wide estimate (\u00d745 factor for Dubai's 700+ signalized intersections). "
          + "Peak hours: 6hr/day."}
        </div>
      </div>

      {/* Grid Map + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Dubai Intersection Map */}
        <div className="lg:col-span-2 card fade-up-d1">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--teal)" }} />
            Dubai 4x4 Intersection Grid
          </div>
          <svg viewBox="0 0 400 440" style={{ width: "100%" }}>
            {/* Zone labels */}
            {ZONES.map((z, i) => (
              <text key={z} x="10" y={60 + i * 100} fill="#64748B" fontSize="9" fontWeight="700" letterSpacing="0.1em">{z}</text>
            ))}
            {/* Roads */}
            {[0,1,2,3].map(r => <rect key={"h"+r} x="50" y={48+r*100} width="330" height="24" rx="4" fill="#151D2E" />)}
            {[0,1,2,3].map(r => <line key={"hm"+r} x1="50" y1={60+r*100} x2="380" y2={60+r*100} stroke="#1E293B" strokeWidth="1" strokeDasharray="8 5" />)}
            {[0,1,2,3].map(c => <rect key={"v"+c} x={63+c*100} y="35" width="24" height="380" rx="4" fill="#151D2E" />)}
            {[0,1,2,3].map(c => <line key={"vm"+c} x1={75+c*100} y1="35" x2={75+c*100} y2="415" stroke="#1E293B" strokeWidth="1" strokeDasharray="8 5" />)}
            {/* Intersection nodes */}
            {NAMES.map((name, i) => {
              const r = Math.floor(i/4), c = i%4
              const cx = 75 + c*100, cy = 60 + r*100
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="16" fill="#0F1629" stroke="#06B6D4" strokeWidth="1.5" opacity="0.9" />
                  <circle cx={cx-5} cy={cy-4} r="3" fill="#22C55E" />
                  <circle cx={cx+5} cy={cy-4} r="3" fill="#EF4444" opacity="0.5" />
                  <text x={cx} y={cy+5} textAnchor="middle" fill="#CBD5E1" fontSize="5" fontWeight="600">INT-{String(i+1).padStart(2,"0")}</text>
                  <text x={cx} y={cy+24} textAnchor="middle" fill="#94A3B8" fontSize="6.5" fontWeight="500">{name}</text>
                </g>
              )
            })}
            {/* Legend */}
            <g transform="translate(60, 430)">
              <circle cx="0" cy="0" r="3" fill="#22C55E" /><text x="8" y="3" fill="#94A3B8" fontSize="7">NS Green</text>
              <circle cx="70" cy="0" r="3" fill="#EF4444" /><text x="78" y="3" fill="#94A3B8" fontSize="7">EW Red</text>
              <circle cx="135" cy="0" r="3" fill="#06B6D4" stroke="#06B6D4" /><text x="143" y="3" fill="#94A3B8" fontSize="7">Intersection</text>
            </g>
          </svg>
        </div>

        {/* Radar + Bar */}
        <div className="lg:col-span-3" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card fade-up-d2">
            <div className="section-title">
              <span className="dot" style={{ background: "var(--blue)" }} />
              Agent Performance Profile
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Normal Scenario</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="m" tick={{ fill: "#CBD5E1", fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis tick={{ fill: "#64748B", fontSize: 9 }} domain={[0, 100]} />
                <Radar name="Fixed Timer" dataKey="Fixed Timer" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={2} />
                <Radar name="Q-Learning" dataKey="Q-Learning" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.12} strokeWidth={2.5} />
                <Radar name="SARSA" dataKey="SARSA" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1", paddingTop: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card fade-up-d3">
            <div className="section-title">
              <span className="dot" style={{ background: "var(--gold)" }} />
              Normal Scenario Metrics
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
                <XAxis dataKey="agent" stroke="#94A3B8" tick={{ fill: "#CBD5E1", fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1" }} />
                <Bar dataKey="Throughput" fill="#3B82F6" radius={[6,6,0,0]} />
                <Bar dataKey="Wait Time" fill="#F59E0B" radius={[6,6,0,0]} />
                <Bar dataKey="Safety" fill="#10B981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card fade-up">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--purple)" }} />
          Complete Experiment Results
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>5 Scenarios × 3 Agents = 15 Experiments</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th><th>Agent</th>
                <th className="text-right">Throughput</th>
                <th className="text-right">Wait Time</th>
                <th className="text-right">Emissions (kg)</th>
                <th className="text-right">Safety</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cmp).map(([sc, sd]) =>
                Object.entries(sd.agents).map(([ag, ad], idx) => (
                  <tr key={sc+ag}>
                    {idx === 0 && <td className="highlight" rowSpan={Object.keys(sd.agents).length} style={{ verticalAlign: "top" }}>{SC_LABELS[sc]}</td>}
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: AGENT_COLORS[ag], flexShrink: 0 }} />
                        {AGENT_LABELS[ag]}
                      </span>
                    </td>
                    <td className="text-right mono">{ad.metrics.avg_throughput?.toFixed(1)}</td>
                    <td className="text-right mono">{ad.metrics.avg_wait_time?.toFixed(1)}</td>
                    <td className="text-right mono">{ad.metrics.avg_emissions?.toFixed(4)}</td>
                    <td className="text-right mono">{ad.metrics.avg_safety_score?.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
