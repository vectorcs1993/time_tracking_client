<template>
  <q-inner-loading :showing="model" size="50px" style="z-index: 99;" :dark="props.dark" />
</template>
<script setup>
import { defineProps, defineModel } from 'vue';

const model = defineModel();
const props = defineProps({
  dark: Boolean,
});
</script>
