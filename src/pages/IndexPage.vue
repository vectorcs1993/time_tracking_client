<template>
  <q-page :class="`flex flex-center ${props.dark ? 'pp-dark' : 'pp-light'} fit`">
    <div class="row justify-center q-mb-xl">
      <div class="col-12 text-center">
        <h1 class="text-h2 text-weight-bold q-mb-md">Добро пожаловать в команду</h1>
        <p class="text-h6 q-mb-lg">Функциональный сервис для планирования задач* и учета рабочего времени</p>
        <p class="text-h6 q-mb-lg">
          Объединяйте команды, повышайте продуктивность и достигайте целей вместе!</p>
      </div>
    </div>
    <div v-if="props.authStore.isAuthenticated" class="row fit justify-center q-gutter-md">
      <div class="row fit justify-center text-h6">
        Начните работу:
      </div>
      <InputButton icon="co_present" label="Создать новый проект" @click="router.push('/projects')" />
      <InputButton icon="view_list" label="Заполнить таблицу" @click="router.push('/reports')" />
      <InputButton icon="insert_chart_outlined" label="Сформировать отчёт" @click="router.push('/reports')" />
    </div>
    <div v-else class="row fit justify-center q-gutter-md">
      <div class="row fit justify-center text-h6">
        Для начала авторизуйтесь:
      </div>
      <InputButton icon="person" label="Войти в систему" @click="router.push('/login')" />
    </div>
    <q-carousel class="row justify-center " animated v-model="slide" navigation infinite :autoplay="autoplay" arrows
      transition-prev="slide-right" transition-next="slide-left" @mouseenter="autoplay = false"
      @mouseleave="autoplay = true" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark"
      style="width: 50%;">
      <q-carousel-slide name="info1" class="column no-wrap flex-center">
        <q-icon name="gpp_good" size="96px" />
        <div class="q-mt-md text-center text-h4">
          Используем собственные разработки по максимуму
        </div>
      </q-carousel-slide>
      <q-carousel-slide flat name="info2" class="column no-wrap flex-center">
        <q-icon name="emoji_people" size="96px" />
        <div class="text-center text-h4">
          Стремимся к простоте и удобству
        </div>
      </q-carousel-slide>
      <q-carousel-slide name="info3" class="column no-wrap flex-center">
        <q-icon name="hub" size="96px" />
        <div class="q-mt-md text-center text-h4">
          Храним данные в одном месте
        </div>
      </q-carousel-slide>
      <q-carousel-slide flat name="info4" class="column no-wrap flex-center">
        <q-icon name="admin_panel_settings" size="96px" />
        <div class="q-mt-md text-center text-h4">
          Ценим конфиденциальность пользователей
        </div>
      </q-carousel-slide>
      <q-carousel-slide flat name="info5" class="column no-wrap flex-center">
        <q-icon name="diversity_3" size="96px" />
        <div class="q-mt-md text-center text-h4">
          Стимулируем совместную работу
        </div>
      </q-carousel-slide>
      <q-carousel-slide flat name="info6" class="column no-wrap flex-center">
        <q-icon name="print" size="96px" />
        <div class="q-mt-md text-center text-h4">
          Формируем быстрые и детальные отчёты
        </div>
      </q-carousel-slide>
    </q-carousel>
    <div class="row full-width justify-center">
      <p class=" text-h10 q-mb-lg">* - функционал в процессе разработки</p>
    </div>

    <!-- Фон с анимированными иконками -->
    <div class="background-animation">
      <div v-for="icon in floatingIcons" :key="icon.id" class="floating-icon" :class="`icon-${icon.id}`">
        <q-icon :name="icon.name" :size="icon.size" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';
import InputButton from 'src/components/InputButton.vue';
import {
  ref,
  onMounted,
} from 'vue';

const props = defineProps({
  dark: Boolean,
  authStore: Object,
});

document.title = 'Главная';
const slide = ref('info1');
const autoplay = ref(true);
const router = useRouter();

