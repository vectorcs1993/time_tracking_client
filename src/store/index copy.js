// import Vuex from 'vuex';
// import { api } from 'boot/axios';

// const SERVERS_LIST = [
//   {
//     id: 0,
//     name: 'Тестовый',
//     port: 3001,
//     path: '/api_dev',
//   }
// ];
// const storeVue = new Vuex.Store({
//   state: {
//     token: localStorage.getItem('token') || '',
//     refresh: localStorage.getItem('refresh') || '',
//     isAuth: false,
//     user: null,
//     upd: null,
//     testSrv: false,
//     ip: 'nsk-deb-srv.nevatom.ru:3015',
//     currentServer: SERVERS_LIST[0],

//   },
//   mutations: {
//     setTestSrv(state, value) {
//       state.testSrv = value;
//     },
//     auth_success(state, dataUser) {
//       state.user = dataUser.user;
//       state.isAuth = true;
//     },
//     initUser(state, value) {
//       state.user = value.user;
//       state.isAuth = true;
//     },
//     logout(state) {
//       state.isAuth = false;
//       state.token = '';
//       state.refresh = '';
//       state.user = null;
//     },
//   },
//   actions: {
//     // eslint-disable-next-line
//     async login({ commit }, userLogin) {
//       try {
//         const resp = await postQuery(`http://nsk-deb-srv.nevatom.ru:3001/services/login`, userLogin);
//         const { accessToken } = resp.data;
//         api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
//         localStorage.setItem('token', accessToken);
//         // const response = await getQuery(`http://nsk-deb-srv.nevatom.ru:3001/auth/me`);
//         // commit('auth_success', { user: response.data, accessToken });
//       }
//       catch (error) {
//         localStorage.removeItem('token');
//         localStorage.removeItem('refresh');
//         throw error;
//       }
//   },
//   async logout({ commit }) {
//     try {
//       await postQuery(`http://nsk-deb-srv.nevatom.ru:3005/auth/logout`);
//       localStorage.removeItem('token');
//       commit('logout');
//     } catch (error) {
//       console.error('Ошибка при выходе:', error);
//       localStorage.removeItem('token');
//       commit('logout');
//       throw error;
//     }
//   },
//   async initializeAuth({ commit }) {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       console.log('Токен отсутствует');
//       return false;
//     }
//     try {
//       const resp = await getQuery(`http://nsk-deb-srv.nevatom.ru:3001/auth/me`);
//       commit('initUser', { user: resp.data });
//       return true;
//     } catch (error) {
//       console.log('Ошибка проверки токена:', error);
//       commit('logout');
//       return false;
//     }
//   },
//   tokenDied({ commit }) {
//     commit('logout');
//     },
//     isAuth({ commit }) {
//       const {
//         token,
//         refresh,
//       } = this.state;
//       return new Promise((resolve, reject) => {
//         if (token) {
//           api.post(`${this.getters.getHost}/services/auth`, { token }).then((resp) => {
//             console.log('Успешная аутентификация');
//             commit('auth_success', { user: resp.data.user, refresh, token });
//             resolve(resp.data);
//           }).catch(() => {
//             console.log('Ошибка аутентификации');
//             api.post(`${this.getters.getHost}/services/refresh`, { refresh })
//               .then((resp) => {
//                 console.log('Успешное обновление');
//                 commit('auth_success', { user: resp.data.user, refresh, token: resp.data.token });
//                 localStorage.setItem('token', resp.data.token);
//                 resolve(resp.data);
//               }).catch((err) => {
//                 commit('logout');
//                 console.log('Ошибка обновления');
//                 reject(err.response.data);
//               });
//           });
//         } else {
//           reject();
//         }
//       });
//     },
// },
//   getters: {
//   getAuth(state) {
//     return !!state.isAuth;
//     },
//     getHost: (state) => {
//       return `${process.env.API_DEV}:${state.currentServer.port}`;
//     },
//   getTestSrv: (state) => state.testSrv,
// },
// });
// function getRoles() {
//   return [
//     {
//       id: 0,
//       label: 'Пользователь',
//       value: 'user',
//     },
//     {
//       id: 1,
//       label: 'Эксперт',
//       value: 'expert',
//     },
//     {
//       id: 2,
//       label: 'Администратор',
//       value: 'admin',
//     },
//     {
//       id: 3,
//       label: 'Продвинутый пользователь',
//       value: 'user_master',
//     },
//   ];
// }
// function currentUser() {
//   return storeVue.state.user;
// }
// // function getQuery(path) {
// //   return new Promise((resolve, reject) => {
// //     api.get(path).then((res) => resolve(res)).catch((err) => reject(err));
// //   });
// // }
// // function postQuery(path, obj) {
// //   return new Promise((resolve, reject) => {
// //     api.post(path, obj).then((res) => resolve(res)).catch((err) => reject(err));
// //   });
// // }
// async function getQuery(path) {
//   try {
//     const res = await api.get(path);
//     return res;
//   } catch (err) {
//     console.log(err);
//     if (err.response && (err.response.status === 401 || err.response.status === 403)) {
//       try {
//         const refreshResponse = await api.post('http://nsk-deb-srv.nevatom.ru:3005/auth/refresh');
//         const newToken = refreshResponse.data.accessToken;

//         localStorage.setItem('token', newToken);
//         api.defaults.headers.Authorization = `Bearer ${newToken}`;

//         return await api.get(path);
//       } catch (refreshError) {
//         console.error('Refresh token failed:', refreshError);
//         throw refreshError;
//       }
//     }
//     throw err;
//   }
// }
// function postQuery(path, obj) {
//   return new Promise((resolve, reject) => {
//     api.post(path, obj).then((res) => resolve(res))
//       .catch(async (err) => {
//         if (err.response && (err.response.status === 401 || err.response.status === 403)) {
//           try {
//             const refreshResponse = await api.post('http://nsk-deb-srv.nevatom.ru:3005/auth/refresh');
//             const newToken = refreshResponse.data.accessToken;
//             localStorage.setItem('token', newToken);
//             api.defaults.headers.Authorization = `Bearer ${newToken}`;
//             const retryResponse = await api.post(path, obj);
//             resolve(retryResponse);
//           } catch (refreshError) {
//             reject(refreshError);
//           }
//         } else {
//           reject(err);
//         }
//       });
//   });
// }

// function deleteQuery(path) {
//   return new Promise((resolve, reject) => {
//     api.delete(path).then((res) => resolve(res)).catch((err) => reject(err));
//   });
// }
// function isAdmin() {
//   if (currentUser()) {
//     return currentUser().role === 'admin';
//   }
//   return false
// }

// export default {
//   storeVue,
//   getQuery,
//   postQuery,
//   deleteQuery,
//   currentUser,
//   getRoles,
//   isAdmin,
//   host() {
//     return storeVue.getters.getHost;
//   },
// }
