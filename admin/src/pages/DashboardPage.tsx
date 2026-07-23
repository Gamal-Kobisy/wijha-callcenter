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

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// --- DUMMY DATA ---
const callVolumeData = [
  { time: "09:00", calls: 45 },
  { time: "10:00", calls: 82 },
  { time: "11:00", calls: 120 },
  { time: "12:00", calls: 90 },
  { time: "13:00", calls: 115 },
  { time: "14:00", calls: 140 },
  { time: "15:00", calls: 95 },
]

const callStatusData = [
  { name: "Answered", value: 450, color: "hsl(var(--primary))" },
  { name: "Voicemail", value: 300, color: "hsl(var(--muted-foreground))" },
  { name: "No Answer", value: 200, color: "hsl(var(--destructive))" },
  { name: "Closed", value: 85, color: "#10b981" },
]

const projectData = [
  { name: "Real Estate Q3", calls: 320 },
  { name: "Tech Renewals", calls: 250 },
  { name: "Lead Gen Alpha", calls: 180 },
  { name: "Follow-ups", calls: 90 },
]

export default function DashboardPage() {

  // Recent Calls
  const [recentCalls, setRecentCalls] = useState<any[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentCalls = recentCalls.slice(startIndex, endIndex)

  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)

  // Helper Function
  const getStatusColor = (status: string) => {
    if (!status) return chartPalette.neutral;
    const formatted = status.toLowerCase().replace(" ", "_") as keyof typeof statusPalette;

    // If it's a known color, use it!
    if (statusPalette[formatted]) return statusPalette[formatted];

    // If it's unknown, generate a consistent pseudo-random color based on the string text
    // This ensures that "weird_status" always gets the exact same color and never flashes
    let hash = 0;
    for (let i = 0; i < formatted.length; i++) {
      hash = formatted.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `#${(hash & 0x00FFFFFF).toString(16).padStart(6, '0')}`;
  }

  useEffect(() => {
    loadCallRecords()
  }, [currentPage]);

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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 logged in since last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Total Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,035</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Avg Talk Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">03:15</div>
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
            <div className="text-2xl font-bold">142</div>
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
                <span className="text-muted-foreground">3,240 (45%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-muted-foreground w-[45%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Dialed Once</span>
                <span className="text-muted-foreground">2,500 (35%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 w-[35%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Max Attempts Reached</span>
                <span className="text-muted-foreground">1,440 (20%)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-destructive w-[20%]" />
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
                      <TableCell className="font-medium whitespace-nowrap pl-4 sm:pl-6">{call.time}</TableCell>
                      <TableCell className="whitespace-nowrap">{call.agent}</TableCell>
                      <TableCell className="whitespace-nowrap">{call.number}</TableCell>
                      <TableCell className="whitespace-nowrap">{call.duration}</TableCell>
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