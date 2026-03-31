import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Play, Pause, SkipForward, RotateCcw, Activity, Brain, AlertTriangle, CloudRain, Wifi, Ambulance, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const NAMES = [
  "Al Rigga","Deira CC","Maktoum Br.","Bur Dubai",
  "SZR Jct.","DIFC","Biz Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tun.","Marina",
  "DIP","Acad. City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH DUBAI"]
const AGENT_META = {
  q_learning: { label: "Q-Learning", color: "#4A90FF", desc: "Off-policy TD control" },
  sarsa: { label: "SARSA", color: "#00E68C", desc: "On-policy TD control" },
  fixed_timer: { label: "Fixed Timer", color: "#FF4057", desc: "Baseline (30s cycle)" },
}
const ttStyle = { background: "#0B0F14", border: "1px solid rgba(148,163,184,0.10)", borderRadius: 12, color: "#F0F4F8", fontSize: 11 }

const ACTION_NAMES = ["Hold", "Switch", "Extend"]

function congestionInfo(qNS, qEW) {
  const t = qNS + qEW
  if (t < 8) return { fill: "#00E68C", ring: "rgba(0,230,140,0.12)", label: "Low", textColor: "#6EFFC4" }
  if (t < 20) return { fill: "#FFB800", ring: "rgba(255,184,0,0.12)", label: "Moderate", textColor: "#FFD666" }
  if (t < 40) return { fill: "#FF9500", ring: "rgba(255,149,0,0.12)", label: "High", textColor: "#FFB84D" }
  return { fill: "#FF4057", ring: "rgba(255,64,87,0.15)", label: "Critical", textColor: "#FF8A9A" }
}

