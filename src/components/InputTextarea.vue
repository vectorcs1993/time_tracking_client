<template>
  <q-input dense :label="props.label" :dark="props.dark" autogrow :type="props.type"
    :standout="!cell ? `${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}` : false" :borderless="cell" square
    :placeholder="props.placeholder" class="text-size" :hide-bottom-space="true" style="padding: 0px;"
    input-style="text-align: center;" />
</template>

<script setup>

const props = defineProps({
  dark: Boolean,
  type: String,
  placeholder: String,
  label: String,
  cell: {
    type: Boolean,
    default: false,
  }
});
</script>
