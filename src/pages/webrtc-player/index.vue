<template>
  <div>
    <video ref="video" controls muted width="640"></video>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { loadScript } from '@/utils/load-script';
const video = ref<HTMLVideoElement>();

onMounted(() => {
  loadScript('./js/jswebrtc.min.js').then(() => {
    const { JSWebrtc } = window as any;
    const url = 'webrtc://r.ossrs.net/live/livestream';
    new JSWebrtc.Player(url, {
      video: video.value,
      autoplay: true,
      onPlay: () => {
        console.log('start play');
      },
    });
  });
});
</script>
