<template>
  <div class="fullscreen bg-teal text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">
        401
      </div>

      <div class="text-h2" style="opacity:.4">
        Ошибка доступа
      </div>

      <q-btn square class="q-mt-xl" color="secondary" text-color="white" unelevated @click="logout"
        label="Вернуться ко входу" no-caps />
    </div>
  </div>
</template>

<script setup>
// import store from 'src/store/index';
// import { useRouter } from 'vue-router';

// const router = useRouter();
function logout() {
  // store.storeVue.dispatch('logout').then(() => {
  //   router.replace('/login').then(() => window.location.reload());
  // });
}

</script>
