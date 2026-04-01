import { useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area,
} from "recharts"

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const ttStyle = { background: "#19191c", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, color: "#f5f5f4", fontSize: 11 }

const METRICS = [
  { key: "episode_rewards", label: "Cumulative Reward", yLabel: "Reward", color: "#06B6D4" },
  { key: "avg_wait_times", label: "Avg Wait Time", yLabel: "Wait (steps)", color: "#F59E0B" },
  { key: "throughputs", label: "Throughput", yLabel: "Vehicles", color: "#10B981" },
  { key: "emissions", label: "Emissions", yLabel: "kg CO\u2082", color: "#EF4444" },
  { key: "safety_scores", label: "Safety Score", yLabel: "Score", color: "#8B5CF6" },
]

export default function TrainingCurves({ data }) {
  const training = data.training_results
  const [scenario, setScenario] = useState("rush_hour")
  const [metric, setMetric] = useState("episode_rewards")

  if (!training) return <p style={{ color: "var(--text-label)" }}>No training data available</p>

  const scData = training[scenario]
  if (!scData) return <p style={{ color: "var(--text-label)" }}>No data for this scenario</p>

  // Build chart data
  const numEpisodes = scData.fixed_timer?.history?.episode_rewards?.length || 0
  const chartData = []
  for (let i = 0; i < numEpisodes; i++) {
    const point = { episode: i + 1 }
    for (const ag of ["fixed_timer", "q_learning", "sarsa"]) {
      if (scData[ag]?.history?.[metric]) {
        point[AGENT_LABELS[ag]] = scData[ag].history[metric][i]
      }
    }
    chartData.push(point)
  }

  // Epsilon data
  const epsilonData = []
  for (let i = 0; i < numEpisodes; i++) {
    const pt = { episode: i + 1 }
    for (const ag of ["q_learning", "sarsa"]) {
      if (scData[ag]?.history?.epsilons) pt[AGENT_LABELS[ag]] = scData[ag].history.epsilons[i]
    }
    epsilonData.push(pt)
  }

  const metricInfo = METRICS.find(m => m.key === metric) || METRICS[0]

  // Final metrics table
  const finalMetrics = Object.entries(scData).map(([ag, d]) => ({
    agent: AGENT_LABELS[ag],
    color: AGENT_COLORS[ag],
    reward: d.final_metrics.avg_reward,
    wait: d.final_metrics.avg_wait_time,
    throughput: d.final_metrics.avg_throughput,
    emissions: d.final_metrics.avg_emissions,
    safety: d.final_metrics.avg_safety_score,
  }))

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div className="card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--text-label)", fontWeight: 600 }}>Scenario:</span>
        {Object.entries(SC_LABELS).map(([k, v]) => (
          <button key={k} className={`btn btn-sm ${scenario === k ? "btn-outline active" : "btn-outline"}`}
            onClick={() => setScenario(k)}>{v}</button>
        ))}
        <div style={{ width: 1, height: 20, background: "var(--border-medium)", margin: "0 4px" }} />
        <span style={{ fontSize: 11, color: "var(--text-label)", fontWeight: 600 }}>Metric:</span>
        {METRICS.map(m => (
          <button key={m.key} className={`btn btn-sm ${metric === m.key ? "btn-outline active" : "btn-outline"}`}
            onClick={() => setMetric(m.key)}>{m.label}</button>
        ))}
      </div>

      {/* Main Chart */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: metricInfo.color }} />
          {metricInfo.label} {"\u2014"} {SC_LABELS[scenario]} ({numEpisodes} Episodes)
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="episode" tick={{ fill: "#a8a29e", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Episode", position: "insideBottom", offset: -5, fill: "#78716c", fontSize: 10 }} />
            <YAxis tick={{ fill: "#a8a29e", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: metricInfo.yLabel, angle: -90, position: "insideLeft", fill: "#78716c", fontSize: 10 }} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#a8a29e" }} />
            {Object.entries(AGENT_COLORS).map(([ag, color]) => (
              <Line key={ag} type="monotone" dataKey={AGENT_LABELS[ag]}
                stroke={color} strokeWidth={1.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Epsilon + Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--gold)" }} />
            Exploration Rate ({"\u03B5"}-Decay)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={epsilonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="episode" tick={{ fill: "#a8a29e", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a8a29e", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="Q-Learning" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
              <Area type="monotone" dataKey="SARSA" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--teal)" }} />
            Final Performance (Last 50 Episodes)
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th><th style={{ textAlign: "right" }}>Reward</th>
                <th style={{ textAlign: "right" }}>Wait</th><th style={{ textAlign: "right" }}>Throughput</th>
                <th style={{ textAlign: "right" }}>Safety</th>
              </tr>
            </thead>
            <tbody>
              {finalMetrics.map((r, i) => (
                <tr key={i}>
                  <td><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: r.color, marginRight: 6 }} />{r.agent}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{r.reward.toFixed(0)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{r.wait.toFixed(0)}</td>
                  <td className="mono highlight" style={{ textAlign: "right" }}>{r.throughput.toFixed(0)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{r.safety.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}