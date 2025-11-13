<template>
  <q-tooltip :anchor="props.anchor" self="center left" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`"
    style="border-radius: 0 !important; border: 1px solid;" :transition-duration="0">
    <slot name="default" />
  </q-tooltip>
</template>
<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  dark: Boolean,
  anchor: {
    type: String,
    default: 'center right',
  },
});
</script>
