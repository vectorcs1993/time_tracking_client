<template>
  <div :class="{ 'pp-cell-wrapper': cell, ...props.inputClass, 'text-size': true }">
    <button :class="['pp-button', { 'pp-disabled': disable, 'pp-button-dark': dark }]" @click="handleClick"
      :disabled="disable">
      <span v-if="label">{{ label }}</span>
      <slot></slot>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  disable: Boolean,
  dark: Boolean,
  label: String,
  cell: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  if (props.disable) {
    console.log('Button is disabled, click blocked');
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  emit('click', event);
};
</script>
