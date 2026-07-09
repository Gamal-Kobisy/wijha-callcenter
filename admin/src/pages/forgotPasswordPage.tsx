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
  DropdownMenuLabel,
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
  Activity,
  Check, // Added
  X      // Added
} from "lucide-react"
import { apiFetch } from "@/lib/api.tsx"

// --- INITIAL DUMMY DATA ---
const initialAgents = [
  { id: "1029", agent: "Ahmed Tarek", number: "+20 100 123 4567", role: "Agent", isOnline: true, email: "ahmed@wijhawest.com", calls: 45 },
  { id: "1030", agent: "Sarah Kamel", number: "+20 111 987 6543", role: "Agent", isOnline: false, email: "sarah@wijhawest.com", calls: 12 },
  { id: "1031", agent: "Omar Hassan", number: "+20 122 345 6789", role: "Supervisor", isOnline: true, email: "omar@wijhawest.com", calls: 28 },
  { id: "1032", agent: "Nour Ali", number: "+20 100 555 1234", role: "Agent", isOnline: false, email: "nour@wijhawest.com", calls: 0 },
  { id: "1033", agent: "Youssef Emad", number: "+20 155 777 8899", role: "Agent", isOnline: true, email: "youssef@wijhawest.com", calls: 34 },
  { id: "1034", agent: "Khaled Saied", number: "+20 109 888 7766", role: "Admin", isOnline: true, email: "khaled@wijhawest.com", calls: 41 },
  { id: "1035", agent: "Mariam Safwat", number: "+20 120 444 3322", role: "Agent", isOnline: false, email: "mariam@wijhawest.com", calls: 5 },
  { id: "1036", agent: "Ahmed Tarek", number: "+20 100 123 4567", role: "Agent", isOnline: true, email: "ahmed@wijhawest.com", calls: 45 },
  { id: "1037", agent: "Sarah Kamel", number: "+20 111 987 6543", role: "Agent", isOnline: false, email: "sarah@wijhawest.com", calls: 12 },
  { id: "1038", agent: "Omar Hassan", number: "+20 122 345 6789", role: "Supervisor", isOnline: true, email: "omar@wijhawest.com", calls: 28 },
  { id: "1039", agent: "Nour Ali", number: "+20 100 555 1234", role: "Agent", isOnline: false, email: "nour@wijhawest.com", calls: 0 },
  { id: "1040", agent: "Youssef Emad", number: "+20 155 777 8899", role: "Agent", isOnline: true, email: "youssef@wijhawest.com", calls: 34 },
  { id: "1041", agent: "Khaled Saied", number: "+20 109 888 7766", role: "Admin", isOnline: true, email: "khaled@wijhawest.com", calls: 41 },
  { id: "1042", agent: "Mariam Safwat", number: "+20 120 444 3322", role: "Agent", isOnline: false, email: "mariam@wijhawest.com", calls: 5 },
  { id: "1043", agent: "Ahmed Tarek", number: "+20 100 123 4567", role: "Agent", isOnline: true, email: "ahmed@wijhawest.com", calls: 45 },
  { id: "1044", agent: "Sarah Kamel", number: "+20 111 987 6543", role: "Agent", isOnline: false, email: "sarah@wijhawest.com", calls: 12 },
  { id: "1045", agent: "Omar Hassan", number: "+20 122 345 6789", role: "Supervisor", isOnline: true, email: "omar@wijhawest.com", calls: 28 },
  { id: "1046", agent: "Nour Ali", number: "+20 100 555 1234", role: "Agent", isOnline: false, email: "nour@wijhawest.com", calls: 0 },
  { id: "1047", agent: "Youssef Emad", number: "+20 155 777 8899", role: "Agent", isOnline: true, email: "youssef@wijhawest.com", calls: 34 },
  { id: "1048", agent: "Khaled Saied", number: "+20 109 888 7766", role: "Admin", isOnline: true, email: "khaled@wijhawest.com", calls: 41 },
  { id: "1049", agent: "Mariam Safwat", number: "+20 120 444 3322", role: "Agent", isOnline: false, email: "mariam@wijhawest.com", calls: 5 },
]

