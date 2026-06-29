/**
 * Formatting utilities
 * Price, phone, date formatters used across the app
 */

/** Format price as USD currency string */
export function formatPrice(price: number | undefined | null): string {
  if (price == null || isNaN(price)) return '$0.00';
  return `$${price.toFixed(2)}`;
}

/** Format savings percentage */
export function formatSavingsPercent(percent: number | undefined | null): string {
  if (percent == null || isNaN(percent)) return '0%';
  return `${Math.round(percent)}%`;
}

/** Format phone number as (XXX) XXX-XXXX */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/** Format date string to readable format */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Capitalize first letter of each word */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}

/** Format slug to human readable (e.g., "lisinopril-5mg" -> "Lisinopril 5mg") */
export function slugToName(slug: string): string {
  return titleCase(slug.replace(/-/g, ' '));
}
