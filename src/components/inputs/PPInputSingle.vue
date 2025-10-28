<template>
  <q-input dense dark standout="bg-grey text-white" square
    :type="props.type" :placeholder="props.placeholder" class="text-size" :hide-bottom-space="true" />
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  dark: Boolean,
  type: String,
  placeholder: String,
});
</script>
