<template>
  <q-dialog square v-model="visible" transition-show="scale" transition-hide="scale">
    <q-card style="width: 700px; max-width: 95vw;" :class="`${dark ? 'pp-dark' : 'pp-light'}`">
      <q-bar :class="`bg-${color} text-white text-size`">
        {{ name }}
        <q-space />
        <q-btn dense square flat icon="close" v-close-popup />
      </q-bar>

      <q-card-section class="text-size">
        <span style="white-space: pre-line;">{{ text }}</span>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn :dark="dark" square flat label="OK" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'DialogError',
  props: {
    headColor: {
      type: String,
      default: 'red',
    },
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
      default: false,
    },
  },
  methods: {
    hide() {
      this.visible = false;
    },
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
    };
  },

});
</script>
