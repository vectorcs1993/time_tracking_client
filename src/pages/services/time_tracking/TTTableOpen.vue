<template>
  <q-table v-if="isAllowView(curentConfig)" ref="table" dense :color="`${props.dark ? 'orange' : 'green'}`"
    :class="`${props.dark ? 'pp-dark' : 'pp-light'} row fix-table cursor-pointer q-pa-none q-ma-none`"
    :dark="props.dark" square flat :rows="records" :columns="visibleColumns" row-key="id" virtual-scroll wrap-cells
    :virtual-scroll-item-size="48" :virtual-scroll-sticky-size-start="32" :hide-selected-banner="true"
    :hide-header="load" selection="multiple" binary-state-sort :loading="load" :hide-pagination="false"
    v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]" no-data-label="Нет данных" grid-header
    :filter="inputFilter.search" v-model:selected="selected" column-sort-order="da" style="height: 90vh;"
    @row-click="onRowClick">
    <template v-slot:loading>
      <PPLoading v-model="load" :dark="props.dark" />
    </template>
    <template v-slot:top>
      <q-card-actions class="row fit q-gutter-sm items-center">
        <Button icon="arrow_back" label="К таблицам" @click="router.push(`/tables`)" :dark="props.dark" />
        <slot name="favorite" />
        <div class="text-h6">
          {{ curentConfig.name }}
        </div>
        <q-space />
        <Button icon="sync" @click="requestRecords" :dark="props.dark" />
        <Button label="Новая запись" v-if="isAllowCreate()" @click="actionCreate" icon="add" :dark="props.dark" />
        <Button v-if="isAllowCreate() && selected.length === 1" icon="content_copy" @click="actionCopy"
          :dark="props.dark" />
        <Button v-if="isAllowCreate() && isAllowDeleted()" icon="delete" @click="() => {
          props.showConfirm('Удалить записи?', actionDelete);
        }" :dark="props.dark" />
        <!-- Фильтр группы -->
        <InputSelect v-if="inputFilter.on" label="Группа" v-model="inputFilter.branch" :options="inputFilter.branches"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 150px" />
        <!-- Пользовательский Фильтр сотрудники -->
        <InputSelect label="Сотрудник" v-model="inputFilter.user" :options="inputFilter.usersOnlyBranch"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <!-- Фильтр тип работы -->
        <InputSelect v-if="inputFilter.on" label="Тип работы" v-model="inputFilter.type_work"
          :options="inputFilter.type_works" @update:model-value="() => {
            updateFilterTypeWork();
            updateInputFilter();
          }" :dark="props.dark" style="width: 200px;" />
        <!-- Фильтр целевой объект/проект -->
        <InputSelect v-if="inputFilter.on" :disable="inputFilter.type_work ? inputFilter.type_work.id === -1 : false"
          label="Целевой объект" v-model="inputFilter.type_activity" :options="inputFilter.activities"
          @update:model-value="() => {
            updateFilterTypeWork();
            updateInputFilter();
          }" :dark="props.dark" style="width: 200px;" />
        <!-- Фильтр период -->
        <InputSelect label="Период" :options="props.authStore.getTypesPeriod" v-model="inputFilter.period"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 250px;" />
        <InputDate label="от" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateStart"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <InputDate label="до" :disable="inputFilter.period.id !== 0" v-model="inputFilter.dateFinish"
          @update:model-value="updateInputFilter" :dark="props.dark" style="width: 200px;" />
        <!-- Поиск -->
        <InputSearch label="Поиск" v-model="inputFilter.search" :dark="props.dark" style="width: 200px;"
          @update:model-value="updateInputFilter" />
        <Button v-if="props.authStore.isAdministrator" :dark="props.dark" label="Изменить" icon="edit"
          @click="() => router.push(`/configurations/table/${curentConfig.id}`)" />
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
        <InputSelect label="Сортировать" v-model="inputFilter.sorted" :options="type_sorts"
          @update:model-value="updateInputFilter" :dark="props.dark" />
        <Button v-if="records.length > 0" icon="file_download" label="Экспорт" @click="exportReport"
          :dark="props.dark" />
        <Button v-if="records.length > 0 && curentConfig.prompt !== '' && props.authStore.isAdministrator"
          icon="auto_awesome" label="ИИ Отчёт" @click="generateReport" :dark="props.dark" />
      </div>
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props"
        :style="`background-color: ${getCustomStyle(props.row, props.col.name)}; height: fit-content;`">
        <div class="text-size row fit justify-center items-center" style="white-space: pre-line;  overflow: hidden;">
          <span v-if="props.col.type == 'checkbox'" style="font-size: 24px;">
            <InputCheckbox :disable="!isAllowEdit(props.row.id, props.col.name)" v-model="props.row[props.col.name]"
              :dark="props.dark" @update:model-value="(val) => {
                save(props.row.id, props.col.name, val);
              }" />
          </span>
          <span v-else-if="props.col.type == 'selector' && isAllowEdit(props.row.id, props.col.name)">
            <InputSelect v-if="activeRowId === props.row.id" cell v-model="props.row[props.col.name]"
              :options="props.col.options(props.row)" :dark="props.dark" @update:model-value="(val) => {
                save(props.row.id, props.col.name, val.id);
                if (props.col.name === 'type_work') updateTypeWork(props.row);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span class="fit"
            v-else-if="(props.col.type == 'text' || props.col.type == 'textarea') && isAllowEdit(props.row.id, props.col.name)">
            <InputText v-if="activeRowId === props.row.id" cell :type="props.col.type" input-style="text-align: center;"
              v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
                debouncedSave(props.row.id, props.col.name, val);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span v-else-if="props.col.type == 'number' && isAllowEdit(props.row.id, props.col.name)">
            <InputNumber v-if="activeRowId === props.row.id" cell :type="props.col.type"
              v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
                if (!val) {
                  val = 0;
                  props.row[props.col.name] = val;
                }
                save(props.row.id, props.col.name, val);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span v-else-if="props.col.type == 'date' && isAllowEdit(props.row.id, props.col.name)">
            <InputDate v-if="activeRowId === props.row.id" cell readonly v-model="props.row[props.col.name]"
              :dark="props.dark" @update:model-value="(val) => {
                save(props.row.id, props.col.name, val);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <span v-else style="white-space: pre-line; overflow: hidden; padding: 10px;">
            {{ props.value }}
          </span>
        </div>
      </q-td>
    </template>
  </q-table>
  <q-card-section v-else class="row q-gutter-xs full-width items-center">
    <Button icon="arrow_back" @click="router.push(`/tables`)" :dark="props.dark" />
    <div class="text-h6">
      Нет доступа или конфигурация не найдена
    </div>
  </q-card-section>

  <!-- Диалоговое окно чата -->
  <q-dialog square v-model="aiReport" :dark="props.dark" full-width>
    <q-card :class="`${dark ? 'pp-dark' : 'pp-light'} text-size`">
      <q-bar :dark="props.dark" :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white text-size`">
        <div class="text-size truncate">ИИ Помощник</div>
        <q-space />
        <q-btn dense square flat icon="close" v-close-popup />
      </q-bar>
      <!-- Область сообщений с прокруткой -->
      <q-card-section class="q-pa-none scroll">
        <div class="q-pa-md" style="height: 70vh; max-height: 70vh; overflow-y: scroll;">
          <!-- Пример использования q-chat-message -->
          <div :class="`${dark ? 'pp-dark' : 'pp-light'} text-size`" v-for="(message, index) in messages" :key="index"
            v-html="message.text"></div>
        </div>
      </q-card-section>
      <q-separator :dark="props.dark" />
      <q-card-actions class="q-pa-md">
        <q-space />
        <Button label="Обновить" icon="sync" @click="generateReport" />
      </q-card-actions>
      <PPLoading v-model="loadReport" :dark="props.dark" />
    </q-card>
  </q-dialog>
</template>
<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import moment from 'moment/moment';
import MarkdownIt from 'markdown-it';
import { getObject } from 'src/pages/services/time_tracking/fun.js';
import Button from 'src/components/InputButton.vue';
import PPLoading from 'src/components/PPLoading.vue';
import InputCheckbox from 'src/components/InputCheckbox.vue';
import { getNameShort, isDateInRange, OPTION_ALL, TT_TYPE_FLAG } from './fun';
import InputNumber from 'src/components/InputText.vue';
import InputText from 'src/components/InputTextarea.vue';
import InputSearch from 'src/components/InputSearch.vue';
import InputSelect from 'src/components/InputSelect.vue';
import InputDate from 'src/components/InputDate.vue';

const load = ref(false);
const isUpdateInProgress = ref(false);
const md = new MarkdownIt();
document.title = 'Таблицы';
const aiReport = ref(false);
const loadReport = ref(true);
const messages = ref([]);
const route = useRoute();
const router = useRouter();
const { id } = route.params;
const dataPrompt = ref('');
const props = defineProps({
  showInfo: Function,
  showConfirm: Function,
  showError: Function,
  dark: Boolean,
  authStore: Object,
});
const table = ref(null);
const branches = ref([]);
const projects = ref([]);
const sources = ref([]);
const type_works = ref([]);
const activities = ref([]);
const records = ref([]);
const fields = ref([]);
const datetimeFormat = 'YYYY-MM-DD';
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

const inputFilter = ref({
  on: true,
  period: props.authStore.getTypesPeriod[0],
  search: '',
  user: undefined,
  users: [],
  usersOnlyBranch: [],
  usersOnlyBranchNoAll: [],
  branch: undefined,
  branches: [],
  sorted: type_sorts[0],
  dateStart: moment().subtract(1, 'days').format(datetimeFormat),
  dateFinish: moment().format(datetimeFormat),
  type_work: undefined,
  type_works: [],
  activity: undefined,
  activities: [],
});

const activeRowId = ref(null);
function onRowClick(evt, row) {
  // Устанавливаем активную строку
  activeRowId.value = row.id;
}
const users = ref([]);
const selected = ref([]);
const curentConfig = ref();


function isAllowDeleted(_id) {
  try {
    if (curentConfig.value.cols.length > 0) {
      const del = selected.value.length > 0 && curentConfig.value.allow_delete.find((b) => b === props.authStore.getUser.branch);
      if (_id !== undefined) {
        return del && (curentConfig.value.deleteOnlySome ? (records.value.find((t) => t.id === _id).user.id === users.value.find((u) => u.email === props.authStore.getUser.email).id) : true);
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
function isAllowEdit(_id, _col, needSelect = false) {
  try {
    if (curentConfig.value.cols.length > 0) {
      const changeRow = (needSelect ? selected.value.length > 0 : true) && curentConfig.value.allow_edit.find((b) => b === props.authStore.getUser.branch) !== undefined;
      const findColFromConf = curentConfig.value.cols.find((c) => c.field === _col);
      const changeCol = findColFromConf?.allow_edit.find((ae) => ae === props.authStore.getUser.branch) !== undefined;
      if (_id !== undefined) {
        return changeRow && changeCol && (curentConfig.value.changeOnlySome ? (records.value.find((t) => t.id === _id).user.id === users.value.find((u) => u.email === props.authStore.getUser.email).id) : true);
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
    return val?.allow_views.find((b) => b === props.authStore.getUser.branch || props.authStore.isAdministrator);
  } catch (err) {
    console.log(err);
    return false;
  }
}
function isAllowCreate() {
  try {
    return curentConfig.value?.allow_creates.find((b) => b === props.authStore.getUser.branch);
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
    field: (row) => props.authStore.getTimeFormatForce(row.createdAt, 'DD.MM.YYYY'),
    sortable: true,
    edit: true,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.createdRaw) - new Date(rowA.createdRaw),
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'updatedAt',
    label: 'Дата изменения',
    align: 'left',
    field: (row) => props.authStore.getTimeFormatForce(row.updatedAt, 'DD.MM.YYYY'),
    sortable: true,
    sort: (a, b, rowA, rowB) => new Date(rowB.updatedRaw) - new Date(rowA.updatedRaw),
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'dateStartOrder',
    label: 'Дата запуска КД',
    align: 'center',
    field: (row) => props.authStore.getTimeFormatForce(row.dateStartOrder, 'DD.MM.YYYY'),
    sortable: true,
    edit: true,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.dateStartOrderRaw) - new Date(rowA.dateStartOrderRaw),
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'dateFinishOrder',
    label: 'Дата закрытия КД',
    align: 'center',
    field: (row) => props.authStore.getTimeFormatForce(row.dateFinishOrder, 'DD.MM.YYYY'),
    sortable: true,
    edit: true,
    type: 'date',
    sort: (a, b, rowA, rowB) => new Date(rowB.dateFinishOrderRaw) - new Date(rowA.dateFinishOrderRaw),
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'branch',
    label: 'Группа',
    align: 'center',
    sortable: true,
    field: (row) => row.branch.name,
    edit: true,
    type: 'selector',
    options: () => branches.value,
    disable: true,
    style: 'min-width: 170px; max-width: 170px;',
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
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'type_work',
    label: 'Тип работы',
    align: 'center',
    sortable: true,
    field: (row) => row.type_work.name,
    edit: true,
    type: 'selector',
    options: () => type_works.value,
    style: 'min-width: 170px; max-width: 170px;',
  },
  {
    name: 'type_activity',
    label: 'Целевой объект/Проект',
    align: 'center',
    sortable: true,
    field: (row) => (row.type_activity ? row.type_activity.name : ''),
    edit: true,
    type: 'selector',
    options: (row) => {
      return row.type_work.id === props.authStore.TYPE_WORK_PROJECT ? projects.value : activities.value
    },
    style: 'min-width: 170px; max-width: 170px;',
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
    style: 'min-width: 170px; max-width: 170px;',
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
    style: 'min-width: 170px; max-width: 170px;',
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
    style: 'min-width: 250px; max-width: 250px;',
  },
  {
    name: 'number',
    label: 'Номер',
    align: 'center',
    field: 'number',
    sortable: false,
    edit: true,
    type: 'text',
    style: 'min-width: 120px; max-width: 120px;',
  },
  {
    name: 'count',
    label: 'Кол-во, шт',
    align: 'center',
    field: 'count',
    sortable: false,
    edit: true,
    type: 'text',
    style: 'min-width: 170px; max-width: 170px;',
  },
  {
    name: 'readyScheme',
    label: 'Схема',
    align: 'center',
    field: 'readyScheme',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
  {
    name: 'readyProgramm',
    label: 'ПО',
    align: 'center',
    field: 'readyProgramm',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
  {
    name: 'readyDesign',
    label: 'Чертеж',
    align: 'center',
    field: 'readyDesign',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
  {
    name: 'readyNomenclature',
    label: 'Номенклатура готова',
    align: 'center',
    field: 'readyNomenclature',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
  {
    name: 'startOrder',
    label: 'КД начато',
    align: 'center',
    field: 'startOrder',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
  {
    name: 'finishOrder',
    label: 'КД завершено',
    align: 'center',
    field: 'finishOrder',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
  {
    name: 'mark',
    label: 'Обозначение',
    align: 'center',
    field: 'mark',
    sortable: false,
    edit: true,
    type: 'text',
    style: 'min-width: 170px; max-width: 170px;',
  },
  {
    name: 'important',
    label: 'Важно!',
    align: 'center',
    field: 'important',
    sortable: true,
    edit: true,
    type: 'checkbox',
    style: 'min-width: 60px; max-width: 60px;',
  },
];
const columns = ref([]);
const visibleColumns = ref([]);
function getItem(val) {
  if (localStorage.getItem(val) === null || localStorage.getItem(val) === undefined) {
    return -1;
  }
  return Number(localStorage.getItem(val));
}
function requestRecords(callback) {

  if (isUpdateInProgress.value) return;

  isUpdateInProgress.value = true;
  load.value = true;
  records.value.length = 0;

  const period = props.authStore.getDatePeriod(inputFilter.value.period.id, inputFilter.value.dateStart, inputFilter.value.dateFinish);
  [inputFilter.value.dateStart, inputFilter.value.dateFinish] = period;

  props.authStore.authorizedRequest('get', `/records?order=${inputFilter.value.sorted.id
    }&branch=${inputFilter.value.branch.id
    }&type_work=${inputFilter.value.type_work.id
    }&type_activity=${inputFilter.value.type_activity.id
    }&user=${inputFilter.value.user.id
    }&dS=${inputFilter.value.dateStart
    }&dF=${inputFilter.value.dateFinish
    }&columns=${columns.value.map((c) => c.name).join(',')}`).then((res) => {

      records.value.push(...res.data.map((rec) => ({
        ...rec,
        branch: getObject(branches.value, rec.branch),
        user: getObject(users.value, rec.user),
        type_work: type_works.value.find((tw) => tw.id === rec.type_work),
        type_activity: (rec.type_work === props.authStore.TYPE_WORK_PROJECT ? projects.value : activities.value).find((ta) => ta.id === rec.type_activity),
        type_source: getObject(sources.value, rec.type_source),
        type_product: getObject(type_product, rec.type_product),
        createdRaw: rec.createdAt,
        createdAt: moment(rec.createdAt).format(datetimeFormat),
        updatedRaw: rec.updatedAt,
        updatedAt: moment(rec.updatedAt).format(datetimeFormat),
        dateStartOrderRaw: rec.dateStartOrder,
        dateStartOrder: moment(rec.dateStartOrder).format(datetimeFormat),
        dateFinishOrderRaw: rec.dateFinishOrder,
        dateFinishOrder: moment(rec.dateFinishOrder).format(datetimeFormat),
      })));

      load.value = false;
      isUpdateInProgress.value = false;

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
      load.value = false;
      isUpdateInProgress.value = false;
      props.authStore.removeFavorite(route.fullPath);
      props.showError('Конфигурация не найдена');
    });
}
function update(callback) {
  try {
    if (localStorage.getItem('filter_search')) {
      inputFilter.value.search = localStorage.getItem('filter_search');
    }
    if (localStorage.getItem('filter_period')) {
      inputFilter.value.period = getObject(props.authStore.getTypesPeriod, getItem('filter_period'));
      if (!inputFilter.value.period) {
        [inputFilter.value.period] = props.authStore.getTypesPeriod;
      }
    }
    if (localStorage.getItem('filter_date_start')) {
      inputFilter.value.dateStart = localStorage.getItem('filter_date_start');
    }
    if (localStorage.getItem('filter_date_finish')) {
      inputFilter.value.dateFinish = localStorage.getItem('filter_date_finish');
    }
    selected.value.length = 0;
    inputFilter.value.on = curentConfig.value.filters;
    columns.value.length = 0;
    props.authStore.authorizedRequest('get', `all_fields`).then((respFl) => {
      fields.value.push(...respFl.data.sort((a, b) => (a.name > b.name ? 1 : -1)));
      // если столбец тип работы скрыт по настройками фильтров
      const tw = columnsPerm.find((c) => c.name === 'type_work');
      if (curentConfig.value.filter_type_work !== -1) columns.value.push(tw);
      // если столбец тип активности скрыт по настройками фильтров
      const ta = columnsPerm.find((c) => c.name === 'type_activity');
      if (curentConfig.value.filter_type_activity !== -1) columns.value.push(ta);
      // формирование столбцов
      curentConfig.value.cols.forEach((col) => {
        const findCol = columnsPerm.find((c) => c.name === col.field);
        if (col.name !== undefined && col.name !== '') findCol.label = col.name;
        else findCol.label = findCol.name;
        columns.value.push(findCol);
        visibleColumns.value.push(findCol);
      });
      // установка фильтра тип работы
      inputFilter.value.type_works.length = 0;
      inputFilter.value.type_works.push(OPTION_ALL);
      inputFilter.value.type_works.push(...type_works.value);
      if (curentConfig.value.filters) inputFilter.value.type_work = getObject(inputFilter.value.type_works, getItem('filter_type_work'));
      else inputFilter.value.type_work = getObject(inputFilter.value.type_works, curentConfig.value.filter_type_work);
      if (!inputFilter.value.type_work) inputFilter.value.type_work = getObject(inputFilter.value.type_works, -1);
      // целевой объект
      activities.value.length = 0;
      props.authStore.authorizedRequest('get', `activities`).then((respA) => {
        activities.value.push(...respA.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
        if (!inputFilter.value.type_activity) inputFilter.value.type_activity = getObject(inputFilter.value.activities, -1);
        // источники поступления задач
        sources.value.length = 0;
        props.authStore.authorizedRequest('get', `sources`).then((respS) => {
          sources.value.push(...respS.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
          projects.value.length = 0;
          // проекты
          props.authStore.authorizedRequest('get', `projects`).then((respP) => {
            projects.value.push(...respP.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
            branches.value.length = 0;
            props.authStore.authorizedRequest('get', `branches`).then((respB) => {
              branches.value.push(...respB.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
              inputFilter.value.branches.length = 0;
              inputFilter.value.branches.push(OPTION_ALL);
              inputFilter.value.branches.push(...branches.value);
              if (curentConfig.value.filters) inputFilter.value.branch = getObject(inputFilter.value.branches, getItem('filter_branch'));
              else inputFilter.value.branch = getObject(inputFilter.value.branches, curentConfig.value.filter_branch);
              if (!inputFilter.value.branch) inputFilter.value.branch = getObject(inputFilter.value.branches, -1);
              inputFilter.value.activities.length = 0;
              inputFilter.value.activities.push(OPTION_ALL);
              inputFilter.value.activities.push(...(inputFilter.value.type_work.id === props.authStore.TYPE_WORK_PROJECT ? projects.value : activities.value));
              if (curentConfig.value.filters) inputFilter.value.type_activity = getObject(inputFilter.value.activities, getItem('filter_activity'));
              else inputFilter.value.type_activity = getObject(inputFilter.value.activities, curentConfig.value.filter_type_activity);
              users.value.length = 0;
              props.authStore.authorizedRequest('get', `users`).then((respU) => {
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
  } catch (err) {
    console.log(err);
    records.value.length = 0;
  }
}
function actionCreate() {
  const date = moment().format(datetimeFormat);
  localStorage.setItem('filter_date_finish', date);

  if (!isDateInRange(date, inputFilter.value.dateStart, inputFilter.value.dateFinish) && inputFilter.value.period.id !== 2) {
    [, inputFilter.value.period] = props.authStore.getTypesPeriod;
  }

  localStorage.setItem('filter_period', inputFilter.value.period.id);
  const createObject = {
    branch: branches.value.find((b) => b.id === props.authStore.getUser.branch).id,
    user: users.value.find((u) => u.email === props.authStore.getUser.email).id,
    type_activity: activities.value[0].id, // при условии что type_work = 0 (по умолчанию в БД)
    type_source: sources.value.find((s) => s.id === 9).id, // НЕТ по умолчанию
    dateStartOrder: date,
    dateFinishOrder: date,
  };
  if (!curentConfig.value.filters) {
    if (inputFilter.value.type_work.id !== -1) {
      createObject.type_work = inputFilter.value.type_work.id;
    }
    if (inputFilter.value.type_activity.id !== -1) {
      createObject.type_activity = inputFilter.value.type_activity.id;
    }
  }
  props.authStore.authorizedRequest('post', `records`, createObject).then((res) => {
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
  const date = moment().format(datetimeFormat);
  localStorage.setItem('filter_date_finish', date);
  props.authStore.authorizedRequest('get', `records/${selected.value[0].id}`).then((res) => {
    const copyingObject = res.data[0];
    delete copyingObject.id;
    delete copyingObject.createdAt;
    delete copyingObject.updatedAt;
    copyingObject.dateStartOrder = props.authStore.getTimeFormatForce(copyingObject.dateStartOrder, props.authStore.datetimeFormat);
    copyingObject.dateFinishOrder = props.authStore.getTimeFormatForce(copyingObject.dateFinishOrder, props.authStore.datetimeFormat);
    copyingObject.branch = branches.value.find((b) => b.id === props.authStore.getUser.branch).id;
    copyingObject.user = users.value.find((u) => u.email === props.authStore.getUser.email).id;
    props.authStore.authorizedRequest('post', `records`, copyingObject).then((resCopy) => {
      requestRecords(() => {
        selected.value.length = 0;
        const s = records.value.find((r) => r.id === resCopy.data);
        if (s) {
          selected.value.push(s);
        }
      });
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
  Promise.all(deletedQuery).then(() => requestRecords()).catch((err) => {
    console.log(err);
    props.showInfo('Ошибка удаления записи');
  });
}
function save(id, col, value) {
  if (col !== undefined && id !== undefined && value !== undefined) {
    const updateRow = {};
    updateRow[col] = value;
    props.authStore.authorizedRequest('post', `records/${id}`, updateRow).catch((err) => {
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
  }, 400); // Задержка 800мс
}
function updateFilterTypeWork() {
  inputFilter.value.activities.length = 0;
  inputFilter.value.activities.push(OPTION_ALL);
  inputFilter.value.activities.push(...(inputFilter.value.type_work.id === props.authStore.TYPE_WORK_PROJECT ? projects.value : activities.value));
  if (inputFilter.value.type_work.id === -1) {
    [inputFilter.value.type_activity] = inputFilter.value.activities;
  }
}
function saveForLocalStorage() {
  localStorage.setItem('filter_user', inputFilter.value.user.id);
  localStorage.setItem('filter_branch', inputFilter.value.branch.id);
  localStorage.setItem('filter_sort', inputFilter.value.sorted.id);
  localStorage.setItem('filter_type_work', inputFilter.value.type_work.id);
  localStorage.setItem('filter_activity', inputFilter.value.type_activity.id);
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
  [row.type_activity] = typeWId === props.authStore.TYPE_WORK_PROJECT ? projects.value : activities.value;
  const typeAId = row.type_activity.id;
  save(row.id, 'type_work', typeWId);
  save(row.id, 'type_activity', typeAId);
}
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
const getDataFormattedTable = () => {
  return table.value.filteredSortedRows.map((r) => {
    const e = { ...r };
    visibleColumns.value.forEach((col) => {
      e[col.name] = typeof col.field === 'function' ? col.field(r) : e[col.name];
      if (col.type === 'checkbox') {
        e[col.name] = e[col.name] === true ? '✓' : '';
      }
    });
    return e;
  });
}
function exportReport() {
  const data = {
    dateStart: inputFilter.value.dateStart,
    dateFinish: inputFilter.value.dateFinish,
    columns: visibleColumns.value,
    rows: getDataFormattedTable(),
    prefix: 'data',
  };
  props.authStore.downloadExcel('export/excel', data).catch((err) => {
    console.log(err);
  });
}
function generateReport() {
  if (curentConfig.value.prompt) {
    const countDays = props.authStore.getCountDaysFromPeriod(inputFilter.value.dateStart, inputFilter.value.dateFinish);
    if (countDays <= 7) {
      loadReport.value = true;
      dataPrompt.value = `${curentConfig.value.prompt}; Таблица с данными в формате CSV таблицы: ${props.authStore.jsonToCsv(getDataFormattedTable())}`;
      aiReport.value = true;
      props.authStore.authorizedRequest('post', 'ai/generate', { prompt: dataPrompt.value }).then((res) => {
        // Рендерим Markdown в HTML
        const htmlContent = md.render(res.data.response);
        messages.value.length = 0;
        // Добавляем сообщение с HTML
        messages.value.push({
          name: 'ИИ Помощник',
          text: htmlContent,
          sent: false,
          stamp: 'только что',
          bgColor: 'grey-2'
        });

        loadReport.value = false;
      }).catch((err) => {
        console.log(err);
        loadReport.value = false;
      });
    } else props.showInfo('Недопустимый период в запросе, оптимально - не более 7 дней');
  } else props.showInfo('Отсутствует промпт для ИИ помощника');
}
onMounted(() => {
  props.authStore.authorizedRequest('get', 'all_type_works').then((respTW) => {
    type_works.value.length = 0;
    type_works.value.push(...respTW.data);
    props.authStore.authorizedRequest('get', `configs/${id}`).then((respConf) => {
      const conf = respConf.data[0];
      conf.allow_views = JSON.parse(conf.allow_views);
      conf.allow_creates = JSON.parse(conf.allow_creates);
      conf.allow_delete = JSON.parse(conf.allow_delete);
      conf.allow_edit = JSON.parse(conf.allow_edit);
      conf.cols = JSON.parse(conf.cols);
      curentConfig.value = conf;
      document.title = curentConfig.value.name;
      update();
    }).catch(() => {
      props.showError('Ошибка загрузки конфигурации');
    });
  }).catch(() => {
    props.showError('Ошибка загрузки типов работы');
  });
});
onUnmounted(() => {
  Object.values(debounceTimers).forEach((timer) => clearTimeout(timer));
});
</script>
