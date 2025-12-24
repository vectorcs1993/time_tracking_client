<template>
  <q-layout view="hHh Lpr lff" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
    <q-header :dark="dark" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`">
      <q-toolbar id="header">
        <q-btn flat dense square icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-card-section class="q-pa-sm row items-center full-width">
          <img class="q-mt-xs" src="./logo.svg" style="cursor: pointer;" @click="toggleLeftDrawer">
          <img class="q-mt-xs" src="./logo_standby_mono.svg"
            style="padding: 0px; width: 40px; height: 30px; cursor: pointer; position: absolute; left: 160px; top: 12px; z-index: 99;"
            @click="toggleLeftDrawer">
          <img class="q-mt-xs" src="./planerman_ny.svg"
            style="cursor: pointer; position: absolute; left: 203px; top: 7px; z-index: 99;" @click="toggleLeftDrawer">
          <q-space />
          <div v-if="authStore.getUser && authStore.getBranch">
            <Button :label="authStore.getUser.name" icon="person" :dark="dark">
              <q-popup-proxy square :class="`${dark ? 'pp-dark' : 'pp-light'}`">
                <div class="q-pa-md" style="width: 400px;">
                  <div class="row justify-between items-center">
                    <div>
                      Логин:
                    </div>
                    <div>
                      {{ authStore.getUser.email }}
                    </div>
                  </div>
                  <div class="row justify-between items-center">
                    <div>
                      Роль:
                    </div>
                    <q-badge class="text-size" :color="dark ? 'grey-7' : 'green'">{{ authStore.getRole.name
                    }}</q-badge>
                  </div>
                  <div class="row justify-between items-center">
                    <div>
                      Группа:
                    </div>
                    <q-badge class="text-size" :color="dark ? 'grey-7' : 'green'">{{ authStore.getBranch.name
                      }}</q-badge>
                  </div>
                  <!-- <div class="row justify-between items-center">
                    <div class="col">
                      Ночной режим:
                    </div>
                    <q-toggle v-model="dark" :color="dark ? 'orange' : 'green'" @update:model-value="updateTheme" />
                  </div> -->
                  <div align="right">
                    <Button label="Выход" @click="logout" :dark="dark" />
                  </div>
                </div>
              </q-popup-proxy>
            </Button>
          </div>
          <div class="col-2" align="right">
            v{{ version }}
          </div>
        </q-card-section>
      </q-toolbar>
    </q-header>

    <q-drawer :dark="dark" v-model="leftDrawerOpen" :width="350" :mini-width="55" :breakpoint="500"
      :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" mini-to-overlay :mini="miniState">
      <q-list dark>
        <!-- Основные пункты меню -->
        <template v-for="(menuItem, index) in mainMenuItems" :key="index">
          <q-item :to="menuItem.to" @click="() => { showMessage = true; miniState = true; }">
            <q-item-section v-if="menuItem.icon" avatar>
              <q-icon :name="menuItem.icon" />
            </q-item-section>
            <q-item-section v-else avatar>
              {{ menuItem.TT }}
            </q-item-section>
            <q-item-section>
              {{ menuItem.label }}
            </q-item-section>
            <TTTooltip :dark="dark"> {{ menuItem.label }}</TTTooltip>
          </q-item>
        </template>
        <!-- Разделитель, если есть избранное -->
        <div v-if="authStore.getFavorites.length > 0">
          <q-separator :dark="dark" />
        </div>
        <!-- Избранное -->
        <template v-for="(favorite, index) in authStore.getFavorites" :key="'fav-' + index">
          <q-item clickable @click="navigateTo(favorite.path)" :active="isActive(favorite.path)">
            <q-item-section avatar>
              <div>
                {{ favorite.short_name }}
              </div>
            </q-item-section>
            <q-item-section>
              {{ favorite.name }}
            </q-item-section>
            <TTTooltip :dark="dark">{{ favorite.name }}</TTTooltip>
          </q-item>
        </template>
      </q-list>
    </q-drawer>
    <q-page-container @click="() => { showMessage = true; miniState = true; }">
      <router-view :key="route.fullPath" v-slot="{ Component }" :authStore="authStore" :showError="showError"
        :showInfo="showInfo" :showConfirm="showConfirm" :dark="dark" :debug="debug" :branch="branch" :load="load"
        :login="login" :logout="logout">
        <component :is="Component"
          v-bind="{ authStore, showError, showInfo, showConfirm, dark, debug, branch, load, login, logout }">
          <template #favorite>
            <q-checkbox v-model="favorite" checked-icon="star" color="orange" size="sm" unchecked-icon="star_border"
              :dark="dark" @update:model-value="(val) => {
                if (val) authStore.addFavorite(route.fullPath);
                else authStore.removeFavorite(route.fullPath);
              }" />
          </template>
        </component>
      </router-view>
      <!-- Диалог ошибки -->
      <DialogError ref="de" :dark="dark" />
      <!-- Диалог подтверждения -->
      <DialogConfirm ref="dc" :dark="dark">
        <template v-slot:buttons>
          <Button :dark="dark" label="Да" v-close-popup @click="actionConfirm" />
          <Button :dark="dark" label="Отмена" v-close-popup />
        </template>
      </DialogConfirm>
      <!-- Диалог информации -->
      <DialogConfirm ref="di" :dark="dark">
        <template v-slot:buttons>
          <Button :dark="dark" label="Ок" v-close-popup />
        </template>
      </DialogConfirm>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import {
  ref,
  onMounted,
  computed,
  onBeforeUnmount,
  watch,
} from 'vue';
import DialogError from 'src/components/dialogs/error.vue';
import DialogConfirm from 'src/components/dialogs/confirm.vue';
import Button from 'src/components/InputButton.vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/store.js';
import packageInfo from '../../package.json';
import TTTooltip from 'src/components/TTTooltip.vue';

const root = document.documentElement;

const currentTextSize = ref(localStorage.getItem('text-size') ? Number(localStorage.getItem('text-size')) : 14);
// localStorage.getItem('bg-color') ? localStorage.getItem('bg-color') === 'true' : true
const dark = ref(true);

// диалог ошибки
const de = ref(null);
// диалог подтверждения
const dc = ref(null);
// диалог информации
const di = ref(null);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const routeDisplayConfig = ref({
  '/home': { label: 'Главная', icon: 'home' },
  '/tables': { label: 'Таблицы', icon: 'view_list' },
  '/reports': { label: 'Отчёты', icon: 'insert_chart_outlined' },
  '/projects': { label: 'Проекты', icon: 'co_present' },
  '/activities': { label: 'Виды активности', icon: 'flash_on' },
  '/sources': { label: 'Источники поступления', icon: 'announcement' },
  '/users': { label: 'Пользователи', icon: 'people' },
  '/branches': { label: 'Группы пользователей', icon: 'diversity_3' },
  '/daily_reports': { label: 'Ежедневник', icon: 'event_repeat' },
  '/login': { label: 'Вход', icon: 'person' }
});

const favorite = ref(false);

// Основные пункты меню
const mainMenuItems = computed(() => {
  const routes = router.getRoutes();
  const userRole = authStore.getUser?.role;

  return routes.filter((route) => {
    if (routeDisplayConfig.value[route.path]) {
      if (route.path === '/login' && authStore.isAuthenticated) return false;

      if (!authStore.isAuthenticated) return !route.meta?.requiresAuth;

      if (route.meta?.requiresAuth) {
        if (route.meta.allowedRoles?.length > 0) {
          return route.meta.allowedRoles.includes(userRole);
        }
        return true;
      }
      return true;
    }
    return false;
  }).map((route) => ({
    ...routeDisplayConfig.value[route.path],
    to: route.path
  }));
});

const leftDrawerOpen = ref(true);
const miniState = ref(true);
const version = ref(packageInfo.version);

const debug = ref(localStorage.getItem('debug') ? localStorage.getItem('debug') === 'true' : false);

const branch = ref();
const showMessage = ref(true);
const actionConfirm = ref(() => {
});

function showError(text) {
  de.value.setName('Ошибка');
  de.value.setText(text);
  de.value.show();
}

function showInfo(text) {
  di.value.setName('Инфо');
  di.value.setText(text);
  di.value.show();
}

function showConfirm(text, action) {
  actionConfirm.value = action;
  dc.value.setName('Подтверждение');
  dc.value.setText(text);
  dc.value.show();
}

function toggleLeftDrawer() {
  // Если это мобильное устройство, переключаем полностью открытие/закрытие
  if (window.innerWidth <= 500) {
    leftDrawerOpen.value = !leftDrawerOpen.value;
    miniState.value = false; // В мобильном режиме не используем mini-режим
  } else {
    // На десктопе переключаем только mini-режим
    miniState.value = !miniState.value;
  }
}
function updateTextSize() {
  root.style.setProperty('--text-size', `${currentTextSize.value}px`);
  localStorage.setItem('text-size', currentTextSize.value);
}
function updateTheme() {
  root.style.setProperty('--bg-color', dark.value ? 'var(--bg-color-dark)' : 'var(--bg-color-light)');
  root.style.setProperty('--border-color', dark.value ? 'var(--border-color-dark)' : 'var(--border-color-light)');
  localStorage.setItem('bg-color', dark.value);
}
function load(enable) {
  if (enable) document.getElementById('loading').style.display = 'display';
  else document.getElementById('loading').style.display = 'none';
}
function login(data) {
  load(true);
  authStore.login(data).then(() => {
    leftDrawerOpen.value = true;
    authStore.fetchUser().then(() => router.push('/home'));
  }).catch((err) => {
    if (err.status === 404) showError('Пользователь не найден');
    else if (err.status === 400) showError('Отсутствуют данные для авторизации');
    else if (err.status === 422) showError('Ошибка доступа');
    else if (err.status === 403) showError('Неверный пароль');
    else showError('Ошибка авторизации');
  }).finally(() => load(false));
}
function logout() {
  authStore.logout().finally(() => {
    router.push('/login');
  });
}
function navigateTo(path) {
  showMessage.value = true;
  miniState.value = true;
  router.push(path);
}
function isActive(path) {
  return route.fullPath === path;
}

watch(() => route.fullPath, (newPath) => {
  favorite.value = authStore.getFavorites.some((f) => f.path === newPath);
}, { immediate: true });

onMounted(async () => {
  load(false);
  if (authStore.isAuthenticated) {
    await authStore.initializeApp();
    updateTextSize();
    updateTheme();
  }
});
onBeforeUnmount(() => {
  if (de.value) de.value.hide();
  if (di.value) di.value.hide();
  if (dc.value) dc.value.hide();
});
</script>
