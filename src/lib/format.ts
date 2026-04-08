import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns'
import { ptPT } from 'date-fns/locale'

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy', { locale: ptPT })
}

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy HH:mm', { locale: ptPT })
}

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm', { locale: ptPT })
}

export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM', { locale: ptPT })
}

export const isTodayDate = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isToday(d)
}

export const isThisWeekDate = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isThisWeek(d)
}

export const isThisMonthDate = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isThisMonth(d)
}

export const parseDate = (date: string): Date => {
  return parseISO(date)
}
