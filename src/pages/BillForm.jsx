import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Select from 'react-select';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api, errMsg, rows } from '../lib/api';
import { CFG } from '../lib/config';
import { inr, num, today } from '../lib/utils';

const blank = { productId: '', qty: 1, rate: 0, discount: 0 };
const idOf = (v) => v?._id ?? v ?? '';

export default function BillForm({ type }) {
  const c = CFG[type];
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { date: today(), number: '', party: '', description: '', items: [blank] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const products = useQuery({ queryKey: ['/products'], queryFn: () => api.get('/products').then(rows) }).data ?? [];
  const customers = useQuery({ queryKey: ['/customers'], queryFn: () => api.get('/customers').then(rows), enabled: type === 'sales' }).data ?? [];
  const date = watch('date');
  const items = watch('items');

  // Edit: load the bill
  useEffect(() => {
    if (!id) return;
    api.get(`${c.ep}/${id}`).then(({ data }) => {
      const d = data.data ?? data;
      reset({
        date: (d[c.dateKey] || '').slice(0, 10), number: d[c.numKey],
        party: idOf(d[c.partyKey]), description: d.description || '',
        items: d.items.map((i) => ({ productId: idOf(i.productId), qty: num(i.qty), rate: num(i.rate), discount: num(i.discount) })),
      });
    }).catch((e) => toast.error(errMsg(e)));
  }, [id]); // eslint-disable-line

  // New bill: the number follows the date's financial year (April 2027 starts again at 1)
  useEffect(() => {
    if (id || !date) return;
    api.get(`${c.ep}/next-no`, { params: { date } }).then(({ data }) => {
      setValue('number', data.nextNo);
      const last = data.lastDate?.slice(0, 10);
      setWarn(last && date < last
        ? `This financial year already has bills dated up to ${last}. A back-dated bill gets the next free number, so numbers won't follow date order. To fill a gap, type the missing number yourself.`
        : '');
    }).catch(() => {});
  }, [date, id]); // eslint-disable-line

  const pOpts = products.map((p) => ({ value: p._id, label: p.name, p }));
  const cOpts = customers.map((x) => ({ value: x._id, label: x.name }));
  const estimate = items.reduce((s, i) => s + (+i.qty || 0) * (+i.rate || 0) * (1 - (+i.discount || 0) / 100), 0);

  const onSubmit = async (v) => {
    const its = v.items.filter((i) => i.productId);
    if (!v.party) return toast.error(`Select a ${c.partyLabel.toLowerCase()}`);
    if (!its.length || its.some((i) => !(+i.qty > 0))) return toast.error('Add at least one product with quantity above 0');
    const body = {
      [c.dateKey]: v.date, [c.numKey]: Number(v.number), [c.partyKey]: v.party, description: v.description,
      items: its.map((i) => ({ productId: i.productId, qty: +i.qty, rate: +i.rate, discount: +i.discount || 0 })),
    };
    setBusy(true);
    try {
      await (id ? api.put(`${c.ep}/${id}`, body) : api.post(c.ep, body));
      toast.success(`${c.label} ${id ? 'updated' : 'added'}`);
      ['/products', '/customers', c.ep].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      nav(c.path);
    } catch (e) { toast.error(errMsg(e)); } // duplicate number → 409 message shows here
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Link to={c.path} className="rounded p-2 hover:bg-slate-200" aria-label="Back"><FiArrowLeft /></Link>
        <h1 className="text-xl font-semibold">{id ? 'Edit' : 'New'} {c.label.toLowerCase()}</h1>
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-3">
        <div><label className="label">Date</label><input type="date" className="input" required {...register('date')} /></div>
        <div><label className="label">Number</label><input type="number" min="1" className="input num" required {...register('number')} /></div>
        <div>
          <label className="label">{c.partyLabel}</label>
          {type === 'sales' ? (
            <Controller control={control} name="party" render={({ field }) => (
              <Select options={cOpts} value={cOpts.find((o) => o.value === field.value) || null}
                onChange={(o) => field.onChange(o.value)} placeholder="Select customer" />
            )} />
          ) : <input className="input" {...register('party')} />}
        </div>
        {warn && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-3">{warn}</p>}
      </div>

      <div className="card space-y-3 p-4">
        {fields.map((f, i) => (
          <div key={f.id} className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3 last:border-0 sm:grid-cols-12">
            <div className="col-span-3 sm:col-span-5">
              <Controller control={control} name={`items.${i}.productId`} render={({ field }) => (
                <Select options={pOpts} value={pOpts.find((o) => o.value === field.value) || null} placeholder="Product"
                  onChange={(o) => { field.onChange(o.value); setValue(`items.${i}.rate`, num(type === 'sales' ? o.p.rate : o.p.purchasePrice)); }} />
              )} />
            </div>
            <div className="sm:col-span-2"><label className="label">Qty</label><input type="number" step="1" className="input num" {...register(`items.${i}.qty`)} /></div>
            <div className="sm:col-span-2"><label className="label">Rate</label><input type="number" step="any" className="input num" {...register(`items.${i}.rate`)} /></div>
            <div className="sm:col-span-2"><label className="label">Disc %</label><input type="number" step="any" className="input num" {...register(`items.${i}.discount`)} /></div>
            <div className="flex items-end justify-end sm:col-span-1">
              <button type="button" className="rounded p-2.5 text-red-700 hover:bg-red-50" aria-label="Remove item" onClick={() => remove(i)}><FiTrash2 /></button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => append(blank)}><FiPlus />Add item</button>
      </div>

      <div className="card space-y-3 p-4">
        <div><label className="label">Description</label><input className="input" {...register('description')} /></div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Estimate before GST: <b className="num text-ink">{inr(estimate)}</b>. The final total is calculated when you save.</p>
          <div className="flex gap-2">
            <Link to={c.path} className="btn btn-ghost">Cancel</Link>
            <button className="btn btn-primary" disabled={busy}>{id ? 'Save changes' : 'Save bill'}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
