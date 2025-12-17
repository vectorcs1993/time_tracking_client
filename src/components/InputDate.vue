<template>
  <q-input dense square v-model="displayValue" readonly class="q-pa-none"
    :input-style="`text-align: ${cell ? 'center' : 'start'};`" :range :dark="props.dark" hide-bottom-space
    :standout="!cell ? `${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}` : false" :borderless="cell"
    :placeholder="placeholder" :clearable="!cell" fill-mask :mask="mask" @clear="handleClear">

    <template v-slot:append>
      <!-- Кнопка даты -->
      <q-icon name="event" class="cursor-pointer q-pa-none" size="sm">
        <q-popup-proxy square transition-show="scale" transition-hide="scale" style="overflow-y: hidden;">
          <q-date square v-model="internalDate" :dark="props.dark" @update:model-value="handleDateUpdate" no-unset>
            <div class="row items-center justify-end q-gutter-xs">
              <InputButton label="Сегодня" @click="setToday" :dark="props.dark" />
              <InputButton v-close-popup label="Закрыть" :dark="props.dark" />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>

      <!-- Кнопка времени (если включена) -->
      <template v-if="withTime">
        <q-icon name="access_time" class="cursor-pointer q-pa-none" size="sm">
          <q-popup-proxy square transition-show="scale" transition-hide="scale">
            <q-time square="" v-model="internalTime" :dark="props.dark" format24h now-btn no-unset>
              <div class="row items-center justify-end q-gutter-xs">
                <InputButton label="Сейчас" @click="setCurrentTime" :dark="props.dark" />
                <InputButton v-close-popup label="Закрыть" :dark="props.dark" />
              </div>
            </q-time>
          </q-popup-proxy>
        </q-icon>
      </template>
    </template>
  </q-input>
</template>

<script setup>
import { computed } from 'vue';
import { date } from 'quasar';
import InputButton from './InputButton.vue';

const model = defineModel();

const props = defineProps({
  dark: Boolean,
  cell: {
    type: Boolean,
    default: false,
  },
  withTime: {
    type: Boolean,
    default: false,
  },
  range: {
    type: Boolean,
    default: false,
  }
});

// Вычисляемые свойства для маски и плейсхолдера
const mask = computed(() => {
  return props.withTime ? '##.##.#### ##:##' : '##.##.####';
});

const placeholder = computed(() => {
  return props.withTime ? 'ДД.ММ.ГГГГ ЧЧ:мм' : 'ДД.ММ.ГГГГ';
});

// Функция для проверки, является ли значение пустым или невалидным
const isEmptyOrInvalid = (value) => {
  if (!value) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (value === 'Invalid Date') return true;

  try {
    const parsed = new Date(value);
    return isNaN(parsed.getTime());
  } catch {
    return true;
  }
};

// Функция для извлечения даты из значения модели
const extractDatePart = (value) => {
  if (isEmptyOrInvalid(value)) return '';

  if (typeof value === 'string' && value.includes('/')) {
    // Формат YYYY/MM/DD или YYYY/MM/DD HH:mm
    return value.split(' ')[0];
  }

  try {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return date.formatDate(parsedDate, 'YYYY/MM/DD');
    }
  } catch {
    console.warn('Не удалось распарсить дату:', value);
  }

  return '';
};

// Функция для извлечения времени из значения модели
const extractTimePart = (value) => {
  if (!props.withTime) return '00:00';

  if (isEmptyOrInvalid(value)) return '00:00';

  if (typeof value === 'string') {
    if (value.includes(' ')) {
      // Формат YYYY/MM/DD HH:mm
      const parts = value.split(' ');
      return parts[1] || '00:00';
    }
  }

  try {
    const parsedDate = new Date(value);
    if (!isNaN(parsedDate.getTime())) {
      return date.formatDate(parsedDate, 'HH:mm');
    }
  } catch {
    console.warn('Не удалось распарсить время:', value);
  }

  return '00:00';
};

