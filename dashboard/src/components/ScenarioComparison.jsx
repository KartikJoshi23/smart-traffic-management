import { useState } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const SCENARIOS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const AGENTS = { fixed_timer: { label: "Fixed Timer", color: "#EF4444" }, q_learning: { label: "Q-Learning", color: "#3B82F6" }, sarsa: { label: "SARSA", color: "#10B981" } }
const METRICS = ["avg_throughput", "avg_wait_time", "avg_emissions", "avg_safety_score"]
const METRIC_LABELS = { avg_throughput: "Throughput", avg_wait_time: "Wait Time", avg_emissions: "Emissions", avg_safety_score: "Safety" }
const HIGHER_BETTER = { avg_throughput: true, avg_wait_time: false, avg_emissions: false, avg_safety_score: true }

function getHeatColor(value, min, max, higherBetter) {
  const ratio = max === min ? 0.5 : (value - min) / (max - min)
  const r = higherBetter ? ratio : 1 - ratio
  if (r > 0.7) return { bg: "rgba(16,185,129,0.12)", text: "#34D399" }
  if (r > 0.4) return { bg: "rgba(245,158,11,0.10)", text: "#FBBF24" }
  return { bg: "rgba(239,68,68,0.10)", text: "#F87171" }
}

export default function ScenarioComparison({ data }) {
  const cmp = data.scenario_comparison
  const [selectedMetric, setSelectedMetric] = useState("avg_throughput")
  if (!cmp) return <p style={{ color: "var(--text-tertiary)" }}>No data</p>

  // Build table data
  const rows = []
  Object.entries(SCENARIOS).forEach(([sk, sl]) => {
    const sd = cmp[sk]
    if (!sd) return
    Object.entries(AGENTS).forEach(([ak, am]) => {
      const ad = sd.agents?.[ak]
      if (!ad) return
      rows.push({ scenario: sl, agent: am.label, agentColor: am.color, metrics: ad.metrics })
    })
  })

  // Get min/max for heatmap
  const allVals = {}
  METRICS.forEach(m => {
    const vals = rows.map(r => r.metrics[m]).filter(v => v != null)
    allVals[m] = { min: Math.min(...vals), max: Math.max(...vals) }
  })

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {METRICS.map(m => (
          <button key={m} onClick={() => setSelectedMetric(m)} className={`btn btn-sm ${selectedMetric === m ? "btn-outline active" : "btn-outline"}`}>
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="card">
        <div className="section-title">
          <span className="section-dot" style={{ background: "var(--violet)" }} />
          {METRIC_LABELS[selectedMetric]} Across Scenarios
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                {Object.values(AGENTS).map(a => <th key={a.label}><span style={{ color: a.color }}>●</span> {a.label}</th>)}
                <th>Best</th>
                <th>RL Improvement</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCENARIOS).map(([sk, sl]) => {
                const sd = cmp[sk]
                if (!sd) return null
                const vals = Object.entries(AGENTS).map(([ak]) => ({
                  key: ak,
                  val: sd.agents?.[ak]?.metrics?.[selectedMetric] ?? 0
                }))
                const hb = HIGHER_BETTER[selectedMetric]
                const bestEntry = hb ? vals.reduce((a,b) => a.val > b.val ? a : b) : vals.reduce((a,b) => a.val < b.val ? a : b)
                const ft = vals.find(v => v.key === "fixed_timer")?.val || 1
                const bestRL = vals.filter(v => v.key !== "fixed_timer")
                const bestRLVal = hb ? Math.max(...bestRL.map(v => v.val)) : Math.min(...bestRL.map(v => v.val))
                const impPct = hb ? ((bestRLVal - ft) / ft * 100).toFixed(1) : ((ft - bestRLVal) / ft * 100).toFixed(1)
                const impPositive = parseFloat(impPct) > 0

                return (
                  <tr key={sk}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sl}</td>
                    {vals.map(v => {
                      const { bg, text } = getHeatColor(v.val, allVals[selectedMetric].min, allVals[selectedMetric].max, hb)
                      const isBest = v.key === bestEntry.key
                      return (
                        <td key={v.key} className="mono" style={{ background: bg, color: text, fontWeight: isBest ? 700 : 400 }}>
                          {v.val.toFixed(1)} {isBest && "★"}
                        </td>
                      )
                    })}
                    <td style={{ color: AGENTS[bestEntry.key].color, fontWeight: 600, fontSize: 11 }}>{AGENTS[bestEntry.key].label}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: impPositive ? "var(--green-light)" : "var(--red-light)" }}>
                        {impPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {impPct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Detail Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {Object.entries(SCENARIOS).map(([sk, sl]) => {
          const sd = cmp[sk]
          if (!sd) return null
          return (
            <div key={sk} className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{sl}</div>
              {Object.entries(AGENTS).map(([ak, am]) => {
                const m = sd.agents?.[ak]?.metrics
                if (!m) return null
                return (
                  <div key={ak} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: 11, color: am.color, fontWeight: 600 }}>{am.label}</span>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-secondary)", fontFamily: "'SF Mono', monospace" }}>
                      <span>TP: {m.avg_throughput?.toFixed(0)}</span>
                      <span>WT: {m.avg_wait_time?.toFixed(0)}</span>
                      <span>SF: {m.avg_safety_score?.toFixed(1)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
