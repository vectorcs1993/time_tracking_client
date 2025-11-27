<template>
  <q-input :dark="props.dark" v-model="model" square class="text-size" dense debounce="300" clearable
    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" style="width: 300px;">
    <template v-slot:append>
      <q-icon name="search" />
    </template>
  </q-input>
</template>
<script setup>
import { defineProps, defineModel } from 'vue';

const model = defineModel();

const props = defineProps({
  dark: Boolean,
});
</script>
