<template>
  <q-dialog square :dark="props.dark">
    <q-card :class="`${dark ? 'pp-dark' : 'pp-light'} text-size`" :style="`${props.styleContent}`">
      <q-bar :dark="props.dark" :class="`${props.dark ? 'bg-header-dark' : 'bg-header-light'} text-white text-size`">
        <div class="text-size truncate">{{ props.label }}</div>
        <q-space />
        <q-btn dense square flat icon="close" v-close-popup>
          <q-tooltip class="bg-grey text-white">Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section class="q-pa-none" style="overflow-y: scroll;">
        <slot :class="`${dark ? 'pp-dark' : 'pp-light'} text-size`" name="default" />
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
