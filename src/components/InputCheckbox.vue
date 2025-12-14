<template>
  <q-checkbox square :dark="props.dark" dense :color="`${props.dark ? 'grey' : 'green'}`">
    <slot name="default" />
  </q-checkbox>
</template>
<script setup>
const props = defineProps({
  dark: Boolean,
});
</script>
