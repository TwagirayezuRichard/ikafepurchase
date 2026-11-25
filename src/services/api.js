import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://purchaseorder-backend.onrender.com/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem('rpms_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
