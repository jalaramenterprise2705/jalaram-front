import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmtDate } from './utils';
import { TERMS, CERTIFY } from './store';

const f2 = (n) => Number(n || 0).toFixed(2);

// A4 tax invoice: boxed table with 15 rows (blank rows kept), bank block + totals, certificate, terms. Normal (Helvetica) font.
export function downloadBillPdf({ doc: d, kind, store, party }) {
  const isInv = kind === 'invoice';
  const p = new jsPDF({ unit: 'mm', format: 'a4' });
  const no = isInv ? d.invoiceNo : d.billNo;
  const date = d[isInv ? 'invoiceDate' : 'billDate'];
  const word = isInv ? 'INVOICE' : 'BILL';
  const b = store.bank;
  p.setLineWidth(0.5).rect(8, 8, 194, 281);
  p.setLineWidth(0.2);
  p.setFont(undefined, 'bold').setFontSize(20).text(store.name, 105, 19, { align: 'center' });
  p.setFont(undefined, 'normal').setFontSize(9).text([store.address, `Phone:${store.phone}`], 105, 25, { align: 'center' });
  p.line(8, 34, 202, 34);
  p.setFont(undefined, 'bold').setFontSize(10).text(isInv ? 'GST TAX INVOICE' : 'PURCHASE BILL', 105, 38.5, { align: 'center' });
  p.line(8, 41, 202, 41);
  p.setFontSize(9);
  if (store.gstin) {
    p.text(`GSTIN No:${store.gstin}`, 11, 49);
  }
  p.line(135, 41, 135, 55);
  p.text(`${word} No:${no}`, 137, 46.5);
  p.text(`${word} DATE:${date ? fmtDate(date) : d.dateText || ''}`, 137, 51.5);
  p.line(8, 55, 202, 55);
  let y = 61;
  p.setFont(undefined, 'normal').setFontSize(8);
  if (isInv && d.customerName) {
    p.text('DETAIL OF RECEIVER:', 11, y);
    p.setFont(undefined, 'bold').setFontSize(13).text(d.customerName, 11, y + 6.5);
    p.setFont(undefined, 'normal').setFontSize(9);
    if (party?.address) {
      p.text(party.address, 11, y + 12);
    }
    if (party?.gstin) {
      p.text(`GSTIN:${party.gstin}`, 11, y + 17);
    }
    y += 22;
  }
  else if (!isInv && d.supplier) {
    p.text('SUPPLIER:', 11, y);
    p.setFont(undefined, 'bold').setFontSize(13).text(d.supplier, 11, y + 6.5);
    y += 12;
  }
  p.line(8, y, 202, y);
  const bankY = 222;
  const start = y + 3;
  const rowH = Math.max(6, (bankY - 6 - start - 10) / 15);
  const body = d.items.map((i, n) => [
    n + 1,
    i.name,
    i.hsn,
    i.qty,
    f2(i.rate),
    f2(i.discPct),
    f2(i.discAmt),
    f2(i.taxable),
    f2(i.sgstPct),
    f2(i.sgstAmt),
    f2(i.cgstPct),
    f2(i.cgstAmt),
  ]);
  while (body.length < 15) {
    body.push(Array(12).fill(''));
  }
  autoTable(p, {
    startY: start,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1,
      halign: 'center',
      valign: 'middle',
      textColor: 0,
      lineColor: 0,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: 255,
      textColor: 0,
      fontStyle: 'bold',
      minCellHeight: 10,
    },
    bodyStyles: { minCellHeight: rowH },
    columnStyles: { 1: { cellWidth: 44, halign: 'left' } },
    head: [[
      'SrNo',
      'Product',
      'HSN No',
      'Qty',
      'Rate',
      'Disc(%)',
      'Disc Amt',
      'Taxable Amt',
      'SGST(%)',
      'SGST Amt',
      'CGST(%)',
      'CGST Amt',
    ]],
    body,
  });
  y = Math.max(p.lastAutoTable.finalY + 6, bankY);
  p.setFontSize(9).setFont(undefined, 'normal');
  if (isInv) {
    [
      ['Payable', b.payable],
      ['Bank', b.name],
      ['Account No', b.account],
      ['Branch', b.branch],
      ['IFSC Code', b.ifsc],
    ].forEach(([k, v], n) => {
      p.setFont(undefined, 'normal').text(`${k} :`, 11, y + n * 6);
      p.setFont(undefined, 'bold').text(String(v || ''), 38, y + n * 6);
    });
  }
  [
    ['GROSS AMT', d.gross],
    ['Discount(-)', d.discount],
    ['SGST(+)', d.sgst],
    ['CGST(+)', d.cgst],
    ['Total Invoice Value(=)', d.grandTotal],
  ].forEach(([k, v], n) => {
    p.setFont(undefined, 'normal').text(k, 104, y + n * 6);
    p.rect(150, y + n * 6 - 4, 48, 5.5);
    p.text(f2(v), 152, y + n * 6);
  });
  p.line(8, 255, 202, 255);
  p.line(8, 271, 202, 271);
  p.line(150, 255, 150, 289);
  p.setFontSize(6.5).setFont(undefined, 'normal').text(
    p.splitTextToSize(CERTIFY.join(' '), 136),
    11,
    259,
  );
  p.text('ELECTRONIC REFERENCE NO:', 152, 259);
  p.text(['TERMS OF SALES', ...TERMS], 11, 275);
  p.text('Authorised Signatory', 152, 275);
  p.save(`${isInv ? 'invoice' : 'bill'}-${d.financialYear || ''}-${no}.pdf`);
}
