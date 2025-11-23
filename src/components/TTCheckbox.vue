<template>
  <label :class="['pp-cell-wrapper', 'text-size', { 'pp-disabled': disable }]"
    style="display: inline-flex;  flex-direction: row; align-items: center; cursor: pointer;">
    <input type="checkbox" :checked="model" :disabled="disable" @change="handleChange" class="pp-checkbox" />
    <span v-if="props.label" class="pp-checkbox-label">
      {{ props.label }}
    </span>
  </label>
</template>

<script setup>
const props = defineProps({
  dark: Boolean,
  update: Function,
  label: String,
  inputClass: String,
  cell: {
    type: Boolean,
    default: false,
  },
});
const model = defineModel();
const disable = defineModel('disable', {
  type: Boolean,
  default: false,
});

const handleChange = (event) => {
  if (!disable.value) {
    model.value = event.target.checked;
  }
};
</script>
