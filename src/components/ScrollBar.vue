<template>
  <q-scroll-area :dark="dark" :style="styleContent" :class="classContent"
    :vertical-thumb-style="{ right: '2px', borderRadius: '0px', background: `${dark ? 'grey' : 'rgba(167, 196, 117, 0.8)'}`, width: '15px', opacity: 1 }"
    :horizontal-thumb-style="{ bottom: '2px', borderRadius: '0px', background: `${dark ? 'grey' : 'rgba(167, 196, 117, 0.8)'}`, height: '15px', opacity: 1 }"
    :vertical-bar-style="{ right: '2px', borderRadius: '0px', background: `${dark ? 'grey' : 'rgba(167, 196, 117, 0.8)'}`, opacity: 0.3, width: '15px' }"
    :horizontal-bar-style="{ bottom: '2px', borderRadius: '0px', background: `${dark ? 'grey' : 'rgba(167, 196, 117, 0.8)'}`, opacity: 0.3, height: '15px' }">
    <slot name="default" />
  </q-scroll-area>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ScrollBar',
  props: {
    styleContent: {
      type: String,
      default: 'height: 30vh;',
    },
    classContent: {
      type: String,
      default: '',
    },
    dark: {
      type: Boolean,
    },
  },
});
</script>
