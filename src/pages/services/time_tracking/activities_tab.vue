<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer`" square :dark="props.dark" dense
    flat :rows="rows" :columns="[
      {
        name: 'name',
        required: true,
        label: 'Наименование',
        align: 'left',
        field: (row) => row.name,
        format: (val) => `${val}`,
        sortable: true,
        style: 'min-width: 500px',
        edit: false,
      },
    ]" row-key="id" virtual-scroll :hide-selected-banner="true" selection="single" binary-state-sort
    :color="`${props.dark ? 'orange' : 'green'}`" :hide-pagination="false" v-model:pagination="pagination"
    separator="cell" :rows-per-page-options="[1]" wrap-cells grid-header no-data-label="Нет данных" :filter="filter"
    v-model:selected="selected" @row-click="selectRow" style="height: 75vh;">
    <template v-slot:top>
      <q-card-actions class="fit">
        <PPBtnAdd label="Новый" :click="() => {
          dialogAdd = true;
          modelInput.name = '';
        }" :dark="props.dark" />
        <PPBtn label="Редактировать" v-show="selected.length > 0" icon="edit" :click="() => {
          dialogUpdate = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <PPBtn disable label="Удалить" icon="delete" v-show="selected.length > 0" :click="remove" :dark="props.dark" />
        <q-space />
        <q-input dark outlined dense debounce="300" v-model="filter" clearable placeholder="Поиск"
          style="margin: 10px;">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
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
  <q-dialog v-model="dialogAdd" persistent>
    <q-card class="q-pt-none" style="width: 400px; max-width: 95vw;"
      :class="`${props.dark ? 'pp-dark' : 'pp-light'} q-pt-none`" :dark="props.dark">
      <q-bar :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white`" :dark="props.dark">
        <div class="text-h6">Новый целевой объект</div>
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-grey text-white">Закрыть</q-tooltip>
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
        <div class="text-h6">Изменение данных целевого объекта</div>
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
import PPBtn from 'src/components/buttons/PPBtn.vue';
import PPBtnAdd from 'src/components/buttons/PPBtnAdd.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';
import {
  onMounted,
  ref,
  inject,
  defineProps,
} from 'vue';

const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
});

const {
  host,
  getQuery,
  postQuery,
} = inject('store');

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
  rows.value.length = 0;
  getQuery(`${host()}/services/genprice/TimeTrackingActivity`).then((resp) => {
    rows.value.push(...resp.data);
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
  postQuery(`${host()}/services/genprice/TimeTrackingActivity/create`, query)
    .then((res) => {
      dialogAdd.value = false;
      if (res.data.result === 'ok') {
        update();
      } else if (res.data.data === 'name must be unique') {
        props.showError(`Целевой объект "${query.name}" уже существует в базе данных`);
      }
    });
}
function change() {
  const query = { name: modelInput.value.name };
  postQuery(`${host()}/services/genprice/TimeTrackingActivity/update/${selected.value[0].id}`, query)
    .then((res) => {
      dialogUpdate.value = false;
      if (res.data.result === 'ok') {
        update();
      } else if (res.data.data === 'name must be unique') {
        props.showError(`Целевой объект "${query.name}" уже существует в базе данных`);
      }
    });
}
function remove() {
  props.showConfirm(`Удалить целевой объект ${selected.value[0].name}?`, () => {
    getQuery(`${host()}/services/genprice/TimeTrackingActivity/delete/${selected.value[0].id}`).then(() => {
      update();
    });
  });
}
onMounted(() => {
  update();
});
</script>
