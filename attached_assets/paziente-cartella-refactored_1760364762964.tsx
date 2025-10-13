import React from 'react'
import { ArrowLeft, ChevronRight, AlertTriangle, Calendar, Phone, Mail, User, Stethoscope, Pill, FileText, Edit2, Trash2, Plus } from 'lucide-react'

// Mock data - in produzione verrà da API
const getPaziente = () => ({
  id: 'p1',
  nome: 'Matteo',
  cognome: 'Moretti',
  codiceFiscale: 'MRTMTT16T03A944U',
  dataNascita: new Date('1977-03-16'),
  telefono: '+39 333 1234567',
  email: 'matteo.moretti@email.it',
  alerts: ['Allergia penicillina', 'Diabete tipo 2'],
  visite: [
    {
      id: 'v1',
      dataVisita: new Date('2025-10-13'),
      tipo: 'controllo',
      stato: 'completato',
      durata: 30,
      diagnosi: 'Diabete mellito tipo 2 controllato (E11.9)',
      terapia: 'Metformina 850mg 2x/die. Controllo glicemia pre-prandiale. Dieta ipocalorica 1800 kcal/die. Attività fisica 30 min/die 5x settimana.',
      anamnesi: 'Paziente riferisce controllo routinario. Aderenza terapeutica buona. Glicemia domiciliare media 120 mg/dl. Nessun episodio ipoglicemico. Riferisce miglioramento generale del benessere.',
      esameObiettivo: 'PA 130/80 mmHg. Peso 82kg (BMI 28). FC 72 bpm. Piedi integri, no lesioni. Sensibilità conservata.',
      medicoNome: 'Dr. Elena Rossi'
    },
    {
      id: 'v2',
      dataVisita: new Date('2025-08-28'),
      tipo: 'prima-visita',
      stato: 'completato',
      durata: 60,
      diagnosi: 'Diabete mellito tipo 2 (E11) - prima diagnosi',
      terapia: 'Avviata metformina 850mg 1x/die per 2 settimane, poi incremento a 2x/die. Educazione alimentare fornita. Diario glicemico. Controllo tra 3 mesi.',
      anamnesi: 'Paziente inviato da MMG per iperglicemia (glicemia random 180 mg/dl). Familiarità positiva per diabete (padre diagnosticato a 55 anni). Stile di vita sedentario. Lavoro ufficio.',
      esameObiettivo: 'PA 140/85 mmHg. Peso 88kg (BMI 30.2). Obesità I grado. Esame piedi: no lesioni evidenti.',
      medicoNome: 'Dr. Elena Rossi'
    }
  ]
})

// Utility functions
const calcolaEta = (dataNascita: Date) => {
  const oggi = new Date()
  let eta = oggi.getFullYear() - dataNascita.getFullYear()
  const m = oggi.getMonth() - dataNascita.getMonth()
  if (m < 0 || (m === 0 && oggi.getDate() < dataNascita.getDate())) {
    eta--
  }
  return eta
}

const formatData = (data: Date) => {
  return data.toLocaleDateString('it-IT', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
}

const calcolaGiorniDa = (data: Date) => {
  const oggi = new Date()
  const differenza = Math.floor((oggi.getTime() - data.getTime()) / (1000 * 60 * 60 * 24))
  
  if (differenza === 0) return 'oggi'
  if (differenza === 1) return '1 giorno fa'
  if (differenza < 30) return `${differenza} giorni fa`
  if (differenza < 60) return 'circa 1 mese fa'
  
  const mesi = Math.floor(differenza / 30)
  return `circa ${mesi} mesi fa`
}

export default function CartellaClinicaPaziente() {
  const paziente = getPaziente()
  const eta = calcolaEta(paziente.dataNascita)
  const ultimaVisita = paziente.visite[0]
  const giorniDaUltimaVisita = calcolaGiorniDa(ultimaVisita.dataVisita)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <a href="/dashboard/pazienti" className="text-blue-600 hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Pazienti
          </a>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">
            {paziente.cognome} {paziente.nome}
          </span>
        </nav>

        {/* Header Paziente Fisso */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {paziente.cognome} {paziente.nome}
                  </h1>
                  <p className="text-gray-600 font-mono text-sm mt-1">
                    CF: {paziente.codiceFiscale}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {eta} anni ({formatData(paziente.dataNascita)})
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`tel:${paziente.telefono}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {paziente.telefono}
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a 
                    href={`mailto:${paziente.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {paziente.email}
                  </a>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {paziente.visite.length} visite • Ultima: {giorniDaUltimaVisita}
                  </span>
                </div>
              </div>
            </div>

            <a 
              href={`/dashboard/cartella-clinica/nuovo?pazienteId=${paziente.id}`}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nuova Visita
            </a>
          </div>
        </div>

        {/* Alert Box - Solo se ci sono alerts */}
        {paziente.alerts && paziente.alerts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 text-lg mb-2">
                  ⚠️ Attenzione
                </h3>
                <ul className="space-y-1">
                  {paziente.alerts.map((alert, idx) => (
                    <li key={idx} className="text-red-800 font-medium">
                      • {alert}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Storico Visite */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Storico Clinico ({paziente.visite.length} visite)
            </h2>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Filtra ▼
            </button>
          </div>

          <div className="space-y-4">
            {paziente.visite.map((visita) => (
              <div 
                key={visita.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Header Visita */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      📅 {formatData(visita.dataVisita)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {visita.tipo.charAt(0).toUpperCase() + visita.tipo.slice(1).replace('-', ' ')} • {visita.medicoNome}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium">
                      <Edit2 className="w-4 h-4" />
                      Modifica
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </button>
                  </div>
                </div>

                {/* Body - Sezioni Cliniche */}
                <div className="space-y-4">
                  
                  {/* Diagnosi - Highlighted */}
                  {visita.diagnosi && (
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        🩺 Diagnosi
                      </p>
                      <p className="text-gray-900 font-medium leading-relaxed">
                        {visita.diagnosi}
                      </p>
                    </div>
                  )}

                  {/* Terapia */}
                  {visita.terapia && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        Terapia
                      </p>
                      <p className="text-gray-700 leading-relaxed line-clamp-2">
                        {visita.terapia}
                      </p>
                    </div>
                  )}

                  {/* Anamnesi */}
                  {visita.anamnesi && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Anamnesi
                      </p>
                      <p className="text-gray-700 leading-relaxed line-clamp-2">
                        {visita.anamnesi}
                      </p>
                    </div>
                  )}

                  {/* Esame Obiettivo */}
                  {visita.esameObiettivo && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        Esame Obiettivo
                      </p>
                      <p className="text-gray-700 leading-relaxed line-clamp-2">
                        {visita.esameObiettivo}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Durata: {visita.durata} min</span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      ✓ {visita.stato.charAt(0).toUpperCase() + visita.stato.slice(1)}
                    </span>
                  </div>
                  <a 
                    href={`/dashboard/cartella-clinica/${visita.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                  >
                    → Vedi cartella completa
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500 pt-6 border-t">
          MedicoFlow • Cartella Clinica Digitale • Conforme FSE 2.0
        </div>
      </div>
    </div>
  )
}