export default function AgentsPage() {
  const [agents, setAgents] = useState(initialAgents)
  const [dateRange, setDateRange] = useState("Today")

  // Pagination State & Logic (10 agents per page)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(agents.length / ITEMS_PER_PAGE) || 1

  // Calculate which agents to show on the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentAgents = agents.slice(startIndex, endIndex)

  // Edit Agent
  const [editingAgent, setEditingAgent] = useState<typeof initialAgents[0] | null>(null)

  // Add Agent & Validation State
  const [addingAgent, setAddingAgent] = useState<{agent: string, email: string, password?: string, confirmPassword?: string, number: string, role: string} | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Password Requirements Logic for Add Form
  const currentPassword = addingAgent?.password || ""
  const passwordRequirements = [
    { text: "At least 8 characters", met: currentPassword.length >= 8 },
    { text: "At least 1 lowercase letter", met: /[a-z]/.test(currentPassword) },
    { text: "At least 1 uppercase letter", met: /[A-Z]/.test(currentPassword) },
    { text: "At least 1 number or special character", met: /[\d!@#$%^&*(),.?":{}|<>]/.test(currentPassword) },
  ]
  const isPasswordValid = passwordRequirements.every((req) => req.met)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDateRange(e.target.value)
    }
  }

  // --- API WRAPPER FUNCTION ---
  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAgent) return

    try {
      const response = await apiFetch("/edit-agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAgent),
      })

      if (!response.ok) throw new Error("Failed to update agent")

      setAgents((prevAgents) =>
        prevAgents.map((a) => (a.id === editingAgent.id ? editingAgent : a))
      )
      setEditingAgent(null)
    } catch (error) {
      console.error("Error updating agent:", error)
    }
  }

  const addAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!addingAgent) return

    // Password Validation check
    setPasswordError(null)
    if (!isPasswordValid) {
      setPasswordError("Please meet all password requirements.")
      return
    }
    if (addingAgent.password !== addingAgent.confirmPassword) {
      setPasswordError("Passwords do not match.")
      return
    }

    try{
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...agentData } = addingAgent;

      const response = await apiFetch("/add-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      })
      if (!response.ok) throw new Error("Failed to add agent")

      const newAgentEntry = {
        id: Math.floor(Math.random() * 10000).toString(),
        agent: agentData.agent,
        email: agentData.email,
        number: agentData.number,
        role: agentData.role,
        isOnline: false,
        calls: 0
      }
      setAgents([...agents, newAgentEntry])
      setAddingAgent(null)
    }
    catch(error){
      console.error("Error adding agent:", error)
    }
  }

  return (
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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
            <div>
              <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Agents</CardTitle>
              <CardDescription>
                Manage your team and view their performance metrics.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.includes("-") ? "Custom" : dateRange}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-border shadow-md">
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-slate-200 focus:text-slate-900 transition-colors"
                    onClick={() => setDateRange("Today")}
                  >
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-slate-200 focus:text-slate-900 transition-colors"
                    onClick={() => setDateRange("Past Week")}
                  >
                    Past Week
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-slate-200 focus:text-slate-900 transition-colors"
                    onClick={() => setDateRange("Past Month")}
                  >
                    Past Month
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-slate-200 focus:text-slate-900 transition-colors"
                    onClick={() => setDateRange("Past Year")}
                  >
                    Past Year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative flex items-center">
                <input
                  type="date"
                  onChange={handleDateChange}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-slate-100 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                  title="Select a specific date"
                />
              </div>

              <Button
                  onClick={() => {
                    setAddingAgent({ agent: "", email: "", password: "", confirmPassword: "", number: "", role: "" })
                    setPasswordError(null)
                  }}
                  className="h-9 bg-emerald-500 text-white hover:bg-emerald-600 border-none transition-colors ">
                <Plus/>
                Add Agent
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Agent</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Total Calls</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Changed to map over currentAgents instead of agents */}
                {currentAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium whitespace-nowrap pl-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${agent.isOnline ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}
                          title={agent.isOnline ? "Online" : "Offline"}
                        />
                        {agent.agent}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{agent.email}</TableCell>
                    <TableCell className="whitespace-nowrap">{agent.number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {agent.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent.calls}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border-border shadow-md">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="cursor-pointer focus:bg-slate-200 focus:text-slate-900 transition-colors font-medium">
                            View Performance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem
                            className="cursor-pointer focus:bg-slate-200 focus:text-slate-900 transition-colors"
                            onClick={() => setEditingAgent(agent)}
                          >
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-red-50 focus:text-red-600 transition-colors">
                            Deactivate Agent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border p-6">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{agents.length === 0 ? 0 : startIndex + 1}</strong> to <strong>{Math.min(endIndex, agents.length)}</strong> of <strong>{agents.length}</strong> agents
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium px-2">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>

      {/* --- EDIT AGENT MODAL --- */}
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
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={editingAgent.agent}
                    onChange={(e) => setEditingAgent({...editingAgent, agent: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingAgent.email}
                    onChange={(e) => setEditingAgent({...editingAgent, email: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input
                    id="phone"
                    value={editingAgent.number}
                    onChange={(e) => setEditingAgent({...editingAgent, number: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">Role</Label>
                  <Input
                    id="role"
                    value={editingAgent.role}
                    onChange={(e) => setEditingAgent({...editingAgent, role: e.target.value})}
                    className="col-span-3"
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

      {/* --- ADD AGENT MODAL --- */}
      <Dialog open={addingAgent !== null} onOpenChange={(open) => !open && setAddingAgent(null)}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>Add New Agent</DialogTitle>
          </DialogHeader>

          {addingAgent && (
            <form onSubmit={addAgent}>
              <div className="grid gap-4 py-4">
                {passwordError && (
                  <p className="text-sm font-medium text-destructive col-span-4 text-center">
                    {passwordError}
                  </p>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-name" className="text-right">Name</Label>
                  <Input
                    id="add-name"
                    value={addingAgent.agent}
                    className="col-span-3"
                    onChange={(e) => setAddingAgent({...addingAgent, agent: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-email" className="text-right">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={addingAgent.email}
                    className="col-span-3"
                    onChange={(e) => setAddingAgent({...addingAgent, email: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-password" className="text-right">Password</Label>
                  <Input
                    id="add-password"
                    type="password"
                    value={addingAgent.password || ""}
                    className="col-span-3"
                    onChange={(e) => setAddingAgent({...addingAgent, password: e.target.value})}
                    required
                  />
                </div>

                {/* Password Requirements Checklist */}
                <div className="col-start-2 col-span-3 flex flex-col gap-1.5 mt-[-0.5rem] mb-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <X className="size-3 text-destructive" />
                      )}
                      <span className={req.met ? "text-slate-700" : "text-muted-foreground"}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-phone" className="text-right">Phone</Label>
                  <Input
                    id="add-phone"
                    value={addingAgent.number}
                    className="col-span-3"
                    onChange={(e) => setAddingAgent({...addingAgent, number: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-role" className="text-right">Role</Label>
                  <Input
                    id="add-role"
                    value={addingAgent.role}
                    className="col-span-3"
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
                  disabled={!isPasswordValid || addingAgent.password !== addingAgent.confirmPassword}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                >
                  Add Agent
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}