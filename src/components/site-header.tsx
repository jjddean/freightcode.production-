import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import NotificationCenter from "@/components/ui/notification-center"
import { OrganizationSwitcher } from "@clerk/clerk-react"
import { useLocation } from "react-router-dom"

// Page title mapping
const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/shipments')) return 'Shipments'
  if (pathname.startsWith('/bookings')) return 'Bookings'
  if (pathname.startsWith('/quotes')) return 'Quotes'
  if (pathname.startsWith('/payments')) return 'Payments'
  if (pathname.startsWith('/documents')) return 'Documents'
  if (pathname.startsWith('/compliance')) return 'Compliance'
  if (pathname.startsWith('/reports')) return 'Reports'
  if (pathname.startsWith('/account')) return 'Account'
  if (pathname.startsWith('/api')) return 'Developer API'
  return 'Dashboard'
}

export function SiteHeader() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-[100] flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-lg font-semibold">{getPageTitle(location.pathname)}</h1>
      <div className="ml-auto flex items-center gap-4">
        <NotificationCenter />
        <OrganizationSwitcher hidePersonal={false} />
      </div>
    </header>
  )
}
