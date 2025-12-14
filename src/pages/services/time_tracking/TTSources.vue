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
    ]" row-key="id" virtual-scroll :hide-selected-banner="true" selection="single" binary-state-sort
    :color="`${props.dark ? 'orange' : 'green'}`" :hide-pagination="false" v-model:pagination="pagination"
    separator="cell" :rows-per-page-options="[1]" wrap-cells grid-header no-data-label="Нет данных" :filter="filter"
    v-model:selected="selected" :loading="load" @row-click="selectRow" style="height: 90vh;">
    <template v-slot:top>
      <q-card-actions class="fit">
        <Button icon="add" label="Новый источник поступления" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
        }" :dark="props.dark" />
        <Button label="Изменить" v-if="selected.length > 0" icon="edit" @click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <Button disable label="Удалить" icon="delete" v-if="selected.length > 0" @click="remove" :dark="props.dark" />
        <q-space />
        <InputSearch label="Поиск" v-model="filter" debounce="300" :dark="props.dark" />
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
    <template v-slot:header-selection="props">
      <TTCheckbox v-model="props.selected" :dark="props.dark" />
    </template>
    <template v-slot:body-selection="props">
      <TTCheckbox v-model="props.selected" :dark="props.dark" />
    </template>
  </q-table>
  <PPDialog v-model="dialogAdd" label="Новый источник поступления" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section>
      <TTInputTextSingle label="Наименование" :dark="props.dark" v-model="modelInput.name" />
      <Button :disable="!modelInput.name" label="Создать" :dark="props.dark" @click="add" />
    </q-card-section>
  </PPDialog>
  <PPDialog v-model="dialogUpdate" label="Изменение источника поступления" :dark="props.dark"
    styleContent="width: 400px;">
    <q-card-section>
      <TTInputTextSingle label="Наименование" :dark="props.dark" v-model="modelInput.name" />
      <Button :disable="!modelInput.name" label="Изменить" :dark="props.dark" @click="change" />
    </q-card-section>
  </PPDialog>
</template>
<script setup>
import {
  ref,
  onMounted,
} from 'vue';
import PPDialog from 'src/components/PPDialog.vue';
import Button from 'src/components/InputButton.vue';
import TTInputTextSingle from 'src/components/InputText.vue';
import TTCheckbox from 'src/components/InputCheckbox.vue';
import InputSearch from 'src/components/InputSearch.vue';

document.title = 'Источники поступлений';
const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  authStore: Object,
  contentHeight: Number,
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
  props.authStore.authorizedRequest('get', `sources`).then((resp) => {
    rows.value.push(...resp.data);
    load.value = false;
  }).catch((err) => {
    console.log(err);
    props.showError('Ошибка при загрузке данных');
  });
}
function selectRow(event, row) {
  selected.value.length = 0;
  selected.value.push(row);
}
function add() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `sources`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch(() => props.showError('Ошибка при создании данных'));
}
function change() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `sources/${selected.value[0].id}`, query).then(() => {
    dialogUpdate.value = false;
    update();
  }).catch(() => props.showError('Ошибка при изменении данных'));
}
function remove() {
  props.showConfirm(`Удалить источник поступления задач ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `sources/${selected.value[0].id}`).then(() => {
      update();
    }).catch(() => props.showError('Ошибка при удалении данных'));
  });
}
onMounted(() => {
  update();
});
</script>
