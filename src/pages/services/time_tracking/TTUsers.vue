<template>
  <q-table :class="`${props.dark ? 'pp-dark' : 'pp-light'} fix-table cursor-pointer`" square :dark="props.dark" dense
    flat :rows="rows" :columns="[

      {
        name: 'email',
        label: 'Логин',
        align: 'left',
        field: 'email',
        sortable: true,
        edit: false,
        style: 'min-width: 170px; max-width: 170px;',
      },
      {
        name: 'name',
        label: 'Имя',
        align: 'left',
        field: 'name',
        sortable: true,
        edit: false,
        style: 'min-width: 170px; max-width: 170px;',
      },
      {
        name: 'role',
        label: 'Роль',
        align: 'center',
        sortable: true,
        field: (row) => (row.role ? row.role.name : ''),
        edit: true,
        type: 'selector',
        options: (row) => type_roles,
        style: 'min-width: 170px; max-width: 170px;',
      },
      {
        name: 'branch',
        label: 'Группа',
        align: 'center',
        sortable: true,
        field: (row) => (row.branch ? row.branch.name : ''),
        edit: true,
        type: 'selector',
        options: (row) => type_branches,
        style: 'min-width: 170px; max-width: 170px;',
      },
      {
        name: 'status',
        label: 'Статус',
        align: 'center',
        sortable: true,
        field: (row) => (row.status ? row.status.name : ''),
        edit: true,
        type: 'selector',
        options: (row) => type_statuses,
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
          Пользователи
        </div>
        <Button icon="add" label="Новый пользователь" @click="() => {
          dialogAdd = true;
          modelInput.name = '';
          modelInput.branch = type_branches[0];
          modelInput.email = '';
          modelInput.password = '';
          modelInput.passwordConfirm = '';
        }" :dark="props.dark" />
        <Button label="Переименовать" v-if="selected.length > 0" icon="edit" @click="() => {
          dialogUpdateName = true;
          modelInput.name = selected[0].name;
        }" :dark="props.dark" />
        <Button label="Сменить пароль" v-if="selected.length > 0" icon="edit" @click="() => {
          dialogUpdatePassword = true;
          modelInput.password = '';
          modelInput.passwordConfirm = '';
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
          <span v-if="props.col.type == 'checkbox'" style="font-size: 24px;">
            <InputCheckbox :disable="!isEdit(props.row)" v-model="props.row[props.col.name]" :dark="props.dark"
              @update:model-value="(val) => {
                save(props.row.id, props.col.name, val);
              }" />
          </span>
          <span v-else-if="props.col.type == 'selector'">
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
    <template v-slot:header-selection="props">
      <TTCheckbox v-model="props.selected" :dark="props.dark" />
    </template>
    <template v-slot:body-selection="props">
      <TTCheckbox v-model="props.selected" :dark="props.dark" />
    </template>
  </q-table>
  <PPDialog v-model="dialogAdd" label="Новый пользователь" :dark="props.dark" styleContent="width: 400px;">
    <q-card-section>
      <form ref="loginForm" class="q-pa-md q-gutter-sm" @submit.prevent="registry">
        <TTInputTextSingle label="Логин (адрес почты)" required :dark="props.dark" type="email"
          v-model="modelInput.email" :submit-on-enter="false" :blur-on-enter="false" @enter="registry" />
        <TTInputTextSingle label="Имя" required :dark="props.dark" v-model="modelInput.name" :submit-on-enter="false"
          :blur-on-enter="false" @enter="registry" />
        <InputSelect v-model="modelInput.branch" :options="type_branches" :dark="props.dark" />
        <TTInputTextSingle label="Пароль" required :dark="props.dark" type="password" v-model="modelInput.password"
          :submit-on-enter="true" :blur-on-enter="false" @enter="registry" @submit="registry" />
        <TTInputTextSingle label="Пароль (повторно)" required :dark="props.dark" type="password"
          v-model="modelInput.passwordConfirm" :submit-on-enter="true" :blur-on-enter="false" @enter="registry"
          @submit="registry" />
        <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
          <Button icon="how_to_reg" label="Зарегистрировать" type="submit" :dark="props.dark"
            style="padding-left: 10px; padding-right: 10px;" />
        </div>
      </form>
    </q-card-section>
  </PPDialog>

  <PPDialog v-model="dialogUpdateName" label="Изменение имени пользователя" :dark="props.dark"
    styleContent="width: 400px;">
    <q-card-section>
      <form ref="loginForm" class="q-pa-md q-gutter-sm" @submit.prevent="changeName">
        <TTInputTextSingle label="Имя" required :dark="props.dark" v-model="modelInput.name" :submit-on-enter="false"
          :blur-on-enter="false" @enter="changeName" />
        <div class="row justify-end" style="margin-top: 15px; margin-bottom: -15px; margin-right: 8px;">
          <Button icon="how_to_reg" label="Изменить" type="submit" :dark="props.dark"
            style="padding-left: 10px; padding-right: 10px;" />
        </div>
      </form>
    </q-card-section>
  </PPDialog>

  <PPDialog v-model="dialogUpdatePassword" label="Смена пароля пользователя" :dark="props.dark"
    styleContent="width: 400px;">
    <q-card-section>
      <form ref="loginForm" class="q-pa-md q-gutter-sm" @submit.prevent="changePassword">
        <TTInputTextSingle label="Пароль" required :dark="props.dark" type="password" v-model="modelInput.password"
          :submit-on-enter="true" :blur-on-enter="false" @enter="changePassword" @submit="changePassword" />
        <TTInputTextSingle label="Пароль (повторно)" required :dark="props.dark" type="password"
          v-model="modelInput.passwordConfirm" :submit-on-enter="true" :blur-on-enter="false" @enter="changePassword"
          @submit="changePassword" />
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
import TTCheckbox from 'src/components/InputCheckbox.vue';
import InputSearch from 'src/components/InputSearch.vue';
import InputSelect from 'src/components/InputSelect.vue';
import InputCheckbox from 'src/components/InputCheckbox.vue';

