
import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showLabel?: boolean;
    inverted?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
    className,
    size = 'md',
    showLabel = true,
    inverted = false
}) => {
    const sizeClasses = {
        sm: 'text-base',
        md: 'text-[22px]',
        lg: 'text-2xl',
        xl: 'text-3xl'
    };

    const regSizeClasses = {
        sm: 'text-[10px] -translate-y-[2px] ml-[-0.5px]',
        md: 'text-[13px] -translate-y-[5px] ml-[-1px]',
        lg: 'text-[15px] -translate-y-[6px] ml-[-1.5px]',
        xl: 'text-[18px] -translate-y-[7px] ml-[-2px]'
    };

    return (
        <div
            className={cn(
                "flex items-baseline whitespace-nowrap group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full",
                inverted ? "text-white" : "text-[#003057]",
                className
            )}
        >
            <span className={cn("font-[650] tracking-tight group-data-[collapsible=icon]:hidden", sizeClasses[size])}>freight</span>
            <span className={cn("font-normal tracking-tight group-data-[collapsible=icon]:hidden", sizeClasses[size])}>code</span>
            <span className={cn(
                "font-normal self-baseline transition-all duration-300",
                regSizeClasses[size],
                "group-data-[collapsible=icon]:text-[18px] group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:-translate-y-[2px]"
            )}>
                ®
            </span>
        </div>
    );
};
