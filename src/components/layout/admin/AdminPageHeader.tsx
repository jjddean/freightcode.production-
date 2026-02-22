import React from 'react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    // Kept for backward compatibility with existing page usages.
    icon?: React.ElementType;
    children?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
    title,
    subtitle,
    actionLabel,
    onAction,
    children
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-slate-200/60 pb-8">
            <div className="flex items-start gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{title}</h1>
                    {subtitle && <div className="text-slate-500 text-xs mt-2 flex items-center">{subtitle}</div>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {children}
                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        size="sm"
                        className="bg-[#003057] hover:bg-[#004e8a] text-white shadow-md shadow-[#003057]/10 h-9 px-6 font-bold rounded-lg"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AdminPageHeader;
