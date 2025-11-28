<template>
  <div style="height: 95vh;">
    <div :class="`${dark ? 'pp-dark' : 'pp-light'} row justify-between items-center`">
      <!-- Текущий отчёт -->
      <Tab v-model="tabConf" :tabs="configs.map(conf => ({ id: `conf${conf.id}`, name: conf.name }))" :dark="props.dark"
        @update:model-value="() => {
          load = true;
          updateInputFilter(() => createReport());
        }" />
    </div>
    <!-- Таблица с отчётом -->
    <q-table v-if="isAllowView(curentConfig)"
      :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer`" :title="description" square
      :dark="props.dark" dense flat :hide-header="rows.length === 0" :rows="rows" :columns="columns" row-key="id"
      virtual-scroll :loading="load" color="orange" :hide-selected-banner="true" binary-state-sort
      :hide-pagination="false" v-model:pagination="pagination" separator="cell" :filter="inputFilter.search"
      :rows-per-page-options="[1]" wrap-cells grid-header no-data-label="Нет данных" style="height: 95%;">
      <template v-slot:top>
        <q-card-actions class="row full-width q-gutter-sm items-center">
          <Button icon="sync" label="Обновить" color="green" @click="createReport" :dark="props.dark" />
          <InputDate label="от" v-model="inputFilter.dateStart" :dark="props.dark"
            @update:model-value="updateInputFilter" style="width: 200px;" />
          <InputDate label="до" v-model="inputFilter.dateFinish" :dark="props.dark"
            @update:model-value="updateInputFilter" style="width: 200px;" />
          <q-space />
        </q-card-actions>
      </template>
      <template v-slot:pagination>
        <div class="row q-gutter-sm items-center">
          <div class="text-size">{{ returnSelectedInfo() }}</div>
          <Button v-if="rows.length > 0" label="Экспорт" @click="exportReport" :dark="props.dark" />
        </div>
      </template>
      <template v-slot:header-cell="props">
        <q-th :props="props">
          <div class="text-size fit" :style="props.col.headerStyle ? props.col.headerStyle : ''">{{ props.col.label }}
          </div>
        </q-th>
      </template>
      <template v-slot:body-cell="props">
        <q-td :props="props" style="padding: 0;">
          <div class="text-size fit" :style="props.row.style ? props.row.style : ''">
            {{ props.value }}
          </div>
        </q-td>
      </template>
      <template v-slot:bottom-row="props">
        <q-tr v-if="total && (inputFilter.search === null || inputFilter.search === '')">
          <q-td v-for="col in props.cols" :key="col" style="padding: 0px;">
            <div class="text-size row fit justify-center" style="border-top: 1px solid var(--text-color-dark);">
              {{ total[col.name] }}
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>
<script setup>
import {
  onMounted,
  ref,
  defineProps,
} from 'vue';
import Button from 'src/components/InputButton.vue';
import InputDate from 'src/components/InputDate.vue';
import moment from 'moment/moment';
import Tab from 'src/components/TTTab.vue';
import { getObject } from 'src/pages/services/time_tracking/fun.js';


document.title = 'Отчёты';
const props = defineProps({
  showInfo: Function,
  contentHeight: Number,
  dark: Boolean,
  authStore: Object,
});

const columns = ref([]);
const rows = ref([]);
const total = ref({});
const description = ref('');
const users = ref([]);
const branches = ref([]);
const load = ref(false);

const pagination = ref({
  rowsPerPage: 0,
});
const tabConf = ref();
const configs = ref([]);
const curentConfig = ref();
const inputFilter = ref({
  dateStart: moment().subtract(7, 'days').format('YYYY-MM-DD'),
  dateFinish: moment().format('YYYY-MM-DD'),
  search: '',
});
function isAllowView(val) {
  try {
    return val.allow_view.find((b) => b === 7); // currentUser().branch
  } catch {
    return false;
  }
}
function update(callback) {
  load.value = true;
  // извлечение конфигурации таблицы
  configs.value.length = 0;
  props.authStore.authorizedRequest('get', `all_reports`).then((respC) => {
    respC.data.sort((a, b) => (a.name < b.name ? -1 : 1)).forEach((conf) => {
      conf.allow_view = JSON.parse(conf.allow_view);
      conf.filter_branches = JSON.parse(conf.filter_branches);
      if (isAllowView(conf)) {
        configs.value.push(conf);
      }
    });
    curentConfig.value = getObject(configs.value, Number(localStorage.getItem('report_time_traking')));
    if (!curentConfig.value) {
      [curentConfig.value] = configs.value;
    }
    tabConf.value = `conf${curentConfig.value.id}`;

    load.value = false;
    if (callback) {
      if (typeof callback === 'function') {
        callback();
      }
    }
  });
}
function createReport() {
  rows.value.length = 0;
  total.value = undefined;
  load.value = true;
  props.authStore.authorizedRequest('get', `report?config=${curentConfig.value.id}&dS=${inputFilter.value.dateStart}&dF=${inputFilter.value.dateFinish}`).then((resp) => {
    console.log(resp);
    columns.value = resp.data.columns;
    total.value = resp.data.total;
    rows.value.push(...resp.data.rows);
    load.value = false;
  }).catch((err) => {
    console.log(err);
    props.showInfo(err);
  });
}
function exportReport() {
  const data = {
    dateStart: inputFilter.value.dateStart,
    dateFinish: inputFilter.value.dateFinish,
    columns: columns.value,
    rows: [...rows.value, total.value],
    prefix: 'report',
  };
  props.authStore.downloadExcel('export/excel', data).catch((err) => {
    console.log(err);
  });
}
function updateInputFilter(callback) {
  localStorage.setItem('report_time_traking', Number(tabConf.value.substr(4)));
  localStorage.setItem('report_filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('report_filter_date_finish', inputFilter.value.dateFinish);
  rows.value.length = 0;
  total.value = undefined;
  update(callback);
}
function returnSelectedInfo() {
  return `Всего объектов: ${rows.value.length}`;
}
onMounted(() => {
  if (localStorage.getItem('report_filter_date_start')) {
    inputFilter.value.dateStart = localStorage.getItem('report_filter_date_start');
  }
  if (localStorage.getItem('report_filter_date_finish')) {
    inputFilter.value.dateFinish = localStorage.getItem('report_filter_date_finish');
  }
  branches.value.length = 0;
  props.authStore.authorizedRequest('get', `branches`).then((respB) => {
    branches.value.push(...respB.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
    users.value.length = 0;
    props.authStore.authorizedRequest('get', `users`).then((respU) => {
      users.value.push(...respU.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
      update(createReport);
    });
  });
});
</script>
