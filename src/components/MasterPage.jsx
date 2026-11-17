import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiPlus, FiSearch } from 'react-icons/fi';
import { api } from '../lib/api';
import { notify } from '../lib/utils';
import { Button } from './ui/button';
import { Input, Label, Card } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

import { PageLoader } from './Loader';
import Pagination from './Pagination';

// Shared list (search + pagination) and add/edit modal for Customers and Products
export default function MasterPage({ title, endpoint, columns, fields, schema, defaults, rowExtra }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [paging, setPaging] = useState({ page: 1, limit: 20 });
  const [edit, setEdit] = useState(null); // {} = new record, row = existing record
  const list = useQuery({
    queryKey: [endpoint, 'page', search, paging],
    queryFn: () => api.get(`/${endpoint}`, { params: { q: search || undefined, ...paging } }).then((r) => r.data),
  });
  const { register, handleSubmit, reset, formState: { errors }, } = useForm({ resolver: yupResolver(schema), defaultValues: defaults });
  const openForm = (row) => {
    setEdit(row);
    reset(row._id ? row : defaults);
  };
  const save = useMutation({
    mutationFn: (values) => (edit._id ? api.put(`/${endpoint}/${edit._id}`, values) : api.post(`/${endpoint}`, values)),
    onSuccess: () => {
      notify.ok(edit._id ? 'Updated' : 'Added');
      setEdit(null);
      qc.invalidateQueries({ queryKey: [endpoint] });
    },
    onError: notify.err,
  });
  const onSubmit = (values) => save.mutate(Object.fromEntries(fields.map((f) => [f.name, values[f.name]])));
  const rows = list.data?.rows || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <Button onClick={() => openForm({})}>
          <FiPlus />
          {' '}
          Add
        </Button>
      </div>
      <div className="relative">
        <FiSearch className="absolute left-3 top-3 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPaging((p) => ({ ...p, page: 1 }));
          }}
        />
      </div>
      {list.isFetching
        ? <PageLoader />
        : (
          <>
            {/* mobile cards */}
            <div className="space-y-2 md:hidden">{rows.map((r) => (
              <Card key={r._id}>
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.name}</div>
                    <div className="mt-1 space-y-0.5 text-sm text-slate-600">
                      {columns.slice(1).map((c) => (
                        <div key={c.key}>
                          <span className="text-slate-400">
                            {c.label}
                            :
                            {' '}
                          </span>
                          {c.render ? c.render(r) : (r[c.key] ?? '—')}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openForm(r)}>
                      <FiEdit2 />
                    </Button>
                    {rowExtra?.(r)}
                  </div>
                </div>
              </Card>
            ))}</div>
            {/* desktop table */}
            <Card className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead
                  className="bg-slate-50 text-left text-xs uppercase text-slate-500"
                >
                  <tr>
                    {columns.map((c) => <th key={c.key} className="p-3">{c.label}</th>)}
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>{rows.map((r) => (
                  <tr key={r._id} className="border-t">
                    {columns.map((c) => (
                      <td key={c.key} className="p-3">
                        {c.render ? c.render(r) : (r[c.key] ?? '—')}
                      </td>
                    ))}
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => openForm(r)}
                        >
                          <FiEdit2 />
                        </Button>
                        {rowExtra?.(r)}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </Card>
            {!rows.length && <p className="py-8 text-center text-slate-500">Nothing found</p>}
            <Pagination
              page={list.data?.page || 1}
              pages={list.data?.pages}
              total={list.data?.total}
              limit={paging.limit}
              onPage={(page) => setPaging((p) => ({ ...p, page }))}
              onLimit={(limit) => setPaging({ page: 1, limit })}
            />
          </>
        )}
      <Dialog open={!!edit} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {edit?._id ? 'Edit' : 'Add'}
              {' '}
              {title}
            </DialogTitle>
            <DialogDescription>Fill in the details and save.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-3"
          >
            {fields.map((f) => (
              <div key={f.name} className={f.full ? 'col-span-2' : ''}>
                <Label>{f.label}</Label>
                <Input
                  type={f.type || 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                  maxLength={f.maxLength}
                  inputMode={f.inputMode}
                  {...register(f.name, f.format ? { onChange: (e) => (e.target.value = f.format(e.target.value)) } : {})}
                />
                {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name].message}</p>}
              </div>
            ))}
            <DialogFooter className="col-span-2">
              <Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button>
              <Button type="submit" loading={save.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
