import React, { useState, useEffect, useRef, useMemo } from "react"
import { Play, Pause, RotateCcw, Brain, AlertTriangle, CloudRain, Ambulance, Info } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const NAMES = [
  "Al Rigga","Deira CC","Maktoum Br","Bur Dubai",
  "SZR Jct","DIFC","Biz Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tun","Marina",
  "DIP","Acad City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH DUBAI"]
const ZONE_COLORS = ["#3b82f6","#a855f7","#f59e0b","#22c55e"]
const AGENTS = {
  q_learning: { label: "Q-Learning", color: "#3b82f6" },
  sarsa: { label: "SARSA", color: "#22c55e" },
  fixed_timer: { label: "Fixed Timer", color: "#ef4444" },
  coordinated_q_learning: { label: "Coord. Q-Learn", color: "#06b6d4" },
  coordinated_sarsa: { label: "Coord. SARSA", color: "#8b5cf6" },
}
const ACTIONS = ["HOLD","SWITCH","EXTEND"]
const ACT_COLORS = ["#3b82f6","#f59e0b","#a855f7"]
const TT = { background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e4e4e7", fontSize: 11 }

function congLevel(ns, ew) {
  const t = ns + ew
  if (t < 8) return { color: "#22c55e", label: "LOW", bg: "rgba(34,197,94,0.15)" }
  if (t < 20) return { color: "#f59e0b", label: "MED", bg: "rgba(245,158,11,0.15)" }
  if (t < 40) return { color: "#f97316", label: "HIGH", bg: "rgba(249,115,22,0.18)" }
  return { color: "#ef4444", label: "CRIT", bg: "rgba(239,68,68,0.20)" }
}

export default function LiveSimulation({ data }) {
  const agents = {
    q_learning: data.live_simulation_q_learning,
    sarsa: data.live_simulation_sarsa,
    fixed_timer: data.live_simulation_fixed_timer,
    coordinated_q_learning: data.live_simulation_coordinated_q_learning,
    coordinated_sarsa: data.live_simulation_coordinated_sarsa,
  }
  const [agentType, setAgentType] = useState("q_learning")
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(400)
  const [selInt, setSelInt] = useState(0)
  const [chaos, setChaos] = useState({ sand: false, sensor: false, ems: false })
  const ref = useRef(null)

  const frames = agents[agentType]
  const maxStep = frames ? frames.length - 1 : 0
  const frame = frames?.[step]

  useEffect(() => {
    if (playing && frames) {
      ref.current = setInterval(() => {
        setStep(s => s >= maxStep ? (setPlaying(false), s) : s + 1)
      }, speed)
    }
    return () => clearInterval(ref.current)
  }, [playing, speed, maxStep, frames])

  const rolling = useMemo(() => {
    if (!frames) return []
    return frames.slice(Math.max(0, step - 29), step + 1).map(f => ({
      s: f.step,
      q: f.metrics.avg_queue,
      tp: f.metrics.throughput,
      rw: f.rewards.reduce((a, b) => a + b, 0),
    }))
  }, [frames, step])

  if (!frames) return <p style={{ color: "var(--text-muted)" }}>No simulation data</p>

  const ac = AGENTS[agentType].color
  const grid = frame?.grid || []
  const qv = frame?.q_values || []
  const si = grid[selInt]
  const sa = frame?.actions?.[selInt]
  const sr = frame?.rewards?.[selInt]
  const sqv = qv[selInt]

  // XAI
  const overrides = frame?.overrides || []
  const selOverride = overrides.find(o => o.intersection === selInt)
  let reason = "", conf = 50, factors = []
  if (si && sqv) {
    const q = sqv.q_values || [0,0,0]
    const sorted = [...q].sort((a,b) => b - a)
    conf = Math.min(97, Math.max(20, (sorted[0] - sorted[1]) * 30 + 50))
    if (agentType === "fixed_timer") {
      conf = 100; reason = "Fixed 30s cycle (no adaptive logic)"; factors = ["Pre-programmed"]
    } else {
      const heavier = si.queue_ns >= si.queue_ew ? "NS" : "EW"
      if (sa === 0) { reason = "Hold current phase - active queue being served"; factors = ["Q(Hold)=" + q[0].toFixed(2), heavier + " heavier"] }
      else if (sa === 1) { reason = "Switch phase - serve waiting direction"; factors = ["Q(Switch)=" + q[1].toFixed(2), "Imbalance"] }
      else { reason = "Extend green - near clearance"; factors = ["Q(Ext)=" + q[2].toFixed(2), "Efficiency"] }
    }
    if (selOverride) {
      const proto = selOverride.reason.replace("_", " ")
      reason = String.fromCodePoint(9889) + " Coordinator override (" + proto + "): " + selOverride.detail
      factors = [...factors, "Override: " + ACTIONS[selOverride.original] + String.fromCharCode(8594) + ACTIONS[selOverride.final]]
    }
  }

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Control Bar */}
      <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", borderLeft: "3px solid " + ac }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(AGENTS).map(([k, v]) => (
            <button key={k} onClick={() => { setAgentType(k); setStep(0); setPlaying(false) }}
              className={"btn btn-sm " + (agentType === k ? "btn-ghost active" : "btn-ghost")}
              style={agentType === k ? { borderColor: v.color, color: v.color } : {}}>
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border-base)" }}/>
        <button onClick={() => setPlaying(!playing)} className="btn btn-sm btn-fill" style={{ "--accent-color": ac }}>
          {playing ? <Pause size={12}/> : <Play size={12}/>}
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => { setStep(0); setPlaying(false) }} className="btn btn-sm btn-ghost">
          <RotateCcw size={12}/> Reset
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-faint)" }}>Speed</span>
          <input type="range" min={50} max={800} value={800 - speed} onChange={e => setSpeed(800 - +e.target.value)} style={{ width: 80 }}/>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
          Step {step} / {maxStep}
        </div>
      </div>

      {/* Chaos Mode */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Stress Test:</span>
        {[
          { key: "sand", icon: CloudRain, label: "Sandstorm", color: "#f59e0b" },
          { key: "sensor", icon: AlertTriangle, label: "Sensor Fail", color: "#ef4444" },
          { key: "ems", icon: Ambulance, label: "Emergency", color: "#3b82f6" },
        ].map(c => (
          <button key={c.key} onClick={() => setChaos(p => ({ ...p, [c.key]: !p[c.key] }))}
            className={"btn btn-sm " + (chaos[c.key] ? "btn-ghost active" : "btn-ghost")}
            style={chaos[c.key] ? { borderColor: c.color, color: c.color } : {}}>
            <c.icon size={12}/> {c.label}
          </button>
        ))}
      </div>

      {/* Main: SVG + Side Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* SVG Grid */}
        <div className="card" style={{ padding: 20 }}>
          <svg viewBox="0 0 820 740" style={{ width: "100%", maxHeight: 580, borderRadius: 10 }}>
            {/* Background */}
            <rect width="820" height="740" fill="#0c0c0f" rx="10"/>

            {/* Grid pattern */}
            <defs>
              <pattern id="gridP" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
              </pattern>
              {/* Animated vehicle flow on horizontal roads */}
              {[0,1,2,3].map(i => {
                const y = 110 + i * 155
                return <React.Fragment key={"ah"+i}>
                  <animateMotion id={"mh"+i} dur={(4 + i * 0.5) + "s"} repeatCount="indefinite" path={`M100,${y} L780,${y}`}/>
                </React.Fragment>
              })}
            </defs>
            <rect width="820" height="740" fill="url(#gridP)"/>

            {/* Sandstorm overlay */}
            {chaos.sand && <rect width="820" height="740" fill="rgba(245,158,11,0.06)" rx="10"/>}

            {/* Animated vehicle dots on roads */}
            {[0,1,2,3].map(row => {
              const y = 110 + row * 155
              // Show more dots on higher congestion rows
              const rowInts = grid.slice(row * 4, row * 4 + 4)
              const avgQ = rowInts.length > 0 ? rowInts.reduce((s,g) => s + g.queue_ns + g.queue_ew, 0) / 4 : 5
              const numDots = Math.min(6, Math.max(2, Math.floor(avgQ / 4)))
              return Array.from({ length: numDots }).map((_, di) => {
                const offset = (di * 680 / numDots + step * 8) % 680 + 100
                const laneY = y + (di % 2 === 0 ? -6 : 6)
                return <circle key={"vh"+row+"-"+di} cx={offset} cy={laneY} r={2.5}
                  fill={avgQ > 20 ? "#ef4444" : avgQ > 10 ? "#f59e0b" : "#22c55e"} opacity={0.7}>
                  <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" begin={di*0.3+"s"} repeatCount="indefinite"/>
                </circle>
              })
            })}
            {[0,1,2,3].map(col => {
              const x = 200 + col * 165
              const colInts = [0,1,2,3].map(r => grid[r * 4 + col]).filter(Boolean)
              const avgQ = colInts.length > 0 ? colInts.reduce((s,g) => s + g.queue_ns + g.queue_ew, 0) / 4 : 5
              const numDots = Math.min(5, Math.max(2, Math.floor(avgQ / 5)))
              return Array.from({ length: numDots }).map((_, di) => {
                const offset = (di * 600 / numDots + step * 6) % 600 + 55
                const laneX = x + (di % 2 === 0 ? -6 : 6)
                return <circle key={"vv"+col+"-"+di} cx={laneX} cy={offset} r={2.5}
                  fill={avgQ > 20 ? "#ef4444" : avgQ > 10 ? "#f59e0b" : "#22c55e"} opacity={0.7}>
                  <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" begin={di*0.4+"s"} repeatCount="indefinite"/>
                </circle>
              })
            })}

            {/* Zone labels - left side with background pill */}
            {ZONES.map((z, i) => {
              const zy = 118 + i * 155
              return <g key={z}>
                <rect x={8} y={zy - 10} width={68} height={20} rx={6} fill={ZONE_COLORS[i]} opacity={0.12}/>
                <text x={42} y={zy + 3} textAnchor="middle" fill={ZONE_COLORS[i]} fontSize="9" fontWeight="800" fontFamily="Inter">{z}</text>
              </g>
            })}

            {/* Roads - Horizontal */}
            {[0,1,2,3].map(i => {
              const y = 110 + i * 155
              return <g key={"rh"+i}>
                <rect x={100} y={y-18} width={680} height={36} fill="#151518" rx="3"/>
                <line x1={100} y1={y} x2={780} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="10 8"/>
              </g>
            })}

            {/* Roads - Vertical */}
            {[0,1,2,3].map(i => {
              const x = 200 + i * 165
              return <g key={"rv"+i}>
                <rect x={x-18} y={55} width={36} height={650} fill="#151518" rx="3"/>
                <line x1={x} y1={55} x2={x} y2={705} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="10 8"/>
              </g>
            })}

            {/* Intersections */}
            {grid.map((inter, i) => {
              const row = Math.floor(i / 4), col = i % 4
              const cx = 200 + col * 165, cy = 110 + row * 155
              const cg = congLevel(inter.queue_ns, inter.queue_ew)
              const isSel = selInt === i
              const hasFail = chaos.sensor && (i % 3 === step % 3)
              const hasEms = chaos.ems && i === (step % 16)
              const isGreenNS = inter.phase === 0

              return (
                <g key={i} onClick={() => setSelInt(i)} style={{ cursor: "pointer" }}>
                  {/* Selection highlight */}
                  {isSel && <circle cx={cx} cy={cy} r={28} fill="none" stroke="white" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.4}/>}

                  {/* Emergency pulse */}
                  {hasEms && <circle cx={cx} cy={cy} r={26} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.6}>
                    <animate attributeName="r" values="26;36;26" dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1s" repeatCount="indefinite"/>
                  </circle>}

                  {/* Outer congestion ring */}
                  <circle cx={cx} cy={cy} r={22} fill="none" stroke={cg.color} strokeWidth={2.5} opacity={0.4}/>

                  {/* Main node */}
                  <circle cx={cx} cy={cy} r={18} fill="#111115" stroke={isSel ? "white" : cg.color} strokeWidth={isSel ? 2 : 1.2}/>

                  {/* Traffic signal: green for active direction */}
                  <circle cx={cx} cy={cy} r={6} fill={isGreenNS ? "#22c55e" : "#ef4444"} opacity={0.9}/>
                  <circle cx={cx} cy={cy} r={9} fill="none" stroke={isGreenNS ? "#22c55e" : "#ef4444"} strokeWidth={0.7} opacity={0.3}/>

                  {/* Direction indicator text */}
                  <text x={cx} y={cy + 14} textAnchor="middle" fill={isGreenNS ? "#4ade80" : "#f87171"} fontSize="5" fontWeight="700" fontFamily="Inter">{isGreenNS ? "NS" : "EW"}</text>

                  {/* NS Queue bar (upward from intersection) */}
                  {inter.queue_ns > 0 && <>
                    <rect x={cx - 3} y={cy - 22 - Math.min(inter.queue_ns * 2, 50)} width={6} height={Math.min(inter.queue_ns * 2, 50)} fill="#3b82f6" opacity={0.7} rx={3}/>
                    <text x={cx} y={cy - 26 - Math.min(inter.queue_ns * 2, 50)} textAnchor="middle" fill="#93c5fd" fontSize="8" fontWeight="700">{chaos.sensor && hasFail ? "?" : Math.round(inter.queue_ns)}</text>
                  </>}

                  {/* EW Queue bar (rightward from intersection) */}
                  {inter.queue_ew > 0 && <>
                    <rect x={cx + 22} y={cy - 3} width={Math.min(inter.queue_ew * 2, 50)} height={6} fill="#f59e0b" opacity={0.7} rx={3}/>
                    <text x={cx + 26 + Math.min(inter.queue_ew * 2, 50)} y={cy + 3} fill="#fcd34d" fontSize="8" fontWeight="700">{chaos.sensor && hasFail ? "?" : Math.round(inter.queue_ew)}</text>
                  </>}

                  {/* Intersection name */}
                  <text x={cx} y={cy + 34} textAnchor="middle" fill="#a1a1aa" fontSize="8" fontWeight="500" fontFamily="Inter">{NAMES[i]}</text>

                  {/* Congestion label below name */}
                  <rect x={cx - 14} y={cy + 37} width={28} height={10} rx={3} fill={cg.bg}/>
                  <text x={cx} y={cy + 44.5} textAnchor="middle" fill={cg.color} fontSize="5.5" fontWeight="800" fontFamily="Inter">{cg.label}</text>

                  {/* Action badge above */}
                  {frame?.actions?.[i] != null && (
                    <g>
                      <rect x={cx - 16} y={cy - 38} width={32} height={13} rx={4} fill={ACT_COLORS[frame.actions[i]]}/>
                      <text x={cx} y={cy - 28.5} textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Inter">{ACTIONS[frame.actions[i]]}</text>
                    </g>
                  )}

                  {/* Sensor fail indicator */}
                  {hasFail && <text x={cx + 16} y={cy - 14} fill="#ef4444" fontSize="14" fontWeight="bold">!</text>}
                </g>
              )
            })}

            {/* Legend */}
            <g transform="translate(510, 718)">
              <rect x={0} y={-4} width={10} height={10} fill="#3b82f6" rx={2} opacity={0.7}/>
              <text x={14} y={4} fill="#a1a1aa" fontSize="9" fontFamily="Inter">NS Queue</text>
              <rect x={85} y={-4} width={10} height={10} fill="#f59e0b" rx={2} opacity={0.7}/>
              <text x={99} y={4} fill="#a1a1aa" fontSize="9" fontFamily="Inter">EW Queue</text>
              <circle cx={185} cy={1} r={4} fill="#22c55e"/>
              <text x={193} y={4} fill="#a1a1aa" fontSize="9" fontFamily="Inter">NS Green</text>
              <circle cx={255} cy={1} r={4} fill="#ef4444"/>
              <text x={263} y={4} fill="#a1a1aa" fontSize="9" fontFamily="Inter">EW Green</text>
            </g>
          </svg>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* XAI Decision Logic */}
          <div className="card" style={{ padding: 18, borderLeft: "3px solid " + ac }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Brain size={15} style={{ color: ac }}/>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-white)" }}>Decision Logic</span>
              <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: "auto" }}>{NAMES[selInt]}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {ACTIONS.map((a, i) => (
                <div key={a} style={{
                  flex: 1, padding: "8px", borderRadius: 8, textAlign: "center",
                  fontSize: 11, fontWeight: 700,
                  background: sa === i ? ACT_COLORS[i] : "var(--bg-elevated)",
                  color: sa === i ? "white" : "var(--text-faint)",
                  border: sa === i ? "none" : "1px solid var(--border-dim)"
                }}>{a}</div>
              ))}
            </div>

            {/* Confidence */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                <span style={{ color: "var(--text-faint)", fontWeight: 600 }}>CONFIDENCE</span>
                <span style={{ color: conf > 70 ? "#22c55e" : conf > 40 ? "#f59e0b" : "#ef4444", fontWeight: 800 }}>{conf.toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 6 }}>
                <div style={{ width: conf + "%", height: "100%", borderRadius: 6, transition: "width 0.3s",
                  background: conf > 70 ? "#22c55e" : conf > 40 ? "#f59e0b" : "#ef4444" }}/>
              </div>
            </div>

            {/* Reasoning */}
            <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6, padding: "10px 12px",
              background: "var(--bg-elevated)", borderRadius: 8 }}>
              {reason || "Click an intersection to view decision logic"}
            </div>

            {/* Factors */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {factors.map((f, i) => (
                <span key={i} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4,
                  background: "var(--bg-input)", color: "var(--text-secondary)", fontFamily: "monospace" }}>{f}</span>
              ))}
            </div>

            {/* Q-values */}
            {sqv?.q_values && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-dim)" }}>
                <div style={{ fontSize: 10, color: "var(--text-faint)", fontWeight: 700, marginBottom: 6 }}>Q-VALUES</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {sqv.q_values.map((q, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: 6, borderRadius: 6,
                      background: sa === i ? ACT_COLORS[i] + "18" : "var(--bg-input)" }}>
                      <div style={{ fontSize: 8, color: ACT_COLORS[i], fontWeight: 600 }}>{ACTIONS[i]}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-white)", fontFamily: "monospace" }}>{q.toFixed(3)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Avg Queue", val: frame?.metrics?.avg_queue?.toFixed(1), color: "#3b82f6" },
              { label: "Throughput", val: frame?.metrics?.throughput, color: "#22c55e" },
              { label: "Reward", val: frame?.rewards?.reduce((a,b) => a+b, 0).toFixed(1), color: "#a855f7" },
              { label: "Emissions", val: frame?.metrics?.emissions?.toFixed(1), color: "#f59e0b" },
            ].map((m, i) => (
              <div key={i} className="metric-box">
                <div className="metric-label">{m.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{chaos.sensor ? "~" + m.val : m.val}</div>
              </div>
            ))}
          </div>

          {/* Rolling Chart */}
          <div className="card" style={{ padding: 14 }}>
            <div className="metric-label" style={{ marginBottom: 8 }}>ROLLING METRICS (30 Steps)</div>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={rolling}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="s" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={TT}/>
                <Line type="monotone" dataKey="q" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Queue"/>
                <Line type="monotone" dataKey="tp" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Throughput"/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Action Grid */}
          <div className="card" style={{ padding: 14 }}>
            <div className="metric-label" style={{ marginBottom: 8 }}>ACTIONS THIS STEP</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {(frame?.actions || []).map((a, i) => (
                <div key={i} onClick={() => setSelInt(i)}
                  style={{ padding: 6, borderRadius: 6, textAlign: "center", cursor: "pointer",
                    background: ACT_COLORS[a] + "15", border: selInt === i ? "1px solid " + ACT_COLORS[a] : "1px solid transparent",
                    fontSize: 8, fontWeight: 700, color: ACT_COLORS[a] }}>
                  {ACTIONS[a]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
