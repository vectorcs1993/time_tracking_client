// import { boot } from 'quasar/wrappers';
// import axios from 'axios';

// const api = axios.create();
// let isRefreshing = false;
// let failedRequests = [];

// const processFailedRequests = (token) => {
//   failedRequests.forEach((prom) => prom.resolve(token));
//   failedRequests = [];
// };

// api.interceptors.request.use(async (config) => {
//   let token = localStorage.getItem('token');

//   // Если токен есть и мы не в процессе обновления
//   if (token && !isRefreshing) {
//     config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   }

//   // Если нет токена или идет обновление
//   return new Promise((resolve) => {
//     if (isRefreshing) {
//       // Добавляем запрос в очередь
//       failedRequests.push({
//         resolve: () => {
//           config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
//           resolve(config);
//         }
//       });
//     } else {
//       isRefreshing = true;
//       api.post('http://nsk-deb-srv.nevatom.ru:3005/auth/refresh')
//         .then(({ data }) => {
//           localStorage.setItem('token', data.token);
//           isRefreshing = false;
//           processFailedRequests(data.token);
//           config.headers.Authorization = `Bearer ${data.token}`;
//           resolve(config);
//         })
//         .catch((err) => {
//           isRefreshing = false;
//           localStorage.removeItem('token');
//           // Можно добавить редирект на логин здесь
//           throw err;
//         });
//     }
//   });
// });

// export default boot(({ app }) => {
//   app.config.globalProperties.$axios = axios;
//   app.config.globalProperties.$api = api;
// });

// export { api };


import { boot } from 'quasar/wrappers';
import axios from 'axios';

const api = axios.create();

export default boot(({ app }) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };

