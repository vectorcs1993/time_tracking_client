<template>
  <q-btn class="text-size" :color="`${props.dark ? 'white' : 'green'}`" :dark="props.dark" square dense :icon="icon"
    no-caps="" flat>
    <slot name="default" />
  </q-btn>
</template>
<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  dark: Boolean,
  icon: {
    type: String,
    default: '',
  },
});
</script>
