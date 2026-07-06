import { useState } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Phone,
  Users,
  Plus,
  MoreHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Activity, Download,
} from "lucide-react"
import { apiFetch } from "@/lib/api.tsx"
import PasswordRequirements, { checkPasswordValidity } from "@/components/PasswordRequirements"

import { toast, Toaster } from "sonner"
import {useNavigate} from "react-router-dom";

// --- INITIAL DUMMY DATA ---
const initialAgents = [
  { id: "1029", agent: "Ahmed Tarek", number: "+20 100 123 4567", role: "Agent", isOnline: true, email: "ahmed@wijhawest.com", calls: 45 },
  { id: "1030", agent: "Sarah Kamel", number: "+20 111 987 6543", role: "Agent", isOnline: false, email: "sarah@wijhawest.com", calls: 12 },
  { id: "1031", agent: "Omar Hassan", number: "+20 122 345 6789", role: "Supervisor", isOnline: true, email: "omar@wijhawest.com", calls: 28 },
  { id: "1032", agent: "Nour Ali", number: "+20 100 555 1234", role: "Agent", isOnline: false, email: "nour@wijhawest.com", calls: 0 },
  { id: "1033", agent: "Youssef Emad", number: "+20 155 777 8899", role: "Agent", isOnline: true, email: "youssef@wijhawest.com", calls: 34 },
  { id: "1034", agent: "Khaled Saied", number: "+20 109 888 7766", role: "Admin", isOnline: true, email: "khaled@wijhawest.com", calls: 41 },
  { id: "1035", agent: "Mariam Safwat", number: "+20 120 444 3322", role: "Agent", isOnline: false, email: "mariam@wijhawest.com", calls: 5 },
  { id: "1036", agent: "Ahmed Tarek 2", number: "+20 100 123 4567", role: "Agent", isOnline: true, email: "ahmed2@wijhawest.com", calls: 45 },
  { id: "1037", agent: "Sarah Kamel 2", number: "+20 111 987 6543", role: "Agent", isOnline: false, email: "sarah2@wijhawest.com", calls: 12 },
  { id: "1038", agent: "Omar Hassan 2", number: "+20 122 345 6789", role: "Supervisor", isOnline: true, email: "omar2@wijhawest.com", calls: 28 },
  { id: "1039", agent: "Nour Ali 2", number: "+20 100 555 1234", role: "Agent", isOnline: false, email: "nour2@wijhawest.com", calls: 0 },
  { id: "1040", agent: "Youssef Emad 2", number: "+20 155 777 8899", role: "Agent", isOnline: true, email: "youssef2@wijhawest.com", calls: 34 },
  { id: "1041", agent: "Khaled Saied 2", number: "+20 109 888 7766", role: "Admin", isOnline: true, email: "khaled2@wijhawest.com", calls: 41 },
  { id: "1042", agent: "Mariam Safwat 2", number: "+20 120 444 3322", role: "Agent", isOnline: false, email: "mariam2@wijhawest.com", calls: 5 },
  { id: "1043", agent: "Ahmed Tarek 3", number: "+20 100 123 4567", role: "Agent", isOnline: true, email: "ahmed3@wijhawest.com", calls: 45 },
  { id: "1044", agent: "Sarah Kamel 3", number: "+20 111 987 6543", role: "Agent", isOnline: false, email: "sarah3@wijhawest.com", calls: 12 },
  { id: "1045", agent: "Omar Hassan 3", number: "+20 122 345 6789", role: "Supervisor", isOnline: true, email: "omar3@wijhawest.com", calls: 28 },
  { id: "1046", agent: "Nour Ali 3", number: "+20 100 555 1234", role: "Agent", isOnline: false, email: "nour3@wijhawest.com", calls: 0 },
  { id: "1047", agent: "Youssef Emad 3", number: "+20 155 777 8899", role: "Agent", isOnline: true, email: "youssef3@wijhawest.com", calls: 34 },
  { id: "1048", agent: "Khaled Saied 3", number: "+20 109 888 7766", role: "Admin", isOnline: true, email: "khaled3@wijhawest.com", calls: 41 },
  { id: "1049", agent: "Mariam Safwat 3", number: "+20 120 444 3322", role: "Agent", isOnline: false, email: "mariam3@wijhawest.com", calls: 5 },
]

