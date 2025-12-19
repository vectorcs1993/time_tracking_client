<template>
  <q-card-actions class="row fit q-pl-lg q-gutter-sm items-center">
    <div class="text-h6">
      Ежедневник <q-badge align="top" color="orange" text-color="black">в разработке</q-badge>
    </div>
    <q-space />
    <Button label="Обновить" icon="sync" @click="update" :dark="props.dark" />
    <Button v-if="rowsBefore.length > 0 || rowsAfter.length > 0" icon="file_download" label="Экспорт"
      @click="exportReport" :dark="props.dark" />
    <!-- Фильтр период -->
    <InputSelect label="Период" :options="props.authStore.getTypesPeriod" v-model="inputFilter.period"
      @update:model-value="updateInputFilter" :dark="props.dark" style="width: 250px;" />
    <InputDate label="от" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateStart"
      @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
    <InputDate label="до" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateFinish"
      @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
    <!-- Фильтр группы -->
    <InputSelect label="Группа" v-model="inputFilter.branch" :options="branches_mod"
      @update:model-value="updateInputFilter" :dark="props.dark" style="width: 150px" />
    <!-- Поиск -->
    <InputSearch label="Поиск" v-model="inputFilter.search" :dark="props.dark" style="width: 200px;" />
  </q-card-actions>

  <q-splitter v-model="splitter" :dark="props.dark" style="height: 85vh;">
    <template v-slot:before>
      <q-table ref="tableBefore" dense
        :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer q-pa-none q-ma-none`"
        :dark="props.dark" square flat :rows="rowsBefore" :columns="columns" row-key="id" virtual-scroll wrap-cells
        :virtual-scroll-item-size="48" :virtual-scroll-sticky-size-start="32" :hide-selected-banner="true"
        :hide-header="load" selection="multiple" binary-state-sort :loading="load" :hide-pagination="false"
        v-model:pagination="pagination" separator="cell" :rows-per-page-options="[0]" no-data-label="Нет данных"
        grid-header :filter="inputFilter.search" v-model:selected="selectedBefore" column-sort-order="da"
        style="height: 100%;" @row-click="(evt, row) => activeRowIdBefore = row.id">
        <template v-slot:loading>
          <PPLoading v-model="load" :dark="props.dark" />
        </template>
        <template v-slot:top>
          <q-card-actions class="row fit q-gutter-sm items-center">
            <div class="text-h6">
              Планируется на следующий период
            </div>
            <Button label="Новая запись" @click="actionCreate(props.authStore.TYPE_DAILY_REPORT_BEFORE)" icon="add"
              :dark="props.dark" />
            <Button label="Копировать" v-if="selectedBefore.length === 1" icon="content_copy"
              @click="() => actionCopy(selectedBefore, rowsBefore)" :dark="props.dark" />
            <Button label="Удалить" v-if="selectedBefore.length > 0" icon="delete" @click="() => {
              props.showConfirm(`Удалить записи (${selectedBefore.length})?`, () => actionDelete(selectedBefore));
            }" :dark="props.dark" />
            <q-space />
          </q-card-actions>
        </template>
        <template v-slot:header-cell="props">
          <q-th :props="props" :style="isHideCol(props.col) ? 'display: none;' : ''">
            <div class="text-size">
              {{ props.col.label }}
            </div>
          </q-th>
        </template>
        <template v-slot:header-selection="props">
          <InputCheckbox v-model="props.selected" :dark="props.dark" />
        </template>
        <template v-slot:body-selection="props">
          <InputCheckbox v-model="props.selected" :dark="props.dark" />
        </template>
        <template v-slot:pagination>
        </template>
        <template v-slot:body-cell="props">
          <q-td :props="props" class="no-pa-ma" :style="isHideCol(props.col) ? 'display: none;' : props.col.style">
            <div class="text-size q-pa-sm row fit justify-center items-center"
              style="white-space: pre-wrap; min-height: 53px; overflow: hidden;">
              <span v-if="props.col.type == 'checkbox'" style="font-size: 24px;">
                <InputCheckbox :disable="!isAllowEdit(props.row)" v-model="props.row[props.col.name]" :dark="props.dark"
                  @update:model-value="(val) => {
                    save(props.row.id, props.col.name, val);
                  }" />
              </span>
              <span v-else-if="props.col.type == 'selector' && isAllowEdit(props.row)">
                <InputSelect v-if="activeRowIdBefore === props.row.id" cell v-model="props.row[props.col.name]"
                  :disable="props.col.disable ? props.col.disable(props.row) : false"
                  :options="props.col.options(props.row)" :dark="props.dark" @update:model-value="(val) => {
                    save(props.row.id, props.col.name, val.id);
                    if (props.col.name === 'type_work') updateTypeWorkDailyReport(props.row);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span class="fit" style="overflow: hidden;"
                v-else-if="(props.col.type == 'text' || props.col.type == 'textarea') && isAllowEdit(props.row)">
                <InputText v-if="activeRowIdBefore === props.row.id" cell :type="props.col.type"
                  v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
                    debouncedSave(props.row.id, props.col.name, val);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span v-else-if="props.col.type == 'number' && isAllowEdit(props.row)">
                <InputNumber v-if="activeRowIdBefore === props.row.id" cell :type="props.col.type"
                  v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
                    if (!val) {
                      val = 0;
                      props.row[props.col.name] = val;
                    }
                    save(props.row.id, props.col.name, val);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span v-else-if="props.col.type == 'date' && isAllowEdit(props.row)">
                <InputDate v-if="activeRowIdBefore === props.row.id" cell readonly v-model="props.row[props.col.name]"
                  :dark="props.dark" @update:model-value="(val) => {
                    save(props.row.id, props.col.name, val);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span v-else style="white-space: pre-wrap; padding: 0px;">
                {{ props.value }}
              </span>
            </div>
          </q-td>
        </template>
      </q-table>

    </template>
    <template v-slot:after>
      <q-table ref="tableAfter" dense
        :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer q-pa-none q-ma-none`"
        :dark="props.dark" square flat :rows="rowsAfter" :columns="columns" row-key="id" virtual-scroll wrap-cells
        :virtual-scroll-item-size="48" :virtual-scroll-sticky-size-start="32" :hide-selected-banner="true"
        :hide-header="load" selection="multiple" binary-state-sort :loading="load" :hide-pagination="false"
        v-model:pagination="pagination" separator="cell" :rows-per-page-options="[0]" no-data-label="Нет данных"
        grid-header :filter="inputFilter.search" v-model:selected="selectedAfter" column-sort-order="da"
        style="height: 100%;" @row-click="(evt, row) => activeRowIdAfter = row.id">
        <template v-slot:loading>
          <PPLoading v-model="load" :dark="props.dark" />
        </template>
        <template v-slot:top>
          <q-card-actions class="row fit q-gutter-sm items-center">
            <div class="text-h6">
              Выполнено за прошлый период
            </div>
            <Button label="Новая запись" @click="actionCreate(props.authStore.TYPE_DAILY_REPORT_AFTER)" icon="add"
              :dark="props.dark" />
            <Button label="Копировать" v-if="selectedAfter.length === 1" icon="content_copy"
              @click="() => actionCopy(selectedAfter, rowsAfter)" :dark="props.dark" />
            <Button label="Удалить" v-if="selectedAfter.length > 0" icon="delete" @click="() => {
              props.showConfirm(`Удалить записи (${selectedAfter.length})?`, () => actionDelete(selectedAfter));
            }" :dark="props.dark" />
            <q-space />
          </q-card-actions>
        </template>
        <template v-slot:header-cell="props">
          <q-th :props="props" :style="isHideCol(props.col) ? 'display: none;' : ''">
            <div class="text-size">
              {{ props.col.label }}
            </div>
          </q-th>
        </template>
        <template v-slot:header-selection="props">
          <InputCheckbox v-model="props.selected" :dark="props.dark" />
        </template>
        <template v-slot:body-selection="props">
          <InputCheckbox v-model="props.selected" :dark="props.dark" />
        </template>
        <template v-slot:pagination>
        </template>
        <template v-slot:body-cell="props">
          <q-td :props="props" class="no-pa-ma" :style="isHideCol(props.col) ? 'display: none;' : props.col.style">
            <div class="text-size q-pa-sm row fit justify-center items-center"
              style="white-space: pre-wrap; min-height: 53px; overflow: hidden;">
              <span v-if="props.col.type == 'checkbox'" style="font-size: 24px;">
                <InputCheckbox :disable="!isAllowEdit(props.row)" v-model="props.row[props.col.name]" :dark="props.dark"
                  @update:model-value="(val) => {
                    save(props.row.id, props.col.name, val);
                  }" />
              </span>
              <span v-else-if="props.col.type == 'selector' && isAllowEdit(props.row)">
                <InputSelect :disable="props.col.disable ? props.col.disable(props.row) : false"
                  v-if="activeRowIdAfter === props.row.id" cell v-model="props.row[props.col.name]"
                  :options="props.col.options(props.row)" :dark="props.dark" @update:model-value="(val) => {
                    save(props.row.id, props.col.name, val.id);
                    if (props.col.name === 'type_work') updateTypeWorkDailyReport(props.row);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span class="fit" style="overflow: hidden;"
                v-else-if="(props.col.type == 'text' || props.col.type == 'textarea') && isAllowEdit(props.row)">
                <InputText v-if="activeRowIdAfter === props.row.id" cell :type="props.col.type"
                  :disable="props.col.disable ? props.col.disable(props.row) : false"
                  v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
                    debouncedSave(props.row.id, props.col.name, val);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span v-else-if="props.col.type == 'number' && isAllowEdit(props.row)">
                <InputNumber v-if="activeRowIdAfter === props.row.id" cell :type="props.col.type"
                  :disable="props.col.disable ? props.col.disable(props.row) : false"
                  v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
                    if (!val) {
                      val = 0;
                      props.row[props.col.name] = val;
                    }
                    save(props.row.id, props.col.name, val);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span v-else-if="props.col.type == 'date' && isAllowEdit(props.row)">
                <InputDate v-if="activeRowIdAfter === props.row.id" cell readonly v-model="props.row[props.col.name]"
                  :dark="props.dark" @update:model-value="(val) => {
                    save(props.row.id, props.col.name, val);
                  }" />
                <span v-else>{{ props.value }}</span>
              </span>
              <span v-else style="white-space: pre-line; padding: 0px;">
                {{ props.value }}
              </span>
            </div>
          </q-td>
        </template>
      </q-table>
    </template>
  </q-splitter>

