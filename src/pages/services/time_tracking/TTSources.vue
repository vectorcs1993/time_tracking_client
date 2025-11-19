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
    ]" row-key="id" virtual-scroll :hide-selected-banner="true" selection="single" :virtual-scroll-item-size="48"
    :virtual-scroll-sticky-size-start="32" binary-state-sort :color="`${props.dark ? 'orange' : 'green'}`"
    :hide-pagination="false" v-model:pagination="pagination" separator="cell" :rows-per-page-options="[1]" wrap-cells
    grid-header no-data-label="Нет данных" :filter="filter" v-model:selected="selected" @row-click="selectRow"
    :style="`min-height: ${props.contentHeight}px;`">
    <template v-slot:top>
      <q-card-actions class="fit">
        <PPBtnAdd :click="() => {
          dialogAdd = true;
          modelInput.name = '';
        }" :dark="props.dark" />
        <PPBtn v-show="selected.length > 0" icon="edit" :click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <PPBtn icon="delete" v-show="selected.length > 0" :click="remove" :dark="props.dark" />
        <q-space />
        <PPSearchInput v-model="filter" debounce="300" :dark="props.dark" />
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
  <PPDialog v-model="dialogAdd" label="Новый источник поступления" :dark="props.dark">
    <q-card-section>
      <form @submit.prevent="add">
        <PPInputSingle :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
        <PPBtn :dark="props.dark" class="q-ma-md" type="submit">Создать</PPBtn>
      </form>
    </q-card-section>
  </PPDialog>
  <PPDialog v-model="dialogUpdate" label="Изменение источника поступления" :dark="props.dark">
    <q-card-section>
      <form @submit.prevent="change">
        <PPInputSingle :dark="props.dark" required v-model="modelInput.name" type="text" placeholder="Наименование" />
        <PPBtn :dark="props.dark" class="q-ma-md" type="submit">Изменить</PPBtn>
      </form>
    </q-card-section>
  </PPDialog>
</template>
<script setup>
import {
  ref,
  defineProps,
  onMounted,
} from 'vue';
import PPDialog from 'src/components/dialogs/PPDialog.vue';
import PPBtn from 'src/components/TTBtn.vue';
import PPBtnAdd from 'src/components/buttons/PPBtnAdd.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';
import PPSearchInput from 'src/components/inputs/PPSearchInput.vue';

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
  rows.value.length = 0;
  props.authStore.authorizedRequest('get', `sources`).then((resp) => {
    rows.value.push(...resp.data);
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
