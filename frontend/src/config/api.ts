import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL) || 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sul_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Si el servidor rechaza el token (vencido o inválido) mientras había una
// sesión activa, se cierra la sesión localmente y se avisa — antes el 401
// quedaba solo en la consola y la UI seguía mostrando "logueado" sin poder
// hacer nada. No aplica al propio login (ese 401 es "credenciales inválidas",
// se maneja en el formulario) ni cuando nunca hubo token (visitante normal).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const hadToken = !!localStorage.getItem('sul_token');
    if (error.response?.status === 401 && hadToken && !isLoginRequest) {
      localStorage.removeItem('sul_user');
      localStorage.removeItem('sul_token');
      sessionStorage.setItem('sul_session_expired', '1');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);