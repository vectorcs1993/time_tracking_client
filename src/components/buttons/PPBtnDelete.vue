<template>
  <PPBtn color="red" icon="delete" @click="props.click" />
</template>

<script setup>
import PPBtn from '../InputButton.vue';

const props = defineProps({
  click: Function,
});
</script>
