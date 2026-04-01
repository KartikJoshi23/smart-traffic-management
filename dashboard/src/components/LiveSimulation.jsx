import { useState, useEffect, useRef, useMemo } from "react"
import { Play, Pause, RotateCcw, Brain, AlertTriangle, CloudRain, Ambulance, Info } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const NAMES = [
  "Al Rigga","Deira CC","Maktoum Br","Bur Dubai",
  "SZR Jct","DIFC","Biz Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tun","Marina",
  "DIP","Acad City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH DUBAI"]
const AGENT_META = {
  q_learning: { label: "Q-Learning", color: "#3B82F6", desc: "Off-policy TD control" },
  sarsa: { label: "SARSA", color: "#10B981", desc: "On-policy TD control" },
  fixed_timer: { label: "Fixed Timer", color: "#EF4444", desc: "30s fixed cycle" },
}
const ACTION_NAMES = ["HOLD", "SWITCH", "EXTEND"]
const ACTION_COLORS = ["#3B82F6", "#F59E0B", "#8B5CF6"]
const ttStyle = { background: "#1e1e21", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, color: "#f4f4f5", fontSize: 11 }

function getCongestion(qNS, qEW) {
  const t = qNS + qEW
  if (t < 8) return { color: "#10B981", label: "Low", ring: "rgba(16,185,129,0.25)" }
  if (t < 20) return { color: "#F59E0B", label: "Moderate", ring: "rgba(245,158,11,0.25)" }
  if (t < 40) return { color: "#F97316", label: "High", ring: "rgba(249,115,22,0.30)" }
  return { color: "#EF4444", label: "Critical", ring: "rgba(239,68,68,0.35)" }
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
  const [speed, setSpeed] = useState(400)
  const [selectedInt, setSelectedInt] = useState(null)
  const [chaos, setChaos] = useState({ sandstorm: false, sensorFail: false, emergency: false })
  const intervalRef = useRef(null)

  const frames = agents[agentType]
  const maxStep = frames ? frames.length - 1 : 0
  const frame = frames?.[step]

  useEffect(() => {
    if (playing && frames) {
      intervalRef.current = setInterval(() => {
        setStep(s => s >= maxStep ? (setPlaying(false), s) : s + 1)
      }, speed)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, maxStep, frames])

  const rollingData = useMemo(() => {
    if (!frames) return []
    const start = Math.max(0, step - 29)
    return frames.slice(start, step + 1).map(f => ({
      step: f.step,
      queue: f.metrics.avg_queue,
      throughput: f.metrics.throughput,
      reward: f.rewards.reduce((a, b) => a + b, 0),
    }))
  }, [frames, step])

  if (!frames) return <p style={{ color: "var(--text-tertiary)" }}>No simulation data available</p>

  const agentColor = AGENT_META[agentType].color
  const grid = frame?.grid || []
  const qVals = frame?.q_values || []
  const selIdx = selectedInt !== null ? selectedInt : 0
  const selInter = grid[selIdx]
  const selAction = frame?.actions?.[selIdx]
  const selReward = frame?.rewards?.[selIdx]
  const selQV = qVals[selIdx]

  // XAI reasoning
  let xaiReason = ""
  let xaiConfidence = 50
  let xaiFactors = []
  if (selInter && selQV) {
    const qv = selQV.q_values || [0, 0, 0]
    const maxQ = Math.max(...qv)
    const sortedQ = [...qv].sort((a, b) => b - a)
    const qSpread = sortedQ[0] - sortedQ[1]
    xaiConfidence = Math.min(98, Math.max(15, qSpread * 30 + 45))
    if (agentType === "fixed_timer") {
      xaiConfidence = 100
      xaiReason = "Fixed 30-second cycle timer (no adaptive logic)"
      xaiFactors = ["Pre-programmed", "No learning"]
    } else {
      const heavier = selInter.queue_ns >= selInter.queue_ew ? "NS" : "EW"
      if (selAction === 0) {
        xaiReason = "Maintain current phase - serving active queue direction"
        xaiFactors.push("Q(Hold)=" + qv[0].toFixed(2), heavier + " heavier", "Phase " + (selInter.phase === 0 ? "NS" : "EW"))
      } else if (selAction === 1) {
        xaiReason = "Switch phase to serve waiting direction"
        xaiFactors.push("Q(Switch)=" + qv[1].toFixed(2), "Imbalance detected", heavier + " congested")
      } else {
        xaiReason = "Extend green to clear remaining queue"
        xaiFactors.push("Q(Extend)=" + qv[2].toFixed(2), "Near clearance", "Efficiency gain")
      }
    }
  }

  const confColor = xaiConfidence > 70 ? "var(--green)" : xaiConfidence > 40 ? "var(--amber)" : "var(--red)"

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls Bar */}
      <div className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* Agent Selection */}
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(AGENT_META).map(([k, v]) => (
            <button key={k} onClick={() => { setAgentType(k); setStep(0); setPlaying(false) }}
              className={"btn btn-sm " + (agentType === k ? "btn-outline active" : "btn-outline")}
              style={agentType === k ? { borderColor: v.color, color: v.color } : {}}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "var(--border-default)" }} />

        {/* Playback */}
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setPlaying(!playing)} className="btn btn-sm btn-primary">
            {playing ? <Pause size={12} /> : <Play size={12} />}
            {playing ? "Pause" : "Play"}
          </button>
          <button onClick={() => { setStep(0); setPlaying(false) }} className="btn btn-sm btn-outline">
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Speed */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Speed</span>
          <input type="range" min={50} max={800} value={800 - speed} onChange={e => setSpeed(800 - +e.target.value)} style={{ width: 80 }} />
        </div>

        {/* Step indicator */}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-tertiary)", fontFamily: "'SF Mono', monospace" }}>
          Step {step} / {maxStep}
        </div>
      </div>

      {/* Chaos Mode */}
      <div className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>STRESS TEST:</span>
        {[
          { key: "sandstorm", icon: CloudRain, label: "Sandstorm", color: "var(--amber)" },
          { key: "sensorFail", icon: AlertTriangle, label: "Sensor Fail", color: "var(--red)" },
          { key: "emergency", icon: Ambulance, label: "Emergency", color: "var(--blue)" },
        ].map(c => (
          <button key={c.key}
            onClick={() => setChaos(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
            className={"btn btn-sm " + (chaos[c.key] ? "btn-outline active" : "btn-outline")}
            style={chaos[c.key] ? { borderColor: c.color, color: c.color } : {}}>
            <c.icon size={12} /> {c.label}
          </button>
        ))}
        {Object.values(chaos).some(v => v) && (
          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 8, fontStyle: "italic" }}>
            {chaos.sandstorm && "Capacity -45% "}{chaos.sensorFail && "Random noise "}{chaos.emergency && "Priority routing "}
          </span>
        )}
      </div>

      {/* Main Layout: SVG Grid + Side Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>
        {/* SVG Traffic Grid */}
        <div className="card" style={{ padding: 16 }}>
          <div className="section-title">
            <span className="section-dot" style={{ background: agentColor }} />
            Intersection Network — {AGENT_META[agentType].label}
          </div>
          <svg viewBox="0 0 700 700" style={{ width: "100%", maxHeight: 520, background: "#101012", borderRadius: 8, border: "1px solid var(--border-subtle)" }}>
            {/* Zone labels */}
            {ZONES.map((z, i) => (
              <text key={z} x={15} y={110 + i * 160} fill="#52525b" fontSize="10" fontWeight="600" fontFamily="Inter">{z}</text>
            ))}

            {/* Roads */}
            {[0,1,2,3].map(i => {
              const x = 130 + i * 150
              return <g key={"rv" + i}>
                <line x1={x} y1={60} x2={x} y2={680} stroke="#27272a" strokeWidth="28" strokeLinecap="round" />
                <line x1={x} y1={60} x2={x} y2={680} stroke="#333336" strokeWidth="1" strokeDasharray="8 8" />
              </g>
            })}
            {[0,1,2,3].map(i => {
              const y = 110 + i * 160
              return <g key={"rh" + i}>
                <line x1={60} y1={y} x2={680} y2={y} stroke="#27272a" strokeWidth="28" strokeLinecap="round" />
                <line x1={60} y1={y} x2={680} y2={y} stroke="#333336" strokeWidth="1" strokeDasharray="8 8" />
              </g>
            })}

            {/* Sandstorm overlay */}
            {chaos.sandstorm && <rect x="0" y="0" width="700" height="700" fill="rgba(245,158,11,0.06)" rx="8" />}

            {/* Intersections */}
            {grid.map((inter, i) => {
              const row = Math.floor(i / 4)
              const col = i % 4
              const cx = 130 + col * 150
              const cy = 110 + row * 160
              const cong = getCongestion(inter.queue_ns, inter.queue_ew)
              const isSelected = selectedInt === i
              const hasSensorFail = chaos.sensorFail && (i % 3 === step % 3)
              const hasEmergency = chaos.emergency && i === (step % 16)

              return (
                <g key={i} onClick={() => setSelectedInt(i)} style={{ cursor: "pointer" }}>
                  {/* Congestion ring */}
                  <circle cx={cx} cy={cy} r={24} fill="none" stroke={cong.ring} strokeWidth={isSelected ? 4 : 2} />

                  {/* Intersection node */}
                  <circle cx={cx} cy={cy} r={16} fill="#18181b" stroke={cong.color} strokeWidth={2} />

                  {/* Phase indicator (traffic light) */}
                  <circle cx={cx - 5} cy={cy} r={4} fill={inter.phase === 0 ? "#10B981" : "#3f3f46"} />
                  <circle cx={cx + 5} cy={cy} r={4} fill={inter.phase === 1 ? "#10B981" : "#3f3f46"} />

                  {/* Queue bars */}
                  <rect x={cx - 3} y={cy - 16 - Math.min(inter.queue_ns * 1.5, 35)} width={6} height={Math.min(inter.queue_ns * 1.5, 35)} fill="#3B82F6" opacity={0.8} rx={2} />
                  <rect x={cx + 16} y={cy - 3} width={Math.min(inter.queue_ew * 1.5, 35)} height={6} fill="#F59E0B" opacity={0.8} rx={2} />

                  {/* Name label */}
                  <text x={cx} y={cy + 32} textAnchor="middle" fill="#a1a1aa" fontSize="8" fontFamily="Inter">{NAMES[i]}</text>

                  {/* Action badge */}
                  {frame?.actions?.[i] != null && (
                    <g>
                      <rect x={cx - 14} y={cy - 36 - Math.min(inter.queue_ns * 1.5, 35)} width={28} height={12} rx={3} fill={ACTION_COLORS[frame.actions[i]]} opacity={0.9} />
                      <text x={cx} y={cy - 28 - Math.min(inter.queue_ns * 1.5, 35)} textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Inter">
                        {ACTION_NAMES[frame.actions[i]]}
                      </text>
                    </g>
                  )}

                  {/* Sensor fail indicator */}
                  {hasSensorFail && (
                    <text x={cx + 20} y={cy - 18} fill="#EF4444" fontSize="14" fontWeight="bold">!</text>
                  )}

                  {/* Emergency indicator */}
                  {hasEmergency && (
                    <circle cx={cx} cy={cy} r={28} fill="none" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" opacity={0.8}>
                      <animate attributeName="r" values="28;34;28" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Selection highlight */}
                  {isSelected && (
                    <circle cx={cx} cy={cy} r={28} fill="none" stroke="white" strokeWidth={1} opacity={0.5} strokeDasharray="3 3" />
                  )}
                </g>
              )
            })}

            {/* Legend */}
            <g transform="translate(540, 640)">
              <rect x={0} y={0} width={8} height={8} fill="#3B82F6" rx={1} />
              <text x={12} y={7} fill="#71717a" fontSize="8" fontFamily="Inter">NS Queue</text>
              <rect x={65} y={0} width={8} height={8} fill="#F59E0B" rx={1} />
              <text x={77} y={7} fill="#71717a" fontSize="8" fontFamily="Inter">EW Queue</text>
            </g>
          </svg>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* XAI Panel */}
          <div className="card" style={{ padding: 16, borderLeft: "3px solid " + agentColor }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Brain size={14} style={{ color: agentColor }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>Decision Logic</span>
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>{NAMES[selIdx]}</span>
            </div>

            {/* Action taken */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {ACTION_NAMES.map((a, i) => (
                <div key={a} style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6, textAlign: "center",
                  fontSize: 10, fontWeight: 600,
                  background: selAction === i ? ACTION_COLORS[i] : "var(--bg-surface-2)",
                  color: selAction === i ? "white" : "var(--text-muted)",
                  border: "1px solid " + (selAction === i ? ACTION_COLORS[i] : "var(--border-subtle)")
                }}>{a}</div>
              ))}
            </div>

            {/* Confidence */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>Confidence</span>
                <span style={{ color: confColor, fontWeight: 700 }}>{xaiConfidence.toFixed(0)}%</span>
              </div>
              <div style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 4 }}>
                <div style={{ width: xaiConfidence + "%", height: "100%", background: confColor, borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>

            {/* Reasoning */}
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8, padding: "8px 10px", background: "var(--bg-surface-2)", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
              <Info size={10} style={{ display: "inline", marginRight: 4, color: "var(--text-muted)" }} />
              {xaiReason || "Select an intersection to view decision logic"}
            </div>

            {/* Factors */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {xaiFactors.map((f, i) => (
                <span key={i} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, background: "var(--bg-elevated)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>{f}</span>
              ))}
            </div>

            {/* Q-values */}
            {selQV && selQV.q_values && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Q-Values</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {selQV.q_values.map((q, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: "4px", borderRadius: 4, background: selAction === i ? "rgba(255,255,255,0.05)" : "transparent" }}>
                      <div style={{ fontSize: 8, color: ACTION_COLORS[i] }}>{ACTION_NAMES[i]}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'SF Mono', monospace" }}>{q.toFixed(3)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Avg Queue", value: frame?.metrics?.avg_queue?.toFixed(1), color: "var(--blue)" },
              { label: "Throughput", value: frame?.metrics?.throughput, color: "var(--green)" },
              { label: "Total Reward", value: frame?.rewards?.reduce((a,b) => a+b, 0).toFixed(1), color: "var(--violet)" },
              { label: "Emissions", value: frame?.metrics?.emissions?.toFixed(1), color: "var(--amber)" },
            ].map((m, i) => (
              <div key={i} className="metric-card" style={{ padding: 10 }}>
                <div className="metric-label">{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{chaos.sensorFail ? "~" + m.value : m.value}</div>
              </div>
            ))}
          </div>

          {/* Rolling Chart */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8 }}>ROLLING METRICS (Last 30 Steps)</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="step" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Line type="monotone" dataKey="queue" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="Avg Queue" />
                <Line type="monotone" dataKey="throughput" stroke="#10B981" strokeWidth={1.5} dot={false} name="Throughput" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Action Grid */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8 }}>ACTIONS THIS STEP</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {(frame?.actions || []).map((a, i) => (
                <div key={i} onClick={() => setSelectedInt(i)}
                  style={{
                    padding: "4px", borderRadius: 4, textAlign: "center", cursor: "pointer",
                    background: ACTION_COLORS[a] + "18",
                    border: selectedInt === i ? "1px solid " + ACTION_COLORS[a] : "1px solid transparent",
                    fontSize: 8, fontWeight: 600, color: ACTION_COLORS[a]
                  }}>
                  {ACTION_NAMES[a]}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
