import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Play, Pause, SkipForward, RotateCcw, Activity } from "lucide-react"
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
