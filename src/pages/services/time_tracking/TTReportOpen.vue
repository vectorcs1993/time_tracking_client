<template>
  <!-- Отчёт -->
  <q-table v-if="isAllowView(curentConfig)"
    :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer`" :title="description" square
    :dark="props.dark" dense flat :hide-header="rows.length === 0" :rows="rows" :columns="columns" row-key="id"
    virtual-scroll :loading="load" selection="single" v-model:selected="selected" color="orange"
    :hide-selected-banner="true" binary-state-sort :hide-pagination="false" v-model:pagination="pagination"
    separator="cell" :filter="inputFilter.search" :rows-per-page-options="[1]" wrap-cells grid-header
    no-data-label="Нет данных" @row-click="selectRow" @update:selected="updateSelect" style="height: max-content;">
    <template v-slot:top>
      <q-card-actions class="row full-width q-gutter-sm items-center">
        <Button icon="arrow_back" label="К отчётам" @click="router.push(`/reports`)" :dark="props.dark" />
        <div class="text-h6">
          {{ curentConfig.name }}
        </div>
        <q-space />
        <Button icon="sync" label="Обновить" color="green" @click="createReport" :dark="props.dark" />
        <InputDate label="от" with-time v-model="inputFilter.dateStart" :dark="props.dark"
          @update:model-value="updateInputFilter(createReport)" style="width: 200px;" />
        <InputDate label="до" with-time v-model="inputFilter.dateFinish" :dark="props.dark"
          @update:model-value="updateInputFilter(createReport)" style="width: 200px;" />
        <Button :dark="props.dark" label="Изменить" icon="edit"
          @click="() => router.push(`/configurations/report/${curentConfig.id}`)" />
      </q-card-actions>
    </template>
    <template v-slot:pagination>
      <div class="row q-gutter-sm items-center">
        <Button v-if="rows.length > 0" label="Экспорт" @click="exportReport" :dark="props.dark" />
        <div class="text-size">{{ returnSelectedInfo() }}</div>
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
        <div class="text-size fit" :style="`
    background-color: ${props.col.color_bg};
    color: ${authStore.getContrastColor(props.col.color_bg)};
  `">
          {{ props.value }}
        </div>
      </q-td>
    </template>
    <template v-slot:header-selection="props">
      <TTCheckbox v-model="props.selected" :dark="props.dark" />
    </template>
    <template v-slot:body-selection="props">
      <TTCheckbox v-model="props.selected" :dark="props.dark" />
    </template>
    <template v-slot:bottom-row="props">
      <q-tr v-if="total">
        <q-td style="border-top: 1px solid var(--text-color-dark);"></q-td>
        <q-td v-for="col in props.cols" :key="col" style="padding: 0px;">
          <div class="text-size row fit justify-center" style="border-top: 1px solid var(--text-color-dark);">
            {{ total[col.name] }}
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
  <div v-if="dataset.length > 0" class="row full-width justify-center">
    <TTChart class="fit" v-if="selected.length > 0 && chartDataIndividual.datasets.length > 0"
      :label="`График продуктивности ${selected[0].main}`" chartType="line" v-model:data="chartDataIndividual"
      :dark="props.dark">
      <template v-slot:actions>
        <InputSelect v-if="selected.length > 0" label="Тип построения данных" v-model="inputFilter.typeBuild"
          :options="types_builds" :dark="props.dark" style="width: 200px;" @update:model-value="() => {
            const prevSelect = selected[0];
            updateInputFilter(createReport(() => selectRow(null, prevSelect)));
          }" />
        <InputSelect v-if="selected.length > 0" label="Кол-во точек, шт" v-model="inputFilter.points"
          :options="types_points" :dark="props.dark" style="width: 150px;" @update:model-value="() => {
            const prevSelect = selected[0];
            updateInputFilter(createReport(() => selectRow(null, prevSelect)));
          }" />
      </template>
    </TTChart>
  </div>
  <div v-if="dataset.length > 0" class="row full-width justify-center">
    <TTChart v-if="chartDataMetricCount.datasets.length > 0" label="Показатель загрузки по количеству задач"
      chartType="bar" v-model:data="chartDataMetricCount" :dark="props.dark" />
    <TTChart v-if="chartDataMetricTime.datasets.length > 0" label="Показатель загрузки по временным метрикам"
      chartType="bar" v-model:data="chartDataMetricTime" :dark="props.dark" />
    <TTChart v-if="chartDataMetricCountBox.datasets.length > 0" label="Показатель загрузки по количеству продукции"
      chartType="bar" v-model:data="chartDataMetricCountBox" :dark="props.dark" />
  </div>
</template>
<script setup>
import {
  onMounted,
  ref,
  defineProps,
} from 'vue';
import { date } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import Button from 'src/components/InputButton.vue';
import InputDate from 'src/components/InputDate.vue';
import TTCheckbox from 'src/components/InputCheckbox.vue';
import moment from 'moment/moment';
import TTChart from './TTChart.vue';
import InputSelect from 'src/components/InputSelect.vue';

document.title = 'Отчёты';
const router = useRouter();
const route = useRoute();
const { id } = route.params;

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
const selected = ref([]);

const pagination = ref({
  rowsPerPage: 0,
});
const curentConfig = ref();
const types_points = [
  {
    id: 0,
    name: '7',
    val: 7,
  },
  {
    id: 1,
    name: '12',
    val: 12,
  },
  {
    id: 2,
    name: '30',
    val: 30,
  }
]
const types_builds = [
  {
    id: 0,
    name: 'Периодический',
    val: 'periodic',
  },
  {
    id: 1,
    name: 'Кумулятивный',
    val: 'cumulative',
  },
]
const inputFilter = ref({
  dateStart: moment().subtract(7, 'days').format('YYYY-MM-DD'),
  dateFinish: moment().format('YYYY-MM-DD'),
  points: types_points[0],
  typeBuild: types_builds[0],
});
function selectRow(event, row) {
  selected.value.length = 0;
  selected.value.push(row);
  updateSelect([row]);
}
function isAllowView(val) {
  try {
    return val.allow_view.find((b) => b === props.authStore.getUser.branch || props.authStore.isAdministrator);
  } catch {
    return false;
  }
}
const dataset = ref([]);
const chartDataIndividual = ref({
  labels: [],
  datasets: [],
});
const chartDataMetricCount = ref({
  labels: [],
  datasets: [],
});
const chartDataMetricTime = ref({
  labels: [],
  datasets: [],
});
const chartDataMetricCountBox = ref({
  labels: [],
  datasets: [],
});
function updateSelect(sel) {
  if (sel[0]) {
    const select = sel[0];
    const columnsIndividual = columns.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_COUNT && col.forChart);
    chartDataIndividual.value = {
      labels: dataset.value.map((ds, i) => { // Значения по оси X
        let val = ds.to;
        if (i === 0) val = ds.from;
        const parsedDate = new Date(val);
        return date.formatDate(parsedDate, 'HH:mm DD.MM.YYYY');
      }),
      datasets: columnsIndividual.map((ci) => {
        return {
          label: ci.label,
          data: dataset.value.map((ds) => {
            const rows = ds.data.rows.find((d) => d.id === select.id);
            return rows;
          }).map((ds) => ds[ci.name]),
          color: ci.color_bg || undefined,
        }
      })
    }
  } else {
    chartDataIndividual.value.datasets.length = 0;
    chartDataIndividual.value.labels.length = 0;
  }
}
function update(callback) {
  load.value = true;
  // извлечение конфигурации таблицы
  props.authStore.authorizedRequest('get', `reports/${id}`).then((respConf) => {
    const conf = respConf.data[0];
    conf.allow_view = JSON.parse(conf.allow_view);
    conf.filter_branches = JSON.parse(conf.filter_branches);
    conf.cols = JSON.parse(conf.cols);
    curentConfig.value = conf;
    load.value = false;
    if (callback) {
      if (typeof callback === 'function') {
        callback();
      }
    }
  });
}

function createReport(callback) {
  selected.value.length = 0;
  dataset.value.length = 0;
  rows.value.length = 0;
  total.value = undefined;
  load.value = true;
  props.authStore.authorizedRequest('get', `report_build?config=${curentConfig.value.id}&dS=${inputFilter.value.dateStart}&dF=${inputFilter.value.dateFinish}&type=${inputFilter.value.typeBuild.val}&points=${inputFilter.value.points.val}`).then((resp) => {
    const general = resp.data.find((ds) => ds.isGeneral === true);
    columns.value = general.data.columns;
    total.value = general.data.total;
    rows.value.push(...general.data.rows);
    dataset.value = resp.data.filter((ds) => !ds.isGeneral);
    console.log(dataset.value);

    load.value = false;
    chartDataMetricCount.value = {
      labels: rows.value.map((row) => row.main),
      datasets: columns.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_COUNT && col.forChart).map((col) => {
        return {
          label: col.label,
          data: rows.value.map((row) => {
            return row[col.name];
          }),
          color: col.color_bg || undefined,
        };
      }),
    }
    chartDataMetricTime.value = {
      labels: rows.value.map((row) => row.main),
      datasets: columns.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_TIME && col.forChart).map((col) => {
        return {
          label: col.label,
          data: rows.value.map((row) => {
            return row[col.name];
          }),
          color: col.color_bg || undefined,
        };
      }),
    }
    chartDataMetricCountBox.value = {
      labels: rows.value.map((row) => row.main),
      datasets: columns.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_COUNT_BOX && col.forChart).map((col) => {
        return {
          label: col.label,
          data: rows.value.map((row) => {
            return row[col.name];
          }),
          color: col.color_bg || undefined,
        };
      }),
    }
    if (callback) {
      if (typeof callback === 'function') {
        callback();
      }
    }
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
  localStorage.setItem('report_filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('report_filter_date_finish', inputFilter.value.dateFinish);
  localStorage.setItem('report_filter_points', inputFilter.value.points.id);
  selected.value.length = 0;
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
  if (localStorage.getItem('report_filter_points')) {
    inputFilter.value.points = types_points.find((tp) => tp.id === Number(localStorage.getItem('report_filter_points')));
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
