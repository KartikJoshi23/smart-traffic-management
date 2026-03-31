import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Play, Pause, SkipForward, RotateCcw, AlertTriangle, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const INT_NAMES = [
  "Al Rigga", "Deira CC", "Maktoum Br.", "Bur Dubai",
  "SZR Int.1", "DIFC", "Biz Bay", "Dubai Mall",
  "Al Quoz", "Jumeirah", "Palm Tun.", "Marina",
  "DIP", "Acad. City", "Al Barsha", "Airport"
]

const tooltipStyle = { background: "rgba(13,20,36,0.95)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: 12, fontSize: 11 }

function getCongestionColor(queueNS, queueEW) {
  const total = queueNS + queueEW
  if (total < 10) return { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", level: "Low" }
  if (total < 25) return { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", level: "Medium" }
  if (total < 45) return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", level: "High" }
  return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)", level: "Critical" }
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

  // Rolling metrics for chart (last 30 steps)
  const rollingData = useMemo(() => {
    if (!frames) return []
    const start = Math.max(0, step - 29)
    return frames.slice(start, step + 1).map((f, i) => ({
      step: start + i,
      queue: f.metrics?.avg_queue,
      throughput: f.metrics?.throughput,
      wait: f.metrics?.avg_wait,
    }))
  }, [frames, step])

  // Current stats
  const totalQueue = frame?.grid?.reduce((s, g) => s + g.queue_ns + g.queue_ew, 0) || 0
  const maxQueue = frame?.grid?.reduce((m, g) => Math.max(m, g.queue_ns + g.queue_ew), 0) || 0
  const greenCount = frame?.grid?.filter(g => !g.is_yellow).length || 0
  const yellowCount = frame?.grid?.filter(g => g.is_yellow).length || 0

  if (!frames) return <p className="text-slate-500">No live simulation data available.</p>

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Agent selector */}
          <div className="flex gap-1.5">
            {[["q_learning","Q-Learning"],["sarsa","SARSA"],["fixed_timer","Fixed Timer"]].map(([k,l]) => (
              <button key={k} onClick={() => setAgentType(k)}
                className={"btn " + (agentType === k ? "btn-primary" : "btn-ghost")}>
                {l}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Playback */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPlaying(!playing)}
              className="btn btn-primary flex items-center gap-1.5">
              {playing ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
            </button>
            <button onClick={advance} className="btn btn-ghost flex items-center gap-1.5">
              <SkipForward size={14} /> Step
            </button>
            <button onClick={() => { setStep(0); setPlaying(false) }} className="btn btn-ghost flex items-center gap-1.5">
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Speed */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Speed</span>
            <input type="range" min={50} max={600} step={50} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-20 accent-blue-500" />
            <span className="text-slate-400 w-12">{speed}ms</span>
          </div>

          {/* Progress */}
          <div className="ml-auto flex items-center gap-3">
            <div className="text-xs text-slate-500">
              Step <span className="text-white font-semibold">{step}</span>/{maxStep}
            </div>
            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200 rounded-full"
                style={{ width: (step/maxStep*100) + "%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Grid + Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 4x4 Traffic Grid */}
        <div className="xl:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              Traffic Network — Dubai 4\u00d74 Grid
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{"🟢"} Green: {greenCount}</span>
              <span>{"🟡"} Yellow: {yellowCount}</span>
              <span>Time: {frame?.metrics?.hour || 8}:00</span>
            </div>
          </div>

          {/* SVG Road Network */}
          <svg viewBox="0 0 680 680" className="w-full road-grid rounded-xl" style={{background: "#080d1a"}}>
            {/* Roads */}
            {[0,1,2,3].map(r => (
              <g key={"rh"+r}>
                <line x1="40" y1={95+r*160} x2="640" y2={95+r*160} stroke="#141c2e" strokeWidth="32" strokeLinecap="round"/>
                <line x1="40" y1={95+r*160} x2="640" y2={95+r*160} stroke="#1a2438" strokeWidth="28" strokeLinecap="round"/>
                <line x1="40" y1={95+r*160} x2="640" y2={95+r*160} stroke="#1e293b" strokeWidth="1" strokeDasharray="8 6" opacity="0.5"/>
              </g>
            ))}
            {[0,1,2,3].map(c => (
              <g key={"rv"+c}>
                <line x1={95+c*160} y1="40" x2={95+c*160} y2="640" stroke="#141c2e" strokeWidth="32" strokeLinecap="round"/>
                <line x1={95+c*160} y1="40" x2={95+c*160} y2="640" stroke="#1a2438" strokeWidth="28" strokeLinecap="round"/>
                <line x1={95+c*160} y1="40" x2={95+c*160} y2="640" stroke="#1e293b" strokeWidth="1" strokeDasharray="8 6" opacity="0.5"/>
              </g>
            ))}

            {/* Intersections */}
            {frame?.grid?.map((inter, idx) => {
              const row = Math.floor(idx/4), col = idx%4
              const cx = 95 + col*160, cy = 95 + row*160
              const cong = getCongestionColor(inter.queue_ns, inter.queue_ew)
              const totalQ = inter.queue_ns + inter.queue_ew
              const nsBar = Math.min(50, inter.queue_ns * 1.5)
              const ewBar = Math.min(50, inter.queue_ew * 1.5)
              const nsColor = inter.phase === 0 ? "#22c55e" : "#ef4444"
              const ewColor = inter.phase === 1 ? "#22c55e" : "#ef4444"

              return (
                <g key={idx}>
                  {/* Congestion glow */}
                  <rect x={cx-36} y={cy-36} width="72" height="72" rx="12"
                    fill={cong.bg} stroke={cong.border} strokeWidth="1.5" />

                  {/* NS queue bar (above) */}
                  <rect x={cx-4} y={cy - 36 - nsBar} width="8" height={nsBar} rx="2"
                    fill="#3b82f6" opacity="0.7" />
                  {inter.queue_ns > 0 && <text x={cx} y={cy - 40 - nsBar} textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="600">{inter.queue_ns}</text>}

                  {/* EW queue bar (right) */}
                  <rect x={cx+36} y={cy-4} width={ewBar} height="8" rx="2"
                    fill="#f59e0b" opacity="0.7" />
                  {inter.queue_ew > 0 && <text x={cx + 40 + ewBar} y={cy+3} textAnchor="start" fill="#fbbf24" fontSize="8" fontWeight="600">{inter.queue_ew}</text>}

                  {/* Traffic light - NS */}
                  <circle cx={cx-14} cy={cy-12} r="5" fill={nsColor} opacity={inter.is_yellow ? "0.3" : "0.9"} />
                  {/* Traffic light - EW */}
                  <circle cx={cx+14} cy={cy-12} r="5" fill={ewColor} opacity={inter.is_yellow ? "0.3" : "0.9"} />
                  {/* Yellow indicator */}
                  {inter.is_yellow && <circle cx={cx} cy={cy-12} r="5" fill="#eab308" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="0.8s" repeatCount="indefinite" />
                  </circle>}

                  {/* ID */}
                  <text x={cx} y={cy+4} textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="600">{inter.id}</text>
                  {/* Name */}
                  <text x={cx} y={cy+16} textAnchor="middle" fill="#64748b" fontSize="6.5">{INT_NAMES[idx]}</text>
                  {/* Congestion badge */}
                  <text x={cx} y={cy+26} textAnchor="middle" fill={cong.border.replace(/[,)]/g, m => m === ")" ? ")" : ",")} fontSize="5.5" fontWeight="500">{cong.level}</text>
                </g>
              )
            })}

            {/* Legend */}
            <g transform="translate(40, 660)">
              <rect x="0" y="-2" width="8" height="8" rx="2" fill="#3b82f6" opacity="0.7" />
              <text x="12" y="5" fill="#64748b" fontSize="8">NS Queue</text>
              <rect x="80" y="-2" width="8" height="8" rx="2" fill="#f59e0b" opacity="0.7" />
              <text x="92" y="5" fill="#64748b" fontSize="8">EW Queue</text>
              <circle cx="168" cy="2" r="4" fill="#22c55e" />
              <text x="176" y="5" fill="#64748b" fontSize="8">Green</text>
              <circle cx="220" cy="2" r="4" fill="#ef4444" />
              <text x="228" y="5" fill="#64748b" fontSize="8">Red</text>
              <circle cx="260" cy="2" r="4" fill="#eab308" />
              <text x="268" y="5" fill="#64748b" fontSize="8">Yellow</text>
            </g>
          </svg>
        </div>

        {/* Right Panel: Metrics + Charts */}
        <div className="space-y-4">
          {/* Live Metrics */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Metrics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-slate-500">Avg Queue</p>
                <p className="text-xl font-bold text-white">{frame?.metrics?.avg_queue?.toFixed(1)}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-slate-500">Throughput</p>
                <p className="text-xl font-bold text-cyan-400">{frame?.metrics?.throughput}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-slate-500">Max Queue</p>
                <p className="text-xl font-bold text-amber-400">{maxQueue}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-slate-500">Total Queue</p>
                <p className="text-xl font-bold text-white">{totalQueue}</p>
              </div>
            </div>
          </div>

          {/* Rolling Chart */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Queue Trend (Last 30 Steps)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="step" stroke="#475569" tick={{fontSize: 9}} />
                <YAxis stroke="#475569" tick={{fontSize: 9}} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="queue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="throughput" stroke="#06b6d4" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Actions Grid */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Agent Actions</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {frame?.actions?.map((a, i) => (
                <div key={i} className={"text-center py-2 rounded-lg text-xs font-medium " +
                  (a===0 ? "bg-slate-700/50 text-slate-400" : a===1 ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-blue-500/15 text-blue-400 border border-blue-500/20")}>
                  {a===0 ? "Keep" : a===1 ? "Switch" : "Extend"}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-600">
              <span>Keep = maintain phase</span>
              <span>Switch = change signal</span>
              <span>Extend = hold longer</span>
            </div>
          </div>

          {/* Rewards */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Step Rewards</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {frame?.rewards?.map((r, i) => (
                <div key={i} className={"text-center py-1.5 rounded-lg text-xs font-mono " +
                  (r >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
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
