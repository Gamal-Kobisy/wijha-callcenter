import { useState, useMemo } from "react"
import AppNavbar from "@/components/AppNavbar.tsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  PhoneCall,
  Target,
  AlertCircle,
  Search,
  UploadCloud,
  FileSpreadsheet,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  ArrowRight,
  CheckCircle2,
  Edit,
  Trash2,
  Plus
} from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LabelList } from "recharts"
import { toast, Toaster } from "sonner"

// --- SHARED CHART PALETTE ---
const chartPalette = {
  dial: "#0077BE",
  connect: "#0D9488",
  interest: "#F59E0B",
  convert: "#4F46E5",
  miss: "#FB7185",
  neutral: "#94A3B8",
  emerald: "#10B981"
}

// --- DUMMY DATA ---
const dummyAgents = [
  { id: 1, name: "Ahmed Tarek" },
  { id: 2, name: "Sarah Kamel" },
  { id: 3, name: "Omar Hassan" }
]

const initialClients = [
  {
    id: "1001",
    name: "Karim Fathy",
    primaryNumber: "+20 111 222 3333",
    status: "Interested",
    attemptCount: 3,
    lastDialedAt: "2026-07-06 14:30",
    nextDialAt: "2026-07-09 10:00",
    assignedAgent: "Ahmed Tarek",
    projects: ["Real Estate Q3"],
    info: [
      { key: "Company", value: "TechVision" },
      { key: "Location", value: "Cairo, Egypt" },
      { key: "Budget", value: "$10,000" }
    ],
    history: [
      { id: 1, time: "2026-07-06 14:30", status: "Interested", duration: 180, agent: "Ahmed Tarek", notes: "Asked for a callback with pricing details." },
      { id: 2, time: "2026-07-04 11:00", status: "Voicemail", duration: 25, agent: "Ahmed Tarek", notes: "Left standard voicemail." }
    ]
  },
  {
    id: "1002",
    name: "Mostafa Ahmed",
    primaryNumber: "+20 100 111 2222",
    status: "New",
    attemptCount: 0,
    lastDialedAt: null,
    nextDialAt: null,
    assignedAgent: "Sarah Kamel",
    projects: ["Software Renewals"],
    info: [{ key: "Company", value: "Global Logistics" }, { key: "Renewal Date", value: "2026-08-01" }],
    history: []
  },
  {
    id: "1003",
    name: "Nour El-Din",
    primaryNumber: "+20 122 444 5555",
    status: "Closed",
    attemptCount: 5,
    lastDialedAt: "2026-07-05 16:00",
    nextDialAt: null,
    assignedAgent: "Omar Hassan",
    projects: ["Cold Outreach B2B"],
    info: [{ key: "Industry", value: "Manufacturing" }],
    history: [{ id: 3, time: "2026-07-05 16:00", status: "Closed", duration: 420, agent: "Omar Hassan", notes: "Closed the deal." }]
  },
  {
    id: "1004",
    name: "Laila Mahmoud",
    primaryNumber: "+20 155 999 8888",
    status: "Do Not Call",
    attemptCount: 1,
    lastDialedAt: "2026-07-02 09:15",
    nextDialAt: null,
    assignedAgent: "Ahmed Tarek",
    projects: ["Real Estate Q3"],
    info: [],
    history: [{ id: 4, time: "2026-07-02 09:15", status: "Do Not Call", duration: 45, agent: "Ahmed Tarek", notes: "Requested to be removed from list." }]
  },
  {
    id: "1005",
    name: "Youssef Ibrahim",
    primaryNumber: "+20 109 777 6666",
    status: "Voicemail",
    attemptCount: 2,
    lastDialedAt: "2026-07-07 10:00",
    nextDialAt: "2026-07-08 10:00",
    assignedAgent: "Sarah Kamel",
    projects: ["Software Renewals"],
    info: [{ key: "Company", value: "Startup Inc" }],
    history: [{ id: 5, time: "2026-07-07 10:00", status: "Voicemail", duration: 30, agent: "Sarah Kamel", notes: "No answer." }]
  }
]

const projectVolume = [
  { name: 'Real Estate Q3', clients: 420 },
  { name: 'Software Renewals', clients: 380 },
  { name: 'Cold Outreach B2B', clients: 290 },
]

const systemFields = ["Primary Phone", "Client Name", "Status", "Project", "Attempts", "Assigned Agent", "Next Dial"]

