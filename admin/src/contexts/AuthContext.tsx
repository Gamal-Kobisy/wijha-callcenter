import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import { apiFetch } from "@/lib/api.tsx"

interface User {
  id: string
  name: string
  email: string
  phoneNumber?: string
  phone?: string
  role?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)
  const currentAvatarUrl = useRef<string | null>(null) // Used to prevent memory leaks with Object URLs

  const fetchUserDetails = async () => {
    try {
      // 1. Fetch user data
      const response = await apiFetch("me", { method: "GET" })

      if (response.ok) {
        const data = await response.json()

        // 2. Fetch the binary profile image safely
        try {
          const imageResponse = await apiFetch(`users/${data.id}/profile-image`, {
            method: "GET"
          })

          if (imageResponse.ok) {
            // Convert binary response to a Blob
            const imageBlob = await imageResponse.blob()

            // Clean up the old URL from memory if it exists
            if (currentAvatarUrl.current) {
              URL.revokeObjectURL(currentAvatarUrl.current)
            }

            // Create a local URL for the image and attach it to the user object
            currentAvatarUrl.current = URL.createObjectURL(imageBlob)
            data.avatarUrl = currentAvatarUrl.current
          }
        } catch (imgError) {
          console.warn("No profile image found or failed to load (404).")
        }

        setUser(data)
      }
    } catch (error: any) {
      console.error("Failed to load user profile", error)
    }
  }

  useEffect(() => {
    if (hasFetched.current) return

    const initApp = async () => {
      await fetchUserDetails()
      setIsLoading(false)
    }

    if (localStorage.getItem("userToken") || sessionStorage.getItem("userToken")) {
      hasFetched.current = true
      initApp()
    } else {
      setIsLoading(false)
    }

    // Cleanup object URL on unmount to prevent memory leaks
    return () => {
      if (currentAvatarUrl.current) {
        URL.revokeObjectURL(currentAvatarUrl.current)
      }
    }
  }, [])

  const logout = async () => {
    try {
      await apiFetch("auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Network error during logout.")
    } finally {
      if (currentAvatarUrl.current) URL.revokeObjectURL(currentAvatarUrl.current)
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/login"
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser: fetchUserDetails }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}