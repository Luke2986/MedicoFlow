import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import { getWeekDays, formatWeekRange, getTimeSlots, getAppuntamentoStyle } from '@/lib/calendar-utils'
import { Button } from '@/components/ui/button'

interface WeekCalendarProps {
  appuntamenti: any[]
  currentDate: Date
  onAppuntamentoClick: (appuntamento: any) => void
  onSlotClick: (date: Date, hour: number, minutes: number) => void
  onWeekChange: (date: Date) => void
}

export default function WeekCalendar({
  appuntamenti,
  currentDate,
  onAppuntamentoClick,
  onSlotClick,
  onWeekChange
}: WeekCalendarProps) {
  const weekDays = getWeekDays(currentDate)
  const timeSlots = getTimeSlots(8, 20, 30)

  const handlePrevWeek = () => {
    const newDate = subWeeks(currentDate, 1)
    onWeekChange(newDate)
  }

  const handleNextWeek = () => {
    const newDate = addWeeks(currentDate, 1)
    onWeekChange(newDate)
  }

  const handleToday = () => {
    const today = new Date()
    onWeekChange(today)
  }

  const getAppuntamentiForDayAndSlot = (day: Date, hour: number, minutes: number) => {
    return appuntamenti.filter(apt => {
      const aptDate = new Date(apt.dataOra)
      return (
        isSameDay(aptDate, day) &&
        aptDate.getHours() === hour &&
        aptDate.getMinutes() === minutes
      )
    })
  }

  return (
    <div className="bg-card dark:bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
        <div className="flex items-center gap-4">
          <Button
            onClick={handlePrevWeek}
            variant="ghost"
            size="icon"
            data-testid="button-week-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={handleNextWeek}
            variant="ghost"
            size="icon"
            data-testid="button-week-next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold text-foreground" data-testid="text-week-range">
            {formatWeekRange(currentDate)}
          </h2>
        </div>
        <Button
          onClick={handleToday}
          variant="default"
          data-testid="button-week-today"
        >
          Oggi
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-border bg-muted sticky top-0 z-10">
            <div className="p-2 text-sm font-medium text-muted-foreground border-r border-border">
              Orario
            </div>
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`p-2 text-center border-r border-border last:border-r-0 ${
                  isToday(day) ? 'bg-primary/10' : ''
                }`}
                data-testid={`header-day-${idx}`}
              >
                <div className="text-sm font-medium text-muted-foreground">
                  {format(day, 'EEE', { locale: it })}
                </div>
                <div className={`text-lg font-semibold ${
                  isToday(day) ? 'text-primary' : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="relative">
            {timeSlots.map((slot, slotIdx) => (
              <div
                key={slotIdx}
                className="grid grid-cols-8 border-b border-border last:border-b-0"
                style={{ minHeight: '60px' }}
                data-testid={`row-slot-${slot.label}`}
              >
                {/* Time Label */}
                <div className="p-2 text-sm font-medium text-muted-foreground border-r border-border flex items-start">
                  {slot.label}
                </div>

                {/* Day Cells */}
                {weekDays.map((day, dayIdx) => {
                  const dayAppuntamenti = getAppuntamentiForDayAndSlot(day, slot.hour, slot.minutes)
                  
                  return (
                    <div
                      key={dayIdx}
                      onClick={() => dayAppuntamenti.length === 0 && onSlotClick(day, slot.hour, slot.minutes)}
                      className={`relative border-r border-border last:border-r-0 hover:bg-accent cursor-pointer transition-colors ${
                        isToday(day) ? 'bg-primary/5' : ''
                      }`}
                      data-testid={`slot-${format(day, 'yyyy-MM-dd')}-${slot.label}`}
                    >
                      {dayAppuntamenti.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppuntamentoClick(apt)
                          }}
                          className={`absolute inset-x-1 rounded-md border-l-4 p-2 text-xs cursor-pointer hover:shadow-md transition-shadow ${getAppuntamentoStyle(apt.stato)}`}
                          style={{
                            top: '4px',
                            height: `${(apt.durata / 30) * 60 - 8}px`,
                            zIndex: 5
                          }}
                          data-testid={`appuntamento-${apt.id}`}
                        >
                          <div className="font-semibold truncate">
                            {apt.paziente.nome} {apt.paziente.cognome}
                          </div>
                          <div className="truncate opacity-90">
                            {apt.motivoVisita || apt.tipo}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {apt.durata} min
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-border bg-muted text-sm flex-wrap">
        <span className="font-medium text-foreground">Legenda:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-muted-foreground">Confermato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-muted-foreground">Completato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-muted-foreground">No-show</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400"></div>
          <span className="text-muted-foreground">Cancellato</span>
        </div>
      </div>
    </div>
  )
}
