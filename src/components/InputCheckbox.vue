<template>
  <q-checkbox square :dark="props.dark" dense>
    <slot name="default" />
  </q-checkbox>
</template>
<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  dark: Boolean,
});
</script>
