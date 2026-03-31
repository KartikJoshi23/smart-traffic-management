import { TrendingUp, TrendingDown, Clock, Shield, Zap, Wind } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell,
} from "recharts"

const INTERSECTION_NAMES = [
  "Al Rigga", "Deira CC", "Maktoum Br.", "Bur Dubai",
  "SZR Int. 1", "DIFC", "Business Bay", "Dubai Mall",
  "Al Quoz", "Jumeirah", "Palm Tunnel", "Marina JBR",
  "DIP", "Academic City", "Al Barsha", "Airport T3"
]

const AGENT_COLORS = { fixed_timer: "#ef4444", q_learning: "#3b82f6", sarsa: "#10b981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SCENARIO_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }

const tooltipStyle = { background: "rgba(13,20,36,0.95)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: 12 }

function StatCard({ icon: Icon, label, value, unit, sub, color, glow, delay }) {
  return (
    <div className={("glass rounded-2xl p-5 " + glow + " fade-in-d" + delay)}>
      <div className="flex items-center justify-between mb-3">
        <div className={"w-9 h-9 rounded-xl flex items-center justify-center bg-" + color + "-500/10"}>
          <Icon size={18} className={"text-" + color + "-400"} />
        </div>
        {sub && (
          <span className={"text-xs font-medium px-2 py-0.5 rounded-full " +
            (sub.startsWith("+") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

export default function Overview({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p className="text-slate-500">No data available.</p>

  // Best metrics
  let bestTP = { v: 0 }, lowWait = { v: Infinity }, lowEmit = { v: Infinity }, bestSafe = { v: 0 }
  Object.entries(cmp).forEach(([sc, sd]) =>
    Object.entries(sd.agents).forEach(([ag, ad]) => {
      const m = ad.metrics
      if (m.avg_throughput > bestTP.v) bestTP = { v: m.avg_throughput, ag: AGENT_LABELS[ag], sc: SCENARIO_LABELS[sc] }
      if (m.avg_wait_time < lowWait.v) lowWait = { v: m.avg_wait_time, ag: AGENT_LABELS[ag], sc: SCENARIO_LABELS[sc] }
      if (m.avg_emissions < lowEmit.v) lowEmit = { v: m.avg_emissions, ag: AGENT_LABELS[ag], sc: SCENARIO_LABELS[sc] }
      if (m.avg_safety_score > bestSafe.v) bestSafe = { v: m.avg_safety_score, ag: AGENT_LABELS[ag], sc: SCENARIO_LABELS[sc] }
    })
  )

  // RL improvement vs Fixed Timer (normal scenario)
  const norm = cmp.normal?.agents
  const ftWait = norm?.fixed_timer?.metrics?.avg_wait_time || 1
  const qlWait = norm?.q_learning?.metrics?.avg_wait_time || 0
  const waitImprove = (((ftWait - qlWait) / ftWait) * 100).toFixed(1)

  const ftTP = norm?.fixed_timer?.metrics?.avg_throughput || 1
  const qlTP = norm?.q_learning?.metrics?.avg_throughput || 0
  const tpImprove = (((qlTP - ftTP) / ftTP) * 100).toFixed(1)

  // Bar chart
  const barData = norm ? Object.entries(norm).map(([ag, ad]) => ({
    name: AGENT_LABELS[ag], Throughput: ad.metrics.avg_throughput,
    "Wait Time": ad.metrics.avg_wait_time, Safety: ad.metrics.avg_safety_score,
  })) : []

  // Radar for normal scenario
  const radarData = [
    { metric: "Throughput", ...Object.fromEntries(Object.entries(norm || {}).map(([ag, ad]) => [AGENT_LABELS[ag], Math.min(100, (ad.metrics.avg_throughput / 6000) * 100)])) },
    { metric: "Low Wait", ...Object.fromEntries(Object.entries(norm || {}).map(([ag, ad]) => [AGENT_LABELS[ag], Math.max(0, 100 - ad.metrics.avg_wait_time / 100)])) },
    { metric: "Safety", ...Object.fromEntries(Object.entries(norm || {}).map(([ag, ad]) => [AGENT_LABELS[ag], ad.metrics.avg_safety_score])) },
    { metric: "Low Emissions", ...Object.fromEntries(Object.entries(norm || {}).map(([ag, ad]) => [AGENT_LABELS[ag], Math.max(0, 100 - ad.metrics.avg_emissions * 20)])) },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label={"Best Throughput (" + bestTP.ag + ")"} value={bestTP.v?.toFixed(0)} unit="veh" color="blue" glow="glow-blue" delay="0" sub={"+" + tpImprove + "% vs Fixed"} />
        <StatCard icon={Clock} label={"Lowest Wait (" + lowWait.ag + ")"} value={lowWait.v?.toFixed(1)} unit="steps" color="emerald" glow="glow-emerald" delay="1" sub={"+" + waitImprove + "% improved"} />
        <StatCard icon={Wind} label={"Lowest Emissions (" + lowEmit.ag + ")"} value={lowEmit.v?.toFixed(3)} unit="kg CO\u2082" color="amber" glow="glow-amber" delay="2" />
        <StatCard icon={Shield} label={"Best Safety (" + bestSafe.ag + ")"} value={bestSafe.v?.toFixed(1)} unit="/100" color="purple" glow="glow-purple" delay="3" />
      </div>

      {/* Dubai Grid Mini Map + Agent Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dubai Intersection Grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 fade-in">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Dubai 4\u00d74 Intersection Grid
          </h2>
          <svg viewBox="0 0 360 360" className="w-full">
            {/* Roads */}
            {[0,1,2,3].map(r => <line key={"h"+r} x1="30" y1={55+r*90} x2="330" y2={55+r*90} stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />)}
            {[0,1,2,3].map(c => <line key={"v"+c} x1={55+c*90} y1="30" x2={55+c*90} y2="330" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />)}
            {/* Intersections */}
            {INTERSECTION_NAMES.map((name, i) => {
              const r = Math.floor(i/4), c = i%4
              const cx = 55+c*90, cy = 55+r*90
              return (
                <g key={i}>
                  <rect x={cx-20} y={cy-14} width="40" height="28" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <circle cx={cx+12} cy={cy-6} r="3" fill="#22c55e" opacity="0.8" />
                  <circle cx={cx+12} cy={cy+6} r="3" fill="#ef4444" opacity="0.5" />
                  <text x={cx-2} y={cy+2} textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontWeight="500">{name}</text>
                  <text x={cx-2} y={cy+22} textAnchor="middle" fill="#475569" fontSize="4.5">INT-{String(i+1).padStart(2,"0")}</text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Agent Comparison Radar */}
        <div className="lg:col-span-3 glass rounded-2xl p-6 fade-in-d1">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Agent Performance Profile (Normal Scenario)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} domain={[0, 100]} />
              <Radar name="Fixed Timer" dataKey="Fixed Timer" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Q-Learning" dataKey="Q-Learning" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="SARSA" dataKey="SARSA" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass rounded-2xl p-6 fade-in-d2">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Normal Scenario — Metric Comparison
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Throughput" fill="#3b82f6" radius={[6,6,0,0]} />
            <Bar dataKey="Wait Time" fill="#f59e0b" radius={[6,6,0,0]} />
            <Bar dataKey="Safety" fill="#10b981" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full Results Table */}
      <div className="glass rounded-2xl p-6 overflow-x-auto fade-in-d3">
        <h2 className="text-sm font-semibold text-white mb-4">All Experiment Results</h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Scenario</th>
              <th className="pb-3 pr-4 font-medium">Agent</th>
              <th className="pb-3 pr-4 text-right font-medium">Throughput</th>
              <th className="pb-3 pr-4 text-right font-medium">Wait Time</th>
              <th className="pb-3 pr-4 text-right font-medium">Emissions (kg)</th>
              <th className="pb-3 text-right font-medium">Safety</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cmp).map(([sc, sd]) =>
              Object.entries(sd.agents).map(([ag, ad], i) => (
                <tr key={sc+ag} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  {i === 0 && (
                    <td className="py-3 pr-4 text-slate-300 font-medium align-top" rowSpan={Object.keys(sd.agents).length}>
                      {SCENARIO_LABELS[sc]}
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background: AGENT_COLORS[ag]}} />
                      <span className="text-slate-300">{AGENT_LABELS[ag]}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-300 font-mono text-xs">{ad.metrics.avg_throughput?.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-right text-slate-300 font-mono text-xs">{ad.metrics.avg_wait_time?.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-right text-slate-300 font-mono text-xs">{ad.metrics.avg_emissions?.toFixed(4)}</td>
                  <td className="py-3 text-right text-slate-300 font-mono text-xs">{ad.metrics.avg_safety_score?.toFixed(1)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
