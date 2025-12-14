<template>
  <q-input :dark="props.dark" v-model="model" square class="text-size" dense debounce="300" clearable
    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" :placeholder="props.placeholder">
    <template v-slot:append>
      <q-icon name="search" />
    </template>
  </q-input>

</template>
<script setup>

const model = defineModel();

const props = defineProps({
  dark: Boolean,
  placeholder: String,
  iconName: String,
});
</script>