</template>
<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
} from 'vue';
import moment from 'moment/moment';
import Button from 'src/components/InputButton.vue';
import PPLoading from 'src/components/PPLoading.vue';
import InputCheckbox from 'src/components/InputCheckbox.vue';
import InputNumber from 'src/components/InputText.vue';
import InputText from 'src/components/InputTextarea.vue';
import InputSelect from 'src/components/InputSelect.vue';
import InputDate from 'src/components/InputDate.vue';
import { OPTION_ALL, OPTION_NONE } from './fun';
import InputSearch from 'src/components/InputSearch.vue';

const load = ref(false);

document.title = 'Ежедневник';

const props = defineProps({
  showInfo: Function,
  showConfirm: Function,
  showError: Function,
  contentHeight: Number,
  dark: Boolean,
  authStore: Object,
});
const isUpdateInProgress = ref(false);
const tableBefore = ref(null);
const tableAfter = ref(null);
const branches = ref([]);
const branches_mod = ref([]);
const type_works_daily_reports = ref([]);
const projects = ref([]);
const rowsBefore = ref([]);
const rowsAfter = ref([]);
const datetimeFormat = 'YYYY-MM-DD';
const splitter = ref(50);
const inputFilter = ref({
  period: props.authStore.getTypesPeriod[0],
  search: '',
  usersOnlyBranch: [],
  usersOnlyBranchNoAll: [],
  branch: undefined,
  dateStart: moment().subtract(1, 'days').format(datetimeFormat),
  dateFinish: moment().format(datetimeFormat),
});

