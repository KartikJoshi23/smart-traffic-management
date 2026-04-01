import { Zap, Clock, Wind, Shield, DollarSign, Fuel, Leaf, TrendingUp } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"

const NAMES = [
  "Al Rigga","Deira City Centre","Maktoum Bridge","Bur Dubai",
  "SZR Junction","DIFC","Business Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tunnel","Marina JBR",
  "DIP","Academic City","Al Barsha","Airport T3"
]

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const ttStyle = { background: "#1a1a1e", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, color: "#fafafa" }

export default function Overview({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p style={{ color: "var(--text-label)" }}>No data available</p>

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

  // Rush hour comparison (where RL shines most)
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

  // Bar chart data for rush hour (most meaningful comparison)
  const barData = rush ? Object.entries(rush).map(([ag, ad]) => ({
    agent: AGENT_LABELS[ag],
    Throughput: Math.round(ad.metrics.avg_throughput),
    "Wait Time": Math.round(ad.metrics.avg_wait_time),
    Safety: Math.round(ad.metrics.avg_safety_score),
    fill: AGENT_COLORS[ag],
  })) : []

  // Radar chart
  const norm = cmp.normal?.agents || {}
  const radarData = [
    { metric: "Throughput", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.min(100,(d.metrics.avg_throughput/6000)*100)])) },
    { metric: "Low Wait", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_wait_time/80)])) },
    { metric: "Safety", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], d.metrics.avg_safety_score])) },
    { metric: "Low Emissions", ...Object.fromEntries(Object.entries(norm).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_emissions)])) },
  ]

  const kpis = [
    { icon: Zap, label: "Best Throughput (Rush Hour)", value: bestTP.v?.toFixed(0), unit: "veh/ep", badge: `+${tpImpPct}% vs Fixed`, positive: true, color: "var(--teal)" },
    { icon: Clock, label: "Wait Reduction (Rush Hour)", value: waitImpPct + "%", badge: `RL saves ${Math.round(ftWait - bestRLWait)} steps`, positive: true, color: "var(--green)" },
    { icon: Wind, label: "Emission Reduction (Rush Hour)", value: emitImpPct + "%", badge: `${Math.round(ftEmit - qlEmit)} kg CO\u2082 saved`, positive: true, color: "var(--gold)" },
    { icon: Shield, label: "Best Safety Score", value: bestSafe.v?.toFixed(1), unit: "/ 100", color: "var(--purple)" },
  ]

  // Economic Impact (grounded in Dubai data)
  // Dubai avg monthly salary: AED 16,775 (Bayt.com 2024) = AED 97.5/hr = AED 1.625/min
  // Standard VoT factor: 50% of wage rate (RTA methodology) = AED 0.8125/min/person
  const VOT_PER_MIN = 0.8125
  const AVG_OCCUPANCY = 1.2
  // Rush hour: 16 intersections, each handles ~750 veh/hr in simulation
  // Wait reduction in real minutes: each step = 30sec, so reduction = steps * 0.5 min
  const waitReductionMin = (ftWait - bestRLWait) * 0.5 / 16 // per intersection avg
  const vehPerIntersectionHr = 750
  // Savings per intersection per peak hour
  const savingsPerIntPerHr = waitReductionMin * vehPerIntersectionHr * VOT_PER_MIN * AVG_OCCUPANCY
  // Dubai has ~700 signalized intersections (RTA data)
  const CITY_INTERSECTIONS = 700
  const PEAK_HOURS_DAY = 4
  const WORKING_DAYS_YR = 300
  const annualVoT = savingsPerIntPerHr * CITY_INTERSECTIONS * PEAK_HOURS_DAY * WORKING_DAYS_YR

  // Fuel: 0.6L/hr idle per vehicle (EPA estimate for Dubai heat + AC)
  const fuelIdleRate = 0.6
  const fuelSavedPerIntPerHr = (waitReductionMin / 60) * vehPerIntersectionHr * fuelIdleRate
  const annualFuelL = fuelSavedPerIntPerHr * CITY_INTERSECTIONS * PEAK_HOURS_DAY * WORKING_DAYS_YR
  const FUEL_AED = 3.23 // AED per liter (ENOC 2024)
  const annualFuelAED = annualFuelL * FUEL_AED

  // CO2: 2.31 kg per liter petrol
  const annualCO2 = annualFuelL * 2.31 / 1000 // tons
  const CARBON_AED = 75 // AED per ton (voluntary market)
  const annualCarbonAED = annualCO2 * CARBON_AED

  const totalAnnualAED = annualVoT + annualFuelAED + annualCarbonAED

  // Grid map data
  const meta = data.intersection_meta || []
  const rushAgents = rush || {}

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card" style={{ "--accent-color": k.color }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <k.icon size={16} style={{ color: k.color }} />
              <span className="kpi-label">{k.label}</span>
            </div>
            <div>
              <span className="kpi-value">{k.value}</span>
              {k.unit && <span className="kpi-unit">{k.unit}</span>}
            </div>
            {k.badge && (
              <div className={`kpi-badge ${k.positive ? "positive" : ""}`}>
                {k.positive && <TrendingUp size={10} />} {k.badge}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Economic Impact */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(198,168,103,0.04), rgba(52,211,153,0.04))" }}>
        <div className="section-title">
          <span className="dot" style={{ background: "var(--gold)" }} />
          Economic Impact Analysis (Dubai RTA Projection)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
          <div className="metric-mini">
            <div className="metric-mini-label"><DollarSign size={10} style={{ display: "inline" }} /> Value of Time Saved</div>
            <div className="metric-mini-value" style={{ color: "var(--green)" }}>AED {(annualVoT / 1e6).toFixed(1)}M</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>per year (700 intersections)</div>
          </div>
          <div className="metric-mini">
            <div className="metric-mini-label"><Fuel size={10} style={{ display: "inline" }} /> Fuel Savings</div>
            <div className="metric-mini-value" style={{ color: "var(--gold)" }}>{(annualFuelL / 1e6).toFixed(2)}M L</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>= AED {(annualFuelAED / 1e6).toFixed(1)}M</div>
          </div>
          <div className="metric-mini">
            <div className="metric-mini-label"><Leaf size={10} style={{ display: "inline" }} /> CO{"\u2082"} Reduction</div>
            <div className="metric-mini-value" style={{ color: "var(--teal)" }}>{annualCO2.toFixed(0)} tons</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Carbon credits: AED {(annualCarbonAED / 1e3).toFixed(0)}K</div>
          </div>
          <div className="metric-mini" style={{ borderColor: "var(--border-medium)" }}>
            <div className="metric-mini-label">Total Annual ROI</div>
            <div className="metric-mini-value" style={{ color: "var(--text-primary)" }}>AED {(totalAnnualAED / 1e6).toFixed(1)}M</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>City-wide projection</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.5, padding: "10px 14px", background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
          <strong style={{ color: "var(--text-label)" }}>Methodology:</strong> VoT = AED 0.81/min/person (50% wage rate, Bayt.com avg salary AED 16,775/mo).
          Fuel idle rate: 0.6 L/hr (EPA, adjusted for Dubai AC load). CO{"\u2082"}: 2.31 kg/L.
          Peak hours: 4/day, 300 working days/yr. Based on {waitImpPct}% wait time reduction during rush hour.
          Projected from 16-intersection simulation to Dubai{"'"}s 700 signalized intersections.
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--blue)" }} />
            Rush Hour Performance Comparison
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="agent" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="Throughput" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="Wait Time" fill="#F59E0B" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--purple)" }} />
            Agent Capability Profile (Normal Traffic)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name="Fixed Timer" dataKey="Fixed Timer" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
              <Radar name="Q-Learning" dataKey="Q-Learning" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
              <Radar name="SARSA" dataKey="SARSA" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intersection Grid Map */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--teal)" }} />
          Dubai Intersection Network (4{"\u00D7"}4 Grid)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {NAMES.map((name, i) => {
            const row = Math.floor(i / 4)
            const zoneColors = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"]
            return (
              <div key={i} style={{
                background: "var(--bg-card-alt)", borderRadius: 10,
                padding: "12px 14px", border: "1px solid var(--border-subtle)",
                borderLeft: `3px solid ${zoneColors[row]}`
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  INT-{String(i + 1).padStart(2, "0")} {"\u00B7"} Zone {["Deira","Downtown","Jumeirah","South"][row]}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}