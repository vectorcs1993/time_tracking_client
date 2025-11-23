<template>
  <q-splitter v-if="config" v-model="splitter" :dark="props.dark" :style="`height: ${props.contentHeight || 400}px;`">
    <template v-slot:before>
      <div class="q-pa-sm">
        <div class="row items-center">
          <TTInputTextSingle label="Наименование" v-model="config.name" style="width: 100%;" :dark="props.dark" />
          <Button v-if="change" @click="save" label="Сохранить" :dark="props.dark" />
          <Button v-if="change" @click="update" label="Отменить" :dark="props.dark" />
        </div>
        <div v-if="!change" class="col">
          <div>
            Создана {{ config.createdAt }}
          </div>
          <div>
            Изменена {{ config.updatedAt }}
          </div>
        </div>
        <div class="q-gutter-xs">
          <TTCheckbox v-model="config.filters" label="Показывать фильтры" :dark="props.dark" />
          <TTCheckbox :disable="config.filters" v-model="config.deleteOnlySome" label="Удалять только свои"
            :dark="props.dark" />
          <TTCheckbox v-model="config.changeOnlySome" label="Изменять только свои" :dark="props.dark" />
        </div>
        <TTSelect label="Фильтр подразделение" v-model="config.filter_branch" :options="branches_mod" :dark="props.dark"
          style="width: 100%;" />
        <TTSelect label="Фильтр тип работы" v-model="config.filter_type_work" :options="type_works_mod"
          :dark="props.dark" style="width: 100%;" @update:model-value="(val) => {
            if (val.id === OPTION_ALL.id) config.filter_type_activity = type_activities_mod[0];
            else if (val.id === type_works[0].id) type_activitiesOp = type_activities_mod;
            else if (val.id === type_works[1].id) type_activitiesOp = projects_mod;
            config.filter_type_activity = type_activitiesOp[0];
          }" />
        <TTSelect label="Фильтр целевой объект" v-if="config.filter_type_work.id !== OPTION_ALL.id"
          v-model="config.filter_type_activity" :options="type_activitiesOp" :dark="props.dark" style="width: 100%;" />
        <TTSelectMultiply label="Разрешить просмотр" v-model="config.allow_views" :options="branches_mod"
          :dark="props.dark" style="width: 100%;" />
        <TTSelectMultiply label="Разрешить добавление" v-model="config.allow_creates" :options="branches_mod"
          :dark="props.dark" style="width: 100%;" />
        <TTSelectMultiply label="Разрешить изменение" v-model="config.allow_edit" :options="branches_mod"
          :dark="props.dark" style="width: 100%;" />
        <TTSelectMultiply label="Разрешить удаление" v-model="config.allow_delete" :options="branches_mod"
          :dark="props.dark" style="width: 100%;" />
      </div>
    </template>
    <template v-slot:after>
      <div class="q-pa-sm">
        <q-card-actions>
          <Button label="Новый столбец" @click="() => {
            colTableSelected.length = 0;
            addColumnForColTable(config.cols);
          }" :dark="props.dark" />
          <Button v-if="colTableSelected.length > 0" label="Удалить" icon="delete" @click="() => {
            deleteColumnForColTable(config.cols, colTableSelected);
          }" :dark="props.dark" />
          <Button v-if="colTableSelected.length === 1" label="Вверх" icon="arrow_upward" @click="() => {
            moveUpColumnForColTable(config.cols, colTableSelected);
          }" :dark="props.dark" />
          <Button v-if="colTableSelected.length === 1" label="Вниз" icon="arrow_downward" @click="() => {
            moveDownColumnForColTable(config.cols, colTableSelected);
          }" :dark="props.dark" />
          <Button v-if="colTableSelected.length > 0" label="Копировать строки" icon="content_copy" @click="() => {
            copyColTable(colTableSelected);
          }" :dark="props.dark" />
          <Button v-if="bufferTable.length > 0" label="Вставить строки" icon="content_paste" @click="() => {
            colTableSelected.length = 0;
            pasteColTable(config.cols);
          }" :dark="props.dark" />
        </q-card-actions>
        <q-table title="Колонки" :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer text-size`"
          square :dark="props.dark" dense flat :rows="config.cols" :columns="[
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
              field: 'field',
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
          ]" row-key="id" virtual-scroll :hide-selected-banner="true" :hide-header="false" selection="multiple"
          binary-state-sort :color="`${props.dark ? 'orange' : 'green'}`" :hide-pagination="true"
          v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]" wrap-cells :hide-no-data="true"
          :filter="filter" v-model:selected="colTableSelected" style="height: 100%; width: 100%;">
          <template v-slot:body-cell="props">
            <q-td :props="props">
              <TTCheckbox v-if="props.col.type == 'checkbox'" v-model="props.row[props.col.name]" :dark="props.dark" />
              <q-input v-if="props.col.type == 'color_picked'" :disable="props.row.field.type !== TT_TYPE_FLAG"
                :dark="props.dark" dense square class="text-size" v-model="props.row[props.col.name]"
                :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`">
                <template v-slot:append>
                  {{ props.row.field.type }}
                  <q-icon name="colorize" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-color class="text-size" v-model="props.row[props.col.name]" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <TTInputTextSingle v-else-if="props.col.type == 'text'" cell :dark="props.dark"
                v-model="props.row[props.col.name]" />
              <TTSelect cell :dark="props.dark" v-else-if="props.col.type == 'selector'"
                :options="props.col.options(props.row)" v-model="props.row[props.col.name]" @update:model-value="() => {
                  if (props.col.update) {
                    props.col.update(props.row);
                  }
                }" />
              <TTSelectMultiply cell :dark="props.dark" v-else-if="props.col.type == 'selector_multiple'"
                v-model="props.row[props.col.name]" :options="props.col.options(props.row)" />
              <div v-else class="text-size"> {{ props.value }}</div>
            </q-td>
          </template>
          <template v-slot:header-selection="props">
            <TTCheckbox v-model="props.selected" />
          </template>
          <template v-slot:body-selection="props">
            <TTCheckbox v-model="props.selected" />
          </template>
        </q-table>
      </div>
    </template>
  </q-splitter>
