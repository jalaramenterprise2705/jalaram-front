import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api, errMsg, rows } from '../lib/api';
import { CFG } from '../lib/config';
import { fmtDate, inr } from '../lib/utils';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Bills({ type }) {
  const c = CFG[type];
  const qc = useQueryClient();
  const [del, setDel] = useState(null);
  const [q, setQ] = useState('');
  const { data = [], isLoading } = useQuery({ queryKey: [c.ep], queryFn: () => api.get(c.ep).then(rows) });
  console.log({ data });
  const cancel = useMutation({
    mutationFn: (id) => api.delete(`${c.ep}/${id}`),
    onSuccess: () => {
      toast.success(`${c.label} cancelled`);
      setDel(null);
      ['/products', '/customers', c.ep].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const no = (r) => `${r.financialYear ?? ''}/${r[c.numKey]}`;
  const party = (r) => r.customerName || r.customer?.name || r.supplier || '—';
  const list = data.filter((r) => `${no(r)} ${party(r)}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">{c.label}s</h1>
        <input className="input !w-48" placeholder="Search number or name" value={q} onChange={(e) => setQ(e.target.value)} />
        <Link to={`${c.path}/new`} className="btn btn-primary"><FiPlus />New {c.label.toLowerCase()}</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr><th className="th">Number</th><th className="th">Date</th><th className="th">{c.partyLabel}</th><th className="th text-right">Total</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && <tr><td className="td text-slate-500" colSpan={5}>Loading…</td></tr>}
            {!isLoading && !list.length && <tr><td className="td text-slate-500" colSpan={5}>No bills found.</td></tr>}
            {list.map((r) => {
              const cancelled = r.status === 'cancelled';
              return (
                <tr key={r._id} className={cancelled ? 'bg-slate-50 text-slate-400' : 'hover:bg-slate-50'}>
                  <td className="td num font-medium">{no(r)}{cancelled && <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs">Cancelled</span>}</td>
                  <td className="td num">{fmtDate(r[c.dateKey])}</td>
                  <td className="td">{party(r)}</td>
                  <td className="td num text-right">{inr(r.grandTotal)}</td>
                  <td className="td text-right">
                    {!cancelled && <>
                      <Link to={`${c.path}/${r._id}/edit`} className="inline-block rounded p-2 hover:bg-slate-100" aria-label="Edit"><FiEdit2 /></Link>
                      <button className="rounded p-2 text-red-700 hover:bg-red-50" aria-label="Cancel bill" onClick={() => setDel(r)}><FiTrash2 /></button>
                    </>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} loading={cancel.isPending}
        title={`Cancel ${c.label.toLowerCase()}?`} confirmLabel="Cancel bill"
        text={`Bill ${del ? no(del) : ''} will be cancelled. Stock and balance are reversed, and the number can't be used again.`}
        onConfirm={() => cancel.mutate(del._id)} />
    </div>
  );
}
