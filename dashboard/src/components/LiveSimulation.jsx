import { useState, useEffect, useRef, useMemo } from "react"
import { Play, Pause, RotateCcw, Brain, AlertTriangle, CloudRain, Ambulance } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

const NAMES = [
  "Al Rigga","Deira CC","Maktoum Br","Bur Dubai",
  "SZR Jct","DIFC","Biz Bay","Dubai Mall",
  "Al Quoz","Jumeirah","Palm Tun","Marina",
  "DIP","Acad City","Al Barsha","Airport T3"
]
const ZONES = ["DEIRA","DOWNTOWN","JUMEIRAH","SOUTH DUBAI"]
const AGENT_META = {
  q_learning: { label: "Q-Learning", color: "#3B82F6", shortDesc: "Off-policy TD" },
  sarsa: { label: "SARSA", color: "#10B981", shortDesc: "On-policy TD" },
  fixed_timer: { label: "Fixed Timer", color: "#EF4444", shortDesc: "30s cycle" },
}
const ACTION_NAMES = ["HOLD", "SWITCH", "EXTEND"]
const ACTION_COLORS = ["#06B6D4", "#F59E0B", "#8B5CF6"]
const ttStyle = { background: "#0C1220", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 10, color: "#F1F5F9", fontSize: 11 }

