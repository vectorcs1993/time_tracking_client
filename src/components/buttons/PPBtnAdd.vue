<template>
  <PPBtn :dark="props.dark" label="Добавить" icon="add" :click="props.click" />
</template>

<script setup>
import { defineProps } from 'vue';
import PPBtn from './PPBtn.vue';

const props = defineProps({
  click: Function,
  dark: Boolean,
});
</script>
