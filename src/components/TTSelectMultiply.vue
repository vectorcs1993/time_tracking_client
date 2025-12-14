<template>
  <q-select dense square :dark="props.dark"
    :standout="!cell ? `${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}` : false" :borderless="cell"
    multiple use-chips stack-label v-model="model">
    <template v-slot:selected-item="scope">
      <q-chip dense removable @remove="() => {
        if (scope.index >= 0 && scope.index < model.length) {
          scope.removeAtIndex(scope.index);
        }
      }" :tabindex="scope.tabindex" text-color="secondary"
        :class="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'} text-size`">
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
const model = defineModel();

const props = defineProps({
  dark: Boolean,
  cell: {
    type: Boolean,
    default: false,
  }
});
</script>
