<template>
  <q-page class="flex flex-center text-white" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`">
    <q-card square style="width: 370px" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`"
      v-if="!authStore.isAuthenticated">
      <q-card-section :dark="props.dark" :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`">
        <div class="text-h6 row justify-center" style="line-height: 10px;"> Авторизация</div>
      </q-card-section>
      <q-card-section>
        <form class="q-pa-md q-gutter-sm" @submit.prevent="props.login({ email, password })">
          <PPInputSingle :dark="props.dark" :type="'email'" :placeholder="'Логин (адрес почты)'" v-model="email" />
          <PPInputSingle :dark="props.dark" :type="'password'" :placeholder="'Пароль'" v-model="password" />
          <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
            <PPBtn label="Войти" v-model:loading="loadLogin" type="submit" :dark="props.dark"
              style="padding-left: 10px; padding-right: 10px;" />
          </div>
        </form>
      </q-card-section>
    </q-card>
    <q-card-section v-else class="text-h4">
      Вход выполнен
    </q-card-section>
  </q-page>
</template>
<script setup>
import { ref, defineProps } from 'vue';
import { useAuthStore } from 'src/stores/auth.js';
import PPBtn from 'src/components/buttons/PPBtn.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';

const authStore = useAuthStore();

const props = defineProps({
  dark: Boolean,
  login: Function,
});

document.title = 'Вход';

const email = ref('');
const password = ref('');

</script>
