import { useState } from "react"
import { Download, Scale, Award, Info } from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts"

const SCENARIO_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"]
const tooltipStyle = { background: "rgba(13,20,36,0.95)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: 12, fontSize: 11 }

function downloadCSV(mcdmData, scenario) {
  if (!mcdmData) return
  const { alternatives, criteria, weights, wsm: w, topsis: t } = mcdmData
  let csv = "MCDM Analysis Report - " + scenario + "\n\n"
  csv += "CRITERIA WEIGHTS\n"
  csv += criteria.map((c, i) => c + "," + weights[i]).join("\n") + "\n\n"
  csv += "DECISION MATRIX (Normalized)\n"
  csv += "Alternative," + criteria.join(",") + "\n"
  alternatives.forEach((alt, ai) => {
    csv += alt + "," + w.normalized_matrix[ai].map(v => v.toFixed(4)).join(",") + "\n"
  })
  csv += "\nWSM RANKING\n"
  csv += "Rank,Alternative,Score\n"
  w.ranked_alternatives.forEach((alt, i) => { csv += (i+1) + "," + alt + "," + w.ranked_scores[i] + "\n" })
  csv += "\nTOPSIS RANKING\n"
  csv += "Rank,Alternative,Closeness,D+,D-\n"
  t.ranked_alternatives.forEach((alt, i) => {
    const oi = alternatives.indexOf(alt)
    csv += (i+1) + "," + alt + "," + t.ranked_scores[i] + "," + t.distance_to_ideal[oi].toFixed(4) + "," + t.distance_to_anti_ideal[oi].toFixed(4) + "\n"
  })
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "mcdm_analysis_" + scenario + ".csv"; a.click()
  URL.revokeObjectURL(url)
}

function downloadJSON(mcdmData, scenario) {
  const blob = new Blob([JSON.stringify(mcdmData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = "mcdm_full_" + scenario + ".json"; a.click()
  URL.revokeObjectURL(url)
}

export default function MCDMAnalysis({ data }) {
  const mcdm = data.mcdm_results
  const [scenario, setScenario] = useState("normal")
  if (!mcdm) return <p className="text-slate-500">No MCDM data available.</p>

  const sd = mcdm[scenario]
  if (!sd) return <p className="text-slate-500">No MCDM data for {scenario}.</p>

  const { alternatives, wsm: wRes, topsis: tRes, sensitivity_analysis: sa, criteria, weights } = sd

  // Radar data
  const radarData = criteria?.map((c, ci) => {
    const entry = { criterion: c.replace(/\n/g, " ") }
    alternatives?.forEach((alt, ai) => { entry[alt] = wRes?.normalized_matrix?.[ai]?.[ci] ?? 0 })
    return entry
  }) || []

  // WSM bar
  const wsmBar = wRes?.ranked_alternatives?.map((alt, i) => ({ name: alt, score: wRes.ranked_scores[i] })) || []
  // TOPSIS bar
  const topsisBar = tRes?.ranked_alternatives?.map((alt, i) => ({ name: alt, closeness: tRes.ranked_scores[i] })) || []

  // Sensitivity
  const sensCharts = sa?.map(s => ({
    criterion: s.criterion,
    data: (s.variations || []).map(v => {
      const e = { weight: v.modified_weight?.toFixed(3) }
      alternatives?.forEach((alt, ai) => { e[alt] = v.topsis_scores?.[ai] ?? 0 })
      return e
    }),
  })) || []

  return (
    <div className="space-y-4">
      {/* Scenario + Download */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <label className="text-xs text-slate-500 block mb-1.5 font-medium uppercase tracking-wider">Scenario</label>
          <div className="flex gap-1.5">
            {Object.keys(mcdm).map(sc => (
              <button key={sc} onClick={() => setScenario(sc)}
                className={"btn btn-ghost " + (scenario === sc ? "active" : "")}>
                {SCENARIO_LABELS[sc] || sc}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(sd, scenario)}
            className="btn btn-primary flex items-center gap-1.5">
            <Download size={14} /> Download CSV
          </button>
          <button onClick={() => downloadJSON(sd, scenario)}
            className="btn btn-ghost flex items-center gap-1.5">
            <Download size={14} /> Full JSON
          </button>
        </div>
      </div>

      {/* Criteria Weights */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Scale size={15} className="text-amber-400" />
          Criteria Weights
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {criteria?.map((c, i) => (
            <div key={c} className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-xs text-slate-400 mb-2">{c.replace(/\n/g, " ")}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: ((weights?.[i] || 0) * 100) + "%",
                    background: COLORS[i],
                  }} />
                </div>
                <span className="text-xs font-semibold text-white">{((weights?.[i] || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Radar + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Criteria Radar (Normalized)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="criterion" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis stroke="#334155" tick={{ fontSize: 9 }} />
              {alternatives?.map((alt, i) => (
                <Radar key={alt} name={alt} dataKey={alt}
                  stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.1} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* WSM + TOPSIS */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Award size={14} className="text-blue-400" /> WSM Ranking
            </h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={wsmBar} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis type="number" stroke="#475569" domain={[0, 1]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={130} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" fill="#3b82f6" radius={[0,6,6,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Award size={14} className="text-emerald-400" /> TOPSIS Ranking (Closeness C\u1d62)
            </h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={topsisBar} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                <XAxis type="number" stroke="#475569" domain={[0, 1]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={130} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="closeness" fill="#10b981" radius={[0,6,6,0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TOPSIS Detail Table */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">TOPSIS Decision Matrix</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4 font-medium">Rank</th>
              <th className="pb-3 pr-4 font-medium">Alternative</th>
              <th className="pb-3 pr-4 text-right font-medium">D\u207a (Ideal)</th>
              <th className="pb-3 pr-4 text-right font-medium">D\u207b (Anti-Ideal)</th>
              <th className="pb-3 text-right font-medium">Closeness C\u1d62</th>
            </tr>
          </thead>
          <tbody>
            {tRes?.ranked_alternatives?.map((alt, rank) => {
              const oi = alternatives?.indexOf(alt) ?? 0
              const isFirst = rank === 0
              return (
                <tr key={alt} className={"border-b border-white/[0.03] " + (isFirst ? "bg-emerald-500/[0.03]" : "")}>
                  <td className="py-3 pr-4">
                    {isFirst ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-xs font-bold text-white">1</span>
                    ) : (
                      <span className="text-slate-500 pl-1.5">#{rank + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-200 font-medium">{alt}</td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-slate-400">{tRes.distance_to_ideal?.[oi]?.toFixed(4)}</td>
                  <td className="py-3 pr-4 text-right font-mono text-xs text-slate-400">{tRes.distance_to_anti_ideal?.[oi]?.toFixed(4)}</td>
                  <td className={"py-3 text-right font-mono text-xs font-semibold " + (isFirst ? "text-emerald-400" : "text-slate-300")}>
                    {tRes.scores?.[oi]?.toFixed(4)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Sensitivity Analysis */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Info size={14} className="text-purple-400" />
          Sensitivity Analysis
        </h3>
        <p className="text-xs text-slate-500 mb-4">TOPSIS closeness as each criterion weight varies \u00b10.15</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sensCharts.map(sc => (
            <div key={sc.criterion} className="bg-white/[0.02] rounded-xl p-4">
              <h4 className="text-xs text-slate-400 mb-3 capitalize font-medium">{sc.criterion} weight variation</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={sc.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
                  <XAxis dataKey="weight" stroke="#475569" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  {alternatives?.map((alt, i) => (
                    <Line key={alt} type="monotone" dataKey={alt}
                      stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2.5, fill: COLORS[i % COLORS.length] }} />
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
