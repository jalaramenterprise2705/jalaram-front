import { useState } from 'react';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiDollarSign } from 'react-icons/fi';
import MasterPage from '../components/MasterPage';
import { api } from '../lib/api';
import { inr, notify, today } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';

const schema = yup.object({
  name: yup.string().trim().required('Name is required'),
  address: yup.string(),
  phone: yup.string().test('ph', 'Enter a 10 digit phone number', (v) => !v || /^\d{10}$/.test(v)),
  gstin: yup.string(),
});

export default function Customers() {
  const qc = useQueryClient();
  const [pay, setPay] = useState(null);
  const [f, setF] = useState({ amount: '', date: today(), mode: 'Cash' });
  const m = useMutation({
    mutationFn: () => api.post('/payments', { customerId: pay._id, ...f, amount: +f.amount }),
    onSuccess: () => {
      notify.ok('Payment saved');
      setPay(null);
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: notify.err,
  });

  return (
    <>
      <MasterPage
        title="Customers"
        endpoint="customers"
        schema={schema}
        defaults={{ name: '', address: '', phone: '', gstin: '' }}
        fields={[
          { name: 'name', label: 'Name', full: true },
          { name: 'address', label: 'Address', full: true },
          {
            name: 'phone',
            label: 'Phone (10 digits)',
            maxLength: 10,
            inputMode: 'numeric',
            format: (v) => v.replace(/\D/g, '').slice(0, 10),
          },
          {
            name: 'gstin',
            label: 'GSTIN',
            maxLength: 15,
            format: (v) => v.toUpperCase(),
          },
        ]}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'gstin', label: 'GSTIN' },
          {
            key: 'balance',
            label: 'Balance',
            render: (r) => (
              <b className={r.balance > 0 ? 'text-red-600' : 'text-emerald-600'}>
                {inr(r.balance)}
              </b>
            ),
          },
        ]}
        rowExtra={(r) => (
          <Button
            variant="ghost"
            size="icon"
            title="Receive payment"
            className="text-emerald-600"
            onClick={() => {
              setPay(r);
              setF({ amount: '', date: today(), mode: 'Cash' });
            }}
          >
            <FiDollarSign />
          </Button>
        )}
      />
      <Dialog open={!!pay} onOpenChange={(o) => !o && setPay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Payment -
              {' '}
              {pay?.name}
            </DialogTitle>
            <DialogDescription>
              Current balance:
              {' '}
              {inr(pay?.balance)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={f.amount}
                onChange={(e) => setF({ ...f, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={f.date}
                onChange={(e) => setF({ ...f, date: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Mode</Label>
              <Input
                value={f.mode}
                onChange={(e) => setF({ ...f, mode: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPay(null)}>Cancel</Button>
            <Button
              loading={m.isPending}
              disabled={!(+f.amount > 0)}
              onClick={() => m.mutate()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
