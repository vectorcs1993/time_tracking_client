<template>
  <q-table v-if="isAllowView(curentConfig)" ref="table" dense
    :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer q-pa-none q-ma-none`"
    :dark="props.dark" square flat :rows="rows" :columns="columns" row-key="id" virtual-scroll wrap-cells
    :virtual-scroll-item-size="48" :virtual-scroll-sticky-size-start="32" :hide-selected-banner="true"
    :hide-header="load" selection="multiple" binary-state-sort :loading="load" :hide-pagination="false"
    v-model:pagination="pagination" separator="cell" :rows-per-page-options="[0]" no-data-label="Нет данных" grid-header
    :filter="inputFilter.search" v-model:selected="selected" column-sort-order="da" style="height: 90vh;"
    @row-click="onRowClick">
    <template v-slot:loading>
      <PPLoading v-model="load" :dark="props.dark" />
    </template>
    <template v-slot:top>
      <q-card-actions class="row fit q-gutter-sm items-center">
        <div class="text-h6">
          Ежедневник
        </div>
        <q-space />
        <Button label="Обновить" icon="sync" @click="update" :dark="props.dark" />
        <Button label="Новая запись" v-if="isAllowCreate()" @click="actionCreate" icon="add" :dark="props.dark" />
        <Button label="Копировать" v-if="isAllowCreate() && selected.length === 1" icon="content_copy"
          @click="actionCopy" :dark="props.dark" />
        <Button label="Удалить" v-if="selected.length > 0 && isAllowCreate() && isAllowDeleted()" icon="delete" @click="() => {
          props.showConfirm('Удалить записи?', actionDelete);
        }" :dark="props.dark" />
        <!-- Фильтр группы -->
        <InputSelect label="Группа" v-model="inputFilter.branch" :options="branches_mod"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 150px" />
        <!-- Фильтр период -->
        <InputSelect label="Период" :options="props.authStore.getTypesPeriod" v-model="inputFilter.period"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 250px;" />
        <InputDate label="от" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateStart"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <InputDate label="до" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateFinish"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <!-- Поиск -->
        <InputSearch label="Поиск" v-model="inputFilter.search" :dark="props.dark" style="width: 200px;" />
      </q-card-actions>
    </template>
    <template v-slot:header-cell="props">
      <q-th :props="props">
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
      <div class="row q-gutter-sm items-center">
        <div class="text-size">{{ returnSelectedInfo() }}</div>
        <Button v-if="rows.length > 0" icon="download" label="Экспорт" @click="exportReport" :dark="props.dark" />
      </div>
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props" class="no-pa-ma">
        <div class="text-size q-pa-sm row fit justify-center items-center"
          style="white-space: pre-wrap; min-height: 53px;">
          <span v-if="props.col.type == 'checkbox'" style="font-size: 24px;">
            <InputCheckbox :disable="!isAllowEdit(props.row.id, props.col)" v-model="props.row[props.col.name]"
              :dark="props.dark" @update:model-value="(val) => {
                save(props.row.id, props.col.name, val);
              }" />
          </span>
          <span v-else-if="props.col.type == 'selector' && isAllowEdit(props.row.id, props.col)">
            <InputSelect v-if="activeRowId === props.row.id" cell v-model="props.row[props.col.name]"
              :options="props.col.options(props.row)" :dark="props.dark" @update:model-value="(val) => {
                save(props.row.id, props.col.name, val.id);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span class="fit" style="overflow: hidden;"
            v-else-if="(props.col.type == 'text' || props.col.type == 'textarea') && isAllowEdit(props.row.id, props.col)">
            <InputText v-if="activeRowId === props.row.id" cell :type="props.col.type"
              v-model="props.row[props.col.name]" :dark="props.dark" @blur="() => {
                save(props.row.id, props.col.name, props.row[props.col.name]);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span v-else-if="props.col.type == 'number' && isAllowEdit(props.row.id, props.col)">
            <InputNumber v-if="activeRowId === props.row.id" cell :type="props.col.type"
              v-model="props.row[props.col.name]" :dark="props.dark" @blur="() => {
                save(props.row.id, props.col.name, props.row[props.col.name]);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span v-else-if="props.col.type == 'date' && isAllowEdit(props.row.id, props.col)">
            <InputDate v-if="activeRowId === props.row.id" cell readonly v-model="props.row[props.col.name]"
              :dark="props.dark" @update:model-value="() => {
                save(props.row.id, props.col.name, props.row[props.col.name]);
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
  <q-card-section v-else class="row q-gutter-xs full-width items-center">
    <Button icon="arrow_back" @click="router.push(`/tables`)" :dark="props.dark" />
    <div class="text-h6">
      Нет доступа
    </div>
  </q-card-section>
</template>
<script setup>
import {
  ref,
  onMounted,
} from 'vue';
import { useRouter } from 'vue-router';
import moment from 'moment/moment';
// import { type_works, TYPE_WORK_PROJECT } from 'src/pages/services/time_tracking/type_works.js';
// import { getObject } from 'src/pages/services/time_tracking/fun.js';
import Button from 'src/components/InputButton.vue';
import PPLoading from 'src/components/PPLoading.vue';
import InputCheckbox from 'src/components/InputCheckbox.vue';
import InputNumber from 'src/components/InputText.vue';
import InputText from 'src/components/InputTextarea.vue';
import InputSearch from 'src/components/InputSearch.vue';
import InputSelect from 'src/components/InputSelect.vue';
import InputDate from 'src/components/InputDate.vue';
import { OPTION_ALL, OPTION_NONE } from './fun';

const load = ref(false);

document.title = 'Таблицы';

const router = useRouter();

const props = defineProps({
  showInfo: Function,
  showConfirm: Function,
  showError: Function,
  contentHeight: Number,
  dark: Boolean,
  authStore: Object,
});
const table = ref(null);
const branches = ref([]);
const branches_mod = ref([]);
const type_works = ref([]);
// const projects = ref([]);
// const activities = ref([]);
const rows = ref([]);
const datetimeFormat = 'YYYY-MM-DD';

const inputFilter = ref({
  period: props.authStore.getTypesPeriod[0],
  search: '',
  usersOnlyBranch: [],
  usersOnlyBranchNoAll: [],
  branch: undefined,
  dateStart: moment().subtract(1, 'days').format(datetimeFormat),
  dateFinish: moment().format(datetimeFormat),
});

const activeRowId = ref(null);
function onRowClick(evt, row) {
  // Устанавливаем активную строку
  activeRowId.value = row.id;
}
const users = ref([]);
const selected = ref([]);

function isAllowDeleted() {
  try {
    return props.authStore.isAdministrator;
  } catch (err) {
    console.log(err);
    return false;
  }
}
function isAllowEdit(row, col) {
  try {
    return col.edit === true && props.authStore.isAdministrator;
  } catch (err) {
    console.log(err);
    return false;
  }
}
function isAllowView() {
  try {
    return props.authStore.isAdministrator;
  } catch (err) {
    console.log(err);
    return false;
  }
}
function isAllowCreate() {
  try {
    return props.authStore.isAdministrator;
  } catch {
    return false;
  }
}
const columns = ref([
  {
    name: 'branch',
    label: 'Группа',
    align: 'center',
    field: (row) => row.branch.name,
    sortable: false,
    edit: false,
    type: 'selector',
    options: () => branches.value,
  },
  {
    name: 'type_work_after',
    label: 'Тип работы',
    align: 'center',
    field: (row) => row.type_work_after.name,
    sortable: false,
    edit: true,
    type: 'selector',
    options: () => type_works.value,
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'type_activity_after',
    label: 'Активность/Проект',
    align: 'center',
    field: 'type_activity_after',
    sortable: false,
    edit: false,
    type: 'selector',
    options: () => type_works.value,
    style: 'min-width: 170px; max-width: 170px;',
  },
  {
    name: 'data_after',
    label: 'Планы на текущую неделю',
    align: 'center',
    field: 'data_after',
    sortable: false,
    edit: true,
    type: 'textarea',
    style: 'min-width: 350px; max-width: 350px;',
  },
  {
    name: 'progress_after',
    label: 'Выполнено, %',
    align: 'center',
    field: 'progress_after',
    sortable: false,
    edit: true,
    type: 'number',
    style: 'min-width: 100px; max-width: 100px;',
  },
  {
    name: 'type_work_before',
    label: 'Тип работы',
    align: 'center',
    field: (row) => row.type_work_before.name,
    sortable: false,
    edit: true,
    type: 'selector',
    options: () => type_works.value,
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'type_activity_before',
    label: 'Активность/Проект',
    align: 'center',
    field: 'type_activity_before',
    sortable: false,
    edit: false,
    type: 'selector',
    options: () => type_works.value,
    style: 'min-width: 170px; max-width: 170px;',
  },
  {
    name: 'data_before',
    label: 'Отчёт за прошлую неделю',
    align: 'center',
    field: 'data_before',
    sortable: false,
    edit: true,
    type: 'textarea',
    style: 'min-width: 350px; max-width: 350px;',
  },
  {
    name: 'progress_before',
    label: 'Выполнено, %',
    align: 'center',
    field: 'progress_before',
    sortable: false,
    edit: true,
    type: 'number',
    style: 'min-width: 100px; max-width: 100px;',
  },
]);
function update() {
  try {
    selected.value.length = 0;
    rows.value.length = 0;
    props.authStore.authorizedRequest('get', `daily_reports`).then((respDA) => {
      rows.value.push(...respDA.data.map((r) => {

        return {
          ...r,
          branch: branches.value.find((tw) => tw.id === r.branch),
          type_work_before: type_works.value.find((tw) => tw.id === (r.type_work_before === null ? -1 : r.type_work_before)),
          type_work_after: type_works.value.find((tw) => tw.id === (r.type_work_after === null ? -1 : r.type_work_after)),
        }
      }));
    });
  } catch (err) {
    console.log(err);
    rows.value.length = 0;
  }
}
function actionCreate() {
  const createObject = {
    branch: props.authStore.getBranch.id,
  };
  props.authStore.authorizedRequest('post', `daily_reports`, createObject).then(() => {
    update();
  }).catch((err) => {
    console.log(err);
    props.showInfo('Ошибка создания записи');
  });
}
function actionCopy() {
  const date = moment().format(datetimeFormat);
  localStorage.setItem('filter_date_finish', date);
  props.authStore.authorizedRequest('get', `/services/genprice/TimeTracking/${selected.value[0].id}`).then((res) => {
    const copyingObject = res.data.data;
    copyingObject.id = undefined;
    copyingObject.createdAt = undefined;
    copyingObject.updatedAt = undefined;
    copyingObject.branch = branches.value.find((b) => b.id === props.authStore.getUser.branch).id;
    copyingObject.user = users.value.find((u) => u.email === props.authStore.getUser.email).id;
    props.authStore.authorizedRequest('post', `/services/genprice/TimeTracking/create`, copyingObject).then((resCopy) => {
      if (resCopy.data.result === 'ok') {
        update(() => {
          selected.value.length = 0;
          const s = rows.value.find((r) => r.id === resCopy.data.data.id);
          if (s) {
            selected.value.push(s);
          }
        });
      } else if (resCopy.data.result === 'no') {
        props.showInfo('Ошибка создания записи');
      }
    }).catch((err) => {
      console.log(err);
    });
  });
}
function actionDelete() {
  const deletedQuery = [];
  selected.value.forEach((s) => {
    if (isAllowDeleted(s.id)) {
      deletedQuery.push(props.authStore.authorizedRequest('delete', `records/${s.id}`));
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
function saveForLocalStorage() {
  localStorage.setItem('daily_filter_branch', inputFilter.value.branch.id);
  localStorage.setItem('daily_filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('daily_filter_date_finish', inputFilter.value.dateFinish);
  if (String(inputFilter.value.search) === 'null') inputFilter.value.search = '';
  localStorage.setItem('daily_filter_period', inputFilter.value.period.id);
  localStorage.setItem('daily_filter_search', inputFilter.value.search);
}
function updateInputFilter() {
  selected.value.length = 0;
  saveForLocalStorage();

}

// function updateTypeWork(row) {
//   const typeWId = row.type_work.id;
//   [row.type_activity] = typeWId === TYPE_WORK_PROJECT ? projects.value : activities.value;
//   const typeAId = row.type_activity.id;
//   save(row.id, 'type_work', typeWId);
//   save(row.id, 'type_activity', typeAId);
// }
const pagination = ref({
  rowsPerPage: 0,
});
function returnSelectedInfo() {
  const sum = selected.value.reduce((acc, current) => acc + Number(current.total_time), 0);
  const average = sum / selected.value.length;
  const max = Math.max.apply(null, selected.value.map((obj) => Number(obj.total_time)));
  return selected.value.length === 0 ? `Всего записей: ${table.value.filteredSortedRows.length}` : `Записей выбрано:
  ${selected.value.length} из ${table.value.filteredSortedRows.length}; Общее время: ${sum} мин (${(sum / 60).toFixed(1)} ч); Среднее время: ${average.toFixed(1)} мин (${(average / 60).toFixed(1)} ч);
  Максимальное время: ${max} мин (${(max / 60).toFixed(1)} ч);`;
}
function exportReport() {
  const data = {
    dateStart: inputFilter.value.dateStart,
    dateFinish: inputFilter.value.dateFinish,
    columns: columns.value,
    rows: table.value.filteredSortedRows.map((r) => {
      const e = { ...r };
      columns.value.forEach((col) => {
        e[col.name] = typeof col.field === 'function' ? col.field(r) : e[col.name];
        if (col.type === 'checkbox') {
          e[col.name] = e[col.name] === true ? '✓' : '';
        }
      });
      return e;
    }),
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
    props.authStore.authorizedRequest('get', `all_type_works`).then((respTW) => {
      type_works.value.length = 0;
      type_works.value.push(OPTION_NONE);
      type_works.value.push(...respTW.data);
      update();
    });
  });
});
</script>
