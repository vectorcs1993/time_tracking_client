<template>
  <q-dialog square :dark="props.dark">
    <q-card :class="`${dark ? 'pp-dark' : 'pp-light'} text-size`" :style="`${props.styleContent}`">
      <q-bar :dark="props.dark" :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white text-size`">
        <div class="text-size truncate">{{ props.label }}</div>
        <q-space />
        <q-btn dense square flat icon="close" v-close-popup />
      </q-bar>
      <q-card-section class="q-pa-none scrollable-content" style="overflow-y: auto;">
        <slot :class="`${dark ? 'pp-dark' : 'pp-light'} text-size`" name="default" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
const props = defineProps({
  dark: Boolean,
  model: Object,
  styleContent: String,
  label: String,
});
</script>

<style scoped>
/* Рекомендую использовать этот подход со стилями */
.scrollable-content {
  max-height: 60vh;
  /* или любая другая фиксированная высота */
  min-height: 200px;
  /* минимальная высота */
}

/* Альтернативно, если хотите динамическую высоту */
:deep(.q-card) {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

:deep(.q-card-section) {
  flex: 1;
  overflow-y: auto;
}
</style>
