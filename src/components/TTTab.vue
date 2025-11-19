<template>
  <div class="pp-tabs" :class="{ 'dark': props.dark }">
    <div v-for="tab in tabs" :key="tab.id" class="pp-tab" :class="{ 'active': model === tab.id }"
      @click="model = tab.id">
      {{ tab.name }}
    </div>
  </div>
</template>

<script setup>


const props = defineProps({
  tabs: Array,
  dark: Boolean
});

const model = defineModel();
</script>
