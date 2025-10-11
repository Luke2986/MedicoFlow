import { useState, useEffect } from 'react'
import { X, Loader2, Trash2, Calendar, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appuntamento?: any
  defaultDate?: Date
  defaultTime?: { hour: number; minutes: number }
  pazienti: any[]
  onSave: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export default function AppointmentModal({
  isOpen,
  onClose,
  appuntamento,
  defaultDate,
  defaultTime,
  pazienti,
  onSave,
  onDelete
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pazienteId: '',
    data: '',
    ora: '',
    durata: 30,
    tipo: 'controllo',
    motivoVisita: '',
    note: '',
    stato: 'confermato'
  })

  useEffect(() => {
    if (appuntamento) {
      const aptDate = new Date(appuntamento.dataOra)
      setFormData({
        pazienteId: appuntamento.pazienteId,
        data: format(aptDate, 'yyyy-MM-dd'),
        ora: format(aptDate, 'HH:mm'),
        durata: appuntamento.durata,
        tipo: appuntamento.tipo,
        motivoVisita: appuntamento.motivoVisita || '',
        note: appuntamento.note || '',
        stato: appuntamento.stato
      })
    } else if (defaultDate && defaultTime) {
      setFormData(prev => ({
        ...prev,
        data: format(defaultDate, 'yyyy-MM-dd'),
        ora: `${defaultTime.hour.toString().padStart(2, '0')}:${defaultTime.minutes.toString().padStart(2, '0')}`
      }))
    } else {
      setFormData({
        pazienteId: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        ora: '09:00',
        durata: 30,
        tipo: 'controllo',
        motivoVisita: '',
        note: '',
        stato: 'confermato'
      })
    }
  }, [appuntamento, defaultDate, defaultTime, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const [hours, minutes] = formData.ora.split(':').map(Number)
      const dataOra = new Date(formData.data)
      dataOra.setHours(hours, minutes, 0, 0)

      await onSave({
        id: appuntamento?.id,
        pazienteId: formData.pazienteId,
        dataOra: dataOra.toISOString(),
        durata: formData.durata,
        tipo: formData.tipo,
        motivoVisita: formData.motivoVisita,
        note: formData.note,
        stato: formData.stato
      })

      onClose()
    } catch (error) {
      console.error('Errore salvataggio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!appuntamento || !onDelete) return
    if (!confirm('Sei sicuro di voler eliminare questo appuntamento?')) return

    setLoading(true)
    try {
      await onDelete(appuntamento.id)
      onClose()
    } catch (error) {
      console.error('Errore eliminazione:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="modal-appointment">
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-modal-title">
            {appuntamento ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            data-testid="button-modal-close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Paziente */}
          <div className="space-y-2">
            <Label htmlFor="pazienteId">
              <User className="w-4 h-4 inline mr-2" />
              Paziente *
            </Label>
            <Select
              value={formData.pazienteId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, pazienteId: value }))}
              required
            >
              <SelectTrigger id="pazienteId" data-testid="select-paziente">
                <SelectValue placeholder="Seleziona paziente..." />
              </SelectTrigger>
              <SelectContent>
                {pazienti.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.cognome} {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Ora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                required
                data-testid="input-data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ora">
                <Clock className="w-4 h-4 inline mr-2" />
                Ora *
              </Label>
              <Input
                id="ora"
                type="time"
                value={formData.ora}
                onChange={(e) => setFormData(prev => ({ ...prev, ora: e.target.value }))}
                required
                data-testid="input-ora"
              />
            </div>
          </div>

          {/* Durata e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durata">Durata (minuti) *</Label>
              <Select
                value={formData.durata.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, durata: Number(value) }))}
              >
                <SelectTrigger id="durata" data-testid="select-durata">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minuti</SelectItem>
                  <SelectItem value="30">30 minuti</SelectItem>
                  <SelectItem value="45">45 minuti</SelectItem>
                  <SelectItem value="60">60 minuti</SelectItem>
                  <SelectItem value="90">90 minuti</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo visita *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger id="tipo" data-testid="select-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prima-visita">Prima visita</SelectItem>
                  <SelectItem value="controllo">Controllo</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="telemedicina">Telemedicina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stato (solo se modifica) */}
          {appuntamento && (
            <div className="space-y-2">
              <Label htmlFor="stato">Stato</Label>
              <Select
                value={formData.stato}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stato: value }))}
              >
                <SelectTrigger id="stato" data-testid="select-stato">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confermato">Confermato</SelectItem>
                  <SelectItem value="completato">Completato</SelectItem>
                  <SelectItem value="cancellato">Cancellato</SelectItem>
                  <SelectItem value="no-show">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="motivoVisita">Motivo visita</Label>
            <Input
              id="motivoVisita"
              type="text"
              value={formData.motivoVisita}
              onChange={(e) => setFormData(prev => ({ ...prev, motivoVisita: e.target.value }))}
              placeholder="Es: Controllo periodico"
              data-testid="input-motivo"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              rows={3}
              placeholder="Note aggiuntive..."
              data-testid="input-note"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
              data-testid="button-save"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {appuntamento ? 'Salva Modifiche' : 'Crea Appuntamento'}
            </Button>
            
            {appuntamento && onDelete && (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                variant="destructive"
                data-testid="button-delete"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina
              </Button>
            )}
            
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              data-testid="button-cancel"
            >
              Annulla
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
