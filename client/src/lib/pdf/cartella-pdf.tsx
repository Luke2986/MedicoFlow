import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Visita, Paziente, Ambulatorio } from '@shared/schema';

// Registra font Inter (opzionale)
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 15
  },
  ambulatorioName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5
  },
  ambulatorioInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    color: '#111827'
  },
  patientInfo: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 20
  },
  patientRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  patientLabel: {
    width: 120,
    fontWeight: 'bold',
    color: '#374151'
  },
  patientValue: {
    flex: 1,
    color: '#111827'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  sectionContent: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.8,
    textAlign: 'justify'
  },
  vitalParameters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  vitalBadge: {
    backgroundColor: '#e0e7ff',
    padding: 6,
    borderRadius: 4,
    fontSize: 9,
    color: '#1e40af'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  signature: {
    marginTop: 10
  },
  signatureLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4
  },
  signatureName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827'
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 48,
    color: '#e5e7eb',
    opacity: 0.3,
    fontWeight: 'bold'
  },
  metadata: {
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 5
  }
});

interface CartellaClinicaPDFProps {
  visita: Visita | null; // Singola visita (per retrocompatibilità)
  visite?: Visita[]; // Array di visite (per cartella completa)
  paziente: Paziente;
  ambulatorio: Ambulatorio;
  medicoNome: string;
}

// Helper function per formattare date in modo sicuro
function safeFormatDate(date: string | Date | null | undefined, formatStr: string, options?: any): string {
  try {
    if (!date) return 'Data non disponibile';
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return 'Data non valida';
    return format(parsedDate, formatStr, options);
  } catch (error) {
    return 'Errore formato data';
  }
}

