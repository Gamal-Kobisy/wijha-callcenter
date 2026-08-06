import { BadgeCheck, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext.tsx"
// @ts-ignore
import defaultAvatar from "../assets/avatar.jpg"

interface SidebarUserButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name?: string
  email?: string
  avatarSrc?: string
  onLogout?: () => void,
  onAccountClick?: () => void
}

export default function NavbarUserButton({
  name,
  email,
  avatarSrc,
  onLogout,
  onAccountClick,
  ...props
}: SidebarUserButtonProps) {
  // 1. Hook directly into the AuthContext
  const { user, logout } = useAuth()

  // 2. Safely fallback to Context data if props aren't provided by the parent
  const displayName = name || user?.name || "Loading..."
  const displayEmail = email || user?.email || ""
  const displayAvatar = avatarSrc || user?.avatarUrl || defaultAvatar

  // Default actions if not explicitly passed
  const handleLogout = onLogout || logout
  const handleAccountClick = onAccountClick || (() => { window.location.href = "/account" })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="peer/menu-button group/menu-button flex w-auto ml-auto items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-colors focus-visible:ring-2 h-12 text-sm"
          {...props}
        >
          <span className="group/avatar relative flex size-8 shrink-0 select-none h-8 w-8 rounded-lg bg-muted">
            <img
              alt={displayName}
              className="aspect-square size-full rounded-full object-cover"
              src={displayAvatar}
              onError={(e) => { e.currentTarget.src = defaultAvatar }} // Failsafe if image breaks
            />
          </span>

          <div className="grid flex-1 text-left text-sm leading-tight hover:cursor-pointer">
            <span className="truncate font-medium">{displayName}</span>
            <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border bg-background shadow-md"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <span className="relative flex size-8 shrink-0 select-none rounded-lg bg-muted">
              <img
                alt={displayName}
                className="aspect-square size-full rounded-full object-cover"
                src={displayAvatar}
                onError={(e) => { e.currentTarget.src = defaultAvatar }}
              />
            </span>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer transition-colors focus:bg-slate-200 focus:text-slate-900"
            onClick={handleAccountClick}
          >
            <BadgeCheck className="mr-2 size-4" />
            Account
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          className="cursor-pointer transition-colors focus:bg-slate-200 focus:text-slate-900"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}