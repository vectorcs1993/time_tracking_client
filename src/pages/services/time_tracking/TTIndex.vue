<template>
  <q-page :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fit q-pa-xs`">

    <PPTab vertical v-model="tab" @update:model-value="selectTabs" :dark="props.dark">
      <q-tab name="timeTrackingTable">
        ТБ
        <TTTooltip :dark="props.dark">Таблицы</TTTooltip>
      </q-tab>
      <q-tab name="timeTrackingReport">
        ОТ
        <TTTooltip :dark="props.dark">Отчёты</TTTooltip>
      </q-tab>
      <q-tab name="timeTrackingProjects">
        ПР
        <TTTooltip :dark="props.dark">Управление проектами</TTTooltip>
      </q-tab>
      <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingSources">
        ИП
        <TTTooltip :dark="props.dark">Управление источниками поступлений</TTTooltip>
      </q-tab>
      <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingActivity">
        ЦО
        <TTTooltip :dark="props.dark">Управление активностями</TTTooltip>
      </q-tab>
      <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingSettingConfig">
        ТН
        <TTTooltip :dark="props.dark">Конфигурации таблиц</TTTooltip>
      </q-tab>
      <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingSettingReport">
        ОН
        <TTTooltip :dark="props.dark">Конфигурации отчётов</TTTooltip>
      </q-tab>
    </PPTab>

    <q-tab-panels v-model="tab" keep-alive :class="`col fit q-pl-xs ${props.dark ? 'pp-dark' : 'pp-light'}`">
      <q-tab-panel class="q-pa-none fit text-size" name="timeTrackingTable">
        <Table :show-confirm="showConfirm" :show-info="showInfo" :show-error="showError" :content-height="contentHeight"
          :dark="props.dark" :authStore="props.authStore" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingReport">
        <Report :show-confirm="showConfirm" :show-info="showInfo" :show-error="showError"
          :content-height="contentHeight" :dark="props.dark" :authStore="props.authStore" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingProjects">
        <Projects :show-confirm="showConfirm" :show-error="showError" :dark="props.dark" :authStore="props.authStore"
          :content-height="contentHeight" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingActivity">
        <Activities :show-confirm="showConfirm" :show-error="showError" :dark="props.dark" :authStore="props.authStore"
          :content-height="contentHeight" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingSources">
        <Sources :show-confirm="showConfirm" :show-error="showError" :dark="props.dark" :authStore="props.authStore"
          :content-height="contentHeight" />
      </q-tab-panel>
      <q-tab-panel v-if="isPermissionsCreateConfig" class="q-pa-none fit" name="timeTrackingSettingConfig">
        <TableSettings :show-confirm="showConfirm" :show-error="showError" :dark="props.dark"
          :authStore="props.authStore" :content-height="contentHeight" />
      </q-tab-panel>
      <q-tab-panel v-if="isPermissionsCreateConfig" class="q-pa-none fit" name="timeTrackingSettingReport">
        <Reports :show-confirm="showConfirm" :show-error="showError" :dark="props.dark" :authStore="props.authStore"
          :content-height="contentHeight" />
      </q-tab-panel>
    </q-tab-panels>
    <!-- <q-inner-loading :showing="load" size="50px" style="z-index: 99;" /> -->
  </q-page>
</template>

<script setup>
import {
  ref,
  defineProps,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue';
import TTTooltip from 'src/components/TTTooltip.vue';
import Table from './TTTable.vue';
import Projects from 'src/pages/services/time_tracking/TTProjects.vue';
import Sources from 'src/pages/services/time_tracking/TTSources.vue';
import Activities from 'src/pages/services/time_tracking/TTActivities.vue';
import Report from 'src/pages/services/time_tracking/TTReport.vue';
import TableSettings from 'src/pages/services/time_tracking/TTTableSettings.vue';
// import Reports from 'src/pages/services/time_tracking/settings_reports.vue';
import PPTab from 'src/components/PPTab.vue';

document.title = 'Учёт рабочего времени';

const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  calculateHeader: Function,
  dark: Boolean,
  authStore: Object,
});
const isPermissionsCreateConfig = true;

const tab = ref('timeTrackingTable');
const zoomLevel = ref(100);
const contentHeight = ref(0);
let resizeTimeout = null;

const calculateRemainingHeight = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    // Вместо отслеживания масштаба - просто используем актуальные размеры
    const headerHeight = props.calculateHeader();
    const availableHeight = window.innerHeight - headerHeight - 10; // 10px для отступов

    contentHeight.value = availableHeight;

    console.log('Высота контента:', contentHeight.value, 'px');
  }, 100);
};

function selectTabs(val) {
  localStorage.setItem('time_tr_tabs', val);
}
watch(zoomLevel, (newVal) => {
  console.log('Масштаб изменен:', newVal + '%')
})

onMounted(() => {
  window.addEventListener('resize', calculateRemainingHeight);
  calculateRemainingHeight();
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateRemainingHeight);
  if (resizeTimeout) clearTimeout(resizeTimeout);
});
</script>
