import { Menu, BarChart3, Target, Headset, BadgeCheck, LogOut } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import Logo from "@/components/Logo"
import NavbarUserButton from "@/components/NavbarUserButton.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// @ts-ignore
import avatar from "../assets/avatar.jpg"

interface AppNavbarProps {
  link1Name?: string
  link2Name?: string
  link3Name?: string
}

export default function AppNavbar({
  link1Name = "Reports",
  link2Name = "Leads",
  link3Name = "Agents",
}: AppNavbarProps) {
  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  const DesktopNavLinks = () => (
    <>
      <Link
        to={`/${link1Name?.toLowerCase()}`}
        className={`flex items-center gap-2 rounded-md font-medium transition-all duration-200 px-5 py-2.5 text-base ${
          isActive('/reports')
            ? 'bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]'
            : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        <BarChart3 className="size-5 shrink-0" /> {link1Name}
      </Link>
      <Link
        to={`/${link2Name?.toLowerCase()}`}
        className={`flex items-center gap-2 rounded-md font-medium transition-all duration-200 px-5 py-2.5 text-base ${
          isActive('/leads')
            ? 'bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]'
            : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        <Target className="size-5 shrink-0" /> {link2Name}
      </Link>
      <Link
        to={`/${link3Name?.toLowerCase()}`}
        className={`flex items-center gap-2 rounded-md font-medium transition-all duration-200 px-5 py-2.5 text-base ${
          isActive('/agents')
            ? 'bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]'
            : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
        }`}
      >
        <Headset className="size-5 shrink-0" /> {link3Name}
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border bg-background px-4 sm:px-6">

      {/* Left: Logo */}
      <div className="flex items-center shrink-0 w-auto lg:w-64">
        <Logo />
      </div>

      {/* Center: Desktop Navigation (Hidden on mobile) */}
      <nav className="hidden md:flex flex-1 items-center justify-center gap-4">
        <DesktopNavLinks />
      </nav>

      {/* Right: User Menu & Mobile Hamburger */}
      <div className="flex items-center justify-end shrink-0 gap-2 sm:gap-4 w-auto lg:w-64">

        {/* --- DESKTOP USER BUTTON --- */}
        {/* Hidden on mobile, visible on medium screens and up */}
        <div className="hidden md:block w-40 sm:w-auto lg:w-full">
          <NavbarUserButton
            name="Youssef Elkhatib"
            email="admin@wijhawest.com"
            avatarSrc={avatar}
          />
        </div>

        {/* --- MOBILE HAMBURGER MENU --- */}
        {/* Visible only on mobile screens */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors outline-none">
                <Menu className="size-7" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 mt-2 border-border bg-background shadow-md">
              <DropdownMenuItem>
                <img
                  alt="Youssef Elkhatib"
                  className="aspect-square size-10 rounded-lg object-cover bg-muted"
                  src={avatar}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Youssef Elkhatib</span>
                  <span className="truncate text-xs text-muted-foreground">admin@wijhawest.com</span>
                </div>
              </DropdownMenuItem>

              {/* Mobile Navigation Links */}
              <DropdownMenuItem asChild className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <Link to="/reports" className="flex items-center gap-3 w-full text-base">
                  <BarChart3 className="size-5" /> {link1Name}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <Link to="/leads" className="flex items-center gap-3 w-full text-base">
                  <Target className="size-5" /> {link2Name}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <Link to="/agents" className="flex items-center gap-3 w-full text-base">
                  <Headset className="size-5" /> {link3Name}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2 bg-border" />

              {/* Mobile Account & Logout Actions */}
              <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <BadgeCheck className="mr-3 size-5" />
                <span className="text-base">Account</span>
              </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <LogOut className="mr-3 size-5" />
                <span className="text-base">Log out</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  )
}