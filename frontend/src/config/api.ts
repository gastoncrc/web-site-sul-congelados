import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://web-site-sul-congelados-backend.onrender.com/api'
});

// Interceptor optimizado para compatibilidad cruzada de cabeceras
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sul_token');
  if (token && config.headers) {
    // ✅ Cambiado a formato indexado clásico para máxima compatibilidad en Axios v1+
    config.headers['Authorization'] = `Bearer ${token}`; 
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});