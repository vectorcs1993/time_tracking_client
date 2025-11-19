import { defineStore } from 'pinia';
import { api } from 'boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN) || null,
    refresh: localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN_REFRESH) || null,
    user: null,
    branch: null,
    refreshPromise: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
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

    async authorizedRequest(method, url, data = null) {

      const requestConfig = {
        method: method.toLowerCase(),
        url,
      };


      if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put' || method.toLowerCase() === 'patch')) {
        requestConfig.data = data;
      }
      console.log(requestConfig);
      try {
        const response = await api(requestConfig);
        return response;
      } catch (error) {

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
  }
})
