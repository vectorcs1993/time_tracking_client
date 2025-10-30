<template>
  <q-select square class="select-input" :disable="props.disable"
    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`" hide-hint no-error-icon hide-bottom-space
    v-model="model" :options="items" dense options-dense menu-anchor="bottom start" transition-show="jump-up"
    transition-hide="jump-up" :dark="props.dark">
    <template v-slot:option="scope">
      <q-item square v-bind="scope.itemProps" :class="props.classOption">
        <div>{{ props.format(scope.opt) }}</div>
      </q-item>
    </template>
    <template v-slot:selected>
      <div :class="props.classSelected">
        <div class="truncate">{{ props.format(model) }}</div>
      </div>
    </template>
    <slot name="default" />
  </q-select>
</template>

<script setup>
import { defineModel, defineProps } from 'vue';

const model = defineModel();
const items = defineModel('items');

const props = defineProps({
  classSelected: {
    type: String,
    default: 'row fit justify-left items-center',
  },
  classOption: {
    type: String,
    default: 'row fit justify-left items-center',
  },
  format: {
    type: Function,
    default: (item) => (item ? item.name : undefined),
  },
  disable: {
    type: Boolean,
    default: false,
  },
  dark: Boolean,
});
</script>

<style scope lang="scss">
.select-input {
  width: 100%;
  height: 23px !important;
  max-height: 23px !important;
  min-height: 23px !important;
  font-size: 13px;

  .q-field__control {
    height: 20px !important;
    max-height: 20px !important;
    min-height: 20px !important;

    .q-field__native {
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      /* Скрыть переполнение */
      text-overflow: ellipsis;
      position: relative;
      top: 2px;
      height: 20px !important;
      max-height: 20px !important;
      min-height: 20px !important;
      padding: 0;
      padding-left: 10px;
    }

    .q-field__append {
      position: relative;
      top: 0px;
      height: 100%;
    }

  }
}
</style>
