import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://purchaseorder-backend.onrender.com/api/v1',
  withCredentials: true,
});

let warmupPromise;
let warmedAt = 0;
const WARMUP_CACHE_MS = 5 * 60 * 1000;

export function warmupApi() {
  if (Date.now() - warmedAt < WARMUP_CACHE_MS) {
    return Promise.resolve();
  }
  if (!warmupPromise) {
    warmupPromise = api.get('/health', { timeout: 90000 })
      .then(() => {
        warmedAt = Date.now();
      })
      .finally(() => {
        warmupPromise = undefined;
      });
  }
  return warmupPromise;
}

api.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem('rpms_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
