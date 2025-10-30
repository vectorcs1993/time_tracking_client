<template>
  <q-dialog v-model="visible" class="text-h6"  transition-show="scale" transition-hide="scale">
    <q-card :style="`width: ${width}; max-width: 95vw; background-color: rgb(60, 60, 60);`">
      <q-bar class="text-white" style="background-color: rgb(80, 80, 80);">
        <div>{{ name }}</div>
        <q-space />
        <q-btn v-if="(typeof banner == 'undefined' || (banner && permission))" dense icon="close" v-close-popup />
      </q-bar>
      <q-card-section class="text-white" style="background-color: rgb(60, 60, 60);">
        <slot name="content" />
      </q-card-section>
      <q-card-actions align="center" class="text-black" style="background-color: rgb(60, 60, 60);">
        <slot name="buttons" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'DialogStandart',
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
  },
  props: {
    nameDef: {
      type: String,
      default: 'Подтверждение',
    },
    width: {
      type: String,
      default: '900px',
    },
    banner: {
      type: Boolean,
      default: undefined,
    },
    permission: {
      type: Boolean,
      default: undefined,
    },
  },
  data(props) {
    const visible = ref(false);
    return {
      visible,
      name: props.nameDef,
    };
  },

});
</script>
