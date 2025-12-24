<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer`" square :dark="props.dark" dense
    flat :rows="rows" :columns="[
      {
        name: 'name',
        label: 'Наименование',
        align: 'left',
        field: 'name',
        sortable: true,
        edit: false,
        style: 'min-width: 170px; max-width: 170px;',
      },
      {
        name: 'id',
        label: 'ID',
        align: 'left',
        field: 'id',
        sortable: true,
        edit: false,
        style: 'min-width: 70px; max-width: 70px;',
      },
    ]" row-key="id" virtual-scroll :hide-selected-banner="true" selection="single" binary-state-sort
    :color="`${props.dark ? 'orange' : 'green'}`" :hide-pagination="false" v-model:pagination="pagination"
    separator="cell" :rows-per-page-options="[1]" wrap-cells grid-header no-data-label="Нет данных" :filter="filter"
    v-model:selected="selected" :loading="load" @row-click="selectRow" style="height: 90vh;">
    <template v-slot:top>
      <q-card-actions class="fit q-gutter-sm">
        <div class="text-h6">
          Группы пользователей
        </div>
        <Button icon="add" label="Новая группа" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
        }" :dark="props.dark" />
        <Button label="Переименовать" v-if="selected.length > 0" icon="edit" @click="() => {
          dialogUpdateName = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <Button label="Удалить" icon="delete" v-if="selected.length > 0" @click="remove" :dark="props.dark" />
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
        <div
          :class="`text-size q-pa-xs row fit justify-${props.col.align === 'center' ? 'center' : 'start'} items-center`"
          style="white-space: pre-wrap; min-height: 48px;">
          <span v-if="props.col.type == 'selector'">
            <InputSelect v-if="activeRowId === props.row.id && isEdit(props.row)" cell
              v-model="props.row[props.col.name]" :options="props.col.options(props.row)" :dark="props.dark"
              @update:model-value="(val) => {
                save(props.row.id, props.col.name, val.id);
              }" />
            <span v-else>{{ props.value }}</span>
          </span>
          <div v-else>
            {{ props.value }}
          </div>
        </div>
      </q-td>
    </template>
  </q-table>
  <PPDialog v-model="dialogAdd" label="Новая группа" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section>
      <form ref="loginForm" class="q-pa-md q-gutter-sm" @submit.prevent="add">
        <TTInputTextSingle label="Имя" required :dark="props.dark" v-model="modelInput.name" :submit-on-enter="false"
          :blur-on-enter="false" @enter="add" />
        <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
          <Button icon="how_to_reg" label="Создать" type="submit" :dark="props.dark"
            style="padding-left: 10px; padding-right: 10px;" />
        </div>
      </form>
    </q-card-section>
  </PPDialog>

  <PPDialog v-model="dialogUpdateName" label="Изменение наименования группы" :dark="props.dark"
    styleContent="width: 400px;">
    <q-card-section>
      <form ref="loginForm" class="q-pa-md q-gutter-sm" @submit.prevent="changeName">
        <TTInputTextSingle label="Наименование" required :dark="props.dark" v-model="modelInput.name"
          :submit-on-enter="false" :blur-on-enter="false" @enter="changeName" />
        <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
          <Button icon="how_to_reg" label="Изменить" type="submit" :dark="props.dark"
            style="padding-left: 10px; padding-right: 10px;" />
        </div>
      </form>
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
import InputSearch from 'src/components/InputSearch.vue';
import InputSelect from 'src/components/InputSelect.vue';

document.title = 'Группы пользователей';
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
const dialogUpdateName = ref(false);
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
  props.authStore.authorizedRequest('get', `branches?order=DESC`).then((respUS) => {
    rows.value.push(...respUS.data.map((r) => {
      return {
        ...r,
      }
    }));
    load.value = false;
  }).catch((err) => {
    console.log(err);
    props.showError('Ошибка при загрузке данных');
  });
}
const activeRowId = ref(null);
function selectRow(event, row) {
  activeRowId.value = row.id;
  selected.value.length = 0;
  selected.value.push(row);
}
function add() {
  const query = {
    name: modelInput.value.name,
  };
  props.authStore.authorizedRequest('post', `branches`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch((err) => {
    let message = err.status === 409 ? 'Группа с таким наименованием уже существует' : 'Ошибка сервера';
    props.showError(message);
  });
}

function changeName() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `branches/${selected.value[0].id}`, query).then(() => {
    dialogUpdateName.value = false;
    update();
    props.showInfo('Данные успешно изменены');
  }).catch((err) => {
    let message = err.status === 409 ? 'Группа с таким наименованием уже существует' : 'Ошибка сервера';
    props.showError(message);
  });
}

function save(id, col, value) {
  if (col !== undefined && id !== undefined && value !== undefined) {
    const updateRow = {};
    updateRow[col] = value;
    props.authStore.authorizedRequest('post', `branches/${id}`, updateRow).catch((err) => {
      console.log(err);
      let message = err.status === 422 ? 'Недостаточно прав' : 'Ошибка сервера';
      props.showError(message);
      update();
    });
  }
}

function remove() {
  props.showConfirm(`Удалить группу ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `branches/${selected.value[0].id}`).then(() => {
      update();
    }).catch(() => props.showError('Ошибка при удалении данных'));
  });
}
onMounted(() => {
  update();
});
</script>