// Данные для плавающих иконок с разными размерами
const floatingIcons = ref([
  { id: 1, name: 'assignment', size: '64px' },
  { id: 2, name: 'schedule', size: '48px' },
  { id: 3, name: 'task_alt', size: '72px' },
  { id: 4, name: 'groups', size: '56px' },
  { id: 5, name: 'bar_chart', size: '60px' },
  { id: 6, name: 'event_note', size: '52px' },
  { id: 7, name: 'checklist', size: '68px' },
  { id: 8, name: 'description', size: '44px' },
  { id: 9, name: 'work', size: '58px' },
  { id: 10, name: 'dashboard', size: '62px' },
  { id: 11, name: 'analytics', size: '54px' },
  { id: 12, name: 'trending_up', size: '46px' },
]);

onMounted(() => {
  slide.value = 'info1';
});
</script>

<style scoped>
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.floating-icon {
  position: absolute;
  opacity: 0.08;
  color: currentColor;
  animation: float 25s infinite linear;
  filter: blur(0.5px);
}

/* Увеличиваем непрозрачность для темной темы */
.pp-dark .floating-icon {
  opacity: 0.12;
}

/* Размещаем иконки в случайных местах с разной анимацией */
.icon-1 {
  top: 15%;
  left: 8%;
  animation-duration: 28s;
  animation-delay: 0s;
}

.icon-2 {
  top: 75%;
  left: 85%;
  animation-duration: 32s;
  animation-delay: 1s;
}

.icon-3 {
  top: 25%;
  left: 92%;
  animation-duration: 24s;
  animation-delay: 2s;
}

.icon-4 {
  top: 82%;
  left: 12%;
  animation-duration: 36s;
  animation-delay: 3s;
}

.icon-5 {
  top: 45%;
  left: 75%;
  animation-duration: 30s;
  animation-delay: 4s;
}

.icon-6 {
  top: 65%;
  left: 35%;
  animation-duration: 26s;
  animation-delay: 5s;
}

.icon-7 {
  top: 35%;
  left: 25%;
  animation-duration: 34s;
  animation-delay: 6s;
}

.icon-8 {
  top: 88%;
  left: 65%;
  animation-duration: 29s;
  animation-delay: 7s;
}

.icon-9 {
  top: 55%;
  left: 15%;
  animation-duration: 31s;
  animation-delay: 8s;
}

.icon-10 {
  top: 20%;
  left: 50%;
  animation-duration: 27s;
  animation-delay: 9s;
}

.icon-11 {
  top: 70%;
  left: 55%;
  animation-duration: 33s;
  animation-delay: 10s;
}

.icon-12 {
  top: 40%;
  left: 85%;
  animation-duration: 25s;
  animation-delay: 11s;
}

/* Улучшенная анимация парения */
@keyframes float {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }

  20% {
    transform: translate(30px, 40px) rotate(8deg) scale(1.05);
  }

  40% {
    transform: translate(60px, 10px) rotate(0deg) scale(1);
  }

  60% {
    transform: translate(20px, 50px) rotate(-6deg) scale(0.95);
  }

  80% {
    transform: translate(40px, 20px) rotate(4deg) scale(1.02);
  }

  100% {
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
}

/* Добавляем дополнительную анимацию для некоторых иконок */
.icon-1,
.icon-4,
.icon-7,
.icon-10 {
  animation: float 25s infinite ease-in-out;
}

.icon-2,
.icon-5,
.icon-8,
.icon-11 {
  animation: float 30s infinite linear;
}

.icon-3,
.icon-6,
.icon-9,
.icon-12 {
  animation: float 22s infinite ease-in-out;
}

/* Адаптивность - уменьшаем размер иконок на мобильных устройствах */
@media (max-width: 768px) {
  .floating-icon {
    opacity: 0.05;
  }

  .pp-dark .floating-icon {
    opacity: 0.08;
  }

  /* Уменьшаем размер иконок через !important чтобы перебить inline стиль */
  .floating-icon :deep(svg) {
    width: 40px !important;
    height: 40px !important;
  }
}

/* Для очень маленьких экранов скрываем часть иконок */
@media (max-width: 480px) {

  .icon-3,
  .icon-6,
  .icon-9,
  .icon-12 {
    display: none;
  }
}
</style>
