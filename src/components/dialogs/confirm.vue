<template>
  <q-dialog :dark="dark" :class="`no-background ${dark ? 'pp-dark' : 'pp-light'}`" square v-model="visible"
    transition-show="scale" transition-hide="scale">
    <q-card style="width: 400px; max-width: 95vw;">
      <q-bar :class="`text-size ${dark ? 'bg-header-dark' : 'bg-header-light'} text-white text-size`" :dark="dark">
        <div class="text-size">{{ name }}</div>
        <q-space />
        <q-btn dense square flat icon="close" v-close-popup />
      </q-bar>
      <q-card-section style="max-height: 60vh; overflow-y: scroll;" :dark="dark"
        :class="`${dark ? 'pp-dark' : 'pp-light'}`">
        <span style="white-space: pre-line; ">{{ text }}</span>
      </q-card-section>
      <q-card-actions align="center" :dark="dark" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
        <slot name="buttons" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'DialogConfirm',
  methods: {
    hide() {
      this.visible = false;
    },
    show() {
      this.visible = true;
    },
    setName(newName) {
      this.name = newName;
    },
    setText(newText) {
      this.text = newText;
    },
  },
  props: {
    nameDef: {
      type: String,
      default: 'Подтверждение',
    },
    textDef: {
      type: String,
      default: 'Принять изменения?',
    },
    color: {
      type: String,
      default: '',
    },
    dark: {
      type: Boolean,
      default: true,
    },
  },
  data(props) {
    const visible = ref(false);
    return {
      visible,
      name: props.nameDef,
      text: props.textDef,
    };
  },

});
</script>
<style>
.no-background {
  background: transparent !important;
}
</style>
