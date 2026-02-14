import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Truck,
    FileText,
    Users,
    Settings,
    ShieldCheck,
    CreditCard,
    History,
    Inbox
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { BrandLogo } from '../../ui/brand-logo';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/* 
  Simplified Flat Navigation
  Core high-frequency items only.
*/

const navigation: { name: string; href: string; icon: any; badge?: number }[] = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Messages', href: '/admin/messages', icon: Inbox, badge: 3 }, // Placeholder badge
    { name: 'Bookings', href: '/admin/bookings', icon: FileText },
    { name: 'Shipments', href: '/admin/shipments', icon: Truck },
    { name: 'Documents', href: '/admin/documents', icon: FileText },
    { name: 'Customers', href: '/admin/customers', icon: Users }, // Waitlist moved here
    { name: 'Audit Logs', href: '/admin/audit', icon: ShieldCheck },
    { name: 'Finance', href: '/admin/payments', icon: CreditCard },
    { name: 'Compliance', href: '/admin/compliance', icon: ShieldCheck },
    { name: 'Customs Queue', href: '/admin/customs', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar = () => {
    const location = useLocation();
    const unreadCount = useQuery(api.messages.adminUnreadCount) || 0;

    const navigationWithBadges = navigation.map(item => {
        if (item.name === 'Messages') {
            return { ...item, badge: unreadCount > 0 ? unreadCount : undefined };
        }
        return item;
    });

    return (
        <div className="hidden md:flex flex-col w-56 bg-slate-950 border-r border-slate-800/50 h-screen fixed left-0 top-0 text-slate-300 z-50">
            {/* Logo Area - Compact */}
            <div className="h-14 flex items-center px-4 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm justify-between">
                <BrandLogo inverted size="sm" />
                <div className="flex items-center gap-2 text-white opacity-60">
                    <ShieldCheck className="h-4 w-4 text-primary-400" />
                    <span className="font-bold tracking-tight text-[10px] uppercase">Admin</span>
                </div>
            </div>

            {/* Navigation - Flat & Dense */}
            <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                <nav className="space-y-0.5">
                    {navigationWithBadges.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) => `
                                    flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                                    ${isActive
                                        ? 'bg-primary-500/10 text-primary-400 shadow-sm shadow-primary-900/10'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                                `}
                            >
                                <div className="flex items-center">
                                    <item.icon className={`h-4 w-4 mr-3 ${isActive ? 'text-primary-400' : 'text-slate-500'}`} />
                                    {item.name}
                                </div>
                                {item.badge ? (
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-primary-500/20 text-primary-300' : 'bg-slate-800 text-slate-500'}`}>
                                        {item.badge}
                                    </span>
                                ) : null}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* User Footer - Minimal */}
            <div className="p-3 border-t border-slate-800/50 bg-slate-900/30">
                <div className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <UserButton afterSignOutUrl="/" appearance={{
                        elements: {
                            avatarBox: "w-7 h-7 ring-1 ring-slate-700"
                        }
                    }} />
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs font-medium text-white truncate">Administrator</p>
                        <p className="text-[10px] text-primary-400 truncate flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary-400"></span>
                            Online
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;
