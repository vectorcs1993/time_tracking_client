<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer`" square :dark="props.dark" dense
    flat :rows="rows" :columns="[
      {
        name: 'name',
        required: true,
        label: 'Наименование',
        align: 'left',
        field: (row) => row.name,
        sortable: true,
        style: 'min-width: 500px',
        edit: false,
      },
    ]" row-key="id" :color="`${props.dark ? 'orange' : 'green'}`" virtual-scroll :hide-selected-banner="true"
    selection="single" binary-state-sort :hide-pagination="false" v-model:pagination="pagination" separator="cell"
    :rows-per-page-options="[1]" wrap-cells grid-header no-data-label="Нет данных" :filter="filter"
    v-model:selected="selected" @row-click="selectRow" :loading="load" style="height: 90vh;">
    <template v-slot:top>
      <q-card-actions class="fit q-gutter-sm">
        <div class="text-h6">
          Виды активностей
        </div>
        <Button icon="add" label="Новая активность" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
        }" :dark="props.dark" />
        <Button label="Изменить" v-if="selected.length > 0" icon="edit" @click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <Button disable label="Удалить" icon="delete" v-if="selected.length > 0" @click="remove" :dark="props.dark" />
        <q-space />
        <InputSearch label="Поиск" v-model="filter" :dark="props.dark" />
      </q-card-actions>
    </template>
    <template v-slot:pagination>
      <div>
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
  <PPDialog label="Новая активность" v-model="dialogAdd" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section class="q-gutter-sm">
      <TTInputTextSingle label="Наименование" :dark="props.dark" v-model="modelInput.name" />
      <Button label="Создать" :disable="!modelInput.name" :dark="props.dark" @click="add" />
    </q-card-section>
  </PPDialog>
  <PPDialog label="Изменение активности" v-model="dialogUpdate" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section class="q-gutter-sm">
      <TTInputTextSingle label="Наименование" :dark="props.dark" v-model="modelInput.name" />
      <Button label="Изменить" :disable="!modelInput.name" :dark="props.dark" @click="change" />
    </q-card-section>
  </PPDialog>
</template>
<script setup>
import Button from 'src/components/InputButton.vue';
import TTInputTextSingle from 'src/components/InputText.vue';
import PPDialog from 'src/components/PPDialog.vue';
import {
  ref,
  onMounted,
} from 'vue';
import InputSearch from 'src/components/InputSearch.vue';

document.title = 'Виды активности';
const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  authStore: Object,
});

const rows = ref([]);
const load = ref(false);
const filter = ref('');
const selected = ref([]);
const dialogAdd = ref(false);
const dialogUpdate = ref(false);

const modelInput = ref({
  name: '',
});
const pagination = ref({
  rowsPerPage: 0,
});

function update() {
  load.value = true;
  selected.value.length = 0;
  rows.value.length = 0;
  props.authStore.authorizedRequest('get', `activities`).then((resp) => {
    rows.value.push(...resp.data);
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
  props.authStore.authorizedRequest('post', `activities`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch(() => props.showError('Ошибка при создании данных'));
}
function change() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `activities/${selected.value[0].id}`, query).then(() => {
    dialogUpdate.value = false;
    update();
  }).catch(() => props.showError('Ошибка при изменении данных'));
}
function remove() {
  props.showConfirm(`Удалить активность ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `activities/${selected.value[0].id}`).then(() => {
      update();
    }).catch(() => props.showError('Ошибка при удалении данных'));
  });
}
onMounted(() => {
  update();
});
</script>
