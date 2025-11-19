<template>
  <div class="pp-cell-wrapper" style="cursor: text;" :class="props.inputClass">
    <div :class="[cell ? 'pp-text-trigger' : 'pp-text-trigger-regular', props.dark ? 'pp-dark' : 'pp-light']">
      <div v-if="props.label" style="font-size: xx-small;">{{ props.label }}</div>
      <input ref="inputRef" type="text" :value="model" @input="handleInput" @focus="handleFocus" @blur="handleBlur"
        @keydown="handleKeydown" class="text-size pp-text-input" :class="[props.dark ? 'pp-dark' : 'pp-light']" />
    </div>
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
  // Для текста разрешаем все символы, можно добавить фильтрацию если нужно
  model.value = event.target.value;
};

const handleFocus = () => {
  isFocused.value = true;
  // Ставим курсор в конец текста
  setTimeout(() => {
    if (inputRef.value) {
      const length = inputRef.value.value.length;
      inputRef.value.setSelectionRange(length, length);
    }
  });
};

const handleBlur = () => {
  isFocused.value = false;

  // Валидация при потере фокуса (опционально)
  let value = model.value;

  if (value === '') {
    model.value = '';
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

  // Для текста разрешаем все символы кроме управляющих
  if (!allowedKeys.includes(event.key) && event.key.length === 1) {
    // Можно добавить дополнительные ограничения если нужно
    // Например: разрешить только кириллицу/латиницу/цифры
    // const allowedChars = /[а-яА-Яa-zA-Z0-9\s]/;
    // if (!allowedChars.test(event.key)) {
    //   event.preventDefault();
    // }
  }

  // Обработка Enter
  if (event.key === 'Enter') {
    event.preventDefault();
    handleBlur(event);
    inputRef.value?.blur();
  }

  // Обработка Escape
  if (event.key === 'Escape') {
    event.preventDefault();
    inputRef.value?.blur();
  }
};

// Автофокус при монтировании (если нужно)
onMounted(() => {
  // Если нужно автоматически фокусироваться при создании
  // inputRef.value?.focus();
});
</script>
