/**
 * Date and time formatting utilities for Brazilian locale
 */

/**
 * Formats a date/time string or Date object to Brazilian format
 * Format: DD/MM/YYYY HH:mm (e.g., "03/12/2025 14:30")
 *
 * @param date - Date string (ISO 8601) or Date object
 * @returns Formatted date/time string (e.g., "03/12/2025 14:30")
 */
export function formatDateTime(date: string | Date): string {
  let dateObj: Date;

  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Data inválida';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
