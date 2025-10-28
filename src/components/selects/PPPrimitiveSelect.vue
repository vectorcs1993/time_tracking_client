<template>
  <q-select dense dark class="pp-light" square :label="props.label" options-selected-class="pp-light"
    popup-content-class="pp-light" standout="bg-grey text-white"
    v-model="model" :options="props.options">
  </q-select>
</template>
<script setup>
import { defineProps, defineModel } from 'vue';

const model = defineModel();
const props = defineProps({
  dark: Boolean,
  options: Array,
  label: String,
});
</script>
