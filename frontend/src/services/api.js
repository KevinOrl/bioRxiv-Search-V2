import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicios específicos
const services = {
  // Autenticación
  auth: {
    login: (credentials) => api.post('/auth/firebase-login', credentials),
    register: (userData) => api.post('/auth/firebase-register', userData),
    verify: () => api.get('/auth/verify')
  },
  
  // Documentos
  documents: {
    search: (params) => api.get('/documents/search', { params }),
    getFacets: () => api.get('/documents/facets'),
    getById: (id) => api.get(`/documents/${id}`),
    getSearchHistory: () => api.get('/documents/history/search')
  }
};

export { services };
export default api;