// --- UTILS ---
const getStatusColor = (status: string) => {
  switch (status) {
    case 'New': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Interested': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Closed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Do Not Call': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'Voicemail': return 'bg-slate-100 text-slate-800 border-slate-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Helper to convert Excel letters (A, B, AA) to zero-based index (0, 1, 26)
const letterToIndex = (letters: string) => {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients)

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 10

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)

  // View/Edit/Delete State
  const [selectedClient, setSelectedClient] = useState<typeof initialClients[0] | null>(null)
  const [editingClient, setEditingClient] = useState<typeof initialClients[0] | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  // CSV Mapping State
  const [uploadStep, setUploadStep] = useState<1 | 2>(1)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadAgent, setUploadAgent] = useState("")
  const [startRow, setStartRow] = useState<number>(2)
  const [endRow, setEndRow] = useState<string>("")
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})

  // --- DYNAMIC CHART DATA ---
  const statusDistribution = useMemo(() => {
    const counts = { 'New': 0, 'Interested': 0, 'Voicemail': 0, 'Closed': 0, 'Do Not Call': 0, 'Other': 0 };
    clients.forEach(l => {
      // @ts-ignore
      if (counts[l.status] !== undefined) counts[l.status]++;
      else counts['Other']++;
    });
    return [
      { name: 'New', value: counts['New'] || 0, color: chartPalette.dial },
      { name: 'Interested', value: counts['Interested'] || 0, color: chartPalette.interest },
      { name: 'Voicemail', value: counts['Voicemail'] || 0, color: chartPalette.neutral },
      { name: 'Closed', value: counts['Closed'] || 0, color: chartPalette.convert },
      { name: 'Do Not Call', value: counts['Do Not Call'] || 0, color: chartPalette.miss },
    ].filter(item => item.value > 0);
  }, [clients])

  // --- FILTERING ---
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.primaryNumber.includes(searchTerm)
      const matchesStatus = statusFilter === "All" || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, clients])

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE) || 1
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // --- CRUD HANDLERS ---
  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return
    const phones = (editingClient as any).phoneNumbers || [editingClient.primaryNumber]
    const cleanPhones = phones.filter((p: string) => p.trim() !== "")
    const updatedClient = {
      ...editingClient,
      primaryNumber: cleanPhones[0] || editingClient.primaryNumber || "",
      phoneNumbers: cleanPhones.length > 0 ? cleanPhones : [editingClient.primaryNumber || ""]
    }
    setClients(clients.map(l => l.id === editingClient.id ? updatedClient : l))
    setEditingClient(null)
    toast.success("Client Updated", { description: "The client details have been saved." })
  }

  const handleDeleteClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletingClientId) return
    setClients(clients.filter(l => l.id !== deletingClientId))
    setDeletingClientId(null)
    toast.success("Client Deleted", { description: "The client has been permanently removed." })
  }

  // --- CSV EXPORT FIX ---
  const exportToCSV = () => {
    const headers = ["ID", "Client Name", "Primary Phone", "Status", "Assigned Agent", "Projects", "Attempts", "Next Dial"]
    const csvContent = [
      headers.join(","),
      ...filteredClients.map(l => [
        l.id,
        `"${l.name}"`,
        `"\t${l.primaryNumber}"`,
        `"${l.status}"`,
        `"${l.assignedAgent || 'Unassigned'}"`,
        `"${l.projects.join(';')}"`,
        l.attemptCount,
        `"\t${l.nextDialAt || ''}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`)
    a.click()

    toast.success("Export Complete", { description: "Your CSV file has been downloaded." })
  }

  // --- UPLOAD / ASSIGN HANDLERS ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && !file.name.endsWith('.csv')) {
      toast.error("Format Not Supported", { description: "Please upload a .csv file. Excel files require a backend to process."})
      e.target.value = ""
      return
    }
    setUploadFile(file)
  }

  const resetModals = () => {
    setIsUploadOpen(false)
    setIsAssignOpen(false)
    setUploadStep(1)
    setUploadFile(null)
    setUploadAgent("")
    setColumnMapping({})
    setStartRow(2)
    setEndRow("")
  }

  // --- REAL CSV PARSING ENGINE ---
  const handleFinalSubmit = (e: React.FormEvent, mode: "upload" | "assign") => {
    e.preventDefault()
    if (mode === "assign" && !uploadAgent) {
      return toast.error("Missing Agent", { description: "Please assign an agent to these clients." })
    }
    if (!uploadFile) return;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          // Split by newline and filter out entirely empty lines
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

          const startIndex = Math.max(0, startRow - 1);
          const endIndex = endRow ? Math.min(lines.length, parseInt(endRow)) : lines.length;

          const parsedClients: typeof initialClients = [];
          const autoAssignedAgentName = dummyAgents.find(a => a.id.toString() === uploadAgent)?.name || "Unassigned";

          for (let i = startIndex; i < endIndex; i++) {
            // Regex to split CSV by commas that are outside of quotes
            const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());

            // Helper to get value based on user's letter mapping
            const getVal = (fieldName: string) => {
              const letter = columnMapping[fieldName];
              if (!letter) return "";
              const idx = letterToIndex(letter);
              return row[idx] || "";
            }

            // Must have a primary phone to be valid
            let rawPhone = getVal("Primary Phone");
            if (!rawPhone) continue;

            // Clean up the \t export trick if they re-uploaded an exported file
            rawPhone = rawPhone.replace(/\t/g, '');

            parsedClients.push({
              id: Math.floor(100000 + Math.random() * 900000).toString(),
              name: getVal("Client Name") || "Unknown Client",
              primaryNumber: rawPhone,
              status: getVal("Status") || "New",
              projects: getVal("Project") ? getVal("Project").split(';').map(p=>p.trim()) : ["Default Project"],
              attemptCount: parseInt(getVal("Attempts")) || 0,
              assignedAgent: mode === "assign" ? autoAssignedAgentName : (getVal("Assigned Agent") || "Unassigned"),
              nextDialAt: getVal("Next Dial")?.replace(/\t/g, '') || null,
              info: [],
              history: []
            });
          }

          setClients(prev => [...parsedClients, ...prev]);
          resolve(parsedClients.length);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject("Failed to read file.");
      reader.readAsText(uploadFile);
    });

    toast.promise(promise, {
      loading: 'Parsing file and injecting clients...',
      success: (count) => {
        resetModals()
        return `Successfully imported ${count} valid clients into the system.`
      },
      error: 'Failed to process clients file. Ensure it is a valid CSV.'
    })
  }

  const renderMappingUI = (mode: "upload" | "assign") => {
    const activeFields = mode === "assign" ? systemFields.filter(f => f !== "Assigned Agent") : systemFields;

    return (
      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label>Start Row</Label>
            <Input type="number" min={1} value={startRow} onChange={(e) => setStartRow(Number(e.target.value))} className="h-10" />
          </div>
          <div className="space-y-2 flex-1">
            <Label>End Row</Label>
            <Input type="number" min={1} placeholder="Optional (EOF)" value={endRow} onChange={(e) => setEndRow(e.target.value)} className="h-10" />
          </div>
        </div>

        <div className="space-y-4 border-t pt-6 border-slate-100">
          <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Map CSV Columns</Label>
          <p className="text-xs text-muted-foreground mb-4">Enter the exact column letter (A, B, C...) from your file that matches our system fields.</p>

          {activeFields.map(field => (
            <div key={field} className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700 w-1/2">
                {field} {field === "Primary Phone" && <span className="text-red-500">*</span>}
              </span>

              <Input
                type="text"
                placeholder="e.g. A"
                maxLength={3}
                className="flex h-10 w-1/2 uppercase text-center font-mono font-bold text-lg focus-visible:ring-emerald-500"
                value={columnMapping[field] || ""}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                  setColumnMapping(prev => ({...prev, [field]: val}));
                }}
              />
            </div>
          ))}

          {mode === "assign" && (
            <div className="flex items-center justify-between gap-4 opacity-60 pt-2">
              <span className="text-sm font-medium text-slate-700 w-1/2">Assigned Agent</span>
              <Input type="text" disabled value="Auto-assigned" className="flex h-10 w-1/2 text-center font-mono text-slate-500 bg-slate-50" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppNavbar />

        <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Clients Management</h1>
              <p className="text-muted-foreground mt-1">Track, analyze, and manage your customer pipeline.</p>
            </div>
          </div>

          {/* --- KPIs --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <Card className="shadow-sm border-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{clients.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Dynamic from table</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Fresh Clients</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {clients.filter(l => l.attemptCount === 0).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Zero dial attempts</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Closed</CardTitle>
                <PhoneCall className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {clients.filter(l => l.status === "Closed").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dynamic from table</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-100 bg-red-50/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-rose-600">Overdue Follow-ups</CardTitle>
                <AlertCircle className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-rose-700">
                  {clients.filter(l => l.nextDialAt && new Date(l.nextDialAt) < new Date("2026-07-10")).length}
                </div>
                <p className="text-xs text-rose-600/80 mt-1">Requires immediate action</p>
              </CardContent>
            </Card>
          </div>

          {/* --- REPORTS / INSIGHTS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <Card className="shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Client Status Distribution</CardTitle>
                <CardDescription>Current state of the entire pipeline.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Added h-[320px] as the default mobile height */}
                <div className="w-full flex flex-col items-center justify-center h-[350px] sm:h-[350px] md:h-[400px] lg:h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="40%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                      <Legend
                        content={(props: any) => {
                          const { payload } = props;
                          return (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 mx-auto w-fit mt-8">
                              {payload?.map((entry: any, index: number) => (
                                <div key={`item-${index}`} className="flex items-center w-[130px]">
                                  <span
                                    className="w-[8px] h-[8px] rounded-full shrink-0 mr-1.5 mt-[1px]"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-[12px] font-semibold text-slate-500 whitespace-nowrap mr-1">
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

            <Card className="shadow-sm border-slate-100">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--tertiary))] text-lg">Clients by Project</CardTitle>
                <CardDescription>Volume distribution across active campaigns.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectVolume} margin={{ top: 10, right: 20, left: -10, bottom: 10 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(226, 232, 240, 0.5)" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                      <RechartsTooltip cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
                      <Bar dataKey="clients" fill={chartPalette.emerald} radius={[0, 4, 4, 0]} barSize={28}>
                         <LabelList dataKey="clients" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- CLIENTS TABLE --- */}
          <Card className="shadow-sm border-slate-100 flex flex-col">
            <CardHeader className="flex flex-col gap-5 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                <div>
                  <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Clients Directory</CardTitle>
                  <CardDescription>Manage your clients and view their individual details.</CardDescription>
                </div>
                <div className="w-full md:w-auto flex justify-end">
                  <div className="relative w-full md:w-[250px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or number"
                      className="pl-9 h-9 w-full"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full border-t pt-4 border-slate-100">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
                  <select
                    className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Voicemail">Voicemail</option>
                    <option value="Closed">Closed</option>
                    <option value="Do Not Call">Do Not Call</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                  <Button onClick={exportToCSV} variant="default" className="h-9 w-full sm:w-auto">
                    <Download className="h-4 w-4"/> Export CSV
                  </Button>
                  <Button onClick={() => setIsUploadOpen(true)} className="h-9 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    <UploadCloud className="h-4 w-4" /> Upload Clients
                  </Button>
                  <Button onClick={() => setIsAssignOpen(true)} className="h-9 w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white border-none transition-colors justify-center">
                    <Users className="h-4 w-4" /> Assign Clients
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="block w-full overflow-x-auto">
                <Table className="min-w-[1000px] w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="pl-6">Client Name</TableHead>
                      <TableHead>Primary Phone</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Agent</TableHead>
                      <TableHead className="text-center">Attempts</TableHead>
                      <TableHead>Next Dial</TableHead>
                      <TableHead className="pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.length > 0 ? paginatedClients.map(client => (
                      <TableRow key={client.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="pl-6 font-semibold text-slate-800 whitespace-nowrap">{client.name}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap">{client.primaryNumber}</TableCell>
                        <TableCell className="text-xs text-slate-600 font-medium whitespace-nowrap">{client.projects.join(', ')}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className={`font-semibold border-none ${getStatusColor(client.status)}`}>
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm whitespace-nowrap">{client.assignedAgent || "Unassigned"}</TableCell>
                        <TableCell className="text-center font-semibold text-slate-700">{client.attemptCount}</TableCell>
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">{client.nextDialAt || "—"}</TableCell>
                        <TableCell className="pr-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background">
                              <DropdownMenuItem className="cursor-pointer focus:bg-slate-200" onClick={() => setEditingClient({ ...client, phoneNumbers: (client as any).phoneNumbers || [client.primaryNumber] })}>
                                <Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setDeletingClientId(client.id)}>
                                <Trash2 className="h-4 w-4 mr-2 text-red-500" /> Delete Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                          No clients found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {/* Pagination */}
            <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-slate-100 p-4 sm:p-6">
              <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
                Showing <strong>{filteredClients.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredClients.length)}</strong> of <strong>{filteredClients.length}</strong> clients
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center px-2 text-sm font-medium text-slate-600 whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </div>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* --- EDIT CLIENT DIALOG --- */}
      <Dialog open={editingClient !== null} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-[450px] bg-background">
          <DialogHeader>
            <DialogTitle>Edit Client Details</DialogTitle>
            <DialogDescription>Make changes to the client profile here. Click save when you're done.</DialogDescription>
          </DialogHeader>

          {editingClient && (
            <form onSubmit={handleUpdateClient}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 flex flex-col gap-2">
                  <Label>Client Name</Label>
                  <Input
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                    required
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Phone Numbers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs flex items-center gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => {
                        const currentPhones = (editingClient as any).phoneNumbers || [editingClient.primaryNumber || ""];
                        setEditingClient({
                          ...editingClient,
                          phoneNumbers: [...currentPhones, ""]
                        } as any);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Phone
                    </Button>
                  </div>

                  {((editingClient as any).phoneNumbers || [editingClient.primaryNumber || ""]).map((phone: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={phone}
                        placeholder={idx === 0 ? "Primary Phone (e.g. +20 100 123 4567)" : `Phone Number ${idx + 1}`}
                        onChange={(e) => {
                          const updatedPhones = [...((editingClient as any).phoneNumbers || [editingClient.primaryNumber || ""])];
                          updatedPhones[idx] = e.target.value;
                          setEditingClient({
                            ...editingClient,
                            primaryNumber: updatedPhones[0] || "",
                            phoneNumbers: updatedPhones
                          } as any);
                        }}
                        required={idx === 0}
                      />
                      {((editingClient as any).phoneNumbers || [editingClient.primaryNumber || ""]).length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            const currentPhones = (editingClient as any).phoneNumbers || [editingClient.primaryNumber || ""];
                            const updatedPhones = currentPhones.filter((_: any, i: number) => i !== idx);
                            setEditingClient({
                              ...editingClient,
                              primaryNumber: updatedPhones[0] || "",
                              phoneNumbers: updatedPhones.length > 0 ? updatedPhones : [""]
                            } as any);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                  <Label>Project / Campaign</Label>
                  <Input
                    value={editingClient.projects.join(', ')}
                    onChange={(e) => setEditingClient({...editingClient, projects: e.target.value.split(',').map(p=>p.trim())})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({...editingClient, status: e.target.value})}
                  >
                    <option value="New">New</option>
                    <option value="Interested">Interested</option>
                    <option value="Voicemail">Voicemail</option>
                    <option value="Closed">Closed</option>
                    <option value="Do Not Call">Do Not Call</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Attempts</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingClient.attemptCount}
                    onChange={(e) => setEditingClient({...editingClient, attemptCount: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Next Dial</Label>
                  <Input
                    type="text"
                    placeholder="YYYY-MM-DD HH:mm"
                    value={editingClient.nextDialAt || ""}
                    onChange={(e) => setEditingClient({...editingClient, nextDialAt: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Assigned Agent</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    value={dummyAgents.find(a => a.name === editingClient.assignedAgent)?.id || ""}
                    onChange={(e) => {
                      const agentName = dummyAgents.find(a => a.id.toString() === e.target.value)?.name || "Unassigned";
                      setEditingClient({...editingClient, assignedAgent: agentName});
                    }}
                  >
                    <option value="" disabled>Select an agent...</option>
                    <option value="999">Unassigned</option>
                    {dummyAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- DELETE CLIENT CONFIRMATION DIALOG --- */}
      <Dialog open={deletingClientId !== null} onOpenChange={(open) => !open && setDeletingClientId(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background border-red-100">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this client? This action will remove all associated call history and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeletingClientId(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDeleteClient}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- UPLOAD CLIENTS DIALOG --- */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => !open && resetModals()}>
        <DialogContent className="sm:max-w-[550px] min-h-[500px] max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Upload Clients File</DialogTitle>
            <DialogDescription>
              {uploadStep === 1 ? "Add new clients to the database via CSV file." : "Map the columns in your file to the system's required fields."}
            </DialogDescription>
          </DialogHeader>

          {uploadStep === 1 ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>File Upload</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                  />
                  <FileSpreadsheet className={`h-12 w-12 mb-4 ${uploadFile ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className="text-base font-semibold text-slate-700 text-center">
                    {uploadFile ? uploadFile.name : "Click or drag .csv file to upload"}
                  </span>
                  <span className="text-sm text-slate-500 mt-2">.CSV only (up to 10MB)</span>
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={resetModals}>Cancel</Button>
                <Button type="button" disabled={!uploadFile} onClick={() => setUploadStep(2)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Next: Map Columns <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={(e) => handleFinalSubmit(e, "upload")}>
              {renderMappingUI("upload")}
              <DialogFooter className="pt-8">
                <Button type="button" variant="ghost" onClick={() => setUploadStep(1)}>Back</Button>
                <Button
                  type="submit"
                  disabled={!columnMapping["Primary Phone"]}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4"/> Complete Upload
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- ASSIGN CLIENTS DIALOG --- */}
      <Dialog open={isAssignOpen} onOpenChange={(open) => !open && resetModals()}>
        <DialogContent className="sm:max-w-[550px] min-h-[500px] max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Assign Clients to Agent</DialogTitle>
            <DialogDescription>
              {uploadStep === 1 ? "Upload an assignment file to map specific clients to an agent." : "Map the columns and assign the parsed clients to a specific agent."}
            </DialogDescription>
          </DialogHeader>

          {uploadStep === 1 ? (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>File Upload</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                  />
                  <FileSpreadsheet className={`h-12 w-12 mb-4 ${uploadFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-base font-semibold text-slate-700 text-center">
                    {uploadFile ? uploadFile.name : "Click or drag .csv file to upload"}
                  </span>
                  <span className="text-sm text-slate-500 mt-2">.CSV only (up to 10MB)</span>
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={resetModals}>Cancel</Button>
                <Button type="button" disabled={!uploadFile} onClick={() => setUploadStep(2)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Next: Map Columns <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={(e) => handleFinalSubmit(e, "assign")}>
              {renderMappingUI("assign")}

              <div className="space-y-2 mt-8 border-t pt-6 border-slate-100">
                <Label htmlFor="agent" className="text-sm text-slate-500 uppercase tracking-wider font-bold">Assign Mapped Clients To</Label>
                <select
                  id="agent"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  value={uploadAgent}
                  onChange={(e) => setUploadAgent(e.target.value)}
                >
                  <option value="" disabled>Select an agent...</option>
                  {dummyAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <DialogFooter className="pt-8">
                <Button type="button" variant="ghost" onClick={() => setUploadStep(1)}>Back</Button>
                <Button
                  type="submit"
                  disabled={!uploadAgent || !columnMapping["Primary Phone"]}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4"/> Import & Assign
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- CLIENT DETAILS DIALOG --- */}
      <Dialog open={selectedClient !== null} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-background">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-xl">{selectedClient.name}</DialogTitle>
                  <Badge variant="outline" className={`border-none ${getStatusColor(selectedClient.status)}`}>{selectedClient.status}</Badge>
                </div>
                <DialogDescription className="font-mono text-sm">{selectedClient.primaryNumber}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned To</p>
                    <p className="text-sm font-medium text-slate-800">{selectedClient.assignedAgent}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Projects</p>
                    <p className="text-sm font-medium text-slate-800">{selectedClient.projects.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Attempts</p>
                    <p className="text-sm font-medium text-slate-800">{selectedClient.attemptCount}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Next Scheduled Dial</p>
                    <p className="text-sm font-medium text-slate-800">{selectedClient.nextDialAt || "None"}</p>
                  </div>
                </div>

                {/* Owner Info (Dynamic KV Pairs) */}
                {selectedClient.info.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-2 border-b pb-1">Client Attributes</h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      {selectedClient.info.map((info, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-xs text-slate-500">{info.key}</span>
                          <span className="text-sm font-medium text-slate-800">{info.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call History */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 border-b pb-1">Call History</h4>
                  {selectedClient.history.length > 0 ? (
                    <div className="space-y-3">
                      {selectedClient.history.map((record) => (
                        <div key={record.id} className="flex flex-col p-3 border border-slate-100 rounded-lg shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-700">{record.time}</span>
                            <Badge variant="outline" className={`text-[10px] py-0 h-4 border-none ${getStatusColor(record.status)}`}>{record.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-1">Agent: {record.agent} • Duration: {record.duration}s</p>
                          <p className="text-sm text-slate-800 italic">"{record.notes}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No call history recorded yet.</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedClient(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" richColors />
    </>
  )
}