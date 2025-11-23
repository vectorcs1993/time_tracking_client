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
    :loading="load" v-model:selected="selected" @row-click="selectRow"
    :style="`height: ${props.contentHeight || 400}px;`">
    <template v-slot:top>
      <q-card-actions class="fit">
        <Button label="Новый проект" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
        }" :dark="props.dark" />
        <Button v-if="selected.length > 0" label="Изменить" @click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <Button label="Удалить" v-if="selected.length > 0" disable @click="remove" :dark="props.dark" />
        <q-space />
        <TTInputTextSingle label="Поиск" :dark="props.dark" v-model="filter" />
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
      <TTCheckbox v-model="props.selected" />
    </template>
    <template v-slot:body-selection="props">
      <TTCheckbox v-model="props.selected" />
    </template>
  </q-table>
  <PPDialog label="Новый проект" v-model="dialogAdd" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section>
      <TTInputTextSingle label="Наименование" :dark="props.dark" v-model="modelInput.name" />
      <Button label="Создать" :disable="!modelInput.name" :dark="props.dark" @click="add" />
    </q-card-section>
  </PPDialog>

  <PPDialog label="Изменение проекта" v-model="dialogUpdate" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section>
      <TTInputTextSingle label="Наименование" :dark="props.dark" v-model="modelInput.name" />
      <Button label="Изменить" :disable="!modelInput.name" :dark="props.dark" @click="change" />
    </q-card-section>
  </PPDialog>
</template>
<script setup>
import {
  ref,
  defineProps,
  onMounted,
} from 'vue';
import Button from 'src/components/TTBtn.vue';
import TTInputTextSingle from 'src/components/TTInputTextSingle.vue';
import TTCheckbox from 'src/components/TTCheckbox.vue';
import PPDialog from 'src/components/PPDialog.vue';

document.title = 'Проекты';
const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  contentHeight: Number,
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
  selected.value.length = 0;
  load.value = true;
  props.authStore.authorizedRequest(`get`, 'projects').then((resp) => {
    rows.value.length = 0;
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
  props.authStore.authorizedRequest('post', `projects`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch(() => props.showError('Ошибка при создании данных'));
}
function change() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `projects/${selected.value[0].id}`, query).then(() => {
    dialogUpdate.value = false;
    update();
  }).catch(() => props.showError('Ошибка при изменении данных'));
}
function remove() {
  props.showConfirm(`Удалить проект ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `projects/${selected.value[0].id}`).then(() => {
      update();
    }).catch(() => props.showError('Ошибка при удалении данных'));
  });
}
onMounted(() => {
  update();
});
</script>
