import { boot } from 'quasar/wrappers';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_DEV,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export default boot(({ app, router }) => {
  // Интерцептор для автоматической подстановки токена
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Если ошибка 401 и это не запрос на обновление токена
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Если уже обновляем токен, добавляем запрос в очередь
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH);

          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // Запрос на обновление токена
          const response = await axios.post(`${process.env.API_DEV}/refresh`,
            { refresh: refreshToken },
            { withCredentials: true }
          );

          const { token, refresh } = response.data;

          // Сохраняем новые токены
          localStorage.setItem(process.env.LOCAL_STORAGE_NAME_TOKEN, token);
          if (refresh) {
            localStorage.setItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH, refresh);
          }

          // Обновляем заголовок для текущего экземпляра api
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          // Обрабатываем очередь ожидающих запросов
          processQueue(null, token);

          // Повторяем оригинальный запрос
          return api(originalRequest);
        } catch (refreshError) {
          // Если не удалось обновить токен - очищаем данные и редиректим на логин
          processQueue(refreshError, null);
          localStorage.removeItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
          localStorage.removeItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH);
          delete api.defaults.headers.common['Authorization'];

          setTimeout(() => {
            router.push('/login').catch(() => { });
          }, 0);

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Для других 401 ошибок (когда нет refresh токена или это запрос на refresh)
      if (error.response?.status === 401) {
        setTimeout(() => {
          router.push('/login').catch(() => { });
        }, 0);
      }

      return Promise.reject(error);
    }
  );

  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };


// import { boot } from 'quasar/wrappers';
// import axios from 'axios';


// const api = axios.create({
//   baseURL: process.env.API_DEV,
//   withCredentials: true,
// });

// export default boot(({ app, router }) => {

//   // Интерцептор для автоматической подстановки токена
//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   });

//   api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//       if (error.response?.status === 401) {
//         // Автоматический редирект на логин
//         setTimeout(() => {
//           router.push('/login').catch(() => { });
//         }, 0);
//       }
//       return Promise.reject(error);
//     }
//   );

//   app.config.globalProperties.$axios = axios;
//   app.config.globalProperties.$api = api;
// });

// export { api };

