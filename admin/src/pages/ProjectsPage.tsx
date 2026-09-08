import React, { useState, useEffect } from "react"
import {
  FolderOpen, Plus, Trash2, Edit, Search, Save, Building2
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast, Toaster } from "sonner"

import AppNavbar from "@/components/AppNavbar" // Adjust import path if needed
import { apiFetch } from "@/lib/api" // Adjust import path if needed

interface Project {
  id: number;
  name: string;
  description: string | null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const projRes = await apiFetch("projects", { method: "GET" })
      if (!projRes.ok) throw new Error("Failed to load projects")
      const projData: Project[] = await projRes.json()

      // Sort alphabetically
      projData.sort((a, b) => a.name.localeCompare(b.name))
      setProjects(projData)
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  // --- CRUD OPERATIONS ---
  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setFormData({ name: project.name, description: project.description || "" })
    } else {
      setEditingProject(null)
      setFormData({ name: "", description: "" })
    }
    setIsModalOpen(true)
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return toast.error("Project name is required")

    setIsSaving(true)
    try {
      const url = editingProject ? `projects/${editingProject.id}` : "projects"
      const method = editingProject ? "PATCH" : "POST"

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to save project")
      }

      toast.success(editingProject ? "Project updated successfully!" : "Project created successfully!")
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the campaign "${name}"? This action cannot be undone.`)) return

    try {
      const res = await apiFetch(`projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete project")

      toast.success("Project deleted securely")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "You might not have permission to delete this project.")
    }
  }

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50/50">
      <AppNavbar />

      <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns & Projects</h2>
            <p className="text-muted-foreground mt-1">Manage call center datasets and client pools</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="flex items-center w-full sm:w-auto h-10">
            <Plus className="h-4 w-4 mr-2" /> Create New Campaign
          </Button>
        </div>

        {/* --- CONTROLS & TABLE --- */}
        <Card className="flex flex-col shadow-sm border-slate-100">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <CardTitle className="text-[hsl(var(--tertiary))] text-xl">Campaign Directory</CardTitle>
              <CardDescription>Overview of all active and inactive client pools.</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search campaigns..."
                className="pl-9 w-full h-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="block w-full overflow-x-auto">
              <Table className="min-w-[800px] w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Project Name</TableHead>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">Loading projects...</TableCell>
                    </TableRow>
                  ) : filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                      <TableRow key={project.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="font-semibold text-slate-800 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {project.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm font-medium">
                          {project.description ? (
                            <span className="line-clamp-2">{project.description}</span>
                          ) : (
                            <span className="italic opacity-75">No description</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(project)}
                            >
                              <Edit className="h-4 w-4 mr-2 text-blue-500" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              onClick={() => handleDeleteProject(project.id, project.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <FolderOpen className="h-10 w-10 mb-3 text-slate-300" />
                          <p className="font-semibold text-slate-800">No projects found</p>
                          <p className="text-sm mt-1">Create your first campaign to assign leads.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--tertiary))] text-xl">
              {editingProject ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingProject ? "Edit Campaign" : "Create New Campaign"}
            </DialogTitle>
            <CardDescription>
              {editingProject ? "Update the details of your existing campaign." : "Set up a new client pool to start tracking calls."}
            </CardDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProject} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name <span className="text-destructive">*</span></Label>
              <Input
                id="campaign-name"
                autoFocus
                placeholder="e.g. Q4 Luxury Villa Leads"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-desc">Description / Guidelines</Label>
              <Textarea
                id="campaign-desc"
                rows={4}
                placeholder="Brief description of the target audience or script notes..."
                className="resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> {editingProject ? "Save Changes" : "Create Campaign"}</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" richColors />
    </div>
  )
}