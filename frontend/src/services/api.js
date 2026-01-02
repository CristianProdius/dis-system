import axios from 'axios';
import { getToken, logout } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  error => {
    if (error.response && error.response.status === 401) {
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const registerUser = (username, password) =>
  api.post('/auth/register', { username, password });

export const loginUser = (username, password) =>
  api.post('/auth/login', { username, password });

// Marketplace endpoints
export const listItems = (params = {}) =>
  api.get('/marketplace/list', { params });

export const getItem = (id) =>
  api.get(`/marketplace/item/${id}`);

export const createItem = (data) =>
  api.post('/marketplace/item', data);

export const purchaseItem = (itemId) =>
  api.post('/marketplace/purchase', { itemId });

// Discourse endpoints
export const listChannels = (params = {}) =>
  api.get('/discourse/channels', { params });

export const getChannel = (id, params = {}) =>
  api.get(`/discourse/channel/${id}`, { params });

export const createChannel = (data) =>
  api.post('/discourse/channel', data);

export const createPost = (data) =>
  api.post('/discourse/post', data);

// Gateway status
export const getGatewayStatus = () =>
  api.get('/status');

export default api;
