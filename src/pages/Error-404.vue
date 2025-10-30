<template>
  <div class="fullscreen bg-teal text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">
        404
      </div>

      <div class="text-h2" style="opacity:.4">
        Страницы не существует
      </div>

      <q-btn square class="q-mt-xl" color="secondary" text-color="white" unelevated to="/home" label="Главная страница"
        no-caps />
    </div>
  </div>
</template>

<script setup>

document.getElementById('loading').style.display = 'none';

</script>
