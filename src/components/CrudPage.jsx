import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api, errMsg, rows } from '../lib/api';
import { num } from '../lib/utils';
import { Dialog, DialogContent } from './ui/dialog';
import ConfirmDialog from './ConfirmDialog';

function EntityForm({ fields, initial, onSubmit, busy, onCancel }) {
  const { register, handleSubmit } = useForm({ defaultValues: initial });
  const submit = (v) => onSubmit(Object.fromEntries(Object.entries(v).filter(([, x]) => !Number.isNaN(x))));
  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-3 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.wide ? 'sm:col-span-2' : ''}>
          <label className="label">{f.label}</label>
          <input className="input" type={f.type || 'text'} step="any" required={f.required}
            {...register(f.name, { valueAsNumber: f.type === 'number' })} />
        </div>
      ))}
      <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>Save</button>
      </div>
    </form>
  );
}

export default function CrudPage({ title, endpoint, columns, fields }) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState(null); // {} = new, row = editing
  const [del, setDel] = useState(null);
  const [q, setQ] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: [endpoint], queryFn: () => api.get(endpoint).then(rows) });
  const done = (msg, close) => { toast.success(msg); close(); qc.invalidateQueries({ queryKey: [endpoint] }); };

  const save = useMutation({
    mutationFn: (v) => (edit._id ? api.put(`${endpoint}/${edit._id}`, v) : api.post(endpoint, v)),
    onSuccess: () => done(`${title} ${edit._id ? 'updated' : 'added'}`, () => setEdit(null)),
    onError: (e) => toast.error(errMsg(e)),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => done(`${title} deleted`, () => setDel(null)),
    onError: (e) => toast.error(errMsg(e)),
  });

  const list = data.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  const initial = edit && Object.fromEntries(fields.map((f) => [f.name, f.type === 'number' ? num(edit[f.name]) : edit[f.name] ?? '']));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">{title}s</h1>
        <input className="input !w-48" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-primary" onClick={() => setEdit({})}><FiPlus />Add {title.toLowerCase()}</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>{columns.map((c) => <th key={c.label} className="th">{c.label}</th>)}<th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="td text-slate-500" colSpan={columns.length + 1}>Loading…</td></tr>}
            {!isLoading && !list.length && <tr><td className="td text-slate-500" colSpan={columns.length + 1}>No {title.toLowerCase()}s yet. Add the first one.</td></tr>}
            {list.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                {columns.map((c) => <td key={c.label} className="td num">{c.render ? c.render(r) : r[c.key] ?? '—'}</td>)}
                <td className="td text-right">
                  <button className="rounded p-2 hover:bg-slate-100" aria-label="Edit" onClick={() => setEdit(r)}><FiEdit2 /></button>
                  <button className="rounded p-2 text-red-700 hover:bg-red-50" aria-label="Delete" onClick={() => setDel(r)}><FiTrash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent title={edit?._id ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}>
          {edit && <EntityForm key={edit._id || 'new'} fields={fields} initial={initial} busy={save.isPending}
            onSubmit={(v) => save.mutate(v)} onCancel={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} loading={remove.isPending}
        text={`Delete ${del?.name}? This can't be undone.`} onConfirm={() => remove.mutate(del._id)} />
    </div>
  );
}
