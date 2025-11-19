<template>
  <q-tooltip :anchor="props.anchor" self="center left" class="pp-tooltip text-size" :class="{ 'dark': props.dark }"
    :transition-duration="0">
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
