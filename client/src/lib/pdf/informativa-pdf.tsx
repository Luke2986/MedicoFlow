import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Paziente, Ambulatorio } from '@shared/schema';
import { INFORMATIVA_AI_PARAGRAFI, INFORMATIVA_AI_TITOLO, INFORMATIVA_AI_VERSIONE } from '../../../../shared/informativa-ai';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 12 },
  ambulatorioName: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', marginBottom: 4 },
  ambulatorioInfo: { fontSize: 9, color: '#6b7280' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 14, color: '#111827' },
  paragraph: { marginBottom: 10, textAlign: 'justify' },
  patient: { marginTop: 10, marginBottom: 16, padding: 10, backgroundColor: '#f3f4f6' },
  choiceRow: { flexDirection: 'row', marginBottom: 8 },
  box: { width: 10, height: 10, borderWidth: 1, borderColor: '#111827', marginRight: 8, marginTop: 2 },
  signatures: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' },
  signature: { width: '45%', borderTopWidth: 1, borderTopColor: '#111827', paddingTop: 4, fontSize: 9 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: '#9ca3af' },
});

interface InformativaAiPDFProps {
  paziente: Paziente;
  ambulatorio: Ambulatorio;
}

export default function InformativaAiPDF({ paziente, ambulatorio }: InformativaAiPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.ambulatorioName}>{ambulatorio.nome}</Text>
          <Text style={styles.ambulatorioInfo}>
            {ambulatorio.indirizzo}, {ambulatorio.cap} {ambulatorio.citta} ({ambulatorio.provincia}) · P.IVA {ambulatorio.piva}
          </Text>
        </View>

        <Text style={styles.title}>{INFORMATIVA_AI_TITOLO}</Text>

        {INFORMATIVA_AI_PARAGRAFI.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}

        <View style={styles.patient}>
          <Text>Paziente: {paziente.cognome} {paziente.nome} · C.F. {paziente.codiceFiscale}</Text>
        </View>

        <View style={styles.choiceRow}>
          <View style={styles.box} />
          <Text>Ho ricevuto l'informativa e acconsento alla trascrizione con intelligenza artificiale.</Text>
        </View>
        <View style={styles.choiceRow}>
          <View style={styles.box} />
          <Text>Ho ricevuto l'informativa e NON acconsento alla trascrizione con intelligenza artificiale.</Text>
        </View>

        <View style={styles.signatures}>
          <Text style={styles.signature}>Luogo e data</Text>
          <Text style={styles.signature}>Firma del paziente (o di chi ne esercita la responsabilità)</Text>
        </View>

        <Text style={styles.footer} fixed>Versione informativa: {INFORMATIVA_AI_VERSIONE}</Text>
      </Page>
    </Document>
  );
}
