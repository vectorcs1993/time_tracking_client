<template>
  <q-checkbox square :dark="props.dark" dense :color="`${props.dark ? 'orange' : 'green'}`">
    <slot name="default" />
  </q-checkbox>
</template>
<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  dark: Boolean,
});
</script>
