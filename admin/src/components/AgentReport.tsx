import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

const chartPalette = {
  dial: "#0077BE",
  connect: "#0D9488",
  interest: "#F59E0B",
  convert: "#4F46E5",
  miss: "#FB7185",
  neutral: "#94A3B8",
  emerald: "#10B981"
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface AgentReportProps {
  data: {
    agentInfo: { name: string; role: string; activeHours: string; isOnline: boolean }
    kpis: { totalCalls: number; answered: number; voicemail: number; converted: number; avgDuration: string; connectRate: number; avgAttemptsToConvert: string; overdueCount: number; currentStreak: number }
    logs: Array<{ id: number; date: string; time: string; project: string; status: string; duration: number; owner: string; ownerNumber: string; notes: string }>
    statusData: Array<{ name: string; value: number; color: string }>
    projectData: Array<{ name: string; calls: number }>
    benchmarkData: Array<{ metric: string; agent: number; team: number }>
    funnelData: Array<{ stage: string; value: number; color: string }>
    heatmapHours: string[]
    heatmapDays: string[]
    heatmapData: number[][]
    heatmapMax: number
  }
}

export default function AgentReport({ data }: AgentReportProps) {
  const { agentInfo, kpis, logs, benchmarkData, funnelData, statusData, projectData, heatmapHours, heatmapDays, heatmapData, heatmapMax } = data

  const overallScore = Math.round(benchmarkData.reduce((sum, m) => sum + m.agent, 0) / benchmarkData.length)
  const avgDelta = Math.round(benchmarkData.reduce((sum, m) => sum + (m.agent - m.team), 0) / benchmarkData.length)
  const topProject = projectData.reduce((max, p) => (p.calls > max.calls ? p : max), projectData[0])
  const bestWindow = (() => {
    let best = { day: heatmapDays[0], hour: heatmapHours[0], val: -1 }
    heatmapData.forEach((row, d) => row.forEach((v, h) => {
      if (v > best.val) best = { day: heatmapDays[d], hour: heatmapHours[h], val: v }
    }))
    return best
  })()
  const totalDialed = funnelData[0]?.value ?? 0

  return (
    <div className="font-sans p-10 pb-20 w-[794px]" style={{ minHeight: "1123px", backgroundColor: "#ffffff", color: "#1e293b", lineHeight: "1.4" }}>
      <div data-pdf-section className="pdf-page space-y-6" style={{ backgroundColor: "#ffffff" }}>
        {/* Cover Header */}
        <div style={{ borderBottom: "2px solid #1e293b", paddingBottom: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>Agent Performance Report</h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>{agentInfo.name} — {agentInfo.role}</p>
          </div>
          <div style={{ textAlign: "right", color: "#64748b", fontSize: "10px", fontFamily: "monospace" }}>
            <div>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc", marginBottom: "24px" }}>          <h2 className="font-bold text-xs uppercase tracking-wider border-b pb-2 mb-3" style={{ color: "#1e293b", borderColor: "#e2e8f0" }}>Executive Summary</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold text-xs" style={{ color: "#334155" }}>Overall Performance Score</span>
            <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0" }}>
              <div className="h-full rounded-full" style={{ width: `${overallScore}%`, backgroundColor: chartPalette.emerald }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "#1e293b" }}>{overallScore}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="font-medium text-[10px]" style={{ color: "#065f46" }}>
              {avgDelta >= 0 ? "✓" : "!"} {avgDelta >= 0 ? `Outperforming team average by ${avgDelta} pts across tracked metrics` : `Trailing team average by ${Math.abs(avgDelta)} pts across tracked metrics`}
            </div>
            <div className="font-medium text-[10px]" style={{ color: "#065f46" }}>
              ✓ {kpis.connectRate}% connect rate on {totalDialed} total dials
            </div>
            <div className="font-medium text-[10px]" style={{ color: "#065f46" }}>
              ✓ Best calling window: {bestWindow.day} {bestWindow.hour} ({bestWindow.val} calls)
            </div>
            <div className="font-medium text-[10px]" style={{ color: kpis.overdueCount > 0 ? "#991b1b" : "#065f46" }}>
              {kpis.overdueCount > 0 ? "!" : "✓"} {kpis.overdueCount} follow-up{kpis.overdueCount !== 1 ? "s" : ""} currently overdue
            </div>
          </div>
        </div>

        {/* KPIs Grid — call volume */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total Calls", val: kpis.totalCalls },
            { label: "Answered", val: kpis.answered },
            { label: "Voicemails", val: kpis.voicemail },
            { label: "Converted", val: kpis.converted },
            { label: "Avg Duration", val: kpis.avgDuration }
          ].map((item, i) => (
            <div key={i} className="border rounded-lg p-2.5 text-center shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
              <span className="text-[9px] uppercase font-semibold tracking-wider block mb-1" style={{ color: "#94a3b8" }}>
                {item.label}
              </span>
              <span className="font-bold text-base" style={{ color: "#1e293b" }}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* KPIs Grid — operational health */}
        <div className="grid grid-cols-3 gap-3 mx-auto" style={{width: "fit-content", paddingBottom: 20}}>
          {[
            { label: "Connect Rate", val: `${kpis.connectRate}%` },
            { label: "Avg Attempts / Convert", val: kpis.avgAttemptsToConvert },
            { label: "Overdue Follow-ups", val: kpis.overdueCount, danger: kpis.overdueCount > 0 },
          ].map((item, i) => (
            <div key={i} className="border rounded-lg p-2.5 text-center shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
              <span className="text-[9px] uppercase font-semibold tracking-wider block mb-1" style={{ color: "#94a3b8" }}>
                {item.label}
              </span>
              <span className="font-bold text-base" style={{ color: item.danger ? chartPalette.miss : "#1e293b" }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Charts Row 1 */}
      <div data-pdf-section className="grid grid-cols-2 gap-6" style={{ backgroundColor: "#ffffff",paddingBottom: 20 }}>
        <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff"}}>
            <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Call Trends</h3>
            <div className="flex justify-center">
              <LineChart width={320} height={190} margin={{
                  top: 20,
                  right: 20,
                  left: 15,
                  bottom: 20
              }} data={logs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="duration" name="Duration" stroke={chartPalette.dial} strokeWidth={2} dot={{ r: 2, fill: chartPalette.dial }}>
                <LabelList dataKey="duration" position="top" style={{ fontSize: 8, fill: "#334155", fontWeight: 600 }} formatter={(v: number) => `${v}s`} />
              </Line>
            </LineChart>
          </div>
        </div>

        <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
          <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-2" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Call Outcome Distribution</h3>
          <div className="flex flex-col items-center justify-center">
            <PieChart width={320} height={150}>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} stroke="none" dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>

            {/* Custom 2x2 Grid Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '6px', columnGap: '20px', margin: '0 auto', marginTop: '10px' }}>
              {statusData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>{item.name}:</span>
                  <span style={{ fontSize: '10px', color: '#1e293b', fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* SECTION 3: Benchmark + Project volume */}
      <div data-pdf-section className="border-t border-dashed pt-6" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff", paddingBottom:20 }}>
        <div className="grid grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
            <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Agent vs Team Benchmarks</h3>
            <div className="flex justify-center">
              <RadarChart width={340} height={170} outerRadius={72} data={benchmarkData} style={{paddingBottom:25}}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                <Radar name={agentInfo.name} dataKey="agent" stroke={chartPalette.dial} fill={chartPalette.dial} fillOpacity={0.35} />
                <Radar name="Team Avg" dataKey="team" stroke={chartPalette.convert} fill={chartPalette.convert} fillOpacity={0.15} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
              </RadarChart>
            </div>
            <table className="w-full text-[9px] mt-2 border-t pt-1" style={{ borderColor: "#f1f5f9" }}>
              <thead>
                <tr className="uppercase font-semibold tracking-wider" style={{ color: "#94a3b8" }}>
                  <th className="text-left py-1">Metric</th>
                  <th className="text-right py-1">Agent</th>
                  <th className="text-right py-1">Team</th>
                  <th className="text-right py-1">Delta</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkData.map(m => (
                  <tr key={m.metric} className="border-t" style={{ borderColor: "#f8fafc" }}>
                    <td className="py-1 font-medium" style={{ color: "#475569" }}>{m.metric}</td>
                    <td className="py-1 text-right font-bold" style={{ color: "#1e293b" }}>{m.agent}</td>
                    <td className="py-1 text-right" style={{ color: "#64748b" }}>{m.team}</td>
                    <td className="py-1 text-right font-semibold" style={{ color: m.agent >= m.team ? chartPalette.emerald : chartPalette.miss }}>
                      {m.agent >= m.team ? "+" : ""}{m.agent - m.team}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
            <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Calls by Project</h3>
            <div className="flex justify-center">
              <BarChart width={320} height={180} data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Bar dataKey="calls" fill={chartPalette.emerald} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="calls" position="top" style={{ fontSize: 10, fontWeight: 700, fill: "#334155" }} />
                </Bar>
              </BarChart>
            </div>
            <p className="text-[9px] text-center mt-1" style={{ color: "#94a3b8" }}>
              Highest volume: <span className="font-semibold" style={{ color: "#475569" }}>{topProject.name}</span> ({topProject.calls} calls)
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: Heatmap + Funnel */}
      <div data-pdf-section className="grid grid-cols-2 gap-6" style={{ backgroundColor: "#ffffff", paddingBottom:20 }}>
        <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
          <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Best Calling Windows</h3>
          <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: `30px repeat(${heatmapHours.length}, minmax(0, 1fr))` }}>
            <div />
            {heatmapHours.map(h => (
              <div key={h} className="text-[7px] font-semibold text-center pb-0.5" style={{ color: "#94a3b8" }}>{h}</div>
            ))}
            {heatmapData.map((row, dayIdx) => (
              <div key={heatmapDays[dayIdx]} className="contents">
                <div className="text-[8px] font-bold flex items-center" style={{ color: "#64748b" }}>{heatmapDays[dayIdx]}</div>
                {row.map((val, hourIdx) => {
                  const intensity = val / heatmapMax
                  return (
                    <div
                      key={hourIdx}
                      className="aspect-square rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: hexToRgba(chartPalette.dial, 0.08 + 0.85 * intensity) }}
                    >
                      <span className={`text-[6px] font-bold`} style={{ color: intensity > 0.45 ? "#ffffff" : "#475569" }}>{val}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div
  className="border rounded-lg p-4 shadow-sm"
  style={{
    borderColor: "#e2e8f0",
    backgroundColor: "#fff"
  }}
>
  <h3
    className="font-bold text-[10px] uppercase tracking-wider border-b pb-2 mb-4"
    style={{
      color: "#334155",
      borderColor: "#e2e8f0"
    }}
  >
    Conversion Funnel
  </h3>

  <div className="space-y-3">
    {funnelData.map((stage, i) => {
      const prev =
        i === 0 ? stage.value : funnelData[i - 1].value

      const drop =
        i === 0
          ? 0
          : Math.round((1 - stage.value / prev) * 100)

      return (
        <div key={stage.stage}>
          {/* Title + Number + Drop */}
          <div
            className="flex items-center justify-between mb-1"
            style={{ fontSize: 11 }}
          >
            <div
              className="font-semibold"
              style={{ color: "#475569" }}
            >
              {stage.stage}
            </div>

            <div className="flex items-center gap-3">
              <span
                className="font-bold"
                style={{ color: "#1e293b" }}
              >
                {stage.value}
              </span>

              {i > 0 && (
                <span
                  className="font-semibold"
                  style={{ color: chartPalette.miss }}
                >
                  -{drop}%
                </span>
              )}
            </div>
          </div>

          {/* Bar */}
          <div
            style={{
              height: 10,
              background: "#e2e8f0",
              borderRadius: 999
            }}
          >
            <div
              style={{
                width: `${100 - i * 12}%`,
                height: "100%",
                borderRadius: 999,
                background: stage.color
              }}
            />
          </div>
        </div>
      )
    })}
  </div>
</div>
      </div>

      {/* SECTION 6: Insights Footer */}
      <div data-pdf-section className="border-t pt-4 flex justify-end gap-4" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff", paddingBottom:20 }}>
        <div className="text-right flex flex-col justify-end" style={{paddingBottom:20}}>
          <div className="text-[10px] font-semibold" style={{ color: "#475569" }}>Signature: __________________________</div>
          <div className="text-[8px] italic mt-3" style={{ color: "#94a3b8" }}>Wijha West — Confidentially Distributed</div>
        </div>
      </div>

    </div>
  )
}