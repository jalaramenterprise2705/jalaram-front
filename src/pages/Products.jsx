import * as yup from 'yup';
import MasterPage from '../components/MasterPage';
import { inr } from '../lib/utils';

const n = yup.number().transform((v, o) => (o === '' ? 0 : v)).typeError('Enter a number');
const schema = yup.object({
  name: yup.string().trim().required('Name is required'),
  hsn: n.min(0),
  qty: n,
  purchasePrice: n.min(0),
  salePrice: n.min(0),
  sgstPct: n.min(0),
  cgstPct: n.min(0),
});

export default function Products() {
  return (
    <MasterPage
      title="Stocks / Products"
      endpoint="products"
      schema={schema}
      defaults={{
        name: '',
        hsn: 0,
        qty: 0,
        purchasePrice: 0,
        salePrice: 0,
        sgstPct: 0,
        cgstPct: 0,
      }}
      fields={[
        { name: 'name', label: 'Product name', full: true },
        { name: 'hsn', label: 'HSN', type: 'number' },
        { name: 'qty', label: 'Stock', type: 'number' },
        {
          name: 'purchasePrice',
          label: 'Purchase price',
          type: 'number',
        },
        { name: 'salePrice', label: 'Sale price', type: 'number' },
        { name: 'sgstPct', label: 'SGST %', type: 'number' },
        { name: 'cgstPct', label: 'CGST %', type: 'number' },
      ]}
      columns={[
        { key: 'name', label: 'Product' },
        { key: 'hsn', label: 'HSN' },
        {
          key: 'qty',
          label: 'Stock',
          render: (r) => <b className={r.qty <= 0 ? 'text-red-600' : ''}>{r.qty}</b>,
        },
        {
          key: 'salePrice',
          label: 'Sale price',
          render: (r) => inr(r.salePrice),
        },
        {
          key: 'sgstPct',
          label: 'GST',
          render: (r) => `${(r.sgstPct || 0) + (r.cgstPct || 0)}%`,
        },
      ]}
    />
  );
}
