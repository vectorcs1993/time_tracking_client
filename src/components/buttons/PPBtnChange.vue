<template>
  <PPBtn color="grey" label="Редактировать" icon="edit" :click="props.click" />
</template>

<script setup>
import { defineProps } from 'vue';
import PPBtn from './PPBtn.vue';

const props = defineProps({
  click: Function,
});
</script>
