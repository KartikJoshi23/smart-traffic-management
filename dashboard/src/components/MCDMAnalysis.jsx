import { useState, useMemo } from "react"
import { Download, Award } from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from "recharts"

const SCENARIOS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const ALT_COLORS = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b"]
const CRIT_LABELS = ["Efficiency","Safety","Emissions","Public Transport"]
const CRIT_COLORS = ["#3b82f6","#22c55e","#f59e0b","#a855f7"]
const TT = { background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e4e4e7", fontSize: 12 }

export default function MCDMAnalysis({ data }) {
  const mcdm = data.mcdm_results
  const [scenario, setScenario] = useState("normal")

  if (!mcdm) return <p style={{ color: "var(--text-muted)" }}>No MCDM data</p>
  const sc = mcdm[scenario]
  if (!sc) return <p style={{ color: "var(--text-muted)" }}>No data for {scenario}</p>

  const alts = sc.alternatives || []
  const weights = sc.weights || []
  const criteria = sc.criteria || []
  const wsmScores = sc.wsm?.scores || []
  const wsmRanked = sc.wsm?.ranked_alternatives || []
  const wsmRankedScores = sc.wsm?.ranked_scores || []
  const topsisScores = sc.topsis?.scores || []
  const topsisRanked = sc.topsis?.ranked_alternatives || []
  const topsisRankedScores = sc.topsis?.ranked_scores || []
  const normMatrix = sc.wsm?.normalized_matrix || sc.topsis?.normalized_matrix || []
  const sensitivity = sc.sensitivity_analysis || {}

  const radarData = useMemo(() => {
    if (!normMatrix.length || !criteria.length) return []
    // Use raw values from normMatrix, but rescale so the BEST alternative = 100
    // and others are proportional. This avoids exaggerating tiny differences.
    return criteria.map((c, ci) => {
      const vals = alts.map((_, ai) => normMatrix[ai]?.[ci] ?? 0)
      const maxVal = Math.max(...vals, 0.001)
      const pt = { criteria: CRIT_LABELS[ci] || c }
      alts.forEach((alt, ai) => {
        // Scale relative to best performer (0-100) with a floor of 20
        // so the chart doesn't collapse to the center
        const relScore = (vals[ai] / maxVal) * 80 + 20
        pt[alt] = +relScore.toFixed(1)
      })
      return pt
    })
  }, [normMatrix, criteria, alts])

  const wsmBar = wsmRanked.map((a, i) => ({ name: a, score: +(wsmRankedScores[i] || 0).toFixed(4), fill: ALT_COLORS[alts.indexOf(a) % 5] }))
  const topsisBar = topsisRanked.map((a, i) => ({ name: a, score: +(topsisRankedScores[i] || 0).toFixed(4), fill: ALT_COLORS[alts.indexOf(a) % 5] }))

  function dlCSV() {
    let csv = "Alternative,WSM Score,TOPSIS Score\n"
    alts.forEach((a, i) => { csv += a + "," + (wsmScores[i]||0).toFixed(4) + "," + (topsisScores[i]||0).toFixed(4) + "\n" })
    const b = new Blob([csv], { type: "text/csv" })
    const u = URL.createObjectURL(b)
    const el = document.createElement("a"); el.href = u; el.download = "mcdm_" + scenario + ".csv"; el.click()
    URL.revokeObjectURL(u)
  }
  function dlJSON() {
    const b = new Blob([JSON.stringify(sc, null, 2)], { type: "application/json" })
    const u = URL.createObjectURL(b)
    const el = document.createElement("a"); el.href = u; el.download = "mcdm_" + scenario + ".json"; el.click()
    URL.revokeObjectURL(u)
  }

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(SCENARIOS).map(([k, v]) => (
            <button key={k} onClick={() => setScenario(k)}
              className={"btn btn-sm " + (scenario === k ? "btn-ghost active" : "btn-ghost")}
              style={scenario === k ? { borderColor: "#06b6d4", color: "#06b6d4" } : {}}>{v}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={dlCSV} className="btn btn-sm btn-ghost"><Download size={12}/> Export CSV</button>
          <button onClick={dlJSON} className="btn btn-sm btn-ghost"><Download size={12}/> Export JSON</button>
        </div>
      </div>

      {/* Top Row: Weights + WSM + TOPSIS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {/* Weights */}
        <div className="card card-amber">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(245,158,11,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            Criteria Weights
          </div>
          {weights.map((w, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{CRIT_LABELS[i] || criteria[i]}</span>
                <span style={{ color: CRIT_COLORS[i], fontWeight: 800 }}>{(w * 100).toFixed(0)}%</span>
              </div>
              <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 6 }}>
                <div style={{ width: (w * 100) + "%", height: "100%", background: CRIT_COLORS[i], borderRadius: 6, transition: "width 0.3s" }}/>
              </div>
            </div>
          ))}
        </div>

        {/* WSM */}
        <div className="card card-blue">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(59,130,246,0.12)" }}>
              <Award size={14} style={{ color: "#3b82f6" }}/>
            </div>
            WSM Ranking
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={wsmBar} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]}/>
              <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} width={90}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="score" radius={[0,6,6,0]}>{wsmBar.map((e, i) => <Cell key={i} fill={e.fill}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          {wsmRanked[0] && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(34,197,94,0.10)", marginTop: 8 }}>
              <Award size={13} style={{ color: "#22c55e" }}/>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>#1 {wsmRanked[0]}</span>
            </div>
          )}
        </div>

        {/* TOPSIS */}
        <div className="card card-violet">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(168,85,247,0.12)" }}>
              <Award size={14} style={{ color: "#a855f7" }}/>
            </div>
            TOPSIS Ranking
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topsisBar} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]}/>
              <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} width={90}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="score" radius={[0,6,6,0]}>{topsisBar.map((e, i) => <Cell key={i} fill={e.fill}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
          {topsisRanked[0] && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: "rgba(34,197,94,0.10)", marginTop: 8 }}>
              <Award size={13} style={{ color: "#22c55e" }}/>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>#1 {topsisRanked[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Radar + Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card card-green">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(34,197,94,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            Multi-Criteria Profile
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)"/>
              <PolarAngleAxis dataKey="criteria" tick={{ fill: "#a1a1aa", fontSize: 10 }}/>
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]}/>
              {alts.map((a, i) => (
                <Radar key={a} name={a} dataKey={a} stroke={ALT_COLORS[i%5]} fill={ALT_COLORS[i%5]} fillOpacity={0.06} strokeWidth={2}/>
              ))}
              <Legend wrapperStyle={{ fontSize: 10 }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-cyan">
          <div className="section-head">
            <div className="section-icon" style={{ background: "rgba(6,182,212,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            WSM vs TOPSIS Scores
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={alts.map((a, i) => ({ name: a, WSM: +(wsmScores[i]||0).toFixed(4), TOPSIS: +(topsisScores[i]||0).toFixed(4) }))} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]}/>
              <Tooltip contentStyle={TT}/>
              <Legend wrapperStyle={{ fontSize: 10 }}/>
              <Bar dataKey="WSM" fill="#3b82f6" radius={[4,4,0,0]}/>
              <Bar dataKey="TOPSIS" fill="#a855f7" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sensitivity Analysis */}
      <div className="card card-blue">
        <div className="section-head">
          <div className="section-icon" style={{ background: "rgba(59,130,246,0.12)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          </div>
          Sensitivity Analysis
        </div>
        {Object.keys(sensitivity).length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>Criterion</th><th>Base Weight</th><th>Tested Range</th><th>WSM Stable</th><th>TOPSIS Stable</th><th>Verdict</th></tr>
              </thead>
              <tbody>
                {Object.values(sensitivity).map((entry, ei) => {
                  const crit = CRIT_LABELS[criteria.indexOf(entry.criterion)] || entry.criterion
                  const vars = entry.variations || []
                  const baseWeight = weights[criteria.indexOf(entry.criterion)] || 0
                  const minW = Math.min(...vars.map(v => v.modified_weight))
                  const maxW = Math.max(...vars.map(v => v.modified_weight))
                  const wsmWinners = new Set(vars.map(v => alts[v.wsm_ranking?.[0]] || "N/A"))
                  const topsisWinners = new Set(vars.map(v => alts[v.topsis_ranking?.[0]] || "N/A"))
                  const wsmStable = wsmWinners.size === 1
                  const topsisStable = topsisWinners.size === 1
                  const bothStable = wsmStable && topsisStable
                  return (
                    <tr key={ei}>
                      <td style={{ fontWeight: 700, color: CRIT_COLORS[ei] || "var(--text-white)" }}>{crit}</td>
                      <td className="mono">{(baseWeight * 100).toFixed(0)}%</td>
                      <td className="mono" style={{ color: "var(--text-secondary)" }}>{(minW*100).toFixed(0)}% - {(maxW*100).toFixed(0)}%</td>
                      <td><span className={wsmStable ? "badge badge-green" : "badge badge-amber"}>{wsmStable ? [...wsmWinners][0] : [...wsmWinners].join(" / ")}</span></td>
                      <td><span className={topsisStable ? "badge badge-green" : "badge badge-amber"}>{topsisStable ? [...topsisWinners][0] : [...topsisWinners].join(" / ")}</span></td>
                      <td><span className={bothStable ? "badge badge-green" : "badge badge-red"}>{bothStable ? "Robust" : "Sensitive"}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>No sensitivity data for this scenario</p>
        )}
      </div>
    </div>
  )
}
