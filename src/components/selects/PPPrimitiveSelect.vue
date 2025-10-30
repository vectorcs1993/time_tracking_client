<template>
  <q-select dense :dark="props.dark" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" class="text-size" square
    options-selected-class="text-size" popup-content-class="text-size" :label="props.label"
    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" v-model="model" :options="props.options">
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
