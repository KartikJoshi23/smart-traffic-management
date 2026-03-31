import { useState } from "react"
import { GitCompare, ArrowUp, ArrowDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

const AGENT_COLORS = { fixed_timer: "#FF4057", q_learning: "#4A90FF", sarsa: "#00E68C" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const ttStyle = { background: "#0B0F14", border: "1px solid rgba(148,163,184,0.10)", borderRadius: 12, color: "#F0F4F8", fontSize: 11 }

const METRIC_OPTS = [
  { key: "avg_throughput", label: "Throughput", unit: "vehicles", higher: true },
  { key: "avg_wait_time", label: "Wait Time", unit: "steps", higher: false },
  { key: "avg_emissions", label: "Emissions", unit: "kg CO\u2082", higher: false },
  { key: "avg_safety_score", label: "Safety Score", unit: "/ 100", higher: true },
]

export default function ScenarioComparison({ data }) {
  const cmp = data.scenario_comparison
  const [metric, setMetric] = useState("avg_throughput")
  if (!cmp) return <p style={{ color: "var(--text-label)" }}>No comparison data.</p>

  const scenarios = Object.keys(cmp)
  const agents = ["fixed_timer", "q_learning", "sarsa"]
  const mInfo = METRIC_OPTS.find(m => m.key === metric)
  const isLower = !mInfo?.higher

  const chartData = scenarios.map(sc => {
    const e = { scenario: SC_LABELS[sc] || sc }
    agents.forEach(ag => { e[AGENT_LABELS[ag]] = cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0 })
    return e
  })

  const allVals = []
  scenarios.forEach(sc => agents.forEach(ag => allVals.push(cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0)))
  const minV = Math.min(...allVals), maxV = Math.max(...allVals)

  function heatBg(val) {
    const n = maxV === minV ? 0.5 : (val - minV) / (maxV - minV)
    const adj = isLower ? 1 - n : n
    const h = adj * 120
    return { bg: "hsl(" + h + ", 65%, 18%)", text: "hsl(" + h + ", 80%, 65%)", border: "hsl(" + h + ", 60%, 28%)" }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Metric Selector */}
      <div className="card card-compact">
        <div className="section-subtitle">Select Metric</div>
        <div style={{ display: "flex", gap: 6 }}>
          {METRIC_OPTS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={"btn btn-outline " + (metric === m.key ? "active" : "")}>
              {m.label}
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>({m.unit})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card">
        <div className="section-title">
          <GitCompare size={16} style={{ color: "var(--purple)" }} />
          {mInfo?.label} Across All Scenarios
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} barGap={3} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
            <XAxis dataKey="scenario" stroke="#64748B" tick={{ fill: "#CBD5E1", fontSize: 12 }} />
            <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1" }} />
            {agents.map(ag => (
              <Bar key={ag} dataKey={AGENT_LABELS[ag]} fill={AGENT_COLORS[ag]} radius={[5,5,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--gold)" }} />
          Performance Heatmap \u2014 {mInfo?.label}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                {agents.map(ag => <th key={ag} style={{ textAlign: "center" }}>{AGENT_LABELS[ag]}</th>)}
              </tr>
            </thead>
            <tbody>
              {scenarios.map(sc => (
                <tr key={sc}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{SC_LABELS[sc]}</td>
                  {agents.map(ag => {
                    const val = cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0
                    const h = heatBg(val)
                    return (
                      <td key={ag} style={{ textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "6px 14px", borderRadius: 8,
                          background: h.bg, color: h.text, border: "1px solid " + h.border,
                          fontWeight: 700, fontSize: 12, fontFamily: "monospace",
                        }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>
          <span>{isLower ? "Better \u2192" : "\u2190 Worse"}</span>
          <div style={{
            flex: 1, height: 6, borderRadius: 6,
            background: isLower
              ? "linear-gradient(to right, hsl(120,65%,22%), hsl(0,65%,22%))"
              : "linear-gradient(to right, hsl(0,65%,22%), hsl(120,65%,22%))"
          }} />
          <span>{isLower ? "\u2190 Worse" : "Better \u2192"}</span>
        </div>
      </div>

      {/* RL Improvement */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--green)" }} />
          RL Improvement Over Fixed Timer
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th className="text-right">Q-Learning vs Fixed</th>
              <th className="text-right">SARSA vs Fixed</th>
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
                <tr key={sc}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{SC_LABELS[sc]}</td>
                  <td className="text-right">
                    <span className={"badge " + (qlOk ? "badge-green" : "badge-red")}>
                      {qlOk ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {Math.abs(pQL).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={"badge " + (saOk ? "badge-green" : "badge-red")}>
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
