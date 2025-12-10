import { defineStore } from 'pinia';
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN) || null,
    refresh: localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH) || null,
    user: null,
    branch: null,
    refreshPromise: null,
    ROLE_ADMINISTRATOR: 'admin',
    TYPE_WORK_OPERATION: 0,
    TYPE_WORK_PROJECT: 1,
    TYPE_METRICS_COUNT: 0,
    TYPE_METRICS_TIME: 1,
    TYPE_METRICS_COUNT_BOX: 2,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdministrator: (state) => state.user?.role === state.ROLE_ADMINISTRATOR,
    getUser: (state) => state.user,
    getBranch: (state) => state.branch,
  },

  actions: {
    // Инициализация store при загрузке приложения
    initializeStore() {

      // Синхронизируем state с localStorage
      const storedToken = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
      const storedRefresh = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH);

      if (storedToken && this.token !== storedToken) {
        this.token = storedToken;
      }

      if (storedRefresh && this.refresh !== storedRefresh) {
        this.refresh = storedRefresh;
      }

      // Устанавливаем заголовок для axios
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    },

    setToken(token) {
      this.token = token;
      localStorage.setItem(process.env.LOCAL_STORAGE_NAME_TOKEN, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },

    setRefreshToken(refresh) {
      this.refresh = refresh;
      localStorage.setItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH, refresh);
    },

    async refreshToken() {
      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      if (!this.refresh) {
        throw new Error('No refresh token available');
      }

      try {
        this.refreshPromise = api.post('/refresh', { refresh: this.refresh });

        const response = await this.refreshPromise;

        const { token, refresh } = response.data;

        this.setToken(token);

        if (refresh) {
          this.setRefreshToken(refresh);
        }

        return token;
      } catch (error) {
        this.logout();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    },

    async authorizedRequest(method, url, data = null, responseType) {

      const requestConfig = {
        method: method.toLowerCase(),
        url,
      };

      if (responseType) requestConfig.responseType = responseType;

      if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put' || method.toLowerCase() === 'patch')) {
        requestConfig.data = data;
      }

      try {
        const response = await api(requestConfig);
        return response;
      } catch (error) {
        console.log(error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          try {
            await this.refreshToken();
            return await api(requestConfig);
          } catch {
            window.location.reload();
          }
        } else throw error;
      }
    },

    async fetchUser() {
      if (!this.token) {
        throw new Error('No token available');
      }

      // Убедимся, что заголовок установлен
      if (!api.defaults.headers.common['Authorization']) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }

      try {

        const responseMe = await api.get('/me');
        this.user = responseMe.data;

        const responseBranch = await api.get(`/branches/${this.user.branch}`);
        this.branch = responseBranch.data;

        return this.user;
      } catch (err) {

        if (err.response?.status === 401 || err.response?.status === 403) {
          await this.refreshToken();
          const response = await api.get('/me');
          this.user = response.data;

          const responseBranch = await api.get(`/branches/${this.user.branch}`);
          this.branch = responseBranch.data;
          return this.user;
        }
        throw err;
      }
    },

    async initializeApp() {

      // Сначала инициализируем store
      this.initializeStore();

      if (this.isAuthenticated && !this.user) {
        try {
          await this.fetchUser();
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            try {
              await this.refreshToken();
              await this.fetchUser();
            } catch {
              this.logout();
            }
          } else {
            this.logout();
          }
        }
      }
    },

    async login(credentials) {
      const response = await api.post('/login', credentials);
      const { token, refresh, user } = response.data;
      this.user = user;
      this.setToken(token);

      if (refresh) {
        this.setRefreshToken(refresh);
      }
      return response.data;
    },
    // Выносим очистку данных в отдельный метод
    clearAuthData() {
      this.token = null;
      this.refresh = null;
      this.user = null;
      this.refreshPromise = null;

      localStorage.removeItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
      localStorage.removeItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH);
      delete api.defaults.headers.common['Authorization'];
    },
    // Метод для принудительного логаута без API вызова (например, при ошибках)
    forceLogout() {
      this.clearAuthData();
    },
    // Функция для расчета контраста на основе яркости
    getContrastColor(bgColor) {
      if (!bgColor) return '#ffffffff';

      // Удаляем пробелы и приводим к нижнему регистру
      let color = bgColor.trim().toLowerCase();

      // Обрабатываем разные форматы цвета
      let r, g, b;

      // HEX формат (#fff или #ffffff)
      if (color.startsWith('#')) {
        color = color.substring(1);

        // Короткая запись
        if (color.length === 3) {
          color = color.split('').map(c => c + c).join('');
        }

        r = parseInt(color.substr(0, 2), 16);
        g = parseInt(color.substr(2, 2), 16);
        b = parseInt(color.substr(4, 2), 16);
      }
      // RGB формат
      else if (color.startsWith('rgb')) {
        const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (match) {
          r = parseInt(match[1]);
          g = parseInt(match[2]);
          b = parseInt(match[3]);
        } else {
          return '#000';
        }
      }
      // Название цвета
      else {
        const colorNames = {
          'white': [255, 255, 255],
          'black': [0, 0, 0],
          'red': [255, 0, 0],
          'green': [0, 128, 0],
          'blue': [0, 0, 255],
          'yellow': [255, 255, 0],
          // добавьте другие цвета по необходимости
        };

        if (colorNames[color]) {
          [r, g, b] = colorNames[color];
        } else {
          return '#000'; // fallback
        }
      }

      // Рассчитываем относительную яркость (формула W3C)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Если яркость > 0.5 - черный текст, иначе белый
      return luminance > 0.5 ? '#000000' : '#ffffff';
    },
    async logout() {
      try {
        // ТОЛЬКО ЗДЕСЬ вызываем API логаут
        await api.post('/logout');
      } catch {
        // Игнорируем ошибки логаута, так как очистка должна произойти в любом случае
      } finally {
        this.clearAuthData();
      }
    },
    downloadExcel(url, data) {
      return new Promise((resolve, reject) => {
        this.authorizedRequest('post', url, data, 'blob').then((response) => {
          // Получаем имя файла из заголовка Content-Disposition
          const contentDisposition = response.headers['content-disposition'];
          let fileName = 'document.xlsx'; // значение по умолчанию

          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch[1]) {
              fileName = fileNameMatch[1];
            }
          }

          const fileURL = window.URL.createObjectURL(new Blob([response.data]));
          const fileLink = document.createElement("a");
          fileLink.href = fileURL;
          fileLink.setAttribute("download", fileName);
          document.body.appendChild(fileLink);
          fileLink.click();
          // Очистка
          window.URL.revokeObjectURL(fileURL);
          document.body.removeChild(fileLink);
          resolve();
        }).catch((error) => {
          console.error('Download error:', error);
          reject(error);
        });
      });
    }
  }
})
