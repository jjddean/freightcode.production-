import * as React from "react"
import {
  LayoutDashboard,
  Ship,
  Package,
  FileText,
  CreditCard,
  File,
  ShieldCheck,
  BarChart3,
  Settings,
  Terminal,
} from "lucide-react"
import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react"

import { useLocation } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"

import { NavMain } from "@/components/nav-main"
import { NavDocuments } from "@/components/nav-documents"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/ui/brand-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { InstantQuoteWidget } from "@/components/widgets/InstantQuoteWidget"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Shipments",
    url: "/shipments",
    icon: Package,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: Package,
  },
  {
    title: "Quotes",
    url: "/quotes",
    icon: FileText,
  },
]

const navDocuments = [
  {
    name: "Payments",
    url: "/payments",
    icon: CreditCard,
  },
  {
    name: "Documents",
    url: "/documents",
    icon: File,
  },
  {
    name: "Compliance",
    url: "/compliance",
    icon: ShieldCheck,
  },
  {
    name: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
]

const navSecondary = [
  {
    title: "Account",
    url: "/account",
    icon: Settings,
  },
  {
    title: "Dev API",
    url: "/api",
    icon: Terminal,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const location = useLocation()

  const userData = user
    ? {
      name: user.fullName || user.firstName || "User",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatar: user.imageUrl || "",
    }
    : {
      name: "Guest",
      email: "",
      avatar: "",
    }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b-0 px-2 pt-2">
        <a href="/dashboard" className="flex items-center px-4 h-12 mb-2">
          <BrandLogo />
        </a>
        <SidebarMenu className="pb-0">
          <SidebarMenuItem className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Quote"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <IconCirclePlusFilled className="size-4" />
                  <span>Quick Quote</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="w-[380px] p-0 bg-transparent border-none shadow-none text-white">
                <VisuallyHidden>
                  <DialogTitle>Quick Rate Search</DialogTitle>
                  <DialogDescription>Instantly check live market rates for your shipments.</DialogDescription>
                </VisuallyHidden>
                <div className="flex justify-center">
                  <InstantQuoteWidget />
                </div>
              </DialogContent>
            </Dialog>
            <Button
              size="icon"
              className="size-8 shrink-0 group-data-[collapsible=icon]:hidden"
              variant="outline"
            >
              <IconMail className="size-4" />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain items={navMain} />
        <NavDocuments items={navDocuments} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
