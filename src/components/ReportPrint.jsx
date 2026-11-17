import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter } from 'react-icons/fi';
import { api } from '../lib/api';
import { mergeStore } from '../lib/store';
import { fmtDate, today } from '../lib/utils';
import { Button } from './ui/button';

// Wraps any report: Print button + shop header (name, address, phone), title and date on the printout
export default function PrintableReport({ title, subtitle, children }) {
  const ref = useRef(null);
  const print = useReactToPrint({ contentRef: ref, documentTitle: title });
  const st = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });
  const s = mergeStore(st.data);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="outline" onClick={print}>
          <FiPrinter />
          {' '}
          Print
        </Button>
      </div>
      <div
        ref={ref}
        className="rounded-xl bg-white p-4 text-black ring-1 ring-slate-200 print:ring-0"
      >
        <div className="mb-3 text-center">
          <div className="font-bold">{s.name}</div>
          <div className="text-sm">{s.address}</div>
          <div className="text-sm">
            Phone:
            {' '}
            <b>{s.phone}</b>
          </div>
          <div className="mt-2 font-bold">{title}</div>
          {subtitle && <div className="text-sm">{subtitle}</div>}
          <div className="text-xs text-slate-600">
            Date:
            {' '}
            {fmtDate(today())}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
