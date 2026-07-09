import { LoginForm } from "@/components/login-form"
// @ts-ignore
import loginBg from "../assets/login_bg.png"
import Logo from "@/components/Logo.tsx";
export default function LoginPage() {
  return (
    // bg-background pulls the off-white color from your index.css
    <div className="grid min-h-svh lg:grid-cols-2 bg-background animate-in fade-in zoom-in-[0.97] duration-500 ease-out">

      {/* Left Column: The Form */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right Column: The Feature Image */}
      <div className="relative hidden lg:block bg-slate-200">
        <img
          src={loginBg}
          alt="Wijha West Workspace"
          className="absolute inset-0 h-full w-full object-cover shadow-l"
        />
      </div>

    </div>
  )
}