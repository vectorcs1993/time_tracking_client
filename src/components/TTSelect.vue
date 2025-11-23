<template>
  <div :class="{ 'pp-cell-wrapper': true, ...props.inputClass, 'text-size': true }" @click="toggleSelect"
    ref="wrapperRef">
    <div
      :class="[cell ? 'pp-select-trigger' : 'pp-select-trigger-regular', props.dark ? 'pp-dark' : 'pp-light', { 'pp-disabled': disable }]">
      <div v-if="props.label" style="font-size: xx-small;">{{ props.label }}</div>
      <div class="pp-selected-text">{{ model?.name || 'Выберите...' }}</div>
    </div>
    <div v-if="isOpen" class="pp-select-options"
      :class="[props.dark ? 'pp-dark-options' : 'pp-light-options', { 'pp-select-options--up': openDirection === 'up' }]"
      :style="optionsStyle">
      <div v-for="option in props.options" :key="option.id" class="pp-select-option" :class="{
        'pp-select-option--selected': isOptionSelected(option),
        'pp-select-option--hover': hoveredOption?.id === option.id
      }" @click="selectOption(option)" @mouseenter="hoveredOption = option" @mouseleave="hoveredOption = null">
        {{ option.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick
} from 'vue';
import { dropdownManager } from './dropdownManager.js';

const props = defineProps({
  dark: Boolean,
  options: Array,
  update: Function,
  label: String,
  inputClass: String,
  cell: {
    type: Boolean,
    default: false,
  }
});
const disable = defineModel('disable', {
  type: Boolean,
  default: false,
});
const model = defineModel();
const isOpen = ref(false);
const hoveredOption = ref(null);
const wrapperRef = ref(null);
const openDirection = ref('down'); // 'up' или 'down'
const optionsStyle = ref({});

const isOptionSelected = (option) => {
  return model.value?.id === option.id;
};

const calculatePosition = () => {
  if (!wrapperRef.value) return;

  const rect = wrapperRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const optionsHeight = 200; // Примерная высота списка

  // Проверяем, хватит ли места снизу
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceBelow < optionsHeight && spaceAbove > optionsHeight) {
    // Открываем вверх если снизу мало места, а сверху много
    openDirection.value = 'up';
    optionsStyle.value = {
      bottom: '100%',
      top: 'auto'
    };
  } else {
    // По умолчанию открываем вниз
    openDirection.value = 'down';
    optionsStyle.value = {
      top: '100%',
      bottom: 'auto'
    };
  }
};

const closeSelect = () => {
  isOpen.value = false;
  hoveredOption.value = null;
  dropdownManager.removeCurrent({ close: closeSelect });
};

const toggleSelect = async () => {
  if (disable.value) return;
  if (isOpen.value) {
    closeSelect();
  } else {
    dropdownManager.setCurrent({ close: closeSelect });
    isOpen.value = true;

    // Ждем отрисовки и рассчитываем позицию
    await nextTick();
    calculatePosition();
  }
};

const selectOption = (option) => {
  model.value = option;
  closeSelect();

  if (props.update) {
    props.update(option);
  }
};

// Пересчитываем позицию при изменении размера окна
const handleResize = () => {
  if (isOpen.value) {
    calculatePosition();
  }
};

// Закрытие при клике вне компонента
const handleClickOutside = (event) => {
  if (!event.target.closest('.pp-cell-wrapper')) {
    closeSelect();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
  dropdownManager.removeCurrent({ close: closeSelect });
});
</script>
