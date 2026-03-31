import { useState } from "react"
import { Download, Scale, Award, Info, FileText } from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts"

const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const COLORS = ["#4A90FF", "#00E68C", "#FF4057", "#FFB800", "#A78BFA"]
const ttStyle = { background: "#0B0F14", border: "1px solid rgba(148,163,184,0.10)", borderRadius: 12, color: "#F0F4F8", fontSize: 11 }

function downloadCSV(d, sc) {
  if (!d) return
  let csv = "MCDM Analysis Report - " + sc + "\n\n"
  csv += "CRITERIA WEIGHTS\n" + d.criteria.map((c, i) => c + "," + d.weights[i]).join("\n") + "\n\n"
  csv += "DECISION MATRIX (Normalized)\n" + "Alternative," + d.criteria.join(",") + "\n"
  d.alternatives.forEach((a, i) => { csv += a + "," + d.wsm.normalized_matrix[i].map(v => v.toFixed(4)).join(",") + "\n" })
  csv += "\nWSM RANKING\nRank,Alternative,Score\n"
  d.wsm.ranked_alternatives.forEach((a, i) => { csv += (i+1) + "," + a + "," + d.wsm.ranked_scores[i] + "\n" })
  csv += "\nTOPSIS RANKING\nRank,Alternative,Closeness,D+,D-\n"
  d.topsis.ranked_alternatives.forEach((a, i) => {
    const oi = d.alternatives.indexOf(a)
    csv += (i+1) + "," + a + "," + d.topsis.ranked_scores[i] + "," + d.topsis.distance_to_ideal[oi].toFixed(4) + "," + d.topsis.distance_to_anti_ideal[oi].toFixed(4) + "\n"
  })
  const blob = new Blob([csv], { type: "text/csv" })
  const u = URL.createObjectURL(blob)
  const el = document.createElement("a"); el.href = u; el.download = "mcdm_" + sc + ".csv"; el.click()
  URL.revokeObjectURL(u)
}

function downloadJSON(d, sc) {
  const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" })
  const u = URL.createObjectURL(blob)
  const el = document.createElement("a"); el.href = u; el.download = "mcdm_full_" + sc + ".json"; el.click()
  URL.revokeObjectURL(u)
}

