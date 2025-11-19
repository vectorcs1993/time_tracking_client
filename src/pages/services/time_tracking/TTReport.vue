<template>
  <div :style="`width: 100%; height: ${props.contentHeight}px;`">
    <div :class="`${dark ? 'pp-dark' : 'pp-light'} row justify-between items-center`">
      <!-- Текущий отчёт -->
      <Tab v-model="tabConf" :tabs="configs.map(conf => ({ id: `conf${conf.id}`, name: conf.name }))" :dark="props.dark"
        @update:model-value="() => {
          load = true;
          updateInputFilter();
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
        <q-card-actions class="row full-width items-center">
          <div class="row items-center">
            от
            <q-input class="q-ma-sm text-size" type="date" :dark="props.dark" dense square
              :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" v-model="inputFilter.dateStart"
              @update:model-value="updateInputFilter" />
            до
            <q-input class="q-ma-sm text-size" type="date" :dark="props.dark" dense square
              :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`"
              v-model="inputFilter.dateFinish" @update:model-value="updateInputFilter" />
          </div>
          <PPBtn label="Сформировать" color="green" :click="createReportV2" :dark="props.dark" />
          <PPBtn v-if="rows.length > 0" label="Экспорт в EXCEL" :click="exportReport" :dark="props.dark" />
          <q-space />
          <!-- Поиск -->
          <PPSearchInput v-model="inputFilter.search" :dark="props.dark" />
        </q-card-actions>
      </template>
      <template v-slot:pagination>
        {{ returnSelectedInfo() }}
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
          <q-td v-for="col in props.cols" :key="col" :style="total.style">
            {{ total[col.name] }}
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
import PPBtn from 'src/components/TTBtn.vue';
import moment from 'moment/moment';
import Tab from 'src/components/TTTab.vue';
import PPSearchInput from 'src/components/inputs/PPSearchInput.vue';
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
const description = ref('1212');
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
function createReportV2() {
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
// function exportReport() {
//   const data = { columns: columns.value, rows: rows.value };
//   axios({
//     url: `${host()}/services/time_tracking_report_excel`,
//     method: 'POST',
//     responseType: 'blob',
//     data,
//   }).then((response) => {
//     const fileURL = window.URL.createObjectURL(
//       new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
//     );
//     const fileLink = document.createElement('a');
//     fileLink.href = fileURL;
//     fileLink.setAttribute('download', `Отчёт_${curentConfig.value.name}.xlsx`);
//     document.body.appendChild(fileLink);
//     fileLink.click();
//   }).catch((err) => {
//     console.log(err);

//     props.showInfo(err);
//   });
// }
function updateInputFilter() {
  localStorage.setItem('report_time_traking', Number(tabConf.value.substr(4)));
  localStorage.setItem('report_filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('report_filter_date_finish', inputFilter.value.dateFinish);
  rows.value.length = 0;
  total.value = undefined;
  update();
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
      update();
    });
  });
});
</script>
