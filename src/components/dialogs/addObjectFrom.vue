<template>
  <q-dialog class="text-white text-h6" v-model="dialog" persistent>
    <q-card style="min-width: 95vw; background-color: rgb(60, 60, 60);">
      <q-bar class="row" style="background-color: rgb(80, 80, 80);">
        <div>{{ name }}</div>
        <q-space />
        <q-btn dense icon="close" v-close-popup />
      </q-bar>
      <q-card-section>
        <q-splitter v-model="splitter" style="height: 70vh">
          <template v-slot:before>
            <Table ref="refAddMaterials" dense :columnsDef="columnsAdd" :rowsDef="rowsAdd" style="height: 90vh;"
              styleContent="max-height: 70vh; background-color: rgb(60, 60, 60);" :colFilterIndex="1"
              :updateSearch="updateSearch" :actionRow="addObjectsForBuffer" :selection="type">
              <template v-slot:actions>
                <q-btn v-show="isAddObject() && isAddOfType()" color='orange' label='В список'
                  @click="addObjectsForBuffer" style="margin-left: 15px; margin-right: 15px;" />
              </template>
              <template v-slot:cell="{ arg }">
                <q-td :props="arg">
                  <template v-if="arg.col.name == 'name'">
                    <q-icon size="28px" class="q-mr-sm" :name="arg.row.iconStat" :color="arg.row.iconStatColor" />
                    <q-icon size="28px" class="q-mr-sm" :name="arg.row.icon" />
                  </template>
                  <span class="text-h6">
                    {{ arg.value }}
                  </span>
                </q-td>
              </template>
            </Table>
          </template>
          <template v-slot:after>
            <Table ref="refAddMaterialsBuffer" dense :columnsDef="columnsAddBuffer"
              styleContent="max-height: 70vh; background-color: rgb(60, 60, 60);" :rowsDef="rowsAddBuffer"
              :hideShearch="true">
              <template v-slot:actions>
                <q-btn v-show="isAddMaterialBuffer()" color='red' label='Убрать' @click="removeMaterialsFromBuffer"
                  style="margin-right: 15px;" />
              </template>
              <template v-slot:cell="{ arg }">
                <q-td :props="arg">
                  <template v-if="arg.col.name == 'name'">
                    <q-icon size="28px" class="q-mr-sm" :name="arg.row.iconStat" :color="arg.row.iconStatColor" />
                    <q-icon size="28px" class="q-mr-sm" :name="arg.row.icon" />
                  </template>

                  <span class="text-h6">
                    {{ arg.value }}
                  </span>
                </q-td>
              </template>
            </Table>
          </template>
        </q-splitter>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn :disable="rowsAddBuffer.length == 0" color='green' label='Обновить и закрыть' @click="() => {
          exitAndSave(rowsAddBuffer);
          dialog = false;
        }" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
import {
  defineComponent, ref, inject,
} from 'vue';
import Table from 'src/components/tables/table_universal.vue';

export default defineComponent({
  name: 'DialogAddFromObject',
  components: {
    Table,
  },
  setup() {
    const dialog = ref(false);
    const rowsAdd = ref([]);
    const rowsAddBuffer = ref([]);
    const name = ref('');
    const splitter = ref(70);
    const columnsAdd = ref([]);
    const columnsAddBuffer = ref([]);
    const objects = ref([]);
    const refAddMaterials = ref(null);
    const refAddMaterialsBuffer = ref(null);
    const type = ref('multuply');
    const {
      host,
    } = inject('store');
    function openEdit() {
      objects.value.length = 0;
    }
    function setSplitter(value) {
      splitter.value = value;
    }
    function show(value) {
      dialog.value = value;
    }
    function setName(value) {
      name.value = String(value);
    }
    function updateRows() {
      rowsAdd.value.length = 0;
      for (let index = 0; index < objects.value.length; index += 1) {
        const element = objects.value[index];
        rowsAdd.value.push(element);
      }
    }
    function setColumnAdd(list) {
      columnsAdd.value.length = 0;
      list.forEach((element) => {
        columnsAdd.value.push(element);
      });
    }
    function setColumnAddBuffer(list) {
      columnsAddBuffer.value.length = 0;
      list.forEach((element) => {
        columnsAddBuffer.value.push(element);
      });
    }
    function setAllObjects(list) {
      objects.value.length = 0;
      list.forEach((element) => {
        objects.value.push(element);
      });
      updateRows();
    }
    function setBufferMaterials(list) {
      rowsAddBuffer.value.length = 0;
      list.forEach((element) => {
        rowsAddBuffer.value.push(element);
      });
    }
    function setType(value) {
      type.value = value;
    }
    // служебные
    function updateSearch() {
      refAddMaterials.value.resetSelect();
    }
    function isAddObject() {
      if (refAddMaterials.value) {
        return refAddMaterials.value.getSelect().length > 0;
      }
      return false;
    }
    function isAddMaterialBuffer() {
      if (refAddMaterialsBuffer.value) {
        return refAddMaterialsBuffer.value.getSelect().length > 0;
      }
      return false;
    }
    function isAddOfType() {
      return type.value === 'multiple' || (type.value === 'single' && rowsAddBuffer.value.length < 1);
    }

    function addObjectsForBuffer() {
      refAddMaterials.value.getSelect().forEach((element) => {
        let add = true;
        rowsAddBuffer.value.forEach((elementBuffer) => {
          if (element.type.id === elementBuffer.type.id && element.id === elementBuffer.id) {
            add = false;
          }
        });
        if (add) {
          if (isAddOfType()) {
            rowsAddBuffer.value.push(element);
          }
        }
      });
    }
    function removeMaterialsFromBuffer() {
      const i = refAddMaterialsBuffer.value.rows.findIndex((r) => refAddMaterialsBuffer.value.getSelect()[0].id === r.id);
      if (i !== -1) {
        refAddMaterialsBuffer.value.rows.splice(0, 1);
      }
      refAddMaterialsBuffer.value.getSelect().length = 0;
    }
    function exitAndSave(buffer) {
      console.log(buffer);
    }
    return {
      openEdit,
      dialog,
      rowsAdd,
      rowsAddBuffer,
      name,
      type,
      show,
      setName,
      setAllObjects,
      setBufferMaterials,
      updateRows,
      setColumnAdd,
      setColumnAddBuffer,
      setSplitter,
      setType,
      updateSearch,
      isAddObject,
      isAddOfType,
      isAddMaterialBuffer,
      addObjectsForBuffer,
      removeMaterialsFromBuffer,
      exitAndSave,
      pagination: ref({
        rowsPerPage: 0,
      }),
      splitter,
      columnsAdd,
      columnsAddBuffer,
      objects,
      refAddMaterials,
      refAddMaterialsBuffer,
    };
  },

});
</script>
