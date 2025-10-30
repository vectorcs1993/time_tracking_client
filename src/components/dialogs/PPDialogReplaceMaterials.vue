<template>
  <PPDialog label="Замена материалов" v-model="model" :dark="props.dark" styleContent="width: 600px; max-width: 95vw;">
    <form @submit.prevent="() => {
      props.actionConfirm(replacedMaterial, targetMaterial);
    }">
      <q-card-section :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark" class="q-pa-sm">
        <div class="row items-center q-ma-sm">
          <div class="col-3">
            Материал
          </div>
          <PPFilterSelect class="col" :dark="props.dark" v-model="replacedMaterial" :options="materials"
            popup-content-style="width: 300px;" />
        </div>
        <div class="row items-center q-ma-sm">
          <div class="col-3">
            Целевой материал
          </div>
          <PPFilterSelect class="col" :dark="props.dark" v-model="targetMaterial" :options="materials"
            popup-content-style="width: 300px;" />
        </div>
      </q-card-section>
      <q-card-actions :class="`${props.dark ? 'pp-dark' : 'pp-light'}`" :dark="props.dark"
        class="row fit justify-center">
        <PPBtn label="Заменить" type="submit" :dark="props.dark" />
      </q-card-actions>
    </form>
  </PPDialog>
</template>
<script setup>
import {
  defineProps,
  defineModel,
  ref,
  onMounted,
  inject,
} from 'vue';
import PPDialog from './PPDialog.vue';
import PPBtn from '../buttons/PPBtn.vue';
import PPFilterSelect from '../selects/PPFilterSelect.vue';

const props = defineProps({
  dark: Boolean,
  actionConfirm: Function,
});

const {
  host,
  getQuery,
} = inject('store');

const model = defineModel();
const materials = [];
const replacedMaterial = ref();
const targetMaterial = ref();

onMounted(() => {
  materials.length = 0;
  getQuery(`${host()}/services/materials`).then((responseM) => {
    materials.push(...responseM.data.sort((a, b) => (a.name < b.name ? -1 : 1)));
    replacedMaterial.value = '';
    targetMaterial.value = '';
  });
});
</script>
