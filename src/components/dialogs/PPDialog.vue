<template>
  <q-dialog square dark>
    <q-card class="pp-light" :style="`${props.styleContent}`">
      <q-bar dark class="bg-header-light text-white">
        <div>{{ props.label }}</div>
        <q-space />
        <q-btn dense square flat icon="close" v-close-popup>
          <q-tooltip class="bg-grey text-white">Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section class="q-pa-none" style="overflow-y: hidden;">
        <slot class="'pp-light" name="default" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup>
import {
  defineProps,
} from 'vue';

const props = defineProps({
  dark: Boolean,
  model: Object,
  styleContent: String,
  label: String,
});
</script>
