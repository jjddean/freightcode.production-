import React from 'react';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    FileText,
    Package,
    Send,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';

export type StatusType =
    | 'success'  // green: delivered, paid, approved, cleared
    | 'warning'  // yellow/amber: pending, review, sent, in-transit
    | 'error'    // red: rejected, high-risk, overdue, canceled
    | 'info'     // blue: in-progress, routing
    | 'neutral'; // slate: draft, none, system

interface StatusBadgeProps {
    status: string;
    label?: string;
    type?: StatusType;
    icon?: boolean;
    className?: string;
    dot?: boolean;
}

const statusMap: Record<string, { type: StatusType; label: string; Icon: any }> = {
    // Shipment Statuses
    'delivered': { type: 'success', label: 'Delivered', Icon: CheckCircle2 },
    'cleared': { type: 'success', label: 'Cleared', Icon: ShieldCheck },
    'paid': { type: 'success', label: 'Paid', Icon: CheckCircle2 },
    'in transit': { type: 'info', label: 'In Transit', Icon: Package },
    'loading': { type: 'warning', label: 'Loading', Icon: Clock },
    'departed': { type: 'info', label: 'Departed', Icon: Send },
    'pending': { type: 'warning', label: 'Pending', Icon: Clock },
    'booking confirmed': { type: 'success', label: 'Confirmed', Icon: CheckCircle2 },

    // Custom/Risk Statuses
    'filed': { type: 'success', label: 'Filed', Icon: FileText },
    'review': { type: 'warning', label: 'Review', Icon: ShieldAlert },
    'high': { type: 'error', label: 'High Risk', Icon: AlertTriangle },
    'medium': { type: 'warning', label: 'Medium Risk', Icon: AlertCircle },
    'safe': { type: 'success', label: 'Safe', Icon: ShieldCheck },

    // Document Statuses
    'signed': { type: 'success', label: 'Signed', Icon: CheckCircle2 },
    'sent': { type: 'warning', label: 'Sent', Icon: Send },
    'draft': { type: 'neutral', label: 'Draft', Icon: FileText },

    // Payment Statuses
    'overdue': { type: 'error', label: 'Overdue', Icon: AlertCircle },
    'canceled': { type: 'error', label: 'Canceled', Icon: AlertCircle },
};

export const StatusBadge = ({
    status,
    label,
    type,
    icon = true,
    className,
    dot = false
}: StatusBadgeProps) => {
    const normStatus = status?.toLowerCase();
    const config = statusMap[normStatus] || {
        type: type || 'neutral',
        label: status,
        Icon: Clock
    };

    const displayLabel = label || config.label;

    const styles = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-100",
        warning: "bg-amber-50 text-amber-700 border-amber-100",
        error: "bg-rose-50 text-rose-700 border-rose-100",
        info: "bg-blue-50 text-blue-700 border-blue-100",
        neutral: "bg-slate-50 text-slate-600 border-slate-200"
    };

    const dotStyles = {
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-rose-500",
        info: "bg-blue-500",
        neutral: "bg-slate-400"
    };

    const Icon = config.Icon;

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all duration-200",
            styles[config.type],
            className
        )}>
            {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyles[config.type])} />}
            {!dot && icon && <Icon className="w-3 h-3 shrink-0" />}
            <span className="truncate">{displayLabel}</span>
        </div>
    );
};
