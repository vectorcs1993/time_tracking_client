<template>
  <div class="pp-cell-wrapper" :class="props.inputClass">
    <textarea ref="textareaRef" :value="model" @input="handleInput" @blur="handleBlur" @keydown="handleKeydown"
      class="text-size pp-textarea" :class="[props.dark ? 'pp-dark' : 'pp-light']" :rows="minRows"
      :style="{ height: textareaHeight }" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';

const props = defineProps({
  dark: Boolean,
  update: Function,
  label: String,
  inputClass: String,
  type: {
    type: String,
    default: 'text'
  }
});

const model = defineModel();
const textareaRef = ref(null);
const textareaHeight = ref('auto');
const minRows = ref(1);

const handleInput = (event) => {
  model.value = event.target.value;
  adjustHeight();
};


const handleBlur = () => {
  if (props.update) {
    props.update(model.value);
  }
};

const handleKeydown = (event) => {
  // Обработка Enter без Shift - сохраняем и выходим
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleBlur(event);
    textareaRef.value?.blur();
  }

  // Обработка Escape - отмена и выход
  if (event.key === 'Escape') {
    event.preventDefault();
    textareaRef.value?.blur();
  }
};

const adjustHeight = () => {
  nextTick(() => {
    if (textareaRef.value) {
      // Сбрасываем высоту для правильного расчета
      textareaRef.value.style.height = 'auto';

      // Устанавливаем высоту по содержимому
      const newHeight = Math.max(
        textareaRef.value.scrollHeight,
        minRows.value * 20 // минимальная высота по количеству строк
      );

      textareaRef.value.style.height = `${newHeight}px`;
      textareaHeight.value = `${newHeight}px`;
    }
  });
};

// Автоматическая регулировка высоты при изменении содержимого
watch(model, adjustHeight);

// Автофокус и настройка высоты при монтировании
onMounted(() => {
  adjustHeight();
});
</script>
