<template>
  <q-layout view="hHh Lpr lff">
    <q-header dark class="bg-header-light">
      <q-toolbar id="header">
        <q-card-section class="q-pa-sm row items-center full-width">
          <img class="q-mt-xs" src="./images/logo.svg" style="cursor: pointer;">
          <img class="q-mt-xs" src="./images/logo_standby_mono.svg"
            style="padding: 0px; width: 40px; height: 30px; cursor: pointer; position: absolute; left: 160px; top: 12px; z-index: 99;">
          <q-space />
          <div v-if="isAuth()">
            <PPBtn icon="person" :label="`${user() ? user().name : ''}`" dark>
              <q-popup-proxy square dark class="pp-light">
                <div class="q-pa-md" style="width: 400px;">
                  <div class="row justify-between items-center">
                    <div>
                      Логин:
                    </div>
                    <div>
                      {{ user().name }}
                    </div>
                  </div>
                  <div class="row justify-between items-center">
                    <div>
                      Роль:
                    </div>
                    <div>
                      {{getRoles().find((r) => user().role === r.value).label}}
                    </div>
                  </div>
                  <div></div>
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
            v {{ version }}
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
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import packageInfo from '../../package.json';
import PPBtn from 'src/components/buttons/PPBtn.vue';
import store from 'src/store';

const { getRoles } = inject('store');
const version = ref(packageInfo.version);
const router = useRouter();
function isAuth() {
  return store.storeVue.getters.getAuth;
}
function login() {
  router.push('/login');
}
function user() {
  return store.storeVue.state.user;
}
function logout() {
  store.storeVue.dispatch('logout').then(() => {
    router.replace('/login').then(() => window.location.reload());
  });
}
onMounted(
  async () => {
    try {
      const result = await store.storeVue.dispatch('initializeAuth');
      if (result) {
        console.log('Аутентификация успешно инициализирована');
      }
      // вернуть, чтобы сразу перекидывало на окно логина, если авторизация не пройдена
      // else {
      //   router.push('/login');
      // }
    } catch (error) {
      console.error('Ошибка при инициализации аутентификации:', error);
      router.push('/login');
    }
  })
</script>
