/**
 * Format a date to a readable date/time string
 */
export function formatDateTime(date: Date | string | null) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format a date to a readable date string (without time)
 */
export function formatDate(date: Date | string | null) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a currency value
 */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value || 0);
}

/**
 * Format a ABV (Alcohol By Volume) percentage
 */
export function formatAbv(value: number | null) {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('default', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Format an IBU value
 */
export function formatIbu(value: number | null) {
  if (value === null || value === undefined) return '';
  
  return value.toString();
}