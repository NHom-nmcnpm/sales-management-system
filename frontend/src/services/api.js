import axios from 'axios';

export const api = axios.create({ baseURL: '/api/v1', withCredentials: true, timeout: 15000 });
let csrfToken = '';
export function setCsrfToken(token) { csrfToken = token ?? ''; }
api.interceptors.request.use(config => {
  if (!['get', 'head', 'options'].includes(config.method)) config.headers['X-CSRF-Token'] = csrfToken;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.data?.message) error.message = error.response.data.message;
  else if (!error.response && !axios.isCancel(error)) error.message = 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) window.dispatchEvent(new Event('session-expired'));
  return Promise.reject(error);
});
