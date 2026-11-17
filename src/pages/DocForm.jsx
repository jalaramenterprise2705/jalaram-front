import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';
import { FiPlus, FiTrash2, FiSave, FiAlertTriangle } from 'react-icons/fi';
import { PageLoader } from '../components/Loader';
import PrintDialog from '../components/PrintDialog';
import { api } from '../lib/api';
import { fmtDate, inr, notify, r2, today } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input, Label, Card } from '../components/ui/input';

const MAX_ITEMS = 15;
const blank = () => ({
  productId: '',
  name: '',
  qty: 1,
  rate: '',
  discPct: 0,
  sgstPct: 0,
  cgstPct: 0,
});

// Same maths as the server (preview only; server recalculates everything)
const calc = (r) => {
  const rate = +r.rate || 0;
  const qty = +r.qty || 0;
  const taxable = r2(qty * (rate - r2((rate * (+r.discPct || 0)) / 100)));
  return {
    taxable,
    sgst: r2((taxable * (+r.sgstPct || 0)) / 100),
    cgst: r2((taxable * (+r.cgstPct || 0)) / 100),
  };
};

function DocFormInner({ kind }) {
  const isInv = kind === 'invoice';
  const base = isInv ? 'invoices' : 'bills';
  const route = isInv ? '/sales' : '/bills';
  const nf = isInv ? 'invoiceNo' : 'billNo';
  const df = isInv ? 'invoiceDate' : 'billDate';
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const [no, setNo] = useState('');
  const [manualNo, setManualNo] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [supplier, setSupplier] = useState('');
  const [desc, setDesc] = useState('');
  const [rows, setRows] = useState([blank()]);
  const [printId, setPrintId] = useState(null);
  const [loaded, setLoaded] = useState(!id);
  const products = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then((r) => r.data),
  });
  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((r) => r.data),
    enabled: isInv,
  });
  const info = useQuery({
    queryKey: ['nextno', base, date],
    enabled: date.length === 10,
    queryFn: () => api.get(`/${base}/next-no`, { params: { date } }).then((r) => r.data),
  });
  useEffect(() => {
    if (!id && info.data && !manualNo) {
      setNo(info.data.next);
    }
  }, [info.data, id, manualNo]);
  useEffect(() => {
    if (!id) {
      return;
    }
    api.get(`/${base}/${id}`).then(({ data: d }) => {
      setDate(d[df] ? d[df].slice(0, 10) : '');
      setNo(d[nf]);
      setManualNo(true);
      setDesc(d.description || '');
      setSupplier(d.supplier || '');
      if (isInv) {
        setCustomer(d.customerId ? { value: d.customerId, label: d.customerName } : null);
      }
      setRows(d.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty,
        rate: i.rate,
        discPct: i.discPct,
        sgstPct: i.sgstPct,
        cgstPct: i.cgstPct,
      })));
    }).catch(notify.err).finally(() => setLoaded(true));
  }, [id]); // eslint-disable-line
  const pOpts = useMemo(
    () => (products.data || []).map((p) => ({ value: p._id, label: `${p.name}  (stock ${p.qty})`, p })),
    [products.data],
  );
  const cOpts = useMemo(
    () => (customers.data || []).map((c) => ({ value: c._id, label: c.name })),
    [customers.data],
  );
  const upd = (i, k, v) => setRows((rs) => rs.map((r, n) => (n === i ? { ...r, [k]: v } : r)));
  const pick = (i, o) => setRows((rs) => rs.map((r, n) => (n === i
    ? {
      ...r,
      productId: o.value,
      name: o.p.name,
      rate: isInv ? o.p.salePrice : o.p.purchasePrice,
      sgstPct: o.p.sgstPct,
      cgstPct: o.p.cgstPct,
    }
    : r)));
  const t = useMemo(() => {
    const c = rows.map(calc);
    const s = (k) => r2(c.reduce((a, x) => a + x[k], 0));
    const gross = s('taxable');
    const sgst = s('sgst');
    const cgst = s('cgst');
    return {
      gross,
      sgst,
      cgst,
      grand: Math.round(gross + sgst + cgst),
    };
  }, [rows]);
  const backdated = !id && info.data?.lastDate && date && date < info.data.lastDate.slice(0, 10);
  const save = useMutation({
    mutationFn: (payload) => (id ? api.put(`/${base}/${id}`, payload) : api.post(`/${base}`, payload)),
    onSuccess: ({ data }) => {
      notify.ok(id ? 'Bill updated' : isInv ? 'Sales bill added' : 'Purchase bill added');
      ['invoices', 'bills', 'products', 'customers'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setPrintId(data._id);
    },
    onError: notify.err,
  });
  const submit = (e) => {
    e.preventDefault();
    if (save.isPending) {
      return;
    }
    const items = rows.filter((r) => r.productId).map((r) => ({
      productId: r.productId,
      qty: +r.qty,
      rate: +r.rate,
      discPct: +r.discPct || 0,
      sgstPct: +r.sgstPct,
      cgstPct: +r.cgstPct,
    }));
    if (!id && !date) {
      return notify.err({ message: 'Please enter the date' });
    }
    if (isInv && !customer) {
      return notify.err({ message: 'Please select a customer' });
    }
    if (!items.length) {
      return notify.err({ message: 'Add at least one item' });
    }
    const payload = { [nf]: Number(no) || undefined, items };
    if (date) {
      payload[df] = date;
    }
    if (isInv) {
      payload.customerId = customer.value;
    }
    else {
      payload.supplier = supplier;
    }
    save.mutate(payload);
  };
  const ready = !products.isLoading && (!isInv || !customers.isLoading) && loaded;
  if (!ready) {
    return <PageLoader />;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-xl font-bold">
        {id ? 'Edit' : 'Add'}
        {' '}
        {isInv ? 'Sales Bill' : 'Purchase Bill'}
      </h1>
      <Card
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (!id) {
                setManualNo(false);
              }
            }}
          />
        </div>
        <div>
          <Label>Financial year / Number</Label>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-2 py-2 text-sm whitespace-nowrap">
              {info.data?.financialYear || '—'}
            </span>
            <Input
              type="number"
              min="1"
              value={no}
              onChange={(e) => {
                setNo(e.target.value);
                setManualNo(true);
              }}
            />
          </div>
        </div>
        {isInv
          ? (
            <div className="sm:col-span-2">
              <Label>Customer</Label>
              <Select
                options={cOpts}
                value={customer}
                onChange={setCustomer}
                placeholder="Select customer"
                isLoading={customers.isLoading}
              />
            </div>
          )
          : (
            <div className="sm:col-span-2">
              <Label>Supplier</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
          )}
        {info.data && (
          <p className="text-xs text-slate-500 sm:col-span-2 lg:col-span-4">
            Last number this year:
            {' '}
            <b>{info.data.lastNo || '—'}</b>
            {info.data.lastDate && (
              <>
                {' '}
                · last date:
                {' '}
                <b>{fmtDate(info.data.lastDate)}</b>
              </>
            )}
          </p>
        )}
        {backdated && (
          <p
            className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 sm:col-span-2 lg:col-span-4"
          >
            <FiAlertTriangle />
            {' '}
            This is an older date, so the number will not be in date order.
          </p>
        )}
      </Card>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const c = calc(r);

          return (
            <Card
              key={i}
              className="grid grid-cols-2 gap-2 md:grid-cols-12 md:items-end"
            >
              <div className="col-span-2 md:col-span-4">
                <Label>Item</Label>
                <Select
                  options={pOpts}
                  value={r.productId ? { value: r.productId, label: r.name } : null}
                  onChange={(o) => pick(i, o)}
                  placeholder="Select item"
                  isLoading={products.isLoading}
                />
              </div>
              <div className="md:col-span-1">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={r.qty}
                  onChange={(e) => upd(i, 'qty', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Rate</Label>
                <Input
                  type="number"
                  step="any"
                  value={r.rate}
                  onChange={(e) => upd(i, 'rate', e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Label>Disc %</Label>
                <Input
                  type="number"
                  step="any"
                  value={r.discPct}
                  onChange={(e) => upd(i, 'discPct', e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Label>GST %</Label>
                <Input
                  readOnly
                  tabIndex={-1}
                  className="bg-slate-100"
                  value={(+r.sgstPct || 0) + (+r.cgstPct || 0)}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Amount</Label>
                <div className="flex h-10 items-center text-sm font-semibold">
                  {inr(c.taxable + c.sgst + c.cgst)}
                </div>
              </div>
              <div className="flex justify-end md:col-span-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, n) => n !== i) : [blank()]))}
                >
                  <FiTrash2 />
                </Button>
              </div>
            </Card>
          );
        })}
        {rows.length < MAX_ITEMS
          ? (
            <Button
              variant="outline"
              onClick={() => setRows((rs) => [...rs, blank()])}
            >
              <FiPlus />
              {' '}
              Add item
            </Button>
          )
          : (
            <p className="text-sm text-slate-500">
              Maximum
              {' '}
              {MAX_ITEMS}
              {' '}
              items per bill
            </p>
          )}
      </div>
      <Card className="ml-auto w-full md:max-w-sm">
        <dl className="space-y-1 text-sm">
          {[['Gross', t.gross], ['SGST', t.sgst], ['CGST', t.cgst]].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt>{k}</dt>
              <dd>{inr(v)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1 text-lg font-bold">
            <dt>Grand Total</dt>
            <dd>{inr(t.grand)}</dd>
          </div>
        </dl>
      </Card>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => nav(route)}>Back</Button>
        <Button type="submit" loading={save.isPending}>
          <FiSave />
          {' '}
          Save
        </Button>
      </div>
      {printId && (
        <PrintDialog
          kind={kind}
          id={printId}
          title="Bill saved"
          onClose={() => nav(route)}
        />
      )}
    </form>
  );
}

// New key per kind + id: opening "Add" after "Edit" always starts with an empty form
export default function DocForm(props) {
  const { id } = useParams();
  return <DocFormInner key={`${props.kind}-${id || 'new'}`} {...props} />;
}
