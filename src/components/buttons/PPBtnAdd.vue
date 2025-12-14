<template>
  <PPBtn :dark="props.dark" icon="add" @click="props.click" />
</template>

<script setup>
import PPBtn from '../InputButton.vue';

const props = defineProps({
  click: Function,
  dark: Boolean,
});
</script>
