import { useState, useMemo } from "react"
import { Download, Award } from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from "recharts"

const SCENARIOS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const ALT_COLORS = ["#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"]
const CRITERIA_SHORT = ["Efficiency", "Safety", "Emissions", "Public Transport"]
const ttStyle = { background: "#1e1e21", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#f4f4f5" }

export default function MCDMAnalysis({ data }) {
  const mcdm = data.mcdm_results
  const [scenario, setScenario] = useState("normal")

  if (!mcdm) return <p style={{ color: "var(--text-tertiary)" }}>No MCDM data available</p>

  const sc = mcdm[scenario]
  if (!sc) return <p style={{ color: "var(--text-tertiary)" }}>No data for {scenario}</p>

  const alternatives = sc.alternatives || []
  const weights = sc.weights || []
  const criteria = sc.criteria || []

  // WSM data
  const wsmScores = sc.wsm?.scores || []
  const wsmRanked = sc.wsm?.ranked_alternatives || []
  const wsmRankedScores = sc.wsm?.ranked_scores || []

  // TOPSIS data
  const topsisScores = sc.topsis?.scores || []
  const topsisRanked = sc.topsis?.ranked_alternatives || []
  const topsisRankedScores = sc.topsis?.ranked_scores || []

  // Normalized matrix for radar
  const normMatrix = sc.wsm?.normalized_matrix || sc.topsis?.normalized_matrix || []

  // Radar chart data
  const radarData = useMemo(() => {
    if (!normMatrix.length || !criteria.length) return []
    return criteria.map((c, ci) => {
      const point = { criteria: CRITERIA_SHORT[ci] || c }
      alternatives.forEach((alt, ai) => {
        point[alt] = normMatrix[ai]?.[ci] != null ? +(normMatrix[ai][ci] * 100).toFixed(1) : 0
      })
      return point
    })
  }, [normMatrix, criteria, alternatives])

  // WSM bar data
  const wsmBarData = wsmRanked.map((alt, i) => ({
    name: alt,
    score: +(wsmRankedScores[i] || 0).toFixed(4),
    fill: ALT_COLORS[alternatives.indexOf(alt) % ALT_COLORS.length],
  }))

  // TOPSIS bar data
  const topsisBarData = topsisRanked.map((alt, i) => ({
    name: alt,
    score: +(topsisRankedScores[i] || 0).toFixed(4),
    fill: ALT_COLORS[alternatives.indexOf(alt) % ALT_COLORS.length],
  }))

  // Sensitivity analysis
  const sensitivity = sc.sensitivity_analysis || {}

  // Download functions
  function downloadCSV() {
    let csv = "Alternative,WSM Score,WSM Rank,TOPSIS Score,TOPSIS Rank\n"
    alternatives.forEach((alt, i) => {
      const wsmRank = (sc.wsm?.ranking || [])[i]
      const topsisRank = (sc.topsis?.ranking || [])[i]
      csv += alt + "," + (wsmScores[i] || 0).toFixed(4) + "," + (wsmRank != null ? wsmRank + 1 : "") + "," + (topsisScores[i] || 0).toFixed(4) + "," + (topsisRank != null ? topsisRank + 1 : "") + "\n"
    })
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "mcdm_" + scenario + ".csv"; a.click()
    URL.revokeObjectURL(url)
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(sc, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "mcdm_" + scenario + ".json"; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Scenario:</span>
          <div style={{ display: "flex", gap: 4 }}>
            {Object.entries(SCENARIOS).map(([k, v]) => (
              <button key={k} onClick={() => setScenario(k)}
                className={"btn btn-sm " + (scenario === k ? "btn-outline active" : "btn-outline")}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={downloadCSV} className="btn btn-sm btn-outline"><Download size={12} /> Export CSV</button>
          <button onClick={downloadJSON} className="btn btn-sm btn-outline"><Download size={12} /> Export JSON</button>
        </div>
      </div>

      {/* Top row: Weights + WSM + TOPSIS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {/* Criteria Weights */}
        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--amber)" }} />
            Criteria Weights
          </div>
          {weights.map((w, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: "var(--text-secondary)" }}>{CRITERIA_SHORT[i] || criteria[i]}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{(w * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 4 }}>
                <div style={{ width: (w * 100) + "%", height: "100%", background: ALT_COLORS[i % ALT_COLORS.length], borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>

        {/* WSM Ranking */}
        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--blue)" }} />
            WSM Ranking
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={wsmBarData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="score" radius={[0,4,4,0]}>
                {wsmBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {wsmRanked.slice(0, 1).map(alt => (
              <div key={alt} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, background: "var(--green-dim)" }}>
                <Award size={12} style={{ color: "var(--green)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>#1 {alt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOPSIS Ranking */}
        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--violet)" }} />
            TOPSIS Ranking
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topsisBarData} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="score" radius={[0,4,4,0]}>
                {topsisBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {topsisRanked.slice(0, 1).map(alt => (
              <div key={alt} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 6, background: "var(--green-dim)" }}>
                <Award size={12} style={{ color: "var(--green)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>#1 {alt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: Radar + Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Radar Chart */}
        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--green)" }} />
            Multi-Criteria Profile (Normalized)
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="criteria" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              {alternatives.map((alt, i) => (
                <Radar key={alt} name={alt} dataKey={alt}
                  stroke={ALT_COLORS[i % ALT_COLORS.length]}
                  fill={ALT_COLORS[i % ALT_COLORS.length]}
                  fillOpacity={0.08} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 10, color: "#a1a1aa" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* WSM vs TOPSIS Score Comparison */}
        <div className="card">
          <div className="section-title">
            <span className="section-dot" style={{ background: "var(--teal)" }} />
            WSM vs TOPSIS Scores
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={alternatives.map((alt, i) => ({
              name: alt,
              WSM: +(wsmScores[i] || 0).toFixed(4),
              TOPSIS: +(topsisScores[i] || 0).toFixed(4),
            }))} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
              <Tooltip contentStyle={ttStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="WSM" fill="#3B82F6" radius={[4,4,0,0]} />
              <Bar dataKey="TOPSIS" fill="#8B5CF6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <div className="card">
        <div className="section-title">
          <span className="section-dot" style={{ background: "var(--blue)" }} />
          Sensitivity Analysis (Weight Variations)
        </div>
        {Object.keys(sensitivity).length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Weight Set</th>
                  {CRITERIA_SHORT.map(c => <th key={c}>{c}</th>)}
                  <th>WSM Winner</th>
                  <th>TOPSIS Winner</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sensitivity).map(([key, val]) => (
                  <tr key={key}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{key.replace(/_/g, " ").replace("emphasis", "Emphasis")}</td>
                    {(val.weights || []).map((w, i) => (
                      <td key={i} className="mono">{(w * 100).toFixed(0)}%</td>
                    ))}
                    <td style={{ color: "var(--blue)", fontWeight: 600, fontSize: 11 }}>{val.wsm_winner || "N/A"}</td>
                    <td style={{ color: "var(--violet)", fontWeight: 600, fontSize: 11 }}>{val.topsis_winner || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No sensitivity data available for this scenario</p>
        )}
      </div>
    </div>
  )
}
