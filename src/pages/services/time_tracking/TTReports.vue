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
        name: 'branches',
        label: 'Группа',
        align: 'center',
        sortable: true,
        field: 'branches',
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
    @row-dblclick="router.push(`/report/${selected[0].id}`)" style="height: 90vh;">
    <template v-slot:top>
      <q-card-actions class="row fit q-gutter-sm">
        <div class="text-h6">
          Отчёты
        </div>
        <Button :dark="props.dark" icon="add" label="Новый отчёт" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
          selected.length = 0;
        }" />
        <Button :dark="props.dark" v-show="selected.length > 0" label="Открыть" icon="open_in_new"
          @click="() => router.push(`/report/${selected[0].id}`)" />
        <Button :dark="props.dark" v-show="selected.length > 0" label="Изменить" icon="edit"
          @click="() => router.push(`/configurations/report/${selected[0].id}`)" />
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
  <PPDialog v-model="dialogAdd" label="Новый отчёт" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section class="q-gutter-sm">
      <InputText :dark="props.dark" v-model="modelInput.name" type="text" placeholder="Наименование" />
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
import InputText from 'src/components/InputText.vue';
import PPDialog from 'src/components/PPDialog.vue';
import { OPTION_ALL } from './fun';

document.title = 'Выбор отчёта';

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
const type_branches = ref([]);
const filter = ref('');
const selected = ref([]);
const dialogAdd = ref(false);

const modelInput = ref({
  name: '',
});
const pagination = ref({
  rowsPerPage: 0,
});
function isAllowView(val) {
  try {
    return val.allow_view.find((b) => b === props.authStore.getUser.branch || props.authStore.isAdministrator);
  } catch (err) {
    console.log(err);
    return false;
  }
}
function update() {
  load.value = true;
  rows.value.length = 0;
  props.authStore.authorizedRequest('get', `all_reports`).then((resp) => {
    rows.value.push(...resp.data.map((c) => {
      return {
        ...c,
        allow_view: JSON.parse(c.allow_view),
        branches: JSON.parse(c.filter_branches).map((bid) => type_branches.value.find((b) => b.id === bid).name).join(', '),
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
  props.authStore.authorizedRequest('post', `reports`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch(() => {
    props.showError(`Конфигурация отчёта "${query.name}" уже существует в базе данных`);
  });
}
function remove() {
  props.showConfirm(`Удалить конфигурацию отчёта ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `reports/${selected.value[0].id}`).then(() => {
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
