import { useState, useEffect } from "react"
import { LayoutDashboard, Play, TrendingUp, GitCompare, Scale, ExternalLink } from "lucide-react"
import Overview from "./components/Overview"
import LiveSimulation from "./components/LiveSimulation"
import TrainingCurves from "./components/TrainingCurves"
import ScenarioComparison from "./components/ScenarioComparison"
import MCDMAnalysis from "./components/MCDMAnalysis"

const TABS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, color: "#3b82f6" },
  { id: "live", label: "Live Simulation", icon: Play, color: "#22c55e" },
  { id: "training", label: "Training Analysis", icon: TrendingUp, color: "#f59e0b" },
  { id: "scenarios", label: "Scenario Comparison", icon: GitCompare, color: "#a855f7" },
  { id: "mcdm", label: "MCDM Evaluation", icon: Scale, color: "#06b6d4" },
]

export default function App() {
  const [tab, setTab] = useState("overview")
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const files = [
          "training_results", "mcdm_results", "scenario_comparison",
          "intersection_meta", "live_simulation_q_learning",
          "live_simulation_sarsa", "live_simulation_fixed_timer",
          "live_simulation_coordinated_q_learning",
          "live_simulation_coordinated_sarsa",
        ]
        const r = {}
        for (const f of files) {
          try { const res = await fetch("/data/" + f + ".json"); if (res.ok) r[f] = await res.json() } catch {}
        }
        setData(r)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const activeColor = TABS.find(t => t.id === tab)?.color || "#3b82f6"

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, rgba(14,14,20,0.95) 0%, rgba(20,20,28,0.92) 50%, rgba(16,16,22,0.95) 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px) saturate(140%)", WebkitBackdropFilter: "blur(20px) saturate(140%)" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Traffic light SVG */}
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-base)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="4" r="2.5" fill="#ef4444"/>
                <circle cx="9" cy="9" r="2.5" fill="#f59e0b"/>
                <circle cx="9" cy="14" r="2.5" fill="#22c55e"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-white)", letterSpacing: "-0.02em" }}>
                Dubai Smart Traffic Management
              </h1>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Multi-Agent Reinforcement Learning {String.fromCharCode(183)} Q-Learning & SARSA {String.fromCharCode(183)} WSM & TOPSIS
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="https://github.com/KartikJoshi23/smart-traffic-management" target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
              GitHub <ExternalLink size={11}/>
            </a>
            <div className="badge-green" style={{ padding: "5px 12px", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }}/>
              System Online
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ background: "linear-gradient(135deg, rgba(16,16,22,0.95) 0%, rgba(22,22,30,0.92) 40%, rgba(20,20,26,0.93) 70%, rgba(18,18,24,0.95) 100%)", borderBottom: "none", borderTop: "1px solid rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", padding: "0 28px", display: "flex", gap: 4, alignItems: "center" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"nav-tab" + (tab === t.id ? " active" : "")}
              style={{ "--accent-color": t.color }}>
              <t.icon size={15} style={{ color: tab === t.id ? "white" : t.color, opacity: tab === t.id ? 1 : 0.6 }}/>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent 5%, rgba(59,130,246,0.2) 20%, rgba(168,85,247,0.2) 40%, rgba(34,197,94,0.2) 60%, rgba(245,158,11,0.2) 80%, transparent 95%)" }}/>

      {/* Content */}
      <main style={{ maxWidth: 1480, margin: "0 auto", padding: "28px 32px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 80 }}>
            <div style={{ width: 48, height: 48, margin: "0 auto 16px", borderRadius: 14, background: "var(--bg-elevated)", display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-base)" }}>
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="4" r="2.5" fill="#ef4444" opacity="0.3"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0s" repeatCount="indefinite"/></circle>
                <circle cx="9" cy="9" r="2.5" fill="#f59e0b" opacity="0.3"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.5s" repeatCount="indefinite"/></circle>
                <circle cx="9" cy="14" r="2.5" fill="#22c55e" opacity="0.3"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="1s" repeatCount="indefinite"/></circle>
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>Loading simulation data...</div>
          </div>
        ) : (
          <>
            {tab === "overview" && <Overview data={data}/>}
            {tab === "live" && <LiveSimulation data={data}/>}
            {tab === "training" && <TrainingCurves data={data}/>}
            {tab === "scenarios" && <ScenarioComparison data={data}/>}
            {tab === "mcdm" && <MCDMAnalysis data={data}/>}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-dim)", padding: "28px 32px", textAlign: "center", background: "linear-gradient(180deg, transparent, rgba(14,14,20,0.5))" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Made with <span style={{ color: "#ef4444" }}>{String.fromCodePoint(10084)}{String.fromCodePoint(65039)}</span> by{" "}
          {["Kartik Joshi","Anurag Deverakonda","Nandana Santosh","Weiqi Liu","Advait Dalvi","Gautam Barai"].map((n,i,a) => (
            <span key={n}><span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{n}</span>{i < a.length-1 ? <span style={{ color: "var(--text-faint)", margin: "0 8px" }}>{String.fromCharCode(8226)}</span> : ""}</span>
          ))}
        </p>
        <p style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 8 }}>
          MAIB {String.fromCharCode(183)} RDMU {String.fromCharCode(183)} Group 2
        </p>
      </footer>
    </div>
  )
}
