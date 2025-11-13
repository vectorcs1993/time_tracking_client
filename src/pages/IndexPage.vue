<template>
  <q-page :class="`${props.dark ? 'pp-dark' : 'pp-light'} fit`">

  </q-page>

</template>
<script setup>
const props = defineProps({
  dark: Boolean,
});
document.title = 'Cnh';

</script>