const activeRowIdBefore = ref(null);
const activeRowIdAfter = ref(null);
const selectedBefore = ref([]);
const selectedAfter = ref([]);

const columns = ref([
  {
    name: 'createdAt',
    label: 'Дата',
    align: 'center',
    field: (row) => props.authStore.getTimeFormatForce(row.createdAt, 'DD.MM.YYYY'),
    sortable: true,
    edit: false,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.createdRaw) - new Date(rowA.createdRaw),
    style: 'min-width: 80px; max-width: 80px;',
  },
  {
    name: 'branch',
    label: 'Группа',
    align: 'center',
    field: (row) => row.branch.name,
    sortable: true,
    edit: false,
    type: 'selector',
    options: () => branches.value,
  },

  {
    name: 'data',
    label: 'Описание работ',
    align: 'center',
    field: 'data',
    sortable: false,
    edit: true,
    type: 'textarea',
    style: 'min-width: 350px; max-width: 350px;',
  },
  {
    name: 'type_work',
    label: 'Тип отчёта',
    align: 'center',
    field: (row) => row.type_work.name,
    sortable: true,
    edit: true,
    type: 'selector',
    options: () => type_works_daily_reports.value,
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'type_activity',
    label: 'Активность/Проект',
    align: 'center',
    field: (row) => row.type_work.id !== OPTION_NONE.id ? (row.type_activity ? row.type_activity.name : '') : '-',
    sortable: true,
    edit: true,
    type: 'selector',
    options: () => projects.value,
    style: 'min-width: 170px; max-width: 170px;',
    disable: (row) => row.type_work.id !== props.authStore.TYPE_WORK_PROJECT,
  },
  {
    name: 'progress',
    label: 'Готовность, %',
    align: 'center',
    field: 'progress',
    sortable: true,
    edit: true,
    type: 'number',
    disable: (row) => row.type_work.id !== props.authStore.TYPE_WORK_PROJECT,
    style: 'min-width: 100px; max-width: 100px;',
  },
]);

