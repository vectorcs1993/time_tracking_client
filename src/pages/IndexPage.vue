<template>
  <q-page class="pp-light">
    <q-card-section>
      <div class="text-h6">Учет пользователей</div>
    </q-card-section>
    <q-tabs no-caps dense align="left" dark indicator-color="transparent" :stretch="true" active-color="white"
      active-bg-color="grey-8" class="`pp-bg-dark text-grey no-pa-ma q-ml-md" v-model="tab">
      <q-tab name="users">
        Пользователи
      </q-tab>
      <q-tab name="branches">
        Подразделения
      </q-tab>
    </q-tabs>
    <q-tab-panels v-model="tab" class="pp-light">
      <q-tab-panel name="users" style="padding: 0;">
        <q-table :columns="columnsUsers" :rows="rowsAllUsers" v-model:selected="selected" selection="single"
          :filter="search" dark :body-cell-slot="true" class="pp-light fit" @row-click="selectRow"
          style=" min-width: 800px; height: 900px;" row-key="id" flat dense :filter-method="find" virtual-scroll
          :hide-selected-banner="true" :rows-per-page-options="[30]" separator="cell"
          :no-results-label="`По запросу '${search}' ничего не найдено`" grid-header wrap-cells>
          <template v-slot:top>
            <q-card-actions class="fit row justify-between" style="padding: 0;">
              <div>
                <PPBtnAdd v-if="isAdmin()" dark class="q-mr-sm" @click="() => {
                  dialogAdd = true;
                  errorMes = '';
                  user = ({
                    name: '',
                    password: '',
                    email: '',
                    role: role,
                    branch_id: branches[0],
                  });
                  secondPass = '';
                }" />
                <PPBtnChange v-if="isAdmin()" v-show="selected[0]" dark class="q-mr-sm" label="Изменить пароль" @click="() => {
                  dialogEdit = true;
                  errorMes = '';
                  secondPass = '';
                  user = ({
                    name: selected[0].name,
                    password: selected[0].password,
                  });
                }" />
                <PPBtnDelete v-if="isAdmin()" disable v-show="selected[0]" dark class="q-mr-sm" @click="() => {
                  errorMes = '';
                  dialogDelete = true;
                }" />
              </div>
              <div class="row items-center">
                <PPSimpleSelect :options="op" v-model="filterOptions" />
                <PPSearchInput dark :placeholder="'Поиск'" v-model="search" />
              </div>

            </q-card-actions>
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props" style="margin-left: -20px;">
              <div class="row justify-between items-center">
                <div>{{ props.value }}</div>
                <q-btn label="" flat dense color="white" icon="edit" v-if="props.col.type == 'input' && isAdmin()"
                  @click="() => {
                    user.name = props.row.name;
                    smallEditName = true;
                  }" />
                <q-btn label="" flat dense color="white" icon="edit" v-if="props.col.type == 'select' && isAdmin()"
                  @click="() => {
                    user.branch_id = branches.find((r) => props.row.branch_id === r.id);
                    smallEditBranch = true;
                  }" />
                <q-btn label="" flat dense color="white" icon="edit" v-if="props.col.type == 'role' && isAdmin()"
                  @click="() => {
                    user.role = sRoles.find((r) => r.value === props.row.role).label;
                    smallEditRole = true;
                  }" />
              </div>
            </q-td>
          </template>
          <template v-slot:header-cell="props">
            <q-th :props="props">
              {{ props.col.label }}
            </q-th>
          </template>
        </q-table>
      </q-tab-panel>
      <q-tab-panel name="branches" style="padding: 0;">
        <q-table :columns="columnsBranches" :rows="branches" v-model:selected="selectedBranch" selection="single"
          :filter="searchBranch" dark :body-cell-slot="true" class="pp-light full-width" @row-click="selectRowBranch"
          style=" min-width: 800px;" row-key="id" flat dense :filter-method="find" virtual-scroll
          :hide-selected-banner="true" :rows-per-page-options="[30]" separator="cell"
          :no-results-label="`По запросу '${search}' ничего не найдено`" grid-header wrap-cells>
          <template v-slot:top>
            <q-card-actions class="fit row justify-between" style="padding: 0;">
              <div>
                <PPBtnAdd v-if="isAdmin()" dark class="q-mr-sm" @click="() => {
                  dialogAddBranch = true;
                  errorMes = '';
                  branch = ({
                    name: '',
                  });
                }" />
                <PPBtnChange v-if="isAdmin()" v-show="selectedBranch[0]" dark class="q-mr-sm" @click="() => {
                  dialogEditBranch = true;
                  errorMes = '';
                  branch = ({
                    name: selectedBranch[0].name,
                  });
                }" />
                <PPBtnDelete v-if="isAdmin()" disable v-show="selectedBranch[0]" dark class="q-mr-sm" @click="() => {
                  errorMes = '';
                  dialogDeleteBranch = true;
                }" />
              </div>
              <PPSearchInput dark :placeholder="'Поиск'" v-model="search" />
            </q-card-actions>
          </template>
          <template v-slot:body-cell="props">
            <q-td :props="props" style="margin-left: -20px;">
              {{ props.value }}
            </q-td>
          </template>
          <template v-slot:header-cell="props">
            <q-th :props="props">
              {{ props.col.label }}
            </q-th>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <PPDialog persistent v-model="dialogAdd" :label="'Добавить пользователя'"
      :styleContent="'width: 600px; overflow-y: hidden;'">
      <q-card class="dark pp-light q-pa-sm">
        <q-card-section>
          <form @submit.prevent="saveUser">
            <PPInputSingle label="Имя пользователя" class="q-ma-md" v-model="user.name" :rules="[
              val => val.length > 0 || 'Имя пользователя не может быть пустым']" />
            <PPInputSingle label="Email" class="q-ma-md" v-model="user.email" type="email" :rules="[
              val => val.length > 0 || 'Email не может быть пустым',
              val => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val) || 'Email должен содержать @ и только английские буквы',
              val => !emailExists(val) || 'Пользователь с таким email уже существует'
            ]" />
            <PPInputSingle label="Пароль" class="q-ma-md" v-model="user.password" dark :rules="[
              val => val.length > 0 || 'Пароль не может быть пустым']" />
            <PPInputSingle label="Подтвердить пароль" class="q-ma-md" v-model="secondPass" dark :rules="[
              val => (val.length > 0 && val === user.password) || 'Пароль не совпадает']" />
            <PPSimpleSelect label="Подразделение" class="q-ma-md" v-model="user.branch_id" :options="branches" />
            <PPPrimitiveSelect label="Роль" class="q-ma-md" v-model="user.role" :options="sRoles" />
            <q-card-actions class="justify-center">
              <PPBtn label="Создать" type="submit"
                :disable="!user.name || !user.email || !user.password || user.password != secondPass || emailExists(user.email)" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>

      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="dialogEdit" :label="'Изменить пароль'"
      :styleContent="'width: 600px; overflow-y: hidden;'">
      <q-card class="dark pp-light q-pa-sm">
        <q-card-section class="no-ma">
          <form @submit.prevent="changePass">
            <PPInputSingle label="Пароль" class="q-ma-md" v-model="user.password" dark :rules="[
              val => val != '' || 'Пароль не может быть пустым']" />
            <PPInputSingle label="Подтвердить пароль" class="q-ma-md" v-model="secondPass" dark :rules="[
              val => (val != '' && val === user.password) || 'Пароль не совпадает']" />
            <q-card-actions class="justify-center">
              <PPBtn label="Сохранить" type="submit"
                :disable="!user.password || !secondPass || (user.password != secondPass)" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>

      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="dialogDelete" :label="'Удалить пользователя'"
      :styleContent="'width: 400px; overflow-y: hidden;'">
      <q-card class="dark pp-light q-pa-sm">
        <div>Вы уверены?</div>
        <q-card-actions class="justify-center">
          <PPBtn label="Да" @click="deleteUser" />
          <PPBtn label="Отмена" v-close-popup />
        </q-card-actions>
        <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="dialogAddBranch" :label="'Добавить подразделение'"
      :styleContent="'width: 500px; overflow-y: hidden;'">
      <q-card class="dark pp-light q-pa-sm">
        <q-card-section class="no-ma">
          <form @submit.prevent="saveBranch">
            <PPInputSingle label="Название подразделения" class="q-ma-md" v-model="branch.name" :rules="[
              val => val.length > 0 || 'Название подразделения не может быть пустым',
              val => !branchExists(val) || 'Подразделение с таким названием уже существует']" />
            <q-card-actions class="justify-center">
              <PPBtn label="Создать" type="submit" :disable="!branch.name || branchExists(branch.name)" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>

      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="dialogEditBranch" :label="'Изменить название подразделения'"
      :styleContent="'width: 500px; overflow-y: hidden;'">
      <q-card class="dark pp-light q-pa-sm">
        <q-card-section class="no-ma">
          <form @submit.prevent="editBranch">
            <PPInputSingle label="Название подразделения" class="q-ma-md" v-model="branch.name" :rules="[
              val => val.length > 0 || 'Название подразделения не может быть пустым']" />
            <q-card-actions class="justify-center">
              <PPBtn label="Изменить" type="submit" :disable="!branch.name" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>

      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="smallEditName" :label="'Изменить имя пользователя'"
      :styleContent="'width: 400px; overflow-y: hidden;'">
      <q-card class="dark pp-light">
        <q-card-section class="no-ma">
          <form @submit.prevent="changeName">
            <PPInputSingle label="Имя пользователя" class="q-ma-md" v-model="user.name" :rules="[
              val => val.length > 0 || 'Название подразделения не может быть пустым']" />
            <q-card-actions class="justify-center">
              <PPBtn label="Изменить" type="submit" :disable="!user.name" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>
      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="smallEditBranch" :label="'Выбор подразделения'"
      :styleContent="'width: 400px; overflow-y: hidden;'">
      <q-card class="dark pp-light">
        <q-card-section class="no-ma">
          <form @submit.prevent="changeUserBranch">
            <PPSimpleSelect label="Подразделение" class="q-ma-md" v-model="user.branch_id" :options="branches" />
            <q-card-actions class="justify-center">
              <PPBtn label="Изменить" type="submit" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>
      </q-card>
    </PPDialog>
    <PPDialog persistent v-model="smallEditRole" :label="'Изменение роли'"
      :styleContent="'width: 400px; overflow-y: hidden;'">
      <q-card class="dark pp-light">
        <q-card-section class="no-ma">
          <form @submit.prevent="changeRole">
            <PPPrimitiveSelect label="Роль" class="q-ma-md" v-model="user.role" :options="sRoles" />
            <q-card-actions class="justify-center">
              <PPBtn label="Изменить" type="submit" />
            </q-card-actions>
          </form>
          <div class="justify-center" v-if="errorMes.length > 0" style="color: red">{{ errorMes }}</div>
        </q-card-section>
      </q-card>
    </PPDialog>
  </q-page>

