<template>
  <q-btn no-caps dense class="text-size" :loading="load" :dark="props.dark" square :label="props.label"
    :icon="props.icon" @click="props.click">
    <slot name="default" />
  </q-btn>
</template>

<script setup>

const props = defineProps({
  label: String,
  color: String,
  icon: String,
  dark: Boolean,
});

const load = defineModel('loading');
</script>