function isAllowEdit(row) {
  try {
    // || props.authStore.isAdministrator
    return row.branch.id === props.authStore.getBranch.id;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function isAllowDeleted(row) {
  try {
    // || props.authStore.isAdministrator
    return row.branch.id === props.authStore.getBranch.id;
  } catch (err) {
    console.log(err);
    return false;
  }
}

function update(callback) {
  if (isUpdateInProgress.value) return;

  isUpdateInProgress.value = true;

  try {
    const period = props.authStore.getDatePeriod(
      inputFilter.value.period.id,
      inputFilter.value.dateStart,
      inputFilter.value.dateFinish
    );
    [inputFilter.value.dateStart, inputFilter.value.dateFinish] = period;

    selectedBefore.value.length = 0;
    rowsBefore.value.length = 0;
    selectedAfter.value.length = 0;
    rowsAfter.value.length = 0;

    props.authStore.authorizedRequest('get',
      `daily_reports?branch=${inputFilter.value.branch.id}&dS=${inputFilter.value.dateStart}&dF=${inputFilter.value.dateFinish}`
    ).then((respDA) => {
      const data = respDA.data.map((r) => ({
        ...r,
        createdRaw: r.createdAt,
        branch: branches.value.find((tw) => tw.id === r.branch),
        type_work: type_works_daily_reports.value.find((tw) => tw.id === r.type_work) || OPTION_NONE,
        type_activity: projects.value.find((tw) => tw.id === r.type_activity) || OPTION_NONE,
      }));

      rowsBefore.value.push(...data.filter((d) => d.type === props.authStore.TYPE_DAILY_REPORT_BEFORE));
      rowsAfter.value.push(...data.filter((d) => d.type === props.authStore.TYPE_DAILY_REPORT_AFTER));
      isUpdateInProgress.value = false;
      if (callback) {
        if (typeof callback === 'function') {
          callback();
        }
      }
    }).catch(() => {
      isUpdateInProgress.value = false;
      if (callback) {
        if (typeof callback === 'function') {
          callback();
        }
      }
    });

  } catch (err) {
    console.log(err);
    rowsBefore.value.length = 0;
    rowsAfter.value.length = 0;
    isUpdateInProgress.value = false;
  }
}
function updateTypeWorkDailyReport(row) {
  const typeWId = row.type_work.id;
  if (typeWId === props.authStore.TYPE_WORK_PROJECT) [row.type_activity] = projects.value;
  else row.type_activity = OPTION_NONE;

  const typeAId = row.type_activity.id;
  save(row.id, 'type_work', typeWId);
  save(row.id, 'type_activity', typeAId);
}
function actionCreate(type) {

  const date = moment().format(datetimeFormat);
  localStorage.setItem('daily_filter_date_finish', date);

  if (!props.authStore.isDateInRange(date, inputFilter.value.dateStart, inputFilter.value.dateFinish) && inputFilter.value.period.id !== 2) {
    [, inputFilter.value.period] = props.authStore.getTypesPeriod;
  }

  const createObject = {
    type,
    branch: props.authStore.getBranch.id,
  };
  props.authStore.authorizedRequest('post', `daily_reports`, createObject).then(() => {
    update();
  }).catch((err) => {
    console.log(err);
    props.showInfo('Ошибка создания записи');
  });
}

function actionCopy(selected, rows) {
  const date = moment().format(datetimeFormat);
  localStorage.setItem('filter_date_finish', date);
  props.authStore.authorizedRequest('get', `daily_reports/${selected[0].id}`).then((res) => {
    const copyingObject = res.data[0];
    copyingObject.id = undefined;
    copyingObject.createdAt = undefined;
    copyingObject.updatedAt = undefined;
    copyingObject.branch = branches.value.find((b) => b.id === props.authStore.getUser.branch).id;
    console.log(copyingObject);

    props.authStore.authorizedRequest('post', `daily_reports`, copyingObject).then((resCopy) => {
      update(() => {
        selected.length = 0;
        const s = rows.find((r) => r.id === resCopy.data);
        if (s) {
          selected.push(s);
        }
      });
    }).catch((err) => {
      console.log(err);
    });
  });
}
function isHideCol(col) {
  if (col.name === 'branch' && (inputFilter.value.branch?.id !== -1)) return true;
  if (col.name === 'createdAt' && (inputFilter.value.period?.id === 1 || inputFilter.value.period?.id === 3)) return true;
  return false;
}
function actionDelete(list) {
  const deletedQuery = [];
  list.forEach((s) => {
    if (isAllowDeleted(s)) {
      deletedQuery.push(props.authStore.authorizedRequest('delete', `daily_reports/${s.id}`));
    }
  });
  Promise.all(deletedQuery).then(() => update()).catch((err) => {
    console.log(err);
    props.showInfo('Ошибка удаления записи');
  });
}
function save(id, col, value) {
  if (col !== undefined && id !== undefined && value !== undefined) {
    const updateRow = {};
    updateRow[col] = value;
    console.log(updateRow);

    props.authStore.authorizedRequest('post', `daily_reports/${id}`, updateRow).catch((err) => {
      console.log(err);
      props.showError('Ошибка при работе с таблицей');
      update();
    });
  }
}
const debounceTimers = {};
function debouncedSave(id, col, value) {
  // Очищаем предыдущий таймер для этого конкретного поля
  const key = `${id}-${col}`;
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }

  // Устанавливаем новый таймер
  debounceTimers[key] = setTimeout(() => {
    save(id, col, value);
    delete debounceTimers[key];
  }, 400);
}
function saveForLocalStorage() {
  localStorage.setItem('daily_filter_branch', inputFilter.value.branch.id);
  localStorage.setItem('daily_filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('daily_filter_date_finish', inputFilter.value.dateFinish);
  if (String(inputFilter.value.search) === 'null') inputFilter.value.search = '';
  localStorage.setItem('daily_filter_period', inputFilter.value.period.id);
  localStorage.setItem('daily_filter_search', inputFilter.value.search);
}
function updateInputFilter() {
  saveForLocalStorage();
  update();
}

const pagination = ref({
  rowsPerPage: 0,
});
function exportReport() {
  const placeValues = (r) => {
    const e = { ...r };
    columns.value.forEach((col) => {
      e[col.name] = typeof col.field === 'function' ? col.field(r) : e[col.name];
      if (col.type === 'checkbox') {
        e[col.name] = e[col.name] === true ? '✓' : '';
      }
    });
    return e;
  };

  const data = {
    dateStart: inputFilter.value.dateStart,
    dateFinish: inputFilter.value.dateFinish,
    columns: columns.value,
    rows: [
      'Планируется на следующий период',
      ...tableBefore.value.filteredSortedRows.map(placeValues),
      'Выполнено за предыдущий период',
      ...tableAfter.value.filteredSortedRows.map(placeValues)],
    prefix: 'data',
  };
  props.authStore.downloadExcel('export/excel', data).catch((err) => {
    console.log(err);
  });
}
onMounted(() => {
  props.authStore.authorizedRequest('get', `branches`).then((respBR) => {
    branches.value.length = 0;
    branches.value.push(...respBR.data);
    branches_mod.value.push(OPTION_ALL);
    branches_mod.value.push(...respBR.data);
    [inputFilter.value.branch] = branches_mod.value;
    props.authStore.authorizedRequest('get', `type_works_daily_reports`).then((respTW) => {
      type_works_daily_reports.value.length = 0;
      type_works_daily_reports.value.push(...respTW.data);
      props.authStore.authorizedRequest('get', `projects`).then((respP) => {
        projects.value.length = 0;
        projects.value.push(...respP.data);
        if (localStorage.getItem('daily_filter_period')) {
          inputFilter.value.period = props.authStore.getTypesPeriod.find((tp) => tp.id === Number(localStorage.getItem('daily_filter_period')));
          if (!inputFilter.value.period) {
            [inputFilter.value.period] = props.authStore.getTypesPeriod;
          }
        }
        if (localStorage.getItem('daily_filter_branch')) {
          inputFilter.value.branch = branches_mod.value.find((tp) => tp.id === Number(localStorage.getItem('daily_filter_branch')));
          if (!inputFilter.value.branch) {
            [inputFilter.value.branch] = branches_mod.value;
          }
        }

        if (localStorage.getItem('daily_filter_date_start')) {
          inputFilter.value.dateStart = localStorage.getItem('daily_filter_date_start');
        }
        if (localStorage.getItem('daily_filter_date_finish')) {
          inputFilter.value.dateFinish = localStorage.getItem('daily_filter_date_finish');
        }
        update();
      });
    });
  });
});
onUnmounted(() => {
  Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
});
</script>
