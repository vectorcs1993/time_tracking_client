import { defineStore } from 'pinia';
import { api } from 'boot/axios'
import moment from 'moment';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN) || null,
    user: null,
    branch: null,
    role: null,
    favorites: [],
    refreshPromise: null,
    ROLE_ADMINISTRATOR: 1,
    ROLE_USER: 0,
    TYPE_WORK_OPERATION: 0,
    TYPE_WORK_PROJECT: 1,
    TYPE_METRICS_COUNT: 0,
    TYPE_METRICS_TIME: 1,
    TYPE_METRICS_COUNT_BOX: 2,
    TYPE_DAILY_REPORT_BEFORE: 0,
    TYPE_DAILY_REPORT_AFTER: 1,
    type_roles: [],
    PERIOD_SELECT: 0,
    PERIOD_ALL: 2,
    PERIOD_TODAY: 1,
    PERIOD_YESTERDAY: 3,
    PERIOD_7: 4,
    PERIOD_14: 8,
    PERIOD_30: 5,
    PERIOD_90: 7,
    PERIOD_180: 6,
    datetimeFormat: 'YYYY-MM-DD',
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdministrator: (state) => state.user?.role === state.ROLE_ADMINISTRATOR,
    getUser: (state) => state.user,
    getBranch: (state) => state.branch,
    getRole: (state) => state.role,
    getTypesPeriod: (state) => [
      {
        id: state.PERIOD_SELECT,
        name: 'Выбрать период',
      },
      {
        id: state.PERIOD_TODAY,
        name: 'Сегодня',
      },
      {
        id: state.PERIOD_YESTERDAY,
        name: 'Вчера',
      },
      {
        id: state.PERIOD_7,
        name: 'Последние 7 дней',
      },
      {
        id: state.PERIOD_14,
        name: 'Последние 14 дней',
      },
      {
        id: state.PERIOD_30,
        name: 'Последние 30 дней',
      },
      {
        id: state.PERIOD_90,
        name: 'Последние 90 дней',
      },
      {
        id: state.PERIOD_180,
        name: 'Последние 180 дней',
      },
      {
        id: state.PERIOD_ALL,
        name: 'Все данные',
      },
    ],
    getFavorites: (state) => state.favorites,
  },

  actions: {
    getItem(val) {
      if (localStorage.getItem(val) === null || localStorage.getItem(val) === undefined) {
        return -1;
      }
      return Number(localStorage.getItem(val));
    },
    getTimeFormatForce(val, f) {
      return moment(val).format(f);
    },
    isDateInRange(dateToCheck, startDate, endDate) {
      const checkDate = moment(dateToCheck);
      const start = moment(startDate);
      const end = moment(endDate);
      return checkDate.isBetween(start, end, null, '[]');
    },
    getCountDaysFromPeriod(dateStart, dateFinish) {
      const startDate = moment(dateStart);
      const endDate = moment(dateFinish);
      if (!startDate.isValid() || !endDate.isValid()) {
        console.error('Invalid date format');
        return 0;
      }
      const daysCount = endDate.diff(startDate, 'days');
      return daysCount;
    },
    getDatePeriod(period, dateStart, dateFinish) {
      const day = moment();
      const yesterday = day.clone().subtract(1, 'days');
      const yesterday7 = day.clone().subtract(7, 'days');
      const yesterday14 = day.clone().subtract(14, 'days');
      const yesterday30 = day.clone().subtract(30, 'days');
      const yesterday90 = day.clone().subtract(90, 'days');
      const yesterday180 = day.clone().subtract(180, 'days');
      // дата старта и финиша - сегодня
      if (period === 1) {
        dateStart = day.format(this.datetimeFormat);
        dateFinish = day.format(this.datetimeFormat);
      } else if (period === 3) { // вчера
        dateStart = yesterday.format(this.datetimeFormat);
        dateFinish = yesterday.format(this.datetimeFormat);
      } else if (period === 4) { // 7 дней
        dateStart = yesterday7.format(this.datetimeFormat);
        dateFinish = day.format(this.datetimeFormat);
      } else if (period === 5) { // 30 дней
        dateStart = yesterday30.format(this.datetimeFormat);
        dateFinish = day.format(this.datetimeFormat);
      } else if (period === 6) { // 180 дней
        dateStart = yesterday180.format(this.datetimeFormat);
        dateFinish = day.format(this.datetimeFormat);
      } else if (period === 7) { // 90 дней
        dateStart = yesterday90.format(this.datetimeFormat);
        dateFinish = day.format(this.datetimeFormat);
      } else if (period === 8) { // 14 дней
        dateStart = yesterday14.format(this.datetimeFormat);
        dateFinish = day.format(this.datetimeFormat);
      } else if (period === 2) { // все данные
        dateStart = 'null';
        dateFinish = 'null';
      }
      return [dateStart, dateFinish];
    },
    /**
     * Получить уникальное короткое обозначение для избранного
     * @param {string} label - Название пункта
     * @param {Array} favoritesList - Массив избранных элементов
     * @param {string} excludePath - Путь текущего элемента для исключения из проверки
     * @returns {string} - Уникальное обозначение из 2 заглавных букв
    */
    getShortLabel(label, favoritesList, excludePath = '', userId) {
      if (!label || typeof label !== 'string') return '??';

      // Фильтруем список избранного для текущего пользователя
      const userFavorites = favoritesList.filter((fav) => fav.user === userId);

      // Получаем все существующие short_name для этого пользователя
      const existingShortLabels = new Set(userFavorites.filter((fav) => fav.path !== excludePath).map((fav) => fav.short_name));

      // Основные стратегии генерации
      const generateCandidates = (inputLabel) => {
        const candidates = [];
        const cleanLabel = inputLabel.replace(/\s+/g, '').toUpperCase();
        const words = inputLabel.trim().split(/\s+/).filter(w => w.length > 0);

        // Стратегия 1: Первые 2 буквы (без пробелов)
        if (cleanLabel.length >= 2) {
          candidates.push(cleanLabel.substring(0, 2));
        }

        // Стратегия 2: Первые буквы первых двух слов
        if (words.length >= 2) {
          candidates.push((words[0][0] + words[1][0]).toUpperCase());
        }

        // Стратегия 3: Первая и последняя буква первого слова
        if (words.length > 0 && words[0].length >= 2) {
          const firstWord = words[0].toUpperCase();
          candidates.push(firstWord[0] + firstWord[firstWord.length - 1]);
        }

        // Стратегия 4: Первая буква + вторая буква первого слова
        if (words.length > 0 && words[0].length >= 2) {
          candidates.push((words[0][0] + words[0][1]).toUpperCase());
        }

        // Стратегия 5: Буквы из середины длинных слов
        if (cleanLabel.length >= 4) {
          candidates.push(cleanLabel[0] + cleanLabel[Math.floor(cleanLabel.length / 2)]);
        }

        // Стратегия 6: Если только одно слово длинное
        if (words.length === 1 && words[0].length >= 3) {
          const word = words[0].toUpperCase();
          candidates.push(word[0] + word[2]);
        }

        return candidates.filter(c => c.length === 2);
      };

      // Генерация с цифровым суффиксом
      const generateWithSuffix = (base, startFrom = 1) => {
        const results = [];
        // Пробуем цифры 1-9
        for (let i = startFrom; i <= 9; i++) {
          results.push(base[0] + i);
        }
        // Затем буквы A-Z
        for (let i = 0; i < 26; i++) {
          const letter = String.fromCharCode(65 + i); // A-Z
          results.push(base[0] + letter);
        }
        return results;
      };

      // Стратегия 7: Комбинации букв A-Z
      const generateLetterCombinations = () => {
        const combinations = [];
        for (let i = 0; i < 26; i++) {
          const letter1 = String.fromCharCode(65 + i);
          for (let j = 0; j < 26; j++) {
            const letter2 = String.fromCharCode(65 + j);
            combinations.push(letter1 + letter2);
            if (combinations.length >= 100) break; // Ограничиваем количество
          }
          if (combinations.length >= 100) break;
        }
        return combinations;
      };

      // Основные кандидаты
      const candidates = generateCandidates(label);

      // Пробуем кандидатов без суффиксов
      for (const candidate of candidates) {
        if (!existingShortLabels.has(candidate)) {
          return candidate;
        }
      }

      // Пробуем кандидатов с цифровыми/буквенными суффиксами
      for (const base of candidates) {
        if (base && base[0]) {
          const suffixed = generateWithSuffix(base);
          for (const candidate of suffixed) {
            if (!existingShortLabels.has(candidate)) {
              return candidate;
            }
          }
        }
      }

      // Пробуем все возможные комбинации букв
      const letterCombinations = generateLetterCombinations();
      for (const combination of letterCombinations) {
        if (!existingShortLabels.has(combination)) {
          return combination;
        }
      }

      // Если все комбинации заняты, используем hash-based подход
      const hash = Math.abs(label.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
      }, 0));

      // Генерируем на основе hash
      for (let i = 0; i < 100; i++) {
        const num = (hash + i) % 100;
        const candidate = String.fromCharCode(65 + (num % 26)) +
          String.fromCharCode(65 + ((num + 1) % 26));

        if (!existingShortLabels.has(candidate)) {
          return candidate;
        }
      }

      // Аварийный вариант - используем timestamp
      const timestamp = Date.now() % 10000;
      const emergencyLabel =
        String.fromCharCode(65 + (timestamp % 26)) +
        String.fromCharCode(65 + ((timestamp + 7) % 26));

      return emergencyLabel;
    },
    setToken(token) {
      this.token = token;
      localStorage.setItem(process.env.LOCAL_STORAGE_NAME_TOKEN, token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    async refreshToken() {
      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      try {
        this.refreshPromise = api.post('/refresh');

        const response = await this.refreshPromise;

        const { token } = response.data;

        this.setToken(token);

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

        const responseRoles = await api.get('/roles');
        this.role = responseRoles.data.find((r) => r.id === this.user.role);

        const responseBranch = await api.get(`/branches/${this.user.branch}`);
        this.branch = responseBranch.data;


        const responseFavoites = await api.get('favorites');
        this.favorites.push(...responseFavoites.data);

        return this.user;
      } catch (err) {

        if (err.response?.status === 401 || err.response?.status === 403) {
          await this.refreshToken();

          const response = await api.get('/me');
          this.user = response.data;

          const responseRoles = await api.get('/roles');
          this.role = responseRoles.data.find((r) => r.id === this.user.role);

          const responseBranch = await api.get(`/branches/${this.user.branch}`);
          this.branch = responseBranch.data;
          return this.user;
        }
        throw err;
      }
    },
    async initializeApp() {

      // Синхронизируем state с localStorage
      const storedToken = localStorage.getItem(process.env.LOCAL_STORAGE_NAME_TOKEN);
      if (storedToken && this.token !== storedToken) this.token = storedToken;
      // Устанавливаем заголовок для axios
      if (this.token) api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

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
      const { token, user } = response.data;
      this.user = user;
      this.setToken(token);
      return response.data;
    },
    // Добавить в избранное по пути
    async addFavorite(path) {
      const currentTitle = document.title;
      const userFavorites = this.favorites.filter((fav) => fav.user === this.user.id);
      const short_name = this.getShortLabel(
        currentTitle,
        userFavorites, // передаем только записи текущего пользователя
        '', // excludePath - пустая строка для новой записи
        this.user.id
      );
      // Проверяем, нет ли уже такого пути у пользователя
      const isPathAlreadyAdded = userFavorites.some((fav) => fav.path === path);
      if (!isPathAlreadyAdded) {
        const favorite = {
          user: this.user.id,
          name: currentTitle,
          path,
          short_name: short_name,
        };
        const favoriteId = await this.authorizedRequest('post', 'favorites', favorite);
        favorite.id = favoriteId.data;
        this.favorites.push(favorite);
      } else {
        console.log('Этот путь уже добавлен в избранное');
      }
    },
    // Удалить из избранного по пути
    async removeFavorite(path) {
      try {
        const favorite = this.favorites.find((fav) => fav.path === path);
        if (favorite) {
          const deleteId = Number(favorite.id)
          if (!isNaN(deleteId)) {
            this.favorites.splice(this.favorites.findIndex((fav) => fav.id === deleteId), 1);
            await this.authorizedRequest('delete', `favorites/${deleteId}`);
          }
        }
      } catch (err) {
        console.log(err);
      }
    },
    // Выносим очистку данных в отдельный метод
    clearAuthData() {
      this.token = null;
      this.user = null;
      this.refreshPromise = null;
      this.favorites.length = 0;

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
    },
    isAllowRoute(array) {
      try {
        return array.includes(this.getRole.id);
      } catch {
        return false;
      }
    },
    jsonToCsv(jsonData) {
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return '';
      }

      // Получаем заголовки из ключей первого объекта
      const headers = Object.keys(jsonData[0]);

      // Создаем строку заголовков
      let csv = headers.map(header => `"${header}"`).join(',') + '\n';

      // Добавляем строки с данными
      jsonData.forEach(item => {
        const row = headers.map(header => {
          // Обрабатываем значения: экранируем кавычки и обрабатываем специальные случаи
          let value = item[header];

          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'object') {
            // Если значение - объект, преобразуем в строку JSON
            value = JSON.stringify(value);
          } else {
            value = String(value);
          }

          // Экранируем кавычки и оборачиваем в кавычки
          value = value.replace(/"/g, '""');
          return `"${value}"`;
        }).join(',');

        csv += row + '\n';
      });

      return csv;
    }
  }
})
