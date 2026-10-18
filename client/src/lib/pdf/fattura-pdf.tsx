import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Paziente, Ambulatorio, DocumentoSpesa, User } from '@shared/schema';
import {
  IMPORTO_BOLLO_CENTESIMI,
  METODI_PAGAMENTO,
  dicituraIva,
  formatEuro,
  totaleVociCentesimi,
  type MetodoPagamento,
} from '../../../../shared/fiscale';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, lineHeight: 1.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  emittente: { width: '55%' },
  nome: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  muted: { color: '#4b5563' },
  docBox: { width: '40%', borderWidth: 1, borderColor: '#d1d5db', padding: 8 },
  docTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  destinatario: { marginBottom: 20, padding: 10, backgroundColor: '#f3f4f6' },
  label: { fontSize: 8, color: '#6b7280', marginBottom: 2, textTransform: 'uppercase' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111827', paddingBottom: 4, marginBottom: 4, fontWeight: 'bold' },
  row: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  colDesc: { width: '70%' },
  colImporto: { width: '30%', textAlign: 'right' },
  totali: { marginTop: 10, alignSelf: 'flex-end', width: '45%' },
  totaleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totaleFinale: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#111827', marginTop: 4, paddingTop: 4, fontWeight: 'bold', fontSize: 12 },
  note: { marginTop: 24, fontSize: 9, color: '#374151' },
  noteLine: { marginBottom: 4 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: '#9ca3af' },
});

interface FatturaPDFProps {
  documento: DocumentoSpesa;
  paziente: Paziente;
  ambulatorio: Ambulatorio;
  emittente: Pick<User, 'nome' | 'cognome' | 'regimeFiscale'>;
}

function formatData(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function FatturaPDF({ documento, paziente, ambulatorio, emittente }: FatturaPDFProps) {
  const imponibile = totaleVociCentesimi(documento.voci);
  const bollo = documento.bollo ? IMPORTO_BOLLO_CENTESIMI : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.emittente}>
            <Text style={styles.nome}>Dott. {emittente.nome} {emittente.cognome}</Text>
            <Text style={styles.muted}>{ambulatorio.nome}</Text>
            <Text style={styles.muted}>
              {ambulatorio.indirizzo}, {ambulatorio.cap} {ambulatorio.citta} ({ambulatorio.provincia})
            </Text>
            <Text style={styles.muted}>C.F. {documento.cfEmittente} · P.IVA {documento.pivaEmittente}</Text>
          </View>
          <View style={styles.docBox}>
            <Text style={styles.docTitle}>Fattura n. {documento.numero}/{documento.anno}</Text>
            <Text>Data: {formatData(documento.dataEmissione)}</Text>
          </View>
        </View>

        <View style={styles.destinatario}>
          <Text style={styles.label}>Destinatario</Text>
          <Text>{paziente.cognome} {paziente.nome}</Text>
          {paziente.indirizzo ? (
            <Text>
              {paziente.indirizzo}{paziente.cap ? `, ${paziente.cap}` : ''} {paziente.citta ?? ''}{paziente.provincia ? ` (${paziente.provincia})` : ''}
            </Text>
          ) : null}
          <Text>C.F. {documento.cfPaziente}</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descrizione</Text>
          <Text style={styles.colImporto}>Importo</Text>
        </View>
        {documento.voci.map((voce, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.colDesc}>
              <Text>{voce.descrizione}</Text>
              <Text style={styles.muted}>
                Tipo spesa {voce.tipoSpesa}
                {voce.flagTipoSpesa === '2' ? ' · intramoenia' : ''}
              </Text>
            </View>
            <Text style={styles.colImporto}>{formatEuro(voce.importoCentesimi)}</Text>
          </View>
        ))}

        <View style={styles.totali}>
          <View style={styles.totaleRow}>
            <Text>Totale prestazioni</Text>
            <Text>{formatEuro(imponibile)}</Text>
          </View>
          {bollo > 0 && (
            <View style={styles.totaleRow}>
              <Text>Imposta di bollo</Text>
              <Text>{formatEuro(bollo)}</Text>
            </View>
          )}
          <View style={styles.totaleFinale}>
            <Text>Totale documento</Text>
            <Text>{formatEuro(imponibile + bollo)}</Text>
          </View>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteLine}>{dicituraIva(documento.naturaIva, emittente.regimeFiscale)}</Text>
          {documento.bollo && (
            <Text style={styles.noteLine}>Marca da bollo da € 2,00 applicata sull'originale.</Text>
          )}
          <Text style={styles.noteLine}>
            Pagamento: {METODI_PAGAMENTO[documento.metodoPagamento as MetodoPagamento] ?? documento.metodoPagamento} il{' '}
            {formatData(documento.dataPagamento)}.
          </Text>
          <Text style={styles.noteLine}>
            {documento.flagOpposizione
              ? "Il paziente si è opposto alla trasmissione di questa spesa al Sistema Tessera Sanitaria."
              : "La spesa sarà trasmessa al Sistema Tessera Sanitaria per la dichiarazione dei redditi precompilata, salvo opposizione del paziente."}
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          Documento emesso con MedicoFlow · Fattura n. {documento.numero}/{documento.anno}
        </Text>
      </Page>
    </Document>
  );
}
