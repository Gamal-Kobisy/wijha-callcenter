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
  refreshUser: () => Promise<void> // 1. Add this to the interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hasFetched = useRef(false)

  // 2. Pull this function out so it can be called on demand
  const fetchUserDetails = async () => {
    try {
      const response = await apiFetch("me", { method: "GET" })
      if (response.ok) {
        const data = await response.json()
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
  }, [])

  const logout = async () => {
    try {
      await apiFetch("auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Network error during logout.")
    } finally {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/login"
    }
  }

  return (
    // 3. Expose fetchUserDetails as refreshUser
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