import { useState, useEffect } from "react"
import { LayoutDashboard, Play, TrendingUp, GitCompare, Scale, ExternalLink } from "lucide-react"
import Overview from "./components/Overview"
import LiveSimulation from "./components/LiveSimulation"
import TrainingCurves from "./components/TrainingCurves"
import ScenarioComparison from "./components/ScenarioComparison"
import MCDMAnalysis from "./components/MCDMAnalysis"

const TABS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, color: "var(--blue)" },
  { id: "live", label: "Live Simulation", icon: Play, color: "var(--green)" },
  { id: "training", label: "Training Analysis", icon: TrendingUp, color: "var(--amber)" },
  { id: "scenarios", label: "Scenario Comparison", icon: GitCompare, color: "var(--violet)" },
  { id: "mcdm", label: "MCDM Evaluation", icon: Scale, color: "var(--teal)" },
]

function TrafficLightIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="7" y="1" width="14" height="26" rx="4" fill="#262629" stroke="#3f3f46" strokeWidth="1"/>
      <circle cx="14" cy="7" r="3" fill="#EF4444" opacity="0.9"/>
      <circle cx="14" cy="14" r="3" fill="#F59E0B" opacity="0.9"/>
      <circle cx="14" cy="21" r="3" fill="#10B981" opacity="0.9"/>
    </svg>
  )
}

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
          } catch {}
        }
        setData(results)
      } finally { setLoading(false) }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="accent-bar" />

      <header style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TrafficLightIcon />
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Dubai Smart Traffic Management
              </h1>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                Multi-Agent RL · Q-Learning & SARSA · WSM & TOPSIS Decision Analysis
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="https://github.com/KartikJoshi23/smart-traffic-management" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 6, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", fontSize: 11, textDecoration: "none", fontWeight: 500 }}>
              GitHub <ExternalLink size={10} />
            </a>
            <div className="badge-green" style={{ gap: 5, padding: "4px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block", animation: "pulse-live 2s ease-in-out infinite" }} />
              System Online
            </div>
          </div>
        </div>
      </header>

      <nav style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 28px", display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`nav-pill ${tab === t.id ? "active" : ""}`}>
              <t.icon size={15} style={tab === t.id ? { color: t.color } : {}} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 28px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--text-tertiary)" }}>Loading simulation data...</div>
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

      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "20px 28px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Made with <span style={{ color: "#EF4444" }}>❤️</span> by{" "}
          <span style={{ color: "var(--text-secondary)" }}>Kartik Joshi</span> •{" "}
          <span style={{ color: "var(--text-secondary)" }}>Anurag Deverakonda</span> •{" "}
          <span style={{ color: "var(--text-secondary)" }}>Nandana Santosh</span> •{" "}
          <span style={{ color: "var(--text-secondary)" }}>Weiqi Liu</span> •{" "}
          <span style={{ color: "var(--text-secondary)" }}>Advait Dalvi</span> •{" "}
          <span style={{ color: "var(--text-secondary)" }}>Gautam Barai</span>
        </p>
        <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6 }}>MAIB · RDMU · Group 2</p>
      </footer>
    </div>
  )
}