// Обработчик изменения даты в QDate
const handleDateUpdate = (newValue) => {
  if (!newValue || newValue.trim() === '') {
    // Если дата очищена в календаре
    if (props.withTime) {
      model.value = null;
    } else {
      model.value = null;
    }
  }
};

// Обработчик очистки поля
const handleClear = () => {
  model.value = null;
};

// Внутренняя дата для QDate (формат YYYY/MM/DD)
const internalDate = computed({
  get: () => {
    return extractDatePart(model.value);
  },
  set: (value) => {
    if (value && value.trim() !== '') {
      if (props.withTime) {
        // Если включено время, сохраняем дату и время
        const time = internalTime.value || '00:00';
        model.value = `${value} ${time}`;
      } else {
        // Если время отключено, сохраняем только дату
        model.value = value;
      }
    } else {
      // Если значение пустое, устанавливаем null
      model.value = null;
    }
  }
});

// Внутреннее время для QTime (только если включено)
const internalTime = computed({
  get: () => {
    if (!props.withTime) return '00:00';
    return extractTimePart(model.value);
  },
  set: (value) => {
    if (value && props.withTime) {
      const datePart = internalDate.value;
      if (datePart && datePart.trim() !== '') {
        model.value = `${datePart} ${value}`;
      } else {
        // Если даты нет, но пытаемся установить время, устанавливаем текущую дату
        const today = date.formatDate(new Date(), 'YYYY/MM/DD');
        model.value = `${today} ${value}`;
      }
    } else if (value === null || value === '') {
      // Если время очищено, устанавливаем null
      model.value = null;
    }
  }
});

// Значение для отображения в input
const displayValue = computed({
  get: () => {
    const dateStr = internalDate.value;
    if (!dateStr || dateStr.trim() === '') return '';

    try {
      // Форматируем дату в DD.MM.YYYY
      const formattedDate = date.formatDate(
        date.extractDate(dateStr, 'YYYY/MM/DD'),
        'DD.MM.YYYY'
      );

      // Проверяем, что дата не 01.01.1900 (минимальная дата)
      if (formattedDate === '01.01.1900') {
        return '';
      }

      // Добавляем время только если включено
      if (props.withTime) {
        const timeStr = internalTime.value;
        if (timeStr && timeStr !== '00:00') {
          return `${formattedDate} ${timeStr}`;
        }
      }

      return formattedDate;
    } catch {
      return '';
    }
  },
  set: (value) => {
    if (value && value.length >= 10) {
      try {
        // Извлекаем дату
        const dateStr = value.substring(0, 10); // ДД.ММ.ГГГГ
        const parsedDate = date.extractDate(dateStr, 'DD.MM.YYYY');

        // Проверяем, что дата не 01.01.1900
        if (date.formatDate(parsedDate, 'DD.MM.YYYY') === '01.01.1900') {
          model.value = null;
          return;
        }

        const dateFormatted = date.formatDate(parsedDate, 'YYYY/MM/DD');

        if (props.withTime) {
          // Извлекаем время
          let timeStr = '00:00';
          if (value.length >= 16) {
            timeStr = value.substring(11, 16); // ЧЧ:мм
            // Проверяем валидность времени
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(timeStr)) {
              timeStr = '00:00';
            }
          }

          model.value = `${dateFormatted} ${timeStr}`;
        } else {
          // Только дата
          model.value = dateFormatted;
        }
      } catch {
        model.value = null;
      }
    } else {
      model.value = null;
    }
  }
});

// Установка сегодняшней даты
const setToday = () => {
  const today = date.formatDate(new Date(), 'YYYY/MM/DD');
  if (props.withTime) {
    const time = internalTime.value || date.formatDate(new Date(), 'HH:mm');
    model.value = `${today} ${time}`;
  } else {
    model.value = today;
  }
};

// Установка текущего времени (только если включено)
const setCurrentTime = () => {
  if (props.withTime) {
    const currentTime = date.formatDate(new Date(), 'HH:mm');
    const datePart = internalDate.value || date.formatDate(new Date(), 'YYYY/MM/DD');
    model.value = `${datePart} ${currentTime}`;
  }
};
</script>
