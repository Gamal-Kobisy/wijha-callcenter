import { useState } from "react"
import { Check, X } from "lucide-react"
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  // 1. Setup state to track what the user is typing
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // 2. Real-time validation checks for the password
  const rules = {
    length: password.length >= 8,
    capital: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {    e.preventDefault()

    const loginData = {
      email: email,
      password: password,
      remember: rememberMe
    }
    try{
      const response = await fetch("https://api.wijhawest.com/login",{
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        setErrorMessage("Invalid email or password. Please try again.")
        return
      }

      const data = await response.json()

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userRole", data.role);

      window.location.href = "/"
    }
    catch(err){
      setErrorMessage("Could not connect to server. Please try again later.")    }
  }

  return (
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
            placeholder="username@gmail.com"
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

        {/* Real-time Password Checklist */}
        <div className="grid grid-cols-2 gap-2 text-xs my-2">
          <ValidationItem isValid={rules.length} text="Min 8 characters" />
          <ValidationItem isValid={rules.capital} text="At least 1 Capital letter" />
          <ValidationItem isValid={rules.number} text="At least 1 Number" />
          <ValidationItem isValid={rules.special} text="At least 1 Special character" />
        </div>

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
      {errorMessage && (
        <div className="text-sm font-medium text-red-500 text-center py-2">
          {errorMessage}
        </div>
      )}
    </form>
  )
}

// Reusable mini-component for the checklist items
function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 transition-colors duration-300",
      isValid ? "text-green-600" : "text-red-400"
    )}>
      {isValid ? <Check className="size-3" /> : <X className="size-3" />}
      <span>{text}</span>
    </div>
  )
}

