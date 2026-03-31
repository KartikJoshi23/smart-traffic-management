import { useState, useEffect } from "react"
import { LayoutDashboard, Play, TrendingUp, GitCompare, Scale } from "lucide-react"
import Overview from "./components/Overview"
import LiveSimulation from "./components/LiveSimulation"
import TrainingCurves from "./components/TrainingCurves"
import ScenarioComparison from "./components/ScenarioComparison"
import MCDMAnalysis from "./components/MCDMAnalysis"

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
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
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #060b18 0%, #0a1228 50%, #060b18 100%)" }}>
      {/* Header */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/5 to-purple-600/5" />
        <div className="relative max-w-[1440px] mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center text-lg">
              🚦
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Smart City Traffic Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-Agent Reinforcement Learning &middot; WSM & TOPSIS &middot; Dubai 4&times;4 Grid
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live" />
              <span className="text-xs text-emerald-400 font-medium">System Active</span>
            </div>
            <span className="text-xs text-slate-600">Group 2 — MAIB RDMU</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-white/5 bg-white/[0.01]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={"tab-pill flex items-center gap-2 whitespace-nowrap" + (tab === t.id ? " active" : "")}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-[1440px] mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading simulation data...</p>
          </div>
        ) : !data.training_results ? (
          <div className="text-center py-32">
            <p className="text-slate-400 text-lg mb-2">No simulation data found</p>
            <p className="text-slate-600 text-sm">
              Run <code className="px-2 py-1 rounded bg-slate-800 text-cyan-400 text-xs">python main.py</code> to generate results
            </p>
          </div>
        ) : (
          <div key={tab} className="fade-in">
            {tab === "overview" && <Overview data={data} />}
            {tab === "live" && <LiveSimulation data={data} />}
            {tab === "training" && <TrainingCurves data={data} />}
            {tab === "scenarios" && <ScenarioComparison data={data} />}
            {tab === "mcdm" && <MCDMAnalysis data={data} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-600">
          <span>Kartik Joshi, Anurag Deverakonda, Nandana Santosh, Weiqi Liu, Advait Dalvi, Gautam Barai</span>
          <span>MAIB &middot; Term 2 &middot; RDMU &middot; 2026</span>
        </div>
      </footer>
    </div>
  )
}
