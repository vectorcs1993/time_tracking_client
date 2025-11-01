<template>
  <q-page class="flex flex-center text-white" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`">
    <q-card square style="width: 370px" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" v-if="!isAuth()">
      <q-card-section :dark="props.dark" :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`">
        <div class="text-h6 row justify-center" style="line-height: 10px;"> Авторизация</div>
      </q-card-section>
      <q-card-section>
        <form class="q-pa-md login" @submit.prevent="login">

          <PPInputSingle class="q-ma-sm" :dark="props.dark" :type="'email'" :placeholder="'Логин (адрес почты)'"
            v-model="email" />
          <PPInputSingle class="q-ma-sm" :dark="props.dark" :type="'password'" :placeholder="'Пароль'"
            v-model="password" />
          <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
            <PPBtn label="Войти" v-model:loading="loadLogin" type="submit" :dark="props.dark"
              style="padding-left: 10px; padding-right: 10px;" />
          </div>
        </form>
      </q-card-section>
    </q-card>
    <q-card-section v-if="isAuth()" class="text-h4">
      Привет, {{ user().name }}
    </q-card-section>
  </q-page>
</template>
<script setup>
import { ref, defineProps, inject } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from 'src/store/index';
import PPBtn from 'src/components/buttons/PPBtn.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';

const props = defineProps({
  showError: Function,
  dark: Boolean,
});

const {
  SERVERS_LIST,
} = inject('store');

document.title = 'Вход';
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const inputServer = ref(SERVERS_LIST.find((s) => s.id === store.storeVue.state.currentServer.id));
const loadLogin = ref(false);
function login() {
  loadLogin.value = true;
  store.storeVue.dispatch('login', {
    email: email.value,
    password: password.value,
    server: inputServer.value.id,
  }).then(() => {
    loadLogin.value = false;
    router.push(route.query.redirect || '/').then(() => {
      if (store.storeVue.state.upd) {
        store.storeVue.state.upd();
      }
    });
  }).catch(() => {
    loadLogin.value = false;
    props.showError('Вход не выполнен');
  });
}
function isAuth() {
  return store.storeVue.getters.getAuth;
}
function user() {
  return store.storeVue.state.user;
}
</script>
