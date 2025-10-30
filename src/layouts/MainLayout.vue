<template>
  <q-layout view="hHh Lpr lff" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
    <q-header :dark="dark" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`">
      <q-toolbar id="header">
        <q-btn flat v-if="menuList.length > 0" dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-card-section class="q-pa-sm row items-center full-width">
          <img class="q-mt-xs" src="./images/logo.svg">
          <img class="q-mt-xs" src="./images/logo_standby_mono.svg"
            style="padding: 0px; width: 40px; height: 30px; position: absolute; left: 160px; top: 12px; z-index: 99;">
          <img class="q-mt-xs" src="./images/tt.svg"
            style="padding: 0px; height: 30px; position: absolute; left: 205px; top: 13px; z-index: 99;">
          <q-space />
          <div v-if="isAuth()">
            <PPBtn :label="user().name" icon="person" :dark="dark">
              <q-popup-proxy square :class="`${dark ? 'pp-dark' : 'pp-light'}`">
                <div class="q-pa-md" style="width: 400px;">
                  <div class="row justify-between items-center">
                    <div>
                      Логин:
                    </div>
                    <div>
                      {{ user().email }}
                    </div>
                  </div>
                  <div class="row justify-between items-center">
                    <div>
                      Роль:
                    </div>
                    <q-badge :color="dark ? 'grey-7' : 'green'">{{getRoles().find((r) => user().role ===
                      r.value).label}}</q-badge>
                  </div>
                  <div class="row justify-between items-center">
                    <div>
                      Подразделение:
                    </div>
                    <q-badge :color="dark ? 'grey-7' : 'green'">{{ branch.name }}</q-badge>
                  </div>
                  <div class="row justify-between items-center">
                    <div class="col">
                      Ночной режим:
                    </div>
                    <q-toggle v-model="dark" :color="dark ? 'orange' : 'green'" @update:model-value="updateTheme" />
                  </div>
                  <!-- Режим отладки -->
                  <div align="right">
                    <PPBtn label="Выход" :click="logout" :dark="dark" />
                  </div>
                </div>
              </q-popup-proxy>
            </PPBtn>
          </div>
          <div v-else>
            <PPBtn :dark="dark" :click="login" :label="'Вход'" style="padding-left: 10px; padding-right: 10px;" />
          </div>
          <div class="col-2" align="right">
            v{{ version }}
          </div>
        </q-card-section>
      </q-toolbar>
    </q-header>
    <q-page-container @click="() => { showMessage = true; miniState = true; }">
      <router-view :showError="showError" :showInfo="showInfo" :showConfirm="showConfirm"
        :calculateHeader="calculateHeader" :dark="dark" :debug="debug" :branch="branch" />
      <!-- Диалог ошибки -->
      <DialogError ref="de" :dark="dark" />
      <!-- Диалог подтверждения -->
      <DialogConfirm ref="dc" :dark="dark">
        <template v-slot:buttons>
          <PPBtn :dark="dark" label="Да" v-close-popup @click="actionConfirm" />
          <PPBtn :dark="dark" label="Отмена" v-close-popup />
        </template>
      </DialogConfirm>
      <!-- Диалог информации -->
      <DialogConfirm ref="di" :dark="dark">
        <template v-slot:buttons>
          <PPBtn :dark="dark" label="Ок" v-close-popup />
        </template>
      </DialogConfirm>
    </q-page-container>
  </q-layout>
</template>

<script setup>

import {
  ref,
  onMounted,
  inject,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DialogError from 'src/components/dialogs/error.vue';
import DialogConfirm from 'src/components/dialogs/confirm.vue';
import PPBtn from 'src/components/buttons/PPBtn.vue';
// import PPTooltip from 'src/components/PPTooltip.vue';
import store from '../store/index';
import packageInfo from '../../package.json';

const root = document.documentElement;

const currentTextSize = ref(localStorage.getItem('text-size') ? Number(localStorage.getItem('text-size')) : 14);

const {
  getRoles,
  getQuery,
  host,
} = inject('store');
//
const dark = ref(localStorage.getItem('bg-color') ? localStorage.getItem('bg-color') === 'true' : true);

// диалог ошибки
const de = ref(null);
// диалог подтверждения
const dc = ref(null);
// диалог информации
const di = ref(null);
// eslint-disable-next-line no-unused-vars
const route = useRoute();
const router = useRouter();

const routes = [
  {
    label: 'Главная',
    icon: 'home',
    to: '/home',
  },
  {
    icon: 'description',
    label: 'Учёт документов',
    to: '/services/documents',
  },
  {
    icon: 'account_tree',
    label: 'Проекты',
    to: '/services/projects',
  },
  {
    icon: 'fact_check',
    label: 'Номенклатура',
    to: '/services/references/nomenclatures',
  },
  {
    icon: 'settings',
    label: 'Настройки',
    to: '/services/settings',
  },
  {
    icon: 'splitscreen',
    label: 'Управление задачами',
    to: '/services/projects_tasks',
  },
  {
    icon: 'event_note',
    label: 'Учёт рабочего времени',
    to: '/services/time_tracking',
  },
  {
    TT: 'МА',
    label: 'Материалы',
    to: '/services/references/materials',
  },
  {
    TT: 'МК',
    label: 'Категории материалов',
    to: '/services/references/materials_categories',
  },
  {
    TT: 'МР',
    label: 'Роли материалов',
    to: '/services/references/materials_roles',
  },
  {
    TT: 'НК',
    label: 'Настройка корпусов',
    to: '/services/references/boxes',
  },
  {
    TT: 'AC',
    label: 'Настройка ассетов',
    to: '/services/references/assets',
  },
];
const menuList = ref([]);
const leftDrawerOpen = ref(false);
const miniState = ref(true);
const version = ref(packageInfo.version);

const debug = ref(localStorage.getItem('debug') ? localStorage.getItem('debug') === 'true' : false);
function user() {
  return store.storeVue.state.user;
}
const branch = ref();
const showMessage = ref(true);
function update() {
  store.storeVue.state.upd();
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
function isAuth() {
  return store.storeVue.getters.getAuth;
}
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
  miniState.value = !miniState.value;
  update();
}
function login() {
  router.push('/login');
  update();
}
function logout() {
  store.storeVue.dispatch('logout').then(() => {
    router.replace('/login').then(() => window.location.reload());
  });
}
const calculateHeader = () => {
  const header = document.getElementById('header');
  return (header ? header.offsetHeight : 0) + 10;
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
// function load(enable) {
//   if (enable) {
//     document.getElementById('loading').style.display = 'display';
//   } else {
//     document.getElementById('loading').style.display = 'none';
//   }
// }
onMounted(() => {
  // load(false);
  updateTextSize();
  updateTheme();
  store.storeVue.state.upd = () => {
    store.storeVue.dispatch('isAuth').then(() => {
      getQuery(`${host()}/services/branch/${user().branch}`).then((respBr) => {
        branch.value = respBr.data;
        menuList.value.length = 0;
        // menuList.value.push(routes[0]);
        routes.forEach((rt) => {
          router.options.routes[0].children.forEach((r) => {
            let add = false;
            if (r.meta) {
              if (r.meta.allowedRoles) {
                if (r.meta.allowedRoles.length > 0) {
                  if (rt.to === r.path && r.meta.allowedRoles.includes(user().role)) {
                    add = true;
                  }
                }
              } else if (rt.to === r.path) {
                add = true;
              }
            }
            if (add) {
              menuList.value.push(rt);
            }
          });
        });
      });
    }).catch((err) => {
      if (err) {
        console.log(err);
      }
    });
  };
  update();
});

</script>

<style>
@media screen and (min-width:800px) {
  .q-footer {
    display: none;
  }
}
</style>