</template>
<script setup>
import { inject, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import store from 'src/store';
import PPSearchInput from 'src/components/inputs/PPSearchInput.vue';
const { getQuery, postQuery, deleteQuery, isAdmin } = inject('store');

import PPBtn from 'src/components/buttons/PPBtn.vue';
import PPBtnAdd from 'src/components/buttons/PPBtnAdd.vue';
import PPBtnChange from 'src/components/buttons/PPBtnChange.vue';
import PPBtnDelete from 'src/components/buttons/PPBtnDelete.vue';
import PPDialog from 'src/components/dialogs/PPDialog.vue';
import PPInputSingle from 'src/components/inputs/PPInputSingle.vue';
import PPSimpleSelect from 'src/components/selects/PPSimpleSelect.vue';
import PPPrimitiveSelect from 'src/components/selects/PPPrimitiveSelect.vue';

const tab = ref('users');
const router = useRouter();
const rowsAllUsers = ref([]);
const errorMes = ref('');
const secondPass = ref('');
const dialogAddBranch = ref(false);
const columnsUsers = [
  {
    name: 'name',
    label: 'Имя пользователя',
    align: 'left',
    field: 'name',
    sortable: true,
    type: 'input',
  },
  {
    name: 'email',
    label: 'Email',
    align: 'left',
    field: 'email',
    sortable: true,
  },
  {
    name: 'role',
    label: 'Роль',
    align: 'left',
    field: 'role',
    format: (val) => `${(sRoles.value.find((el) => el.value === val)).label}`,
    type: 'role',
    sortable: true,
  },
  {
    name: 'branch',
    label: 'Подразделение',
    align: 'left',
    field: 'branch_id',
    format: (val) => `${getBranch(val)}`,
    sortable: true,
    type: 'select',
  },
  {
    name: 'status',
    label: 'Статус',
    align: 'left',
    field: 'status',
    format: (val) => `${sStatuses.value.find((r) => r.value == val).label}`,
    sortable: true,
  }
];
const columnsBranches = [
  {
    name: 'name',
    label: 'Наименование',
    align: 'left',
    field: 'name',
    sortable: true,
  }
];
const sRoles = ref();
const sStatuses = ref();
const branches = ref([]);
const dialogAdd = ref(false);
const role = ref({ value: 'user', label: 'Пользователь' });
const dialogEdit = ref(false);
const dialogDelete = ref(false);
const smallEditName = ref(false);
const smallEditBranch = ref(false);
const smallEditRole = ref(false);
const dialogEditBranch = ref(false);
const search = ref('');
const searchBranch = ref('');
const selected = ref([]);
const selectedBranch = ref([]);

const op = [];
for (let index = 0; index < columnsUsers.length; index += 1) {
  op.push({ id: index, name: columnsUsers[index].label });
}
const filterOptions = ref(op[0]);

const user = ref({
  name: '',
  password: '',
  email: '',
  role: role,
  branch_id: branches.value[0],
});
const branch = ref();
function getBranch(val) {
  const b = branches.value.find((r) => r.id === val);
  if (b) {
    return b.name;
  }
  return undefined;
}
function selectRow(event, row) {
  selected.value.length = 0;
  selected.value.push(row);
}
function getUser() {
  return store.storeVue.state.user;
}
function selectRowBranch(event, row) {
  selectedBranch.value.length = 0;
  selectedBranch.value.push(row);
}
function emailExists(email) {
  return rowsAllUsers.value.find((user) => user.email === email);
}
function branchExists(branch) {
  return branches.value.find((br) => br.name === branch);
}
function errsCheck(err) {
  if (err.status === 401 || err.status === 403) {
    simpleLogout();
  }
  else if (err.status === 409) {
    errorMes.value = 'Объект уже существует!';
  }
  else if (err.status === 400 || err.status === 404) {
    errorMes.value = 'Невалидные данные!';
  }
  else if (err.status === 500) {
    errorMes.value = 'Ошибка сервера!';
  }
}
async function saveUser() {
  const newUser = {
    name: String(user.value.name),
    branch_id: Number(branches.value.find((branch) => branch.name === user.value.branch_id.name).id),
    email: String(user.value.email),
    role: String(user.value.role.value),
    password: String(user.value.password),
  };
  try {
    await postQuery('http://nsk-deb-srv.nevatom.ru:3005/auth/register', newUser);
    await updateUsers();
    dialogAdd.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function saveBranch() {
  try {
    await postQuery('http://nsk-deb-srv.nevatom.ru:3005/branches', branch.value);
    await updateUsers();
    dialogAddBranch.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function editBranch() {
  try {
    await postQuery(`http://nsk-deb-srv.nevatom.ru:3005/branches/${selectedBranch.value[0].id}`, { name: String(branch.value.name) });
    await updateUsers();
    dialogEditBranch.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function changePass() {
  console.log(user.value.password);
  try {
    await postQuery(`http://nsk-deb-srv.nevatom.ru:3005/users/${selected.value[0].id}`, { password: String(user.value.password) });
    if (getUser().id === selected.value[0].id) {
      simpleLogout();
    }
    dialogEdit.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function changeName() {
  console.log(getUser());
  try {
    await postQuery(`http://nsk-deb-srv.nevatom.ru:3005/users/${selected.value[0].id}`, { name: String(user.value.name) });
    await updateUsers();
    if (getUser().id === selected.value[0].id) {
      simpleLogout();
    }
    smallEditName.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function changeUserBranch() {
  try {
    await postQuery(`http://nsk-deb-srv.nevatom.ru:3005/users/${selected.value[0].id}`, { branch_id: Number(branches.value.find((branch) => branch.name === user.value.branch_id.name).id) });
    if (getUser().id === selected.value[0].id) {
      simpleLogout();
    }
    await updateUsers();
    smallEditBranch.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function changeRole() {
  console.log(String(user.value.role.value));
  try {
    await postQuery(`http://nsk-deb-srv.nevatom.ru:3005/users/${selected.value[0].id}`, { role: String(user.value.role.value) });
    await updateUsers();
    if (getUser().id === selected.value[0].id) {
      simpleLogout();
    }
    smallEditRole.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
async function deleteUser() {
  try {
    await deleteQuery(`http://nsk-deb-srv.nevatom.ru:3005/users/${selected.value[0].id}`);
    await updateUsers();
    dialogDelete.value = false;
  } catch (err) {
    errsCheck(err);
  }
}
function simpleLogout() {
  store.storeVue.dispatch('tokenDied').then(() => {
    router.replace('/login');
  });
}
async function updateUsers() {
  branches.value.length = 0;
  errorMes.value = '';
  try {
    const [branchesResp, rolesResp, statusesResp, usersResp] = await Promise.all([
      getQuery('http://nsk-deb-srv.nevatom.ru:3005/branches'),
      getQuery('http://nsk-deb-srv.nevatom.ru:3005/users/roles'),
      getQuery('http://nsk-deb-srv.nevatom.ru:3005/users/statuses'),
      getQuery('http://nsk-deb-srv.nevatom.ru:3005/users')
    ]);
    branches.value = branchesResp.data;
    sRoles.value = rolesResp.data;
    sStatuses.value = statusesResp.data;
    if (usersResp.status === 200) {
      rowsAllUsers.value = usersResp.data;
      console.log(rowsAllUsers.value);
    } else if (usersResp.status === 401 || usersResp.status === 403) {
      simpleLogout();
    }
  } catch (error) {
    console.error('Error updating users:', error);
    simpleLogout();
  }
}
function getIndexColumnOfSelected(value) {
  let index = -1;
  columnsUsers.forEach((element) => {
    if (element.label === value) {
      index = columnsUsers.indexOf(element);
    }
  });
  return index;
}
function find(rows_, terms, cols, cellValue) {
  const lowerTerms = terms ? terms.toLowerCase() : '';
  return rows_.filter((row) => [cols[getIndexColumnOfSelected(filterOptions.value.name)]].some(
    (col) => ((`${cellValue(col, row)}`).toLowerCase().indexOf(lowerTerms) !== -1),
  ));
}
onMounted(() => {
  updateUsers();
  console.log(getUser());
})
</script>
