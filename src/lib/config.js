// Endpoint and field names live here. If your backend names differ, change them in this one file.
export const CFG = {
  sales: {
    ep: '/invoices', label: 'Sales bill', path: '/sales',
    numKey: 'invoiceNo', dateKey: 'invoiceDate', partyKey: 'customerId', partyLabel: 'Customer',
  },
  purchases: {
    ep: '/bills', label: 'Purchase bill', path: '/purchases',
    numKey: 'billNo', dateKey: 'billDate', partyKey: 'supplier', partyLabel: 'Supplier',
  },
};
