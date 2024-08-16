<template>
  <div id="video" class="h265player"></div>
</template>
<script setup lang="ts">
// https://github.com/goldvideo/h265player
import { onMounted } from 'vue';
import GreenPlayer from 'goldvideo-player';
import 'goldvideo-player/dist/goldplay-h265.css';

onMounted(() => {
  const libPath = import.meta.env.MODE === 'development' ? '/js/h265-wasm/' : '/vue3-model/js/h265-wasm/';
  new GreenPlayer(document.querySelector('#video'), {
    sourceURL: 'https://omc3i.codesandbox.io/ts/playlist.m3u8',
    libPath: `${window.location.origin}${libPath}`,
    autoPlay: false,
  });
});
</script>
<style lang="scss" scoped>
.h265player {
  width: 800px;
  aspect-ratio: 16 / 9;
  margin: 60px auto 0;
}
</style>
