<template>
  <q-date square flat v-model="internalDate" :dark="props.dark">
    <div class="row items-center justify-end q-gutter-sm">
      <InputButton label="Сегодня" @click="setToday" :dark="props.dark" />
    </div>
  </q-date>
</template>

<script setup>
import { defineProps, defineModel, computed } from 'vue';
import { date } from 'quasar';
import InputButton from './InputButton.vue';

const model = defineModel();

const props = defineProps({
  dark: Boolean,
});

// Внутренняя дата для QDate (формат YYYY/MM/DD)
const internalDate = computed({
  get: () => {
    if (!model.value) return '';

    if (typeof model.value === 'string' && model.value.includes('/')) {
      return model.value;
    }

    try {
      const parsedDate = new Date(model.value);
      if (!isNaN(parsedDate.getTime())) {
        return date.formatDate(parsedDate, 'YYYY/MM/DD');
      }
    } catch {
      console.warn('Не удалось распарсить дату:', model.value);
    }

    return '';
  },
  set: (value) => {
    model.value = value || null;
  }
});

// Установка сегодняшней даты
const setToday = () => {
  internalDate.value = date.formatDate(new Date(), 'YYYY/MM/DD');
};
</script>
