import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function useFormatters() {
  function formatCurrency(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('el-GR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return `Today, ${format(date, 'HH:mm')}`
    if (isYesterday(date)) return `Yesterday, ${format(date, 'HH:mm')}`
    return format(date, 'dd MMM yyyy, HH:mm')
  }

  function formatDateShort(dateStr: string): string {
    return format(new Date(dateStr), 'dd MMM yyyy')
  }

  function formatTime(dateStr: string): string {
    return format(new Date(dateStr), 'HH:mm')
  }

  function formatRelative(dateStr: string): string {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  }

  function formatQuantity(qty: number, unit: string): string {
    const rounded = Math.round(qty * 10) / 10
    return `${rounded} ${unit}`
  }

  function formatPercent(value: number, total: number): string {
    if (total === 0) return '0%'
    return `${Math.round((value / total) * 100)}%`
  }

  return {
    formatCurrency,
    formatDate,
    formatDateShort,
    formatTime,
    formatRelative,
    formatQuantity,
    formatPercent,
  }
}
