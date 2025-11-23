<template>
  <q-layout view="hHh Lpr lff" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
    <q-header :dark="dark" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`">
      <q-toolbar id="header">
        <q-btn flat v-if="leftDrawerOpen" dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-card-section class="q-pa-sm row items-center full-width">
          <!-- <img class="q-mt-xs" src="./images/logo.svg"> -->
          <!-- <img class="q-mt-xs" src="./images/logo_standby_mono.svg"
            style="padding: 0px; width: 40px; height: 30px; position: absolute; left: 160px; top: 12px; z-index: 99;"> -->
          <!-- <img class="q-mt-xs" src="./images/tt.svg"> -->
          <div class="text-h6" style="display: block; cursor: pointer;" @click="() => router.push('/')">{{ `Планерман
            ${getTitlePage()}` }}</div>
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
          <div v-else>
            <Button :dark="dark" @click="() => router.push('/login')" :label="'Вход'"
              style="padding-left: 10px; padding-right: 10px;" />
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
            <TTTooltip v-if="miniState === true" :dark="dark"> {{ menuItem.label }}</TTTooltip>
          </q-item>
        </template>
      </q-list>
    </q-drawer>
    <q-page-container @click="() => { showMessage = true; miniState = true; }">
      <router-view :authStore="authStore" :showError="showError" :showInfo="showInfo" :showConfirm="showConfirm"
        :contentHeight="contentHeight" :dark="dark" :debug="debug" :branch="branch" :load="load" :login="login"
        :logout="logout" />
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
import Button from 'src/components/TTBtn.vue';
import TTTooltip from 'src/components/TTTooltip.vue';
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

const routes = [
  {
    label: 'Главная',
    icon: 'home',
    to: '/home',
  },
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
    icon: 'handyman',
    label: 'Настройка таблиц',
    to: '/configurations/tables',
  },
  {
    icon: 'construction',
    label: 'Настройка отчётов',
    to: '/settings/reports',
  },
];

const menuList = computed(() => authStore.isAuthenticated ? routes : []);
const leftDrawerOpen = computed(() => authStore.isAuthenticated);
const miniState = ref(true);
const version = ref(packageInfo.version);

const debug = ref(localStorage.getItem('debug') ? localStorage.getItem('debug') === 'true' : false);

const branch = ref();
const showMessage = ref(true);

function update() {
  leftDrawerOpen.value = true;
  showMessage.value = true;
}
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
  leftDrawerOpen.value = !leftDrawerOpen.value;
  miniState.value = !miniState.value;
  update();
}
const calculateHeader = () => {
  const header = document.getElementById('header');
  return (header ? header.offsetHeight : 0) + 10;
};
const zoomLevel = ref(100);
const contentHeight = ref(0);
let resizeTimeout = null;

watch(zoomLevel, (newVal) => {
  console.log('Масштаб изменен:', newVal + '%')
})

const calculateRemainingHeight = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const headerHeight = calculateHeader();
    const availableHeight = window.innerHeight - headerHeight - 10; // 10px для отступов
    contentHeight.value = availableHeight;
  }, 300);
};
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
    leftDrawerOpen.value = false;
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
  window.addEventListener('resize', calculateRemainingHeight);
  calculateRemainingHeight();
  // Инициализируем store перед проверкой аутентификации
  authStore.initializeStore();

  if (authStore.isAuthenticated) {
    await authStore.initializeApp();
    updateTextSize();
    updateTheme();
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateRemainingHeight);
  if (resizeTimeout) clearTimeout(resizeTimeout);
  if (de.value) de.value.hide();
  if (di.value) di.value.hide();
  if (dc.value) dc.value.hide();
});
</script>
