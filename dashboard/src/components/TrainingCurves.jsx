import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart } from "recharts"

const SCENARIOS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const AGENTS = { q_learning: { label: "Q-Learning", color: "#3B82F6" }, sarsa: { label: "SARSA", color: "#10B981" } }
const METRICS = { rewards: "Cumulative Reward", avg_wait: "Avg Wait Time", avg_throughput: "Avg Throughput", epsilon: "Exploration Rate (ε)" }
const ttStyle = { background: "#1e1e21", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#f4f4f5" }

export default function TrainingCurves({ data }) {
  const results = data.training_results
  const [scenario, setScenario] = useState("rush_hour")
  const [metric, setMetric] = useState("rewards")

  if (!results) return <p style={{ color: "var(--text-tertiary)" }}>No training data</p>

  const scenarioData = results[scenario] || {}
  // Data is at scenarioData[agent].history.{episode_rewards, avg_wait_times, throughputs, epsilons}
  const qlH = scenarioData.q_learning?.history
  const saH = scenarioData.sarsa?.history
  const numEpisodes = qlH?.episode_rewards?.length || saH?.episode_rewards?.length || 0
  const METRIC_KEYS = { rewards: "episode_rewards", avg_wait: "avg_wait_times", avg_throughput: "throughputs", epsilon: "epsilons" }
  const chartData = Array.from({ length: numEpisodes }, (_, i) => {
    const point = { episode: i + 1 }
    Object.entries(AGENTS).forEach(([key, a]) => {
      const h = scenarioData[key]?.history
      if (h) {
        const arr = h[METRIC_KEYS[metric]]
        if (arr) point[a.label] = arr[i]
      }
    })
    return point
  })

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(SCENARIOS).map(([k, v]) => (
            <button key={k} onClick={() => setScenario(k)} className={`btn btn-sm ${scenario === k ? "btn-outline active" : "btn-outline"}`}>{v}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(METRICS).map(([k, v]) => (
            <button key={k} onClick={() => setMetric(k)} className={`btn btn-sm ${metric === k ? "btn-outline active" : "btn-outline"}`}>{v}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <span className="section-dot" style={{ background: "var(--amber)" }} />
          {METRICS[metric]} — {SCENARIOS[scenario]}
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="episode" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Episode", position: "insideBottom", offset: -5, fill: "#71717a", fontSize: 11 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Q-Learning" stroke="#3B82F6" fill="url(#gradBlue)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="SARSA" stroke="#10B981" fill="url(#gradGreen)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {Object.entries(AGENTS).map(([key, a]) => {
          const h = scenarioData[key]?.history
          if (!h) return null
          const rews = h.episode_rewards || []
          const eps = h.epsilons || []
          const finalReward = rews.length ? rews[rews.length - 1]?.toFixed(1) : "N/A"
          const bestReward = rews.length ? Math.max(...rews).toFixed(1) : "N/A"
          const finalEps = eps.length ? eps[eps.length - 1]?.toFixed(3) : "N/A"
          return (
            <div key={key} className="metric-card" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: a.color, marginBottom: 8 }}>{a.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div><div className="metric-label">Final Reward</div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{finalReward}</div></div>
                <div><div className="metric-label">Best Reward</div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{bestReward}</div></div>
                <div><div className="metric-label">Final Epsilon</div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{finalEps}</div></div>
                <div><div className="metric-label">Episodes</div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{rews.length}</div></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
