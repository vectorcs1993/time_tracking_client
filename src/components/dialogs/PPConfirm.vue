<template>
  <q-dialog class="text-size" :class="`no-background ${dark ? 'pp-dark' : 'pp-light'}`" :dark="dark" square
    v-model="visible" transition-show="scale" transition-hide="scale">
    <q-card :class="`${dark ? 'pp-dark' : 'pp-light'}`" :dark="dark" style="width: 700px; max-width: 95vw;">
      <q-bar class="text-size" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" style="color: white">
        {{ name }}
        <q-space />
        <q-btn :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" :dark="dark" dense square flat icon="close"
          v-close-popup>
          <q-tooltip :class="`${dark ? 'pp-dark' : 'pp-light'}`">Закрыть</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section :dark="dark" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
        <span class="text-size" style="white-space: pre-line; ">{{ text }}</span>
      </q-card-section>
      <q-card-actions align="center">
        <slot class="text-size" :dark="dark" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" name="buttons" />
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
      default() {
      },
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
