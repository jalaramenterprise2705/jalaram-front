import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { api } from '../lib/api';
import { cn, fmtDate, inr, monthStart, today } from '../lib/utils';
import { Input, Label, Card } from '../components/ui/input';
import PrintableReport from '../components/ReportPrint';
import { PageLoader } from '../components/Loader';

const Range = ({ f, setF, children }) => (
  <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {children}
    <div>
      <Label>From</Label>
      <Input
        type="date"
        value={f.from}
        onChange={(e) => setF({ ...f, from: e.target.value })}
      />
    </div>
    <div>
      <Label>To</Label>
      <Input
        type="date"
        value={f.to}
        onChange={(e) => setF({ ...f, to: e.target.value })}
      />
    </div>
  </Card>
);

const T = ({ head, children, right = 2 }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr
          className="border-y bg-slate-50 text-left text-xs uppercase text-slate-500 print:bg-transparent"
        >
          {head.map((h, i) => (
            <th
              key={h}
              className={cn('whitespace-nowrap p-2', i >= right && 'text-right')}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const useRange = (start) => useState({ from: start || monthStart(), to: today() });
const period = (f) => `${fmtDate(f.from)} to ${fmtDate(f.to)}`;
function Ledger() {
  const [f, setF] = useRange();
  const [c, setC] = useState(null);
  const cust = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((r) => r.data),
  });
  const rep = useQuery({
    queryKey: ['ledger', c?.value, f],
    enabled: !!c,
    queryFn: () => api.get('/reports/customer-ledger', { params: { customerId: c.value, ...f } }).then((r) => r.data),
  });
  const d = rep.data;

  return (
    <div className="space-y-4">
      <Range f={f} setF={setF}>
        <div className="col-span-2">
          <Label>Customer</Label>
          <Select
            options={(cust.data || []).map((x) => ({ value: x._id, label: x.name }))}
            value={c}
            onChange={setC}
            placeholder="Select customer"
          />
        </div>
      </Range>
      {rep.isFetching
        ? <PageLoader />
        : d && (
          <PrintableReport
            title={`Customer Ledger - ${d.customer.name}`}
            subtitle={period(f)}
          >
            <div className="mb-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              {[
                ['Opening', d.opening],
                ['Sales', d.totals.sales],
                ['Received', d.totals.received],
                ['Current balance', d.closing],
              ].map(([k, v]) => (
                <div key={k} className="rounded border p-2">
                  <div className="text-xs text-slate-500">{k}</div>
                  <b>{inr(v)}</b>
                </div>
              ))}
            </div>
            <T head={['Date', 'Invoice / Mode', 'Debit', 'Credit', 'Balance']}>
              {d.rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{fmtDate(r.date)}</td>
                  <td className="p-2">
                    {r.type === 'INVOICE' ? r.ref : `Payment ${r.ref}`}
                    {r.legacy && <span className="ml-2 rounded bg-slate-100 px-1.5 text-[10px]">old</span>}
                  </td>
                  <td className="p-2 text-right">{r.debit ? inr(r.debit) : ''}</td>
                  <td className="p-2 text-right">{r.credit ? inr(r.credit) : ''}</td>
                  <td className="p-2 text-right">{r.balance == null ? '—' : inr(r.balance)}</td>
                </tr>
              ))}
            </T>
            {!d.rows.length && (
              <p className="py-3 text-center text-sm text-slate-500">
                No entries in this period
              </p>
            )}
            {d.undated.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                {d.undated.length}
                {' '}
                old bill(s) have an invalid date and are not included (
                {inr(d.undated.reduce((a, x) => a + x.debit, 0))}
                ).
              </p>
            )}
          </PrintableReport>
        )}
    </div>
  );
}

const ProductReport = ({ endpoint, title }) => {
  const [f, setF] = useRange();
  const rep = useQuery({
    queryKey: [endpoint, f],
    queryFn: () => api.get(`/reports/${endpoint}`, { params: f }).then((r) => r.data),
  });
  const rows = rep.data || [];

  return (
    <div className="space-y-4">
      <Range f={f} setF={setF} />
      {rep.isFetching
        ? <PageLoader />
        : (
          <PrintableReport title={title} subtitle={period(f)}>
            <T head={['No', 'Product', 'Bills', 'Qty', 'Amount (before GST)']}>
              {rows.map((r, n) => (
                <tr key={r._id} className="border-b">
                  <td className="p-2">{n + 1}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2 text-right">{r.invoices}</td>
                  <td className="p-2 text-right font-semibold">{r.qty}</td>
                  <td className="p-2 text-right">{inr(r.taxable)}</td>
                </tr>
              ))}
            </T>
          </PrintableReport>
        )}
    </div>
  );
};

