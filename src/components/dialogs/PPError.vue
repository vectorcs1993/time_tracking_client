<template>
  <q-dialog class="text-size" :class="`no-background ${dark ? 'pp-dark' : 'pp-light'}`" :dark="dark" square
    v-model="visible" transition-show="scale" transition-hide="scale">
    <q-card :class="`${dark ? 'pp-dark' : 'pp-light'}`" :dark="dark" style="width: 700px; max-width: 95vw;">
      <q-bar class="text-size" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" style="color: white">
        {{ name }}
        <q-space />
        <q-btn dense :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" :dark="dark" square flat icon="close"
          v-close-popup>
          <q-tooltip :class="`${dark ? 'pp-dark' : 'pp-light'}`">Закрыть</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section :class="`${dark ? 'pp-dark' : 'pp-light'}`">
        <span class="text-size" style="white-space: pre-line">{{ text }}</span>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn style="color: white" class="text-size" :class="`${dark ? 'bg-header-dark' : 'bg-header-light'}`" square
          flat label="OK" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'DialogError',
  props: {
    nameDef: {
      type: String,
      default: 'Error',
    },
    textDef: {
      type: String,
      default: 'Ошибка',
    },
    dark: {
      type: Boolean,
      default() {
      },
    },
  },
  methods: {
    show() {
      this.visible = true;
    },
    setColor(color) {
      this.color = color;
    },
    setName(newName) {
      this.name = newName;
    },
    setText(newText) {
      this.text = newText;
    },
  },
  data(props) {
    const visible = ref(false);
    return {
      visible,
      color: props.headColor,
      name: props.nameDef,
      text: props.textDef,
      isdark: props.dark,
    };
  },

});
</script>
<style>
.no-background {
  background: transparent !important;
}
</style>
