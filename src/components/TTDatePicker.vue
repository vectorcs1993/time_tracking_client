<template>
  <div class="pp-cell-wrapper text-size" :class="props.inputClass">
    <div
      :class="[cell ? 'pp-date-trigger' : 'pp-date-trigger-regular', props.dark ? 'pp-dark' : 'pp-light', { 'pp-disabled': disable }]"
      @click="toggleDatePicker">
      <div v-if="props.label" style="font-size: xx-small;">{{ props.label }}</div>
      <div class="pp-date-text">{{ formattedDate }}</div>
    </div>

    <div v-if="isOpen" class="pp-date-picker" :class="[props.dark ? 'pp-dark-options' : 'pp-light-options']">
      <div class="pp-date-picker-header">
        <button class="pp-date-nav-button" @click="prevMonth">‹</button>
        <span class="pp-date-current-month">{{ currentMonthYear }}</span>
        <button class="pp-date-nav-button" @click="nextMonth">›</button>
      </div>

      <div class="pp-date-picker-grid">
        <div class="pp-date-day-header" v-for="day in dayHeaders" :key="day">{{ day }}</div>
        <div v-for="day in calendarDays" :key="day.date" class="pp-date-calendar-day" :class="{
          'pp-date-calendar-day--selected': isDaySelected(day.date),
          'pp-date-calendar-day--pp-date-current-month': day.isCurrentMonth,
          'pp-date-calendar-day--today': isToday(day.date)
        }" @click="selectDate(day.date)">
          {{ day.day }}
        </div>
      </div>

      <div class="pp-date-picker-actions">
        <PPBtn @click="selectToday" label="Сегодня" :dark="props.dark" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { dropdownManager } from './dropdownManager.js';
import PPBtn from './TTBtn.vue';

const props = defineProps({
  dark: Boolean,
  update: Function,
  label: String,
  inputClass: String,
  cell: {
    type: Boolean,
    default: false,
  },
});

const model = defineModel();
const disable = defineModel('disable', {
  type: Boolean,
  default: false,
});
const isOpen = ref(false);
const currentDate = ref(new Date());

// Исправленная функция для создания даты без проблем с часовыми поясами
const parseDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Исправленная функция для форматирования даты в YYYY-MM-DD
const formatDate = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Вычисляем selectedDate на основе model с правильным парсингом
const selectedDate = computed(() => {
  return model.value ? parseDate(model.value) : null;
});

const formattedDate = computed(() => {
  if (!selectedDate.value || isNaN(selectedDate.value.getTime())) return 'Выберите дату';
  return selectedDate.value.toLocaleDateString('ru-RU');
});

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric'
  });
});

const dayHeaders = computed(() => {
  return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const days = [];

  // Дни предыдущего месяца
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }

  // Дни текущего месяца
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      day: i,
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Дни следующего месяца
  const totalCells = 42;
  const nextMonthDays = totalCells - days.length;
  for (let i = 1; i <= nextMonthDays; i++) {
    days.push({
      day: i,
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  return days;
});

const isDaySelected = (date) => {
  if (!selectedDate.value) return false;
  return date.toDateString() === selectedDate.value.toDateString();
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const closeDatePicker = () => {
  isOpen.value = false;
  dropdownManager.removeCurrent({ close: closeDatePicker });
};

const toggleDatePicker = () => {
  if (disable.value) return;
  if (isOpen.value) {
    closeDatePicker();
  } else {
    dropdownManager.setCurrent({ close: closeDatePicker });
    isOpen.value = true;
  }
};

const selectDate = (date) => {
  if (disable.value) return;
  // Используем нашу функцию форматирования чтобы избежать проблем с часовыми поясами
  model.value = formatDate(date);
  // Обновляем currentDate на выбранную дату
  currentDate.value = new Date(date.getFullYear(), date.getMonth(), 1);
  closeDatePicker();

  if (props.update) {
    props.update(model.value);
  }
};
const selectToday = () => {
  const today = new Date();
  selectDate(today);
};

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

// Следим за изменением model извне
watch(model, (newValue) => {
  if (newValue) {
    const date = parseDate(newValue);
    if (!isNaN(date.getTime())) {
      currentDate.value = new Date(date.getFullYear(), date.getMonth(), 1);
    }
  } else {
    // Если дата очищена, показываем текущий месяц
    currentDate.value = new Date();
  }
});

// Закрытие при клике вне компонента
const handleClickOutside = (event) => {
  if (!event.target.closest('.pp-cell-wrapper')) {
    closeDatePicker();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);

  // Устанавливаем currentDate из модели при монтировании
  if (model.value) {
    const date = parseDate(model.value);
    if (!isNaN(date.getTime())) {
      currentDate.value = new Date(date.getFullYear(), date.getMonth(), 1);
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  dropdownManager.removeCurrent({ close: closeDatePicker });
});
</script>
