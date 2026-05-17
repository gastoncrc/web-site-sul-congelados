import axios from 'axios';

export const api = axios.create({
  // ✅ Centralizado el prefijo de la API
  baseURL: 'https://web-site-sul-congelados-backend.onrender.com/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sul_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});