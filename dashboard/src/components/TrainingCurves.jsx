import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

const SCENARIOS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const AGENTS = { q_learning: { label: "Q-Learning", color: "#3b82f6" }, sarsa: { label: "SARSA", color: "#22c55e" }, coordinated_q_learning: { label: "Coord. Q-Learning", color: "#06b6d4" }, coordinated_sarsa: { label: "Coord. SARSA", color: "#8b5cf6" } }
const METRICS = { rewards: "Cumulative Reward", avg_wait: "Avg Wait Time", avg_throughput: "Throughput", epsilon: "Exploration Rate" }
const METRIC_KEYS = { rewards: "episode_rewards", avg_wait: "avg_wait_times", avg_throughput: "throughputs", epsilon: "epsilons" }
const TT = { background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e4e4e7", fontSize: 12 }

export default function TrainingCurves({ data }) {
  const results = data.training_results
  const [scenario, setScenario] = useState("rush_hour")
  const [metric, setMetric] = useState("rewards")

  if (!results) return <p style={{ color: "var(--text-muted)" }}>No training data</p>

  const sd = results[scenario] || {}
  const qlH = sd.q_learning?.history
  const saH = sd.sarsa?.history
  const cqH = sd.coordinated_q_learning?.history
  const csH = sd.coordinated_sarsa?.history
  const n = qlH?.episode_rewards?.length || saH?.episode_rewards?.length || cqH?.episode_rewards?.length || csH?.episode_rewards?.length || 0

  const chartData = Array.from({ length: n }, (_, i) => {
    const pt = { episode: i + 1 }
    Object.entries(AGENTS).forEach(([k, a]) => {
      const h = sd[k]?.history
      if (h) { const arr = h[METRIC_KEYS[metric]]; if (arr) pt[a.label] = arr[i] }
    })
    return pt
  })

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(SCENARIOS).map(([k, v]) => (
            <button key={k} onClick={() => setScenario(k)}
              className={"btn btn-sm " + (scenario === k ? "btn-ghost active" : "btn-ghost")}
              style={scenario === k ? { borderColor: "#f59e0b", color: "#f59e0b" } : {}}>{v}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(METRICS).map(([k, v]) => (
            <button key={k} onClick={() => setMetric(k)}
              className={"btn btn-sm " + (metric === k ? "btn-ghost active" : "btn-ghost")}>{v}</button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card card-amber">
        <div className="section-head">
          <div className="section-icon" style={{ background: "rgba(245,158,11,0.12)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          {METRICS[metric]} \u2014 {SCENARIOS[scenario]}
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gViolet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="episode" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false}
              label={{ value: "Episode", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 11 }}/>
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={TT}/>
            <Legend wrapperStyle={{ fontSize: 11 }}/>
            <Area type="monotone" dataKey="Q-Learning" stroke="#3b82f6" fill="url(#gBlue)" strokeWidth={2} dot={false}/>
            <Area type="monotone" dataKey="SARSA" stroke="#22c55e" fill="url(#gGreen)" strokeWidth={2} dot={false}/>
            <Area type="monotone" dataKey="Coord. Q-Learning" stroke="#06b6d4" fill="url(#gCyan)" strokeWidth={2} dot={false}/>
            <Area type="monotone" dataKey="Coord. SARSA" stroke="#8b5cf6" fill="url(#gViolet)" strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {Object.entries(AGENTS).map(([k, a]) => {
          const h = sd[k]?.history
          if (!h) return null
          const rews = h.episode_rewards || []
          const eps = h.epsilons || []
          return (
            <div key={k} className="card" style={{ padding: 18, borderLeft: "3px solid " + a.color }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: a.color, marginBottom: 12 }}>{a.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { l: "Final Reward", v: rews.length ? rews[rews.length-1].toFixed(1) : "N/A" },
                  { l: "Best Reward", v: rews.length ? Math.max(...rews).toFixed(1) : "N/A" },
                  { l: "Final Epsilon", v: eps.length ? eps[eps.length-1].toFixed(3) : "N/A" },
                  { l: "Episodes", v: rews.length },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="metric-label">{m.l}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-white)" }}>{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