function explainDecision(inter, action, reward, agentType) {
  if (!inter) return { confidence: 0, reason: "No data", factors: [] }
  const qDiff = Math.abs(inter.queue_ns - inter.queue_ew)
  const totalQ = inter.queue_ns + inter.queue_ew
  const heavierDir = inter.queue_ns >= inter.queue_ew ? "NS" : "EW"
  const lighterDir = heavierDir === "NS" ? "EW" : "NS"
  const heavierQ = Math.max(inter.queue_ns, inter.queue_ew)
  const lighterQ = Math.min(inter.queue_ns, inter.queue_ew)
  const factors = []

  if (agentType === "fixed_timer") {
    return { confidence: 100, reason: "Fixed 30s cycle rotation (no adaptive logic)", factors: ["Pre-programmed timer", "No queue awareness"] }
  }

  let confidence = 50
  let reason = ""

  if (action === 0) { // Hold
    confidence = Math.min(95, 60 + qDiff * 2 + (reward > 0 ? 15 : 0))
    reason = `Maintain current phase — ${inter.phase === 0 ? "NS" : "EW"} active, serving ${inter.phase === 0 ? inter.queue_ns : inter.queue_ew} vehicles`
    factors.push(`Current phase handling ${inter.phase === 0 ? "NS" : "EW"} traffic`)
    if (qDiff < 5) factors.push("Queue balance sufficient")
    if (reward > 0) factors.push("Positive reward confirms decision")
  } else if (action === 1) { // Switch
    confidence = Math.min(95, 55 + qDiff * 3)
    reason = `Switch to ${heavierDir} — queue imbalance (${heavierQ} vs ${lighterQ})`
    factors.push(`${heavierDir} queue (${heavierQ}) exceeds ${lighterDir} (${lighterQ})`)
    factors.push(`Queue differential: ${qDiff} vehicles`)
    if (totalQ > 20) factors.push("High total congestion triggers rebalance")
  } else { // Extend
    confidence = Math.min(90, 50 + heavierQ * 2)
    reason = `Extend green for ${inter.phase === 0 ? "NS" : "EW"} — clearing ${heavierQ}-vehicle backlog`
    factors.push(`Active queue still large (${heavierQ})`)
    factors.push("Extension reduces stop-start cycles")
  }

  return { confidence, reason, factors }
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
  const [selectedIntersection, setSelectedIntersection] = useState(0)
  const [chaos, setChaos] = useState({ sandstorm: false, sensorFail: false, emergency: false })
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

  // Chaos mode modifiers
  const chaosMultiplier = useMemo(() => ({
    throughput: chaos.sandstorm ? 0.55 : chaos.emergency ? 0.8 : 1,
    queue: chaos.sandstorm ? 1.6 : chaos.sensorFail ? 1.1 : 1,
    noise: chaos.sensorFail ? () => (Math.random() - 0.5) * 8 : () => 0,
  }), [chaos])

  const displayTP = Math.round((frame?.metrics?.throughput || 0) * chaosMultiplier.throughput)
  const displayAvgQ = ((frame?.metrics?.avg_queue || 0) * chaosMultiplier.queue).toFixed(1)

  // Selected intersection XAI
  const selInter = frame?.grid?.[selectedIntersection]
  const selAction = frame?.actions?.[selectedIntersection]
  const selReward = frame?.rewards?.[selectedIntersection]
  const xai = explainDecision(selInter, selAction, selReward, agentType)

  // Failed sensor indices (random but deterministic per step)
  const failedSensors = useMemo(() => {
    if (!chaos.sensorFail) return []
    const seed = step * 7 + 13
    return [seed % 16, (seed * 3 + 5) % 16, (seed * 7 + 11) % 16].filter((v, i, a) => a.indexOf(v) === i)
  }, [chaos.sensorFail, step])

  const emergencyIdx = useMemo(() => chaos.emergency ? (step * 3 + 7) % 16 : -1, [chaos.emergency, step])

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

        <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />

        {/* Chaos Mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-label)", fontWeight: 600, marginRight: 2 }}>{"Stress Test:"}</span>
          {[
            { key: "sandstorm", icon: CloudRain, label: "Sandstorm", color: "#FFB800" },
            { key: "sensorFail", icon: Wifi, label: "Sensor Fail", color: "#FF4057" },
            { key: "emergency", icon: Ambulance, label: "Emergency", color: "#4A90FF" },
          ].map(c => {
            const Icon = c.icon
            const active = chaos[c.key]
            return (
              <button key={c.key} onClick={() => setChaos(p => ({ ...p, [c.key]: !p[c.key] }))}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: active ? c.color + "18" : "var(--bg-elevated)",
                  color: active ? c.color : "var(--text-muted)",
                  border: active ? "1px solid " + c.color + "40" : "1px solid var(--border-subtle)",
                  transition: "all 0.15s",
                }}>
                <Icon size={12} /> {c.label}
              </button>
            )
          })}
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

          <svg viewBox={"0 0 " + VB_W + " " + VB_H} className="traffic-grid-bg" style={{ width: "100%", display: "block", background: chaos.sandstorm ? "#0B0A05" : "#060A10" }}>
            {/* Zone labels */}
            {ZONES.map((z, i) => (
              <text key={z} x="12" y={GO + i * GS + 4} fill="#475569" fontSize="8" fontWeight="700" letterSpacing="0.12em">{z}</text>
            ))}

            {/* ROADS - Horizontal */}
            {[0,1,2,3].map(r => {
              const y = GO + r * GS
              return (
                <g key={"rh"+r}>
                  <rect x={GO - 30} y={y - 16} width={GS * 3 + 60} height={32} rx="3" fill={chaos.sandstorm ? "#1A1508" : "#0D1219"} />
                  <line x1={GO - 25} y1={y} x2={GO + GS*3 + 25} y2={y} stroke={chaos.sandstorm ? "#3D2F10" : "#1A2236"} strokeWidth="1" strokeDasharray="10 6" />
                </g>
              )
            })}
            {/* ROADS - Vertical */}
            {[0,1,2,3].map(c => {
              const x = GO + c * GS
              return (
                <g key={"rv"+c}>
                  <rect x={x - 16} y={GO - 30} width={32} height={GS * 3 + 60} rx="3" fill={chaos.sandstorm ? "#1A1508" : "#0D1219"} />
                  <line x1={x} y1={GO - 25} x2={x} y2={GO + GS*3 + 25} stroke={chaos.sandstorm ? "#3D2F10" : "#1A2236"} strokeWidth="1" strokeDasharray="10 6" />
                </g>
              )
            })}

            {/* Sandstorm overlay */}
            {chaos.sandstorm && (
              <rect x="0" y="0" width={VB_W} height={VB_H} fill="rgba(180,120,40,0.06)" rx="12" />
            )}

            {/* INTERSECTIONS */}
            {frame?.grid?.map((inter, idx) => {
              const row = Math.floor(idx/4), col = idx%4
              const cx = GO + col * GS, cy = GO + row * GS
              const ci = congestionInfo(inter.queue_ns, inter.queue_ew)
              const nsBar = Math.min(55, inter.queue_ns * 2.2)
              const ewBar = Math.min(55, inter.queue_ew * 2.2)
              const nsCol = inter.phase === 0 ? "#22C55E" : "#FF4057"
              const ewCol = inter.phase === 1 ? "#22C55E" : "#FF4057"
              const isSelected = idx === selectedIntersection
              const isSensorFailed = failedSensors.includes(idx)
              const isEmergency = idx === emergencyIdx

              return (
                <g key={idx} onClick={() => setSelectedIntersection(idx)} style={{ cursor: "pointer" }}>
                  {/* Selection highlight */}
                  {isSelected && (
                    <circle cx={cx} cy={cy} r="34" fill="none" stroke="#00D4FF" strokeWidth="2" strokeDasharray="4 3" opacity="0.6">
                      <animate attributeName="stroke-dashoffset" values="0;14" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Emergency vehicle pulse */}
                  {isEmergency && (
                    <>
                      <circle cx={cx} cy={cy} r="36" fill="none" stroke="#4A90FF" strokeWidth="3">
                        <animate attributeName="r" values="30;40" dur="0.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0" dur="0.6s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r="36" fill="none" stroke="#FF4057" strokeWidth="3">
                        <animate attributeName="r" values="32;42" dur="0.6s" repeatCount="indefinite" begin="0.3s" />
                        <animate attributeName="opacity" values="0.8;0" dur="0.6s" repeatCount="indefinite" begin="0.3s" />
                      </circle>
                    </>
                  )}

                  {/* Congestion ring */}
                  <circle cx={cx} cy={cy} r="28" fill={ci.ring} />

                  {/* NS Queue bar (upward) */}
                  {inter.queue_ns > 0 && <>
                    <rect x={cx-3} y={cy - 28 - nsBar} width="6" height={nsBar} rx="3" fill="#4A90FF" opacity="0.8" />
                    <text x={cx} y={cy - 32 - nsBar} textAnchor="middle" fill="#93C5FD" fontSize="8" fontWeight="700">{isSensorFailed ? "?" : inter.queue_ns}</text>
                  </>}

                  {/* EW Queue bar (rightward) */}
                  {inter.queue_ew > 0 && <>
                    <rect x={cx + 28} y={cy-3} width={ewBar} height="6" rx="3" fill="#FFB800" opacity="0.8" />
                    <text x={cx + 32 + ewBar} y={cy + 3} fill="#FFD666" fontSize="8" fontWeight="700">{isSensorFailed ? "?" : inter.queue_ew}</text>
                  </>}

                  {/* Main node */}
                  <circle cx={cx} cy={cy} r="20" fill={ci.fill} opacity="0.15" stroke={ci.fill} strokeWidth="2" />
                  <circle cx={cx} cy={cy} r="14" fill="#080C14" stroke={ci.fill} strokeWidth="1.5" />

                  {/* Sensor fail indicator */}
                  {isSensorFailed && (
                    <>
                      <rect x={cx-10} y={cy-10} width="20" height="20" rx="4" fill="rgba(255,64,87,0.15)" stroke="#FF4057" strokeWidth="1" strokeDasharray="3 2" />
                      <text x={cx} y={cy+4} textAnchor="middle" fill="#FF4057" fontSize="12" fontWeight="800">!</text>
                    </>
                  )}

                  {/* Traffic lights */}
                  {!isSensorFailed && <>
                    <circle cx={cx-6} cy={cy-5} r="3.5" fill={nsCol} opacity={inter.is_yellow ? 0.3 : 0.9} />
                    <circle cx={cx+6} cy={cy-5} r="3.5" fill={ewCol} opacity={inter.is_yellow ? 0.3 : 0.9} />
                    {inter.is_yellow && (
                      <circle cx={cx} cy={cy-5} r="3.5" fill="#EAB308">
                        <animate attributeName="opacity" values="1;0.3;1" dur="0.7s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text x={cx} y={cy+6} textAnchor="middle" fill="#E2E8F0" fontSize="7" fontWeight="700">{String(idx+1).padStart(2,"0")}</text>
                  </>}

                  {/* Name */}
                  <text x={cx} y={cy+33} textAnchor="middle" fill="#C8D1DC" fontSize="7.5" fontWeight="600">{NAMES[idx]}</text>

                  {/* Congestion label */}
                  <text x={cx} y={cy+42} textAnchor="middle" fill={ci.textColor} fontSize="6" fontWeight="600">{ci.label}</text>
                </g>
              )
            })}

            {/* Legend */}
            <g transform={"translate(" + (GO - 20) + "," + (VB_H - 30) + ")"}>
              <rect x="0" y="-4" width="6" height="10" rx="2" fill="#4A90FF" opacity="0.8" />
              <text x="10" y="4" fill="#8B99AD" fontSize="8" fontWeight="500">NS Queue</text>
              <rect x="80" y="-4" width="10" height="6" rx="2" fill="#FFB800" opacity="0.8" />
              <text x="95" y="4" fill="#8B99AD" fontSize="8" fontWeight="500">EW Queue</text>
              <circle cx="170" cy="1" r="4" fill="#22C55E" /><text x="178" y="4" fill="#8B99AD" fontSize="8">Green</text>
              <circle cx="218" cy="1" r="4" fill="#FF4057" /><text x="226" y="4" fill="#8B99AD" fontSize="8">Red</text>
              <circle cx="258" cy="1" r="4" fill="#EAB308" /><text x="266" y="4" fill="#8B99AD" fontSize="8">Yellow</text>
              <circle cx="310" cy="1" r="6" fill="rgba(0,230,140,0.12)" stroke="#00E68C" strokeWidth="1" /><text x="320" y="4" fill="#8B99AD" fontSize="8">Low</text>
              <circle cx="350" cy="1" r="6" fill="rgba(255,64,87,0.15)" stroke="#FF4057" strokeWidth="1" /><text x="360" y="4" fill="#8B99AD" fontSize="8">Critical</text>
            </g>
          </svg>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* XAI Decision Logic Panel */}
          <div className="card card-compact" style={{ borderColor: "rgba(0,212,255,0.15)", background: "linear-gradient(135deg, rgba(0,212,255,0.03), var(--bg-card))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Brain size={15} style={{ color: "#00D4FF" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{"XAI Decision Logic"}</span>
              {chaos.sandstorm && <span className="badge" style={{ background: "rgba(255,184,0,0.12)", color: "#FFB800", fontSize: 9, marginLeft: "auto" }}>{"Sandstorm Active"}</span>}
              {chaos.emergency && <span className="badge" style={{ background: "rgba(74,144,255,0.12)", color: "#4A90FF", fontSize: 9, marginLeft: "auto" }}>{"Emergency Active"}</span>}
            </div>

            <div style={{ fontSize: 11, color: "var(--text-label)", marginBottom: 8 }}>
              {"INT-"}{String(selectedIntersection+1).padStart(2,"0")} {NAMES[selectedIntersection]}
              <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{"(click grid to select)"}</span>
            </div>

            {/* Decision */}
            <div style={{ background: "var(--bg-card-alt)", borderRadius: 10, padding: 12, marginBottom: 10, border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ChevronRight size={12} style={{ color: "#00D4FF" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: selAction === 0 ? "#00E68C" : selAction === 1 ? "#FFB800" : "#4A90FF" }}>
                    {"Decision: "}{ACTION_NAMES[selAction] || "N/A"}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#00D4FF" }}>{xai.confidence}{"% conf."}</span>
              </div>
              {/* Confidence bar */}
              <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, width: xai.confidence + "%", background: xai.confidence > 80 ? "#00E68C" : xai.confidence > 60 ? "#FFB800" : "#FF4057", transition: "width 0.3s" }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8 }}>{xai.reason}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {xai.factors.map((f, i) => (
                  <span key={i} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "var(--bg-elevated)", color: "var(--text-label)", border: "1px solid var(--border-subtle)" }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Selected intersection details */}
            {selInter && (
              <div className="grid grid-cols-2 gap-2" style={{ fontSize: 11 }}>
                <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-card-alt)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{"NS Queue "}</span>
                  <span style={{ fontWeight: 700, color: "#4A90FF" }}>{selInter.queue_ns}</span>
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-card-alt)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{"EW Queue "}</span>
                  <span style={{ fontWeight: 700, color: "#FFB800" }}>{selInter.queue_ew}</span>
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 8, background: "var(--bg-card-alt)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{"Phase "}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selInter.phase === 0 ? "NS Green" : "EW Green"}</span>
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 8, background: selReward >= 0 ? "var(--green-dim)" : "var(--red-dim)", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{"Reward "}</span>
                  <span style={{ fontWeight: 700, color: selReward >= 0 ? "var(--green)" : "var(--red)" }}>{selReward?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Live Stats */}
          <div className="card card-compact">
            <div className="section-subtitle">{"Network Metrics"}</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="metric-mini">
                <div className="metric-mini-label">{"Avg Queue"}</div>
                <div className="metric-mini-value">{displayAvgQ}</div>
              </div>
              <div className="metric-mini">
                <div className="metric-mini-label">{"Throughput"}</div>
                <div className="metric-mini-value" style={{ color: "var(--teal)" }}>{displayTP}</div>
              </div>
              <div className="metric-mini">
                <div className="metric-mini-label">{"Peak Queue"}</div>
                <div className="metric-mini-value" style={{ color: "var(--gold)" }}>{maxQueue}</div>
              </div>
              <div className="metric-mini">
                <div className="metric-mini-label">{"Total Queue"}</div>
                <div className="metric-mini-value">{totalQueue}</div>
              </div>
            </div>
          </div>

          {/* Rolling Chart */}
          <div className="card card-compact">
            <div className="section-subtitle">{"Queue Trend (Last 30 Steps)"}</div>
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#141A22" />
                <XAxis dataKey="step" stroke="#3A4458" tick={{ fontSize: 9, fill: "#8B99AD" }} />
                <YAxis stroke="#3A4458" tick={{ fontSize: 9, fill: "#8B99AD" }} />
                <Tooltip contentStyle={ttStyle} />
                <Line type="monotone" dataKey="queue" stroke="#4A90FF" strokeWidth={2} dot={false} name="Avg Queue" />
                <Line type="monotone" dataKey="tp" stroke="#00D4FF" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Throughput" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Agent Actions Grid */}
          <div className="card card-compact">
            <div className="section-subtitle">{"Agent Actions"}</div>
            <div className="grid grid-cols-4 gap-2">
              {frame?.actions?.map((a, i) => (
                <div key={i} onClick={() => setSelectedIntersection(i)} style={{
                  textAlign: "center", padding: "6px 0", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: i === selectedIntersection ? "rgba(0,212,255,0.12)" : a === 0 ? "var(--bg-elevated)" : a === 1 ? "var(--gold-dim)" : "var(--blue-dim)",
                  color: i === selectedIntersection ? "#00D4FF" : a === 0 ? "var(--text-label)" : a === 1 ? "var(--gold)" : "var(--blue)",
                  border: i === selectedIntersection ? "1px solid rgba(0,212,255,0.3)" : a === 0 ? "1px solid var(--border-subtle)" : a === 1 ? "1px solid rgba(255,184,0,0.15)" : "1px solid rgba(74,144,255,0.15)"
                }}>
                  {ACTION_NAMES[a] || "?"}
                </div>
              ))}
            </div>
          </div>

          {/* Reward Grid */}
          <div className="card card-compact">
            <div className="section-subtitle">{"Step Rewards"}</div>
            <div className="grid grid-cols-4 gap-2">
              {frame?.rewards?.map((r, i) => (
                <div key={i} onClick={() => setSelectedIntersection(i)} style={{
                  textAlign: "center", padding: "5px 0", borderRadius: 8, cursor: "pointer",
                  fontSize: 11, fontFamily: "monospace", fontWeight: 600,
                  background: i === selectedIntersection ? "rgba(0,212,255,0.12)" : r >= 0 ? "var(--green-dim)" : "var(--red-dim)",
                  color: i === selectedIntersection ? "#00D4FF" : r >= 0 ? "var(--green)" : "var(--red)"
                }}>
                  {r?.toFixed(1)}
                </div>
              ))}
            </div>
          </div>

          {/* Chaos Mode Status */}
          {(chaos.sandstorm || chaos.sensorFail || chaos.emergency) && (
            <div className="card card-compact" style={{ borderColor: "rgba(255,64,87,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <AlertTriangle size={13} style={{ color: "#FF4057" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#FF4057" }}>{"Stress Test Active"}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-label)", lineHeight: 1.6 }}>
                {chaos.sandstorm && <div style={{ color: "#FFB800" }}>{"Sandstorm: Visibility reduced, capacity -45%, queue buildup +60%"}</div>}
                {chaos.sensorFail && <div style={{ color: "#FF4057" }}>{"Sensor Failure: "}{failedSensors.length}{" intersections reporting noisy data (marked with !)"}</div>}
                {chaos.emergency && <div style={{ color: "#4A90FF" }}>{"Emergency Vehicle: Priority routing at INT-"}{String(emergencyIdx+1).padStart(2,"0")}{" "}{NAMES[emergencyIdx]}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