function getCongestion(qNS, qEW) {
  const t = qNS + qEW
  if (t < 8) return { color: "#10B981", label: "Low", severity: 0 }
  if (t < 20) return { color: "#F59E0B", label: "Moderate", severity: 1 }
  if (t < 40) return { color: "#F97316", label: "High", severity: 2 }
  return { color: "#EF4444", label: "Critical", severity: 3 }
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

  if (!frames) return <p style={{ color: "var(--text-label)" }}>No simulation data available</p>

  const agentColor = AGENT_META[agentType].color
  const grid = frame?.grid || []
  const qVals = frame?.q_values || []

  // XAI for selected intersection
  const selIdx = selectedInt !== null ? selectedInt : 0
  const selInter = grid[selIdx]
  const selAction = frame?.actions?.[selIdx]
  const selReward = frame?.rewards?.[selIdx]
  const selQV = qVals[selIdx]

  // Build XAI reasoning
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
      const heavierDir = selInter.queue_ns >= selInter.queue_ew ? "NS" : "EW"
      const heavierQ = Math.max(selInter.queue_ns, selInter.queue_ew)
      const lighterQ = Math.min(selInter.queue_ns, selInter.queue_ew)
      if (selAction === 0) {
        xaiReason = `Maintain ${selInter.phase === 0 ? "NS" : "EW"} green phase (serving active queue)`
        xaiFactors.push(`Q(Hold)=${qv[0].toFixed(2)}`)
        if (heavierQ > lighterQ * 1.3) xaiFactors.push(`${heavierDir} queue dominant`)
      } else if (selAction === 1) {
        xaiReason = `Switch to ${heavierDir} - queue imbalance (${heavierQ} vs ${lighterQ})`
        xaiFactors.push(`Q(Switch)=${qv[1].toFixed(2)}`)
        xaiFactors.push(`Differential: ${Math.abs(selInter.queue_ns - selInter.queue_ew)}`)
      } else {
        xaiReason = `Extend current green to clear ${heavierQ}-vehicle backlog`
        xaiFactors.push(`Q(Extend)=${qv[2].toFixed(2)}`)
        xaiFactors.push(`Large active queue (${heavierQ})`)
      }
      xaiFactors.push(`Visits: ${selQV.state_visits || 0}`)
    }
  }

  // SVG dimensions
  const svgW = 580, svgH = 520
  const pad = 60, cellW = (svgW - 2 * pad) / 3, cellH = (svgH - 2 * pad) / 3

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Control Bar */}
      <div className="card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {/* Agent Selection */}
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(AGENT_META).map(([k, v]) => (
            <button key={k} onClick={() => { setAgentType(k); setStep(0); setPlaying(false) }}
              className={`btn btn-sm ${agentType === k ? "" : "btn-outline"}`}
              style={agentType === k ? { background: v.color, color: "#0C1220", fontWeight: 700, border: "none" } : {}}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: "var(--border-medium)" }} />

        {/* Transport Controls */}
        <button className="btn btn-sm btn-outline" onClick={() => { setStep(0); setPlaying(false) }}><RotateCcw size={13} /></button>
        <button className="btn btn-sm btn-teal" onClick={() => setPlaying(!playing)}>
          {playing ? <Pause size={13} /> : <Play size={13} />} {playing ? "Pause" : "Play"}
        </button>

        <div style={{ width: 1, height: 24, background: "var(--border-medium)" }} />

        {/* Speed */}
        <span style={{ fontSize: 10, color: "var(--text-label)" }}>Speed</span>
        <input type="range" min={50} max={800} step={50} value={800 - speed}
          onChange={e => setSpeed(800 - Number(e.target.value))} style={{ width: 80 }} />

        <div style={{ flex: 1 }} />

        {/* Step counter */}
        <span style={{ fontSize: 11, color: "var(--text-label)", fontFamily: "monospace" }}>
          Step {step}/{maxStep}
        </span>

        <div style={{ width: 1, height: 24, background: "var(--border-medium)" }} />

        {/* Chaos Mode */}
        <div style={{ display: "flex", gap: 5 }}>
          <button className={`btn btn-sm ${chaos.sandstorm ? "btn-outline active" : "btn-outline"}`}
            onClick={() => setChaos(c => ({ ...c, sandstorm: !c.sandstorm }))}
            style={chaos.sandstorm ? { background: "var(--gold-dim)", borderColor: "#F59E0B", color: "#F59E0B" } : {}}>
            <CloudRain size={12} /> Sandstorm
          </button>
          <button className={`btn btn-sm ${chaos.sensorFail ? "btn-outline active" : "btn-outline"}`}
            onClick={() => setChaos(c => ({ ...c, sensorFail: !c.sensorFail }))}
            style={chaos.sensorFail ? { background: "var(--red-dim)", borderColor: "#EF4444", color: "#EF4444" } : {}}>
            <AlertTriangle size={12} /> Sensor Fail
          </button>
          <button className={`btn btn-sm ${chaos.emergency ? "btn-outline active" : "btn-outline"}`}
            onClick={() => setChaos(c => ({ ...c, emergency: !c.emergency }))}
            style={chaos.emergency ? { background: "var(--blue-dim)", borderColor: "#3B82F6", color: "#3B82F6" } : {}}>
            <Ambulance size={12} /> Emergency
          </button>
        </div>
      </div>

      {/* Main content: SVG + Right Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 14 }}>
        {/* SVG Traffic Grid */}
        <div className="card" style={{ padding: 16, position: "relative" }}>
          {chaos.sandstorm && <div style={{ position: "absolute", inset: 0, background: "rgba(245,158,11,0.06)", borderRadius: 14, zIndex: 1, pointerEvents: "none" }} />}
          <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: "auto" }}>
            <defs>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>

            {/* Zone labels */}
            {ZONES.map((z, i) => (
              <text key={z} x={12} y={pad + i * cellH + cellH / 2} fill="#64748B" fontSize="9" fontWeight="600" textAnchor="start" transform={`rotate(-90, 12, ${pad + i * cellH + cellH / 2})`}>{z}</text>
            ))}

            {/* Roads — horizontal */}
            {[0, 1, 2, 3].map(r => (
              <g key={`hr${r}`}>
                <rect x={pad - 20} y={pad + r * cellH - 8} width={svgW - 2 * pad + 40} height={16} rx={2} fill="#1A2332" />
                <line x1={pad - 20} y1={pad + r * cellH} x2={svgW - pad + 20} y2={pad + r * cellH} stroke="#334155" strokeWidth={0.5} strokeDasharray="6 4" />
              </g>
            ))}
            {/* Roads — vertical */}
            {[0, 1, 2, 3].map(c => (
              <g key={`vr${c}`}>
                <rect x={pad + c * cellW - 8} y={pad - 20} width={16} height={svgH - 2 * pad + 40} rx={2} fill="#1A2332" />
                <line x1={pad + c * cellW} y1={pad - 20} x2={pad + c * cellW} y2={svgH - pad + 20} stroke="#334155" strokeWidth={0.5} strokeDasharray="6 4" />
              </g>
            ))}

            {/* Intersections */}
            {grid.map((inter, i) => {
              const row = Math.floor(i / 4), col = i % 4
              const cx = pad + col * cellW, cy = pad + row * cellH
              const cong = getCongestion(inter.queue_ns, inter.queue_ew)
              const isSelected = selectedInt === i
              const isSensorFail = chaos.sensorFail && (i % 5 === 2 || i % 7 === 0)
              const isEmergency = chaos.emergency && (i === 5 || i === 10)

              return (
                <g key={i} onClick={() => setSelectedInt(i)} style={{ cursor: "pointer" }}>
                  {/* Selection ring */}
                  {isSelected && <circle cx={cx} cy={cy} r={22} fill="none" stroke={agentColor} strokeWidth={2} strokeDasharray="4 2" opacity={0.7} />}

                  {/* Congestion glow */}
                  <circle cx={cx} cy={cy} r={16} fill={cong.color} opacity={0.08} />

                  {/* Main node */}
                  <circle cx={cx} cy={cy} r={12} fill="#0C1220" stroke={cong.color} strokeWidth={2} />

                  {/* Traffic light indicator */}
                  <circle cx={cx} cy={cy} r={4}
                    fill={inter.is_yellow ? "#F59E0B" : inter.phase === 0 ? "#10B981" : "#EF4444"} filter="url(#glow)" />

                  {/* Queue bars */}
                  <rect x={cx - 2} y={cy - 12 - Math.min(inter.queue_ns * 0.8, 30)} width={4} height={Math.min(inter.queue_ns * 0.8, 30)} rx={1} fill="#3B82F6" opacity={0.7} />
                  <rect x={cx + 12} y={cy - 2} width={Math.min(inter.queue_ew * 0.8, 30)} height={4} rx={1} fill="#F59E0B" opacity={0.7} />

                  {/* Name */}
                  <text x={cx} y={cy + 24} textAnchor="middle" fill="#94A3B8" fontSize="7" fontWeight="500">{NAMES[i]}</text>

                  {/* Action badge */}
                  {frame?.actions && (
                    <rect x={cx + 10} y={cy - 20} width={5} height={5} rx={1}
                      fill={ACTION_COLORS[frame.actions[i]] || "#64748B"} />
                  )}

                  {/* Chaos overlays */}
                  {isSensorFail && <text x={cx + 14} y={cy - 8} fill="#EF4444" fontSize="10" fontWeight="700">!</text>}
                  {isEmergency && <>
                    <circle cx={cx} cy={cy} r={20} fill="none" stroke="#3B82F6" strokeWidth={1.5} opacity={0.5}>
                      <animate attributeName="r" values="18;24;18" dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1s" repeatCount="indefinite" />
                    </circle>
                  </>}
                </g>
              )
            })}

            {/* Legend */}
            <g transform={`translate(${svgW - 150}, ${svgH - 55})`}>
              <rect x={-8} y={-12} width={150} height={52} rx={6} fill="#0C1220" stroke="rgba(148,163,184,0.07)" />
              {[["#10B981", "Low"], ["#F59E0B", "Mod"], ["#F97316", "High"], ["#EF4444", "Crit"]].map(([c, l], i) => (
                <g key={l} transform={`translate(${i * 35}, 0)`}>
                  <circle cx={8} cy={4} r={4} fill={c} />
                  <text x={8} y={20} textAnchor="middle" fill="#94A3B8" fontSize="7">{l}</text>
                </g>
              ))}
              <g transform="translate(0, 28)">
                <rect width={4} height={8} rx={1} fill="#3B82F6" opacity={0.7} />
                <text x={8} y={7} fill="#94A3B8" fontSize="7">NS Queue</text>
                <rect x={60} width={8} height={4} rx={1} fill="#F59E0B" opacity={0.7} />
                <text x={72} y={5} fill="#94A3B8" fontSize="7">EW Queue</text>
              </g>
            </g>
          </svg>

          {/* Chaos status bar */}
          {(chaos.sandstorm || chaos.sensorFail || chaos.emergency) && (
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              {chaos.sandstorm && <span className="badge-gold">Sandstorm: -40% capacity</span>}
              {chaos.sensorFail && <span className="badge-red">Sensor offline at 3 nodes</span>}
              {chaos.emergency && <span className="badge-blue">Emergency routing active</span>}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* XAI Panel */}
          <div className="card" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
            <div className="section-title">
              <Brain size={14} style={{ color: "var(--purple)" }} />
              <span>XAI Decision Logic</span>
              {selectedInt !== null && <span className="badge-teal" style={{ marginLeft: "auto" }}>{NAMES[selectedInt]}</span>}
            </div>

            {selInter ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Action + Confidence */}
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, background: "var(--bg-card-alt)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-label)" }}>Action</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: ACTION_COLORS[selAction] || "var(--text-primary)" }}>
                      {ACTION_NAMES[selAction] || "N/A"}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "var(--bg-card-alt)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "var(--text-label)" }}>Confidence</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: xaiConfidence > 70 ? "var(--green)" : xaiConfidence > 40 ? "var(--gold)" : "var(--red)" }}>
                      {xaiConfidence.toFixed(0)}%
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "var(--bg-elevated)", marginTop: 4 }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${xaiConfidence}%`, background: xaiConfidence > 70 ? "var(--green)" : xaiConfidence > 40 ? "var(--gold)" : "var(--red)" }} />
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, padding: "8px 10px", background: "var(--bg-card-alt)", borderRadius: 8 }}>
                  {xaiReason}
                </div>

                {/* Q-Values */}
                {selQV && agentType !== "fixed_timer" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {(selQV.q_values || []).map((q, qi) => (
                      <div key={qi} style={{
                        flex: 1, textAlign: "center", padding: "6px 4px", borderRadius: 6,
                        background: selAction === qi ? `${ACTION_COLORS[qi]}15` : "var(--bg-card-alt)",
                        border: selAction === qi ? `1px solid ${ACTION_COLORS[qi]}40` : "1px solid transparent"
                      }}>
                        <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{ACTION_NAMES[qi]}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: selAction === qi ? ACTION_COLORS[qi] : "var(--text-secondary)" }}>
                          {q.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Factors */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {xaiFactors.map((f, i) => (
                    <span key={i} className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-label)" }}>{f}</span>
                  ))}
                </div>

                {/* Intersection state */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div style={{ background: "var(--bg-card-alt)", borderRadius: 6, padding: "6px 10px" }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>NS Queue</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#3B82F6" }}>{selInter.queue_ns}</div>
                  </div>
                  <div style={{ background: "var(--bg-card-alt)", borderRadius: 6, padding: "6px 10px" }}>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>EW Queue</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#F59E0B" }}>{selInter.queue_ew}</div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Click an intersection on the grid to inspect</p>
            )}
          </div>

          {/* Live Metrics Chart */}
          <div className="card">
            <div className="section-title">
              <span className="dot" style={{ background: agentColor }} />
              Rolling Metrics (Last 30 Steps)
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="step" tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Line type="monotone" dataKey="queue" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="Avg Queue" />
                <Line type="monotone" dataKey="reward" stroke="#10B981" strokeWidth={1.5} dot={false} name="Reward" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="metric-mini">
              <div className="metric-mini-label">Avg Queue</div>
              <div className="metric-mini-value" style={{ color: "var(--blue)" }}>{frame?.metrics?.avg_queue?.toFixed(1) || 0}</div>
            </div>
            <div className="metric-mini">
              <div className="metric-mini-label">Throughput</div>
              <div className="metric-mini-value" style={{ color: "var(--green)" }}>{frame?.metrics?.throughput || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}