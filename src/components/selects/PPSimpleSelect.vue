<template>
  <q-select dense :dark="props.dark" :class="`${props.dark ? 'pp-dark' : 'pp-light'} row`" class="text-size" square
    hide-bottom-space options-selected-class="text-size text-grey" popup-content-class="text-size" :label="props.label"
    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" v-model="model" :options="props.options"
    @update:model-value="props.update">
    <template v-slot:selected-item="scope">
      <div :class="props.inputClass" input-style="text-align: center;">
        {{ scope.opt.name }}
      </div>
    </template>
    <template v-slot:after>
      <slot name="helper" />
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
