import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
const chartPalette = {
  dial: "#0077BE",     // indigo
  connect: "#0D9488",  // teal
  interest: "#F59E0B", // amber
  convert: "#4F46E5",  // violet
  miss: "#FB7185",     // rose
  neutral: "#94A3B8",  // slate
  emerald: "#10B981"   // emerald
}
const heatmapHours = ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm"]
const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const heatmapData = [
  [4, 8, 12, 6, 3, 9, 14, 11, 7, 2],
  [5, 9, 13, 7, 4, 10, 15, 12, 8, 3],
  [6, 10, 14, 8, 5, 11, 16, 13, 9, 4],
  [5, 9, 13, 7, 4, 10, 15, 12, 8, 3],
  [7, 11, 15, 9, 6, 12, 17, 10, 6, 2],
  [2, 4, 6, 3, 2, 4, 5, 3, 2, 1],
  [1, 2, 3, 1, 1, 2, 3, 2, 1, 0],
]
const heatmapMax = Math.max(...heatmapData.flat())
function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
interface AgentReportProps {
  data: {
    agentInfo: {
      name: string
      role: string
      activeHours: string
      isOnline: boolean
    }
    kpis: {
      totalCalls: number
      answered: number
      voicemail: number
      converted: number
      avgDuration: string
    }
    logs: Array<{
      id: number
      date: string
      time: string
      project: string
      status: string
      duration: number
      owner: string
      ownerNumber: string
      notes: string
    }>
    followUps: Array<{
      id: number
      owner: string
      number: string
      attempts: number
      nextDial: string
    }>
    statusData: Array<{
      name: string
      value: number
      color: string
    }>
    projectData: Array<{
      name: string
      calls: number
    }>
    benchmarkData: Array<{
      metric: string
      agent: number
      team: number
    }>
    funnelData: Array<{
      stage: string
      value: number
      color: string
    }>
  }
}
export default function AgentReport({ data }: AgentReportProps) {
  const { agentInfo, kpis, logs, followUps, benchmarkData, funnelData, statusData, projectData } = data
  return (
    <div className="hidden print:block p-8 bg-white text-slate-800 font-sans text-xs w-[750px] mx-auto">
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: #1e293b !important;
          }
          @page {
            size: A4;
            margin: 15mm 10mm;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>
      {/* Cover Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-slate-900">Agent Performance Report</h1>
          <p className="text-sm text-slate-500 font-medium">{agentInfo.name} — {agentInfo.role}</p>
        </div>
        <div className="text-right text-slate-500 font-mono text-[10px]">
          <div>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          <div>Report ID: AGT-{Math.floor(100000 + Math.random() * 900000)}</div>
        </div>
      </div>
      {/* Executive Summary */}
      <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50/50">
        <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Executive Summary</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="font-semibold text-slate-700">Overall Performance Score</span>
          <div className="flex-1 h-3.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "87%" }} />
          </div>
          <span className="font-bold text-slate-800 text-sm">87/100</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="text-emerald-700 font-medium text-[10px] flex items-center gap-1">
            ? Excellent conversion rate (+12% vs Team)
          </div>
          <div className="text-emerald-700 font-medium text-[10px] flex items-center gap-1">
            ? Above average call volume ({kpis.totalCalls} calls)
          </div>
          <div className="text-emerald-700 font-medium text-[10px] flex items-center gap-1">
            ? Outstanding follow-up attempts rate
          </div>
        </div>
      </div>
      {/* KPIs Grid */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Calls", val: kpis.totalCalls },
          { label: "Answered", val: kpis.answered },
          { label: "Voicemails", val: kpis.voicemail },
          { label: "Converted", val: kpis.converted },
          { label: "Avg Duration", val: kpis.avgDuration }
        ].map((item, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-2.5 text-center bg-white shadow-sm">
            <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
              {item.label}
            </span>
            <span className="font-bold text-base text-slate-800">{item.val}</span>
          </div>
        ))}
      </div>
      {/* Page 1 Visuals */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Call Trends */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3">Call Trends</h3>
          <div className="flex justify-center">
            <LineChart width={310} height={170} data={logs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="duration" name="Duration" stroke={chartPalette.dial} strokeWidth={2} dot={{ r: 2, fill: chartPalette.dial }} />
            </LineChart>
          </div>
        </div>
        {/* Call Outcome Distribution */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3">Call Outcome Distribution</h3>
          <div className="flex justify-center">
            <PieChart width={310} height={170}>
              <Pie
                data={statusData || []}
                cx="50%"
                cy="45%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {(statusData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '9px', color: '#64748b' }} />
            </PieChart>
          </div>
        </div>
      </div>
      <div className="page-break" />
      {/* Page 2 Header */}
      <div className="border-b border-slate-200 pb-2 mb-6 pt-4 flex justify-between items-center">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{agentInfo.name} — Performance Report</span>
        <span className="text-slate-400 text-[9px]">Page 2 of 3</span>
      </div>
      {/* Radar Chart & Bar Chart */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Agent vs Team Benchmarks */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3">Agent vs Team Benchmarks</h3>
          <div className="flex justify-center">
            <RadarChart width={310} height={170} outerRadius={55} data={benchmarkData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8 }} />
              <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
              <Radar name={agentInfo.name} dataKey="agent" stroke={chartPalette.dial} fill={chartPalette.dial} fillOpacity={0.35} />
              <Radar name="Team Avg" dataKey="team" stroke={chartPalette.convert} fill={chartPalette.convert} fillOpacity={0.15} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '9px' }} />
            </RadarChart>
          </div>
        </div>
        {/* Calls by Project */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3">Calls by Project</h3>
          <div className="flex justify-center">
            <BarChart width={310} height={170} data={projectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Bar dataKey="calls" fill={chartPalette.emerald} radius={[3, 3, 0, 0]} />
            </BarChart>
          </div>
        </div>
      </div>
      {/* Best Calling Windows & Conversion Funnel */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Heatmap */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-3">Best Calling Windows</h3>
          <div className="grid gap-1 mt-2" style={{ gridTemplateColumns: `30px repeat(${heatmapHours.length}, minmax(0, 1fr))` }}>
            <div />
            {heatmapHours.map(h => (
              <div key={h} className="text-[7px] font-semibold text-slate-400 text-center pb-0.5">{h}</div>
            ))}
            {heatmapData.map((row, dayIdx) => (
              <div key={heatmapDays[dayIdx]} className="contents">
                <div className="text-[8px] font-bold text-slate-500 flex items-center">{heatmapDays[dayIdx]}</div>
                {row.map((val, hourIdx) => (
                  <div
                    key={hourIdx}
                    className="aspect-square rounded-sm"
                    style={{ backgroundColor: hexToRgba(chartPalette.dial, 0.08 + 0.85 * (val / heatmapMax)) }}
                    title={`${val} calls`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Funnel */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider border-b pb-1.5 mb-2">Conversion Funnel</h3>
          <div className="flex flex-col gap-2 py-2">
            {funnelData.map((stage, i) => {
              const widthPct = 100 - i * 12
              return (
                <div key={stage.stage} className="flex items-center text-[10px]">
                  <span className="w-16 font-medium text-slate-500 truncate">{stage.stage}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden mr-2">
                    <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: stage.color }} />
                  </div>
                  <span className="font-bold text-slate-700 w-8 text-right">{stage.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="page-break" />
      {/* Page 3 Header */}
      <div className="border-b border-slate-200 pb-2 mb-6 pt-4 flex justify-between items-center">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{agentInfo.name} — Performance Report</span>
        <span className="text-slate-400 text-[9px]">Page 3 of 3</span>
      </div>
      {/* Tables - Pending Follow-ups */}
      <div className="mb-6 border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Pending Follow-ups</h2>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-2 pl-3">Owner</th>
                <th className="p-2">Phone</th>
                <th className="p-2 text-center">Attempts</th>
                <th className="p-2 text-center">Next Dial Date</th>
                <th className="p-2 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map(f => {
                const isOverdue = new Date(f.nextDial) < new Date("2026-07-06")
                return (
                  <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-2 pl-3 font-semibold text-slate-700">{f.owner}</td>
                    <td className="p-2 font-mono text-[9px]">{f.number}</td>
                    <td className="p-2 text-center font-bold text-slate-600">{f.attempts}</td>
                    <td className="p-2 text-center font-medium">{f.nextDial}</td>
                    <td className="p-2 pr-3 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase ${isOverdue ? 'bg-rose-500' : 'bg-slate-400'}`}>
                        {isOverdue ? "Overdue" : "Pending"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Tables - Recent Call Activity */}
      <div className="mb-6 border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Recent Call Activity</h2>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-2 pl-3">Date</th>
                <th className="p-2">Time</th>
                <th className="p-2">Project</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Owner</th>
                <th className="p-2 pr-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 8).map(l => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="p-2 pl-3 font-medium">{l.date}</td>
                  <td className="p-2 text-slate-500">{l.time}</td>
                  <td className="p-2 font-semibold text-slate-700">{l.project}</td>
                  <td className="p-2 font-mono text-[9px]">{l.duration}s</td>
                  <td className="p-2 font-medium">{l.owner}</td>
                  <td className="p-2 pr-3 text-right">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase" style={{ backgroundColor: l.status === 'Answered' ? chartPalette.connect : l.status === "Voicemail" ? chartPalette.neutral : l.status === "Converted" ? chartPalette.convert : chartPalette.miss }}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Insights */}
      <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold text-slate-800 mb-2 text-[10px] uppercase tracking-wider">Performance Insights</h2>
          <p className="text-slate-500 leading-relaxed text-[10px]">
            • Best calling window identified as Tuesday 3:00 PM based on conversion rates.<br/>
            • Highest volume and conversion rate observed on <strong>Project Alpha</strong>.
          </p>
        </div>
        <div className="text-right flex flex-col justify-end">
          <div className="text-[10px] font-semibold text-slate-700">Signature: __________________________</div>
          <div className="text-[8px] text-slate-400 italic mt-4">Call Center Analytics System — Confidentially Distributed</div>
        </div>
      </div>
    </div>
  )
}