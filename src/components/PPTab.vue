<template>
  <q-tabs no-caps dense align="left" :dark="props.dark" indicator-color="transparent" :stretch="true"
    :active-color="`${props.dark ? 'white' : 'white'}`" :active-bg-color="`${props.dark ? 'grey-8' : 'green'}`"
    :class="`${props.dark ? 'pp-bg-dark text-grey' : 'pp-bg-light text-black'} ${props.classContent} no-pa-ma`"
    :style="props.styleContent">
    <slot name="default" />
  </q-tabs>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  classContent: String,
  styleContent: String,
  dark: Boolean,
});
</script>
