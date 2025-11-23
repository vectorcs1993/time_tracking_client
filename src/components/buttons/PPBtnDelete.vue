<template>
  <PPBtn color="red" icon="delete" @click="props.click" />
</template>

<script setup>
import { defineProps } from 'vue';
import PPBtn from '../TTBtn.vue';

const props = defineProps({
  click: Function,
});
</script>
