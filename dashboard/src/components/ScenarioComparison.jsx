import { useState } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const SCENARIOS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const AGENTS = { fixed_timer: { label: "Fixed Timer", color: "#ef4444" }, q_learning: { label: "Q-Learning", color: "#3b82f6" }, sarsa: { label: "SARSA", color: "#22c55e" } }
const METRICS = ["avg_throughput", "avg_wait_time", "avg_emissions", "avg_safety_score"]
const LABELS = { avg_throughput: "Throughput", avg_wait_time: "Wait Time", avg_emissions: "Emissions", avg_safety_score: "Safety" }
const HIGHER = { avg_throughput: true, avg_wait_time: false, avg_emissions: false, avg_safety_score: true }
const METRIC_COLORS = { avg_throughput: "#3b82f6", avg_wait_time: "#ef4444", avg_emissions: "#f59e0b", avg_safety_score: "#22c55e" }

function heat(val, min, max, hb) {
  const r = max === min ? 0.5 : (val - min) / (max - min)
  const n = hb ? r : 1 - r
  if (n > 0.66) return { bg: "rgba(34,197,94,0.12)", fg: "#4ade80" }
  if (n > 0.33) return { bg: "rgba(245,158,11,0.10)", fg: "#fbbf24" }
  return { bg: "rgba(239,68,68,0.10)", fg: "#f87171" }
}

export default function ScenarioComparison({ data }) {
  const cmp = data.scenario_comparison
  const [met, setMet] = useState("avg_throughput")
  if (!cmp) return <p style={{ color: "var(--text-muted)" }}>No data</p>

  const rows = []
  Object.entries(SCENARIOS).forEach(([sk, sl]) => {
    const sd = cmp[sk]
    if (!sd) return
    Object.entries(AGENTS).forEach(([ak, am]) => {
      const ad = sd.agents?.[ak]
      if (ad) rows.push({ scenario: sl, agent: am.label, agentColor: am.color, metrics: ad.metrics })
    })
  })

  const vals = {}
  METRICS.forEach(m => {
    const v = rows.map(r => r.metrics[m]).filter(x => x != null)
    vals[m] = { min: Math.min(...v), max: Math.max(...v) }
  })

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 5 }}>
        {METRICS.map(m => (
          <button key={m} onClick={() => setMet(m)}
            className={"btn btn-sm " + (met === m ? "btn-ghost active" : "btn-ghost")}
            style={met === m ? { borderColor: METRIC_COLORS[m], color: METRIC_COLORS[m] } : {}}>
            {LABELS[m]}
          </button>
        ))}
      </div>

      <div className="card card-violet">
        <div className="section-head">
          <div className="section-icon" style={{ background: "rgba(168,85,247,0.12)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>
          </div>
          {LABELS[met]} Across All Scenarios
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                {Object.values(AGENTS).map(a => <th key={a.label}><span style={{ color: a.color }}>{String.fromCharCode(9679)}</span> {a.label}</th>)}
                <th>Best Agent</th>
                <th>RL Improvement</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCENARIOS).map(([sk, sl]) => {
                const sd = cmp[sk]
                if (!sd) return null
                const v = Object.entries(AGENTS).map(([ak]) => ({ k: ak, v: sd.agents?.[ak]?.metrics?.[met] ?? 0 }))
                const hb = HIGHER[met]
                const best = hb ? v.reduce((a,b) => a.v > b.v ? a : b) : v.reduce((a,b) => a.v < b.v ? a : b)
                const ft = v.find(x => x.k === "fixed_timer")?.v || 1
                const rl = v.filter(x => x.k !== "fixed_timer")
                const rlBest = hb ? Math.max(...rl.map(x => x.v)) : Math.min(...rl.map(x => x.v))
                const pct = hb ? ((rlBest - ft) / ft * 100).toFixed(1) : ((ft - rlBest) / ft * 100).toFixed(1)
                const pos = +pct > 0

                return (
                  <tr key={sk}>
                    <td style={{ fontWeight: 700, color: "var(--text-white)" }}>{sl}</td>
                    {v.map(x => {
                      const h = heat(x.v, vals[met].min, vals[met].max, hb)
                      return (
                        <td key={x.k} className="mono" style={{ background: h.bg, color: h.fg, fontWeight: x.k === best.k ? 800 : 400 }}>
                          {x.v.toFixed(1)} {x.k === best.k ? String.fromCharCode(9733) : ""}
                        </td>
                      )
                    })}
                    <td style={{ color: AGENTS[best.k].color, fontWeight: 700, fontSize: 11 }}>{AGENTS[best.k].label}</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700,
                        color: pos ? "#4ade80" : "#f87171" }}>
                        {pos ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>} {pct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {Object.entries(SCENARIOS).map(([sk, sl]) => {
          const sd = cmp[sk]
          if (!sd) return null
          const scColors = { normal: "#3b82f6", rush_hour: "#ef4444", incident: "#f97316", event: "#a855f7", bus_priority: "#22c55e" }
          return (
            <div key={sk} className="card" style={{ padding: 18, borderTop: "3px solid " + (scColors[sk] || "#3b82f6") }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-white)", marginBottom: 12 }}>{sl}</div>
              {Object.entries(AGENTS).map(([ak, am]) => {
                const m = sd.agents?.[ak]?.metrics
                if (!m) return null
                return (
                  <div key={ak} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: "1px solid var(--border-dim)" }}>
                    <span style={{ fontSize: 12, color: am.color, fontWeight: 700 }}>{am.label}</span>
                    <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      <span>TP:<span style={{ color: "#3b82f6", fontWeight: 700 }}>{m.avg_throughput?.toFixed(0)}</span></span>
                      <span>WT:<span style={{ color: "#ef4444", fontWeight: 700 }}>{m.avg_wait_time?.toFixed(0)}</span></span>
                      <span>SF:<span style={{ color: "#22c55e", fontWeight: 700 }}>{m.avg_safety_score?.toFixed(1)}</span></span>
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
