<template>
  <q-layout view="hHh Lpr lff" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
    <q-header :dark="dark" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`">
      <q-toolbar id="header">
        <q-btn flat dense square icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-card-section class="q-pa-sm row items-center full-width">
          <div class="text-h6" style="display: block; cursor: pointer;" @click="() => router.push('/')">
            {{ `Планерман ${getTitlePage()}` }}</div>
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
                    <q-badge :color="dark ? 'grey-7' : 'green'">{{ authStore.getUser.role }}</q-badge>
                  </div>
                  <div class="row justify-between items-center">
                    <div>
                      Подразделение:
                    </div>
                    <q-badge :color="dark ? 'grey-7' : 'green'">{{ authStore.getBranch.name }}</q-badge>
                  </div>
                  <div class="row justify-between items-center">
                    <div class="col">
                      Размер шрифта:
                    </div>
                    <q-slider class="col" v-model="currentTextSize" :min="12" :max="24" :step="1" snap label
                      :color="dark ? 'orange' : 'green'" @update:model-value="updateTextSize" />
                  </div>
                  <div class="row justify-between items-center">
                    <div class="col">
                      Ночной режим:
                    </div>
                    <q-toggle v-model="dark" :color="dark ? 'orange' : 'green'" @update:model-value="updateTheme" />
                  </div>
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
        <template v-for="(menuItem, index) in menuList" :key="index">
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
          </q-item>
        </template>
      </q-list>
    </q-drawer>
    <q-page-container @click="() => { showMessage = true; miniState = true; }">
      <router-view :authStore="authStore" :showError="showError" :showInfo="showInfo" :showConfirm="showConfirm"
        :dark="dark" :debug="debug" :branch="branch" :load="load" :login="login" :logout="logout" contentHeight="840" />
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
// import { useQuasar } from 'quasar';
import DialogError from 'src/components/dialogs/error.vue';
import DialogConfirm from 'src/components/dialogs/confirm.vue';
import Button from 'src/components/InputButton.vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/store.js';
import packageInfo from '../../package.json';

const root = document.documentElement;

const currentTextSize = ref(localStorage.getItem('text-size') ? Number(localStorage.getItem('text-size')) : 14);

const dark = ref(localStorage.getItem('bg-color') ? localStorage.getItem('bg-color') === 'true' : true);

// диалог ошибки
const de = ref(null);
// диалог подтверждения
const dc = ref(null);
// диалог информации
const di = ref(null);

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const mainPage = {
  label: 'Главная',
  icon: 'home',
  to: '/home',
};
const routes = [
  mainPage,
  {
    icon: 'view_list',
    label: 'Таблицы',
    to: '/tables',
  },
  {
    icon: 'article',
    label: 'Отчёты',
    to: '/reports',
  },
  {
    icon: 'co_present',
    label: 'Проекты',
    to: '/projects',
  },
  {
    icon: 'flash_on',
    label: 'Виды активности',
    to: '/activities',
  },
  {
    icon: 'announcement',
    label: 'Источники поступления',
    to: '/sources',
  },
  {
    icon: 'construction',
    label: 'Настройка отчётов',
    to: '/settings/reports',
  },
];
// const $q = useQuasar();
const menuList = computed(() => authStore.isAuthenticated ? routes : [mainPage, {
  icon: 'person',
  label: 'Вход',
  to: '/login',
}]);
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
const zoomLevel = ref(100);

watch(zoomLevel, (newVal) => {
  console.log('Масштаб изменен:', newVal + '%')
})

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
  }).catch(() => {
    showError('Ошибка авторизации');
  }).finally(() => load(false));
}
function logout() {
  authStore.logout().finally(() => {
    router.push('/login');
  });
}
function getTitlePage() {
  const a = routes.find((r) => r.to === route.path);
  if (a) return `/ ${a.label}`;
  return '';
}
onMounted(async () => {
  load(false);
  // Инициализируем store перед проверкой аутентификации
  authStore.initializeStore();

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
