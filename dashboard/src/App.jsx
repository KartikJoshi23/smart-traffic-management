import { useState, useEffect } from "react"
import { LayoutDashboard, Play, TrendingUp, GitCompare, Scale, GitFork, ExternalLink } from "lucide-react"
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
      {/* Top accent line — traffic light gradient */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #FF4057 0%, #FFB800 30%, #00E68C 60%, #00D4FF 100%)" }} />

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
                Multi-Agent RL · Q-Learning & SARSA · WSM & TOPSIS Decision Analysis
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="https://github.com/KartikJoshi23/smart-traffic-management" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-label)", fontSize: 12, textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-medium)"; e.currentTarget.style.color = "var(--text-primary)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-label)" }}>
              <GitFork size={14} /> GitHub <ExternalLink size={10} />
            </a>
            <div className="badge-green" style={{ gap: 6 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              System Online
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>MAIB · RDMU · Group 2</span>
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
          <span>Kartik Joshi • Anurag Deverakonda • Nandana Santosh • Weiqi Liu • Advait Dalvi • Gautam Barai</span>
          <span>Masters in AI with Business · Term 2 · RDMU · 2026</span>
        </div>
      </footer>
    </div>
  )
}
