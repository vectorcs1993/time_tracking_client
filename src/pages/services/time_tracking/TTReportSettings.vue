<template>
  <q-splitter v-if="config" v-model="splitter" :dark="props.dark" style="height: 90vh;">
    <template v-slot:before>
      <div class="row q-pa-sm q-gutter-sm items-center">
        <Button icon="arrow_back" @click="router.push(`/reports`)" :dark="props.dark" />
        <div class="row items-center text-h6">
          Отчёт
        </div>
        <Button icon="save" v-if="change" @click="save" label="Сохранить" :dark="props.dark" />
        <Button icon="cancel" v-if="change" @click="update" label="Отменить" :dark="props.dark" />
      </div>
      <div class="q-pa-sm q-gutter-sm">
        <TTInputTextSingle label="Наименование" v-model="config.name" style="width: 100%;" :dark="props.dark" />
        <div v-if="!change" class="col">
          <div>
            Создана {{ config.createdAt }}
          </div>
          <div>
            Изменена {{ config.updatedAt }}
          </div>
        </div>
        <InputSelect label="Тип отчёта" v-model="config.type" :options="type_reports" :dark="props.dark"
          style="width: 100%;" />
        <TTSelectMultiply label="Фильтр группы" v-model="config.filter_branches" :options="branches_mod"
          :dark="props.dark" style="width: 100%;" />
        <TTSelectMultiply label="Разрешить просмотр" v-model="config.allow_view" :options="branches_mod"
          :dark="props.dark" style="width: 100%;" />
        <TTInputTextSingle label="Описание" v-model="config.description" style="width: 100%; height: 400px;"
          :dark="props.dark" />
      </div>
    </template>
    <template v-slot:after>
      <div class="q-pa-sm">
        <q-card-actions class="q-gutter-sm">
          <Button icon="add" label="Новый столбец" @click="() => {
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
          square :dark="props.dark" dense flat :rows="config.cols" :columns="(config.type.id === 0 || config.type.id === 4) ? [
            {
              name: 'name',
              required: true,
              align: 'center',
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
              sortable: false,
              field: (row) => (row.type_metric ? row.type_metric.name : ''),
              edit: true,
              type: 'selector',
              options: () => type_metrics,
            },
            {
              name: 'type_work',
              label: 'Тип работы',
              align: 'center',
              sortable: false,
              field: (row) => (row.type_activity ? row.type_activity.name : ''),
              edit: true,
              type: 'selector',
              options: () => type_works_mod,
              update: (row) => {
                row.type_activity = row.type_work.id === props.authStore.TYPE_WORK_PROJECT ? type_projects_mod[0] : type_activities_mod[0];
              },
            },
            {
              name: 'type_activity',
              label: 'Целевой объект',
              align: 'center',
              sortable: false,
              field: (row) => (row.type_activity ? row.type_activity.name : ''),
              edit: true,
              type: 'selector',
              options: (row) => row.type_work ? row.type_work.id === props.authStore.TYPE_WORK_PROJECT ? type_projects_mod : type_activities_mod : [],
              style: 'width: 250px;'
            },
            {
              name: 'type_source',
              label: 'Источник поступления',
              align: 'center',
              sortable: false,
              field: 'type_source',
              edit: true,
              type: 'selector_multiple',
              options: () => type_sources,
            },
            {
              name: 'type_work_progress',
              label: 'Прогресс',
              align: 'center',
              field: 'type_work_progress',
              sortable: false,
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
              name: 'forChart',
              label: 'Вывод в график',
              align: 'center',
              sortable: false,
              field: 'forChart',
              edit: true,
              type: 'checkbox',
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
              sortable: false,
              edit: true,
              type: 'text',
              style: 'width: 300px;'
            },
            {
              name: 'type_activity',
              label: 'Проект',
              align: 'center',
              sortable: false,
              field: (row) => (row.type_activity ? row.type_activity.name : ''),
              edit: true,
              type: 'selector',
              options: () => type_projects,
              style: 'width: 250px;'
            },
            {
              name: 'forChart',
              label: 'Вывод в график',
              align: 'center',
              sortable: false,
              field: 'forChart',
              edit: true,
              type: 'checkbox',
            },
            {
              name: 'color_bg',
              label: 'Цвет фона',
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
              <Checkbox v-if="props.col.type == 'checkbox'" v-model="props.row[props.col.name]" :dark="props.dark" />
              <q-input v-else-if="props.col.type == 'color_picked'" :dark="props.dark" dense square class="text-size"
                v-model="props.row[props.col.name]"
                :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`">
                <template v-slot:append>
                  <q-icon name="colorize" :style="`color: ${props.row[props.col.name]};`" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-color class="text-size" v-model="props.row[props.col.name]" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <TTInputTextSingle v-else-if="props.col.type == 'text'" cell :dark="props.dark"
                v-model="props.row[props.col.name]" />
              <InputSelect cell :dark="props.dark" v-else-if="props.col.type == 'selector'"
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
          <template v-slot:header-cell="props">
            <q-th :props="props">
              <div class="text-size">
                {{ props.col.label }}
              </div>
            </q-th>
          </template>
          <template v-slot:header-selection="props">
            <Checkbox v-model="props.selected" :dark="props.dark" />
          </template>
          <template v-slot:body-selection="props">
            <Checkbox v-model="props.selected" :dark="props.dark" />
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
  watch,
  nextTick,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'src/components/InputButton.vue';
import TTInputTextSingle from 'src/components/InputText.vue';
import TTSelectMultiply from 'src/components/TTSelectMultiply.vue';
import Checkbox from 'src/components/InputCheckbox.vue';
import { getNewId, OPTION_ALL } from './fun';
import InputSelect from 'src/components/InputSelect.vue';

const route = useRoute();
const router = useRouter();
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

const branches = ref([]);
const branches_mod = ref([]);
const type_works = ref([]);
const type_works_mod = ref([]);
const type_sources = ref([]);
const type_conditions = ref([]);
const type_reports = ref([]);
const type_metrics = ref([]);
const type_work_progress = ref([]);
const type_projects = [];
const type_projects_mod = ref([]);
const activities = [];
const type_activities_mod = ref([]);
const colTableSelected = ref([]);
const pagination = ref({
  rowsPerPage: 0,
});

// Флаг для отслеживания инициализации
const isInitialized = ref(false);
const change = ref(false);

function update() {
  config.value = false;
  props.authStore.authorizedRequest('get', `reports/${Number(id)}`).then((respС) => {
    config.value = respС.data[0];
    try {
      config.value.cols = JSON.parse(config.value?.cols).map((c) => {
        return {
          ...c,
          type_metric: type_metrics.value.find((tm) => tm.id === c.type_metric),
          type_work_progress: type_work_progress.value.find((tp) => tp.id === c.type_work_progress),
          type_work: type_works_mod.value.find((tw) => tw.id === c.type_work),
          type_activity: c.type_work === props.authStore.TYPE_WORK_PROJECT ? type_projects_mod.value.find((ta) => ta.id === c.type_activity) : type_activities_mod.value.find((ta) => ta.id === c.type_activity),
          forChart: c.forChart,
          type_source: c.type_source.map((c) => type_sources.value.find((ts) => ts.id === c)),
          type_conditions: c.type_conditions.map((c) => type_conditions.value.find((ts) => ts.id === c)),
        }
      });
    } catch {
      config.value.cols = [];
    }

    config.value.type = type_reports.value.find((tr) => tr.id === config.value.type);

    try {
      config.value.allow_view = JSON.parse(config.value.allow_view);
    } catch {
      config.value.allow_view = [];
    }
    config.value.allow_view = config.value.allow_view.map((e) => branches.value.find((b) => b.id === e));
    try {
      config.value.filter_branches = JSON.parse(config.value.filter_branches);
    } catch {
      config.value.filter_branches = [];
    }

    config.value.filter_branches = config.value.filter_branches.map((e) => branches.value.find((b) => b.id === e));

    document.title = `Настройка отчёта ${config.value.name || 'Ошибка'}`;

    // После полной инициализации включаем отслеживание изменений
    nextTick(() => {
      change.value = false
      isInitialized.value = true;
    });
  }).catch((err) => {
    console.log(err);
    if (err.status === 404) props.showError('Конфигурация не найдена');
    else {
      console.log(err);
      props.showError('Ошибка загрузки конфигурации');
    }
  });
}
function addColumnForColTable(_rows) {
  const id = getNewId(_rows);
  _rows.push({
    id,
    name: 'Новый столбец 1',
    type_work: type_works_mod.value[1],
    type_activity: type_activities_mod.value[0],
    type_source: [],
    type_conditions: [],
    type_metric: type_metrics.value[0],
    type_work_progress: type_work_progress.value[0],
    forChart: false,
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
  query.type = config.value.type.id;
  query.filter_branches = JSON.stringify(query.filter_branches.map((obj) => obj.id));
  query.allow_view = JSON.stringify(query.allow_view.map((obj) => obj.id));
  query.cols = JSON.stringify(query.cols.map((r) => ({
    ...r,
    type_work: r.type_work.id,
    type_activity: r.type_activity.id,
    type_source: r.type_source.map((obj) => obj.id),
    type_conditions: r.type_conditions.map((obj) => obj.id),
    type_metric: r.type_metric.id,
    type_work_progress: r.type_work_progress.id,
    forChart: r.forChart,
  })));
  query.createdAt = undefined;
  query.updatedAt = undefined;
  console.log(query);

  props.authStore.authorizedRequest('post', `reports/${id}`, query).then(() => {
    update();
  }).catch(() => props.showError('Ошибка при изменении данных'));
}

// Отслеживание изменений с игнорированием инициализации
watch(config, () => {
  if (!isInitialized.value) return;
  change.value = true;
}, { deep: true });

onMounted(() => {
  type_conditions.value.length = 0;
  props.authStore.authorizedRequest('get', `all_type_conditions`).then((respTC) => {
    type_conditions.value.push(...respTC.data);
    type_work_progress.value.length = 0;
    props.authStore.authorizedRequest('get', `all_type_work_progress`).then((respTP) => {
      type_work_progress.value.push(...respTP.data);
      type_metrics.value.length = 0;
      props.authStore.authorizedRequest('get', `all_type_metrics`).then((respTM) => {
        type_metrics.value.push(...respTM.data);
        type_works.value.length = 0;
        type_works_mod.value.length = 0;
        props.authStore.authorizedRequest('get', `all_type_works`).then((respW) => {
          type_works.value.push(...respW.data);
          type_works_mod.value.push(OPTION_ALL);
          type_works_mod.value.push(...type_works.value);
          type_projects.length = 0;
          type_projects_mod.value.length = 0;
          props.authStore.authorizedRequest('get', `projects`).then((respP) => {
            type_projects.push(...respP.data);
            type_projects_mod.value.push(OPTION_ALL);
            type_projects_mod.value.push(...respP.data);
            activities.length = 0;
            type_activities_mod.value.length = 0;
            props.authStore.authorizedRequest('get', `activities`).then((respA) => {
              activities.push(...respA.data);
              type_activities_mod.value.push(OPTION_ALL);
              type_activities_mod.value.push(...respA.data);
              type_sources.value.length = 0;
              props.authStore.authorizedRequest('get', `sources`).then((respTS) => {
                type_sources.value.push(...respTS.data);
                branches.value.length = 0;
                branches_mod.value.length = 0;
                props.authStore.authorizedRequest('get', `branches`).then((respB) => {
                  branches_mod.value.push(OPTION_ALL);
                  branches_mod.value.push(...respB.data);
                  branches.value.push(...respB.data);
                  type_reports.value.length = 0;
                  props.authStore.authorizedRequest('get', `all_type_reports`).then((respTR) => {
                    type_reports.value.push(...respTR.data)
                    update();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

});
</script>
