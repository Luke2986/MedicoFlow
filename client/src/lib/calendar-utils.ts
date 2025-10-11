import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { it } from 'date-fns/locale'

export function getWeekDays(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // lunedì
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return { start, end }
}

export function formatWeekRange(date: Date) {
  const { start, end } = getWeekRange(date)
  return `${format(start, 'd MMM', { locale: it })} - ${format(end, 'd MMM yyyy', { locale: it })}`
}

export function getTimeSlots(startHour = 8, endHour = 20, interval = 30) {
  const slots = []
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += interval) {
      slots.push({
        hour,
        minutes,
        label: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      })
    }
  }
  return slots
}

export function getAppuntamentoStyle(stato: string) {
  const styles = {
    confermato: 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700 text-white',
    completato: 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700 text-white',
    cancellato: 'bg-gray-400 dark:bg-gray-600 border-gray-500 dark:border-gray-700 text-white',
    'no-show': 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-700 text-white'
  }
  return styles[stato as keyof typeof styles] || styles.confermato
}

export function checkConflict(
  newStart: Date,
  newEnd: Date,
  existingAppuntamenti: any[],
  excludeId?: string
) {
  return existingAppuntamenti.some(apt => {
    if (apt.id === excludeId) return false
    
    const aptStart = new Date(apt.dataOra)
    const aptEnd = new Date(aptStart.getTime() + apt.durata * 60000)
    
    return (newStart < aptEnd && newEnd > aptStart)
  })
}
