import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Login from './pages/Login';
import DocList from './pages/DocList';
import DocForm from './pages/DocForm';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Reports from './pages/Reports';
import StoreDetails from './pages/StoreDetails';

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });
export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/sales" replace />} />
            <Route path="/sales" element={<DocList kind="invoice" />} />
            <Route path="/sales/new" element={<DocForm kind="invoice" />} />
            <Route path="/sales/:id/edit" element={<DocForm kind="invoice" />} />
            <Route path="/bills" element={<DocList kind="bill" />} />
            <Route path="/bills/new" element={<DocForm kind="bill" />} />
            <Route path="/bills/:id/edit" element={<DocForm kind="bill" />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/store" element={<StoreDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={2500} />
    </QueryClientProvider>
  );
}