export default function MCDMAnalysis({ data }) {
  const mcdm = data.mcdm_results
  const [scenario, setScenario] = useState("normal")
  if (!mcdm) return <p style={{ color: "var(--text-label)" }}>No MCDM data available.</p>
  const sd = mcdm[scenario]
  if (!sd) return <p style={{ color: "var(--text-label)" }}>No data for {scenario}.</p>

  const { alternatives, wsm: wRes, topsis: tRes, sensitivity_analysis: sa, criteria, weights } = sd

  const radarData = criteria?.map((c, ci) => {
    const entry = { criterion: c.replace(/\n/g, " ") }
    alternatives?.forEach((alt, ai) => { entry[alt] = wRes?.normalized_matrix?.[ai]?.[ci] ?? 0 })
    return entry
  }) || []

  const wsmBar = wRes?.ranked_alternatives?.map((a, i) => ({ name: a, score: wRes.ranked_scores[i] })) || []
  const topsisBar = tRes?.ranked_alternatives?.map((a, i) => ({ name: a, closeness: tRes.ranked_scores[i] })) || []

  const sensCharts = sa?.map(s => ({
    criterion: s.criterion,
    data: (s.variations || []).map(v => {
      const e = { weight: v.modified_weight?.toFixed(3) }
      alternatives?.forEach((alt, ai) => { e[alt] = v.topsis_scores?.[ai] ?? 0 })
      return e
    }),
  })) || []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="card card-compact" style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="section-subtitle">Scenario</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.keys(mcdm).map(sc => (
              <button key={sc} onClick={() => setScenario(sc)}
                className={"btn btn-sm btn-outline " + (scenario === sc ? "active" : "")}>
                {SC_LABELS[sc] || sc}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => downloadCSV(sd, scenario)} className="btn btn-teal">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => downloadJSON(sd, scenario)} className="btn btn-outline">
            <FileText size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* Criteria Weights */}
      <div className="card">
        <div className="section-title">
          <Scale size={16} style={{ color: "var(--gold)" }} />
          Criteria Weights
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {criteria?.map((c, i) => (
            <div key={c} className="metric-mini">
              <div className="metric-mini-label">{c.replace(/\n/g, " ")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <div style={{ flex: 1, height: 8, background: "var(--bg-elevated)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 8, width: ((weights?.[i] || 0) * 100) + "%", background: COLORS[i], transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", minWidth: 36 }}>
                  {((weights?.[i] || 0) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--blue)" }} />
            Criteria Radar (Normalized)
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1E293B" />
              <PolarAngleAxis dataKey="criterion" stroke="#94A3B8" tick={{ fill: "#CBD5E1", fontSize: 10 }} />
              <PolarRadiusAxis stroke="#334155" tick={{ fill: "#64748B", fontSize: 9 }} />
              {alternatives?.map((alt, i) => (
                <Radar key={alt} name={alt} dataKey={alt}
                  stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, color: "#CBD5E1" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="section-title">
              <Award size={15} style={{ color: "var(--blue)" }} /> WSM Ranking
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={wsmBar} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
                <XAxis type="number" stroke="#64748B" domain={[0, 1]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" width={130} tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="score" fill="#3B82F6" radius={[0,6,6,0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="section-title">
              <Award size={15} style={{ color: "var(--green)" }} /> TOPSIS Ranking
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={topsisBar} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
                <XAxis type="number" stroke="#64748B" domain={[0, 1]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" width={130} tick={{ fill: "#CBD5E1", fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="closeness" fill="#10B981" radius={[0,6,6,0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOPSIS Table */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--teal)" }} />
          TOPSIS Decision Matrix
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th><th>Alternative</th>
              <th className="text-right">D+ (Ideal)</th>
              <th className="text-right">D- (Anti-Ideal)</th>
              <th className="text-right">Closeness C_i</th>
            </tr>
          </thead>
          <tbody>
            {tRes?.ranked_alternatives?.map((alt, rank) => {
              const oi = alternatives?.indexOf(alt) ?? 0
              const isFirst = rank === 0
              return (
                <tr key={alt} style={isFirst ? { background: "rgba(16,185,129,0.04)" } : {}}>
                  <td>
                    {isFirst ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg, #F59E0B, #D97706)",
                        fontSize: 12, fontWeight: 800, color: "white"
                      }}>1</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", paddingLeft: 6 }}>#{rank + 1}</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{alt}</td>
                  <td className="text-right mono">{tRes.distance_to_ideal?.[oi]?.toFixed(4)}</td>
                  <td className="text-right mono">{tRes.distance_to_anti_ideal?.[oi]?.toFixed(4)}</td>
                  <td className="text-right" style={{ fontFamily: "monospace", fontWeight: 700, color: isFirst ? "var(--green)" : "var(--text-secondary)" }}>
                    {tRes.scores?.[oi]?.toFixed(4)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Sensitivity Analysis */}
      <div className="card">
        <div className="section-title">
          <Info size={16} style={{ color: "var(--purple)" }} />
          Sensitivity Analysis
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>{"TOPSIS closeness as each criterion weight varies \u00b10.15"}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sensCharts.map(sc => (
            <div key={sc.criterion} style={{ background: "var(--bg-card-alt)", borderRadius: 12, padding: 16, border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12, textTransform: "capitalize" }}>
                {sc.criterion} weight variation
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={sc.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
                  <XAxis dataKey="weight" stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 9 }} />
                  <YAxis stroke="#475569" tick={{ fill: "#94A3B8", fontSize: 9 }} />
                  <Tooltip contentStyle={ttStyle} />
                  {alternatives?.map((alt, i) => (
                    <Line key={alt} type="monotone" dataKey={alt}
                      stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                      dot={{ r: 2.5, fill: COLORS[i % COLORS.length] }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
