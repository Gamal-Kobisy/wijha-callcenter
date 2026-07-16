import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

const chartPalette = {
  dial: "#0077BE",
  connect: "#0D9488",
  interest: "#F59E0B",
  closed: "#4F46E5",
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
    agentInfo: { name: string; role?: string; isOnline?: boolean }
    kpis: {
      totalCalls: number;
      successRate: number;
      avgDuration: string;
      activeHours: string;
      connectRate: number;
      avgAttemptsToClose: string | number;
      overdueCount: number;
    }
    trendData: Array<{ day: string; avgDuration: number }>
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
  const { agentInfo, kpis, trendData, benchmarkData, funnelData, statusData, projectData, heatmapHours, heatmapDays, heatmapData, heatmapMax } = data

  const safeBenchmarkData = benchmarkData.map(m => ({
    ...m,
    agent: Number(m.agent) || 0,
    team: Number(m.team) || 0
  }));

  const percentageMetrics = safeBenchmarkData.filter(m =>
    m.metric.toLowerCase().includes("rate") ||
    m.metric.toLowerCase().includes("close") ||
    m.metric.toLowerCase() === "conversion"
  );

  const overallScore = percentageMetrics.length > 0
    ? Math.round(percentageMetrics.reduce((sum, m) => sum + m.agent, 0) / percentageMetrics.length)
    : 0;

  const avgDelta = safeBenchmarkData.length > 0
    ? Math.round(safeBenchmarkData.reduce((sum, m) => sum + (m.agent - m.team), 0) / safeBenchmarkData.length)
    : 0;

  const topProject = projectData.length > 0
    ? projectData.reduce((max, p) => (p.calls > max.calls ? p : max), projectData[0])
    : { name: "N/A", calls: 0 };

  const bestWindow = (() => {
    let best = { day: heatmapDays[0] || "N/A", hour: heatmapHours[0] || "N/A", val: -1 }
    if (heatmapData && heatmapData.length > 0) {
      heatmapData.forEach((row, d) => row.forEach((v, h) => {
        if (v > best.val) best = { day: heatmapDays[d], hour: heatmapHours[h], val: v }
      }))
    }
    return best
  })()

  const totalDialed = funnelData[0]?.value ?? 0
  const isManyProjects = projectData.length > 4;

  return (
    <div className="font-sans p-10 pb-20 w-[794px]" style={{ minHeight: "1123px", backgroundColor: "#ffffff", color: "#1e293b", lineHeight: "1.4" }}>
      <div data-pdf-section className="pdf-page space-y-6" style={{ backgroundColor: "#ffffff" }}>

        {/* Cover Header */}
        <div style={{ borderBottom: "2px solid #1e293b", paddingBottom: "16px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, textTransform: "uppercase", color: "#0f172a", margin: 0 }}>Agent Performance Report</h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>{agentInfo.name} — {agentInfo.role || "Agent"}</p>
          </div>
          <div style={{ textAlign: "right", color: "#64748b", fontSize: "10px", fontFamily: "monospace" }}>
            <div>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc", marginBottom: "24px" }}>
          <h2 className="font-bold text-xs uppercase tracking-wider border-b pb-2 mb-3" style={{ color: "#1e293b", borderColor: "#e2e8f0" }}>Executive Summary</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="font-semibold text-xs" style={{ color: "#334155" }}>Overall Performance Score</span>
            <div className="flex-1 h-3.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(overallScore, 100)}%`, backgroundColor: chartPalette.emerald }} />
            </div>
            <span className="font-bold text-sm" style={{ color: "#1e293b" }}>{overallScore}/100</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="font-medium text-[10px]" style={{ color: avgDelta >= 0 ? "#065f46" : "#991b1b" }}>
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

        {/* KPIs Grid - Top Row (4 Items) */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Calls", val: kpis.totalCalls },
            { label: "Success Rate", val: `${kpis.successRate}%` },
            { label: "Avg Duration", val: kpis.avgDuration },
            { label: "Active Hours", val: kpis.activeHours }
          ].map((item, i) => (
            <div key={i} className="border rounded-lg p-2.5 text-center shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
              <span className="text-[9px] uppercase font-semibold tracking-wider block mb-1" style={{ color: "#94a3b8" }}>{item.label}</span>
              <span className="font-bold text-base" style={{ color: "#1e293b" }}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* KPIs Grid - Bottom Row (3 Items) */}
        <div className="grid grid-cols-3 gap-3 mx-auto mt-3" style={{width: "fit-content", paddingBottom: 20}}>
          {[
            { label: "Connect Rate", val: `${kpis.connectRate}%` },
            { label: "Avg Attempts / Close", val: Number(kpis.avgAttemptsToClose) || 0 },
            { label: "Overdue Follow-ups", val: kpis.overdueCount, danger: kpis.overdueCount > 0 },
          ].map((item, i) => (
            <div key={i} className="border rounded-lg p-2.5 text-center shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
              <span className="text-[9px] uppercase font-semibold tracking-wider block mb-1" style={{ color: "#94a3b8" }}>{item.label}</span>
              <span className="font-bold text-base" style={{ color: item.danger ? chartPalette.miss : "#1e293b" }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Charts Row 1 */}
      <div data-pdf-section className="grid grid-cols-2 gap-6" style={{ backgroundColor: "#ffffff", paddingBottom: 20 }}>
        <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff"}}>
            <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Call Trends</h3>
            <div className="flex justify-center">
              <LineChart width={320} height={190} margin={{ top: 25, right: 20, left: 0, bottom: 5 }} data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="avgDuration" name="Duration" stroke={chartPalette.dial} strokeWidth={2} dot={{ r: 3, fill: chartPalette.dial }}>
                <LabelList dataKey="avgDuration" position="top" offset={12} style={{ fontSize: 9, fill: "#334155", fontWeight: 700 }} formatter={(v: number) => `${v}s`} />
              </Line>
            </LineChart>
          </div>
        </div>

        <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
          <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-2" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Call Outcome Distribution</h3>
          <div className="flex flex-col items-center justify-center">
            <PieChart width={320} height={150}>
              <Pie isAnimationActive={false} data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} stroke="none" dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '6px', columnGap: '20px', margin: '0 auto', marginTop: '10px' }}>
              {statusData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ fontSize: '10px', color: '#475569', fontWeight: 600, textTransform: 'capitalize' }}>{item.name.replace("_", " ")}:</span>
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
              <RadarChart width={340} height={170} outerRadius={72} data={safeBenchmarkData} style={{paddingBottom:25}}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 'auto']} />
                <Radar isAnimationActive={false} name={agentInfo.name} dataKey="agent" stroke={chartPalette.dial} fill={chartPalette.dial} fillOpacity={0.35} />
                <Radar isAnimationActive={false} name="Team Avg" dataKey="team" stroke={chartPalette.closed} fill={chartPalette.closed} fillOpacity={0.15} />
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
                {safeBenchmarkData.map(m => (
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

          <div className="border rounded-lg p-4 shadow-sm h-full" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
            <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3" style={{ color: "#334155", borderColor: "#e2e8f0" }}>Calls by Project</h3>
            <div className="flex justify-center h-full pb-4">
              {isManyProjects ? (
                // VERTICAL LAYOUT
                <BarChart layout="vertical" width={320} height={Math.max(180, projectData.length * 35)} data={projectData} margin={{ top: 10, right: 30, left: 45, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={60} />
                  <Bar isAnimationActive={false} dataKey="calls" fill={chartPalette.emerald} radius={[0, 3, 3, 0]}>
                    <LabelList dataKey="calls" position="right" style={{ fontSize: 10, fontWeight: 700, fill: "#334155" }} />
                  </Bar>
                </BarChart>
              ) : (
                // STANDARD HORIZONTAL LAYOUT
                <BarChart width={320} height={180} data={projectData} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Bar isAnimationActive={false} dataKey="calls" fill={chartPalette.emerald} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="calls" position="top" offset={8} style={{ fontSize: 10, fontWeight: 700, fill: "#334155" }} />
                  </Bar>
                </BarChart>
              )}
            </div>
            <p className="text-[9px] text-center mt-3" style={{ color: "#94a3b8" }}>
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
                  const intensity = heatmapMax > 0 ? val / heatmapMax : 0
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

        <div className="border rounded-lg p-4 shadow-sm" style={{ borderColor: "#e2e8f0", backgroundColor: "#fff" }}>
          <h3 className="font-bold text-[10px] uppercase tracking-wider border-b pb-2 mb-4" style={{ color: "#334155", borderColor: "#e2e8f0" }}>
            Close Funnel
          </h3>

          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const prev = i === 0 ? Number(stage.value) : Number(funnelData[i - 1].value);
              const current = Number(stage.value) || 0;

              const drop = (i === 0 || !prev || prev === 0) ? 0 : Math.round((1 - current / prev) * 100);

              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1" style={{ fontSize: 11 }}>
                    <div className="font-semibold" style={{ color: "#475569" }}>{stage.stage}</div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: "#1e293b" }}>{current}</span>
                      {i > 0 && (
                        <span className="font-semibold" style={{ color: chartPalette.miss }}>-{drop}%</span>
                      )}
                    </div>
                  </div>

                  <div style={{ height: 10, background: "#e2e8f0", borderRadius: 999 }}>
                    <div style={{ width: `${100 - i * 12}%`, height: "100%", borderRadius: 999, background: stage.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div data-pdf-section className="border-t pt-4 flex justify-end gap-4" style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff", paddingBottom:20 }}>
        <div className="text-right flex flex-col justify-end" style={{paddingBottom:20}}>
          <div className="text-[10px] font-semibold" style={{ color: "#475569" }}>Signature: __________________________</div>
          <div className="text-[8px] italic mt-3" style={{ color: "#94a3b8" }}>Wijha West — Confidentially Distributed</div>
        </div>
      </div>
    </div>
  )
}