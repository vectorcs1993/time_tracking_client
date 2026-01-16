<template>
  <!-- Отчёт -->
  <q-table v-if="isAllowView(curentConfig)"
    :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer`" :title="description" square
    :dark="props.dark" dense flat :hide-header="rows.length === 0" :rows="rows" :columns="columns" row-key="id"
    virtual-scroll :loading="load" selection="single" v-model:selected="selected"
    :color="`${props.dark ? 'orange' : 'green'}`" :hide-selected-banner="true" binary-state-sort
    :hide-pagination="false" v-model:pagination="pagination" separator="cell" :filter="inputFilter.search"
    :rows-per-page-options="[1]" wrap-cells grid-header no-data-label="Нет данных" @row-click="selectRow"
    @update:selected="updateSelect" style="height: max-content;">
    <template v-slot:top>
      <q-card-actions class="row full-width q-gutter-sm items-center">
        <Button icon="arrow_back" label="К отчётам" @click="router.push(`/reports`)" :dark="props.dark" />
        <slot name="favorite" />
        <div class="text-h6">
          {{ curentConfig.name }}
        </div>
        <q-space />
        <Button icon="sync" label="Обновить" color="green" @click="createReport" :dark="props.dark" />
        <!-- Фильтр период -->
        <InputSelect label="Период" :options="props.authStore.getTypesPeriod" v-model="inputFilter.period"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 250px;" />
        <InputDate label="от" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateStart" :dark="props.dark"
          @update:model-value="updateInputFilter" style="width: 200px;" />
        <InputDate label="до" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateFinish" :dark="props.dark"
          @update:model-value="updateInputFilter" style="width: 200px;" />
        <TTCheckbox
          :disable="inputFilter.dateStart === 'null' || !inputFilter.dateStart || inputFilter.dateFinish === 'null' || !inputFilter.dateFinish"
          label="Предыдущий период" v-model="inputFilter.previous" @update:model-value="updateInputFilter"
          :dark="props.dark">
          <TTTooltip>
            В отчёт добавятся дополнительные колонки с данными предшествующему
            периоду, данные колонки будут помечены символом - "*"
          </TTTooltip>
        </TTCheckbox>
        <TTCheckbox label="Пустые строки" v-model="inputFilter.allData" @update:model-value="updateInputFilter"
          :dark="props.dark">
          <TTTooltip>
            Показывать все строки, даже с полностью нулевыми значениями
          </TTTooltip>
        </TTCheckbox>
        <Button v-if="props.authStore.isAdministrator" :dark="props.dark" label="Изменить" icon="edit"
          @click="() => router.push(`/configurations/report/${curentConfig.id}`)" />
      </q-card-actions>
    </template>
    <template v-slot:pagination>
      <div class="row q-gutter-sm items-center">
        <InputSelect v-if="selected.length > 0" label="Тип построения данных" v-model="inputFilter.typeBuild"
          :options="types_builds" :dark="props.dark" style="width: 200px;" @update:model-value="() => {
            const prevSelect = selected[0];
            updateInputFilter();
          }" />
        <InputSelect v-if="selected.length > 0" label="Кол-во точек, шт" v-model="inputFilter.points"
          :options="types_points" :dark="props.dark" style="width: 150px;" @update:model-value="() => {
            const prevSelect = selected[0];
            updateInputFilter();
          }" />
        <Button v-if="rows.length > 0" icon="file_download" label="Экспорт" @click="exportReport" :dark="props.dark" />
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
        <div class="text-size fit"
          :style="` background-color: ${props.col.color_bg}; color: ${authStore.getContrastColor(props.col.color_bg)};`">
          {{ props.value }}
        </div>
      </q-td>
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
  <q-card-section v-else class="row q-gutter-xs full-width items-center">
    <Button icon="arrow_back" @click="router.push(`/reports`)" :dark="props.dark" />
    <div class="text-h6">
      Нет доступа или конфигурация не найдена
    </div>
  </q-card-section>
  <div>
    <div class="row full-width justify-center">
      <TTChart class="col" v-if="chartDataMetricCount.datasets.length > 0"
        label="Показатель продуктивности по количеству задач" chartType="bar" v-model:data="chartDataMetricCount"
        yAxisUnit="шт" :dark="props.dark" />
      <TTChart class="col" v-if="selected.length > 0 && chartDataIndividualCount.datasets.length > 0"
        :label="`График продуктивности по количеству задач ${selected[0].main}`" chartType="line" yAxisUnit="шт"
        v-model:data="chartDataIndividualCount" :dark="props.dark">
        <template v-slot:actions>
        </template>
      </TTChart>
    </div>
    <div class="row full-width justify-center">
      <TTChart class="col" v-if="chartDataMetricTime.datasets.length > 0"
        label="Показатель загрузки по временным метрикам" chartType="bar" v-model:data="chartDataMetricTime"
        yAxisUnit="ч" :dark="props.dark" />
      <TTChart class="col" v-if="selected.length > 0 && chartDataIndividualTime.datasets.length > 0"
        :label="`График загрузки по временным метрикам ${selected[0].main}`" chartType="line" yAxisUnit="ч"
        v-model:data="chartDataIndividualTime" :dark="props.dark">
        <template v-slot:actions>
        </template>
      </TTChart>
    </div>
    <div class="row full-width justify-center">
      <TTChart class="col" v-if="chartDataMetricCountBox.datasets.length > 0" label="Показатель количества продукции"
        yAxisUnit="шт" chartType="bar" v-model:data="chartDataMetricCountBox" :dark="props.dark" />
      <TTChart class="col" v-if="selected.length > 0 && chartDataIndividualCountBox.datasets.length > 0"
        :label="`График по количеству продукции ${selected[0].main}`" chartType="line" yAxisUnit="шт"
        v-model:data="chartDataIndividualCountBox" :dark="props.dark">
        <template v-slot:actions>
        </template>
      </TTChart>
    </div>
  </div>
</template>
<script setup>
import {
  onMounted,
  ref,
} from 'vue';
import { date } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import Button from 'src/components/InputButton.vue';
import InputDate from 'src/components/InputDate.vue';
import TTCheckbox from 'src/components/InputCheckbox.vue';
import moment from 'moment/moment';
import TTChart from '../../../components/TTChart.vue';
import InputSelect from 'src/components/InputSelect.vue';
import TTTooltip from 'src/components/TTTooltip.vue';

document.title = 'Отчёты';
const router = useRouter();
const route = useRoute();
const { id } = route.params;

const props = defineProps({
  showInfo: Function,
  showError: Function,
  showConfirm: Function,
  dark: Boolean,
  authStore: Object,
});

const columns = ref([]);
const columnsOriginal = ref([]);
const rows = ref([]);
const total = ref({});
const description = ref('');
const users = ref([]);
const branches = ref([]);
const load = ref(false);
const selected = ref([]);
const isCreateReportInProgress = ref(false);
const pagination = ref({
  rowsPerPage: 0,
});
const curentConfig = ref();
const types_points = [
  {
    id: 0,
    name: '5',
    val: 5,
  },
  {
    id: 1,
    name: '7',
    val: 7,
  },
  {
    id: 2,
    name: '12',
    val: 12,
  },
  {
    id: 3,
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
  period: props.authStore.getTypesPeriod[0],
  dateStart: moment().subtract(7, 'days').format('YYYY-MM-DD'),
  dateFinish: moment().format('YYYY-MM-DD'),
  points: types_points[0],
  typeBuild: types_builds[0],
  previous: false,
  allData: false,
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
const chartDataIndividualCount = ref({
  labels: [],
  datasets: [],
});

const chartDataIndividualTime = ref({
  labels: [],
  datasets: [],
});

const chartDataIndividualCountBox = ref({
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
    props.authStore.authorizedRequest('get', `report_timeline_build?config=${curentConfig.value.id}&dS=${inputFilter.value.dateStart}&dF=${inputFilter.value.dateFinish}&type=${inputFilter.value.typeBuild.val}&points=${inputFilter.value.points.val}`).then((respDS) => {
      dataset.value.length = 0;
      dataset.value.push(...respDS.data);
      chartDataIndividualCount.value = {
        labels: dataset.value.map((ds, i) => { // Значения по оси X
          let val = ds.to;
          if (i === 0) val = ds.from;
          const parsedDate = new Date(val);
          return date.formatDate(parsedDate, 'HH:mm DD.MM.YYYY');
        }),
        datasets: columnsOriginal.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_COUNT && col.forChart).map((ci) => {
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

      chartDataIndividualTime.value = {
        labels: dataset.value.map((ds, i) => { // Значения по оси X
          let val = ds.to;
          if (i === 0) val = ds.from;
          const parsedDate = new Date(val);
          return date.formatDate(parsedDate, 'HH:mm DD.MM.YYYY');
        }),
        datasets: columnsOriginal.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_TIME && col.forChart).map((ci) => {
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

      chartDataIndividualCountBox.value = {
        labels: dataset.value.map((ds, i) => { // Значения по оси X
          let val = ds.to;
          if (i === 0) val = ds.from;
          const parsedDate = new Date(val);
          return date.formatDate(parsedDate, 'HH:mm DD.MM.YYYY');
        }),
        datasets: columnsOriginal.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_COUNT_BOX && col.forChart).map((ci) => {
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
    });
  } else {
    chartDataIndividualCount.value.datasets.length = 0;
    chartDataIndividualCount.value.labels.length = 0;
    chartDataIndividualTime.value.datasets.length = 0;
    chartDataIndividualTime.value.labels.length = 0;
    chartDataIndividualCountBox.value.datasets.length = 0;
    chartDataIndividualCountBox.value.labels.length = 0;
  }
}
function update(callback) {
  load.value = true;
  if (localStorage.getItem('report_filter_period')) {
    inputFilter.value.period = props.authStore.getTypesPeriod.find((tp) => tp.id === props.authStore.getItem('report_filter_period'));
    if (!inputFilter.value.period) {
      [inputFilter.value.period] = props.authStore.getTypesPeriod;
    }
  }
  if (localStorage.getItem('report_filter_date_start')) {
    inputFilter.value.dateStart = localStorage.getItem('report_filter_date_start');
  }
  if (localStorage.getItem('report_filter_date_finish')) {
    inputFilter.value.dateFinish = localStorage.getItem('report_filter_date_finish');
  }
  if (localStorage.getItem('report_filter_points')) {
    inputFilter.value.points = types_points.find((tp) => tp.id === Number(localStorage.getItem('report_filter_points')));
  }
  if (localStorage.getItem('report_filter_previous')) {
    inputFilter.value.previous = localStorage.getItem('report_filter_previous') === 'true';
  }
  if (localStorage.getItem('report_filter_all_data')) {
    inputFilter.value.allData = localStorage.getItem('report_filter_all_data') === 'true';
  }
  // извлечение конфигурации таблицы
  props.authStore.authorizedRequest('get', `reports/${id}`).then((respConf) => {
    const conf = respConf.data[0];
    conf.allow_view = JSON.parse(conf.allow_view);
    conf.filter_branches = JSON.parse(conf.filter_branches);
    conf.cols = JSON.parse(conf.cols);
    curentConfig.value = conf;
    document.title = curentConfig.value.name;
    load.value = false;
    createReport(callback);
  }).catch((err) => {
    console.log(err);
    props.authStore.removeFavorite(route.fullPath);
    props.showError('Конфигурация не найдена');
  });
}

function createReport(callback) {
  if (isCreateReportInProgress.value) return;

  isCreateReportInProgress.value = true;
  load.value = true;

  const period = props.authStore.getDatePeriod(inputFilter.value.period.id, inputFilter.value.dateStart, inputFilter.value.dateFinish);
  [inputFilter.value.dateStart, inputFilter.value.dateFinish] = period;

  props.authStore.authorizedRequest('get', `report_build?config=${curentConfig.value.id
    }&dS=${inputFilter.value.dateStart
    }&dF=${inputFilter.value.dateFinish
    }&previous=${inputFilter.value.previous ? 1 : 0
    }&all_data=${inputFilter.value.allData ? 1 : 0
    }`).then((respRP) => {
      const { original, previous, relative } = respRP.data;
      columns.value.length = 0;
      columnsOriginal.value.length = 0;
      columnsOriginal.value.push(...original.columns);
      original.columns.forEach((col, i) => {
        if (previous) {
          if (col.name === 'main') {
            columns.value.push(col);
          } else {
            const prevCol = previous.columns[i];
            prevCol.name = `${col.name}_`;
            prevCol.field = `${col.field}_`;
            prevCol.label = `${col.label}*`;
            prevCol.hatch = true;
            const relCol = relative.columns[i];
            relCol.name = `${col.name}__`;
            relCol.field = `${col.field}__`;
            relCol.label = `${col.label}*Δ`;
            relCol.forChart = false;
            columns.value.push(...[prevCol, col, relCol]);
          }
        } else columns.value.push(col)
      });
      total.value = undefined;
      total.value = original.total;

      rows.value.length = 0;
      original.rows.forEach((row, i) => {
        if (previous) {
          previous.columns.forEach((colPrev, ic) => {
            row[colPrev.name] = previous.rows[i][original.columns[ic].name];
          });
          relative.columns.forEach((colRel, ic) => {
            row[colRel.name] = relative.rows[i][original.columns[ic].name];
          });
        }
        rows.value.push(row);
      });
      if (previous) {
        previous.columns.forEach((colPrev, ic) => {
          total.value[colPrev.name] = previous.total[original.columns[ic].name];
        });
        relative.columns.forEach((colRel, ic) => {
          total.value[colRel.name] = relative.total[original.columns[ic].name];
        });
      }

      load.value = false;
      isCreateReportInProgress.value = false;

      chartDataMetricCount.value = {
        labels: rows.value.map((row) => row.main),
        datasets: columns.value.filter((col) => col.chart === 'value' && col.type_metric === props.authStore.TYPE_METRICS_COUNT && col.forChart).map((col) => {
          return {
            label: col.label,
            data: rows.value.map((row) => {
              return row[col.name];
            }),
            color: col.color_bg || undefined,
            hatch: col.hatch || false,
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
            hatch: col.hatch || false,
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
            hatch: col.hatch || false,
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
      load.value = false;
      isCreateReportInProgress.value = false;
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

function saveForLocalStorage() {
  localStorage.setItem('report_filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('report_filter_date_finish', inputFilter.value.dateFinish);
  localStorage.setItem('report_filter_points', inputFilter.value.points.id);
  localStorage.setItem('report_filter_period', inputFilter.value.period.id);
  if (inputFilter.value.dateStart === null || inputFilter.value.dateFinish === null) inputFilter.value.previous = false;
  localStorage.setItem('report_filter_previous', inputFilter.value.previous);
  localStorage.setItem('report_filter_all_data', inputFilter.value.allData);
}

function updateInputFilter() {
  saveForLocalStorage();
  createReport(() => {
    if (!isCreateReportInProgress.value) updateSelect(selected.value);
  });
}
function returnSelectedInfo() {
  return `Всего объектов: ${rows.value.length}`;
}
onMounted(() => {
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
