import { useState, useMemo, useRef } from "react"
import { useParams } from "react-router-dom"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import {
  ChevronLeft, ChevronRight, Phone, Target, Clock, TrendingUp, Calendar, FileText, Download, Loader2,
  AlertTriangle, Wifi, Repeat
} from "lucide-react"
import AppNavbar from "@/components/AppNavbar.tsx"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast, Toaster } from "sonner"
import AgentReport from "@/components/AgentReport.tsx"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

const chartPalette = {
  dial: "#0077BE",
  connect: "#0D9488",
  interest: "#F59E0B",
  convert: "#4F46E5",
  miss: "#FB7185",
  neutral: "#94A3B8",
  emerald: "#10B981"
}

const agentInfo = { name: "Ahmed Tarek", role: "Senior Agent", activeHours: "2h", isOnline: true }

const followUps = [
  { id: 100, owner: "Karim Fathy", number: "+20 111 222 3333", attempts: 5, nextDial: "2026-07-04" },
  { id: 101, owner: "Mostafa Ahmed", number: "+20 100 111 2222", attempts: 3, nextDial: "2026-07-08" },
  { id: 102, owner: "Sarah Mahmoud", number: "+20 122 333 4444", attempts: 1, nextDial: "2026-07-09" },
]

const calls = [
  { name: "Answered", value: 450, color: chartPalette.connect },
  { name: "Voicemail", value: 300, color: chartPalette.neutral },
  { name: "No Answer", value: 200, color: chartPalette.miss },
  { name: "Converted", value: 85, color: chartPalette.convert },
]

const dummyLogs = [
  { id: 1, date: "2026-07-06", time: "10:30 AM", project: "Project Alpha", status: "Answered", duration: 180, owner: "John Doe", ownerNumber: "+20 101 234 5678", notes: "Interested in renewal" },
  { id: 2, date: "2026-07-06", time: "02:15 PM", project: "Project Beta", status: "Voicemail", duration: 30, owner: "Jane Smith", ownerNumber: "+20 102 345 6789", notes: "Left message" },
  { id: 3, date: "2026-07-06", time: "10:30 AM", project: "Project Alpha", status: "Answered", duration: 180, owner: "John Doe", ownerNumber: "+20 101 234 5678", notes: "Interested in renewal" },
  { id: 4, date: "2026-07-05", time: "02:15 PM", project: "Project Beta", status: "Voicemail", duration: 30, owner: "Jane Smith", ownerNumber: "+20 102 345 6789", notes: "Left message" },
  { id: 5, date: "2026-07-05", time: "10:30 AM", project: "Project Alpha", status: "Converted", duration: 180, owner: "John Doe", ownerNumber: "+20 101 234 5678", notes: "Interested in renewal" },
  { id: 6, date: "2026-07-05", time: "02:15 PM", project: "Project Beta", status: "No Answer", duration: 30, owner: "Jane Smith", ownerNumber: "+20 102 345 6789", notes: "Left message" },
]

const projectData = [{ name: 'Alpha', calls: 50 }, { name: 'Beta', calls: 30 }, { name: 'Gamma', calls: 40 }]

const benchmarkData = [
  { metric: "Calls Made", agent: 82, team: 65 },
  { metric: "Connect Rate", agent: 78, team: 60 },
  { metric: "Avg Duration", agent: 68, team: 74 },
  { metric: "Conversion", agent: 85, team: 55 },
  { metric: "Follow-up Rate", agent: 90, team: 68 },
]

const funnelData = [
  { stage: "Dialed", value: 620, color: chartPalette.dial },
  { stage: "Connected", value: 450, color: chartPalette.connect },
  { stage: "Interested", value: 210, color: chartPalette.interest },
  { stage: "Converted", value: 85, color: chartPalette.convert },
]

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

