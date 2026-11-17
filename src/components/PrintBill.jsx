import { forwardRef } from 'react';
import { fmtDate } from '../lib/utils';
import { TERMS, CERTIFY } from '../lib/store';

const f2 = (n) => Number(n || 0).toFixed(2);
const ROWS = 15;

// Column widths in % (Product is the widest so long names wrap instead of squeezing the numbers)
const COLUMNS = [
  ['SrNo', 5],
  ['Product', 25],
  ['HSN No', 9],
  ['Qty', 5],
  ['Rate', 7],
  ['Disc(%)', 6.5],
  ['Disc Amt', 6.5],
  ['Taxable Amt', 9],
  ['SGST(%)', 6],
  ['SGST Amt', 7.5],
  ['CGST(%)', 6],
  ['CGST Amt', 7.5],
];

const cell = 'border border-black px-1 text-center align-middle';

// Same layout as the old printed tax invoice. Purchase bills show only the supplier name.
// Size = A4 minus 10mm page margin on every side (see pageStyle in PrintDialog).
const PrintBill = forwardRef(({ doc: d, kind, store, party }, ref) => {
  const isInv = kind === 'invoice';
  const word = isInv ? 'INVOICE' : 'BILL';
  const no = isInv ? d.invoiceNo : d.billNo;
  const date = d[isInv ? 'invoiceDate' : 'billDate'];
  const bank = store.bank;
  const rows = [...d.items];
  while (rows.length < ROWS) {
    rows.push(null);
  }
  const totals = [
    ['GROSS AMT', d.gross],
    ['Discount(-)', d.discount],
    ['SGST(+)', d.sgst],
    ['CGST(+)', d.cgst],
    ['Total Invoice Value(=)', d.grandTotal],
  ];
  const bankLines = [
    ['Payable', bank.payable],
    ['Bank', bank.name],
    ['Account No', bank.account],
    ['Branch', bank.branch],
    ['IFSC Code', bank.ifsc],
  ];

  return (
    <div
      ref={ref}
      className="mx-auto bg-white font-serif text-[12px] text-black"
      style={{ width: '190mm', height: '275mm' }}
    >
      <div className="flex h-full flex-col border-2 border-black">
        <div className="border-b border-black py-1 text-center">
          <div className="text-[32px] font-bold leading-tight">{store.name}</div>
          <div>{store.address}</div>
          <div>
            Phone:
            <b>{store.phone}</b>
          </div>
        </div>
        <div className="border-b border-black text-center font-bold">
          {isInv ? 'GST TAX INVOICE' : 'PURCHASE BILL'}
        </div>
        <div className="flex border-b border-black">
          <div className="flex flex-1 items-center px-1">{store.gstin && (
            <>
              GSTIN No:
              <b>{store.gstin}</b>
            </>
          )}</div>
          <div className="w-[260px] border-l border-black px-1 py-0.5">
            {word}
            {' '}
            No:
            <b>{no}</b>
            <br />
            {word}
            {' '}
            DATE:
            <b>{date ? fmtDate(date) : d.dateText}</b>
          </div>
        </div>
        {isInv && d.customerName && (
          <div className="min-h-[74px] border-b border-black px-1 py-1">
            <div>DETAIL OF RECEIVER:</div>
            <div className="text-[22px] font-bold leading-tight">{d.customerName}</div>
            <div>{party?.address}</div>
            {party?.gstin && (
              <div className="mt-1">
                GSTIN:
                {party.gstin}
              </div>
            )}
          </div>
        )}
        {!isInv && d.supplier && (
          <div className="border-b border-black px-1 py-1">
            SUPPLIER:
            <div className="text-[22px] font-bold leading-tight">{d.supplier}</div>
          </div>
        )}
        {/* items: always 15 boxed rows, free page space is shared between the rows */}
        <div className="flex-1 p-1">
          <table className="h-full w-full table-fixed border-collapse">
            <colgroup>{COLUMNS.map(([name, width]) => <col key={name} style={{ width: `${width}%` }} />)}</colgroup>
            <thead><tr>{COLUMNS.map(([name]) => <th key={name} className={`${cell} font-bold leading-tight`}>{name}</th>)}</tr></thead>
            <tbody>{rows.map((item, n) => {
              const values = item
                ? [
                  n + 1,
                  item.name,
                  item.hsn,
                  item.qty,
                  f2(item.rate),
                  f2(item.discPct),
                  f2(item.discAmt),
                  f2(item.taxable),
                  f2(item.sgstPct),
                  f2(item.sgstAmt),
                  f2(item.cgstPct),
                  f2(item.cgstAmt),
                ]
                : Array(COLUMNS.length).fill('');

              return (
                <tr key={n}>{values.map((value, k) => (
                  <td
                    key={k}
                    className={`${cell} h-[19px] ${k === 1 ? 'break-words py-0.5 text-left text-[11px] leading-tight' : ''}`}
                  >
                    {value}
                  </td>
                ))}</tr>
              );
            })}</tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 gap-2 p-1">
          {isInv
            ? (
              <div className="space-y-1">{bankLines.map(([label, value]) => (
                <div key={label} className="flex">
                  <span className="w-[90px]">
                    {label}
                    {' '}
                    :
                  </span>
                  <b>{value}</b>
                </div>
              ))}</div>
            )
            : <div />}
          <div className="space-y-1">{totals.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span>{label}</span>
              <span className="w-[150px] border border-black px-1">{f2(value)}</span>
            </div>
          ))}</div>
        </div>
        <div
          className="grid grid-cols-[1fr_190px] border-t border-black text-[10px]"
        >
          <div className="border-r border-black p-1">
            {CERTIFY.map((line) => <div key={line}>{line}</div>)}
          </div>
          <div className="p-1">ELECTRONIC REFERENCE NO:</div>
        </div>
        <div
          className="grid grid-cols-[1fr_190px] border-t border-black text-[10px]"
        >
          <div className="border-r border-black p-1">
            TERMS OF SALES
            {TERMS.map((line) => <div key={line}>{line}</div>)}
          </div>
          <div className="p-1">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
});

export default PrintBill;
