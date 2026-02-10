import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';

interface GeoapifyAutocompleteProps {
    value: string;
    onChange: (value: string, details?: any) => void;
    placeholder?: string;
    className?: string;
    onFocus?: () => void;
}

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

export const GeoapifyAutocomplete: React.FC<GeoapifyAutocompleteProps> = ({
    value,
    onChange,
    placeholder,
    className,
    onFocus
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync internal state with external value prop
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced Fetch
    useEffect(() => {
        if (!inputValue || inputValue === value) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (inputValue.length < 3) return;

            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(inputValue)}&apiKey=${GEOAPIFY_KEY}&limit=5`
                );
                const data = await response.json();
                setSuggestions(data.features || []);
                setIsOpen(true);
            } catch (error) {
                console.error("Geoapify Autocomplete Error:", error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue, value]);

    const handleSelect = (feature: any) => {
        const formatted = feature.properties.formatted;
        setInputValue(formatted);
        onChange(formatted, feature);
        setIsOpen(false);
        setSuggestions([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setInputValue(newVal);
        onChange(newVal); // Allow free text input
        setIsOpen(true);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className={cn("pr-10", className)}
                    onFocus={() => {
                        onFocus?.();
                        if (suggestions.length > 0) setIsOpen(true);
                    }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-[9999] w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((feature: any, index: number) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(feature)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm flex items-start gap-2 border-b last:border-0 border-gray-50 transition-colors"
                        >
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="font-medium text-gray-900">{feature.properties.address_line1}</div>
                                <div className="text-gray-500 text-xs">{feature.properties.address_line2}</div>
                            </div>
                        </li>
                    ))}
                    <div className="px-2 py-1 bg-gray-50 text-[10px] text-right text-gray-400">
                        Powered by Geoapify
                    </div>
                </ul>
            )}
        </div>
    );
};