export default function AgentPerformancePage() {
  const { id } = useParams()

  const [dateRange, setDateRange] = useState("Today")
  const [date, setDate] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const reportRef = useRef<HTMLDivElement>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDate(e.target.value)
      setDateRange(e.target.value)
      setCurrentPage(1)
    }
  }

  const handlePresetDateChange = (range: string) => {
    setDateRange(range)
    setDate("")
    setCurrentPage(1)
  }

  const filteredLogs = useMemo(() => {
    const today = new Date("2026-07-06")

    return dummyLogs.filter(log => {
      const matchesSearch = searchTerm
        ? log.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.ownerNumber.toLowerCase().includes(searchTerm.toLowerCase())
        : true

      if (!matchesSearch) return false
      if (date) return log.date === date

      const logDate = new Date(log.date)
      if (isNaN(logDate.getTime())) return false

      if (dateRange === "Today") {
        return log.date === "2026-07-06"
      } else if (dateRange === "Past Week") {
        const diffDays = (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= 7
      } else if (dateRange === "Past Month") {
        const diffDays = (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= 30
      } else if (dateRange === "Past Year") {
        const diffDays = (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays >= 0 && diffDays <= 365
      } else {
        return log.date === dateRange
      }
    })
  }, [date, dateRange, searchTerm])

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  const connectRate = Math.round((funnelData[1].value / funnelData[0].value) * 100)
  const overdueCount = followUps.filter(f => new Date(f.nextDial) < new Date("2026-07-06")).length
  const avgAttemptsToConvert = (followUps.reduce((sum, f) => sum + f.attempts, 0) / followUps.length).toFixed(1)
  const currentStreak = 12

  const exportToCSV = () => {
    const headers = ["ID", "Date", "Time", "Project", "Status", "Duration", "Owner", "Phone", "Notes"]
    const csvContent = [
      headers.join(","),
      ...filteredLogs.map(l => [
        l.id, `"${l.date}"`, `"${l.time}"`, `"${l.project}"`, `"${l.status}"`, `"${l.duration}s"`, `"${l.owner}"`, `"${l.ownerNumber}"`, `"${l.notes}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.setAttribute("href", url)
    a.setAttribute("download", `agent_${id}_export_${new Date().toISOString().split('T')[0]}.csv`)
    a.click()

    toast.success("Export Complete")
  }

  const addCanvasAcrossPages = (
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    startY: number,
    margin: number,
    usableWidth: number,
    pageHeight: number
  ) => {
    const scaleFactor = usableWidth / canvas.width
    const imgHeightMm = canvas.height * scaleFactor
    const availableOnCurrentPage = pageHeight - margin - startY

    if (imgHeightMm <= availableOnCurrentPage) {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, startY, usableWidth, imgHeightMm)
      return startY + imgHeightMm
    }

    const fullPageHeight = pageHeight - margin * 2
    if (imgHeightMm <= fullPageHeight) {
      pdf.addPage()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, margin, usableWidth, imgHeightMm)
      return margin + imgHeightMm
    }

    pdf.addPage()
    const pageHeightPx = fullPageHeight / scaleFactor
    let renderedPx = 0
    let cursorY = margin
    let firstSlice = true

    while (renderedPx < canvas.height) {
      if (!firstSlice) {
        pdf.addPage()
        cursorY = margin
      }
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)
      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeightPx
      const ctx = sliceCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)
        const sliceHeightMm = sliceHeightPx * scaleFactor
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, cursorY, usableWidth, sliceHeightMm)
        cursorY += sliceHeightMm
      }
      renderedPx += sliceHeightPx
      firstSlice = false
    }
    return cursorY
  }

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return
    setIsGeneratingPDF(true)
    const loadingToast = toast.loading("Serializing layout containers...")

    try {
      const sections = Array.from(
        reportRef.current.querySelectorAll<HTMLElement>('[data-pdf-section]')
      )
      if (sections.length === 0) throw new Error("No report sections found to render")

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const usableWidth = pageWidth - margin * 2
      const gap = 4

      let cursorY = margin
      let isFirstSection = true

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
        })

        if (!isFirstSection) cursorY += gap
        cursorY = addCanvasAcrossPages(pdf, canvas, cursorY, margin, usableWidth, pageHeight)
        isFirstSection = false
      }

      pdf.save(`Agent_Report_${agentInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.dismiss(loadingToast)
      toast.success("Report Saved to Downloads Folder")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.dismiss(loadingToast)
      toast.error("Report Generation Failed")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppNavbar />
        <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">

            {/* Agent Info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg shrink-0">
                {agentInfo.name.split(" ").map(n => n[0]).join("")}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {agentInfo.name}
                  </h1>

                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: agentInfo.isOnline
                        ? chartPalette.emerald
                        : "#cbd5e1",
                      boxShadow: agentInfo.isOnline
                        ? `0 0 6px ${hexToRgba(chartPalette.emerald, 0.6)}`
                        : "none",
                    }}
                    title={agentInfo.isOnline ? "Online" : "Offline"}
                  />
                </div>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <p className="text-muted-foreground">
                    {agentInfo.role}
                  </p>

                  <Badge
                    className="px-3 py-1 text-white border-none"
                    style={{ backgroundColor: chartPalette.emerald }}
                  >
                    {agentInfo.activeHours} Active Today
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action */}
            <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-slate-900 hover:bg-slate-800 text-white transition-colors"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF Report
                </>
              )}
            </Button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Calls", val: filteredLogs.length, icon: Phone },
              { title: "Success Rate", val: "78%", icon: TrendingUp },
              { title: "Avg Duration", val: "105s", icon: Clock },
              { title: "Active Hours", val: "6.5h", icon: Target },
            ].map((item, i) => (
              <Card key={i} className="w-full shadow-sm border-slate-100 hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-slate-400"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">{item.val}</div>
                </CardContent>
              </Card>
            ))}
          </div>
         <div className="flex flex-wrap justify-center gap-4 w-full ">
            {[
              { title: "Connect Rate", val: "73%", icon: Wifi },
              { title: "Avg Attempts / Convert", val: "3.0", icon: Repeat },
              { title: "Overdue Follow-ups", val: 1, icon: AlertTriangle },
            ].map((item, i) => {
              // @ts-ignore
              const isUrgent = item.title === "Overdue Follow-ups" && item.val > 0;

              return (
                <Card key={i} className={`w-full sm:w-[240px] shadow-sm border-slate-100 hover:shadow-md transition-shadow ${isUrgent ? 'bg-red-50' : 'background-color: hsl(var(--card))'}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className={`text-sm font-medium ${isUrgent ? 'text-rose-600' : 'text-[hsl(var(--tertiary))]'}`}>{item.title}</CardTitle>
                    <item.icon className={`h-4 w-4 ${isUrgent ? 'text-rose-600' : 'text-slate-400'}`} />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: isUrgent ? '#e11d48' : '#1e293b' }}
                    >
                      {item.val}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            <Card className="md:col-span-2 lg:col-span-2 shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Call Trends</CardTitle>
                <CardDescription>Daily call durations tracking.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dummyLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="duration" name="Duration (sec)" stroke={chartPalette.dial} strokeWidth={2.5} dot={{ r: 3, fill: chartPalette.dial }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1 shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Call Outcomes</CardTitle>
                <CardDescription>Distribution of connection statuses.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px] w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={calls}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {calls.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend
                        content={(props: any) => {
                          const { payload } = props;
                          return (
                            <div className="grid grid-cols-2 gap-y-2 gap-x-6 mx-auto w-fit mt-4">
                              {payload?.map((entry: any, index: number) => (
                                <div key={`item-${index}`} className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs font-medium text-slate-600">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            <Card className="shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Agent vs. Team Average</CardTitle>
                <CardDescription>How this agent stacks up across key metrics.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={benchmarkData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      <Radar name={agentInfo.name} dataKey="agent" stroke={chartPalette.dial} fill={chartPalette.dial} fillOpacity={0.35} />
                      <Radar name="Team Avg" dataKey="team" stroke={chartPalette.convert} fill={chartPalette.convert} fillOpacity={0.2} />
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-sm border-slate-100">
                <CardHeader>
                  <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Best Calling Windows</CardTitle>
                  <CardDescription>Call volume by day and hour - darker means busier.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="min-w-[520px]">
                      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${heatmapHours.length}, minmax(0, 1fr))` }}>
                        <div />
                        {heatmapHours.map(h => (
                          <div key={h} className="text-[10px] text-slate-400 text-center pb-1 font-semibold">{h}</div>
                        ))}
                        {heatmapData.map((row, dayIdx) => (
                          <div key={heatmapDays[dayIdx]} className="contents">
                            <div className="text-xs text-slate-500 font-bold flex items-center">{heatmapDays[dayIdx]}</div>
                            {row.map((val, hourIdx) => {
                              const intensity = val / heatmapMax;

                              return (
                                <div
                                  key={hourIdx}
                                  title={`${heatmapDays[dayIdx]} ${heatmapHours[hourIdx]}: ${val} calls`}
                                  className="aspect-square rounded-sm flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer"
                                  style={{ backgroundColor: hexToRgba(chartPalette.dial, 0.08 + 0.85 * intensity) }}
                                >
                                  <span
                                    className={`text-[10px] sm:text-xs font-bold ${
                                      intensity > 0.45 ? "text-white" : "text-slate-600"
                                    }`}
                                  >
                                    {val}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </div>

          <Card className="shadow-sm border-slate-100">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Conversion Funnel</CardTitle>
              <CardDescription>Where owners drop off between a dial and a close.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0 pt-2">
                {funnelData.map((stage, i) => {
                  const widthPct = 100 - i * 12
                  const prevValue = i > 0 ? funnelData[i - 1].value : stage.value
                  const dropOffPct = i > 0 ? Math.round((1 - stage.value / prevValue) * 100) : 0
                  return (
                    <div key={stage.stage} className="flex-1 flex flex-col items-center relative">
                      <div
                        className="rounded-md flex items-center justify-center text-white font-semibold text-sm py-3 transition-all"
                        style={{ backgroundColor: stage.color, width: `${widthPct}%`, minWidth: "80px" }}
                      >
                        {stage.value}
                      </div>
                      <p className="text-xs font-semibold mt-2 text-slate-700">{stage.stage}</p>
                      {i > 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">-{dropOffPct}% drop-off</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <Card className="md:col-span-2 shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Calls by Project</CardTitle>
                <CardDescription>Active campaigns and their daily volume.</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="calls" fill={chartPalette.emerald} radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-100 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Pending Follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 overflow-y-auto max-h-[280px]">
                {followUps.map(f => {
                  const isOverdue = new Date(f.nextDial) < new Date("2026-07-06")
                  return (
                    <div
                      key={f.id}
                      className="flex justify-between items-center p-3 border rounded-lg gap-2 transition-colors hover:bg-slate-50"
                      style={isOverdue
                        ? { backgroundColor: hexToRgba(chartPalette.miss, 0.06), borderColor: hexToRgba(chartPalette.miss, 0.25) }
                        : { borderColor: "#e2e8f0" }}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-700 truncate">{f.owner}</p>
                        <p className="text-xs text-slate-500 font-mono">{f.number}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{f.attempts} attempt{f.attempts !== 1 ? "s" : ""} so far</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 border-none text-white text-xs py-0.5"
                        style={{ backgroundColor: isOverdue ? chartPalette.miss : chartPalette.neutral }}
                      >
                        {isOverdue ? "Overdue" : f.nextDial}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-100">
            <CardHeader className="flex flex-col gap-5 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Call Detail Records</CardTitle>
                  <CardDescription>Search logs by owner name or phone number.</CardDescription>
                </div>
                <div className="w-full md:w-auto flex justify-end">
                  <Input
                    placeholder="Search owner number..."
                    className="w-full md:w-[250px] h-9"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full border-t pt-4 border-slate-100">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-9 w-full sm:w-auto justify-start sm:justify-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.includes("-") ? "Custom" : dateRange}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-background border-border shadow-md">
                      <DropdownMenuItem onClick={() => handlePresetDateChange("Today")}>Today</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePresetDateChange("Past Week")}>Past Week</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePresetDateChange("Past Month")}>Past Month</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePresetDateChange("Past Year")}>Past Year</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="relative flex items-center w-full sm:w-auto">
                    <input
                      type="date"
                      onChange={handleDateChange}
                      className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-slate-100 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      title="Select a specific date"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                  <Button onClick={exportToCSV} variant="default" className="h-9 w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="block w-full overflow-x-auto">
                <Table className="min-w-[800px] w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 sm:pl-6">Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="pr-4 sm:pr-6">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.length > 0 ? currentLogs.map(log => (
                      <TableRow key={log.id} className="hover:bg-slate-50/55">
                        <TableCell className="pl-4 sm:pl-6 font-medium whitespace-nowrap">{log.date}</TableCell>
                        <TableCell className="whitespace-nowrap text-slate-500">{log.time}</TableCell>
                        <TableCell className="whitespace-nowrap font-semibold text-slate-700">{log.project}</TableCell>
                        <TableCell>
                          <Badge
                            className="border-none text-white text-xs font-semibold py-0.5"
                            style={{ backgroundColor: log.status === 'Answered' ? chartPalette.connect : log.status === "Voicemail" ? chartPalette.neutral : log.status === "Converted" ? chartPalette.convert : chartPalette.miss }}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">{log.duration}s</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{log.owner}</span>
                          <br/>
                          <span className="text-xs text-muted-foreground">{log.ownerNumber}</span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate pr-4 sm:pr-6 text-slate-600">{log.notes}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No calls found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border p-4 sm:p-6">
              <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
                Showing <strong>{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to <strong>{Math.min(endIndex, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> calls
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="text-sm font-medium px-2 whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* This is where the invisible render target lives.
      */}
      <div
        style={{ position: "fixed", left: "-9999px", top: "0px" }}
        aria-hidden="true"
      >
        <div ref={reportRef}>
          <AgentReport data={{
              agentInfo,
              kpis: {
                  totalCalls: filteredLogs.length,
                  answered: filteredLogs.filter(l => l.status === "Answered").length,
                  voicemail: filteredLogs.filter(l => l.status === "Voicemail").length,
                  converted: filteredLogs.filter(l => l.status === "Converted").length,
                  avgDuration: "105s",
                  connectRate,
                  avgAttemptsToConvert,
                  overdueCount,
                  currentStreak,
              },
              logs: filteredLogs,
              statusData: calls,
              projectData,
              benchmarkData,
              funnelData,
              heatmapHours,
              heatmapDays,
              heatmapData,
              heatmapMax
          }} />
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  )
}