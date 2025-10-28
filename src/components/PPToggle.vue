<template>
  <q-item>
    <q-item-section>
      {{ props.name }}
    </q-item-section>
    <q-item-section avatar>
      <q-toggle :disable="disable" v-model="model" dense
        color="orange">
        <slot name="default" />
      </q-toggle>
    </q-item-section>
  </q-item>
</template>
<script setup>
import { defineProps, defineModel } from 'vue';

const props = defineProps({
  name: String,
});

const model = defineModel();
const disable = defineModel('disable');
</script>
