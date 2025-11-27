<template>
  <div :class="{ 'pp-cell-wrapper': true, ...props.inputClass, 'text-size': true }" @click="toggleSelect"
    ref="wrapperRef">
    <div
      :class="[cell ? 'pp-select-trigger' : 'pp-select-trigger-regular', props.dark ? 'pp-dark' : 'pp-light', { 'pp-disabled': disable }]">
      <div v-if="props.label" style="font-size: xx-small;">{{ props.label }}</div>
      <div class="pp-selected-text">
        <template v-if="selectedOptions.length > 0">
          {{ getSelectedText() }}
        </template>
        <template v-else>
          Выберите...
        </template>
      </div>
    </div>
    <div v-if="isOpen" class="pp-select-options"
      :class="[props.dark ? 'pp-dark-options' : 'pp-light-options', { 'pp-select-options--up': openDirection === 'up' }]"
      :style="optionsStyle">
      <div v-for="option in props.options" :key="option.id" class="pp-select-option" :class="{
        'pp-select-option--selected': isOptionSelected(option),
        'pp-select-option--hover': hoveredOption?.id === option.id
      }" @click="toggleOption(option)" @mouseenter="hoveredOption = option" @mouseleave="hoveredOption = null">
        <div class="pp-multiselect-option">
          <TTCheckbox :modelValue="isOptionSelected(option)" @update:modelValue="handleCheckboxChange(option, $event)"
            :label="option.name" @click.stop :dark="props.dark" />
        </div>
      </div>
      <div v-if="props.options.length > 0" class="pp-multiselect-actions">
        <TTBtn @click="selectAll" label="Выбрать все" :dark="props.dark" />
        <TTBtn @click="clearAll" label="Очистить" :dark="props.dark" />
      </div>
      <div v-else class="pp-no-options">
        Нет доступных опций
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue';
import { dropdownManager } from './dropdownManager.js';
import TTBtn from './InputButton.vue';
import TTCheckbox from './InputCheckbox.vue';

const props = defineProps({
  dark: Boolean,
  options: Array,
  update: Function,
  label: String,
  inputClass: String,
  cell: {
    type: Boolean,
    default: false,
  },
  maxDisplay: {
    type: Number,
    default: 2
  }
});

const disable = defineModel('disable', {
  type: Boolean,
  default: false,
});

// Модель для массива выбранных опций
const model = defineModel({
  type: Array,
  default: () => []
});

const isOpen = ref(false);
const hoveredOption = ref(null);
const wrapperRef = ref(null);
const openDirection = ref('down');
const optionsStyle = ref({});

// Вычисляемое свойство для выбранных опций
const selectedOptions = computed(() => {
  if (!model.value || !Array.isArray(model.value)) return [];
  return props.options.filter(option =>
    model.value.some(selected => selected.id === option.id)
  );
});

// Получение текста для отображения в триггере
const getSelectedText = () => {
  if (selectedOptions.value.length === 0) return 'Выберите...';

  const names = selectedOptions.value.map(option => option.name);

  if (names.length <= props.maxDisplay) {
    return names.join(', ');
  } else {
    return `${names.slice(0, props.maxDisplay).join(', ')} и еще ${names.length - props.maxDisplay}`;
  }
};

// Проверка выбрана ли опция
const isOptionSelected = (option) => {
  return selectedOptions.value.some(selected => selected.id === option.id);
};

// Обработчик изменения чекбокса
const handleCheckboxChange = (option, value) => {
  const currentSelection = model.value ? [...model.value] : [];
  const optionIndex = currentSelection.findIndex(item => item.id === option.id);

  if (value && optionIndex === -1) {
    // Добавляем опцию если чекбокс включен и опция не выбрана
    currentSelection.push(option);
  } else if (!value && optionIndex > -1) {
    // Удаляем опцию если чекбокс выключен и опция выбрана
    currentSelection.splice(optionIndex, 1);
  }

  model.value = currentSelection;

  if (props.update) {
    props.update(currentSelection);
  }
};

// Переключение выбора опции
const toggleOption = (option) => {
  handleCheckboxChange(option, !isOptionSelected(option));
};

// Выбрать все опции
const selectAll = () => {
  model.value = [...props.options];
  if (props.update) {
    props.update(model.value);
  }
};

// Очистить все выбранные опции
const clearAll = () => {
  model.value = [];
  if (props.update) {
    props.update(model.value);
  }
};

// Расчет позиции dropdown (такой же как в оригинальном компоненте)
const calculatePosition = () => {
  if (!wrapperRef.value) return;

  const rect = wrapperRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const optionsHeight = 200;

  const spaceBelow = viewportHeight - rect.bottom;
  const spaceAbove = rect.top;

  if (spaceBelow < optionsHeight && spaceAbove > optionsHeight) {
    openDirection.value = 'up';
    optionsStyle.value = {
      bottom: '100%',
      top: 'auto'
    };
  } else {
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

    await nextTick();
    calculatePosition();
  }
};

// Обработчики событий (такие же как в оригинальном компоненте)
const handleResize = () => {
  if (isOpen.value) {
    calculatePosition();
  }
};

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
