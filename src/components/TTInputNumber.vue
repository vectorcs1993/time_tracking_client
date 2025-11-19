<template>
  <div class="pp-cell-wrapper" :class="props.inputClass">
    <input ref="inputRef" type="number" :value="model" @input="handleInput" @focus="handleFocus" @blur="handleBlur"
      @keydown="handleKeydown" class="text-size pp-number-input" :class="[props.dark ? 'pp-dark' : 'pp-light']" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  dark: Boolean,
  update: Function,
  label: String,
  inputClass: String,
});

const model = defineModel();
const inputRef = ref(null);
const isFocused = ref(false);

const handleInput = (event) => {
  // Разрешаем только цифры, точку и минус
  let value = event.target.value.replace(/[^\d.-]/g, '');

  // Убираем лишние минусы (оставляем только первый)
  const minusCount = (value.match(/-/g) || []).length;
  if (minusCount > 1) {
    value = '-' + value.replace(/-/g, '');
  }

  // Убираем лишние точки (оставляем только первую)
  const dotCount = (value.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = value.split('.');
    value = parts[0] + '.' + parts.slice(1).join('');
  }

  // Минус может быть только в начале
  if (value.includes('-') && value.indexOf('-') > 0) {
    value = value.replace(/-/g, '');
    value = '-' + value;
  }

  model.value = value;
  event.target.value = value;
};

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  isFocused.value = false;

  // Валидация при потере фокуса
  let value = model.value;

  if (value === '' || value === '-' || value === '.') {
    model.value = '';
  } else if (value) {
    // Преобразуем в число и обратно в строку для нормализации
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      model.value = numValue.toString();
    } else {
      model.value = '';
    }
  }

  if (props.update) {
    props.update(model.value);
  }
};

const handleKeydown = (event) => {
  // Разрешаем: Backspace, Delete, Tab, Escape, Enter, стрелки
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End'
  ];

  // Разрешаем Ctrl/Command + A, C, V, X
  if (event.ctrlKey || event.metaKey) {
    if (['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(event.key)) {
      return;
    }
  }

  // Разрешаем цифры, точка, минус
  const allowedChars = /[\d.-]/;

  if (!allowedKeys.includes(event.key) && !allowedChars.test(event.key)) {
    event.preventDefault();
  }

  // Обработка Enter
  if (event.key === 'Enter') {
    event.preventDefault();
    handleBlur(event);
    inputRef.value?.blur();
  }
};

// Автофокус при монтировании (если нужно)
onMounted(() => {
  // Если нужно автоматически фокусироваться при создании
  // inputRef.value?.focus();
});
</script>
