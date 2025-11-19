<template>
  <q-select square :dark="props.dark" :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`"
    multiple use-chips stack-label v-model="model" options-selected-class="text-grey">
    <template v-slot:selected-item="scope">
      <q-chip removable dense @remove="() => {
        if (scope.index >= 0 && scope.index < model.length) {
          scope.removeAtIndex(scope.index);
        }
      }" :tabindex="scope.tabindex" text-color="secondary"
        :class="`${props.dark ? 'bg-orange-9 text-white' : 'bg-green text-white'} q-ma-xs text-size`">
        {{ scope.opt.name }}
      </q-chip>
    </template>
    <template v-slot:option="scope">
      <q-item class="row fit justify-center items-center" style="white-space: pre-line;" v-bind="scope.itemProps">
        {{ scope.opt.name }}
      </q-item>
    </template>
  </q-select>
</template>
<script setup>
import { defineProps, defineModel } from 'vue';

const model = defineModel();
const props = defineProps({
  dark: Boolean,
});
</script>
