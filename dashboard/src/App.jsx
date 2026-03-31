import { useState, useEffect } from "react"
import { LayoutDashboard, Play, TrendingUp, GitCompare, Scale } from "lucide-react"
import Overview from "./components/Overview"
import LiveSimulation from "./components/LiveSimulation"
import TrainingCurves from "./components/TrainingCurves"
import ScenarioComparison from "./components/ScenarioComparison"
import MCDMAnalysis from "./components/MCDMAnalysis"

const TABS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "live", label: "Live Simulation", icon: Play },
  { id: "training", label: "Training Analysis", icon: TrendingUp },
  { id: "scenarios", label: "Scenario Comparison", icon: GitCompare },
  { id: "mcdm", label: "MCDM Evaluation", icon: Scale },
]

export default function App() {
  const [tab, setTab] = useState("overview")
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const files = [
          "training_results", "mcdm_results", "scenario_comparison",
          "intersection_meta", "live_simulation_q_learning",
          "live_simulation_sarsa", "live_simulation_fixed_timer",
        ]
        const results = {}
        for (const f of files) {
          try {
            const res = await fetch("/data/" + f + ".json")
            if (res.ok) results[f] = await res.json()
          } catch { /* skip missing */ }
        }
        setData(results)
      } finally { setLoading(false) }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Top accent line */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #06B6D4 0%, #3B82F6 40%, #8B5CF6 70%, #F59E0B 100%)" }} />

      {/* Header */}
      <header style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, var(--teal-dim), var(--blue-dim))",
              border: "1px solid var(--border-medium)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22
            }}>
              🚦
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Dubai Smart Traffic Management
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-label)", marginTop: 2 }}>
                Multi-Agent RL \u00b7 Q-Learning & SARSA \u00b7 WSM & TOPSIS Decision Analysis
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="badge-green" style={{ gap: 6 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              System Online
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>MAIB \u00b7 RDMU \u00b7 Group 2</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "8px 32px", display: "flex", gap: 6, overflowX: "auto" }}>
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={"nav-tab" + (tab === t.id ? " active" : "")}>
                <Icon size={16} />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 32px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "120px 0" }}>
            <div style={{ width: 36, height: 36, border: "3px solid var(--border-subtle)", borderTopColor: "var(--teal)", borderRadius: "50%", margin: "0 auto 16px" }} className="animate-spin" />
            <p style={{ color: "var(--text-label)", fontSize: 14 }}>Loading simulation data...</p>
          </div>
        ) : !data.training_results ? (
          <div style={{ textAlign: "center", padding: "120px 0" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 18, marginBottom: 8 }}>No simulation data found</p>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Run <code style={{ padding: "4px 10px", borderRadius: 8, background: "var(--bg-elevated)", color: "var(--teal)", fontSize: 13 }}>python main.py</code> to generate results
            </p>
          </div>
        ) : (
          <div key={tab} className="fade-up">
            {tab === "overview" && <Overview data={data} />}
            {tab === "live" && <LiveSimulation data={data} />}
            {tab === "training" && <TrainingCurves data={data} />}
            {tab === "scenarios" && <ScenarioComparison data={data} />}
            {tab === "mcdm" && <MCDMAnalysis data={data} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 40 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "16px 32px", display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
          <span>Kartik Joshi \u2022 Anurag Deverakonda \u2022 Nandana Santosh \u2022 Weiqi Liu \u2022 Advait Dalvi \u2022 Gautam Barai</span>
          <span>Masters in AI with Business \u00b7 Term 2 \u00b7 RDMU \u00b7 2026</span>
        </div>
      </footer>
    </div>
  )
}
