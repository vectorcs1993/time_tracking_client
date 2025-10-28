<template>
  <PPBtn color="red" label="Удалить" icon="delete" :click="props.click" />
</template>

<script setup>
import { defineProps } from 'vue';
import PPBtn from './PPBtn.vue';

const props = defineProps({
  click: Function,
});
</script>
