"""
Complete dashboard rebuild - State-of-the-art Dubai RTA quality
- Solid card backgrounds (no glass/transparency)
- High contrast text (near-white on dark)
- Multi-color accent system
- Professional SVG traffic grid
- Dubai-specific branding
"""
import os

BASE = r"d:\MAIB\Term - 2\RDMU\Smart Traffic Management\dashboard\src"

def write(rel_path, content):
    path = os.path.join(BASE, rel_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Wrote {rel_path}")

# ─────────────────────────── 1. CSS ───────────────────────────
CSS = r'''@import "tailwindcss";

/* ═══════ DESIGN SYSTEM ═══════ */
:root {
  --bg-page: #080D19;
  --bg-card: #0F1629;
  --bg-card-alt: #131A2E;
  --bg-elevated: #182036;
  --bg-input: #0C1220;
  --border-subtle: rgba(148, 163, 184, 0.08);
  --border-medium: rgba(148, 163, 184, 0.12);
  --border-active: rgba(6, 182, 212, 0.5);
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-label: #94A3B8;
  --text-muted: #64748B;
  --teal: #06B6D4;
  --teal-dim: rgba(6, 182, 212, 0.15);
  --gold: #F59E0B;
  --gold-dim: rgba(245, 158, 11, 0.15);
  --green: #10B981;
  --green-dim: rgba(16, 185, 129, 0.15);
  --red: #EF4444;
  --red-dim: rgba(239, 68, 68, 0.15);
  --blue: #3B82F6;
  --blue-dim: rgba(59, 130, 246, 0.15);
  --purple: #8B5CF6;
  --purple-dim: rgba(139, 92, 246, 0.15);
}

* { box-sizing: border-box; margin: 0; }

body {
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: #334155; }

/* ═══════ CARDS ═══════ */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 24px;
}
.card-compact { padding: 16px; }
.card:hover { border-color: var(--border-medium); }

/* KPI Card with left accent bar */
.kpi-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}
.kpi-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--accent-color, var(--teal));
  border-radius: 16px 0 0 16px;
}
.kpi-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-medium);
}
.kpi-value { font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.kpi-label { font-size: 13px; color: var(--text-label); margin-bottom: 6px; font-weight: 500; }
.kpi-unit { font-size: 14px; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
.kpi-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600;
  padding: 3px 10px; border-radius: 100px;
  margin-top: 8px;
}
.kpi-badge.positive { background: var(--green-dim); color: var(--green); }
.kpi-badge.negative { background: var(--red-dim); color: var(--red); }

/* ═══════ NAVIGATION ═══════ */
.nav-tab {
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-label);
  display: flex; align-items: center; gap: 8px;
  white-space: nowrap;
}
.nav-tab:hover { background: var(--bg-elevated); color: var(--text-secondary); }
.nav-tab.active {
  background: var(--teal-dim);
  border-color: var(--border-active);
  color: var(--teal);
  font-weight: 600;
}

/* ═══════ BUTTONS ═══════ */
.btn {
  padding: 8px 18px; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
  border: 1px solid transparent;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-teal { background: var(--teal); color: white; border: none; }
.btn-teal:hover { background: #0891B2; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(6,182,212,0.3); }
.btn-outline {
  background: var(--bg-elevated); color: var(--text-secondary);
  border-color: var(--border-subtle);
}
.btn-outline:hover { background: var(--bg-card-alt); color: var(--text-primary); border-color: var(--border-medium); }
.btn-outline.active {
  background: var(--teal-dim); border-color: var(--border-active);
  color: var(--teal);
}
.btn-sm { padding: 6px 14px; font-size: 12px; border-radius: 8px; }

/* ═══════ TABLES ═══════ */
.data-table { width: 100%; text-align: left; border-collapse: collapse; }
.data-table th {
  padding: 12px 16px; font-size: 11px; font-weight: 600;
  color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-medium);
}
.data-table td {
  padding: 12px 16px; font-size: 13px;
  color: var(--text-secondary); border-bottom: 1px solid var(--border-subtle);
}
.data-table tr:hover td { background: rgba(255,255,255,0.015); }
.data-table .text-right { text-align: right; }
.data-table .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; }
.data-table .highlight { color: var(--text-primary); font-weight: 600; }

/* ═══════ SECTION HEADERS ═══════ */
.section-title {
  font-size: 15px; font-weight: 700; color: var(--text-primary);
  display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
}
.section-title .dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0;
}
.section-subtitle {
  font-size: 12px; font-weight: 500; color: var(--text-label);
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 12px;
}

/* ═══════ BADGES ═══════ */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 100px;
  font-size: 11px; font-weight: 600;
}
.badge-green { background: var(--green-dim); color: var(--green); }
.badge-red { background: var(--red-dim); color: var(--red); }
.badge-teal { background: var(--teal-dim); color: var(--teal); }
.badge-gold { background: var(--gold-dim); color: var(--gold); }
.badge-blue { background: var(--blue-dim); color: var(--blue); }
.badge-purple { background: var(--purple-dim); color: var(--purple); }

/* ═══════ ANIMATIONS ═══════ */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes shimmer-bar {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.fade-up { animation: fadeUp 0.4s ease both; }
.fade-up-d1 { animation: fadeUp 0.4s ease 0.08s both; }
.fade-up-d2 { animation: fadeUp 0.4s ease 0.16s both; }
.fade-up-d3 { animation: fadeUp 0.4s ease 0.24s both; }
.pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

/* ═══════ RECHARTS TOOLTIP ═══════ */
.recharts-tooltip-wrapper .recharts-default-tooltip {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-medium) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
  color: var(--text-primary) !important;
}
.recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-label {
  color: var(--text-secondary) !important;
}

/* ═══════ SVG ROAD GRID ═══════ */
.traffic-grid-bg {
  background: #0A0F1C;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
}

/* ═══════ RANGE INPUT ═══════ */
input[type="range"] {
  -webkit-appearance: none; height: 4px; border-radius: 4px;
  background: var(--bg-elevated); outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none; width: 14px; height: 14px;
  border-radius: 50%; background: var(--teal); cursor: pointer;
  border: 2px solid var(--bg-card);
}

/* ═══════ METRIC MINI CARD ═══════ */
.metric-mini {
  background: var(--bg-card-alt); border-radius: 12px;
  padding: 14px 16px; border: 1px solid var(--border-subtle);
}
.metric-mini-label { font-size: 11px; color: var(--text-label); font-weight: 500; margin-bottom: 4px; }
.metric-mini-value { font-size: 22px; font-weight: 700; color: var(--text-primary); }
'''

# ─────────────────────────── 2. App.jsx ───────────────────────────
APP = '''import { useState, useEffect } from "react"
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
              \\ud83d\\udea6
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Dubai Smart Traffic Management
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-label)", marginTop: 2 }}>
                Multi-Agent RL \\u00b7 Q-Learning & SARSA \\u00b7 WSM & TOPSIS Decision Analysis
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="badge-green" style={{ gap: 6 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              System Online
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>MAIB \\u00b7 RDMU \\u00b7 Group 2</span>
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
          <span>Kartik Joshi \\u2022 Anurag Deverakonda \\u2022 Nandana Santosh \\u2022 Weiqi Liu \\u2022 Advait Dalvi \\u2022 Gautam Barai</span>
          <span>Masters in AI with Business \\u00b7 Term 2 \\u00b7 RDMU \\u00b7 2026</span>
        </div>
      </footer>
    </div>
  )
}
'''

# ─────────────────────────── 3. Overview.jsx ───────────────────────────
OVERVIEW = r'''import { Zap, Clock, Wind, Shield, MapPin } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"

const NAMES = [
  "Al Rigga","Deira City Centre","Maktoum Bridge","Bur Dubai",
  "SZR Junction","DIFC","Business Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tunnel","Marina JBR",
  "DIP","Academic City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH"]

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const ttStyle = { background: "#0F1629", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 12, color: "#F1F5F9" }

export default function Overview({ data }) {
  const cmp = data.scenario_comparison
  if (!cmp) return <p style={{ color: "var(--text-label)" }}>No data available</p>

  let bestTP = { v: 0 }, lowWait = { v: Infinity }, lowEmit = { v: Infinity }, bestSafe = { v: 0 }
  Object.entries(cmp).forEach(([sc, sd]) =>
    Object.entries(sd.agents).forEach(([ag, ad]) => {
      const m = ad.metrics
      if (m.avg_throughput > bestTP.v) bestTP = { v: m.avg_throughput, ag, sc }
      if (m.avg_wait_time < lowWait.v) lowWait = { v: m.avg_wait_time, ag, sc }
      if (m.avg_emissions < lowEmit.v) lowEmit = { v: m.avg_emissions, ag, sc }
      if (m.avg_safety_score > bestSafe.v) bestSafe = { v: m.avg_safety_score, ag, sc }
    })
  )

  const norm = cmp.normal?.agents
  const ftW = norm?.fixed_timer?.metrics?.avg_wait_time || 1
  const qlW = norm?.q_learning?.metrics?.avg_wait_time || 0
  const waitImp = (((ftW - qlW) / ftW) * 100).toFixed(1)
  const ftT = norm?.fixed_timer?.metrics?.avg_throughput || 1
  const qlT = norm?.q_learning?.metrics?.avg_throughput || 0
  const tpImp = (((qlT - ftT) / ftT) * 100).toFixed(1)

  const barData = norm ? Object.entries(norm).map(([ag, ad]) => ({
    agent: AGENT_LABELS[ag],
    Throughput: Math.round(ad.metrics.avg_throughput),
    "Wait Time": Math.round(ad.metrics.avg_wait_time),
    Safety: Math.round(ad.metrics.avg_safety_score),
  })) : []

  const radarData = [
    { m: "Throughput", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], Math.min(100,(d.metrics.avg_throughput/6000)*100)])) },
    { m: "Low Wait", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_wait_time/100)])) },
    { m: "Safety", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], d.metrics.avg_safety_score])) },
    { m: "Low Emissions", ...Object.fromEntries(Object.entries(norm || {}).map(([a,d]) => [AGENT_LABELS[a], Math.max(0,100-d.metrics.avg_emissions*20)])) },
  ]

  const kpis = [
    { icon: Zap, label: "Best Throughput", sub: AGENT_LABELS[bestTP.ag], value: bestTP.v?.toFixed(0), unit: "vehicles", badge: "+" + tpImp + "% vs Fixed", positive: true, color: "var(--teal)" },
    { icon: Clock, label: "Lowest Wait Time", sub: AGENT_LABELS[lowWait.ag], value: lowWait.v?.toFixed(1), unit: "steps", badge: "+" + waitImp + "% improved", positive: true, color: "var(--green)" },
    { icon: Wind, label: "Lowest Emissions", sub: AGENT_LABELS[lowEmit.ag], value: lowEmit.v?.toFixed(3), unit: "kg CO\u2082", color: "var(--gold)" },
    { icon: Shield, label: "Best Safety Score", sub: AGENT_LABELS[bestSafe.ag], value: bestSafe.v?.toFixed(1), unit: "/ 100", color: "var(--purple)" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <div key={i} className={"kpi-card fade-up-d" + i} style={{ "--accent-color": k.color }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: k.color.replace(")", ",0.12)").replace("var(", "").replace(")", ""), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: k.color }} />
                </div>
              </div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value">
                {k.value}<span className="kpi-unit">{k.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{k.sub}</div>
              {k.badge && <div className={"kpi-badge " + (k.positive ? "positive" : "negative")}>{k.badge}</div>}
            </div>
          )
        })}
      </div>

      {/* Grid Map + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Dubai Intersection Map */}
        <div className="lg:col-span-2 card fade-up-d1">
          <div className="section-title">
            <span className="dot" style={{ background: "var(--teal)" }} />
            Dubai 4x4 Intersection Grid
          </div>
          <svg viewBox="0 0 400 440" style={{ width: "100%" }}>
            {/* Zone labels */}
            {ZONES.map((z, i) => (
              <text key={z} x="10" y={60 + i * 100} fill="#64748B" fontSize="9" fontWeight="700" letterSpacing="0.1em">{z}</text>
            ))}
            {/* Roads */}
            {[0,1,2,3].map(r => <rect key={"h"+r} x="50" y={48+r*100} width="330" height="24" rx="4" fill="#151D2E" />)}
            {[0,1,2,3].map(r => <line key={"hm"+r} x1="50" y1={60+r*100} x2="380" y2={60+r*100} stroke="#1E293B" strokeWidth="1" strokeDasharray="8 5" />)}
            {[0,1,2,3].map(c => <rect key={"v"+c} x={63+c*100} y="35" width="24" height="380" rx="4" fill="#151D2E" />)}
            {[0,1,2,3].map(c => <line key={"vm"+c} x1={75+c*100} y1="35" x2={75+c*100} y2="415" stroke="#1E293B" strokeWidth="1" strokeDasharray="8 5" />)}
            {/* Intersection nodes */}
            {NAMES.map((name, i) => {
              const r = Math.floor(i/4), c = i%4
              const cx = 75 + c*100, cy = 60 + r*100
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="16" fill="#0F1629" stroke="#06B6D4" strokeWidth="1.5" opacity="0.9" />
                  <circle cx={cx-5} cy={cy-4} r="3" fill="#22C55E" />
                  <circle cx={cx+5} cy={cy-4} r="3" fill="#EF4444" opacity="0.5" />
                  <text x={cx} y={cy+5} textAnchor="middle" fill="#CBD5E1" fontSize="5" fontWeight="600">INT-{String(i+1).padStart(2,"0")}</text>
                  <text x={cx} y={cy+24} textAnchor="middle" fill="#94A3B8" fontSize="6.5" fontWeight="500">{name}</text>
                </g>
              )
            })}
            {/* Legend */}
            <g transform="translate(60, 430)">
              <circle cx="0" cy="0" r="3" fill="#22C55E" /><text x="8" y="3" fill="#94A3B8" fontSize="7">NS Green</text>
              <circle cx="70" cy="0" r="3" fill="#EF4444" /><text x="78" y="3" fill="#94A3B8" fontSize="7">EW Red</text>
              <circle cx="135" cy="0" r="3" fill="#06B6D4" stroke="#06B6D4" /><text x="143" y="3" fill="#94A3B8" fontSize="7">Intersection</text>
            </g>
          </svg>
        </div>

        {/* Radar + Bar */}
        <div className="lg:col-span-3" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card fade-up-d2">
            <div className="section-title">
              <span className="dot" style={{ background: "var(--blue)" }} />
              Agent Performance Profile
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Normal Scenario</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E293B" />
                <PolarAngleAxis dataKey="m" tick={{ fill: "#CBD5E1", fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis tick={{ fill: "#64748B", fontSize: 9 }} domain={[0, 100]} />
                <Radar name="Fixed Timer" dataKey="Fixed Timer" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={2} />
                <Radar name="Q-Learning" dataKey="Q-Learning" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.12} strokeWidth={2.5} />
                <Radar name="SARSA" dataKey="SARSA" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1", paddingTop: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card fade-up-d3">
            <div className="section-title">
              <span className="dot" style={{ background: "var(--gold)" }} />
              Normal Scenario Metrics
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
                <XAxis dataKey="agent" stroke="#94A3B8" tick={{ fill: "#CBD5E1", fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1" }} />
                <Bar dataKey="Throughput" fill="#3B82F6" radius={[6,6,0,0]} />
                <Bar dataKey="Wait Time" fill="#F59E0B" radius={[6,6,0,0]} />
                <Bar dataKey="Safety" fill="#10B981" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card fade-up">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--purple)" }} />
          Complete Experiment Results
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>5 Scenarios \u00d7 3 Agents = 15 Experiments</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th><th>Agent</th>
                <th className="text-right">Throughput</th>
                <th className="text-right">Wait Time</th>
                <th className="text-right">Emissions (kg)</th>
                <th className="text-right">Safety</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(cmp).map(([sc, sd]) =>
                Object.entries(sd.agents).map(([ag, ad], idx) => (
                  <tr key={sc+ag}>
                    {idx === 0 && <td className="highlight" rowSpan={Object.keys(sd.agents).length} style={{ verticalAlign: "top" }}>{SC_LABELS[sc]}</td>}
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: AGENT_COLORS[ag], flexShrink: 0 }} />
                        {AGENT_LABELS[ag]}
                      </span>
                    </td>
                    <td className="text-right mono">{ad.metrics.avg_throughput?.toFixed(1)}</td>
                    <td className="text-right mono">{ad.metrics.avg_wait_time?.toFixed(1)}</td>
                    <td className="text-right mono">{ad.metrics.avg_emissions?.toFixed(4)}</td>
                    <td className="text-right mono">{ad.metrics.avg_safety_score?.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
'''

# ─────────────────────────── 4. LiveSimulation.jsx ───────────────────────────
LIVESIM = r'''import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Play, Pause, SkipForward, RotateCcw, Activity, Gauge, Timer, Car } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const NAMES = [
  "Al Rigga","Deira CC","Maktoum Br.","Bur Dubai",
  "SZR Jct.","DIFC","Biz Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tun.","Marina",
  "DIP","Acad. City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH DUBAI"]
const AGENT_META = {
  q_learning: { label: "Q-Learning", color: "#3B82F6", desc: "Off-policy TD control" },
  sarsa: { label: "SARSA", color: "#10B981", desc: "On-policy TD control" },
  fixed_timer: { label: "Fixed Timer", color: "#EF4444", desc: "Baseline (30s cycle)" },
}
const ttStyle = { background: "#0F1629", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }

function congestionInfo(qNS, qEW) {
  const t = qNS + qEW
  if (t < 8) return { fill: "#10B981", ring: "rgba(16,185,129,0.15)", label: "Low", textColor: "#6EE7B7" }
  if (t < 20) return { fill: "#F59E0B", ring: "rgba(245,158,11,0.15)", label: "Moderate", textColor: "#FCD34D" }
  if (t < 40) return { fill: "#F97316", ring: "rgba(249,115,22,0.15)", label: "High", textColor: "#FDBA74" }
  return { fill: "#EF4444", ring: "rgba(239,68,68,0.2)", label: "Critical", textColor: "#FCA5A5" }
}

export default function LiveSimulation({ data }) {
  const agents = {
    q_learning: data.live_simulation_q_learning,
    sarsa: data.live_simulation_sarsa,
    fixed_timer: data.live_simulation_fixed_timer,
  }
  const [agentType, setAgentType] = useState("q_learning")
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(300)
  const intervalRef = useRef(null)

  const frames = agents[agentType]
  const maxStep = frames ? frames.length - 1 : 0
  const frame = frames ? frames[Math.min(step, maxStep)] : null

  const advance = useCallback(() => setStep(s => s >= maxStep ? 0 : s + 1), [maxStep])

  useEffect(() => {
    if (playing) intervalRef.current = setInterval(advance, speed)
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, advance])

  useEffect(() => { setStep(0); setPlaying(false) }, [agentType])

  const rollingData = useMemo(() => {
    if (!frames) return []
    const start = Math.max(0, step - 29)
    return frames.slice(start, step + 1).map((f, i) => ({
      step: start + i,
      queue: f.metrics?.avg_queue?.toFixed(1),
      tp: f.metrics?.throughput,
    }))
  }, [frames, step])

  const totalQueue = frame?.grid?.reduce((s, g) => s + g.queue_ns + g.queue_ew, 0) || 0
  const maxQueue = frame?.grid?.reduce((m, g) => Math.max(m, g.queue_ns + g.queue_ew), 0) || 0
  const greenCount = frame?.grid?.filter(g => !g.is_yellow).length || 0
  const agMeta = AGENT_META[agentType]

  if (!frames) return <p style={{ color: "var(--text-label)" }}>No live simulation data available.</p>

  // Grid dimensions
  const GS = 155, GO = 95 // spacing, offset
  const VB_W = GO * 2 + GS * 3 + 60, VB_H = GO * 2 + GS * 3 + 80

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Control Bar */}
      <div className="card card-compact" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        {/* Agent Selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(AGENT_META).map(([k, m]) => (
            <button key={k} onClick={() => setAgentType(k)}
              className={"btn btn-sm " + (agentType === k ? "btn-teal" : "btn-outline")}
              style={agentType === k ? { background: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />

        {/* Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setPlaying(!playing)} className="btn btn-sm btn-teal">
            {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
          <button onClick={advance} className="btn btn-sm btn-outline">
            <SkipForward size={14} /> Step
          </button>
          <button onClick={() => { setStep(0); setPlaying(false) }} className="btn btn-sm btn-outline">
            <RotateCcw size={14} />
          </button>
        </div>

        <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />

        {/* Speed */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-label)" }}>
          <span>Speed</span>
          <input type="range" min={50} max={600} step={50} value={speed}
            onChange={e => setSpeed(Number(e.target.value))} style={{ width: 80 }} />
          <span style={{ color: "var(--text-secondary)", width: 42 }}>{speed}ms</span>
        </div>

        {/* Progress */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="badge-teal">{agMeta.label}</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-label)" }}>
            Step <strong style={{ color: "var(--text-primary)" }}>{step}</strong> / {maxStep}
          </span>
          <div style={{ width: 100, height: 6, background: "var(--bg-elevated)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: agMeta.color, borderRadius: 6, width: (step/maxStep*100) + "%", transition: "width 0.15s" }} />
          </div>
        </div>
      </div>

      {/* Main Grid + Side Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* SVG Traffic Grid */}
        <div className="xl:col-span-2 card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 8px" }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              <Activity size={16} style={{ color: "var(--teal)" }} />
              Dubai Traffic Network
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-label)" }}>
              <span style={{ color: "var(--green)" }}>{"\u25CF"} Green: {greenCount}</span>
              <span style={{ color: "var(--gold)" }}>{"\u25CF"} Yellow: {16 - greenCount}</span>
              <span>Hour: {frame?.metrics?.hour || 8}:00</span>
            </div>
          </div>

          <svg viewBox={"0 0 " + VB_W + " " + VB_H} className="traffic-grid-bg" style={{ width: "100%", display: "block" }}>
            {/* Zone labels */}
            {ZONES.map((z, i) => (
              <text key={z} x="12" y={GO + i * GS + 4} fill="#475569" fontSize="8" fontWeight="700" letterSpacing="0.12em">{z}</text>
            ))}

            {/* ROADS - Horizontal */}
            {[0,1,2,3].map(r => {
              const y = GO + r * GS
              return (
                <g key={"rh"+r}>
                  <rect x={GO - 30} y={y - 16} width={GS * 3 + 60} height={32} rx="3" fill="#131A2E" />
                  <line x1={GO - 25} y1={y} x2={GO + GS*3 + 25} y2={y} stroke="#1E293B" strokeWidth="1" strokeDasharray="10 6" />
                </g>
              )
            })}
            {/* ROADS - Vertical */}
            {[0,1,2,3].map(c => {
              const x = GO + c * GS
              return (
                <g key={"rv"+c}>
                  <rect x={x - 16} y={GO - 30} width={32} height={GS * 3 + 60} rx="3" fill="#131A2E" />
                  <line x1={x} y1={GO - 25} x2={x} y2={GO + GS*3 + 25} stroke="#1E293B" strokeWidth="1" strokeDasharray="10 6" />
                </g>
              )
            })}

            {/* INTERSECTIONS */}
            {frame?.grid?.map((inter, idx) => {
              const row = Math.floor(idx/4), col = idx%4
              const cx = GO + col * GS, cy = GO + row * GS
              const ci = congestionInfo(inter.queue_ns, inter.queue_ew)
              const nsBar = Math.min(55, inter.queue_ns * 2.2)
              const ewBar = Math.min(55, inter.queue_ew * 2.2)
              const nsCol = inter.phase === 0 ? "#22C55E" : "#EF4444"
              const ewCol = inter.phase === 1 ? "#22C55E" : "#EF4444"

              return (
                <g key={idx}>
                  {/* Congestion ring */}
                  <circle cx={cx} cy={cy} r="28" fill={ci.ring} />

                  {/* NS Queue bar (upward) */}
                  {inter.queue_ns > 0 && <>
                    <rect x={cx-3} y={cy - 28 - nsBar} width="6" height={nsBar} rx="3" fill="#3B82F6" opacity="0.8" />
                    <text x={cx} y={cy - 32 - nsBar} textAnchor="middle" fill="#93C5FD" fontSize="8" fontWeight="700">{inter.queue_ns}</text>
                  </>}

                  {/* EW Queue bar (rightward) */}
                  {inter.queue_ew > 0 && <>
                    <rect x={cx + 28} y={cy-3} width={ewBar} height="6" rx="3" fill="#F59E0B" opacity="0.8" />
                    <text x={cx + 32 + ewBar} y={cy + 3} fill="#FCD34D" fontSize="8" fontWeight="700">{inter.queue_ew}</text>
                  </>}

                  {/* Main node */}
                  <circle cx={cx} cy={cy} r="20" fill={ci.fill} opacity="0.15" stroke={ci.fill} strokeWidth="2" />
                  <circle cx={cx} cy={cy} r="14" fill="#0A0F1C" stroke={ci.fill} strokeWidth="1.5" />

                  {/* Traffic lights */}
                  <circle cx={cx-6} cy={cy-5} r="3.5" fill={nsCol} opacity={inter.is_yellow ? 0.3 : 0.9} />
                  <circle cx={cx+6} cy={cy-5} r="3.5" fill={ewCol} opacity={inter.is_yellow ? 0.3 : 0.9} />
                  {inter.is_yellow && (
                    <circle cx={cx} cy={cy-5} r="3.5" fill="#EAB308">
                      <animate attributeName="opacity" values="1;0.3;1" dur="0.7s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* ID label */}
                  <text x={cx} y={cy+6} textAnchor="middle" fill="#E2E8F0" fontSize="7" fontWeight="700">{String(idx+1).padStart(2,"0")}</text>

                  {/* Name */}
                  <text x={cx} y={cy+33} textAnchor="middle" fill="#CBD5E1" fontSize="7.5" fontWeight="600">{NAMES[idx]}</text>

                  {/* Congestion label */}
                  <text x={cx} y={cy+42} textAnchor="middle" fill={ci.textColor} fontSize="6" fontWeight="600">{ci.label}</text>
                </g>
              )
            })}

            {/* Legend */}
            <g transform={"translate(" + (GO - 20) + "," + (VB_H - 30) + ")"}>
              <rect x="0" y="-4" width="6" height="10" rx="2" fill="#3B82F6" opacity="0.8" />
              <text x="10" y="4" fill="#94A3B8" fontSize="8" fontWeight="500">NS Queue</text>
              <rect x="80" y="-4" width="10" height="6" rx="2" fill="#F59E0B" opacity="0.8" />
              <text x="95" y="4" fill="#94A3B8" fontSize="8" fontWeight="500">EW Queue</text>
              <circle cx="170" cy="1" r="4" fill="#22C55E" /><text x="178" y="4" fill="#94A3B8" fontSize="8">Green</text>
              <circle cx="218" cy="1" r="4" fill="#EF4444" /><text x="226" y="4" fill="#94A3B8" fontSize="8">Red</text>
              <circle cx="258" cy="1" r="4" fill="#EAB308" /><text x="266" y="4" fill="#94A3B8" fontSize="8">Yellow</text>
              <circle cx="310" cy="1" r="6" fill="rgba(16,185,129,0.15)" stroke="#10B981" strokeWidth="1" /><text x="320" y="4" fill="#94A3B8" fontSize="8">Low</text>
              <circle cx="350" cy="1" r="6" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth="1" /><text x="360" y="4" fill="#94A3B8" fontSize="8">Critical</text>
            </g>
          </svg>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Agent Info */}
          <div className="card card-compact">
            <div className="section-subtitle">Active Agent</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: agMeta.color }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{agMeta.label}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-label)", marginTop: 4 }}>{agMeta.desc}</div>
          </div>

          {/* Live Stats */}
          <div className="card card-compact">
            <div className="section-subtitle">Live Metrics</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-mini">
                <div className="metric-mini-label">Avg Queue</div>
                <div className="metric-mini-value">{frame?.metrics?.avg_queue?.toFixed(1)}</div>
              </div>
              <div className="metric-mini">
                <div className="metric-mini-label">Throughput</div>
                <div className="metric-mini-value" style={{ color: "var(--teal)" }}>{frame?.metrics?.throughput}</div>
              </div>
              <div className="metric-mini">
                <div className="metric-mini-label">Peak Queue</div>
                <div className="metric-mini-value" style={{ color: "var(--gold)" }}>{maxQueue}</div>
              </div>
              <div className="metric-mini">
                <div className="metric-mini-label">Total Queue</div>
                <div className="metric-mini-value">{totalQueue}</div>
              </div>
            </div>
          </div>

          {/* Rolling Chart */}
          <div className="card card-compact">
            <div className="section-subtitle">Queue Trend (Last 30 Steps)</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
                <XAxis dataKey="step" stroke="#475569" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                <YAxis stroke="#475569" tick={{ fontSize: 9, fill: "#94A3B8" }} />
                <Tooltip contentStyle={ttStyle} />
                <Line type="monotone" dataKey="queue" stroke="#3B82F6" strokeWidth={2} dot={false} name="Avg Queue" />
                <Line type="monotone" dataKey="tp" stroke="#06B6D4" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Throughput" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Agent Actions */}
          <div className="card card-compact">
            <div className="section-subtitle">Agent Actions (16 Intersections)</div>
            <div className="grid grid-cols-4 gap-2">
              {frame?.actions?.map((a, i) => (
                <div key={i} style={{
                  textAlign: "center", padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: a === 0 ? "var(--bg-elevated)" : a === 1 ? "var(--gold-dim)" : "var(--blue-dim)",
                  color: a === 0 ? "var(--text-label)" : a === 1 ? "var(--gold)" : "var(--blue)",
                  border: a === 0 ? "1px solid var(--border-subtle)" : a === 1 ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(59,130,246,0.2)"
                }}>
                  {a === 0 ? "Hold" : a === 1 ? "Switch" : "Ext."}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 10, color: "var(--text-muted)" }}>
              <span>Hold = maintain phase</span>
              <span>Switch = change signal</span>
              <span>Ext. = extend green</span>
            </div>
          </div>

          {/* Reward Grid */}
          <div className="card card-compact">
            <div className="section-subtitle">Step Rewards</div>
            <div className="grid grid-cols-4 gap-2">
              {frame?.rewards?.map((r, i) => (
                <div key={i} style={{
                  textAlign: "center", padding: "5px 0", borderRadius: 8,
                  fontSize: 11, fontFamily: "monospace", fontWeight: 600,
                  background: r >= 0 ? "var(--green-dim)" : "var(--red-dim)",
                  color: r >= 0 ? "var(--green)" : "var(--red)"
                }}>
                  {r?.toFixed(1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'''

# ─────────────────────────── 5. TrainingCurves.jsx ───────────────────────────
TRAINING = r'''import { useState } from "react"
import { TrendingUp, BookOpen } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const ttStyle = { background: "#0F1629", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }

const METRICS = [
  { key: "episode_rewards", label: "Cumulative Reward" },
  { key: "avg_wait_times", label: "Avg Wait Time" },
  { key: "throughputs", label: "Throughput" },
  { key: "emissions", label: "CO\u2082 Emissions" },
  { key: "safety_scores", label: "Safety Score" },
]

export default function TrainingCurves({ data }) {
  const training = data.training_results
  const [scenario, setScenario] = useState("normal")
  const [metric, setMetric] = useState("episode_rewards")

  if (!training) return <p style={{ color: "var(--text-label)" }}>No training data.</p>
  const scData = training[scenario]
  if (!scData) return <p style={{ color: "var(--text-label)" }}>No data for scenario.</p>

  const agents = Object.keys(scData)
  const numEp = scData[agents[0]]?.history?.[metric]?.length || 0

  const chartData = Array.from({ length: numEp }, (_, i) => {
    const pt = { episode: i + 1 }
    agents.forEach(ag => { pt[AGENT_LABELS[ag]] = scData[ag]?.history?.[metric]?.[i] ?? 0 })
    return pt
  })

  const epsilonData = Array.from({ length: numEp }, (_, i) => ({
    episode: i + 1,
    "Q-Learning": scData.q_learning?.history?.epsilons?.[i] ?? 0,
    "SARSA": scData.sarsa?.history?.epsilons?.[i] ?? 0,
  }))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Selectors */}
      <div className="card card-compact" style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <div>
          <div className="section-subtitle">Scenario</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.keys(training).map(sc => (
              <button key={sc} onClick={() => setScenario(sc)}
                className={"btn btn-sm btn-outline " + (scenario === sc ? "active" : "")}>
                {SC_LABELS[sc] || sc}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-subtitle">Metric</div>
          <div style={{ display: "flex", gap: 6 }}>
            {METRICS.map(m => (
              <button key={m.key} onClick={() => setMetric(m.key)}
                className={"btn btn-sm btn-outline " + (metric === m.key ? "active" : "")}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card">
        <div className="section-title">
          <TrendingUp size={16} style={{ color: "var(--blue)" }} />
          {METRICS.find(m => m.key === metric)?.label} \u2014 {SC_LABELS[scenario]}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>{numEp} episodes \u00b7 200 steps each</span>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData}>
            <defs>
              {agents.map(ag => (
                <linearGradient key={ag} id={"tg_" + ag} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AGENT_COLORS[ag]} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={AGENT_COLORS[ag]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
            <XAxis dataKey="episode" stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }}
              label={{ value: "Episode", position: "insideBottomRight", offset: -5, style: { fill: "#64748B", fontSize: 11 } }} />
            <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1", paddingTop: 12 }} />
            {agents.map(ag => (
              <Area key={ag} type="monotone" dataKey={AGENT_LABELS[ag]}
                stroke={AGENT_COLORS[ag]} strokeWidth={2.5} fill={"url(#tg_" + ag + ")"} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Epsilon Decay */}
      <div className="card">
        <div className="section-title">
          <BookOpen size={16} style={{ color: "var(--purple)" }} />
          Exploration Rate (\u03b5) Decay
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>\u03b5-greedy \u00b7 decay = 0.995</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={epsilonData}>
            <defs>
              <linearGradient id="epsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
            <XAxis dataKey="episode" stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 10 }} domain={[0, 1]} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#CBD5E1" }} />
            <Area type="monotone" dataKey="Q-Learning" stroke="#3B82F6" fill="url(#epsGrad)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="SARSA" stroke="#10B981" fill="transparent" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Final Performance */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--gold)" }} />
          Converged Performance (Last 50 Episodes) \u2014 {SC_LABELS[scenario]}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th className="text-right">Avg Reward</th>
              <th className="text-right">Throughput</th>
              <th className="text-right">Wait Time</th>
              <th className="text-right">Emissions</th>
              <th className="text-right">Safety</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(ag => {
              const fm = scData[ag]?.final_metrics
              if (!fm) return null
              return (
                <tr key={ag}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: AGENT_COLORS[ag] }} />
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{AGENT_LABELS[ag]}</span>
                    </span>
                  </td>
                  <td className="text-right mono">{fm.avg_reward?.toFixed(1)}</td>
                  <td className="text-right mono">{fm.avg_throughput?.toFixed(1)}</td>
                  <td className="text-right mono">{fm.avg_wait_time?.toFixed(1)}</td>
                  <td className="text-right mono">{fm.avg_emissions?.toFixed(4)}</td>
                  <td className="text-right mono">{fm.avg_safety_score?.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
'''

# ─────────────────────────── 6. ScenarioComparison.jsx ───────────────────────────
SCENARIO = r'''import { useState } from "react"
import { GitCompare, ArrowUp, ArrowDown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"

const AGENT_COLORS = { fixed_timer: "#EF4444", q_learning: "#3B82F6", sarsa: "#10B981" }
const AGENT_LABELS = { fixed_timer: "Fixed Timer", q_learning: "Q-Learning", sarsa: "SARSA" }
const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const ttStyle = { background: "#0F1629", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }

const METRIC_OPTS = [
  { key: "avg_throughput", label: "Throughput", unit: "vehicles", higher: true },
  { key: "avg_wait_time", label: "Wait Time", unit: "steps", higher: false },
  { key: "avg_emissions", label: "Emissions", unit: "kg CO\u2082", higher: false },
  { key: "avg_safety_score", label: "Safety Score", unit: "/ 100", higher: true },
]

export default function ScenarioComparison({ data }) {
  const cmp = data.scenario_comparison
  const [metric, setMetric] = useState("avg_throughput")
  if (!cmp) return <p style={{ color: "var(--text-label)" }}>No comparison data.</p>

  const scenarios = Object.keys(cmp)
  const agents = ["fixed_timer", "q_learning", "sarsa"]
  const mInfo = METRIC_OPTS.find(m => m.key === metric)
  const isLower = !mInfo?.higher

  const chartData = scenarios.map(sc => {
    const e = { scenario: SC_LABELS[sc] || sc }
    agents.forEach(ag => { e[AGENT_LABELS[ag]] = cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0 })
    return e
  })

  const allVals = []
  scenarios.forEach(sc => agents.forEach(ag => allVals.push(cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0)))
  const minV = Math.min(...allVals), maxV = Math.max(...allVals)

  function heatBg(val) {
    const n = maxV === minV ? 0.5 : (val - minV) / (maxV - minV)
    const adj = isLower ? 1 - n : n
    const h = adj * 120
    return { bg: "hsl(" + h + ", 65%, 18%)", text: "hsl(" + h + ", 80%, 65%)", border: "hsl(" + h + ", 60%, 28%)" }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Metric Selector */}
      <div className="card card-compact">
        <div className="section-subtitle">Select Metric</div>
        <div style={{ display: "flex", gap: 6 }}>
          {METRIC_OPTS.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={"btn btn-outline " + (metric === m.key ? "active" : "")}>
              {m.label}
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>({m.unit})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card">
        <div className="section-title">
          <GitCompare size={16} style={{ color: "var(--purple)" }} />
          {mInfo?.label} Across All Scenarios
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} barGap={3} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2236" />
            <XAxis dataKey="scenario" stroke="#64748B" tick={{ fill: "#CBD5E1", fontSize: 12 }} />
            <YAxis stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 11 }} />
            <Tooltip contentStyle={ttStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "#CBD5E1" }} />
            {agents.map(ag => (
              <Bar key={ag} dataKey={AGENT_LABELS[ag]} fill={AGENT_COLORS[ag]} radius={[5,5,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--gold)" }} />
          Performance Heatmap \u2014 {mInfo?.label}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                {agents.map(ag => <th key={ag} style={{ textAlign: "center" }}>{AGENT_LABELS[ag]}</th>)}
              </tr>
            </thead>
            <tbody>
              {scenarios.map(sc => (
                <tr key={sc}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{SC_LABELS[sc]}</td>
                  {agents.map(ag => {
                    const val = cmp[sc]?.agents?.[ag]?.metrics?.[metric] ?? 0
                    const h = heatBg(val)
                    return (
                      <td key={ag} style={{ textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "6px 14px", borderRadius: 8,
                          background: h.bg, color: h.text, border: "1px solid " + h.border,
                          fontWeight: 700, fontSize: 12, fontFamily: "monospace",
                        }}>
                          {val?.toFixed(metric === "avg_emissions" ? 4 : 1)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 11, color: "var(--text-muted)" }}>
          <span>{isLower ? "Better \u2192" : "\u2190 Worse"}</span>
          <div style={{
            flex: 1, height: 6, borderRadius: 6,
            background: isLower
              ? "linear-gradient(to right, hsl(120,65%,22%), hsl(0,65%,22%))"
              : "linear-gradient(to right, hsl(0,65%,22%), hsl(120,65%,22%))"
          }} />
          <span>{isLower ? "\u2190 Worse" : "Better \u2192"}</span>
        </div>
      </div>

      {/* RL Improvement */}
      <div className="card">
        <div className="section-title">
          <span className="dot" style={{ background: "var(--green)" }} />
          RL Improvement Over Fixed Timer
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th className="text-right">Q-Learning vs Fixed</th>
              <th className="text-right">SARSA vs Fixed</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(sc => {
              const fx = cmp[sc]?.agents?.fixed_timer?.metrics?.[metric] ?? 0
              const ql = cmp[sc]?.agents?.q_learning?.metrics?.[metric] ?? 0
              const sa = cmp[sc]?.agents?.sarsa?.metrics?.[metric] ?? 0
              const pQL = fx ? ((ql - fx) / Math.abs(fx) * 100) : 0
              const pSA = fx ? ((sa - fx) / Math.abs(fx) * 100) : 0
              const qlOk = isLower ? pQL < 0 : pQL > 0
              const saOk = isLower ? pSA < 0 : pSA > 0
              return (
                <tr key={sc}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{SC_LABELS[sc]}</td>
                  <td className="text-right">
                    <span className={"badge " + (qlOk ? "badge-green" : "badge-red")}>
                      {qlOk ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {Math.abs(pQL).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={"badge " + (saOk ? "badge-green" : "badge-red")}>
                      {saOk ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {Math.abs(pSA).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
'''

# ─────────────────────────── 7. MCDMAnalysis.jsx ───────────────────────────
MCDM = r'''import { useState } from "react"
import { Download, Scale, Award, Info, FileText } from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts"

const SC_LABELS = { normal:"Normal", rush_hour:"Rush Hour", incident:"Incident", event:"Event", bus_priority:"Bus Priority" }
const COLORS = ["#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6"]
const ttStyle = { background: "#0F1629", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 12, color: "#F1F5F9", fontSize: 11 }

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
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>TOPSIS closeness as each criterion weight varies \u00b10.15</span>
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
'''

# ─────────────────────────── WRITE ALL ───────────────────────────
print("Rebuilding dashboard...")
write("index.css", CSS)
write("App.jsx", APP)
write("components/Overview.jsx", OVERVIEW)
write("components/LiveSimulation.jsx", LIVESIM)
write("components/TrainingCurves.jsx", TRAINING)
write("components/ScenarioComparison.jsx", SCENARIO)
write("components/MCDMAnalysis.jsx", MCDM)
print("Done! All 7 files written.")
