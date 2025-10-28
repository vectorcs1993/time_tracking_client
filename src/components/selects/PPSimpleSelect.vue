<template>
  <q-select dense dark class="pp-light" square :label="props.label"
    standout="bg-grey text-white" v-model="model" :options="props.options" options-selected-class="pp-light" popup-content-class="pp-light"
    @update:model-value="props.update">
    <template v-slot:selected-item="scope">
      <div :class="props.inputClass">
        {{ scope.opt.name }}
      </div>
    </template>
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.name }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
<script setup>
import { defineProps, defineModel } from 'vue';

const model = defineModel();
const props = defineProps({
  dark: Boolean,
  options: Array,
  update: Function,
  label: String,
  inputClass: String,
});
</script>
