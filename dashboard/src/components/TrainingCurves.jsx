import { useState } from "react"
import { TrendingUp, BookOpen } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

const AGENT_COLORS = { fixed_timer: "#FF4057", q_learning: "#4A90FF", sarsa: "#00E68C" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const ttStyle = { background: "#0B0F14", border: "1px solid rgba(148,163,184,0.10)", borderRadius: 12, color: "#F0F4F8", fontSize: 11 }

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

  if (!training) return <p style={{ color: "var(--text-label)" }}>No training data.</p>
  const scData = training[scenario]
  if (!scData) return <p style={{ color: "var(--text-label)" }}>No data for scenario.</p>

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Selectors */}
      <div className="card card-compact" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div className="section-subtitle">Scenario</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.keys(training).map(sc => (
              <button key={sc} onClick={() => setScenario(sc)}
                className={"btn btn-sm btn-outline " + (scenario === sc ? "active" : "")}>
                {SC_LABELS[sc] || sc}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-subtitle">Metric</div>
          <div style={{ display: "flex", gap: 6 }}>
            {METRICS.map(m => (
              <button key={m.key} onClick={() => setMetric(m.key)}
                className={"btn btn-sm btn-outline " + (metric === m.key ? "active" : "")}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card">
        <div className="section-title">
          <TrendingUp size={16} style={{ color: "var(--blue)" }} />
          {METRICS.find(m => m.key === metric)?.label}{" \u2014 "}{SC_LABELS[scenario]}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>{numEp}{" episodes · 200 steps each"}</span>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData}>
            <defs>
              {agents.map(ag => (
                <linearGradient key={ag} id={"tg_" + ag} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AGENT_COLORS[ag]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={AGENT_COLORS[ag]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
            <XAxis dataKey="episode" stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }}
              label={{ value: "Episode", position: "insideBottomRight", offset: -5, style: { fill: "#64748B", fontSize: 11 } }} />
            <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1", paddingTop: 12 }} />
            {agents.map(ag => (
              <Area key={ag} type="monotone" dataKey={AGENT_LABELS[ag]}
                stroke={AGENT_COLORS[ag]} strokeWidth={2.5} fill={"url(#tg_" + ag + ")"} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Epsilon Decay */}
      <div className="card">
        <div className="section-title">
          <BookOpen size={16} style={{ color: "var(--purple)" }} />
          {"Exploration Rate (\u03b5) Decay"}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>{"\u03b5-greedy · decay = 0.995"}</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={epsilonData}>
            <defs>
              <linearGradient id="epsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
            <XAxis dataKey="episode" stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 10 }} domain={[0, 1]} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#CBD5E1" }} />
            <Area type="monotone" dataKey="Q-Learning" stroke="#3B82F6" fill="url(#epsGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="SARSA" stroke="#10B981" fill="transparent" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Final Performance */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--gold)" }} />
          Converged Performance (Last 50 Episodes) \u2014 {SC_LABELS[scenario]}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th className="text-right">Avg Reward</th>
              <th className="text-right">Throughput</th>
              <th className="text-right">Wait Time</th>
              <th className="text-right">Emissions</th>
              <th className="text-right">Safety</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(ag => {
              const fm = scData[ag]?.final_metrics
              if (!fm) return null
              return (
                <tr key={ag}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: AGENT_COLORS[ag] }} />
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{AGENT_LABELS[ag]}</span>
                    </span>
                  </td>
                  <td className="text-right mono">{fm.avg_reward?.toFixed(1)}</td>
                  <td className="text-right mono">{fm.avg_throughput?.toFixed(1)}</td>
                  <td className="text-right mono">{fm.avg_wait_time?.toFixed(1)}</td>
                  <td className="text-right mono">{fm.avg_emissions?.toFixed(4)}</td>
                  <td className="text-right mono">{fm.avg_safety_score?.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
