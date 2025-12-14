<template>
  <q-page class="flex flex-center text-white" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`">
    <q-card square style="width: 370px" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`"
      v-if="!authStore.isAuthenticated">
      <div :dark="props.dark" :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white q-pa-sm`">
        <div class="row justify-center">Авторизация</div>
      </div>
      <q-card-section>
        <form ref="loginForm" class="q-pa-md q-gutter-sm" @submit.prevent="handleSubmit">
          <TTInputSingle label="Логин (адрес почты)" :dark="props.dark" type="email" v-model="email"
            :submit-on-enter="false" :blur-on-enter="false" @enter="handleSubmit" />
          <TTInputSingle label="Пароль" :dark="props.dark" type="password" v-model="password" :submit-on-enter="true"
            :blur-on-enter="false" @enter="handleSubmit" @submit="handleSubmit" />
          <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
            <Button label="Войти" type="submit" :dark="props.dark" style="padding-left: 10px; padding-right: 10px;" />
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
import { ref, onMounted, onUnmounted, } from 'vue';
import { useAuthStore } from 'src/stores/store.js';
import Button from 'src/components/InputButton.vue';
import TTInputSingle from 'src/components/InputText.vue';

const authStore = useAuthStore();
const loginForm = ref(null);

const props = defineProps({
  dark: Boolean,
  login: Function,
});

document.title = 'Вход';

const email = ref('');
const password = ref('');

const handleSubmit = () => {
  if (props.login) {
    props.login({ email: email.value, password: password.value });
  }
};

const handleGlobalKeydown = (event) => {
  if (event.key === 'Enter' && !authStore.isAuthenticated && email.value && password.value) {
    event.preventDefault();
    handleSubmit();
  }
};

// Добавляем глобальный обработчик
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});
</script>
