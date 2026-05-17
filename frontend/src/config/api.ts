import axios from 'axios';

export const api = axios.create({
  // Dejamos solo el dominio limpio de Render
  baseURL: 'https://web-site-sul-congelados-backend.onrender.com'
});

// Interceptor automático de tokens corporativos
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sul_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});