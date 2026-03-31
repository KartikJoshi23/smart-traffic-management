import { useState } from "react"
import { TrendingUp } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart,
} from "recharts"

const AGENT_COLORS = { fixed_timer: "#ef4444", q_learning: "#3b82f6", sarsa: "#10b981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SCENARIO_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const tooltipStyle = { background: "rgba(13,20,36,0.95)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: 12, fontSize: 11 }

const METRICS = [
  { key: "episode_rewards", label: "Cumulative Reward" },
  { key: "avg_wait_times", label: "Avg Wait Time" },
  { key: "throughputs", label: "Throughput" },
  { key: "emissions", label: "CO\u2082 Emissions" },
  { key: "safety_scores", label: "Safety Score" },
]

export default function TrainingCurves({ data }) {
  const training = data.training_results
  const [scenario, setScenario] = useState("normal")
  const [metric, setMetric] = useState("episode_rewards")

  if (!training) return <p className="text-slate-500">No training data.</p>
  const scData = training[scenario]
  if (!scData) return <p className="text-slate-500">No data for scenario.</p>

  const agents = Object.keys(scData)
  const numEp = scData[agents[0]]?.history?.[metric]?.length || 0

  const chartData = Array.from({ length: numEp }, (_, i) => {
    const pt = { episode: i + 1 }
    agents.forEach(ag => { pt[AGENT_LABELS[ag]] = scData[ag]?.history?.[metric]?.[i] ?? 0 })
    return pt
  })

  const epsilonData = Array.from({ length: numEp }, (_, i) => ({
    episode: i + 1,
    "Q-Learning": scData.q_learning?.history?.epsilons?.[i] ?? 0,
    "SARSA": scData.sarsa?.history?.epsilons?.[i] ?? 0,
  }))

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wider">Scenario</label>
          <div className="flex gap-1">
            {Object.keys(training).map(sc => (
              <button key={sc} onClick={() => setScenario(sc)}
                className={"btn btn-ghost text-xs " + (scenario === sc ? "active" : "")}>
                {SCENARIO_LABELS[sc] || sc}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wider">Metric</label>
          <div className="flex gap-1">
            {METRICS.map(m => (
              <button key={m.key} onClick={() => setMetric(m.key)}
                className={"btn btn-ghost text-xs " + (metric === m.key ? "active" : "")}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-blue-400" />
          <h2 className="text-sm font-semibold text-white">
            {METRICS.find(m => m.key === metric)?.label} — {SCENARIO_LABELS[scenario]}
          </h2>
          <span className="text-xs text-slate-600 ml-auto">{numEp} episodes &middot; 200 steps each</span>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData}>
            <defs>
              {agents.map(ag => (
                <linearGradient key={ag} id={"grad_" + ag} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AGENT_COLORS[ag]} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={AGENT_COLORS[ag]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="episode" stroke="#475569" tick={{ fontSize: 11 }} label={{ value: "Episode", position: "insideBottomRight", offset: -5, style: { fill: "#64748b", fontSize: 11 } }} />
            <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {agents.map(ag => (
              <Area key={ag} type="monotone" dataKey={AGENT_LABELS[ag]}
                stroke={AGENT_COLORS[ag]} strokeWidth={2} fill={"url(#grad_" + ag + ")"} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Epsilon Decay */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          Exploration Rate (\u03b5) Decay
          <span className="text-xs text-slate-600 font-normal ml-auto">\u03b5-greedy policy &middot; decay=0.995</span>
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={epsilonData}>
            <defs>
              <linearGradient id="epsGradQ" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="episode" stroke="#475569" tick={{ fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10 }} domain={[0, 1]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Q-Learning" stroke="#3b82f6" fill="url(#epsGradQ)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="SARSA" stroke="#10b981" fill="transparent" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Final Performance Table */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">
          Converged Performance (Last 50 Episodes) — {SCENARIO_LABELS[scenario]}
        </h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Agent</th>
              <th className="pb-3 pr-4 text-right font-medium">Avg Reward</th>
              <th className="pb-3 pr-4 text-right font-medium">Throughput</th>
              <th className="pb-3 pr-4 text-right font-medium">Wait Time</th>
              <th className="pb-3 pr-4 text-right font-medium">Emissions</th>
              <th className="pb-3 text-right font-medium">Safety</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(ag => {
              const fm = scData[ag]?.final_metrics
              if (!fm) return null
              return (
                <tr key={ag} className="border-b border-white/[0.03]">
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{background: AGENT_COLORS[ag]}} />
                      <span className="text-slate-300 font-medium">{AGENT_LABELS[ag]}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-slate-300">{fm.avg_reward?.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-slate-300">{fm.avg_throughput?.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-slate-300">{fm.avg_wait_time?.toFixed(1)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-slate-300">{fm.avg_emissions?.toFixed(4)}</td>
                  <td className="py-3 text-right font-mono text-xs text-slate-300">{fm.avg_safety_score?.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
