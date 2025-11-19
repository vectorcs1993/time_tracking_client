import { boot } from 'quasar/wrappers';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_DEV,
  withCredentials: true,
});

export default boot(({ app }) => {
  // // Добавляем токен к каждому запросу
  // api.interceptors.request.use((config) => {
  //   const token = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
  //   if (token) {
  //     config.headers.Authorization = `Bearer ${token}`;
  //   }
  //   return config;
  // });

  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
