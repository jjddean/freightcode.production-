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
  Wrench,
  Zap,
} from "lucide-react"
import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react"

import { useLocation, Link } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useStickyQueryData } from "@/hooks/useStickyQueryData"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { InstantQuoteWidget } from "@/components/widgets/InstantQuoteWidget"
import { ChatWidget } from "@/components/widgets/ChatWidget"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Intelligence",
    url: "/intelligence/forwarders",
    icon: Zap,
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
    title: "Tools",
    url: "/tools/hscode-lookup",
    icon: Wrench,
    items: [
      { title: "HS Code Check", url: "/tools/hscode-lookup" },
      { title: "Currency Converter", url: "/tools/currency-converter" },
      { title: "Port Codes", url: "/tools/hscode-lookup" },
      { title: "Tariff Calculator", url: "/tools/currency-converter" },
      { title: "API Key", url: "/api" },
    ],
  },
  {
    title: "Account",
    url: "/account",
    icon: Settings,
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

  const unreadCountQuery = useQuery(api.messages.unreadCount, user?.id ? { userId: user.id } : "skip");
  const unreadCount = useStickyQueryData("sidebar:messages:unread", unreadCountQuery, 0);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b-0 px-2 pt-1">
        <Link to="/dashboard" className="flex h-11 items-center px-4 mb-1">
          <BrandLogo size="lg" />
        </Link>
        <SidebarMenu className="pt-0 pb-0">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  className="size-8 shrink-0 group-data-[collapsible=icon]:hidden relative"
                  variant="outline"
                >
                  <IconMail className="size-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                  )}
                  <span className="sr-only">Inbox</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-auto p-0 border-none shadow-xl ml-2">
                <ChatWidget />
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <NavMain items={navMain} />
        <NavDocuments items={navDocuments} />
        <NavSecondary
          items={navSecondary.map((item) =>
            item.title === "Tools"
              ? { ...item, isActive: location.pathname.startsWith("/tools") }
              : item
          )}
        />
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border bg-sidebar">
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
