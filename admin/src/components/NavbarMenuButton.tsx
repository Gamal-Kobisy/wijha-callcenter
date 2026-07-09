import { Bot } from "lucide-react"

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon?: React.ElementType
}

export default function NavbarMenuButton({
  label = "Models",
  icon: Icon = Bot,
  ...props
}: SidebarMenuButtonProps) {
  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-sidebar="menu-button"
      data-size="default"
      tabIndex={0}
      aria-disabled="false"
      className="peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm"
      {...props}
    >
      {/* Dynamic Icon */}
      <Icon />

      {/* Label Text */}
      <span>{label}</span>

    </button>
  )
}