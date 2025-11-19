<template>
  <!-- Таблица -->
  <q-table v-if="curentConfig" ref="table" dense
    :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer q-pa-none q-ma-none`"
    :dark="props.dark" square flat :rows="records" :columns="columns" row-key="id" virtual-scroll wrap-cells
    :virtual-scroll-item-size="48" :virtual-scroll-sticky-size-start="32" :hide-selected-banner="true"
    selection="multiple" binary-state-sort :loading="load" :color="`${props.dark ? 'orange' : 'green'}`"
    :hide-pagination="false" v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]"
    no-data-label="Нет данных" grid-header :filter="inputFilter.search" v-model:selected="selected"
    @row-click="selectRow" column-sort-order="da" :style="`height: ${props.contentHeight}`">
    <template v-slot:loading>
      <PPLoading v-model="load" :dark="props.dark" />
    </template>
    <template v-slot:top>
      <q-card-actions class="row q-gutter-sm full-width items-center">
        <Btn label="" icon="sync" :click="requestRecords" :dark="props.dark" />
        <Btn v-if="isAllowCreate()" :click="actionCreate" icon="add" :dark="props.dark" />
        <Btn v-if="isAllowCreate() && selected.length === 1" icon="content_copy" :click="actionCopy"
          :dark="props.dark" />
        <Btn v-if="isAllowCreate() && isAllowDeleted()" icon="delete" :click="() => {
          props.showConfirm('Удалить записи?', actionDelete);
        }" :dark="props.dark" />
        <!-- Фильтр подразделения -->
        <TTSelect v-if="inputFilter.on" label="Подразделение" v-model="inputFilter.branch"
          :options="inputFilter.branches" @update:model-value="updateInputFilter" :dark="props.dark"
          style="width: 150px" />
        <!-- Пользовательский Фильтр сотрудники -->
        <TTSelect label="Сотрудник" v-model="inputFilter.user" :options="inputFilter.usersOnlyBranch"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <!-- Фильтр тип работы -->
        <TTSelect v-if="inputFilter.on" label="Тип работы" v-model="inputFilter.type_work"
          :options="inputFilter.type_works" @update:model-value="() => {
            updateFilterTypeWork();
            updateInputFilter();
          }" :dark="props.dark" style="width: 200px;" />
        <!-- Фильтр целевой объект/проект -->
        <TTSelect v-if="inputFilter.on" :disable="inputFilter.type_work ? inputFilter.type_work.id === -1 : false"
          label="Целевой объект" v-model="inputFilter.activity" :options="inputFilter.activities" @update:model-value="() => {
            updateFilterTypeWork();
            updateInputFilter();
          }" :dark="props.dark" style="width: 200px;" />
        <q-space />
        <!-- Фильтр период -->
        <TTSelect label="Период" :options="type_period" v-model="inputFilter.period"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <TTDatePicker label="от" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateStart"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <TTDatePicker label="до" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateFinish"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <!-- Поиск -->
        <TTInputTextSingle label="Поиск" v-model="inputFilter.search" @update:model-value="updateInputFilter"
          :dark="props.dark" />
      </q-card-actions>
    </template>
    <template v-slot:header-cell="props">
      <q-th :props="props">
        <div class="text-size">
          {{ props.col.label }}
        </div>
      </q-th>
    </template>
    <template v-slot:pagination>
      <div class="row q-gutter-sm items-center">
        <div class="text-size">{{ returnSelectedInfo() }}</div>
        <!-- Фильтр сортировка -->
        <TTSelect label="Сортировать" v-model="inputFilter.sorted" :options="type_sorts"
          @update:model-value="updateInputFilter" :dark="props.dark" />
        <Btn v-if="records.length > 0" icon="download" label="Экспорт в EXCEL" :click="exportReport"
          :dark="props.dark" />
      </div>
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props" class="no-pa-ma" :style="`background-color: ${getCustomStyle(props.row, props.col.name)}`">
        <TTInputText
          v-if="(props.col.type == 'text' || props.col.type == 'textarea') && isSelect(props.row.id) && isAllowEdit(props.row.id, props.col.name, false)"
          v-model="props.row[props.col.name]" :update="() => {
            save(props.col.name, props.row[props.col.name]);
          }" />
        <TTInputNumber
          v-else-if="props.col.type == 'number' && isSelect(props.row.id) && isAllowEdit(props.row.id, props.col.name, false)"
          v-model="props.row[props.col.name]" :update="() => {
            save(props.col.name, props.row[props.col.name]);
          }" :dark="props.dark" />
        <TTDatePicker
          v-else-if="props.col.type == 'date' && isSelect(props.row.id) && isAllowEdit(props.row.id, props.col.name, false)"
          :cell="true" v-model="props.row[props.col.name]" :dark="props.dark"
          @update:model-value="(val) => save(props.col.name, val)" />
        <PPCheckbox :disable="!isAllowEdit(props.row.id, props.col.name, false)"
          v-else-if="props.col.type == 'checkbox'" v-model="props.row[props.col.name]" :dark="props.dark"
          @update:model-value="(val) => {
            selected[0] = props.row;
            save(props.col.name, val);
          }" />
        <TTSelect
          v-else-if="props.col.type == 'selector' && isSelect(props.row.id) && isAllowEdit(props.row.id, props.col.name, false)"
          :cell="true" v-model="props.row[props.col.name]" :options="props.col.options(props.row)" @update:model-value="(val) => {
            if (props.col.name === 'type_work') updateTypeWork(props.row);
            else save(props.col.name, val.id);
          }" style="width: 100%" :dark="props.dark">
        </TTSelect>
        <div v-else class="text-size cell-content">
          {{ props.value }}
        </div>
      </q-td>
    </template>
  </q-table>
  <q-card-section v-else>Просмотр запрещен</q-card-section>
</template>
<script setup>
import {
  ref,
  defineProps,
  onMounted,
} from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth.js';
import moment from 'moment/moment';
import { type_works, TYPE_WORK_PROJECT } from 'src/pages/services/time_tracking/type_works.js';
import { getObject } from 'src/pages/services/time_tracking/fun.js';
import Btn from 'src/components/TTBtn.vue';
import PPLoading from 'src/components/PPLoading.vue';
import PPCheckbox from 'src/components/PPCheckbox.vue';
import { getNameShort, isDateInRange, OPTION_ALL, TT_TYPE_FLAG } from './fun';
import TTSelect from 'src/components/TTSelect.vue';
import TTDatePicker from 'src/components/TTDatePicker.vue';
import TTInputNumber from 'src/components/TTInputNumber.vue';
import TTInputText from 'src/components/TTInputText.vue';

const load = ref(false);
const authStore = useAuthStore();

document.title = 'Таблицы';

const route = useRoute();
const { id } = route.params;
console.log(id);

const props = defineProps({
  showInfo: Function,
  showConfirm: Function,
  showError: Function,
  contentHeight: Number,
  dark: Boolean,
});
const table = ref(null);
const tab = ref('timeTrackingTable');
const tabConf = ref();
const branches = ref([]);
const projects = ref([]);
const sources = ref([]);
const activities = ref([]);
const records = ref([]);
const fields = ref([]);
const type_product = [
  {
    id: 0,
    name: 'Продукция',
  },
  {
    id: 1,
    name: 'Полуфабрикат',
  },
];

const type_sorts = [
  {
    id: 'DESC',
    name: 'Сначала новые',
  },
  {
    id: 'ASC',
    name: 'Сначала старые',
  },
];
const type_period = [
  {
    id: 0,
    name: 'Выбрать период',
  },
  {
    id: 1,
    name: 'Сегодня',
  },
  {
    id: 3,
    name: 'Вчера',
  },
  {
    id: 4,
    name: 'Последние 7 дней',
  },
  {
    id: 5,
    name: 'Последние 30 дней',
  },
  {
    id: 6,
    name: 'Последние 180 дней',
  },
  {
    id: 2,
    name: 'Все данные',
  },
];
const inputFilter = ref({
  on: true,
  period: type_period[0],
  search: '',
  user: undefined,
  users: [],
  usersOnlyBranch: [],
  usersOnlyBranchNoAll: [],
  branch: undefined,
  branches: [],
  sorted: type_sorts[0],
  dateStart: moment().subtract(1, 'days').format('YYYY-MM-DD'),
  dateFinish: moment().format('YYYY-MM-DD'),
  type_work: undefined,
  type_works: [],
  activity: undefined,
  activities: [],
});
const users = ref([]);
const selected = ref([]);
const configs = ref([]);
const curentConfig = ref();
function selectRow(_event, row) {
  if (row) {
    selected.value.length = 0;
    selected.value.push(row);
  }
}

function isSelect(_id) {
  return selected.value.findIndex((s) => s.id === _id) !== -1 && selected.value.length === 1;
}
function isAllowDeleted(_id) {
  try {
    if (curentConfig.value.cols.length > 0) {
      const del = selected.value.length > 0 && curentConfig.value.allow_delete.find((b) => b === authStore.getUser.branch);
      if (_id !== undefined) {
        return del && (curentConfig.value.deleteOnlySome ? (records.value.find((t) => t.id === _id).user.id === users.value.find((u) => u.email === authStore.getUser.email).id) : true);
      }
      return del;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
function getCustomStyle(row, col) {
  try {
    if (curentConfig.value.cols.length > 0) {
      const findColFromConf = curentConfig.value.cols.find((c) => c.field === col);

      const field = fields.value.find((f) => f.name === col);
      if (field.type === TT_TYPE_FLAG) {
        if (row[col] === true) {
          if (findColFromConf.color_bg !== undefined) {
            return findColFromConf.color_bg;
          }
        }
      }
    }
    return '';
  } catch (err) {
    console.log(err);
    return '';
  }
}
function isAllowEdit(_id, _col, needSelect) {
  try {
    if (curentConfig.value.cols.length > 0) {
      const changeRow = (needSelect ? selected.value.length > 0 : true) && curentConfig.value.allow_edit.find((b) => b === authStore.getUser.branch) !== undefined;
      const findColFromConf = curentConfig.value.cols.find((c) => c.field === _col);
      const changeCol = findColFromConf.allow_edit.find((ae) => ae === authStore.getUser.branch) !== undefined;
      if (_id !== undefined) {
        return changeRow && changeCol && (curentConfig.value.changeOnlySome ? (records.value.find((t) => t.id === _id).user.id === users.value.find((u) => u.email === authStore.getUser.email).id) : true);
      }
      return changeRow && changeCol;
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
function isAllowView(val) {
  try {
    return val.allow_views.find((b) => b === authStore.getUser.branch);
  } catch (err) {
    console.log(err);
    return false;
  }
}
function getTimeFormatForce(val, f) {
  return moment(val).format(f);
}
function isAllowCreate() {
  try {
    return curentConfig.value?.allow_creates.find((b) => b === authStore.getUser.branch);
  } catch {
    return false;
  }
}
const columnsPerm = [
  {
    name: 'id',
    label: '№',
    align: 'center',
    field: 'id',
    sortable: true,
    sort: (a, b) => parseInt(a, 10) - parseInt(b, 10),
  },
  {
    name: 'createdAt',
    label: 'Дата создания',
    align: 'center',
    field: (row) => getTimeFormatForce(row.createdAt, 'DD.MM.YYYY'),
    sortable: true,
    edit: true,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.createdRaw) - new Date(rowA.createdRaw),
  },
  {
    name: 'updatedAt',
    label: 'Дата изменения',
    align: 'left',
    field: (row) => getTimeFormatForce(row.updatedAt, 'DD.MM.YYYY'),
    sortable: true,
    sort: (a, b, rowA, rowB) => new Date(rowB.updatedRaw) - new Date(rowA.updatedRaw),
  },
  {
    name: 'dateStartOrder',
    label: 'Дата запуска КД',
    align: 'center',
    field: (row) => getTimeFormatForce(row.dateStartOrder, 'DD.MM.YYYY'),
    sortable: true,
    edit: true,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.dateStartOrderRaw) - new Date(rowA.dateStartOrderRaw),
  },
  {
    name: 'dateFinishOrder',
    label: 'Дата закрытия КД',
    align: 'center',
    field: (row) => getTimeFormatForce(row.dateFinishOrder, 'DD.MM.YYYY'),
    sortable: true,
    edit: true,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.dateFinishOrderRaw) - new Date(rowA.dateFinishOrderRaw),
  },
  {
    name: 'branch',
    label: 'Подразделение',
    align: 'center',
    sortable: true,
    field: (row) => row.branch.name,
    edit: true,
    type: 'selector',
    options: () => branches.value,
    disable: true,
  },
  {
    name: 'user',
    label: 'Ответственный',
    align: 'center',
    sortable: true,
    field: (row) => getNameShort(row.user?.name),
    edit: true,
    type: 'selector',
    options: () => inputFilter.value.usersOnlyBranchNoAll,
    disable: false,
    style: 'min-width: 120px; max-width: 170px;',
  },
  {
    name: 'type_work',
    label: 'Тип работы',
    align: 'center',
    sortable: true,
    field: (row) => row.type_work.name,
    edit: true,
    type: 'selector',
    options: () => type_works,
    style: 'min-width: 120px; max-width: 170px;',
  },
  {
    name: 'type_activity',
    label: 'Целевой объект/Проект',
    align: 'center',
    sortable: true,
    field: (row) => (row.type_activity ? row.type_activity.name : ''),
    edit: true,
    type: 'selector',
    options: (row) => (row.type_work.id === TYPE_WORK_PROJECT ? projects.value : activities.value),
    style: 'min-width: 120px; max-width: 170px;',
  },
  {
    name: 'type_product',
    label: 'Тип продукта',
    align: 'center',
    sortable: true,
    field: (row) => (row.type_product ? row.type_product.name : ''),
    edit: true,
    type: 'selector',
    options: () => type_product,
  },
  {
    name: 'type_source',
    label: 'Источник',
    align: 'center',
    sortable: true,
    field: (row) => (row.type_source ? row.type_source.name : ''),
    edit: true,
    type: 'selector',
    options: () => sources.value,
  },
  {
    name: 'total_time',
    label: 'Время, мин',
    align: 'center',
    field: 'total_time',
    sortable: true,
    edit: true,
    type: 'number',
    style: 'min-width: 100px; max-width: 100px;',
  },
  {
    name: 'progress',
    label: 'Выполнено, %',
    align: 'center',
    field: 'progress',
    sortable: true,
    edit: true,
    type: 'number',
    style: 'min-width: 100px; max-width: 100px;',
  },
  {
    name: 'description',
    label: 'Комментарий',
    align: 'center',
    field: 'description',
    sortable: false,
    edit: true,
    type: 'textarea',
    style: 'min-width: 300px; max-width: 300px;',
  },
  {
    name: 'nomenclature',
    label: 'Номенклатура',
    align: 'center',
    field: 'nomenclature',
    sortable: false,
    edit: true,
    type: 'text',
    style: 'min-width: 200px;',
  },
  {
    name: 'number',
    label: 'Номер',
    align: 'center',
    field: 'number',
    sortable: false,
    edit: true,
    type: 'text',
    style: 'min-width: 100px; max-width: 200px; padding: 0;',
  },
  {
    name: 'count',
    label: 'Кол-во, шт',
    align: 'center',
    field: 'count',
    sortable: false,
    edit: true,
    type: 'text',
  },
  {
    name: 'readyScheme',
    label: 'Схема',
    align: 'center',
    field: 'readyScheme',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px;',
  },
  {
    name: 'readyProgramm',
    label: 'ПО',
    align: 'center',
    field: 'readyProgramm',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px;',
  },
  {
    name: 'readyDesign',
    label: 'Чертеж',
    align: 'center',
    field: 'readyDesign',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px;',
  },
  {
    name: 'readyNomenclature',
    label: 'Номенклатура готова',
    align: 'center',
    field: 'readyNomenclature',
    sortable: true,
    edit: true,
    type: 'checkbox',
  },
  {
    name: 'startOrder',
    label: 'КД начато',
    align: 'center',
    field: 'startOrder',
    sortable: true,
    edit: true,
    type: 'checkbox',
  },
  {
    name: 'finishOrder',
    label: 'КД завершено',
    align: 'center',
    field: 'finishOrder',
    sortable: true,
    edit: true,
    type: 'checkbox',
  },
  {
    name: 'mark',
    label: 'Обозначение',
    align: 'center',
    field: 'mark',
    sortable: false,
    edit: true,
    type: 'text',
  },
  {
    name: 'important',
    label: 'Важно!',
    align: 'center',
    field: 'important',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px;',
  },
];
const columns = ref([]);
function getItem(val) {
  if (localStorage.getItem(val) === null || localStorage.getItem(val) === undefined) {
    return -1;
  }
  return Number(localStorage.getItem(val));
}
function requestRecords(callback) {
  const day = moment();
  const yesterday = day.clone().subtract(1, 'days');
  const yesterday7 = day.clone().subtract(7, 'days');
  const yesterday30 = day.clone().subtract(30, 'days');
  const yesterday180 = day.clone().subtract(180, 'days');
  // дата старта и финиша - сегодня
  if (inputFilter.value.period.id === 1) {
    inputFilter.value.dateStart = day.format('YYYY-MM-DD');
    inputFilter.value.dateFinish = day.format('YYYY-MM-DD');
  } else if (inputFilter.value.period.id === 3) { // вчера
    inputFilter.value.dateStart = yesterday.format('YYYY-MM-DD');
    inputFilter.value.dateFinish = yesterday.format('YYYY-MM-DD');
  } else if (inputFilter.value.period.id === 4) { // 7 дней
    inputFilter.value.dateStart = yesterday7.format('YYYY-MM-DD');
    inputFilter.value.dateFinish = day.format('YYYY-MM-DD');
  } else if (inputFilter.value.period.id === 5) { // 30 дней
    inputFilter.value.dateStart = yesterday30.format('YYYY-MM-DD');
    inputFilter.value.dateFinish = day.format('YYYY-MM-DD');
  } else if (inputFilter.value.period.id === 6) { // 180 дней
    inputFilter.value.dateStart = yesterday180.format('YYYY-MM-DD');
    inputFilter.value.dateFinish = day.format('YYYY-MM-DD');
  } else if (inputFilter.value.period.id === 2) { // все данные
    inputFilter.value.dateStart = 'null';
    inputFilter.value.dateFinish = 'null';
  }
  authStore.authorizedRequest('get', `/records?order=${inputFilter.value.sorted.id
    }&branch=${inputFilter.value.branch.id
    }&type_work=${inputFilter.value.type_work.id
    }&activity=${inputFilter.value.activity.id
    }&user=${inputFilter.value.user.id
    }&dS=${inputFilter.value.dateStart
    }&dF=${inputFilter.value.dateFinish}`).then((res) => { // &columns=${columns.value.map((c) => c.name).join(',')}
      records.value.length = 0;
      records.value.push(...res.data.map((rec) => ({
        ...rec,
        branch: getObject(branches.value, rec.branch),
        user: getObject(users.value, rec.user),
        type_work: getObject(type_works, rec.type_work),
        type_activity: getObject(rec.type_work === TYPE_WORK_PROJECT ? projects.value : activities.value, rec.type_activity),
        type_source: getObject(sources.value, rec.type_source),
        type_product: getObject(type_product, rec.type_product),
        createdRaw: rec.createdAt,
        createdAt: moment(rec.createdAt).format('YYYY-MM-DD'),
        updatedRaw: rec.updatedAt,
        updatedAt: moment(rec.updatedAt).format('YYYY-MM-DD'),
        dateStartOrderRaw: rec.dateStartOrder,
        dateStartOrder: moment(rec.dateStartOrder).format('YYYY-MM-DD'),
        dateFinishOrderRaw: rec.dateFinishOrder,
        dateFinishOrder: moment(rec.dateFinishOrder).format('YYYY-MM-DD'),
      })));

      load.value = false;
      if (inputFilter.value.sorted.id === 'ASC') {
        setImmediate(() => table.value.scrollTo(records.value.length - 1, 'end-force'));
      }
      if (callback) {
        if (typeof callback === 'function') {
          callback();
        }
      }
    }).catch((err) => {
      console.log(err);
      props.showError('Ошибка загрузки данных');
    });
}
function update(callback) {
  try {
    if (localStorage.getItem('time_tr_tabs')) {
      tab.value = localStorage.getItem('time_tr_tabs');
    }
    if (localStorage.getItem('filter_search')) {
      inputFilter.value.search = localStorage.getItem('filter_search');
    }
    if (localStorage.getItem('filter_period')) {
      inputFilter.value.period = getObject(type_period, getItem('filter_period'));
      if (!inputFilter.value.period) {
        [inputFilter.value.period] = type_period;
      }
    }
    if (localStorage.getItem('filter_date_start')) {
      inputFilter.value.dateStart = localStorage.getItem('filter_date_start');
    }
    if (localStorage.getItem('filter_date_finish')) {
      inputFilter.value.dateFinish = localStorage.getItem('filter_date_finish');
    }
    selected.value.length = 0;
    load.value = true;
    // извлечение конфигурации таблицы
    configs.value.length = 0;
    // authStore.authorizedRequest('get', `all_configs`).then((respC) => {
    // respC.data.sort((a, b) => (a.name < b.name ? -1 : 1)).forEach((conf) => {
    //   conf.allow_views = JSON.parse(conf.allow_views);
    //   conf.allow_creates = JSON.parse(conf.allow_creates);
    //   conf.allow_delete = JSON.parse(conf.allow_delete);
    //   conf.allow_edit = JSON.parse(conf.allow_edit);
    //   conf.cols = JSON.parse(conf.cols);
    //   if (isAllowView(conf)) {
    //     configs.value.push(conf);
    //   }
    // });

    // curentConfig.value = getObject(configs.value, getItem('config_time_traking'));

    // if (!curentConfig.value) {
    //   [curentConfig.value] = configs.value;
    // }

    tabConf.value = `conf${curentConfig.value.id}`;

    inputFilter.value.on = curentConfig.value.filters;
    columns.value.length = 0;
    authStore.authorizedRequest('get', `all_fields`).then((respFl) => {
      fields.value.push(...respFl.data.sort((a, b) => (a.name > b.name ? 1 : -1)));
      // формирование столбцов
      // if (curentConfig.value.cols.length > 0) {
      curentConfig.value.cols.forEach((col) => {
        const findCol = columnsPerm.find((c) => c.name === col.field);
        if (col.name !== undefined && col.name !== '') {
          findCol.label = col.name;
        } else {
          findCol.label = findCol.name;
        }
        columns.value.push(findCol);
      });
      // } else {

      //   columnsPerm.forEach((col) => {
      //     const v = curentConfig.value[`v${col.name}`];
      //     const o = curentConfig.value[`o${col.name}`];
      //     if (v) {
      //       col.order = o || 0;
      //       columns.value.push(col);
      //     }
      //   });
      //   columns.value = columns.value.sort((a, b) => {
      //     if (a.order < b.order) {
      //       return -1; // a идет перед b
      //     }
      //     if (a.order > b.order) {
      //       return 1; // b идет перед a
      //     }
      //     return 0; // a и b равны
      //   });
      // }

      // установка фильтра тип работы
      inputFilter.value.type_works.length = 0;
      inputFilter.value.type_works.push(OPTION_ALL);
      inputFilter.value.type_works.push(...type_works);
      if (curentConfig.value.filters) {
        inputFilter.value.type_work = getObject(inputFilter.value.type_works, getItem('filter_type_work'));
      } else {
        inputFilter.value.type_work = getObject(inputFilter.value.type_works, curentConfig.value.filter_type_work);
      }
      if (!inputFilter.value.type_work) {
        inputFilter.value.type_work = getObject(inputFilter.value.type_works, -1);
      }

      // целевой объект
      activities.value.length = 0;
      authStore.authorizedRequest('get', `all_activities`).then((respA) => {
        activities.value.push(...respA.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
        if (!inputFilter.value.activity) {
          inputFilter.value.activity = getObject(inputFilter.value.activities, -1);
        }
        // источники поступления задач
        sources.value.length = 0;
        authStore.authorizedRequest('get', `sources`).then((respS) => {
          sources.value.push(...respS.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
          projects.value.length = 0;
          // проекты
          authStore.authorizedRequest('get', `all_projects`).then((respP) => {
            projects.value.push(...respP.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
            branches.value.length = 0;
            authStore.authorizedRequest('get', `branches`).then((respB) => {
              branches.value.push(...respB.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
              inputFilter.value.branches.length = 0;
              inputFilter.value.branches.push(OPTION_ALL);
              inputFilter.value.branches.push(...branches.value);
              if (curentConfig.value.filters) {
                inputFilter.value.branch = getObject(inputFilter.value.branches, getItem('filter_branch'));
              } else {
                inputFilter.value.branch = getObject(inputFilter.value.branches, curentConfig.value.filter_branch);
              }
              if (!inputFilter.value.branch) {
                inputFilter.value.branch = getObject(inputFilter.value.branches, -1);
              }

              inputFilter.value.activities.length = 0;
              inputFilter.value.activities.push(OPTION_ALL);
              inputFilter.value.activities.push(...(inputFilter.value.type_work.id === TYPE_WORK_PROJECT ? projects.value : activities.value));
              if (curentConfig.value.filters) {
                inputFilter.value.activity = getObject(inputFilter.value.activities, getItem('filter_activity'));
              } else {
                inputFilter.value.activity = getObject(inputFilter.value.activities, curentConfig.value.filter_type_activity);
              }

              users.value.length = 0;
              authStore.authorizedRequest('get', `users`).then((respU) => {
                users.value.push(...respU.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
                users.value.forEach((u) => {
                  u.name = getNameShort(u.name);
                });
                inputFilter.value.users.length = 0;
                inputFilter.value.users.push(OPTION_ALL);
                inputFilter.value.users.push(...users.value);
                // пользовательский фильтр Пользователь
                inputFilter.value.usersOnlyBranch.length = 0;
                inputFilter.value.usersOnlyBranch.push(OPTION_ALL);
                const optionsUsers = curentConfig.value.filter_branch !== -1 ? users.value.filter((u) => u.branch === curentConfig.value.filter_branch) : users.value;
                inputFilter.value.usersOnlyBranch.push(...optionsUsers);
                inputFilter.value.user = getObject(inputFilter.value.usersOnlyBranch, getItem('filter_user'));
                if (!inputFilter.value.user) {
                  inputFilter.value.user = getObject(inputFilter.value.usersOnlyBranch, -1);
                }
                inputFilter.value.usersOnlyBranchNoAll.length = 0;
                inputFilter.value.usersOnlyBranchNoAll.push(...optionsUsers);

                inputFilter.value.sorted = getObject(type_sorts, localStorage.getItem('filter_sort'));
                if (!inputFilter.value.sorted) {
                  [inputFilter.value.sorted] = type_sorts;
                }
                requestRecords(callback);
              }).catch((err) => {
                console.log(err);
              });
            }).catch((err) => {
              console.log(err);
            });
          });
        });
      });
    });
    // });
  } catch (err) {
    console.log(err);
    records.value.length = 0;
  }
}


function actionCreate() {
  const date = moment().format('YYYY-MM-DD');
  localStorage.setItem('filter_date_finish', date);

  if (!isDateInRange(date, inputFilter.value.dateStart, inputFilter.value.dateFinish) && inputFilter.value.period.id !== 2) {
    [, inputFilter.value.period] = type_period;
  }

  localStorage.setItem('filter_period', inputFilter.value.period.id);
  const createObject = {
    branch: branches.value.find((b) => b.id === authStore.getUser.branch).id,
    user: users.value.find((u) => u.email === authStore.getUser.email).id,
    type_activity: activities.value[0].id, // при условии что type_work = 0 (по умолчанию в БД)
    type_source: sources.value.find((s) => s.id === 9).id, // НЕТ по умолчанию
    dateStartOrder: date,
    dateFinishOrder: date,
  };
  if (!curentConfig.value.filters) {
    if (inputFilter.value.type_work.id !== -1) {
      createObject.type_work = inputFilter.value.type_work.id;
    }
    if (inputFilter.value.activity.id !== -1) {
      createObject.type_activity = inputFilter.value.activity.id;
    }
  }
  authStore.authorizedRequest('post', `records`, createObject).then((res) => {
    requestRecords(() => {
      selected.value.length = 0;
      const s = records.value.find((r) => r.id === res.data);
      if (s) {
        selected.value.push(s);
      }
    });
  }).catch((err) => {
    console.log(err);
    props.showInfo('Ошибка создания записи');
  });
}

function actionCopy() {
  const date = moment().format('YYYY-MM-DD');
  localStorage.setItem('filter_date_finish', date);
  authStore.authorizedRequest('get', `/services/genprice/TimeTracking/${selected.value[0].id}`).then((res) => {
    const copyingObject = res.data.data;
    copyingObject.id = undefined;
    copyingObject.createdAt = undefined;
    copyingObject.updatedAt = undefined;
    copyingObject.branch = branches.value.find((b) => b.id === authStore.getUser.branch).id;
    copyingObject.user = users.value.find((u) => u.email === authStore.getUser.email).id;
    authStore.authorizedRequest('post', `/services/genprice/TimeTracking/create`, copyingObject).then((resCopy) => {
      if (resCopy.data.result === 'ok') {
        update(() => {
          selected.value.length = 0;
          const s = records.value.find((r) => r.id === resCopy.data.data.id);
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
      deletedQuery.push(authStore.authorizedRequest('delete', `records/${s.id}`));
    }
  });
  Promise.all(deletedQuery).then(() => requestRecords()).catch((err) => {
    console.log(err);
    props.showInfo('Ошибка удаления записи');
  });
}
function save(col, value) {
  if (value !== undefined) {
    const updateRow = {};
    updateRow[col] = value;
    authStore.authorizedRequest('post', `records/${selected.value[0].id}`, updateRow).catch((err) => {
      console.log(err);
      props.showError('Ошибка при работе с таблицей');
      update();
    });
  }
}
function updateFilterTypeWork() {
  inputFilter.value.activities.length = 0;
  inputFilter.value.activities.push(OPTION_ALL);
  inputFilter.value.activities.push(...(inputFilter.value.type_work.id === TYPE_WORK_PROJECT ? projects.value : activities.value));
  if (inputFilter.value.type_work.id === -1) {
    [inputFilter.value.activity] = inputFilter.value.activities;
  }
}
function saveForLocalStorage() {
  localStorage.setItem('filter_user', inputFilter.value.user.id);
  localStorage.setItem('filter_branch', inputFilter.value.branch.id);
  localStorage.setItem('filter_sort', inputFilter.value.sorted.id);
  localStorage.setItem('filter_type_work', inputFilter.value.type_work.id);
  localStorage.setItem('filter_activity', inputFilter.value.activity.id);
  localStorage.setItem('config_time_traking', Number(tabConf.value.substr(4)));
  localStorage.setItem('filter_date_start', inputFilter.value.dateStart);
  localStorage.setItem('filter_date_finish', inputFilter.value.dateFinish);
  if (String(inputFilter.value.search) === 'null') inputFilter.value.search = '';
  localStorage.setItem('filter_period', inputFilter.value.period.id);
  localStorage.setItem('filter_search', inputFilter.value.search);
}
function updateInputFilter() {
  selected.value.length = 0;
  saveForLocalStorage();
  requestRecords();
}
function updateTypeWork(row) {
  const typeWId = row.type_work.id;
  [row.type_activity] = typeWId === TYPE_WORK_PROJECT ? projects.value : activities.value;
  const typeAId = row.type_activity.id;
  save('type_work', typeWId);
  save('type_activity', typeAId);
}
const pagination = ref({
  rowsPerPage: 0,
});
function returnSelectedInfo() {
  const sum = selected.value.reduce((acc, current) => acc + Number(current.total_time), 0);
  const average = sum / selected.value.length;
  const max = Math.max.apply(null, selected.value.map((obj) => Number(obj.total_time)));
  return selected.value.length === 0 ? `Всего записей: ${records.value.length}` : `Записей выбрано:
  ${selected.value.length} из ${records.value.length}; Общее время: ${sum} мин (${(sum / 60).toFixed(1)} ч); Среднее время: ${average.toFixed(1)} мин (${(average / 60).toFixed(1)} ч);
  Максимальное время: ${max} мин (${(max / 60).toFixed(1)} ч);`;
}
// const filteredRows = computed(() => {
//   if (!inputFilter.value.search) return records.value;
//   return records.value.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(inputFilter.value.search.toLowerCase())));
// });
// function exportReport() {
//   const data = {
//     columns: columns.value,
//     rows: filteredRows.value.map((r) => {
//       const e = { ...r };
//       columns.value.forEach((col) => {
//         e[col.name] = typeof col.field === 'function' ? col.field(r) : e[col.name];
//       });
//       return e;
//     }),
//   };
//   axios({
//     url: `/services/time_tracking_report_excel`,
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

onMounted(() => {
  authStore.authorizedRequest('get', `configs/${id}`).then((respConf) => {
    const conf = respConf.data[0];
    conf.allow_views = JSON.parse(conf.allow_views);
    conf.allow_creates = JSON.parse(conf.allow_creates);
    conf.allow_delete = JSON.parse(conf.allow_delete);
    conf.allow_edit = JSON.parse(conf.allow_edit);
    conf.cols = JSON.parse(conf.cols);
    if (isAllowView(conf)) {
      configs.value.push(conf);
    }
    curentConfig.value = conf;
    // respC.data.sort((a, b) => (a.name < b.name ? -1 : 1)).forEach((conf) => {
    //   conf.allow_views = JSON.parse(conf.allow_views);
    //   conf.allow_creates = JSON.parse(conf.allow_creates);
    //   conf.allow_delete = JSON.parse(conf.allow_delete);
    //   conf.allow_edit = JSON.parse(conf.allow_edit);
    //   conf.cols = JSON.parse(conf.cols);
    //   if (isAllowView(conf)) {
    //     configs.value.push(conf);
    //   }
    // });



    // if (!curentConfig.value) {
    //   [curentConfig.value] = configs.value;
    // }
    update();
  }).catch(() => {
    props.showError('Ошибка загрузки конфигурации');
  })
});
</script>