export default function AgentsPage() {
  const navigate = useNavigate()
  const [agents] = useState(initialAgents)
  const [dateRange, setDateRange] = useState("Today")

  // --- SEARCH & FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  // --- FILTER LOGIC ---
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "All" || agent.role.toLowerCase() === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  // --- PAGINATION LOGIC ---
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE) || 1

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentAgents = filteredAgents.slice(startIndex, endIndex)

  // Edit Agent State
  const [editingAgent, setEditingAgent] = useState<typeof initialAgents[0] | null>(null)

  // Add Agent & Validation State
  const [addingAgent, setAddingAgent] = useState<{agent: string, email: string, password?: string, confirmPassword?: string, number: string, role: string} | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Delete Agent
  const [deactivateAgentId, setDeactivateAgentId] = useState<string | null>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDateRange(e.target.value)
    }
  }

  // --- EXPORT CSV FUNCTION ---
  const exportToCSV = () => {
    const headers = ["ID", "Agent", "Email", "Phone", "Role", "Calls"]
    const csvContent = [
      headers.join(","),
      // Wrap strings in quotes to prevent issues with commas in names
      ...filteredAgents.map(a => [a.id, `"${a.agent}"`, `"${a.email}"`, `"${a.number}"`, `"${a.role}"`, a.calls].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', `agents_export_${new Date().toISOString().split('T')[0]}.csv`)
    a.click()

    toast.success("Export Complete", {
      description: "Your CSV file has been downloaded.",
    })
  }

  // --- API FUNCTIONS ---
  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAgent) return

    const payload = editingAgent
    setEditingAgent(null)

    try {
      const response = await apiFetch("/edit-agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Failed to update agent")

      toast.success("Agent Updated", {
        description: `${payload.agent}'s details have been saved successfully.`,
      })

    } catch (error) {
      console.error("Error updating agent:", error)
      toast.error("Update Failed", {
        description: "There was a problem saving the agent's details. Please try again.",
      })
    }
  }

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!addingAgent) return

    setPasswordError(null)
    const isPasswordValid = checkPasswordValidity(addingAgent.password || "").every(req => req.met)

    if (!isPasswordValid) {
      setPasswordError("Please meet all password requirements.")
      return
    }
    if (addingAgent.password !== addingAgent.confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }

    const { confirmPassword, ...agentData } = addingAgent
    setAddingAgent(null)

    try{
      const response = await apiFetch("/add-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      })

      if (!response.ok) throw new Error("Failed to add agent")

      toast.success("Agent Created", {
        description: `${agentData.agent} has been added to the system.`,
      })

    }
    catch(error){
      console.error("Error adding agent:", error)
      toast.error("Creation Failed", {
        description: "Could not create the new agent. Please check your connection and try again.",
      })
    }
  }

  const handleDeactivateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!deactivateAgentId) return

    const targetId = deactivateAgentId
    setDeactivateAgentId(null)

    try{
      const response = await apiFetch("/delete-agent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId })
      })

      if (!response.ok) throw new Error("Failed to delete agent")

      toast.success("Agent Deactivated", {
        description: "The agent has been successfully removed.",
      })

    }
    catch(error){
      console.error("Error deleting agent:", error)
      toast.error("Deactivation Failed", {
        description: "An error occurred while trying to deactivate this agent.",
      })
    }
  }

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AppNavbar link1Name="Dashboard" link2Name="Reports" link3Name="Leads" />

      <main className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">

        {/* --- SECTION 1: KPIs --- */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <p className="text-xs text-muted-foreground">
                +1 joined in last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Currently Online</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents.filter(a => a.isOnline).length}
              </div>
              <p className="text-xs text-muted-foreground">
                +2 active in last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(var(--tertiary))]">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">153</div>
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- SECTION 2: AGENTS TABLE --- */}
        <Card className="flex flex-col">

          <CardHeader className="flex flex-col gap-5 pb-6">

            {/* Top Row: Title (Left) & Search (Right) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
              <div>
                <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Agents</CardTitle>
                <CardDescription>
                  Manage your team and view their performance metrics.
                </CardDescription>
              </div>

              <div className="w-full md:w-auto flex justify-end">
                <Input
                  placeholder="Search agents..."
                  className="w-full md:w-[250px] h-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>

            {/* Bottom Row: Filters (Left) & Actions (Right) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">

              {/* Left Side: Role Filter & Date Picker */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <select
                  className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  <option value="All">All Roles</option>
                  <option value="Agent">Agent</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Admin</option>
                </select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 w-full sm:w-auto justify-start sm:justify-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.includes("-") ? "Custom" : dateRange}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-background border-border shadow-md">
                    <DropdownMenuItem onClick={() => setDateRange("Today")}>Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRange("Past Week")}>Past Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRange("Past Month")}>Past Month</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateRange("Past Year")}>Past Year</DropdownMenuItem>
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

              {/* Right Side: Export & Add Agent */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end">
                <Button onClick={exportToCSV} variant="default" className="h-9 w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4"/> Export CSV
                </Button>
                <Button
                    onClick={() => {
                      setAddingAgent({ agent: "", email: "", password: "", confirmPassword: "", number: "", role: "" })
                      setPasswordError(null)
                    }}
                    className="h-9 w-full sm:w-auto bg-emerald-500 text-white hover:bg-emerald-600 border-none transition-colors justify-center">
                  <Plus className="h-4 w-4" />
                  Add Agent
                </Button>
              </div>

            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="block w-full overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4 sm:pl-6">Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Total Calls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAgents.length > 0 ? (
                    currentAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium whitespace-nowrap pl-4 sm:pl-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${agent.isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}
                              title={agent.isOnline ? "Online" : "Offline"}
                            />
                            {agent.agent}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{agent.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{agent.number}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="font-normal text-muted-foreground">
                            {agent.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{agent.calls}</TableCell>
                        <TableCell className="text-right pr-4 sm:pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border-border shadow-md">
                              <DropdownMenuItem
                                  onClick={() => navigate(`/agents/${agent.id}`)}
                                  className="cursor-pointer focus:bg-slate-200">Performance
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                              <DropdownMenuItem
                                className="cursor-pointer focus:bg-slate-200"
                                onClick={() => setEditingAgent(agent)}
                              >
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                  onClick={() => setDeactivateAgentId(agent.id)}
                                  className="cursor-pointer text-destructive focus:bg-red-50 focus:text-red-600">
                                Deactivate Agent
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No agents found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border p-4 sm:p-6">
            <div className="text-sm text-muted-foreground text-center sm:text-left w-full sm:w-auto">
              Showing <strong>{filteredAgents.length === 0 ? 0 : startIndex + 1}</strong> to <strong>{Math.min(endIndex, filteredAgents.length)}</strong> of <strong>{filteredAgents.length}</strong> agents
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

      {/* --- EDIT AGENT --- */}
      <Dialog open={editingAgent !== null} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Edit Agent Details</DialogTitle>
            <DialogDescription>
              Make changes to the agent's profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          {editingAgent && (
            <form onSubmit={handleUpdateAgent}>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingAgent.agent}
                    onChange={(e) => setEditingAgent({...editingAgent, agent: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingAgent.email}
                    onChange={(e) => setEditingAgent({...editingAgent, email: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingAgent.number}
                    onChange={(e) => setEditingAgent({...editingAgent, number: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={editingAgent.role}
                    onChange={(e) => setEditingAgent({...editingAgent, role: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingAgent(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* --- ADD AGENT --- */}
      <Dialog open={addingAgent !== null} onOpenChange={(open) => !open && setAddingAgent(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
          </DialogHeader>

          {addingAgent && (
            <form onSubmit={handleAddAgent}>
              <div className="flex flex-col gap-4 py-4">
                {passwordError && (
                  <div className="w-full rounded-md bg-red-50 p-2 text-sm font-medium text-red-600 border border-red-200 text-center">
                    {passwordError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-name">Name</Label>
                  <Input
                    id="add-name"
                    value={addingAgent.agent}
                    onChange={(e) => setAddingAgent({...addingAgent, agent: e.target.value})}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={addingAgent.email}
                    onChange={(e) => setAddingAgent({...addingAgent, email: e.target.value})}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-password">Password</Label>
                  <Input
                    id="add-password"
                    type="password"
                    value={addingAgent.password || ""}
                    onChange={(e) => setAddingAgent({...addingAgent, password: e.target.value})}
                    required
                  />
                  <PasswordRequirements password={addingAgent.password} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-confirm-password">Confirm Password</Label>
                  <Input
                    id="add-confirm-password"
                    type="password"
                    value={addingAgent.confirmPassword || ""}
                    onChange={(e) => setAddingAgent({...addingAgent, confirmPassword: e.target.value})}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-phone">Phone</Label>
                  <Input
                    id="add-phone"
                    value={addingAgent.number}
                    onChange={(e) => setAddingAgent({...addingAgent, number: e.target.value})}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-role">Role</Label>
                  <Input
                    id="add-role"
                    value={addingAgent.role}
                    onChange={(e) => setAddingAgent({...addingAgent, role: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setAddingAgent(null)
                  setPasswordError(null)
                }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Add Agent
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deactivateAgentId !== null} onOpenChange={(open) => !open && setDeactivateAgentId(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background border-red-100">
          <DialogHeader>
            <DialogTitle className="text-destructive">Deactivate Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this agent? They will immediately lose access to the system and be logged out. This action can be undone later by an administrator.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setDeactivateAgentId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeactivateAgent}
            >
              Yes, Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <Toaster position="bottom-right" richColors />
  </>
  )
}