function Gst() {
  const [f, setF] = useRange(today().slice(0, 4) + '-04-01');
  const rep = useQuery({
    queryKey: ['gst', f],
    queryFn: () => api.get('/reports/gst-monthly', { params: f }).then((r) => r.data),
  });

  return (
    <div className="space-y-4">
      <Range f={f} setF={setF} />
      {rep.isFetching
        ? <PageLoader />
        : (
          <PrintableReport title="GST Monthly" subtitle={period(f)}>
            <T
              head={['Month', 'Sales GST', 'Purchase GST', 'Net payable']}
              right={1}
            >
              {(rep.data?.rows || []).map((r) => (
                <tr key={r.month} className="border-b">
                  <td className="p-2">{r.month}</td>
                  <td className="p-2 text-right">{inr(r.outTax)}</td>
                  <td className="p-2 text-right">{inr(r.inTax)}</td>
                  <td
                    className={cn('p-2 text-right font-semibold', r.netPayable < 0 && 'text-emerald-600')}
                  >
                    {inr(r.netPayable)}
                  </td>
                </tr>
              ))}
            </T>
            {rep.data?.undatedInvoices?.n > 0 && (
              <p className="mt-2 text-xs text-amber-700">
                {rep.data.undatedInvoices.n}
                {' '}
                old bill(s) have an invalid date and are not in this monthly report.
              </p>
            )}
          </PrintableReport>
        )}
    </div>
  );
}

function Stock() {
  const q = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  });
  const rows = q.data || [];
  if (q.isFetching) {
    return <PageLoader />;
  }

  return (
    <PrintableReport title="Remaining Stock">
      <T head={['No', 'Product', 'HSN', 'Stock']}>{rows.map((p, n) => (
        <tr key={p._id} className="border-b">
          <td className="p-2">{n + 1}</td>
          <td className="p-2">{p.name}</td>
          <td className="p-2 text-right">{p.hsn}</td>
          <td
            className={cn('p-2 text-right font-semibold', p.qty < 0 && 'text-red-600')}
          >
            {p.qty}
          </td>
        </tr>
      ))}</T>
    </PrintableReport>
  );
}

function Balance() {
  const [only, setOnly] = useState(false);
  const q = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((r) => r.data),
  });
  const all = q.data || [];
  const rows = only ? all.filter((c) => c.balance) : all;
  if (q.isFetching) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-3">
      {/* <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={only}
          onChange={(e) => setOnly(e.target.checked)}
        />
        {' '}
        Only customers with a balance
      </label> */}
      <PrintableReport title="Customer Balance">
        <T head={['No', 'Customer Name', 'Address', 'Balance']} right={3}>
          {rows.map((c, n) => (
            <tr key={c._id} className="border-b">
              <td className="p-2">{n + 1}</td>
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.address}</td>
              <td
                className={cn('p-2 text-right font-semibold', c.balance < 0 && 'text-emerald-600')}
              >
                {inr(c.balance)}
              </td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="p-2" colSpan={3}>Total</td>
            <td className="p-2 text-right">
              {inr(rows.reduce((a, c) => a + (c.balance || 0), 0))}
            </td>
          </tr>
        </T>
      </PrintableReport>
    </div>
  );
}

export default function Reports() {
  const tabs = [
    ['stock', 'Remaining Stock', Stock],
    ['balance', 'Customer Balance', Balance],
    ['ledger', 'Customer Ledger', Ledger],
    [
      'psales',
      'Product Sales',
      () => (
        <ProductReport
          endpoint="product-sales"
          title="Product Sales Report"
        />
      ),
    ],
    [
      'ppurchase',
      'Product Purchase',
      () => (
        <ProductReport
          endpoint="product-purchases"
          title="Product Purchase Report"
        />
      ),
    ],
    ['gst', 'GST Monthly', Gst],
  ];
  const [t, setT] = useState('stock');
  const View = tabs.find((x) => x[0] === t)[2];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Reports</h1>
      <div
        className="flex gap-1 overflow-x-auto rounded-lg bg-white p-1 ring-1 ring-slate-200"
      >
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setT(k)} className={cn(
            'whitespace-nowrap rounded-md px-4 py-2 text-sm',
            t === k ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100',
          )}>{l}</button>
        ))}
      </div>
      <View />
    </div>
  );
}
