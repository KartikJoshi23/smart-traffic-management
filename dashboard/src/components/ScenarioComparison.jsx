import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts"

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal: "Normal", rush_hour: "Rush Hour", incident: "Incident", event: "Event", bus_priority: "Bus Priority" }
const SC_ORDER = ["normal", "rush_hour", "incident", "event", "bus_priority"]
const METRICS_INFO = [
  { key: "avg_throughput", label: "Throughput", unit: "veh/ep", higher: true },
  { key: "avg_wait_time", label: "Wait Time", unit: "steps", higher: false },
  { key: "avg_emissions", label: "Emissions", unit: "kg CO\u2082", higher: false },
  { key: "avg_safety_score", label: "Safety", unit: "/100", higher: true },
]
const ttStyle = { background: "#1a1a1e", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, color: "#fafafa", fontSize: 11 }

export default function ScenarioComparison({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p style={{ color: "var(--text-label)" }}>No data available</p>

  // Build chart data for each metric
  function buildChartData(metricKey) {
    return SC_ORDER.filter(sc => cmp[sc]).map(sc => {
      const row = { scenario: SC_LABELS[sc] }
      Object.entries(cmp[sc].agents).forEach(([ag, ad]) => {
        row[AGENT_LABELS[ag]] = Math.round(ad.metrics[metricKey] * 100) / 100
      })
      return row
    })
  }

  // Improvement table: RL vs Fixed Timer per scenario
  const improvements = SC_ORDER.filter(sc => cmp[sc]).map(sc => {
    const agents = cmp[sc].agents
    const ft = agents.fixed_timer?.metrics
    const ql = agents.q_learning?.metrics
    const sa = agents.sarsa?.metrics
    if (!ft || !ql || !sa) return null
    return {
      scenario: SC_LABELS[sc],
      ql_wait_imp: (((ft.avg_wait_time - ql.avg_wait_time) / ft.avg_wait_time) * 100).toFixed(1),
      sa_wait_imp: (((ft.avg_wait_time - sa.avg_wait_time) / ft.avg_wait_time) * 100).toFixed(1),
      ql_tp_imp: (((ql.avg_throughput - ft.avg_throughput) / ft.avg_throughput) * 100).toFixed(1),
      sa_tp_imp: (((sa.avg_throughput - ft.avg_throughput) / ft.avg_throughput) * 100).toFixed(1),
      ql_emit_imp: (((ft.avg_emissions - ql.avg_emissions) / ft.avg_emissions) * 100).toFixed(1),
      sa_emit_imp: (((ft.avg_emissions - sa.avg_emissions) / ft.avg_emissions) * 100).toFixed(1),
    }
  }).filter(Boolean)

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {METRICS_INFO.map(mi => (
          <div key={mi.key} className="card">
            <div className="section-title">
              <span className="dot" style={{ background: mi.higher ? "var(--green)" : "var(--gold)" }} />
              {mi.label} ({mi.unit})
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buildChartData(mi.key)} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="scenario" tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Fixed Timer" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Q-Learning" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="SARSA" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Improvement Table */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--teal)" }} />
          RL Improvement vs Fixed Timer (%)
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th style={{ textAlign: "center" }} colSpan={2}>Wait Time Reduction</th>
              <th style={{ textAlign: "center" }} colSpan={2}>Throughput Gain</th>
              <th style={{ textAlign: "center" }} colSpan={2}>Emission Reduction</th>
            </tr>
            <tr>
              <th></th>
              <th style={{ textAlign: "right", color: "#3B82F6" }}>Q-Learn</th>
              <th style={{ textAlign: "right", color: "#10B981" }}>SARSA</th>
              <th style={{ textAlign: "right", color: "#3B82F6" }}>Q-Learn</th>
              <th style={{ textAlign: "right", color: "#10B981" }}>SARSA</th>
              <th style={{ textAlign: "right", color: "#3B82F6" }}>Q-Learn</th>
              <th style={{ textAlign: "right", color: "#10B981" }}>SARSA</th>
            </tr>
          </thead>
          <tbody>
            {improvements.map((r, i) => (
              <tr key={i}>
                <td className="highlight">{r.scenario}</td>
                <td className="mono" style={{ textAlign: "right", color: Number(r.ql_wait_imp) > 0 ? "var(--green)" : "var(--red)" }}>
                  {Number(r.ql_wait_imp) > 0 ? "+" : ""}{r.ql_wait_imp}%
                </td>
                <td className="mono" style={{ textAlign: "right", color: Number(r.sa_wait_imp) > 0 ? "var(--green)" : "var(--red)" }}>
                  {Number(r.sa_wait_imp) > 0 ? "+" : ""}{r.sa_wait_imp}%
                </td>
                <td className="mono" style={{ textAlign: "right", color: Number(r.ql_tp_imp) > 0 ? "var(--green)" : "var(--red)" }}>
                  {Number(r.ql_tp_imp) > 0 ? "+" : ""}{r.ql_tp_imp}%
                </td>
                <td className="mono" style={{ textAlign: "right", color: Number(r.sa_tp_imp) > 0 ? "var(--green)" : "var(--red)" }}>
                  {Number(r.sa_tp_imp) > 0 ? "+" : ""}{r.sa_tp_imp}%
                </td>
                <td className="mono" style={{ textAlign: "right", color: Number(r.ql_emit_imp) > 0 ? "var(--green)" : "var(--red)" }}>
                  {Number(r.ql_emit_imp) > 0 ? "+" : ""}{r.ql_emit_imp}%
                </td>
                <td className="mono" style={{ textAlign: "right", color: Number(r.sa_emit_imp) > 0 ? "var(--green)" : "var(--red)" }}>
                  {Number(r.sa_emit_imp) > 0 ? "+" : ""}{r.sa_emit_imp}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10, fontSize: 10, color: "var(--text-muted)" }}>
          Positive values (green) indicate RL outperforms Fixed Timer. Strongest improvements occur in Rush Hour and Incident scenarios.
        </div>
      </div>
    </div>
  )
}