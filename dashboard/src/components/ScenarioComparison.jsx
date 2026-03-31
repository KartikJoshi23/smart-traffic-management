import { useState } from "react"
import { GitCompare, ArrowUp, ArrowDown } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"

const AGENT_COLORS = { fixed_timer: "#ef4444", q_learning: "#3b82f6", sarsa: "#10b981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SCENARIO_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const tooltipStyle = { background: "rgba(13,20,36,0.95)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: 12, fontSize: 11 }

const METRIC_OPTS = [
  { key: "avg_throughput", label: "Throughput", unit: "vehicles", higher: true },
  { key: "avg_wait_time", label: "Wait Time", unit: "steps", higher: false },
  { key: "avg_emissions", label: "Emissions", unit: "kg CO\u2082", higher: false },
  { key: "avg_safety_score", label: "Safety Score", unit: "/100", higher: true },
]

export default function ScenarioComparison({ data }) {
  const cmp = data.scenario_comparison
  const [metric, setMetric] = useState("avg_throughput")
  if (!cmp) return <p className="text-slate-500">No comparison data.</p>

  const scenarios = Object.keys(cmp)
  const agents = ["fixed_timer", "q_learning", "sarsa"]
  const mInfo = METRIC_OPTS.find(m => m.key === metric)
  const isLower = !mInfo?.higher

  const chartData = scenarios.map(sc => {
    const e = { scenario: SCENARIO_LABELS[sc] || sc }
    agents.forEach(ag => { e[AGENT_LABELS[ag]] = cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0 })
    return e
  })

  // Heatmap
  const allVals = []
  scenarios.forEach(sc => agents.forEach(ag => allVals.push(cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0)))
  const minV = Math.min(...allVals), maxV = Math.max(...allVals)

  function heatColor(val) {
    const n = maxV === minV ? 0.5 : (val - minV) / (maxV - minV)
    const adj = isLower ? 1 - n : n
    return "hsl(" + (adj * 120) + ", 70%, " + (25 + adj * 15) + "%)"
  }

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="glass rounded-2xl p-4">
        <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wider">Metric</label>
        <div className="flex gap-1.5">
          {METRIC_OPTS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={"btn btn-ghost " + (metric === m.key ? "active" : "")}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare size={16} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white">{mInfo?.label} Across All Scenarios</h2>
          <span className="text-xs text-slate-600 ml-auto">{mInfo?.unit}</span>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="scenario" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {agents.map(ag => (
              <Bar key={ag} dataKey={AGENT_LABELS[ag]} fill={AGENT_COLORS[ag]} radius={[4,4,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Performance Heatmap — {mInfo?.label}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left pb-3 pr-4 font-medium">Scenario</th>
                {agents.map(ag => <th key={ag} className="pb-3 px-4 text-center font-medium">{AGENT_LABELS[ag]}</th>)}
              </tr>
            </thead>
            <tbody>
              {scenarios.map(sc => (
                <tr key={sc} className="border-t border-white/[0.03]">
                  <td className="py-3 pr-4 text-slate-300 font-medium">{SCENARIO_LABELS[sc]}</td>
                  {agents.map(ag => {
                    const val = cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0
                    return (
                      <td key={ag} className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: heatColor(val) }}>
                          {val?.toFixed(metric === "avg_emissions" ? 4 : 1)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-600">
          <span>{isLower ? "Better \u2192" : "\u2190 Worse"}</span>
          <div className="flex-1 h-1.5 rounded-full" style={{
            background: isLower
              ? "linear-gradient(to right, hsl(120,70%,35%), hsl(0,70%,30%))"
              : "linear-gradient(to right, hsl(0,70%,30%), hsl(120,70%,35%))"
          }} />
          <span>{isLower ? "\u2190 Worse" : "Better \u2192"}</span>
        </div>
      </div>

      {/* RL Improvement Table */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">RL Improvement Over Fixed Timer</h2>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Scenario</th>
              <th className="pb-3 pr-4 text-right font-medium">Q-Learning vs Fixed</th>
              <th className="pb-3 text-right font-medium">SARSA vs Fixed</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(sc => {
              const fx = cmp[sc]?.agents?.fixed_timer?.metrics?.[metric] ?? 0
              const ql = cmp[sc]?.agents?.q_learning?.metrics?.[metric] ?? 0
              const sa = cmp[sc]?.agents?.sarsa?.metrics?.[metric] ?? 0
              const pQL = fx ? ((ql - fx) / Math.abs(fx) * 100) : 0
              const pSA = fx ? ((sa - fx) / Math.abs(fx) * 100) : 0
              const qlOk = isLower ? pQL < 0 : pQL > 0
              const saOk = isLower ? pSA < 0 : pSA > 0
              return (
                <tr key={sc} className="border-b border-white/[0.03]">
                  <td className="py-3 pr-4 text-slate-300">{SCENARIO_LABELS[sc]}</td>
                  <td className="py-3 pr-4 text-right">
                    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold " +
                      (qlOk ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                      {qlOk ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {Math.abs(pQL).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold " +
                      (saOk ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                      {saOk ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {Math.abs(pSA).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
