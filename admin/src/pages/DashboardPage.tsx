import {Users, Phone, Clock, ListTodo, ChevronRight, ChevronLeft} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import AppNavbar from "@/components/AppNavbar.tsx";
import {useEffect, useState} from "react";
import { Button } from "@/components/ui/button"
import {apiFetch} from "@/lib/api.tsx";
import {toast} from "sonner";


const chartPalette = {
  dial: "#0077BE",
  connect: "#0D9488",
  interest: "#F59E0B",
  convert: "#4F46E5",
  miss: "#FB7185",
  neutral: "#94A3B8",
  emerald: "#10B981"
}

const statusPalette = {
  dial: "#7B00BEFF",
  closed: "#0077BE",
  answered: "#0D9488",
  busy: "#F59E0B",
  not_interested: "#000000",
  failed: "#FB7185",
  no_answer: "#94A3B8",
  callback: "#10B981"
}



export default function DashboardPage() {

  // Call Volume State
  const [callVolumeData, setCallVolumeData] = useState<{ time: string; calls: number }[]>([])

  // KPI & Analytics States
  const [activeAgentsCount, setActiveAgentsCount] = useState<number>(0)
  const [totalAgentsCount, setTotalAgentsCount] = useState<number>(0)
  const [avgTalkTime, setAvgTalkTime] = useState<string>("00:00")
  const [pendingFollowUps, setPendingFollowUps] = useState<number>(0)
  const [callStatusData, setCallStatusData] = useState<{ name: string; value: number; color: string }[]>([])
  const [projectData, setProjectData] = useState<{ name: string; calls: number }[]>([])
  const [leadsReport, setLeadsReport] = useState({
    untouched: { count: 0, pct: 0 },
    dialed: { count: 0, pct: 0 },
    maxAttempts: { count: 0, pct: 0 },
  })

  // Recent Calls
  const [recentCalls, setRecentCalls] = useState<any[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const currentCalls = recentCalls

  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Helper Functions
  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-"
    try {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return timeStr
    }
  }

  const formatDuration = (d: any) => {
    if (typeof d === "number") {
      const min = Math.floor(d / 60)
      const sec = d % 60
      return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    }
    return d || "-"
  }

  const getStatusColor = (status: string) => {
    if (!status) return chartPalette.neutral;
    const formatted = status.toLowerCase().replace(" ", "_") as keyof typeof statusPalette;

    if (statusPalette[formatted]) return statusPalette[formatted];

    let hash = 0;
    for (let i = 0; i < formatted.length; i++) {
      hash = formatted.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `#${(hash & 0x00FFFFFF).toString(16).padStart(6, '0')}`;
  }

  useEffect(() => {
    loadCallRecords()
    loadCallVolume()
    loadAgentsStats()
    loadCallStatuses()
    loadAvgTalkTimeAndProjects()
    loadLeadsReport()
  }, [currentPage]);

  const loadAgentsStats = async () => {
    try {
      const res = await apiFetch("users?role=agent", { method: "GET" })
      if (res.ok) {
        const users = await res.json()
        if (Array.isArray(users)) {
          setTotalAgentsCount(users.length)
          setActiveAgentsCount(users.filter((u: any) => u.is_online).length)
        }
      }
    } catch (err) {
      console.error("Failed to load agent stats", err)
    }
  }

  const loadCallStatuses = async () => {
    try {
      const now = new Date()
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      const res = await apiFetch(`calls/statuses?from=${today.toISOString()}&to=${now.toISOString()}`, { method: "GET" })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json) && json.length > 0) {
          const mapped = json.map((item: { status: string; count: number }) => {
            const name = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1).replace(/_/g, " ") : "Unknown"
            return {
              name,
              value: item.count,
              color: getStatusColor(item.status),
            }
          })
          setCallStatusData(mapped)

          const pending = json
            .filter((i: any) => ["callback", "busy", "no_answer", "not_answered"].includes((i.status || "").toLowerCase()))
            .reduce((sum: number, curr: any) => sum + (curr.count || 0), 0)
          setPendingFollowUps(pending)
        } else {
          setCallStatusData([])
          setPendingFollowUps(0)
        }
      }
    } catch (err) {
      console.error("Failed to load call statuses", err)
    }
  }

  const loadAvgTalkTimeAndProjects = async () => {
    try {
      const now = new Date()
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)

      const [callsRes, projRes] = await Promise.all([
        apiFetch(`calls?from=${today.toISOString()}&to=${now.toISOString()}&limit=100`, { method: "GET" }),
        apiFetch("projects", { method: "GET" }),
      ])

      let callsList: any[] = []
      if (callsRes.ok) {
        const callsJson = await callsRes.json()
        callsList = callsJson.data || []
      }

      // Avg talk time calculation
      const durations = callsList.map(c => Number(c.duration)).filter(d => !isNaN(d) && d > 0)
      if (durations.length > 0) {
        const avgSec = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        const min = Math.floor(avgSec / 60)
        const sec = avgSec % 60
        setAvgTalkTime(`${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`)
      } else {
        setAvgTalkTime("00:00")
      }

      // Calls by Project calculation
      let projectsList: any[] = []
      if (projRes.ok) {
        projectsList = await projRes.json()
      }

      const projMap = new Map<string, number>()
      if (Array.isArray(projectsList)) {
        projectsList.forEach((p: any) => projMap.set(p.name, 0))
      }

      callsList.forEach((c: any) => {
        if (Array.isArray(c.projects)) {
          c.projects.forEach((p: any) => {
            projMap.set(p.name, (projMap.get(p.name) || 0) + 1)
          })
        }
      })

      const chartData = Array.from(projMap.entries()).map(([name, calls]) => ({ name, calls }))
      setProjectData(chartData)
    } catch (err) {
      console.error("Failed to load calls/projects data", err)
    }
  }

  const loadLeadsReport = async () => {
    try {
      const res = await apiFetch("owners?limit=100", { method: "GET" })
      if (res.ok) {
        const json = await res.json()
        const owners = json.data || []
        const total = json.meta?.total || owners.length || 1

        let untouched = 0
        let dialed = 0
        let maxAttempts = 0

        owners.forEach((o: any) => {
          const attempts = o.attempt_count || 0
          if (o.status === "inactive" || attempts >= 3) {
            maxAttempts++
          } else if (attempts > 0) {
            dialed++
          } else {
            untouched++
          }
        })

        setLeadsReport({
          untouched: { count: untouched, pct: Math.round((untouched / total) * 100) },
          dialed: { count: dialed, pct: Math.round((dialed / total) * 100) },
          maxAttempts: { count: maxAttempts, pct: Math.round((maxAttempts / total) * 100) },
        })
      }
    } catch (err) {
      console.error("Failed to load leads report", err)
    }
  }

  const loadCallVolume = async () => {
    try {
      const now = new Date()
      const currentHour = now.getHours()
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)

      const requests = []
      for (let h = 0; h <= currentHour; h++) {
        const from = new Date(today)
        from.setHours(h, 0, 0, 0)
        const to = new Date(today)
        if (h < currentHour) {
          to.setHours(h + 1, 0, 0, 0)
        } else {
          to.setTime(now.getTime())
        }
        requests.push({ hour: h, from, to })
      }

      const results = await Promise.all(
        requests.map(async ({ hour, from, to }) => {
          const res = await apiFetch(
            `calls?from=${from.toISOString()}&to=${to.toISOString()}&limit=1&page=1`,
            { method: "GET" }
          )
          let count = 0
          if (res.ok) {
            const json = await res.json()
            count = json.meta?.total ?? (Array.isArray(json.data) ? json.data.length : 0)
          }
          return { time: `${String(hour).padStart(2, "0")}:00`, calls: count }
        })
      )

      setCallVolumeData(results)
    } catch (err) {
      console.error("Failed to load call volume data", err)
      setCallVolumeData([])
    }
  }

  const loadCallRecords = async () => {
    const now = new Date();
    let fromDate = new Date(now);
    fromDate.setHours(0,0,0,0);
    let toDate = new Date(now);

    try {
      const response = await apiFetch(`calls?from=${fromDate.toISOString()}&to=${toDate.toISOString()}&limit=10&page=${currentPage}`, {
        method: "GET",
      })

      if (!response.ok) {
        setRecentCalls([])
        setTotalPages(1)
        setTotalRecords(0)
        return
      }

      const jsonResponse = await response.json();

      if (jsonResponse && Array.isArray(jsonResponse.data)) {
         setRecentCalls(jsonResponse.data)
         const total = jsonResponse.meta?.total || 0;
         setTotalRecords(total)
         setTotalPages(Math.ceil(total / 10) || 1)
      } else {
         setRecentCalls([])
      }
    } catch(error: any) {
      toast.error("Failed to load call records")
      setRecentCalls([])
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">

      <AppNavbar />

      {/* --- SECTION 1: HIGH-LEVEL KPIs --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalAgentsCount > 0 ? `${activeAgentsCount} of ${totalAgentsCount} logged in` : "No agents registered"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Total Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              Calls logged today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Avg Talk Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTalkTime}</div>
            <p className="text-xs text-muted-foreground">
              Across all answered calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Pending Follow-ups</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- SECTION 2: DATA VISUALIZATIONS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Line Chart: Call Volume */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--tertiary))]">Call Volume Over Time</CardTitle>
            <CardDescription>Hourly breakdown of calls made today.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={callVolumeData}>
                  <XAxis
                    dataKey="time"
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
                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calls"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart: Call Status */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--tertiary))]">Call Outcomes</CardTitle>
            <CardDescription>Distribution of connection statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              {callStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={callStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {callStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-muted-foreground">No call outcomes logged today.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart: Projects */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--tertiary))]">Calls by Project</CardTitle>
            <CardDescription>Active campaigns and their daily volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {projectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectData}>
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
                      cursor={{ fill: "hsl(40 20% 97%)" }}
                      contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                    />
                    <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No call data by project today.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Visualization: Leads Statuses */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--tertiary))]">Leads Report</CardTitle>
            <CardDescription>Lead exhaustion across all active lists.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 justify-center h-[300px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Untouched Leads</span>
                <span className="text-muted-foreground">{leadsReport.untouched.count} ({leadsReport.untouched.pct}%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground" style={{ width: `${leadsReport.untouched.pct}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Dialed Once</span>
                <span className="text-muted-foreground">{leadsReport.dialed.count} ({leadsReport.dialed.pct}%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary/60" style={{ width: `${leadsReport.dialed.pct}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Max Attempts Reached</span>
                <span className="text-muted-foreground">{leadsReport.maxAttempts.count} ({leadsReport.maxAttempts.pct}%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-destructive" style={{ width: `${leadsReport.maxAttempts.pct}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- SECTION 3: DATA TABLE --- */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--tertiary))]">Recent Call Records</CardTitle>
          <CardDescription>
            Live feed of the latest calls made today.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="block w-full overflow-x-auto">
            <Table className="min-w-[800px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Time</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right pr-4 sm:pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCalls.length > 0 ? (
                  currentCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium whitespace-nowrap pl-4 sm:pl-6">{formatTime(call.time)}</TableCell>
                      <TableCell className="whitespace-nowrap">{call.agent || (call.agent_id ? `Agent #${call.agent_id}` : "-")}</TableCell>
                      <TableCell className="whitespace-nowrap">{call.number || (call.owner_id ? `Owner #${call.owner_id}` : "-")}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDuration(call.duration)}</TableCell>
                      <TableCell className="text-right pr-4 sm:pr-6">
                        <Badge
                          style={{backgroundColor: getStatusColor(call.status)}}
                          className={call.status === "Closed" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                        >
                          {call.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No recent calls found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Paging Footer */}
        <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border p-4 sm:p-6">
          <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
            Showing <strong>{totalRecords === 0 ? 0 : ((currentPage - 1) * 10) + 1}</strong> to <strong>{Math.min(currentPage * 10, totalRecords)}</strong> of <strong>{totalRecords}</strong> calls
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

    </div>
  )
}