<template>
  <PPBtn color="grey" icon="edit" :click="props.click" />
</template>

<script setup>
import { defineProps } from 'vue';
import PPBtn from '../TTBtn.vue';

const props = defineProps({
  click: Function,
});
</script>
