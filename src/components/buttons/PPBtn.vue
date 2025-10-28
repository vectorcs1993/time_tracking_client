<template>
  <q-btn no-caps class="text-size" color="grey-9" dark
    square dense :label="props.label" :icon="props.icon" @click="props.click">
    <slot name="default" />
  </q-btn>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  click: Function,
  label: String,
  color: String,
  icon: String,
  dark: Boolean,
});

</script>
