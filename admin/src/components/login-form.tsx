import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom"
import {apiFetch} from "@/lib/api.tsx";
import {Toaster, toast} from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // 1. Setup state to track what the user is typing
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  // --- SUBMIT LOGIC ---
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()

    const loginData = {
      email: email,
      password: password,
    }
    try {
      const response = await apiFetch("login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        toast.error("Invalid email or password. Please try again.")
        return
      }

      const data = await response.json()

      // Clear any old data just to be safe
      localStorage.removeItem("userToken")
      sessionStorage.removeItem("userToken")

      // If Remember Me is checked, save to localStorage (persists across tabs/restarts)
      // If not, save to sessionStorage (clears when the browser tab closes)
      if (rememberMe) {
        localStorage.setItem("userToken", data.token)
        localStorage.setItem("userRole", data.user.role)

        // a 1-day limit
        const expiry = new Date().getTime() + 86400000; // 24 hours in ms
        localStorage.setItem("tokenExpiry", expiry.toString())
      } else {
        sessionStorage.setItem("userToken", data.token)
        sessionStorage.setItem("userRole", data.user.role)
      }
      // Redirect based on role
      if (data.user.role.toLowerCase() === "admin") {
        window.location.href = "/dashboard"
      } else{
        window.location.href = "/agent-dashboard"
      }
    } catch (err) {
      toast.error("Could not connect to server. Please try again later.")
    }
  }

  return (
    <>
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>

        {/* Header Section */}
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-3xl font-bold text-[hsl(var(--primary))]">Call Center</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your credentials to access the dashboard.
          </p>
        </div>

        {/* Email Field */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-[hsl(var(--secondary))]"
          />
        </Field>

        {/* Password Field */}
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-[hsl(var(--secondary))]"
          />

          {/* Remember Me & Forgot Password Side-by-Side */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                className="border-slate-300 data-[state=checked]:bg-[hsl(var(--primary))] data-[state=checked]:border-[hsl(var(--primary))]"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <Link
            to="/forgot-password"
            className="text-sm font-medium text-[hsl(var(--tertiary))] hover:underline underline-offset-4"
            >
            Forgot password?
            </Link>
          </div>
        </Field>

        {/* Submit Button */}
        <Field>
          <Button
            type="submit"
            className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--tertiary))] "
          >
            Login to Dashboard
          </Button>
        </Field>

      </FieldGroup>
    </form>
    <Toaster position="bottom-right" richColors />
    </>
  )
}


