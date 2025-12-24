<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer q-pa-none q-ma-none text-size`"
    square :dark="props.dark" dense flat wrap-cells :rows="rows" :columns="[
      {
        name: 'name',
        label: 'Наименование',
        align: 'left',
        field: 'name',
        sortable: true,
      },
      {
        name: 'branch',
        label: 'Группа',
        align: 'center',
        sortable: true,
        field: (row) => (row.filter_branch ? row.filter_branch.name : ''),
        edit: false,
        type: 'selector',
        options: () => type_branches,
        style: 'min-width: 170px; max-width: 170px;',
      },
      {
        name: 'description',
        label: 'Комментарий',
        align: 'center',
        field: 'description',
      },
    ]" row-key="id" virtual-scroll :hide-selected-banner="true" selection="single" :loading="load"
    :color="`${props.dark ? 'orange' : 'green'}`" binary-state-sort :hide-pagination="false"
    v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]" grid-header no-data-label="Нет данных"
    :filter="filter" v-model:selected="selected" @row-click="selectRow"
    @row-dblclick="router.push(`/table/${selected[0].id}`)" style="height: 90vh;">
    <template v-slot:top>
      <q-card-actions class="row fit q-gutter-sm">
        <div class="text-h6">
          Таблицы
        </div>
        <Button :dark="props.dark" icon="add" label="Новая таблица" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
          selected.length = 0;
        }" />
        <Button :dark="props.dark" v-show="selected.length > 0" label="Открыть" icon="open_in_new"
          @click="() => router.push(`/table/${selected[0].id}`)" />
        <Button :dark="props.dark" v-show="selected.length > 0" label="Изменить" icon="edit"
          @click="() => router.push(`/configurations/table/${selected[0].id}`)" />
        <Button label="Удалить" :dark="props.dark" v-show="selected.length > 0" icon="delete" @click="remove" />
        <q-space />
        <InputSearch label="Поиск" v-model="filter" :dark="props.dark" />
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
      <q-td :props="props">
        <div class="text-size">
          {{ props.value }}
        </div>
      </q-td>
    </template>
  </q-table>

  <PPDialog v-model="dialogAdd" label="Новая таблица" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section class="q-gutter-sm">
      <InputText :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
      <Button label="Создать" :disable="!modelInput.name" :dark="props.dark" @click="add" />
    </q-card-section>
  </PPDialog>
</template>
<script setup>
import {
  onMounted,
  ref,
} from 'vue';
import { useRouter } from 'vue-router';
import Button from 'src/components/InputButton.vue';
import InputSearch from 'src/components/InputSearch.vue';
import { OPTION_ALL } from './fun';
import InputText from 'src/components/InputText.vue';
import PPDialog from 'src/components/PPDialog.vue';
document.title = 'Выбор таблицы';

const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  authStore: Object,
});
const router = useRouter();
const load = ref(false);
const rows = ref([]);
const filter = ref('');
const selected = ref([]);
const dialogAdd = ref(false);
const type_branches = ref([]);

const modelInput = ref({
  name: '',
});
const pagination = ref({
  rowsPerPage: 0,
});
function isAllowView(val) {
  try {
    return val.allow_views.find((b) => b === props.authStore.getUser.branch || props.authStore.isAdministrator);
  } catch (err) {
    console.log(err);
    return false;
  }
}
function update() {
  load.value = true;
  rows.value.length = 0;
  props.authStore.authorizedRequest('get', `all_configs`).then((resp) => {
    rows.value.push(...resp.data.map((c) => {
      return {
        ...c,
        allow_views: JSON.parse(c.allow_views),
        filter_branch: type_branches.value.find((b) => b.id === c.filter_branch),
      };
    }).filter((c) => isAllowView(c)));
    load.value = false;
  }).catch((err) => {
    console.log(err);
  });
}
function selectRow(event, row) {
  selected.value.length = 0;
  selected.value.push(row);
}
function add() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `configs`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch(() => {
    props.showError(`Конфигурация таблицы "${query.name}" уже существует в базе данных`);
  });
}
function remove() {
  props.showConfirm(`Удалить конфигурацию таблицы ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `configs/${selected.value[0].id}`).then(() => {
      update();
    });
  });
}
onMounted(() => {
  type_branches.value.length = 0;
  type_branches.value.push(OPTION_ALL);
  props.authStore.authorizedRequest('get', `branches`).then((respBR) => {
    type_branches.value.push(...respBR.data);
    update();
  });
});
</script>
