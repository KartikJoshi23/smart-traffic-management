import { useState, useEffect } from "react"
import { LayoutDashboard, Play, TrendingUp, GitCompare, Scale, ExternalLink } from "lucide-react"
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
          } catch { /* skip */ }
        }
        setData(results)
      } finally { setLoading(false) }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <div className="accent-bar" />

      <header style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, var(--cyan-dim), var(--bg-elevated))", border: "1px solid var(--border-medium)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {"??"}
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Dubai Smart Traffic Management
              </h1>
              <p style={{ fontSize: 11, color: "var(--text-label)", marginTop: 1 }}>
                Multi-Agent RL {"\u00B7"} Q-Learning & SARSA {"\u00B7"} WSM & TOPSIS Decision Analysis
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="https://github.com/KartikJoshi23/smart-traffic-management" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-label)", fontSize: 11, textDecoration: "none" }}>
              GitHub <ExternalLink size={10} />
            </a>
            <div className="badge-green" style={{ gap: 5, padding: "4px 10px" }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              System Online
            </div>
          </div>
        </div>
      </header>

      <nav style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "8px 28px", display: "flex", gap: 6, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`nav-tab ${tab === t.id ? "active" : ""}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 28px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-label)" }}>Loading simulation data...</div>
        ) : (
          <>
            {tab === "overview" && <Overview data={data} />}
            {tab === "live" && <LiveSimulation data={data} />}
            {tab === "training" && <TrainingCurves data={data} />}
            {tab === "scenarios" && <ScenarioComparison data={data} />}
            {tab === "mcdm" && <MCDMAnalysis data={data} />}
          </>
        )}
      </main>

      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "16px 28px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Made with <span style={{ color: "#ef4444" }}>{"\u2764"}</span> by Kartik Joshi {"\u2022"} Anurag Deverakonda {"\u2022"} Nandana Santosh {"\u2022"} Weiqi Liu {"\u2022"} Advait Dalvi {"\u2022"} Gautam Barai
        </p>
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, opacity: 0.6 }}>
          MAIB {"\u2022"} RDMU {"\u2022"} Group 2
        </p>
      </footer>
    </div>
  )
}