export const STORE_DEFAULT = {
  name: 'JALARAM ENTERPRISE',
  address: '122, Sai Ashirwad Complex, Kadodara, TA-Palsana,Surat-394327',
  phone: '9825593788',
  gstin: '24ALYPP1517G1ZV',
  bank: {
    payable: 'Jalaram Enterprise',
    name: 'Prime co-op. Bank Ltd.',
    account: '10102001001388',
    branch: 'Kadodara',
    ifsc: 'PMEC0101010',
  },
};

// Saved store details win (even when a field is left empty, e.g. no GSTIN); defaults only fill in before anything is saved
export const mergeStore = (s) => {
  const has = s && s._id;
  const v = (k) => (has && s[k] !== undefined ? s[k] : STORE_DEFAULT[k]);
  return {
    name: v('name'),
    address: v('address'),
    phone: v('phone'),
    gstin: v('gstin'),
    bank: { ...STORE_DEFAULT.bank, ...(has ? s.bank || {} : {}) },
  };
};

export const TERMS = [
  '(1) GOODS ONCE SOLD WILL NOT BE TAKEN BACK OR EXCHANGED',
  '(2) SELLER IS NOT RESPONSIBLE FOR ANY LOSS OR DAMAGED OF GOODS IN TRANSIT',
  '(3) DISPUTES IF ANY WILL BE SUBJECT TO SELLER COURT JURISDICTION',
];

export const CERTIFY = [
  'CERTIFIED THAT THE PERTICULARS GIVEN ABOVE ARE TRUE AND CORRECT AND AMOUNT INDICATED',
  '(A) REPRESENT THE PRICE ACTUALLY CHARGED AND THAT THERE IN NO FLOW ADDITIONAL CONSIDERATIONAL DIRECTLY OR INDIRECTLY FROM THE BUYER OR',
  '(B) IS PROVISIONAL AS ADDITIONAL CONSIDERATIONAL WILL BE RECEIVED FROM BUYER',
];
