import React from 'react';
import { Download, FileText, Eye } from 'lucide-react';

export default function EsempioCartellaClinicaPDF() {
  const [showPreview, setShowPreview] = React.useState(true);

  const generaPDF = () => {
    // Simula generazione PDF
    alert('📄 In produzione, questo scaricherebbe il PDF generato con @react-pdf/renderer');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cartella Clinica - Esempio PDF</h1>
              <p className="text-sm text-gray-600">Anteprima layout professionale</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Nascondi' : 'Mostra'} Anteprima
            </button>
            <button
              onClick={generaPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Scarica PDF
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        {showPreview && (
          <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
            {/* A4 Page Container */}
            <div className="w-full" style={{ aspectRatio: '210/297' }}>
              <div className="p-8 text-xs" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                
                {/* HEADER */}
                <div className="border-b-4 border-blue-600 pb-4 mb-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-bold text-blue-700 mb-1">STUDIO MEDICO DR. ROSSI</div>
                      <div className="text-gray-600 text-xs">Cardiologia</div>
                      <div className="text-gray-600 text-xs">Via Roma 1, 20100 Milano (MI)</div>
                      <div className="text-gray-600 text-xs">Tel: 02 123456 • Email: rossi@studiomedico.it</div>
                      <div className="text-gray-600 text-xs">P.IVA: 12345678901</div>
                    </div>
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                      LOGO
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <div className="text-xl font-bold text-gray-900 mb-1">CARTELLA CLINICA AMBULATORIALE</div>
                    <div className="text-xs text-gray-600 italic">Documento Medico-Legale ai sensi del D.M. 739/1994</div>
                  </div>
                </div>

                {/* DATI PAZIENTE */}
                <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-4">
                  <div className="text-sm font-bold text-blue-700 mb-2 uppercase">📋 Dati Anagrafici Paziente</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Cognome e Nome:</span>
                      <span className="ml-2 font-bold">BIANCHI MARIO</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Codice Fiscale:</span>
                      <span className="ml-2 font-bold">BNCMRA80A01F205X</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Data di Nascita:</span>
                      <span className="ml-2 font-bold">01/01/1980</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Luogo di Nascita:</span>
                      <span className="ml-2 font-bold">Milano (MI)</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Sesso:</span>
                      <span className="ml-2 font-bold">Maschio</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Età:</span>
                      <span className="ml-2 font-bold">44 anni</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Telefono:</span>
                      <span className="ml-2 font-bold">333 1234567</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-bold">mario.bianchi@email.it</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Indirizzo:</span>
                      <span className="ml-2 font-bold">Via Dante 15, 20121 Milano (MI)</span>
                    </div>
                  </div>
                </div>

                {/* INFO VISITA */}
                <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-4">
                  <div className="text-sm font-bold text-blue-700 mb-2 uppercase">🏥 Informazioni Visita</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Data Visita:</span>
                      <span className="ml-2 font-bold">Lunedì 14 Gennaio 2025</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo Visita:</span>
                      <span className="ml-2 font-bold">Prima Visita</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Motivo Accesso:</span>
                      <span className="ml-2 font-bold">Dolore toracico retrosternale</span>
                    </div>
                  </div>
                </div>

                {/* ANAMNESI */}
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                    <div className="text-sm font-bold text-blue-700 uppercase">1. ANAMNESI</div>
                  </div>
                  
                  <div className="pl-3 space-y-2">
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">1.1 ANAMNESI FAMILIARE</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Padre cardiopatico (infarto miocardico a 62 anni), madre diabetica tipo 2. 
                        Nonna paterna deceduta per ictus cerebrale. Non altre patologie rilevanti.
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">1.2 ANAMNESI FISIOLOGICA</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Non fumatore da 5 anni (ex fumatore 10 sigarette/die per 15 anni). 
                        Consumo alcol occasionale (1-2 bicchieri vino/settimana). 
                        Attività fisica regolare (corsa 3 volte/settimana). 
                        Allergie note: penicillina (reazione cutanea).
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">1.3 ANAMNESI PATOLOGICA REMOTA</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Appendicectomia nel 2015 senza complicanze. 
                        Ipertensione arteriosa diagnosticata nel 2018, in trattamento farmacologico. 
                        Dislipidemia in controllo dietetico.
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">1.4 ANAMNESI PATOLOGICA PROSSIMA</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Da circa 3 giorni riferisce dolore retrosternale oppressivo, 
                        irradiato a braccio sinistro, insorto sotto sforzo e risolto con riposo. 
                        Episodi della durata di 5-10 minuti. Ultimo episodio questa mattina. 
                        Negata dispnea, palpitazioni o sincope.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ESAME OBIETTIVO */}
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                    <div className="text-sm font-bold text-blue-700 uppercase">2. ESAME OBIETTIVO</div>
                  </div>
                  
                  <div className="pl-3 space-y-2">
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-2">2.1 PARAMETRI VITALI</div>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">PA</div>
                          <div className="text-sm font-bold">130/80</div>
                          <div className="text-xs text-gray-500">mmHg</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">FC</div>
                          <div className="text-sm font-bold">72</div>
                          <div className="text-xs text-gray-500">bpm</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">Temp</div>
                          <div className="text-sm font-bold">36.5°</div>
                          <div className="text-xs text-gray-500">°C</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">SpO2</div>
                          <div className="text-sm font-bold">98</div>
                          <div className="text-xs text-gray-500">%</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">Peso</div>
                          <div className="text-sm font-bold">75 kg</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">Altezza</div>
                          <div className="text-sm font-bold">175 cm</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-300 rounded p-2 text-center">
                          <div className="text-xs text-gray-600 mb-1">BMI</div>
                          <div className="text-sm font-bold">24.5</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">2.2 ESAME GENERALE</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Paziente vigile, collaborante, in buone condizioni generali. 
                        Normotipo, normoidratato, normocolorato. 
                        Non segni di distress respiratorio.
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">2.3 ESAME PER APPARATI</div>
                      <div className="text-xs text-gray-600 pl-2">
                        <strong>Cardiovascolare:</strong> Toni ritmici, normofonetici. 
                        Non soffi patologici. Polsi periferici validi e simmetrici. 
                        <strong>Respiratorio:</strong> MV normotrasmesso bilateralmente, 
                        non rumori patologici. <strong>Addome:</strong> Trattabile, 
                        non dolente, peristalsi presente. <strong>Arti:</strong> Non edemi declivi.
                      </div>
                    </div>
                  </div>
                </div>

                {/* DIAGNOSI */}
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                    <div className="text-sm font-bold text-blue-700 uppercase">3. DIAGNOSI</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-400 rounded p-3 mb-2">
                    <div className="text-sm font-bold text-yellow-900">
                      Sospetta Sindrome Coronarica Acuta - Angina Instabile
                    </div>
                    <div className="text-xs text-yellow-800 mt-1">
                      Codice ICD-10: I20.0
                    </div>
                  </div>
                  <div className="pl-3">
                    <div className="text-xs font-bold text-gray-700 mb-1">3.1 DIAGNOSI DIFFERENZIALE</div>
                    <div className="text-xs text-gray-600 pl-2">
                      Pericardite acuta, embolia polmonare, dissecazione aortica, 
                      dolore muscolo-scheletrico della parete toracica, reflusso gastroesofageo.
                    </div>
                  </div>
                </div>

                {/* ESAMI DIAGNOSTICI */}
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                    <div className="text-sm font-bold text-blue-700 uppercase">4. ESAMI DIAGNOSTICI</div>
                  </div>
                  <div className="pl-3 space-y-2">
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">4.1 ESAMI PRESCRITTI</div>
                      <div className="text-xs text-gray-600 pl-2">
                        • ECG a 12 derivazioni (eseguito oggi)<br/>
                        • Troponina I ad alta sensibilità (eseguito oggi)<br/>
                        • Ecocardiogramma transtoracico (prenotato)<br/>
                        • Test da sforzo o coronarografia (da valutare)
                      </div>
                    </div>
                  </div>
                </div>

                {/* TERAPIA */}
                <div className="mb-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                    <div className="text-sm font-bold text-blue-700 uppercase">5. TERAPIA PRESCRITTA</div>
                  </div>
                  <div className="pl-3 space-y-2">
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">5.1 TERAPIA FARMACOLOGICA</div>
                      <div className="text-xs text-gray-600 pl-2">
                        • Acido acetilsalicilico 100mg - 1 cp/die a tempo indeterminato<br/>
                        • Atorvastatina 40mg - 1 cp/sera a tempo indeterminato<br/>
                        • Ramipril 5mg - 1 cp/die al mattino<br/>
                        • Nitroglicerina sublinguale spray - al bisogno per dolore toracico
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">5.2 TERAPIA NON FARMACOLOGICA</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Dieta iposodica e povera di grassi saturi. 
                        Attività fisica moderata dopo clearance cardiologica. 
                        Controllo fattori di rischio cardiovascolare.
                      </div>
                    </div>
                  </div>
                </div>

                {/* DIARIO CLINICO */}
                <div className="mb-6">
                  <div className="bg-blue-50 border-l-4 border-blue-600 px-3 py-2 mb-2">
                    <div className="text-sm font-bold text-blue-700 uppercase">6. DIARIO CLINICO E FOLLOW-UP</div>
                  </div>
                  <div className="pl-3 space-y-2">
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">6.1 NOTE CLINICHE</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Paziente informato della necessità di recarsi in Pronto Soccorso 
                        in caso di recidiva del dolore toracico o peggioramento della sintomatologia. 
                        Educato sul riconoscimento dei sintomi d'allarme.
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-700 mb-1">6.2 PROSSIMO CONTROLLO</div>
                      <div className="text-xs text-gray-600 pl-2">
                        Programmato per il 21/01/2025 per valutazione esiti esami diagnostici 
                        e rivalutazione clinica. Controllo pressione arteriosa.
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-gray-300 pt-3 mt-6">
                  <div className="flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <div>Documento generato il 14/01/2025 alle 10:30</div>
                      <div>ID Cartella: cart_abc123xyz789</div>
                      <div>Sistema: MedicoFlow v1.0 - Conforme D.M. 739/1994</div>
                      <div className="mt-2 bg-green-100 border border-green-400 rounded px-2 py-1 inline-block">
                        <span className="text-green-800 font-bold text-xs">
                          ✓ Consenso Informato Acquisito - 14/01/2025
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 mb-1">Il Medico</div>
                      <div className="text-sm font-bold">Dr. Mario Rossi</div>
                      <div className="text-xs text-gray-600">Specialista in Cardiologia</div>
                      <div className="text-xs text-gray-500 mt-2">Firma digitale art. 24 CAD</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-3 text-center leading-tight">
                    Questo documento costituisce copia conforme all'originale digitale conservato nel sistema MedicoFlow. 
                    La riproduzione, anche parziale, è vietata senza autorizzazione. 
                    Documento protetto ai sensi del GDPR (Reg. UE 2016/679) e D.Lgs. 196/2003.
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">ℹ️ Caratteristiche PDF</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Schema conforme D.M. 739/1994</li>
            <li>✅ 6 sezioni strutturate obbligatorie</li>
            <li>✅ Parametri vitali in formato standard</li>
            <li>✅ Codice ICD-10 per diagnosi</li>
            <li>✅ Layout professionale e leggibile</li>
            <li>✅ Watermark "ORIGINALE" (non visibile in anteprima web)</li>
            <li>✅ Firma digitale conforme CAD</li>
            <li>✅ Metadati tracciabilità completi</li>
          </ul>
        </div>

      </div>
    </div>
  );
}