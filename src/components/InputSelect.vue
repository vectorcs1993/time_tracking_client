<template>
  <q-select dense :dark="props.dark" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" class="text-size" square
    hide-bottom-space options-selected-class="text-size text-grey" popup-content-class="text-size" :label="props.label"
    :standout="!cell ? `${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}` : false" v-model="model"
    :borderless="cell" :options="props.options" @update:model-value="props.update" input-style="text-align: center;">
    <template v-slot:selected-item="scope">
      <div :class="{ 'row': cell, 'fit': cell, 'justify-center': cell, 'items-center': cell }"
        style="white-space: pre-line;">
        {{ scope.opt.name }}
      </div>
    </template>
    <template v-slot:after>
      <slot name="helper" />
    </template>
    <template v-slot:option="scope">
      <q-item :class="{ 'row': cell, 'fit': cell, 'justify-center': cell, 'items-center': cell }"
        style="white-space: pre-line;" v-bind="scope.itemProps">
        {{ scope.opt.name }}
      </q-item>
    </template>
  </q-select>
</template>
<script setup>

const model = defineModel();

const props = defineProps({
  dark: Boolean,
  options: Array,
  update: Function,
  label: String,
  cell: {
    type: Boolean,
    default: false,
  }
});
</script>
