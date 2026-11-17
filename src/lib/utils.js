import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-toastify';

export const cn = (...a) => twMerge(clsx(a));
export const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const inr = (n) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(n || 0);

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { timeZone: 'UTC' }) : '—');
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const monthStart = () => today().slice(0, 8) + '01';
export const notify = {
  ok: (m) => toast.success(m),
  err: (e) => toast.error(e?.response?.data?.message || e?.message || 'Something went wrong'),
};