export default function CartellaClinicaPDF({ 
  visita, 
  visite,
  paziente,
  ambulatorio, 
  medicoNome
}: CartellaClinicaPDFProps) {
  // Usa array di visite se disponibile, altrimenti singola visita
  const visiteDaRenderizzare = visite && visite.length > 0 ? visite : (visita ? [visita] : []);

  return (
    <Document
      title={`Cartella Clinica - ${paziente.cognome} ${paziente.nome}`}
      author={medicoNome}
      subject="Cartella Clinica Digitale"
      creator="MedicoFlow"
    >
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>COPIA CONFORME</Text>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.ambulatorioName}>{ambulatorio.nome}</Text>
            <Text style={styles.ambulatorioInfo}>
              {ambulatorio.indirizzo}, {ambulatorio.citta} ({ambulatorio.provincia})
            </Text>
            <Text style={styles.ambulatorioInfo}>
              Tel: {ambulatorio.telefono} | Email: {ambulatorio.email}
            </Text>
            <Text style={styles.ambulatorioInfo}>
              P.IVA: {ambulatorio.piva} | {ambulatorio.specializzazione}
            </Text>
          </View>
          <Text style={styles.documentTitle}>CARTELLA CLINICA COMPLETA</Text>
        </View>

        {/* Patient Info */}
        <View style={styles.patientInfo}>
          <View style={styles.patientRow}>
            <Text style={styles.patientLabel}>Paziente:</Text>
            <Text style={styles.patientValue}>
              {paziente.cognome} {paziente.nome}
            </Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.patientLabel}>Codice Fiscale:</Text>
            <Text style={styles.patientValue}>
              {paziente.codiceFiscale}
            </Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.patientLabel}>Data di Nascita:</Text>
            <Text style={styles.patientValue}>
              {safeFormatDate(paziente.dataNascita, 'dd/MM/yyyy')}
            </Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.patientLabel}>Totale Visite:</Text>
            <Text style={styles.patientValue}>
              {visiteDaRenderizzare.length} visite registrate
            </Text>
          </View>
        </View>

        {/* STORICO VISITE - Loop su tutte le visite */}
        {visiteDaRenderizzare.map((vis, index) => (
          <View key={vis.id || index} style={styles.section} break={index > 0}>
            {/* Header Visita */}
            <View style={{...styles.sectionHeader, backgroundColor: '#dbeafe', borderLeftColor: '#3b82f6'}}>
              <Text style={{...styles.sectionTitle, fontSize: 12}}>
                📅 VISITA DEL {safeFormatDate(vis.dataVisita, 'd MMMM yyyy', { locale: it })}
              </Text>
            </View>
            
            {/* Motivo Visita */}
            {vis.motivoVisita && (
              <View style={{marginBottom: 8, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, color: '#6b7280', marginBottom: 2}}>Motivo:</Text>
                <Text style={{fontSize: 10, color: '#111827', fontWeight: 'bold'}}>{vis.motivoVisita}</Text>
              </View>
            )}

            {/* Diagnosi */}
            {vis.diagnosi && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>DIAGNOSI</Text>
                <Text style={styles.sectionContent}>{vis.diagnosi}</Text>
              </View>
            )}

            {/* Anamnesi */}
            {vis.anamnesi && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>ANAMNESI</Text>
                <Text style={styles.sectionContent}>{vis.anamnesi}</Text>
              </View>
            )}

            {/* Esame Obiettivo */}
            {vis.esameObiettivo && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>ESAME OBIETTIVO</Text>
                <Text style={styles.sectionContent}>{vis.esameObiettivo}</Text>
              </View>
            )}

            {/* Parametri Vitali */}
            {(vis.peso || vis.altezza || vis.pressioneSistolica || vis.frequenzaCardiaca || vis.temperatura) && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>PARAMETRI VITALI</Text>
                <View style={styles.vitalParameters}>
                  {vis.peso && (
                    <Text style={styles.vitalBadge}>Peso: {vis.peso} kg</Text>
                  )}
                  {vis.altezza && (
                    <Text style={styles.vitalBadge}>Altezza: {vis.altezza} cm</Text>
                  )}
                  {vis.pressioneSistolica && vis.pressioneDiastolica && (
                    <Text style={styles.vitalBadge}>
                      PA: {vis.pressioneSistolica}/{vis.pressioneDiastolica} mmHg
                    </Text>
                  )}
                  {vis.frequenzaCardiaca && (
                    <Text style={styles.vitalBadge}>FC: {vis.frequenzaCardiaca} bpm</Text>
                  )}
                  {vis.temperatura && (
                    <Text style={styles.vitalBadge}>Temp: {(vis.temperatura / 10).toFixed(1)}°C</Text>
                  )}
                </View>
              </View>
            )}

            {/* Terapia */}
            {vis.terapia && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>TERAPIA</Text>
                <Text style={styles.sectionContent}>{vis.terapia}</Text>
              </View>
            )}

            {/* Prescrizioni */}
            {vis.prescrizioneFarmaci && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>PRESCRIZIONI</Text>
                <Text style={styles.sectionContent}>{vis.prescrizioneFarmaci}</Text>
              </View>
            )}

            {/* Esami */}
            {vis.esamiEseguiti && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>ESAMI</Text>
                <Text style={styles.sectionContent}>{vis.esamiEseguiti}</Text>
              </View>
            )}

            {/* Note */}
            {vis.noteCliniche && (
              <View style={{marginBottom: 10, paddingHorizontal: 10}}>
                <Text style={{fontSize: 9, fontWeight: 'bold', color: '#1e40af', marginBottom: 3}}>NOTE CLINICHE</Text>
                <Text style={styles.sectionContent}>{vis.noteCliniche}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Footer con firma */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.metadata}>
                Documento generato il {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </Text>
              <Text style={styles.metadata}>
                ID Visita: {visita.id}
              </Text>
            </View>
            <View style={styles.signature}>
              <Text style={styles.signatureLabel}>Il Medico</Text>
              <Text style={styles.signatureName}>{medicoNome}</Text>
              <Text style={styles.metadata}>Firma digitale sostituita da sigillo elettronico</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
