<template>
  <q-select
    dense
    square
    v-model="model"
    clearable
    :dark="props.dark"
    :standout="`${props.dark ? 'bg-grey text-white' : 'bg-green text-white'}`"
    use-input
    hide-bottom-space
    hide-selected
    fill-input
    input-debounce="0"
    :options="valuesOp"
    @filter="filterFn"
    transition-show="jump-up"
    transition-hide="jump-up"
    option-label="name"
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          Нет совпадений
        </q-item-section>
      </q-item>
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
import {
  defineProps,
  defineModel,
  ref,
} from 'vue';

const model = defineModel();
const props = defineProps({
  dark: Boolean,
  options: Array,
});

// динамический/изменяемый список значений
const valuesOp = ref([]);

function filterFn(val, update) {
  update(() => {
    const needle = val.toLowerCase();
    valuesOp.value = props.options.filter((v) => (v.name.toLowerCase().indexOf(needle) > -1));
  });
}
</script>