document.title = 'Пользователи';
const props = defineProps({
  showError: Function,
  showConfirm: Function,
  showInfo: Function,
  dark: Boolean,
  authStore: Object,
});


const rows = ref([]);
const type_branches = ref([]);
const type_statuses = ref([]);
const type_roles = ref([]);
const load = ref(false);
const filter = ref('');
const selected = ref([]);
const dialogAdd = ref(false);
const dialogUpdateName = ref(false);
const dialogUpdatePassword = ref(false);
const modelInput = ref({
  email: '',
  name: '',
  branch: type_branches.value[0],
  password: '',
  passwordConfirm: '',
});
const pagination = ref({
  rowsPerPage: 0,
});
function isEdit(row) {
  return props.authStore.isAdministrator && row.id !== props.authStore.getUser.id;
}
function update() {
  load.value = true;
  selected.value.length = 0;
  rows.value.length = 0;
  props.authStore.authorizedRequest('get', `users?order=DESC`).then((respUS) => {
    rows.value.push(...respUS.data.map((r) => {
      return {
        ...r,
        branch: type_branches.value.find((b) => b.id === r.branch),
        status: type_statuses.value.find((b) => b.id === r.status),
        role: type_roles.value.find((b) => b.id === r.role),
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
function registry() {
  const query = {
    email: modelInput.value.email,
    name: modelInput.value.name,
    branch: modelInput.value.branch.id,
    password: modelInput.value.password,
    passwordConfirm: modelInput.value.passwordConfirm
  };
  props.authStore.authorizedRequest('post', `register`, query).then(() => {
    dialogAdd.value = false;
    update();
  }).catch((err) => {
    let message = err.status === 409 ? 'Пользователь с таким именем или логином уже существует' : 'Ошибка сервера';
    props.showError(message);
  });
}

function changeName() {
  const query = { name: modelInput.value.name };
  props.authStore.authorizedRequest('post', `users/${selected.value[0].id}`, query).then(() => {
    dialogUpdateName.value = false;
    update();
    props.showInfo('Данные успешно изменены');
  }).catch((err) => {
    let message = err.status === 409 ? 'Пользователь с таким именем уже существует' : 'Ошибка сервера';
    props.showError(message);
  });
}

function changePassword() {
  const query = { password: modelInput.value.password, passwordConfirm: modelInput.value.passwordConfirm };
  props.authStore.authorizedRequest('post', `users/${selected.value[0].id}`, query).then(() => {
    dialogUpdatePassword.value = false;
    update();
    props.showInfo('Пароль успешно изменен');
  }).catch((err) => {
    let message = err.status === 400 ? 'Пароли не совпадают' : 'Ошибка сервера';
    props.showError(message);
  });
}

function save(id, col, value) {
  if (col !== undefined && id !== undefined && value !== undefined) {
    const updateRow = {};
    updateRow[col] = value;
    props.authStore.authorizedRequest('post', `users/${id}`, updateRow).catch((err) => {
      console.log(err);
      let message = err.status === 422 ? 'Недостаточно прав' : 'Ошибка сервера';
      props.showError(message);
      update();
    });
  }
}

function remove() {
  props.showConfirm(`Удалить пользователя ${selected.value[0].name}?`, () => {
    props.authStore.authorizedRequest('delete', `users/${selected.value[0].id}`).then(() => {
      update();
    }).catch(() => props.showError('Ошибка при удалении данных'));
  });
}
onMounted(() => {
  type_branches.value.length = 0;
  type_statuses.value.length = 0;
  type_roles.value.length = 0;
  props.authStore.authorizedRequest('get', `roles`).then((respTR) => {
    type_roles.value.push(...respTR.data);
    props.authStore.authorizedRequest('get', `statuses`).then((respTS) => {
      type_statuses.value.push(...respTS.data);
      props.authStore.authorizedRequest('get', `branches`).then((respBR) => {
        type_branches.value.push(...respBR.data);
        update();
      }).catch((err) => {
        console.log(err);
        props.showError('Ошибка при загрузке данных');
      });
    }).catch((err) => {
      console.log(err);
      props.showError('Ошибка при загрузке данных');
    });
  }).catch((err) => {
    console.log(err);
    props.showError('Ошибка при загрузке данных');
  });

});
</script>
