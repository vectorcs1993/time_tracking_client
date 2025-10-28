<template>
  <q-input dark v-model="model" square class="text-size" dense debounce="300" clearable
    standout="bg-grey text-white" :placeholder="props.placeholder"
    style="margin: 10px; width: 300px;" @clear="() => {
      model = '';
    }">
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
  placeholder: String,
  iconName: String,
});
</script>
