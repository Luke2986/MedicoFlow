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
  visita: Visita;
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
  paziente,
  ambulatorio, 
  medicoNome
}: CartellaClinicaPDFProps) {
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
          <Text style={styles.documentTitle}>CARTELLA CLINICA</Text>
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
            <Text style={styles.patientLabel}>Data Visita:</Text>
            <Text style={styles.patientValue}>
              {safeFormatDate(visita.dataVisita, 'dd MMMM yyyy', { locale: it })}
            </Text>
          </View>
          <View style={styles.patientRow}>
            <Text style={styles.patientLabel}>Motivo Visita:</Text>
            <Text style={styles.patientValue}>
              {visita.motivoVisita}
            </Text>
          </View>
        </View>

        {/* Diagnosi (prima sezione - più importante) */}
        {visita.diagnosi && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DIAGNOSI</Text>
            <Text style={styles.sectionContent}>{visita.diagnosi}</Text>
          </View>
        )}

        {/* Anamnesi */}
        {visita.anamnesi && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ANAMNESI</Text>
            <Text style={styles.sectionContent}>{visita.anamnesi}</Text>
          </View>
        )}

        {/* Esame Obiettivo */}
        {visita.esameObiettivo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESAME OBIETTIVO</Text>
            <Text style={styles.sectionContent}>{visita.esameObiettivo}</Text>
          </View>
        )}

        {/* Parametri Vitali */}
        {(visita.peso || visita.altezza || visita.pressioneSistolica || visita.frequenzaCardiaca || visita.temperatura) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARAMETRI VITALI</Text>
            <View style={styles.vitalParameters}>
              {visita.peso && (
                <Text style={styles.vitalBadge}>Peso: {visita.peso} kg</Text>
              )}
              {visita.altezza && (
                <Text style={styles.vitalBadge}>Altezza: {visita.altezza} cm</Text>
              )}
              {visita.pressioneSistolica && visita.pressioneDiastolica && (
                <Text style={styles.vitalBadge}>
                  Pressione: {visita.pressioneSistolica}/{visita.pressioneDiastolica} mmHg
                </Text>
              )}
              {visita.frequenzaCardiaca && (
                <Text style={styles.vitalBadge}>Frequenza: {visita.frequenzaCardiaca} bpm</Text>
              )}
              {visita.temperatura && (
                <Text style={styles.vitalBadge}>Temperatura: {(visita.temperatura / 10).toFixed(1)}°C</Text>
              )}
            </View>
          </View>
        )}

        {/* Terapia e Prescrizioni */}
        {visita.terapia && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TERAPIA E PRESCRIZIONI</Text>
            <Text style={styles.sectionContent}>{visita.terapia}</Text>
          </View>
        )}

        {/* Prescrizione Farmaci */}
        {visita.prescrizioneFarmaci && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRESCRIZIONE FARMACI</Text>
            <Text style={styles.sectionContent}>{visita.prescrizioneFarmaci}</Text>
          </View>
        )}

        {/* Esami Eseguiti */}
        {visita.esamiEseguiti && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESAMI ESEGUITI</Text>
            <Text style={styles.sectionContent}>{visita.esamiEseguiti}</Text>
          </View>
        )}

        {/* Note Cliniche */}
        {visita.noteCliniche && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTE CLINICHE</Text>
            <Text style={styles.sectionContent}>{visita.noteCliniche}</Text>
          </View>
        )}

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
