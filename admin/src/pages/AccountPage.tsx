import { useState, useRef, useEffect } from "react"
import AppNavbar from "@/components/AppNavbar.tsx"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Save, X, Edit, Mail, Phone, Shield, User } from "lucide-react"
import { toast, Toaster } from "sonner"
// @ts-ignore
import defaultAvatar from "../assets/avatar.jpg"
import { useAuth } from "@/contexts/AuthContext.tsx"
import { apiFetch } from "@/lib/api.tsx"

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { user, refreshUser } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    avatarUrl: defaultAvatar
  })

  // Sync data whenever the user context finishes fetching (including the image blob)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        avatarUrl: user.avatarUrl || defaultAvatar // Uses Blob URL or static fallback
      })
    }
  }, [user])

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    const phoneRegex = /^\d{11}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 11-digit phone number")
      return false
    }

    return true
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      // Temporary local base64 preview while editing
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
      toast.success("Profile picture updated locally")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (!user?.id) throw new Error("User ID missing")

      // 1. Send text info
      const profilePayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
      }

      const profileResponse = await apiFetch(`users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      })

      if (!profileResponse.ok) throw new Error("Failed to update profile information")

      // 2. Upload actual binary file if changed
      if (selectedFile) {
        const imageFormData = new FormData()
        imageFormData.append("profile_image", selectedFile)

        const imageResponse = await apiFetch(`users/${user.id}/profile-image`, {
          method: "POST",
          body: imageFormData,
        })

        if (!imageResponse.ok) throw new Error("Failed to upload profile picture")
      }

      setIsEditing(false)
      setSelectedFile(null)
      toast.success("Profile saved successfully")

      // 3. Force context to re-fetch `/me` and the new profile image blob!
      await refreshUser()
    } catch (e: any) {
      toast.error(e.message || "An error occurred")
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        avatarUrl: user.avatarUrl || defaultAvatar
      })
    }
    setSelectedFile(null)
    setIsEditing(false)
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppNavbar link1Name="Dashboard" link2Name="Agents" link3Name="Clients" />

        <main className="flex-1 p-4 md:p-8 flex items-center justify-center w-full">
          <Card className="w-full max-w-2xl shadow-xl border-slate-100 overflow-hidden bg-white relative">

            <div className="h-35 w-full bg-slate-900 relative overflow-hidden !-mt-6">
               <div className="absolute -top-10 -right-10 size-40 bg-indigo-500 rounded-full opacity-30 blur-2xl animate-pulse"></div>
               <div className="absolute -bottom-10 -left-10 size-40 bg-blue-500 rounded-full opacity-30 blur-2xl"></div>
            </div>

            <CardContent className="relative px-6 pb-8 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-16 mb-8 gap-4">
                <div className="relative group">
                  <img
                    src={formData.avatarUrl}
                    alt="Profile"
                    className="size-32 rounded-full object-cover border border-white shadow-xl bg-white"
                  />
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Camera className="size-8" />
                    </button>
                  )}
                </div>

                <div className="sm:mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">{formData.name || "Loading..."}</h2>
                  <p className="text-slate-500 font-medium">{formData.role}</p>
                </div>

                <div className="sm:ml-auto mb-4">
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="size-4 mr-2" /> Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={handleCancel}
                        className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      >
                        <X className="size-4 mr-2" /> Cancel
                      </Button>
                      <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save className="size-4 mr-2" /> Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <User className="size-4" /> Full Name
                    </Label>
                    <Input disabled={!isEditing} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <Mail className="size-4" /> Email Address
                    </Label>
                    <Input disabled={!isEditing} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <Phone className="size-4" /> Phone Number
                    </Label>
                    <Input disabled={!isEditing} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-50" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <Shield className="size-4" /> System Role
                    </Label>
                    <Input disabled value={formData.role} className="bg-slate-100 text-slate-500" />
                  </div>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  )
}