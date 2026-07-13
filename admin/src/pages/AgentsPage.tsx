import {useEffect, useState} from "react"
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
import {useNavigate} from "react-router-dom"

export default function AgentsPage() {

  // --- INITIALIZATION ---
  const navigate = useNavigate()
  const [agents, setAgents] = useState<any[]>([])
  const [dateRange, setDateRange] = useState("Today")

  // --- CALCULATE TOTAL CALLS ---
  const totalCalls = agents.reduce((accumulator, currentItem) => {
    return (accumulator + (currentItem.calls || 0));
  }, 0);

  // --- SEARCH & FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")

  // --- FILTER LOGIC ---
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = (agent.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (agent.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "All" || (agent.role || "").toLowerCase() === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  })

  // --- PAGINATION LOGIC ---
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE) || 1

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentAgents = filteredAgents.slice(startIndex, endIndex)

  // --- EDIT AGENT STATE ---
  const [editingAgent, setEditingAgent] = useState<any | null>(null)

  // --- ADD AGENT AND VALIDATION STATE ---
  const [addingAgent, setAddingAgent] = useState<{name: string, email: string, password?: string, confirmPassword?: string, phone: string, role: string} | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // --- DELETE AGENT STATE ---
  const [deactivateAgentId, setDeactivateAgentId] = useState<string | null>(null)

  // --- DATE HANDLERS ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDateRange(e.target.value)
      loadCalls(e.target.value)
    }
  }

  const handlePresetSelect = (preset: string) => {
    setDateRange(preset)
    loadCalls(preset)
  }

  // --- GLOBAL VALIDATION LOGIC ---
  const validateAgentData = (data: { name: string, email: string, phone: string }) => {
    if (!data.name || !data.name.trim()) {
      toast.error("Name cannot be empty")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    const phoneRegex = /^\d{11}$/
    if (data.phone && !phoneRegex.test(data.phone)) {
      toast.error("Please enter a valid 11-digit phone number")
      return false
    }

    return true
  }

  // --- EXPORT CSV FUNCTION ---
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Role", "Total Calls"]
    const csvContent = [
      headers.join(","),
      ...filteredAgents.map(a => [a.id, `"${a.name}"`, `"${a.email}"`, `"${a.phone}"`, `"${a.role}"`, a.calls || 0].join(","))
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

  // --- DATA LOADING ---
  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const response = await apiFetch("users?role=user", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to load agents.")
      }
      const data = await response.json()

      const mappedData = data.map((agent: any) => ({
        ...agent,
        phone: agent.phoneNumber || agent.phone || "",
        calls: 0
      }))

      setAgents(mappedData)
      loadCalls("Today", mappedData)

    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const loadCalls = async (selectedDate: string, freshAgents?: any[]) => {
    try {
      // NOTE: Ensure this matches the endpoint your backend expects!
      const response = await apiFetch(`calls-summary?date=${selectedDate}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to load calls.")
      }

      const callsData = await response.json()

      setAgents(prevAgents => {
        const targetAgents = freshAgents || prevAgents

        return targetAgents.map(agent => {
          // Adjust 'userId' and 'count' below based on your backend response structure
          const agentCallRecord = callsData.find((c: any) => c.userId === agent.id)
          return {
            ...agent,
            calls: agentCallRecord ? agentCallRecord.count : 0
          }
        })
      })
    } catch (error: any) {
      console.error(error.message)
    }
  }

  // --- API FUNCTIONS ---
  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAgent) return

    if (!validateAgentData(editingAgent)) return

    const payload = editingAgent
    const { id, otp, otpExpiry, jwtToken, phoneNumber, calls, ...data } = payload // Stripped out 'calls' to prevent accidentally saving it to DB
    setEditingAgent(null)

    try {
      const response = await apiFetch(`users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update agent")

      toast.success("Agent Updated", {
        description: `${data.name}'s details have been saved successfully.`,
      })

      loadAgents()

    } catch (error) {
      console.error("Error updating agent:", error)
      toast.error("Update Failed", {
        description: "There was a problem saving the agent's details. Please try again.",
      })
    }
  }

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addingAgent) return

    if (!validateAgentData(addingAgent)) return

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

    try {
      const response = await apiFetch("users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      })

      if (!response.ok) throw new Error("Failed to add agent")

      toast.success("Agent Created", {
        description: `${agentData.name} has been added to the system.`,
      })

      loadAgents()

    } catch (error) {
      console.error("Error adding agent:", error)
      toast.error("Creation Failed", {
        description: "Could not create the new agent. Please check your connection and try again.",
      })
    }
  }

  const handleDeactivateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deactivateAgentId) return

    const targetId = deactivateAgentId
    setDeactivateAgentId(null)

    try {
      const response = await apiFetch("deactivate-agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId })
      })

      if (!response.ok) throw new Error("Failed to deactivate agent")

      toast.success("Agent Deactivated", {
        description: "The agent has been successfully deactivated.",
      })

      loadAgents()
    } catch (error) {
      console.error("Error deleting agent:", error)
      toast.error("Deactivation Failed", {
        description: "An error occurred while trying to deactivate this agent.",
      })
    }
  }

  return (
    <>
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <AppNavbar link1Name="Dashboard" link2Name="Reports" link3Name="Clients" />

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
              <div className="text-2xl font-bold">{totalCalls}</div>
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
                    <DropdownMenuItem onClick={() => handlePresetSelect("Today")}>Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePresetSelect("Past Week")}>Past Week</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePresetSelect("Past Month")}>Past Month</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePresetSelect("Past Year")}>Past Year</DropdownMenuItem>
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
                      setAddingAgent({ name: "", email: "", password: "", confirmPassword: "", phone: "", role: "user" })
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
                            {agent.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{agent.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{agent.phone}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`font-normal ${
                              (agent.role || "").toLowerCase() === "deactivated" 
                                ? "bg-red-50 text-red-700 border-red-200" 
                                : (agent.role || "").toLowerCase() === "user" 
                                ? "bg-blue-50 text-blue-700 border-blue-200" 
                                : "text-muted-foreground"
                            }`}
                          >
                            {agent.role || "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{agent.calls || 0}</TableCell>
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
                    value={editingAgent.name || ""}
                    onChange={(e) => setEditingAgent({...editingAgent, name: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingAgent.email || ""}
                    onChange={(e) => setEditingAgent({...editingAgent, email: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingAgent.phone || ""}
                    onChange={(e) => setEditingAgent({...editingAgent, phone: e.target.value})}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={
                      editingAgent.role
                        ? editingAgent.role.charAt(0).toUpperCase() + editingAgent.role.slice(1).toLowerCase()
                        : "User"
                    }
                    onChange={(e) => setEditingAgent({...editingAgent, role: e.target.value})}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
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
                    value={addingAgent.name}
                    onChange={(e) => setAddingAgent({...addingAgent, name: e.target.value})}
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
                    value={addingAgent.phone}
                    onChange={(e) => setAddingAgent({...addingAgent, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="add-role">Role</Label>
                  <select
                    id="add-role"
                    value={
                      addingAgent.role
                        ? addingAgent.role.charAt(0).toUpperCase() + addingAgent.role.slice(1).toLowerCase()
                        : "User"
                    }
                    onChange={(e) => setAddingAgent({...addingAgent, role: e.target.value})}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="" disabled>Select a role</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
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