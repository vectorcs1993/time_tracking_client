<template>
  <q-table class="pp-light cursor-pointer q-pa-none q-ma-none" flat  dense :rows="props.rows" :columns="props.columns" v-model:selected="selected"
    @row-click="props.selectRow" @row-dblclick="props.dblclickRow" row-key="id" virtual-scroll wrap-cells
    :selection="props.selection" :filter="props.filter" color="green" 
    :hide-selected-banner="true" no-data-label="История отсутствует" :rows-per-page-options="[0]" separator="cell"
    style="height: 100%;">
    <template v-slot:pagination>
    </template>
    <template v-slot:top>
      <slot name="actions" />
    </template>
    <template v-slot:body-cell="props">
      <q-td :props="props" class="no-pa-ma text-size">
        <div v-if="bodyCellSlot">
          <slot name="body-cell" v-bind="props" />
        </div>
        <div v-else class="q-pa-sm">
          <div class="text-size">{{ props.value }}</div>
        </div>
      </q-td>
    </template>
    <template v-slot:header-cell="props">
      <q-th :props="props">
        <div class="text-size">{{ props.col.label }}</div>
      </q-th>
    </template>
  </q-table>
</template>
<script setup>
import {
  defineProps,
  defineModel,
} from 'vue';

const selected = defineModel();
const props = defineProps({
  columns: Array,
  rows: Array,
  selection: String,
  selectRow: Function,
  dblclickRow: Function,
  filter: String,
  bodyCellSlot: {
    type: Boolean,
    default: false,
  },
});
</script>
