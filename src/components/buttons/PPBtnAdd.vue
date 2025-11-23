<template>
  <PPBtn :dark="props.dark" icon="add" @click="props.click" />
</template>

<script setup>
import { defineProps } from 'vue';
import PPBtn from '../TTBtn.vue';

const props = defineProps({
  click: Function,
  dark: Boolean,
});
</script>
