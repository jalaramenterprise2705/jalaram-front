import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiTrash2, FiPlus, FiPrinter, FiAlertTriangle } from 'react-icons/fi';
import { api } from '../lib/api';
import { fmtDate, inr, notify } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input, Label, Card } from '../components/ui/input';
import ConfirmDialog from '../components/ConfirmDialog';
import PrintDialog from '../components/PrintDialog';
import Pagination from '../components/Pagination';
import { PageLoader } from '../components/Loader';

// One list for both Sales bills (kind="invoice") and Purchase bills (kind="bill")
export default function DocList({ kind }) {
  const isInv = kind === 'invoice';
  const base = isInv ? 'invoices' : 'bills';
  const route = isInv ? '/sales' : '/bills';
  const noField = isInv ? 'invoiceNo' : 'billNo';
  const dateField = isInv ? 'invoiceDate' : 'billDate';
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ from: '', to: '', customerId: '' });
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [printId, setPrintId] = useState(null);
  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((r) => r.data),
    enabled: isInv,
  });
  const list = useQuery({
    queryKey: [base, filters, paging],
    queryFn: () => api
      .get(`/${base}`, {
      params: {
        ...paging,
        from: filters.from || undefined,
        to: filters.to || undefined,
        customerId: filters.customerId || undefined,
      },
    }).then((r) => r.data),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/${base}/${id}`),
    onSuccess: () => {
      notify.ok(isInv ? 'Sales bill deleted' : 'Purchase bill deleted');
      setDeleteTarget(null);
      ['invoices', 'bills', 'products', 'customers'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: notify.err,
  });
  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPaging((p) => ({ ...p, page: 1 }));
  };
  const rows = list.data?.rows || [];
  const label = (d) => `${d.financialYear || '?'} / ${d[noField]}`;
  const party = (d) => (isInv ? d.customerName : d.supplier || '—');
  const Flag = ({ d }) => d.issues?.length
    ? (
      <span
        title={d.issues.join(', ')}
        className="ml-1 inline-flex text-amber-500"
      >
        <FiAlertTriangle />
      </span>
    )
    : null;
  const Actions = ({ d }) => (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        title="Print / Download"
        onClick={() => setPrintId(d._id)}
      >
        <FiPrinter />
      </Button>
      <Link to={`${route}/${d._id}/edit`}>
        <Button variant="ghost" size="icon" title="Edit"><FiEdit2 /></Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="text-red-600"
        title="Delete"
        onClick={() => setDeleteTarget(d)}
      >
        <FiTrash2 />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {isInv ? 'Sales Bills' : 'Purchase Bills'}
        </h1>
        <Link to={`${route}/new`}>
          <Button>
            <FiPlus />
            {' '}
            {isInv ? 'Add Sales' : 'Add Bill'}
          </Button>
        </Link>
      </div>
      <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <Label>From</Label>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
          />
        </div>
        <div>
          <Label>To</Label>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
          />
        </div>
        {isInv && (
          <div className="col-span-2">
            <Label>Customer</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={filters.customerId}
              onChange={(e) => setFilter('customerId', e.target.value)}
            >
              <option value="">All</option>
              {customers.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </Card>
      {list.isFetching
        ? <PageLoader />
        : (
          <>
            {/* mobile cards */}
            <div className="space-y-2 md:hidden">{rows.map((d) => (
              <Card key={d._id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">
                      {label(d)}
                      <Flag d={d} />
                    </div>
                    <div className="text-xs text-slate-500">
                      {d[dateField] ? fmtDate(d[dateField]) : d.dateText}
                    </div>
                  </div>
                  <div className="text-right font-bold">{inr(d.grandTotal)}</div>
                </div>
                <div className="mt-1 truncate text-sm">{party(d)}</div>
                <div className="mt-2 flex justify-end"><Actions d={d} /></div>
              </Card>
            ))}</div>
            {/* desktop table */}
            <Card className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead
                  className="bg-slate-50 text-left text-xs uppercase text-slate-500"
                >
                  <tr>
                    <th className="p-3">Invoice</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">{isInv ? 'Customer' : 'Supplier'}</th>
                    <th className="p-3 text-right">Gross</th>
                    <th className="p-3 text-right">GST</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>{rows.map((d) => (
                  <tr key={d._id} className="border-t">
                    <td className="p-3 font-medium">
                      {label(d)}
                      <Flag d={d} />
                    </td>
                    <td className="p-3">{d[dateField]
                      ? fmtDate(d[dateField])
                      : <span className="text-amber-600">{d.dateText}</span>}</td>
                    <td className="max-w-[220px] truncate p-3">{party(d)}</td>
                    <td className="p-3 text-right">{inr(d.gross)}</td>
                    <td className="p-3 text-right">{inr((d.sgst || 0) + (d.cgst || 0))}</td>
                    <td className="p-3 text-right font-semibold">{inr(d.grandTotal)}</td>
                    <td className="p-3"><Actions d={d} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            {!rows.length && <p className="py-8 text-center text-slate-500">No bills found</p>}
            <Pagination
              page={paging.page}
              pages={list.data?.pages}
              total={list.data?.total}
              limit={paging.limit}
              onPage={(page) => setPaging((p) => ({ ...p, page }))}
              onLimit={(limit) => setPaging({ page: 1, limit })}
            />
          </>
        )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this bill?"
        confirmText="Yes, delete"
        loading={remove.isPending}
        description={deleteTarget &&
          `${label(deleteTarget)} (${inr(deleteTarget.grandTotal)}) will be deleted. Stock ${isInv ? 'will be added back and the customer balance will go down' : 'will be reduced'}. The number can be used again.`}
        onConfirm={() => remove.mutate(deleteTarget._id)}
      />
      {printId && (
        <PrintDialog
          kind={kind}
          id={printId}
          onClose={() => setPrintId(null)}
        />
      )}
    </div>
  );
}
