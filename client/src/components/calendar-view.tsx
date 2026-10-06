import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import type { Appuntamento, Paziente } from "@shared/schema";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";

interface CalendarViewProps {
  appuntamenti: Appuntamento[];
  pazienti: Paziente[];
  onEditAppointment: (appuntamento: Appuntamento) => void;
  onCreateAppointment: (date: Date) => void;
}

export function CalendarView({ appuntamenti, pazienti, onEditAppointment, onCreateAppointment }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const appuntamentiByDay = useMemo(() => {
    const byDay = new Map<string, Appuntamento[]>();
    appuntamenti.forEach(app => {
      const dayKey = format(new Date(app.dataOra), 'yyyy-MM-dd');
      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, []);
      }
      byDay.get(dayKey)!.push(app);
    });
    // Sort appointments by time
    byDay.forEach(apps => apps.sort((a, b) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime()));
    return byDay;
  }, [appuntamenti]);

  const getPazienteNome = (pazienteId: string) => {
    const paziente = pazienti.find(p => p.id === pazienteId);
    return paziente ? `${paziente.nome} ${paziente.cognome}` : "Paziente sconosciuto";
  };

  const getStatoBadgeClass = (stato: string) => {
    const baseClasses = "text-xs px-1.5 py-0.5 rounded";
    switch (stato) {
      case "confermato":
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case "completato":
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case "annullato":
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case "in_attesa":
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      default:
        return `${baseClasses} bg-muted text-muted-foreground`;
    }
  };

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case "confermato": return "Confermato";
      case "completato": return "Completato";
      case "annullato": return "Annullato";
      case "in_attesa": return "In Attesa";
      default: return stato;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center" data-testid="text-current-month">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date())}
          data-testid="button-today"
        >
          Oggi
        </Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {/* Header giorni settimana */}
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Celle calendario */}
          {calendarDays.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayAppuntamenti = appuntamentiByDay.get(dayKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] p-2 border rounded-md transition-colors ${
                  !isCurrentMonth ? 'bg-muted/30' : 'bg-card'
                } ${isToday ? 'border-primary' : 'border-border'} hover-elevate`}
                data-testid={`calendar-day-${dayKey}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-muted-foreground' : isToday ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onCreateAppointment(day)}
                      data-testid={`button-add-appointment-${dayKey}`}
                    >
                      <span className="text-xs">+</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  {dayAppuntamenti.slice(0, 3).map(app => (
                    <button
                      key={app.id}
                      onClick={() => onEditAppointment(app)}
                      className="w-full text-left p-1 rounded text-xs hover-elevate active-elevate-2 transition-all"
                      data-testid={`calendar-appointment-${app.id}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="font-medium truncate">
                          {format(new Date(app.dataOra), 'HH:mm')}
                        </span>
                      </div>
                      <div className="truncate text-muted-foreground">
                        {getPazienteNome(app.pazienteId)}
                      </div>
                      <div className={getStatoBadgeClass(app.stato)}>
                        {getStatoLabel(app.stato)}
                      </div>
                    </button>
                  ))}
                  {dayAppuntamenti.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayAppuntamenti.length - 3} altri
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
