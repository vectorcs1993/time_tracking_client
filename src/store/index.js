import { reactive } from 'vue';
import Vuex from 'vuex';
import { useRoute } from 'vue-router';
import moment from 'moment';
import { api } from 'boot/axios';

const stt = reactive({
  portDefault: 3080,
  token: '',
  isAuth: false,
  isLoad: false,
});

const SERVERS_LIST = [
  {
    id: 0,
    name: 'Тестовый',
    port: 3001,
    path: '/api_dev',
  },

];

const storeVue = new Vuex.Store({
  state: {
    token: localStorage.getItem('token') || '',
    refresh: localStorage.getItem('refresh') || '',
    isAuth: false,
    user: null,
    upd: null,
    ip: 'nsk-deb-pp',
    currentServer: SERVERS_LIST[0],
  },
  mutations: {
    auth_success(state, dataUser) {
      state.token = dataUser.token;
      if (dataUser.refresh) {
        state.refresh = dataUser.refresh;
      }
      state.user = dataUser.user;
      state.isAuth = true;
    },
    logout(state) {
      state.isAuth = false;
      state.token = '';
      state.refresh = '';
      state.user = null;
    },
  },
  actions: {
    login({ commit }, userLogin) {
      return new Promise((resolve, reject) => {
        const server = SERVERS_LIST[0];
        localStorage.setItem('server_port', server.port);
        api.post(`${this.getters.getHost}/services/login`, userLogin)
          .then((resp) => {
            const { token, user, refresh } = resp.data;
            localStorage.setItem('token', token);
            localStorage.setItem('refresh', refresh);
            commit('auth_success', { user, token, refresh });
            resolve(resp);
          })
          .catch((err) => {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            reject(err);
          });
      });
    },
    logout({ commit }) {
      return new Promise((resolve) => {
        const { refresh } = this.state;
        if (refresh) {
          api.post(`${this.getters.getHost}/services/logout`, { refresh }).then((resp) => {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('server_port');
            commit('logout');
            console.log(resp.data.message);
            resolve();
          });
        } else {
          resolve();
        }
      });
    },
    isAuth({ commit }) {
      const {
        token,
        refresh,
      } = this.state;
      return new Promise((resolve, reject) => {
        if (token) {
          api.post(`${this.getters.getHost}/services/auth`, { token }).then((resp) => {
            console.log('Успешная аутентификация');
            commit('auth_success', { user: resp.data.user, refresh, token });
            resolve(resp.data);
          }).catch(() => {
            console.log('Ошибка аутентификации');
            api.post(`${this.getters.getHost}/services/refresh`, { refresh })
              .then((resp) => {
                console.log('Успешное обновление');
                commit('auth_success', { user: resp.data.user, refresh, token: resp.data.token });
                localStorage.setItem('token', resp.data.token);
                resolve(resp.data);
              }).catch((err) => {
                commit('logout');
                console.log('Ошибка обновления');
                reject(err.response.data);
              });
          });
        } else {
          reject();
        }
      });
    },
  },
  getters: {
    getAuth: (state) => state.isAuth,
    getHost: (state) => {
        return `${process.env.API_DEV}:${state.currentServer.port}`;
    },
    getPort: (state) => state.currentServer.port,
  },
});

function getQuery(path, config) {
  return new Promise((resolve, reject) => {
    api.get(path, config).then((res) => resolve(res)).catch((err) => {
      storeVue.dispatch('isAuth').then(() => {
        api.get(path, config).then((res) => resolve(res)).catch(() => reject(err));
      }).catch(() => reject(err));
    });
  });
}
function postQuery(path, obj, config) {
  return new Promise((resolve, reject) => {
    api.post(path, obj, config).then((res) => resolve(res)).catch((err) => {
      storeVue.dispatch('isAuth').then(() => {
        api.post(path, obj, config).then((res) => resolve(res)).catch(() => reject(err));
      }).catch(() => reject(err));
    });
  });
}

function deleteQuery(path) {
  return new Promise((resolve, reject) => {
    api.delete(path).then((res) => resolve(res)).catch((err) => {
      storeVue.dispatch('isAuth').then(() => {
        api.delete(path).then((res) => resolve(res)).catch(() => reject(err));
      }).catch(() => reject(err));
    });
  });
}

function currentUser() {
  return storeVue.state.user;
}

function isPermissions(permission) {
  const route = useRoute();
  try {
    const { requiresAuth, permissionsBlock } = route.meta;
    if (requiresAuth) {
      console.log((permissionsBlock[storeVue.state.user.role] || []).includes(permission));
      return (permissionsBlock[storeVue.state.user.role] || []).includes(permission);
    }
    return false;
  } catch {
    return false;
  }
}

function isOpen(ws) { return ws.readyState === ws.OPEN; }

function isDateInRange(dateToCheck, startDate, endDate) {
  const checkDate = moment(dateToCheck);
  const start = moment(startDate);
  const end = moment(endDate);
  return checkDate.isBetween(start, end, null, '[]');
}
// возвращает элемент из списка по id идентификатору
function getObject(array, prop, value) {
  for (let index = 0; index < array.length; index += 1) {
    const element = array[index];
    if (element[prop] === value) {
      return element;
    }
  }
  return null;
}

function getTimeFormat(val) {
  return moment(val).format('HH:mm:ss DD.MM.YYYY');
}
function getTimeFormatForce(val, f) {
  return moment(val).format(f);
}

const STRING_NO_SELECT = 'Не выбрано';

const OPTION_ALL = {
  id: -1,
  name: 'Все',
};

function getRoles() {
  return [
    {
      id: 0,
      label: 'Пользователь',
      value: 'user',
    },
    {
      id: 1,
      label: 'Эксперт',
      value: 'expert',
    },
    {
      id: 2,
      label: 'Администратор',
      value: 'admin',
    },
    {
      id: 3,
      label: 'Продвинутый пользователь',
      value: 'user_master',
    },
  ];
}


function getNameShort(_name) {
  try {
    const n = _name.split(' ').filter((e) => e !== '');
    if (n.length !== 3) {
      return _name;
    }
    return `${n[0]} ${n[1] ? `${n[1][0]}.` : ''}${n[1] ? `${n[2][0]}.` : ''}`;
  } catch  {
    return _name;
  }
}
function isAdmin() {
  return currentUser().role === 'admin';
}
function isExpert() {
  return currentUser().role === 'expert' || isAdmin();
}

// возвращает новый ID исходя из объектов списка
function getNewId(existingItems = []) {
  // Находим максимальный ID среди всех элементов (включая вложенные)
  let maxId = 0;

  const findMaxId = (items) => {
    items.forEach((item) => {
      if (item.id > maxId) {
        maxId = item.id;
      }
      if (item.children && item.children.length > 0) {
        findMaxId(item.children);
      }
    });
  };

  findMaxId(existingItems);
  return maxId + 1;
}

const TT_TYPE_FLAG = 'TINYINT(1)';

export default {
  SERVERS_LIST,
  TT_TYPE_FLAG,
  host() {
    return storeVue.getters.getHost;
  },
  port() {
    return storeVue.getters.getPort;
  },
  getNameShort,
  isOpen,
  state: stt,
  getObject,
  getTimeFormat,
  getTimeFormatForce,
  storeVue,
  isPermissions,
  currentUser,
  getRoles,
  getNewId,
  getQuery,
  postQuery,
  deleteQuery,
  isAdmin,
  isExpert,
  STRING_NO_SELECT,
  isDateInRange,
  OPTION_ALL
};
