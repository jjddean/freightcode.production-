/**
 * Central utility for currency formatting and amount standardization.
 * Follows the "Payments Page" style: semibold, gray-900, and locale-aware.
 */

export const CURRENCY_CONFIG = {
    GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
    USD: { symbol: '$', code: 'USD', locale: 'en-US' },
    EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
};

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * Formats a numeric amount into a localized currency string.
 */
export function formatCurrency(
    amount: number | string,
    currency: CurrencyCode = 'GBP',
    options: Intl.NumberFormatOptions = {}
): string {
    const numericAmount = typeof amount === 'string' ? parseCurrencyString(amount) : amount;

    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
        style: 'currency',
        currency: CURRENCY_CONFIG[currency].code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
    }).format(numericAmount);
}

/**
 * Parses a currency string (e.g. "$1,245.50" or "£500") into a raw number.
 */
export function parseCurrencyString(value: string): number {
    if (!value) return 0;
    // Remove currency symbols and commas
    const cleanValue = value.replace(/[£$€,]/g, '').trim();
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Mock currency conversion for future-proofing.
 * Currently returns the amount as-is.
 */
export function convertCurrency(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode
): number {
    // In a real scenario, this would fetch latest rates
    // For now, it's a 1:1 placeholder
    return amount;
}
