<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer q-pa-none q-ma-none`" square
    :dark="props.dark" dense flat wrap-cells :rows="rows" :columns="columns" row-key="id" virtual-scroll
    :hide-selected-banner="true" selection="none" binary-state-sort :hide-pagination="false"
    v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]" grid-header no-data-label="Нет данных"
    :filter="filter" v-model:expanded="expanded" v-model:selected="selected" @row-click="selectRow"
    :style="`height: ${props.contentHeight}px;`">
    <template v-slot:top>
      <q-card-actions class="fit">
        <PPBtnAdd :dark="props.dark" :click="() => {
          dialogAdd = true;
          modelInput.name = '';
          selected.length = 0;
        }" />
        <PPBtn :dark="props.dark" v-show="selected.length > 0" icon="edit" @click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" />
        <PPBtn :dark="props.dark" icon="delete" v-show="selected.length > 0" @click="remove" />
        <q-space />
        <PPSearchInput v-model="filter" :dark="props.dark" />
      </q-card-actions>
    </template>
    <template v-slot:pagination>
      {{ selected.length === 0 ? `Всего объектов: ${rows.length}` : `Объектов выбрано:
      ${selected.length} из ${rows.length}` }}
    </template>
    <template v-slot:header-cell="props">
      <q-th :props="props">
        <div class="text-size">{{ props.col.label }}</div>
      </q-th>
    </template>

    <template v-slot:body-cell="props">
      <q-td :props="props" class="no-pa-ma">

        <div v-if="props.col.type == 'checkbox'">
          <PPCheckbox v-if="!(props.col.funcDisable ? props.col.funcDisable(props.row) : true)"
            v-model="props.row[props.col.name]" :dark="props.dark" @update:model-value="(val) => {
              selected[0] = props.row;
              save(props.col.name, val);
            }" />
        </div>
        <PPInputSingle input-style="text-align: center;"
          v-else-if="(props.col.type == 'text' || props.col.type == 'textarea') && isSelect(props.row.id)" type="text"
          :dark="props.dark" autogrow v-model.text="props.row[props.col.name]" hide-bottom-space hide-hint @keydown="(event) => {
            handleKeydown(event, props.col.name, props.row[props.col.name]);
          }" @blur="(val) => {
            save(props.col.name, props.row[props.col.name]);
          }">
        </PPInputSingle>
        <PPInputSingle input-style="text-align: center;"
          v-else-if="props.col.type == 'number' && isSelect(props.row.id)" type="text" :dark="props.dark"
          v-model="props.row[props.col.name]" @update:model-value="(val) => {
            save(props.col.name, val);
          }">
        </PPInputSingle>
        <div v-else-if="props.col.type == 'selector' && isSelect(props.row.id)">
          <PPSimpleSelect v-if="!(props.col.funcDisable ? props.col.funcDisable(props.row, props.col) : true)"
            :dark="props.dark" :options="props.col.options(props.row)" option-value="id"
            v-model="props.row[props.col.name]" @update:model-value="(val) => {
              save(props.col.name, val.id);
            }" input-style="text-align: center;" popup-content-class="text-size" />
        </div>
        <PPBtn v-else-if="props.col.type == 'table'" icon="edit" :dark="props.dark"
          :disable="props.col.funcDisable ? props.col.funcDisable(props.row, props.col) : true"
          :click="() => props.row.colTableVisible = true">
          <PPDialog v-model="props.row.colTableVisible" label="Настройка столбцов" persistent :dark="props.dark"
            styleContent="width: 90vw; max-width: 90vw; height: 85vh;">
            <q-card-actions>
              <PPBtnAdd label="Новый столбец" :click="() => {
                props.row.colTableSelected.length = 0;
                const typeColumns = props.col.columns(props.row);
                if (typeColumns === 'allWorks') {
                  addColumnForColTable(props.row.cols);
                } else if (typeColumns === 'projectWorks') {
                  addColumnForColTableProject(props.row.cols);
                }
              }" :dark="props.dark" />
              <PPBtn v-if="props.row.colTableSelected.length > 0" icon="delete" :click="() => {
                deleteColumnForColTable(props.row.cols, props.row.colTableSelected);
              }" :dark="props.dark" />
              <PPBtn v-if="props.row.colTableSelected.length === 1" label="Вверх" icon="arrow_upward" :click="() => {
                moveUpColumnForColTable(props.row.cols, props.row.colTableSelected);
              }" :dark="props.dark" />
              <PPBtn v-if="props.row.colTableSelected.length === 1" label="Вниз" icon="arrow_downward" :click="() => {
                moveDownColumnForColTable(props.row.cols, props.row.colTableSelected);
              }" :dark="props.dark" />
              <PPBtn label="Сохранить" icon="save" :click="() => {
                const typeColumns = props.col.columns(props.row);
                if (typeColumns === 'allWorks') {
                  saveColTable(props.row.cols);
                } else if (typeColumns === 'projectWorks') {
                  saveColTableProject(props.row.cols)
                }
              }" :dark="props.dark" />
              <PPBtn v-if="props.row.colTableSelected.length > 0" label="Копировать строки" icon="content_copy" :click="() => {
                copyColTable(props.row.colTableSelected);
              }" :dark="props.dark" />
              <PPBtn v-if="bufferTable.length > 0" label="Вставить строки" icon="content_paste" :click="() => {
                props.row.colTableSelected.length = 0;
                pasteColTable(props.row.cols);
              }" :dark="props.dark" />
            </q-card-actions>
            <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer text-size`" square
              :dark="props.dark" dense flat :rows="props.row.cols" :columns="props.col.columns(props.row) === 'allWorks' ? [
                {
                  name: 'name',
                  required: true,
                  align: 'left',
                  label: 'Наименование',
                  field: 'name',
                  edit: true,
                  type: 'text',
                  style: 'width: 300px;'
                },
                {
                  name: 'type_metric',
                  label: 'Метрика',
                  align: 'center',
                  sortable: true,
                  field: (row) => (row.type_metric ? row.type_metric.name : ''),
                  edit: true,
                  type: 'selector',
                  options: () => type_metrics,
                },
                {
                  name: 'type_work',
                  label: 'Тип работы',
                  align: 'center',
                  sortable: true,
                  field: (row) => (row.type_activity ? row.type_activity.name : ''),
                  edit: true,
                  type: 'selector',
                  options: () => type_works_mod,
                  update: (row) => {
                    row.type_activity = row.type_work.id === TYPE_WORK_PROJECT ? projects_mod[0] : type_activities_mod[0];
                  },
                },
                {
                  name: 'type_activity',
                  label: 'Целевой объект',
                  align: 'center',
                  sortable: true,
                  field: (row) => (row.type_activity ? row.type_activity.name : ''),
                  edit: true,
                  type: 'selector',
                  options: (row) => row.type_work ? row.type_work.id === TYPE_WORK_PROJECT ? projects_mod : type_activities_mod : [],
                  style: 'width: 250px;'
                },
                {
                  name: 'type_source',
                  label: 'Источник поступления',
                  align: 'center',
                  sortable: true,
                  field: 'type_source',
                  edit: true,
                  type: 'selector_multiple',
                  options: () => type_sources_mod,
                },
                {
                  name: 'type_work_progress',
                  label: 'Прогресс',
                  align: 'center',
                  field: 'type_work_progress',
                  edit: true,
                  type: 'selector',
                  options: () => type_work_progress,
                },
                {
                  name: 'type_conditions',
                  label: 'Доп. условия',
                  align: 'center',
                  field: 'type_conditions',
                  edit: true,
                  type: 'selector_multiple',
                  options: () => type_conditions,
                },
                {
                  name: 'color_bg',
                  label: 'Цвет фона',
                  align: 'center',
                  field: 'color_bg',
                  edit: true,
                  type: 'color_picked',
                },
              ] : [
                {
                  name: 'name',
                  required: true,
                  align: 'left',
                  label: 'Наименование',
                  field: 'name',
                  edit: true,
                  type: 'text',
                  style: 'width: 300px;'
                },
                {
                  name: 'type_activity',
                  label: 'Проект',
                  align: 'center',
                  sortable: true,
                  field: (row) => (row.type_activity ? row.type_activity.name : ''),
                  edit: true,
                  type: 'selector',
                  options: () => projects,
                  style: 'width: 250px;'
                },
              ]" row-key="id" virtual-scroll :hide-selected-banner="true" :hide-header="props.row.cols.length === 0"
              selection="multiple" binary-state-sort :color="`${props.dark ? 'orange' : 'green'}`"
              :hide-pagination="true" v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]"
              wrap-cells :hide-no-data="true" :filter="filter" v-model:selected="props.row.colTableSelected"
              style="height: 74vh; width: 100%;" class="text-size">
              <template v-slot:body-cell="props">
                <q-td :props="props">
                  <PPCheckbox v-if="props.col.type == 'checkbox'" v-model="props.row[props.col.name]" :dark="props.dark"
                    class="text-size" />
                  <q-input v-if="props.col.type == 'color_picked'" :dark="props.dark" dense square class="text-size"
                    v-model="props.row[props.col.name]"
                    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`">
                    <template v-slot:append>
                      <q-icon name="colorize" class="cursor-pointer">
                        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                          <q-color class="text-size" v-model="props.row[props.col.name]" />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                  <PPInputSingle v-else-if="props.col.type == 'text'" type="text" :dark="props.dark"
                    v-model="props.row[props.col.name]" class="text-size" />
                  <PPSimpleSelect :dark="props.dark" class="text-size" v-else-if="props.col.type == 'selector'"
                    :options="props.col.options(props.row)" option-value="id" v-model="props.row[props.col.name]"
                    popup-content-class="text-size" @update:model-value="() => {
                      if (props.col.update) {
                        props.col.update(props.row);
                      }
                    }" />
                  <PPMultipleSelect :dark="props.dark" v-else-if="props.col.type == 'selector_multiple'"
                    v-model="props.row[props.col.name]" :options="props.col.options(props.row)" />
                  <div v-else class="text-size"> {{ props.value }}</div>
                </q-td>
              </template>
            </q-table>
          </PPDialog>
        </PPBtn>
        <PPMultipleSelect :dark="props.dark" v-else-if="props.col.type == 'selector_multiple' && isSelect(props.row.id)"
          v-model="props.row[props.col.name]" :options="props.col.options(props.row)" @update:model-value="(val) => {
            saveMultipleSelection(props.col.name, val);
          }" />
        <div v-else class="text-size">
          <span v-if="!(props.col.funcDisable ? props.col.funcDisable(props.row, props.col) : false)">
            <span v-if="props.col.type === 'selector_multiple'" class="row fit items-center">
              <div v-for="data in props.row[props.col.name]" :key="data">
                <q-chip dense text-color="secondary"
                  :class="`${props.dark ? 'bg-orange-9 text-white' : 'bg-green text-white'} q-ma-xs text-size`">
                  {{ data.name }}
                </q-chip>
              </div>
              <div v-if="props.row[props.col.name].length === 0" class="q-pa-sm text-size">
                {{ STRING_NO_SELECT }}
              </div>
            </span>
            <span v-else class="text-size">
              {{ props.value }}
            </span>
          </span>
        </div>
      </q-td>
    </template>

  </q-table>
  <q-dialog v-model="dialogAdd" persistent>
    <q-card :class="`${props.dark ? 'pp-dark' : 'pp-light'} q-pt-none`" :dark="props.dark"
      style="width: 400px; max-width: 95vw;">
      <q-bar :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`" :dark="props.dark">
        <div class="text-h6">Новая конфигурация отчёта</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <form @submit.prevent="add">
          <PPInputSingle :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
          <PPBtn :dark="props.dark" class="q-ma-md" type="submit">Создать</PPBtn>
        </form>
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-dialog v-model="dialogUpdate" persistent>
    <q-card :class="`${props.dark ? 'pp-dark' : 'pp-light'} q-pt-none`" :dark="props.dark" class="q-pt-none"
      style="width: 400px; max-width: 95vw;">
      <q-bar :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`" :dark="props.dark">
        <div class="text-h6">Изменение данных конфигурации отчёта</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <form @submit.prevent="change">
          <PPInputSingle :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
          <PPBtn :dark="props.dark" class="q-ma-md" type="submit">Изменить</PPBtn>
        </form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup>
import {
  onMounted,
  ref,
  defineProps,
} from 'vue';
import { type_works, TYPE_WORK_PROJECT } from 'src/pages/services/time_tracking/type_works.js';
import { type_metrics } from 'src/pages/services/time_tracking/type_metrics.js';
import { type_work_progress } from 'src/pages/services/time_tracking/type_work_progress.js';
// import { type_conditions } from 'src/pages/services/time_tracking/type_conditions.js';
import { getObject } from 'src/pages/services/time_tracking/fun.js';
import PPBtnAdd from 'src/components/buttons/PPBtnAdd.vue';
import PPBtn from 'src/components/TTBtn.vue';
import PPDialog from 'src/components/dialogs/PPDialog.vue';
import PPSearchInput from 'src/components/inputs/PPSearchInput.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';
import PPCheckbox from 'src/components/PPCheckbox.vue';
import PPSimpleSelect from 'src/components/selects/PPSimpleSelect.vue';
import PPMultipleSelect from 'src/components/selects/PPMultipleSelect.vue';
import { TYPE_REPORT_BRANCH, TYPE_REPORT_INDIVIDUAL, TYPE_REPORT_PROJECT_INDIVIDUAL } from './type_reports';
import { getNewId, OPTION_ALL } from './fun';

document.title = 'Настройки отчётов';
const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  contentHeight: Number,
  authStore: Object,
});

const rows = ref([]);
const filter = ref('');
const selected = ref([]);
const dialogAdd = ref(false);
const dialogUpdate = ref(false);

function isSelect(_id) {
  return selected.value.findIndex((s) => s.id === _id) !== -1;
}
const modelInput = ref({
  name: '',
});
const pagination = ref({
  rowsPerPage: 0,
});
const bufferTable = ref([]);
const branches_mod = ref([]);
const users_mod = ref([]);
const type_works_mod = ref([]);
const type_activities_mod = ref([]);
const type_sources_mod = ref([]);
const projects = ref([]);
const projects_mod = ref([]);
const type_conditions = [];
const type_reports = [];
const columns = ref([
  {
    name: 'name',
    label: 'Наименование',
    align: 'center',
    field: 'name',
    required: true,
  },
  {
    name: 'type',
    label: 'Тип отчёта',
    align: 'center',
    field: (row) => row.type.name,
    edit: true,
    type: 'selector',
    options: () => type_reports,
    style: 'min-width: 200px;',
    funcDisable: () => false,
  },
  {
    name: 'cols',
    label: 'Столбцы',
    align: 'center',
    field: 'cols',
    edit: true,
    type: 'table',
    columns: (row) => ((row.type.id === TYPE_REPORT_INDIVIDUAL || row.type.id === TYPE_REPORT_BRANCH) ? 'allWorks' : 'projectWorks'),
    funcDisable: () => false,
  },
  {
    name: 'filter_branches',
    label: 'Фильтр подразделений',
    align: 'center',
    field: 'filter_branches',
    edit: true,
    type: 'selector_multiple',
    options: () => branches_mod.value,
    style: 'min-width: 200px;',
    funcDisable: () => false,
  },
  {
    name: 'allow_view',
    label: 'Просмотр отчёта',
    align: 'center',
    field: 'allow_view',
    edit: true,
    type: 'selector_multiple',
    options: () => branches_mod.value,
    style: 'min-width: 200px;',
    funcDisable: () => false,
  },
  {
    name: 'description',
    label: 'Комментарий',
    align: 'center',
    field: 'description',
    edit: true,
    type: 'textarea',
    funcDisable: () => false,
  },
]);

function update() {
  type_works_mod.value.length = 0;
  type_works_mod.value.push(OPTION_ALL);
  type_works_mod.value.push(...type_works);

  users_mod.value.length = 0;
  props.authStore.authorizedRequest('get', `users`).then((respU) => {
    users_mod.value.push({
      id: -1,
      name: 'Все',
    });
    users_mod.value.push(...respU.data);
    branches_mod.value.length = 0;
    props.authStore.authorizedRequest('get', `branches`).then((respB) => {
      branches_mod.value.push(...respB.data);
      projects_mod.value.length = 0;
      props.authStore.authorizedRequest('get', `all_projects`).then((respP) => {
        projects.value.push(...respP.data);
        projects_mod.value.push({
          id: -1,
          name: 'Все',
        });
        projects_mod.value.push(...respP.data);
        type_activities_mod.value.length = 0;
        props.authStore.authorizedRequest('get', `all_activities`).then((respA) => {
          type_activities_mod.value.push({
            id: -1,
            name: 'Все',
          });
          type_activities_mod.value.push(...respA.data);
          type_sources_mod.value.length = 0;
          props.authStore.authorizedRequest('get', `sources`).then((respS) => {
            type_sources_mod.value.push(...respS.data);
            rows.value.length = 0;
            props.authStore.authorizedRequest('get', `all_reports`).then((resp) => {
              resp.data.forEach((element) => {
                try {
                  // тип отчёта
                  element.type = getObject(type_reports, element.type);

                  // доступ к просмотру
                  element.allow_view = JSON.parse(element.allow_view);
                  element.allow_view.forEach((e, i) => {
                    element.allow_view[i] = getObject(branches_mod.value, e);
                  });

                  // фильтр подразделений
                  element.filter_branches = JSON.parse(element.filter_branches);
                  element.filter_branches.forEach((e, i) => {
                    element.filter_branches[i] = getObject(branches_mod.value, e);
                  });

                  element.colTableVisible = false;
                  element.cols = JSON.parse(element.cols);

                  element.cols.forEach((r) => {
                    if (element.type.id === TYPE_REPORT_INDIVIDUAL || element.type.id === TYPE_REPORT_BRANCH) {
                      r.type_work = getObject(type_works_mod.value, r.type_work);
                      r.type_source.forEach((e, i) => {
                        r.type_source[i] = getObject(type_sources_mod.value, e);
                      });
                      r.type_metric = getObject(type_metrics, r.type_metric);
                      r.type_work_progress = getObject(type_work_progress, r.type_work_progress);
                      r.type_conditions.forEach((e, i) => {
                        r.type_conditions[i] = getObject(type_conditions, e);
                      });
                      r.type_activity = getObject(r.type_work.id === TYPE_WORK_PROJECT ? projects_mod.value : type_activities_mod.value, r.type_activity);
                    } else if (element.type.id === TYPE_REPORT_PROJECT_INDIVIDUAL) {
                      r.type_activity = getObject(projects.value, r.type_activity);
                    }
                  });
                  element.colTableSelected = [];
                  rows.value.push(element);
                } catch (err) {
                  console.log(err);
                }
              });
            }).catch((err) => {
              console.log(err);
            });
          });
        });
      });
    });
  });
}
function selectRow(event, row) {
  selected.value.length = 0;
  selected.value.push(row);
}
function add() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest(`/services/genprice/TimeTrackingReport/create`, query)
    .then((res) => {
      dialogAdd.value = false;
      if (res.data.result === 'ok') {
        update();
      } else if (res.data.data === 'name must be unique') {
        props.showError(`Конфигурация отчёта "${query.name}" уже существует в базе данных`);
      }
    });
}
function change() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest(`/services/genprice/TimeTrackingReport/update/${selected.value[0].id}`, query)
    .then((res) => {
      dialogUpdate.value = false;
      if (res.data.result === 'ok') {
        update();
      } else if (res.data.data === 'name must be unique') {
        props.showError(`Конфигурация отчёта "${query.name}" уже существует в базе данных`);
      }
    });
}

function remove() {
  props.showConfirm(`Удалить конфигурацию отчёта ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest(`/services/genprice/TimeTrackingReport/delete/${selected.value[0].id}`).then(() => {
      update();
    });
  });
}
function save(col, value) {
  const updateRow = {};
  updateRow[col] = value;
  props.authStore.authorizedRequest(`/services/genprice/TimeTrackingReport/update/${selected.value[0].id}`, updateRow);
}
function handleKeydown(event, col, val) {
  if (event.key === 'Enter') {
    if (!event.shiftKey) {
      save(col, val);
      event.preventDefault();
      selected.value.length = 0;
    }
  }
}
function saveMultipleSelection(col, val) {
  save(col, JSON.stringify(val.map((obj) => obj.id)));
}
function addColumnForColTable(_rows) {
  const id = getNewId(_rows);
  _rows.push({
    id,
    name: 'Новый столбец 1',
    type_metric: type_metrics[0],
    type_work: type_works[0],
    type_activity: type_activities_mod.value[0],
    type_source: [],
    type_conditions: [],
    type_work_progress: type_work_progress[0],
    color_bg: '',
  });
}
function addColumnForColTableProject(_rows) {
  const id = getNewId(_rows);
  _rows.push({
    id,
    name: 'Новый столбец 1',
    type_activity: projects.value[0],
  });
}
function deleteColumnForColTable(_rows, _selected) {
  const s = _rows.filter((obj1) => !_selected.some((obj2) => obj1.id === obj2.id));
  _rows.length = 0;
  _rows.push(...s);
  _selected.length = 0;
}
function moveObject(array, obj, direction) {
  const index = array.findIndex((item) => item.id === obj.id);
  if (index === -1) {
    return;
  }
  if (direction === 1) {
    if (index === 0) {
      return;
    }
    const temp = array[index];
    array[index] = array[index - 1];
    array[index - 1] = temp;
  } else if (direction === 0) {
    if (index === array.length - 1) {
      return;
    }
    const temp = array[index];
    array[index] = array[index + 1];
    array[index + 1] = temp;
  }
}
function moveUpColumnForColTable(_rows, _selected) {
  moveObject(_rows, _selected[0], 1);
}
function moveDownColumnForColTable(_rows, _selected) {
  moveObject(_rows, _selected[0], 0);
}
function saveColTable(tableRows) {
  try {
    const queryTableRows = JSON.parse(JSON.stringify(tableRows));
    queryTableRows.forEach((r) => {
      r.type_work = r.type_work.id;
      r.type_activity = r.type_activity.id;
      r.type_source = r.type_source.map((obj) => obj.id);
      r.type_conditions = r.type_conditions.map((obj) => obj.id);
      r.type_metric = r.type_metric.id;
      r.type_work_progress = r.type_work_progress.id;
    });
    save('cols', JSON.stringify(queryTableRows));
  } catch (err) {
    console.log(err);
  }
}
function saveColTableProject(tableRows) {
  try {
    const queryTableRows = JSON.parse(JSON.stringify(tableRows));
    queryTableRows.forEach((r) => {
      r.type_activity = r.type_activity.id;
    });
    save('cols', JSON.stringify(queryTableRows));
  } catch (err) {
    console.log(err);
  }
}
function copyColTable(tableRows) {
  const queryTableRows = JSON.parse(JSON.stringify(tableRows));
  bufferTable.value.length = 0;
  bufferTable.value.push(...queryTableRows);
}
function pasteColTable(tableRows) {
  bufferTable.value.forEach((element) => {
    element.id = getNewId(tableRows);
    tableRows.push(element);
  });
  bufferTable.value.length = 0;
}
onMounted(() => {
  type_reports.length = 0;
  props.authStore.authorizedRequest('get', `all_type_reports`).then((resTypeReports) => {
    type_reports.push(...resTypeReports.data);
    type_conditions.length = 0;
    props.authStore.authorizedRequest('get', `all_type_conditions`).then((resTypeConditions) => {
      type_conditions.push(...resTypeConditions.data);
      update();
    });
  });
});
</script>
