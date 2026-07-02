import {ArrowLeft, Check, CheckCircle2, GalleryVerticalEnd, KeyRound, Mail, ShieldCheck, X} from "lucide-react"
import { useState } from "react";
// @ts-ignore
import forgotBg from "../assets/forgot_bg.png";
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Link } from "react-router-dom"
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  // Step 1: Email | Step 2: Code | Step 3: New Password | Step 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Form Data States
  const [email, setEmail] = useState("")
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI States
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // --- Password Validation Logic ---
  const passwordRequirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "At least 1 lowercase letter", met: /[a-z]/.test(password) },
    { text: "At least 1 uppercase letter", met: /[A-Z]/.test(password) },
    { text: "At least 1 number or special character", met: /[\d!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
  const isPasswordValid = passwordRequirements.every((req) => req.met)

  // --- OTP Input Logic ---
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];

    // Handle user pasting a full 6-digit code
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split("");
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) newOtpValues[index + i] = pastedData[i];
      }
      setOtpValues(newOtpValues);
      const focusIndex = Math.min(index + pastedData.length, 5);
      document.getElementById(`otp-${focusIndex}`)?.focus();
      return;
    }

    // Handle single character typing
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-advance to next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Auto-backspace to previous input
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  // --- Step 1: Request Code ---
  const handleRequestCode = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsLoading(true)

    try {
      const response = await apiFetch("/api/check-email", {
        method: "POST",
        body: JSON.stringify({ email })
      })

      if (!response.ok) throw new Error("Could not find an account with that email.")
      setStep(2)
    } catch (err) {
      setErrorMessage("Could not find an account with that email.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- Step 2: Verify 6-Digit Code ---
  const handleVerifyCode = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsLoading(true)

    const finalOtp = otpValues.join("")

    try {
      if (finalOtp.length !== 6) throw new Error("Code must be 6 digits")
      const response = await apiFetch("/api/code", {
        method: "POST",
        body: JSON.stringify({ finalOtp })
      })
      if(!response.ok) throw new Error("Code is incorrect.")
      setStep(3)
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or expired code.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- Step 3: Reset Password ---
  const handleResetPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!isPasswordValid) {
      setErrorMessage("Please meet all password requirements.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const response = await apiFetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ password })
      })
      if(!response.ok) throw new Error()
      setStep(4)
    } catch (err) {
      setErrorMessage("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-background">
      {/* Left Column: The Feature Image */}
      <div className="relative hidden lg:block bg-slate-200">
        <img
          src={forgotBg}
          alt="Wijha West Workspace"
          className="absolute inset-0 h-full w-full object-cover shadow-l"
        />
      </div>

      {/* Right Column: The Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <a href="#" className="flex items-center gap-3 font-semibold text-lg text-[hsl(var(--tertiary))]">
            Wijha West
            <div className="flex size-8 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md">
              <GalleryVerticalEnd className="size-5" />
            </div>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex flex-col gap-6">
              <FieldGroup>

                {errorMessage && (
                  <div className="w-full rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200 text-center mb-2">
                    {errorMessage}
                  </div>
                )}

                {/* ==========================================
                    STEP 1: ENTER EMAIL
                    ========================================== */}
                {step === 1 && (
                  <form onSubmit={handleRequestCode} className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2 text-center mb-2">
                      <div className="p-3 bg-[hsl(var(--secondary))] rounded-full mb-2">
                        <Mail className="size-6 text-[hsl(var(--primary))]" />
                      </div>
                      <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">Forgot Password</h1>
                      <p className="text-sm text-balance text-muted-foreground">
                        Enter your email address and we'll send you a 6-digit recovery code.
                      </p>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </Field>

                    <Button type="submit" disabled={isLoading} className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--tertiary))]">
                      {isLoading ? "Sending..." : "Send Recovery Code"}
                    </Button>
                  </form>
                )}

                {/* ==========================================
                    STEP 2: ENTER 6-DIGIT CODE
                    ========================================== */}
                {step === 2 && (
                  <form onSubmit={handleVerifyCode} className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2 text-center mb-2">
                      <div className="p-3 bg-[hsl(var(--secondary))] rounded-full mb-2">
                        <ShieldCheck className="size-6 text-[hsl(var(--primary))]" />
                      </div>
                      <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">Check Your Email</h1>
                      <p className="text-sm text-balance text-muted-foreground">
                        We sent a 6-digit code to <span className="font-semibold text-slate-800">{email}</span>
                      </p>
                    </div>

                    <Field>
                      <FieldLabel>6-Digit Code</FieldLabel>
                      {/* The 6-Box Grid */}
                      <div className="flex justify-between gap-2 mt-2">
                        {otpValues.map((digit, index) => (
                          <Input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength={6} // Allows pasting multiple chars
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            disabled={isLoading}
                            className="w-12 h-14 text-center text-xl font-bold rounded-lg shadow-sm"
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                    </Field>

                    <Button type="submit" disabled={isLoading || otpValues.join("").length !== 6} className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--tertiary))]">
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>

                    <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-[hsl(var(--primary))] underline underline-offset-4 text-center mt-2">
                      Wrong email? Try again
                    </button>
                  </form>
                )}

                {/* ==========================================
                    STEP 3: NEW PASSWORD
                    ========================================== */}
                {step === 3 && (
                  <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2 text-center mb-2">
                      <div className="p-3 bg-[hsl(var(--secondary))] rounded-full mb-2">
                        <KeyRound className="size-6 text-[hsl(var(--primary))]" />
                      </div>
                      <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">Set New Password</h1>
                      <p className="text-sm text-balance text-muted-foreground">
                        Please choose a strong password to secure your account.
                      </p>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </Field>

                    {/* Password Requirements Checklist */}
                    <div className="flex flex-col gap-2 mt-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {req.met ? (
                            <Check className="size-4 text-green-500" />
                          ) : (
                            <X className="size-4 text-red-500" />
                          )}
                          <span className={req.met ? "text-slate-700" : "text-red-500"}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Field className="mt-2">
                      <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </Field>

                    <Button type="submit" disabled={isLoading || !isPasswordValid || !confirmPassword} className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--tertiary))] mt-2">
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                )}

                {/* ==========================================
                    STEP 4: SUCCESS
                    ========================================== */}
                {step === 4 && (
                  <div className="flex flex-col items-center text-center gap-4 py-4">
                    <CheckCircle2 className="size-16 text-green-500 mb-2" />
                    <h1 className="text-2xl font-bold text-slate-900">Password Reset!</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your password has been successfully updated. You can now log in with your new credentials.
                    </p>
                    <Link to="/login" className="w-full">
                      <Button className="w-full bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--tertiary))]">
                        Back to Login
                      </Button>
                    </Link>
                  </div>
                )}

              </FieldGroup>

              {step < 4 && (
                <div className="flex justify-center mt-4 border-t border-slate-100 pt-6">
                  <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--tertiary))] hover:underline underline-offset-4">
                    <ArrowLeft className="size-4" />
                    Back to login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}