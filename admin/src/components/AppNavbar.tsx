import { Menu, BarChart3, Target, Headset, BadgeCheck, LogOut, LayoutDashboard } from "lucide-react"
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

  // Helper to map icons to specific link names
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "dashboard": return <LayoutDashboard className="size-5 shrink-0" />
      case "reports": return <BarChart3 className="size-5 shrink-0" />
      case "leads": return <Target className="size-5 shrink-0" />
      case "agents": return <Headset className="size-5 shrink-0" />
      default: return <BarChart3 className="size-5 shrink-0" />
    }
  }

  const NavLink = ({ name }: { name: string }) => (
    <Link
      to={`/${name.toLowerCase()}`}
      className={`flex items-center gap-2 rounded-md font-medium transition-all duration-200 px-5 py-2.5 text-base ${
        isActive(`/${name.toLowerCase()}`)
          ? 'bg-primary/10 text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]'
          : 'text-muted-foreground hover:bg-primary hover:text-primary-foreground'
      }`}
    >
      {getIcon(name)} {name}
    </Link>
  )

  const MobileNavLink = ({ name }: { name: string }) => (
    <DropdownMenuItem asChild className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
      <Link to={`/${name.toLowerCase()}`} className="flex items-center gap-3 w-full text-base">
        {getIcon(name)} {name}
      </Link>
    </DropdownMenuItem>
  )

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center shrink-0 w-auto lg:w-64">
        <Logo />
      </div>

      <nav className="hidden md:flex flex-1 items-center justify-center gap-4">
        {link1Name && <NavLink name={link1Name} />}
        {link2Name && <NavLink name={link2Name} />}
        {link3Name && <NavLink name={link3Name} />}
      </nav>

      <div className="flex items-center justify-end shrink-0 gap-2 sm:gap-4 w-auto lg:w-64">
        <div className="hidden md:block w-40 sm:w-auto lg:w-full">
          <NavbarUserButton name="Youssef Elkhatib" email="admin@wijhawest.com" avatarSrc={avatar} />
        </div>

        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-md text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors outline-none">
                <Menu className="size-7" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 mt-2 border-border bg-background shadow-md">
              <DropdownMenuItem className="pointer-events-none">
                <img alt="Avatar" className="aspect-square size-10 rounded-lg object-cover bg-muted" src={avatar} />
                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-medium">Youssef Elkhatib</span>
                  <span className="truncate text-xs text-muted-foreground">admin@wijhawest.com</span>
                </div>
              </DropdownMenuItem>

              {link1Name && <MobileNavLink name={link1Name} />}
              {link2Name && <MobileNavLink name={link2Name} />}
              {link3Name && <MobileNavLink name={link3Name} />}

              <DropdownMenuSeparator className="my-2 bg-border" />

              <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <BadgeCheck className="mr-3 size-5" /> Account
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-primary focus:text-primary-foreground p-3">
                <LogOut className="mr-3 size-5" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}