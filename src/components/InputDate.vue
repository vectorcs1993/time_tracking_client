<template>
  <q-input dense square v-model="displayDate" readonly :input-style="`text-align: ${cell ? 'center' : 'start'};`"
    mask="##.##.####" :dark="props.dark" hide-bottom-space
    :standout="!cell ? `${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}` : false" :borderless="cell"
    placeholder="ДД.ММ.ГГГГ" :clearable="!cell">
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date v-model="internalDate" :dark="props.dark">
            <div class="row items-center justify-end q-gutter-sm">
              <InputButton label="Сегодня" @click="setToday" :dark="props.dark" />
              <InputButton v-close-popup label="Закрыть" :dark="props.dark" />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { defineProps, defineModel, computed } from 'vue';
import { date } from 'quasar';
import InputButton from './InputButton.vue';

const model = defineModel();

const props = defineProps({
  dark: Boolean,
  cell: {
    type: Boolean,
    default: false,
  }
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

// Дата для отображения в input (формат ДД.ММ.ГГГГ)
const displayDate = computed({
  get: () => {
    if (!internalDate.value) return '';

    try {
      return date.formatDate(date.extractDate(internalDate.value, 'YYYY/MM/DD'), 'DD.MM.YYYY');
    } catch {
      return '';
    }
  },
  set: (value) => {
    if (value && value.length === 10) {
      try {
        const parsedDate = date.extractDate(value, 'DD.MM.YYYY');
        internalDate.value = date.formatDate(parsedDate, 'YYYY/MM/DD');
      } catch {
        // Если дата невалидна, просто сохраняем пустое значение
        internalDate.value = '';
      }
    } else {
      internalDate.value = '';
    }
  }
});

// Установка сегодняшней даты
const setToday = () => {
  internalDate.value = date.formatDate(new Date(), 'YYYY/MM/DD');
};
</script>
