import React, { useState } from 'react';
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
    Inbox,
    ChevronDown,
    ChevronRight,
    BarChart3,
    Zap,
    MessageSquare
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { BrandLogo } from '../../ui/brand-logo';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { cn } from '../../../lib/utils';
import { useStickyQueryData } from '@/hooks/useStickyQueryData';

interface NavItem {
    name: string;
    href?: string;
    icon: any;
    badge?: number;
    subItems?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
    { name: 'Command Center', href: '/admin', icon: LayoutDashboard },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Documents', href: '/admin/documents', icon: FileText },
    { name: 'Shipments', href: '/admin/shipments', icon: Truck },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    {
        name: 'Compliance',
        icon: ShieldCheck,
        subItems: [
            { name: 'KYC Approvals', href: '/admin/compliance' },
            { name: 'Audit Logs', href: '/admin/audit' },
            { name: 'Customs Queue', href: '/admin/customs' },
        ]
    },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminSidebar = () => {
    const location = useLocation();
    const unreadCountQuery = useQuery(api.messages.adminUnreadCount);
    const unreadCount = useStickyQueryData("admin:sidebar:unread", unreadCountQuery, 0);
    const [isComplianceOpen, setIsComplianceOpen] = useState(
        navigation.find(n => n.name === 'Compliance')?.subItems?.some(sub => location.pathname === sub.href) || false
    );

    const navigationWithBadges = navigation.map(item => {
        if (item.name === 'Messages') {
            return { ...item, badge: unreadCount > 0 ? unreadCount : undefined };
        }
        return item;
    });

    return (
        <div className="hidden md:flex flex-col w-64 bg-[#0a1628] border-r border-[#1e3a5f]/30 h-screen fixed left-0 top-0 text-white z-50">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-[#1e3a5f]/20">
                <BrandLogo inverted size="lg" />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <nav className="space-y-0.5">
                    {navigationWithBadges.map((item) => {
                        const isCompliance = item.name === 'Compliance';

                        if (isCompliance) {
                            const isAnySubActive = item.subItems?.some(sub => location.pathname === sub.href);

                            return (
                                <div key={item.name} className="space-y-0.5">
                                    <button
                                        onClick={() => setIsComplianceOpen(!isComplianceOpen)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] font-bold rounded-md transition-all uppercase tracking-tight",
                                            isAnySubActive
                                                ? 'bg-[#1e3a5f]/40 text-cyan-400'
                                                : 'text-slate-400 hover:text-white hover:bg-[#1e3a5f]/20'
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <item.icon className={cn("h-4 w-4 mr-2.5", isAnySubActive ? 'text-cyan-400' : 'text-slate-500')} />
                                            {item.name}
                                        </div>
                                        {isComplianceOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                    </button>

                                    {isComplianceOpen && (
                                        <div className="pl-9 space-y-0.5 mt-0.5">
                                            {item.subItems?.map((sub) => {
                                                const isSubActive = location.pathname === sub.href;
                                                return (
                                                    <NavLink
                                                        key={sub.name}
                                                        to={sub.href}
                                                        className={cn(
                                                            "flex items-center py-1.5 text-[11px] font-medium transition-all opacity-80 hover:opacity-100",
                                                            isSubActive ? 'text-cyan-400' : 'text-slate-500 hover:text-white'
                                                        )}
                                                    >
                                                        {sub.name}
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        if (!item.href) return null;

                        const isActive = location.pathname === item.href;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) => cn(
                                    "flex items-center justify-between px-2.5 py-1.5 text-[12px] font-bold rounded-md transition-all uppercase tracking-tight",
                                    isActive
                                        ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-[#1e3a5f]/20'
                                )}
                            >
                                <div className="flex items-center">
                                    <item.icon className={cn("h-4 w-4 mr-2.5", isActive ? 'text-white' : 'text-slate-500')} />
                                    {item.name}
                                </div>
                                {item.badge ? (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-white/10">
                                        {item.badge}
                                    </span>
                                ) : null}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="p-4 border-t border-[#1e3a5f]/20 bg-[#07111d]">
                <div className="flex items-center gap-3">
                    <UserButton afterSignOutUrl="/" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">Admin Terminal</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">System Root</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;
