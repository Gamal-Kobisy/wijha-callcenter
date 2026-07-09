import { Users, Phone, Clock, ListTodo } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
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
  { name: "Converted", value: 85, color: "#10b981" },
]

const projectData = [
  { name: "Real Estate Q3", calls: 320 },
  { name: "Tech Renewals", calls: 250 },
  { name: "Lead Gen Alpha", calls: 180 },
  { name: "Follow-ups", calls: 90 },
]

const recentCalls = [
  { id: "1029", agent: "Ahmed Tarek", number: "+20 100 123 4567", status: "Converted", duration: "04:12", time: "15:42" },
  { id: "1030", agent: "Sarah Kamel", number: "+20 111 987 6543", status: "Voicemail", duration: "00:45", time: "15:40" },
  { id: "1031", agent: "Omar Hassan", number: "+20 122 345 6789", status: "Answered", duration: "02:30", time: "15:38" },
  { id: "1032", agent: "Nour Ali", number: "+20 100 555 1234", status: "No Answer", duration: "00:00", time: "15:35" },
  { id: "1033", agent: "Ahmed Tarek", number: "+20 155 777 8899", status: "Answered", duration: "06:15", time: "15:30" },
]

export default function DashboardPage() {
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
            <Phone className="h-4 w-4 text-muted-foreground" />
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
            <Clock className="h-4 w-4 text-muted-foreground" />
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
            <ListTodo className="h-4 w-4 text-muted-foreground" />
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

        {/* Additional Visualization: Database Health / Penetration */}
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
      <Card>
        <CardHeader>
          <CardTitle className="text-[hsl(var(--tertiary))]">Recent Call Records</CardTitle>
          <CardDescription>
            Live feed of the latest calls made today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium">{call.time}</TableCell>
                  <TableCell>{call.agent}</TableCell>
                  <TableCell>{call.number}</TableCell>
                  <TableCell>{call.duration}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        call.status === "Converted" ? "default" :
                        call.status === "Answered" ? "secondary" :
                        call.status === "No Answer" ? "destructive" : "outline"
                      }
                      className={call.status === "Converted" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                    >
                      {call.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}