</template>
<script setup>
import {
  onMounted,
  ref,
  defineProps,
  watch,
  nextTick,
} from 'vue';
import { useRoute } from 'vue-router';
import Button from 'src/components/TTBtn.vue';
import TTInputTextSingle from 'src/components/TTInputTextSingle.vue';
import TTSelect from 'src/components/TTSelect.vue';
import TTSelectMultiply from 'src/components/TTSelectMultiply.vue';
import TTCheckbox from 'src/components/TTCheckbox.vue';
import { getNewId, OPTION_ALL, TT_TYPE_FLAG } from './fun';

const route = useRoute();
const { id } = route.params;

const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  authStore: Object,
  contentHeight: Number,
});
const splitter = ref(20);
const bufferTable = ref([]);
const config = ref();
const fields = ref([]);
const branches = ref([]);
const branches_mod = ref([]);
const type_works = ref([]);
const type_works_mod = ref([]);
const projects = [];
const projects_mod = ref([]);
const activities = [];
const type_activities_mod = ref([]);
const type_activitiesOp = ref([]);
const colTableSelected = ref([]);
const pagination = ref({
  rowsPerPage: 0,
});

// Флаг для отслеживания инициализации
const isInitialized = ref(false);
const change = ref(false);

function update() {
  fields.value.length = 0;
  props.authStore.authorizedRequest('get', `all_fields`).then((respFl) => {
    fields.value.push(...respFl.data.map((s, i) => {
      const e = s;
      e.id = i;
      e.tag = s.name;
      e.type = s.type;
      e.name = `${s.name} (${s.type})`;
      return e;
    }).sort((a, b) => (a.name > b.name ? 1 : -1)));

    type_works.value.length = 0;
    type_works_mod.value.length = 0;
    props.authStore.authorizedRequest('get', `all_type_works`).then((respW) => {
      type_works.value.push(...respW.data);
      type_works_mod.value.push(OPTION_ALL);
      type_works_mod.value.push(...type_works.value);
      projects.length = 0;
      projects_mod.value.length = 0;
      props.authStore.authorizedRequest('get', `projects`).then((respP) => {
        projects.push(...respP.data);
        projects_mod.value.push(OPTION_ALL);
        projects_mod.value.push(...respP.data);

        activities.length = 0;
        type_activities_mod.value.length = 0;
        props.authStore.authorizedRequest('get', `activities`).then((respA) => {
          activities.push(...respA.data);
          type_activities_mod.value.push(OPTION_ALL);
          type_activities_mod.value.push(...respA.data);

          branches.value.length = 0;
          branches_mod.value.length = 0;
          props.authStore.authorizedRequest('get', `branches`).then((respB) => {
            branches_mod.value.push(OPTION_ALL);
            branches_mod.value.push(...respB.data);
            branches.value.push(...respB.data);
            props.authStore.authorizedRequest('get', `configs/${Number(id)}`).then((respС) => {
              config.value = respС.data[0];
              try {
                config.value.cols = JSON.parse(config.value?.cols).map((c) => {
                  return {
                    ...c,
                    field: fields.value.find((f) => f.tag === c.field),
                    allow_edit: c.allow_edit ? c.allow_edit.map((ae) => branches.value.find((b) => b.id === ae)) : [],
                  }
                });
                console.log(config.value);

              } catch {
                config.value.cols = [];
              }
              config.value.filter_branch = branches_mod.value.find((e) => e.id === config.value.filter_branch);
              config.value.filter_type_work = type_works_mod.value.find((e) => e.id === config.value.filter_type_work);
              type_activitiesOp.value.length = 0;
              type_activitiesOp.value.push(...(config.value.filter_type_work.id === type_works.value[1].id ? projects_mod.value : type_activities_mod.value));
              config.value.filter_type_activity = type_activitiesOp.value.find((e) => e.id === config.value.filter_type_activity);
              try {
                config.value.allow_views = JSON.parse(config.value.allow_views);
              } catch {
                config.value.allow_views = [];
              }
              config.value.allow_views = config.value.allow_views.map((e) => branches.value.find((b) => b.id === e));

              try {
                config.value.allow_creates = JSON.parse(config.value.allow_creates);
              } catch {
                config.value.allow_creates = [];
              }
              config.value.allow_creates = config.value.allow_creates.map((e) => branches.value.find((b) => b.id === e));

              try {
                config.value.allow_edit = JSON.parse(config.value.allow_edit);
              } catch {
                config.value.allow_edit = [];
              }
              config.value.allow_edit = config.value.allow_edit.map((e) => branches.value.find((b) => b.id === e));

              try {
                config.value.allow_delete = JSON.parse(config.value.allow_delete);
              } catch {
                config.value.allow_delete = [];
              }
              config.value.allow_delete = config.value.allow_delete.map((e) => branches.value.find((b) => b.id === e));
              document.title = `Конфигурация ${config.value.name || 'Ошибка'}`;

              // После полной инициализации включаем отслеживание изменений
              nextTick(() => {
                change.value = false
                isInitialized.value = true;
              });
            }).catch((err) => {
              console.log(err);
              if (err.status === 404) props.showError('Конфигурация не найдена');
              else props.showError('Ошибка загрузки конфигурации');
            });
          });
        });
      });
    });
  });
}
// function saveMultipleSelection(col, val) {
//   save(col, JSON.stringify(val.map((obj) => obj.id)));
// }
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
function save() {
  const query = { ...JSON.parse(JSON.stringify(config.value)) };
  query.filter_type_work = query.filter_type_work.id;
  query.filter_type_activity = query.filter_type_activity.id;
  query.filter_branch = query.filter_branch.id;
  query.allow_edit = JSON.stringify(query.allow_edit.map((obj) => obj.id));
  query.allow_creates = JSON.stringify(query.allow_creates.map((obj) => obj.id));
  query.allow_views = JSON.stringify(query.allow_views.map((obj) => obj.id));
  query.allow_delete = JSON.stringify(query.allow_delete.map((obj) => obj.id));
  query.cols = JSON.stringify(query.cols.map((r) => ({
    ...r,
    field: r.field.tag,
    allow_edit: r.allow_edit ? r.allow_edit.map((obj) => obj.id) : [],
  })));
  query.createdAt = undefined;
  query.updatedAt = undefined;

  props.authStore.authorizedRequest('post', `configs/${id}`, query).then(() => {
    update();
  }).catch(() => props.showError('Ошибка при изменении данных'));
}

// Отслеживание изменений с игнорированием инициализации
watch(config, () => {
  if (!isInitialized.value) return;
  change.value = true;
}, { deep: true });

onMounted(() => {
  update();
});
</script>
