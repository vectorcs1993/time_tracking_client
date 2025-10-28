<template>
  <q-page class="flex flex-center text-white pp-light">
    <q-card square style="width: 370px" class="pp-light" v-if="!isAuth()">
      <q-card-section class="bg-header-light">
        <div class="text-h6 row justify-center text-white" style="line-height: 10px;"> Авторизация</div>
      </q-card-section>
      <q-card-section>
        <form class="q-pa-md login" @submit.prevent="login">
          <PPInputSingle class="q-ma-sm" :type="'email'" :placeholder="'Логин (адрес почты)'" v-model="email" />
          <PPInputSingle class="q-ma-sm" :type="'password'" :placeholder="'Пароль'" v-model="password" />

          <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
            <PPBtn label="Войти" type="submit" v-model:loading="loadLogin"
              style="padding-left: 10px; padding-right: 10px;" />
          </div>

        </form>
        <div class="flex flex-center" style="color: red" v-if="isFailed">Вход не выполнен!</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import store from 'src/store/index';
import PPBtn from 'src/components/buttons/PPBtn.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';

const router = useRouter();
const email = ref('');
const password = ref('');
const loadLogin = ref(false);
const isFailed = ref(false);
async function login() {
  loadLogin.value = true;
  try {
    await store.storeVue.dispatch('login', {
      email: email.value,
      password: password.value,
    });
    router.push('/');
  } catch (error) {
    isFailed.value = true;
    console.error('Ошибка входа:', error);
  } finally {
    loadLogin.value = false;
  }
}
function isAuth() {
  return store.storeVue.getters.getAuth;
}
</script>
