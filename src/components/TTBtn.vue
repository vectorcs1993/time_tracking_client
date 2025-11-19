<template>
  <q-btn no-caps class="text-size" :class="{
    'pp-button-dark': props.dark,
    'pp-button-light': !props.dark,
  }" :loading="load" :dark="props.dark" square dense :label="props.label" :icon="props.icon" @click="props.click">
    <slot name="default" />
  </q-btn>
</template>

<script setup>
import { defineProps, defineModel } from 'vue';

const props = defineProps({
  click: Function,
  label: String,
  color: String,
  icon: String,
  dark: Boolean,
});

const load = defineModel('loading');
</script>
