import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

if (import.meta.env.PROD && API_URL === '/api') {
  throw new Error(
    'Missing VITE_API_URL. Set it in Vercel to your backend URL, for example https://your-api.onrender.com/api'
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const authRoute = error.config?.url?.startsWith('/auth');
    if (error.response?.status === 401 && !authRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const documentApi = {
  list: () => api.get('/documents'),
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/documents/${id}`),
};

export const reportApi = {
  list: () => api.get('/reports'),
  get: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post('/reports/generate', data),
  export: (id, format) =>
    api.get(`/reports/${id}/export/${format}`, { responseType: 'blob' }),
  feedback: (id, data) => api.post(`/reports/${id}/feedback`, data),
};

export const analyticsApi = {
  me: () => api.get('/analytics/me'),
  dashboard: () => api.get('/analytics/dashboard'),
  llmOps: () => api.get('/analytics/llm-ops'),
};

export const adminApi = {
  users: () => api.get('/admin/users'),
  reports: () => api.get('/admin/reports'),
  toggleUser: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
};
