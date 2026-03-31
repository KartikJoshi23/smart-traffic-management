import { useState } from "react"
import { Download } from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

const AGENT_COLORS = { "Fixed Timer": "#EF4444", "Q-Learning": "#3B82F6", "SARSA": "#10B981", "Q-Learning + Bus Priority": "#6366F1", "SARSA + Bus Priority": "#14B8A6" }
const SC_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const ttStyle = { background: "#0C1220", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 10, color: "#F1F5F9", fontSize: 11 }

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(mcdm, scenario) {
  const results = mcdm[scenario]
  if (!results) return
  const headers = ["Policy", "WSM Score", "TOPSIS Score", "WSM Rank", "TOPSIS Rank", "Throughput", "Safety", "Emissions", "Bus Delay"]
  const rows = [headers.join(",")]
  Object.entries(results.wsm_scores || {}).forEach(([policy]) => {
    rows.push([
      policy,
      results.wsm_scores[policy]?.toFixed(4),
      results.topsis_scores?.[policy]?.toFixed(4),
      results.wsm_ranking?.indexOf(policy) + 1,
      results.topsis_ranking?.indexOf(policy) + 1,
      results.normalized_matrix?.[policy]?.throughput?.toFixed(4),
      results.normalized_matrix?.[policy]?.safety_score?.toFixed(4),
      results.normalized_matrix?.[policy]?.emissions?.toFixed(4),
      results.normalized_matrix?.[policy]?.bus_delay?.toFixed(4),
    ].join(","))
  })
  const blob = new Blob([rows.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = `mcdm_${scenario}.csv`; a.click()
  URL.revokeObjectURL(url)
}

export default function MCDMAnalysis({ data }) {
  const mcdm = data.mcdm_results
  const [scenario, setScenario] = useState("normal")

  if (!mcdm) return <p style={{ color: "var(--text-label)" }}>No MCDM data available</p>

  const results = mcdm[scenario]
  if (!results) return <p style={{ color: "var(--text-label)" }}>No results for {scenario}</p>

  const wsmScores = results.wsm_scores || {}
  const topsisScores = results.topsis_scores || {}
  const wsmRanking = results.wsm_ranking || []
  const topsisRanking = results.topsis_ranking || []
  const weights = results.weights || {}
  const sensitivity = results.sensitivity_analysis || []

  // Radar chart data
  const normMatrix = results.normalized_matrix || {}
  const criteria = ["throughput", "safety_score", "emissions", "bus_delay"]
  const criteriaLabels = { throughput: "Throughput", safety_score: "Safety", emissions: "Low Emissions", bus_delay: "Low Bus Delay" }
  const radarData = criteria.map(c => {
    const point = { criterion: criteriaLabels[c] || c }
    Object.entries(normMatrix).forEach(([policy, vals]) => {
      // For cost criteria (emissions, bus_delay), invert for radar
      let val = vals[c] || 0
      if (c === "emissions" || c === "bus_delay") val = 1 - val
      point[policy] = Math.round(val * 100)
    })
    return point
  })

  // Score comparison bar chart
  const scoreData = Object.keys(wsmScores).map(p => ({
    policy: p.length > 15 ? p.substring(0, 14) + "..." : p,
    fullPolicy: p,
    WSM: Math.round(wsmScores[p] * 1000) / 1000,
    TOPSIS: Math.round(topsisScores[p] * 1000) / 1000,
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
        <div style={{ flex: 1 }} />
        <button className="btn btn-sm btn-outline" onClick={() => downloadCSV(mcdm, scenario)}>
          <Download size={12} /> Export CSV
        </button>
        <button className="btn btn-sm btn-outline" onClick={() => downloadJSON(results, `mcdm_${scenario}.json`)}>
          <Download size={12} /> Export JSON
        </button>
      </div>

      {/* Weights + Rankings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {/* Criteria Weights */}
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--gold)" }} />
            Criteria Weights
          </div>
          {Object.entries(weights).map(([c, w]) => (
            <div key={c} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{criteriaLabels[c] || c}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>{(w * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "var(--bg-elevated)" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${w * 100}%`, background: "var(--teal)" }} />
              </div>
            </div>
          ))}
        </div>

        {/* WSM Ranking */}
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--blue)" }} />
            WSM Ranking
          </div>
          {wsmRanking.map((p, i) => (
            <div key={p} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              background: i === 0 ? "rgba(245,158,11,0.06)" : "transparent",
              borderRadius: 8, marginBottom: 4,
              border: i === 0 ? "1px solid rgba(245,158,11,0.15)" : "1px solid transparent"
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--gold)" : "var(--text-muted)", width: 22 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 12, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>{p}</span>
              <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: AGENT_COLORS[p] || "var(--text-label)" }}>
                {wsmScores[p]?.toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        {/* TOPSIS Ranking */}
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--purple)" }} />
            TOPSIS Ranking
          </div>
          {topsisRanking.map((p, i) => (
            <div key={p} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
              background: i === 0 ? "rgba(245,158,11,0.06)" : "transparent",
              borderRadius: 8, marginBottom: 4,
              border: i === 0 ? "1px solid rgba(245,158,11,0.15)" : "1px solid transparent"
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--gold)" : "var(--text-muted)", width: 22 }}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: 12, color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>{p}</span>
              <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: AGENT_COLORS[p] || "var(--text-label)" }}>
                {topsisScores[p]?.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Radar + Scores Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--teal)" }} />
            Multi-Criteria Profile (Normalized)
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(148,163,184,0.08)" />
              <PolarAngleAxis dataKey="criterion" tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              {Object.keys(normMatrix).map(p => (
                <Radar key={p} name={p} dataKey={p}
                  stroke={AGENT_COLORS[p] || "#64748B"} fill={AGENT_COLORS[p] || "#64748B"} fillOpacity={0.08} strokeWidth={1.5} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--green)" }} />
            WSM vs TOPSIS Scores
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="policy" tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="WSM" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="TOPSIS" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sensitivity Analysis */}
      {sensitivity.length > 0 && (
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--purple)" }} />
            Sensitivity Analysis (Weight Variations)
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Weight Set</th>
                  <th style={{ textAlign: "right" }}>Throughput</th>
                  <th style={{ textAlign: "right" }}>Safety</th>
                  <th style={{ textAlign: "right" }}>Emissions</th>
                  <th style={{ textAlign: "right" }}>Bus Delay</th>
                  <th>WSM Winner</th>
                  <th>TOPSIS Winner</th>
                </tr>
              </thead>
              <tbody>
                {sensitivity.map((s, i) => (
                  <tr key={i}>
                    <td className="highlight">{s.label || `Set ${i + 1}`}</td>
                    <td className="mono" style={{ textAlign: "right" }}>{(s.weights?.throughput * 100 || 0).toFixed(0)}%</td>
                    <td className="mono" style={{ textAlign: "right" }}>{(s.weights?.safety_score * 100 || 0).toFixed(0)}%</td>
                    <td className="mono" style={{ textAlign: "right" }}>{(s.weights?.emissions * 100 || 0).toFixed(0)}%</td>
                    <td className="mono" style={{ textAlign: "right" }}>{(s.weights?.bus_delay * 100 || 0).toFixed(0)}%</td>
                    <td><span className="badge-blue">{s.wsm_winner}</span></td>
                    <td><span className="badge-purple">{s.topsis_winner}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}