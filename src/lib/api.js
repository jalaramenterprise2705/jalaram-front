import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

// Bearer token automatically on every request
// Bearer token automatically on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token expire / invalid -> logout (not for the login call itself, otherwise a wrong password reloads the page)
// Token expire / invalid -> logout (not for the login call itself, otherwise a wrong password reloads the page)
api.interceptors.response.use((r) => r, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
});
