import React from 'react';
import { Button } from '@/components/ui/button';

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ElementType;
    children?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
    title,
    subtitle,
    actionLabel,
    onAction,
    icon: Icon,
    children
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                        <Icon className="h-6 w-6" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-primary-800 tracking-tight">{title}</h1>
                    {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-3">
                {children}
                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        size="sm"
                        className="bg-primary hover:bg-primary-700 text-white shadow-sm"
                    >
                        {actionLabel}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default AdminPageHeader;
