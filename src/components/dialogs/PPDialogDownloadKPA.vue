<template>
  <PPDialog :dark="props.dark" label="Настройки КПА" v-model="model" styleContent="width: max-content;">
    <q-card-section class="row q-pa-md q-gutter-md">
      <PPCheckbox :dark="props.dark" v-model="onCost" label="Розничная стоимость" />
      <PPCheckbox :dark="props.dark" v-model="onSelfCost" label="Себестоимость" />
    </q-card-section>
    <q-card-actions align="center" :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark">
      <PPBtn label="Скачать" :click="() => {
        actionConfirm({ onCost, onSelfCost, watermark, colorForTable });
      }" :dark="props.dark" />
    </q-card-actions>
  </PPDialog>
</template>
<script setup>
import {
  defineProps,
  defineModel,
  ref,
} from 'vue';
import PPDialog from './PPDialog.vue';
import PPBtn from '../buttons/PPBtn.vue';
import PPCheckbox from '../PPCheckbox.vue';

const props = defineProps({
  description: String,
  dark: Boolean,
  actionConfirm: Function,
});
const onCost = ref(true);
const onSelfCost = ref(false);

const model = defineModel();
</script>
