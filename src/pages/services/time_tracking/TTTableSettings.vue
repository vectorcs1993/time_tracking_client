<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer q-pa-none q-ma-none`" square
    :dark="props.dark" dense flat wrap-cells :rows="rows" :columns="columns" row-key="id" virtual-scroll
    :hide-selected-banner="true" selection="none" binary-state-sort :hide-pagination="false"
    v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]" grid-header no-data-label="Нет данных"
    :filter="filter" v-model:selected="selected" @row-click="selectRow" :style="`height: ${props.contentHeight}px;`">
    <template v-slot:top>
      <q-card-actions class="fit">
        <PPBtnAdd :dark="props.dark" :click="() => {
          dialogAdd = true;
          modelInput.name = '';
          selected.length = 0;
        }" />
        <PPBtn :dark="props.dark" v-show="selected.length > 0" label="Переименовать" icon="edit" :click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" />
        <PPBtn :dark="props.dark" v-show="selected.length > 0" icon="delete" :click="remove" />
        <q-space />

        <PPSearchInput v-model="filter" :dark="props.dark" />

      </q-card-actions>
    </template>
    <template v-slot:pagination>
      <div class="text-size">
        {{ selected.length === 0 ? `Всего объектов: ${rows.length}` : `Объектов выбрано:
        ${selected.length} из ${rows.length}` }}
      </div>
    </template>
    <template v-slot:header-cell="props">
      <q-th :props="props">
        <div class="text-size">{{ props.col.label }}</div>
      </q-th>
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props" class="no-pa-ma text-size">
        <PPCheckbox v-if="props.col.type == 'checkbox'" v-model="props.row[props.col.name]" :dark="props.dark"
          class="text-size" @update:model-value="(val) => {
            selected[0] = props.row;
            save(props.col.name, val);
          }" />
        <PPInputSingle input-style="text-align: center;"
          v-else-if="props.col.type == 'number' && isSelect(props.row.id)" type="text" :dark="props.dark"
          class="text-size" v-model.text="props.row[props.col.name]" @update:model-value="(val) => {
            save(props.col.name, val);
          }">
        </PPInputSingle>
        <PPInputSingle input-style="text-align: center;" class="text-size"
          v-else-if="(props.col.type == 'text' || props.col.type == 'textarea') && isSelect(props.row.id)" type="text"
          :dark="props.dark" autogrow v-model.text="props.row[props.col.name]" hide-bottom-space hide-hint @keydown="(event) => {
            handleKeydown(event, props.col.name, props.row[props.col.name]);
          }" @blur="(val) => {
            save(props.col.name, props.row[props.col.name]);
          }">
        </PPInputSingle>
        <PPSimpleSelect :disable="isDisable(props.col.name, props.row)" class="text-size"
          v-else-if="props.col.type == 'selector' && isSelect(props.row.id)" :dark="props.dark"
          :options="props.col.options(props.row)" option-value="id" v-model.number="props.row[props.col.name]"
          @update:model-value="(val) => {
            if (props.col.name === 'filter_type_work') {
              updateFilterTypeWork(props.row);
            } else {
              save(props.col.name, val.id);
            }

          }" />
        <PPMultipleSelect :dark="props.dark" v-else-if="props.col.type == 'selector_multiple' && isSelect(props.row.id)"
          class="text-size" v-model="props.row[props.col.name]" :options="props.col.options(props.row)"
          @update:model-value="(val) => {
            saveMultipleSelection(props.col.name, val);
          }" />
        <PPBtn class="text-size" v-else-if="props.col.type == 'table'" icon="edit" :dark="props.dark"
          :click="() => props.row.colTableVisible = true">
          <PPDialog v-model="props.row.colTableVisible" :label="`${props.row.name} --> Настройка столбцов`"
            :dark="props.dark" styleContent="width: 90vw; max-width: 90vw; height: 85vh;">
            <q-card-actions>
              <PPBtnAdd label="Новый столбец" :click="() => {
                props.row.colTableSelected.length = 0;
                addColumnForColTable(props.row.cols);
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
                saveColTable(props.row.cols);
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
              :dark="props.dark" dense flat :rows="props.row.cols" :columns="[
                {
                  name: 'name',
                  required: true,
                  align: 'left',
                  label: 'Наименование',
                  field: 'name',
                  edit: true,
                  type: 'text',
                },
                {
                  name: 'field',
                  label: 'Поле',
                  align: 'center',
                  sortable: true,
                  field: (row) => (row.field ? row.field.name : ''),
                  edit: true,
                  type: 'selector',
                  options: () => fields,
                },
                {
                  name: 'allow_edit',
                  label: 'Разрешить редактирование',
                  align: 'center',
                  sortable: true,
                  field: 'allow_edit',
                  edit: true,
                  type: 'selector_multiple',
                  options: () => branches,
                },
                {
                  name: 'color_bg',
                  label: 'Цвет фона при активации(только для checkbox)',
                  align: 'center',
                  field: 'color_bg',
                  edit: true,
                  type: 'color_picked',
                },
              ]" row-key="id" virtual-scroll :hide-selected-banner="true" :hide-header="props.row.cols.length === 0"
              selection="multiple" binary-state-sort :color="`${props.dark ? 'orange' : 'green'}`"
              :hide-pagination="true" v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]"
              wrap-cells :hide-no-data="true" :filter="filter" v-model:selected="props.row.colTableSelected"
              style="height: 74vh; width: 100%;">
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
                  <PPSimpleSelect :dark="props.dark" v-else-if="props.col.type == 'selector'"
                    :options="props.col.options(props.row)" option-value="id" v-model="props.row[props.col.name]"
                    @update:model-value="() => {
                      if (props.col.update) {
                        props.col.update(props.row);
                      }
                    }" class="text-size" />
                  <PPMultipleSelect :dark="props.dark" v-else-if="props.col.type == 'selector_multiple'"
                    v-model="props.row[props.col.name]" :options="props.col.options(props.row)" />
                  <div v-else class="text-size"> {{ props.value }}</div>
                </q-td>
              </template>
            </q-table>
          </PPDialog>
        </PPBtn>
        <div v-else class="text-size">
          <span v-if="!(props.col.funcDisable ? props.col.funcDisable(props.row, props.col) : false)">
            <span v-if="props.col.type === 'selector_multiple'" class="row fit items-center">
              <div v-for="data in props.row[props.col.name]" :key="data">
                <q-chip text-color="secondary" dense
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
    <q-card :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark" class="text-white q-pt-none"
      style="width: 400px; max-width: 95vw;">
      <q-bar :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`" :dark="props.dark">
        <div class="text-h6">Новая конфигурация таблицы</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip>Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark">
        <form @submit.prevent="add">
          <PPInputSingle :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
          <PPBtn :dark="props.dark" class="q-ma-md" type="submit">Создать</PPBtn>
        </form>
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-dialog v-model="dialogUpdate" persistent>
    <q-card :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark" class="q-pt-none"
      style="width: 400px; max-width: 95vw;">
      <q-bar :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`" :dark="props.dark">
        <div class="text-h6">Изменение данных конфигурации таблицы</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-grey text-white">Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark">
        <form @submit.prevent="change">
          <PPInputSingle :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
          <PPBtn class="q-ma-md" type="submit">Изменить</PPBtn>
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
import { getObject } from 'src/pages/services/time_tracking/fun.js';
import PPBtn from 'src/components/TTBtn.vue';
import PPBtnAdd from 'src/components/buttons/PPBtnAdd.vue';
import PPDialog from 'src/components/dialogs/PPDialog.vue';
import PPSearchInput from 'src/components/inputs/PPSearchInput.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';
import PPCheckbox from 'src/components/PPCheckbox.vue';
import PPSimpleSelect from 'src/components/selects/PPSimpleSelect.vue';
import PPMultipleSelect from 'src/components/selects/PPMultipleSelect.vue';
import { getNewId, OPTION_ALL, STRING_NO_SELECT } from './fun';

document.title = 'Настройки таблиц';
const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  authStore: Object,
  contentHeight: Number,
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
const branches = ref([]);
const branches_mod = ref([]);
const type_works_mod = ref([]);
const type_activities_mod = ref([]);
const projects_mod = ref([]);
const fields = ref([]);
const colsGlobal = [
  {
    name: 'name',
    label: 'Наименование',
    align: 'center',
    field: 'name',
    required: true,
  },
  {
    name: 'filters',
    label: 'Показывать фильтры',
    align: 'center',
    field: 'filters',
    edit: true,
    type: 'checkbox',
  },
  {
    name: 'filter_branch',
    label: 'Фильтр подразделение',
    align: 'center',
    field: (row) => row.filter_branch.name,
    edit: true,
    type: 'selector',
    options: () => branches_mod.value,
    style: 'min-width: 100px;',
  },
  {
    name: 'filter_type_work',
    label: 'Фильтр тип работы',
    align: 'center',
    field: (row) => row.filter_type_work.name,
    edit: true,
    type: 'selector',
    options: () => type_works_mod.value,
    style: 'min-width: 150px;',
  },
  {
    name: 'filter_type_activity',
    label: 'Фильтр целевой объект',
    align: 'center',
    field: (row) => row.filter_type_activity.name,
    edit: true,
    type: 'selector',
    options: (row) => (row.filter_type_work.id === TYPE_WORK_PROJECT ? projects_mod.value : type_activities_mod.value),
    style: 'min-width: 150px;',
  },
  {
    name: 'cols',
    label: 'Столбцы',
    align: 'center',
    field: 'cols',
    edit: true,
    type: 'table',
  },
  {
    name: 'allow_views',
    label: 'Просмотр',
    align: 'center',
    field: 'allow_views',
    edit: true,
    type: 'selector_multiple',
    options: () => branches.value,
  },
  {
    name: 'allow_creates',
    label: 'Добавление',
    align: 'center',
    field: 'allow_creates',
    edit: true,
    type: 'selector_multiple',
    options: () => branches.value,
  },
  {
    name: 'allow_delete',
    label: 'Удаление',
    align: 'center',
    field: 'allow_delete',
    edit: true,
    type: 'selector_multiple',
    options: () => branches.value,
  },
  {
    name: 'deleteOnlySome',
    label: 'Удалять только свои',
    align: 'center',
    field: 'deleteOnlySome',
    edit: true,
    type: 'checkbox',
  },
  {
    name: 'allow_edit',
    label: 'Изменение',
    align: 'center',
    field: 'allow_edit',
    edit: true,
    type: 'selector_multiple',
    options: () => branches.value,
  },
  {
    name: 'changeOnlySome',
    label: 'Изменять только свои',
    align: 'center',
    field: 'changeOnlySome',
    edit: true,
    type: 'checkbox',
  },
  {
    name: 'description',
    label: 'Комментарий',
    align: 'center',
    field: 'description',
    edit: true,
    type: 'text',
  },
];

const bufferTable = ref([]);
const columns = ref(colsGlobal);

function update() {
  console.log('respFl');
  props.authStore.authorizedRequest('get', `all_fields`).then((respFl) => {
    fields.value.push(...respFl.data.map((s) => {
      const e = s;
      e.tag = s.name;
      e.name = `${s.name} (${s.type})`;
      return e;
    }).sort((a, b) => (a.name > b.name ? 1 : -1)));

    type_works_mod.value.length = 0;
    type_works_mod.value.push(OPTION_ALL);
    type_works_mod.value.push(...type_works);
    branches.value.length = 0;
    branches_mod.value.length = 0;
    props.authStore.authorizedRequest('get', `branches`).then((respB) => {
      branches_mod.value.push(OPTION_ALL);
      branches_mod.value.push(...respB.data);
      branches.value.push(...respB.data);
      projects_mod.value.length = 0;
      props.authStore.authorizedRequest('get', `all_projects`).then((respP) => {
        projects_mod.value.push(OPTION_ALL);
        projects_mod.value.push(...respP.data);
        type_activities_mod.value.length = 0;
        props.authStore.authorizedRequest('get', `all_activities`).then((respA) => {
          type_activities_mod.value.push(OPTION_ALL);
          type_activities_mod.value.push(...respA.data);
          rows.value.length = 0;
          props.authStore.authorizedRequest('get', `all_configs`).then((resp) => {
            resp.data.forEach((element) => {
              // доступ к просмотру
              element.allow_views = JSON.parse(element.allow_views);
              element.allow_views.forEach((e, i) => {
                element.allow_views[i] = getObject(branches.value, e);
              });
              // доступ к созданию записей
              element.allow_creates = JSON.parse(element.allow_creates);
              element.allow_creates.forEach((e, i) => {
                element.allow_creates[i] = getObject(branches.value, e);
              });
              // доступ к удалению записей
              element.allow_delete = JSON.parse(element.allow_delete);
              element.allow_delete.forEach((e, i) => {
                element.allow_delete[i] = getObject(branches.value, e);
              });
              // доступ к изменению записей
              element.allow_edit = JSON.parse(element.allow_edit);
              element.allow_edit.forEach((e, i) => {
                element.allow_edit[i] = getObject(branches.value, e);
              });

              element.filter_type_work = getObject(type_works_mod.value, element.filter_type_work);
              element.filter_type_activity = getObject(element.filter_type_work.id === TYPE_WORK_PROJECT ? projects_mod.value : type_activities_mod.value, element.filter_type_activity);
              element.filter_branch = getObject(branches_mod.value, element.filter_branch);

              element.colTableVisible = false;
              element.cols = JSON.parse(element.cols);
              element.cols.forEach((r) => {
                r.field = fields.value.find((f) => f.tag === r.field);
                if (r.allow_edit) {
                  r.allow_edit.forEach((e, i) => {
                    r.allow_edit[i] = getObject(branches.value, e);
                  });
                }
              });
              element.colTableSelected = [];

              rows.value.push(element);
            });
          }).catch((err) => {
            console.log(err);
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
  props.authStore.authorizedRequest(`/services/genprice/TimeTrackingConfig/create`, query)
    .then((res) => {
      dialogAdd.value = false;
      if (res.data.result === 'ok') {
        update();
      } else if (res.data.data === 'name must be unique') {
        props.showError(`Конфигурация таблицы "${query.name}" уже существует в базе данных`);
      }
    });
}
function change() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest(`/services/genprice/TimeTrackingConfig/update/${selected.value[0].id}`, query)
    .then((res) => {
      dialogUpdate.value = false;
      if (res.data.result === 'ok') {
        update();
      } else if (res.data.data === 'name must be unique') {
        props.showError(`Конфигурация таблицы "${query.name}" уже существует в базе данных`);
      }
    });
}
function isDisable(col, row) {
  try {
    let res = false;
    if (col === 'filter_type_work' || col === 'filter_branch' || col === 'filter_type_activity') {
      res = row.filters === true;
      if (col === 'filter_type_activity') {
        res = row.filter_type_work.id === -1;
      }
    }
    return res;
  } catch {
    return true;
  }
}

function remove() {
  props.showConfirm(`Удалить конфигурацию таблицы ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest(`/services/genprice/TimeTrackingConfig/delete/${selected.value[0].id}`).then(() => {
      update();
    });
  });
}
function save(col, value) {
  const updateRow = {};
  updateRow[col] = value;
  props.authStore.authorizedRequest(`/services/genprice/TimeTrackingConfig/update/${selected.value[0].id}`, updateRow).then((res) => {
    console.log(res);
  });
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
function updateFilterTypeWork(row) {
  console.log(row);
  [row.filter_type_activity] = row.filter_type_work.id === TYPE_WORK_PROJECT ? projects_mod.value : type_activities_mod.value;
  save('filter_type_work', row.filter_type_work.id);
  save('filter_type_activity', row.filter_type_activity.id);
}
function saveMultipleSelection(col, val) {
  save(col, JSON.stringify(val.map((obj) => obj.id)));
}
function addColumnForColTable(_rows) {
  const id = getNewId(_rows);
  _rows.push({
    id,
    name: 'Новый столбец 1',
    field: fields.value[0],
    allow_edit: [],
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
      r.field = r.field.tag;
      if (!r.allow_edit) {
        r.allow_edit = [];
      }
      r.allow_edit = r.allow_edit.map((obj) => obj.id);
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
  update();
});
</script>
