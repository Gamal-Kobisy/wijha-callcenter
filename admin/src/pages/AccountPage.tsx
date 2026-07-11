import { useState, useRef, useEffect } from "react"
import AppNavbar from "@/components/AppNavbar.tsx"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Save, X, Edit, Mail, Phone, Shield, User } from "lucide-react"
import { toast, Toaster } from "sonner"
// @ts-ignore
import avatar from "../assets/avatar.jpg"
import { useAuth } from "@/contexts/AuthContext.tsx"
import { apiFetch } from "@/lib/api.tsx"

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { user,refreshUser } = useAuth()

  // 1. Initialize with safe empty strings to prevent null crashes
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    avatarUrl: avatar
  })

  // 2. Sync data when the user finishes loading from the context
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        avatarUrl: avatar
      })
    }
  }, [user])

  // --- VALIDATION LOGIC ---
  const validateForm = () => {
    // Check for empty name
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty")
      return false
    }

    // Check email using Regex
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // if (!emailRegex.test(formData.email)) {
    //   toast.error("Please enter a valid email address")
    //   return false
    // }

    // Check phone number (Allows optional +, spaces, dashes, and 8-15 digits)
    const phoneRegex = /^\d{11}$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid phone number")
      return false
    }

    return true
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 1. Save the actual file object for the API request
      setSelectedFile(file)

      // 2. Create a temporary local preview for the UI
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

    // NEW: Use FormData to package the text data AND the file
    const submitData = new FormData()
    submitData.append("name", formData.name)
    submitData.append("email", formData.email)
    if (formData.phone) submitData.append("phone", formData.phone)

    // Attach the file only if the user selected a new one
    if (selectedFile) {
      submitData.append("avatar", selectedFile)
    }

    try {
      if (!user?.id) throw new Error("User ID missing")

      const response = await apiFetch(`users/${user.id}`, {
        method: "PATCH",
        body: submitData,
      })

      if (!response.ok) {
        throw new Error("Failed to update profile. Please try again later")
      }

      setIsEditing(false)
      setSelectedFile(null) // Clear the file state after successful save
      toast.success("Profile saved successfully")

      await refreshUser()
    } catch (e: any) {
      toast.error(e.message || "An error occurred")
    }
  }

  // --- CANCEL LOGIC ---
  const handleCancel = () => {
    // Revert the form back to the real user data
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "",
        avatarUrl: avatar
      })
    }
    setIsEditing(false)
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <AppNavbar link1Name="Dashboard" link2Name="Agents" link3Name="Clients" />

        <main className="flex-1 p-4 md:p-8 flex items-center justify-center w-full">
          <Card className="w-full max-w-2xl shadow-xl border-slate-100 overflow-hidden bg-white relative ">

            <div className="h-35 w-full bg-slate-900 relative overflow-hidden !-mt-6">
               <div className="absolute -top-10 -right-10 size-40 bg-indigo-500 rounded-full opacity-30 blur-2xl animate-pulse"></div>
               <div className="absolute -bottom-10 -left-10 size-40 bg-blue-500 rounded-full opacity-30 blur-2xl"></div>
            </div>

            <CardContent className="relative px-6 pb-8 pt-0">
              {/* Profile Header section */}
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
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
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

              {/* Form Inputs Grid */}
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <User className="size-4" /> Full Name
                    </Label>
                    <Input
                      disabled={!isEditing}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <Mail className="size-4" /> Email Address
                    </Label>
                    <Input
                      disabled={!isEditing}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <Phone className="size-4" /> Phone Number
                    </Label>
                    <Input
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-slate-600 font-medium">
                      <Shield className="size-4" /> System Role
                    </Label>
                    <Input disabled value={formData.role} className="bg-slate-100 text-slate-500" />
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </>
  )
}