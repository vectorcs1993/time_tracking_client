<template>
  <div :class="{ 'pp-cell-wrapper': true, ...props.inputClass, 'text-size': true }">
    <div :class="[cell ? 'pp-text-trigger' : 'pp-text-trigger-regular', props.dark ? 'pp-dark' : 'pp-light']">
      <div v-if="props.label" style="font-size: xx-small;">{{ props.label }}</div>
      <input ref="inputRef" :type="props.type" :value="model" @input="handleInput" @focus="handleFocus"
        @blur="handleBlur" @keydown="handleKeydown" class="text-size pp-text-input"
        :class="[props.dark ? 'pp-dark' : 'pp-light']" />
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
  cell: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'text',
  }
});

const model = defineModel();
const inputRef = ref(null);
const isFocused = ref(false);

const handleInput = (event) => {
  model.value = event.target.value;
};

const handleFocus = () => {
  isFocused.value = true;

  // Безопасное установление курсора в конец текста
  setTimeout(() => {
    if (inputRef.value) {
      const input = inputRef.value;
      const length = input.value.length;

      try {
        // Проверяем, поддерживает ли данный тип поля выделение
        if (input.type === 'email' && !input.validity.valid) {
          // Для невалидных email полей просто фокусируемся
          input.focus();
        } else {
          // Для других типов или валидных email полей устанавливаем курсор
          input.setSelectionRange(length, length);
        }
      } catch (error) {
        // Fallback: просто фокусируемся если выделение не поддерживается
        console.warn('Selection not supported for this input type:', error.message);
        input.focus();
      }
    }
  });
};

const handleBlur = () => {
  isFocused.value = false;

  let value = model.value;

  if (value === '') {
    model.value = '';
  }

  if (props.update) {
    props.update(model.value);
  }
};

const handleKeydown = (event) => {
  const allowedKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End'
  ];

  if (event.ctrlKey || event.metaKey) {
    if (['a', 'c', 'v', 'x', 'A', 'C', 'V', 'X'].includes(event.key)) {
      return;
    }
  }

  if (!allowedKeys.includes(event.key) && event.key.length === 1) {
    // Можно добавить дополнительные ограничения если нужно
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    handleBlur(event);
    inputRef.value?.blur();
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    inputRef.value?.blur();
  }
};

onMounted(() => {
  // inputRef.value?.focus();
});

</script>
