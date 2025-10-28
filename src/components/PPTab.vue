<template>
  <q-tabs no-caps dense align="left" dark indicator-color="transparent" :stretch="true"
    active-color="white" active-bg-color="grey-8"
    class="pp-bg-dark text-grey no-pa-ma"
    :style="props.styleContent">
    <slot name="default" />
  </q-tabs>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  styleContent: String,
});
</script>
