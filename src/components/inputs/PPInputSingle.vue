<template>
  <q-input dense :dark="props.dark" :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" square
    :type="props.type" :placeholder="props.placeholder" class="text-size" :hide-bottom-space="true" />
</template>

<script setup>

const props = defineProps({
  dark: Boolean,
  type: String,
  placeholder: String,
});
</script>
