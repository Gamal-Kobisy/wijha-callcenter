import { Check, X } from "lucide-react"

// We export this helper function so you can import it into your Forms
// to check if the form is allowed to submit!
export const checkPasswordValidity = (password: string) => {
  return [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "At least 1 lowercase letter", met: /[a-z]/.test(password) },
    { text: "At least 1 uppercase letter", met: /[A-Z]/.test(password) },
    { text: "At least 1 number or special char", met: /[\d!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
}

export default function PasswordRequirements({ password = "" }: { password?: string }) {
  const requirements = checkPasswordValidity(password)

  return (
    // Changed from flex-col to grid-cols-2 for the 2x2 layout
    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-1">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-start gap-1.5 text-xs">
          {req.met ? (
            <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <X className="size-3.5 text-destructive shrink-0 mt-0.5" />
          )}
          <span className={`${req.met ? "text-slate-700" : "text-muted-foreground"} leading-tight`}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  )
}