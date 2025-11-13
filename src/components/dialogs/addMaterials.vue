<template>
  <PPDialog :dark="dark" v-model="dialog" :label="name" :styleContent="'min-width: 95vw;'">
    <q-card :class="`${dark ? 'pp-dark' : 'pp-light'}`" class="text-size">
      <q-card-section>
        <q-splitter v-model="splitter" style="height: 70vh" :color="`${dark ? 'bg-header-dark' : 'bg-header-light'}`">
          <template v-slot:before>
            <Table_v2 :dark="dark" ref="refAddMaterials" dense :columnsDef="columnsAdd" :rowsDef="rowsAdd"
              style="height: 90vh;" styleContent="max-height: 70vh;" :updateSearch="updateSearch"
              :actionRow="addMaterialsForBuffer">
              <template v-slot:actions>
                <PPBtn v-show="isAddMaterial()" :dark="dark" label='В список' @click="addMaterialsForBuffer"
                  style="margin-left: 15px; margin-right: 15px;" />
                <PPBtn v-show="isReplaceMaterial()" :dark="dark" label='Заменить' @click="replaceMaterialsForBuffer"
                  style="margin-left: 5px; margin-right: 15px;" />
              </template>
            </Table_v2>
          </template>
          <template v-slot:after>
            <Table ref="refAddMaterialsBuffer" dense :dark="dark" :columnsDef="columnsAddBuffer" :changed="true"
              styleContent="max-height: 70vh;" :rowsDef="rowsAddBuffer" :hideShearch="true">
              <template v-slot:actions>
                <PPBtn :dark="dark" v-show="isAddMaterialBuffer()" color='red' label='Убрать'
                  @click="removeMaterialsFromBuffer" style="margin-right: 15px;" />
              </template>
            </Table>
          </template>
        </q-splitter>
      </q-card-section>
      <q-card-actions align="center">
        <PPBtn :dark="dark" label='Обновить и закрыть' @click="() => {
          exitAndSave(rowsAddBuffer);
          dialog = false;
        }" />
      </q-card-actions>
    </q-card>
  </PPDialog>
</template>
<script>
import {
  defineComponent, ref,
} from 'vue';
import Table_v2 from 'src/components/tables/table_simple_v2.vue';
import PPBtn from '../buttons/PPBtn.vue';
import PPDialog from './PPDialog.vue';

export default defineComponent({
  name: 'DialogAddMaterials',
  props: {
    dark: Boolean,
  },
  components: {
    Table_v2,
    PPBtn,
    PPDialog,
  },
  setup() {
    const dialog = ref(false);
    const rowsAdd = ref([]);
    const rowsAddBuffer = ref([]);
    const name = ref('');
    const splitter = ref(70);
    const columnsAdd = ref([]);
    const columnsAddBuffer = ref([]);
    const materials = ref([]);
    const refAddMaterials = ref(null);
    const refAddMaterialsBuffer = ref(null);
    const type = ref('multuply');

    function openEdit() {
      materials.value.length = 0;
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
      for (let index = 0; index < materials.value.length; index += 1) {
        const element = materials.value[index];
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
    function setAllMaterials(list) {
      materials.value.length = 0;
      list.forEach((element) => {
        materials.value.push(element);
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
    function isAddMaterial() {
      if (refAddMaterials.value) {
        return refAddMaterials.value.getSelect().length > 0;
      }
      return false;
    }
    function isReplaceMaterial() {
      if (refAddMaterials.value && refAddMaterialsBuffer.value) {
        return refAddMaterials.value.getSelect().length === 1 && refAddMaterialsBuffer.value.getSelect().length === 1;
      }
      return false;
    }
    function isAddMaterialBuffer() {
      if (refAddMaterialsBuffer.value) {
        return refAddMaterialsBuffer.value.getSelect().length > 0;
      }
      return false;
    }
    function addMaterialsForBuffer() {
      if ((rowsAddBuffer.value.length === 0 && type.value === 'single') || type.value === 'multiply') {
        for (let i = 0; i < refAddMaterials.value.getSelect().length; i += 1) {
          let addMaterial = true;
          // refAddMaterials.value.getSelect();
          for (let index = 0; index < rowsAddBuffer.value.length; index += 1) {
            if (rowsAddBuffer.value[index].id === refAddMaterials.value.getSelect()[i].id) {
              const sum = Number(rowsAddBuffer.value[index].count) + 1;
              rowsAddBuffer.value[index].count = sum;
              addMaterial = false;
            }
          }
          if (addMaterial) {
            const material = {
              id: refAddMaterials.value.getSelect()[i].id,
              name: refAddMaterials.value.getSelect()[i].name,
              count: 1,
            };
            rowsAddBuffer.value.push(material);
          }
        }
      }
    }
    function replaceMaterialsForBuffer() {
      let replace = true;
      for (let index = 0; index < refAddMaterialsBuffer.value.rows.length; index += 1) {
        const element = refAddMaterialsBuffer.value.rows[index];
        if (refAddMaterials.value.selected[0].id === element.id) {
          replace = false;
        }
      }
      if (replace) {
        refAddMaterialsBuffer.value.selected[0].id = refAddMaterials.value.selected[0].id;
        refAddMaterialsBuffer.value.selected[0].name = refAddMaterials.value.selected[0].name;
        refAddMaterialsBuffer.value.selected[0].status = refAddMaterials.value.selected[0].status;
        refAddMaterialsBuffer.value.selected[0].uid_1C = refAddMaterials.value.selected[0].uid_1C;
      }
    }
    function removeMaterialsFromBuffer() {
      for (let i = 0; i < refAddMaterialsBuffer.value.getSelect().length; i += 1) {
        let ind = -1;
        for (let index = 0; index < rowsAddBuffer.value.length; index += 1) {
          if (rowsAddBuffer.value[index].id === refAddMaterialsBuffer.value.getSelect()[i].id) {
            ind = index;
            break;
          }
        }
        rowsAddBuffer.value.splice(ind, 1);
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
      setAllMaterials,
      setBufferMaterials,
      updateRows,
      setColumnAdd,
      setColumnAddBuffer,
      setSplitter,
      setType,
      updateSearch,
      isAddMaterial,
      isAddMaterialBuffer,
      isReplaceMaterial,
      addMaterialsForBuffer,
      replaceMaterialsForBuffer,
      removeMaterialsFromBuffer,
      exitAndSave,
      pagination: ref({
        rowsPerPage: 0,
      }),
      splitter,
      columnsAdd,
      columnsAddBuffer,
      materials,
      refAddMaterials,
      refAddMaterialsBuffer,
    };
  },

});
</script>
