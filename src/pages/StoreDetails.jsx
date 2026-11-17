import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiSave } from 'react-icons/fi';
import { api } from '../lib/api';
import { mergeStore } from '../lib/store';
import { notify } from '../lib/utils';
import { PageLoader } from '../components/Loader';
import { Button } from '../components/ui/button';
import { Input, Label, Card } from '../components/ui/input';

const F = [
  ['name', 'Shop name', 1],
  ['address', 'Address', 1],
  ['phone', 'Phone'],
  ['gstin', 'GSTIN (leave empty to hide on bills)'],
  ['bank_payable', 'Payable (account holder)', 1],
  ['bank_name', 'Bank name', 1],
  ['bank_account', 'Account No'],
  ['bank_branch', 'Branch'],
  ['bank_ifsc', 'IFSC Code'],
];

export default function StoreDetails() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => {
    if (q.data) {
      const s = mergeStore(q.data);
      reset({
        name: s.name,
        address: s.address,
        phone: s.phone,
        gstin: s.gstin,
        bank_payable: s.bank.payable,
        bank_name: s.bank.name,
        bank_account: s.bank.account,
        bank_branch: s.bank.branch,
        bank_ifsc: s.bank.ifsc,
      });
    }
  }, [q.data, reset]);
  const save = useMutation({
    mutationFn: (v) => api.put('/settings', {
      name: v.name,
      address: v.address,
      phone: v.phone,
      gstin: v.gstin.toUpperCase(),
      bank: {
        payable: v.bank_payable,
        name: v.bank_name,
        account: v.bank_account,
        branch: v.bank_branch,
        ifsc: v.bank_ifsc.toUpperCase(),
      },
    }),
    onSuccess: () => {
      notify.ok('Store details saved');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: notify.err,
  });
  if (q.isLoading) {
    return <PageLoader />;
  }

  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v))}
      className="space-y-4"
    >
      <h1 className="text-xl font-bold">Store Details</h1>
      <p className="text-sm text-slate-500">
        These details are printed on every bill.
      </p>
      <Card className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {F.map(([k, l, full]) => (
          <div key={k} className={full ? 'sm:col-span-2' : ''}>
            <Label>{l}</Label>
            <Input {...register(k)} />
          </div>
        ))}
      </Card>
      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>
          <FiSave />
          {' '}
          Save
        </Button>
      </div>
    </form>
  );
}
