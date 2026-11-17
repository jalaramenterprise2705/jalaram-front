import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import { api } from '../lib/api';
import { mergeStore } from '../lib/store';
import { downloadBillPdf } from '../lib/pdf';
import { notify } from '../lib/utils';
import { PageLoader } from './Loader';
import PrintBill from './PrintBill';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';

// Print / download preview. Used right after saving a bill and from the bill list.
export default function PrintDialog({ kind, id, onClose, title = 'Print Bill' }) {
  const base = kind === 'invoice' ? 'invoices' : 'bills';
  const ref = useRef(null);
  const q = useQuery({
    queryKey: ['print', kind, id],
    queryFn: async () => {
      const doc = (await api.get(`/${base}/${id}`)).data;
      const party = doc.customerId ? (await api.get(`/customers/${doc.customerId}`)).data : null;
      return { doc, party };
    },
  });
  const st = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });
  const store = mergeStore(st.data);
  const print = useReactToPrint({
    contentRef: ref,
    documentTitle: `${kind}-${q.data?.doc?.invoiceNo || q.data?.doc?.billNo || ''}`,
    pageStyle: '@page { size: A4; margin: 10mm; } @media print { html, body { height: auto !important; margin: 0; } }',
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Print this bill or download it as a PDF.</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto rounded-lg border bg-slate-50 p-2">
          {q.data
            ? (
              <PrintBill
                ref={ref}
                doc={q.data.doc}
                kind={kind}
                store={store}
                party={q.data.party}
              />
            )
            : q.isError
              ? <p className="p-6 text-center text-sm">Could not load the bill</p>
              : <PageLoader />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            variant="outline"
            disabled={!q.data}
            onClick={() => {
              try {
                downloadBillPdf({ ...q.data, kind, store });
              }
              catch (e) {
                notify.err(e);
              }
            }}
          >
            <FiDownload />
            {' '}
            Download PDF
          </Button>
          <Button disabled={!q.data} onClick={print}>
            <FiPrinter />
            {' '}
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
