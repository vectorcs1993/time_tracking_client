<template>
  <q-page :class="`${props.dark ? 'pp-dark' : 'pp-light'} fit`">
    <div id="tabs_button" class="row wrap q-pa-sm">
      <PPTab v-model="tab" @update:model-value="selectTabs" :dark="props.dark">
        <q-tab name="timeTrackingTable">
          Таблицы
        </q-tab>
        <q-tab name="timeTrackingReport">
          Отчёты
        </q-tab>
        <q-tab name="timeTrackingProjects">
          Список проектов
        </q-tab>
        <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingSources">
          Источники поступления
        </q-tab>
        <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingActivity">
          Целевые объекты
        </q-tab>
        <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingSettingConfig">
          Настройки таблиц
        </q-tab>
        <q-tab v-if="isPermissionsCreateConfig" name="timeTrackingSettingReport">
          Настройки отчётов
        </q-tab>
      </PPTab>
    </div>
    <q-tab-panels v-model="tab" keep-alive :class="`row fit q-pl-sm ${props.dark ? 'pp-dark' : 'pp-light'}`">
      <q-tab-panel class="q-pa-none fit text-size" name="timeTrackingTable">
        <Table :show-confirm="showConfirm" :show-info="showInfo" :content-height="contentHeight" :dark="props.dark" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingReport">
        <Report :show-confirm="showConfirm" :show-info="showInfo" :content-height="contentHeight" :dark="props.dark" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingProjects">
        <Projects :show-confirm="showConfirm" :dark="props.dark" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingActivity">
        <Activities :show-confirm="showConfirm" :dark="props.dark" />
      </q-tab-panel>
      <q-tab-panel class="q-pa-none fit" name="timeTrackingSources">
        <Sources :show-confirm="showConfirm" :dark="props.dark" />
      </q-tab-panel>
      <q-tab-panel v-if="isPermissionsCreateConfig" class="q-pa-none fit" name="timeTrackingSettingConfig">
        <Configs :show-confirm="showConfirm" :dark="props.dark" />
      </q-tab-panel>
      <q-tab-panel v-if="isPermissionsCreateConfig" class="q-pa-none fit" name="timeTrackingSettingReport">
        <Reports :show-confirm="showConfirm" :dark="props.dark" />
      </q-tab-panel>
    </q-tab-panels>
    <!-- <q-inner-loading :showing="load" size="50px" style="z-index: 99;" /> -->
  </q-page>
</template>

<script setup>
import {
  ref,
  inject,
  defineProps,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import Table from 'src/pages/services/time_tracking/table_tab.vue';
import Projects from 'src/pages/services/time_tracking/projects_tab.vue';
import Sources from 'src/pages/services/time_tracking/sources_tab.vue';
import Activities from 'src/pages/services/time_tracking/activities_tab.vue';
import Report from 'src/pages/services/time_tracking/report_tab.vue';
import Configs from 'src/pages/services/time_tracking/settings_tables.vue';
import Reports from 'src/pages/services/time_tracking/settings_reports.vue';
import PPTab from 'src/components/tabs/PPTab.vue';

document.title = 'Учёт рабочего времени';

const {
  currentUser, isPermissions
} = inject('store');

const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  calculateHeader: Function,
  dark: Boolean,
});
const isPermissionsCreateConfig = !isPermissions('createConfig');

const tab = ref('timeTrackingTable');

const contentHeight = ref(0);
const calculateRemainingHeight = () => {
  const tabs_button = document.getElementById('tabs_button');
  if (tabs_button) {
    contentHeight.value = document.body.scrollHeight - props.calculateHeader() - (tabs_button.offsetHeight || 0);
  }
};
function selectTabs(val) {
  localStorage.setItem('time_tr_tabs', val);
}
onMounted(() => {
  calculateRemainingHeight();
  console.log(currentUser())
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateRemainingHeight);
});
</script>
