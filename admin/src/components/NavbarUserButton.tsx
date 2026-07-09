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

interface SidebarUserButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name?: string
  email?: string
  avatarSrc?: string
}

export default function NavbarUserButton({
  name = "Youssef Elkhatib",
  email = "admin@wijhawest.com",
  avatarSrc,
  ...props
}: SidebarUserButtonProps) {
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
              alt={name}
              className="aspect-square size-full rounded-full object-cover"
              src={avatarSrc}
            />
          </span>

          <div className="grid flex-1 text-left text-sm leading-tight hover:cursor-pointer">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
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
                alt={name}
                className="aspect-square size-full rounded-full object-cover"
                src={avatarSrc}
              />
            </span>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-slate-200 focus:text-slate-900">
            <BadgeCheck className="mr-2 size-4" />
            Account
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem className="cursor-pointer transition-colors focus:bg-slate-200 focus:text-slate-900">
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}