<template>
  <div class="shared">
    <el-button class="margin-right-10" type="success" @click="shareScreen">屏幕共享</el-button>
    <el-button :type="isRecording ? 'warning' : 'primary'" @click="record">{{
      isRecording ? '停止录制' : '开始录制'
    }}</el-button>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { startRecord } from './media-stream';
const emit = defineEmits<{
  (e: 'playStream', value: MediaStream): void;
}>();
const localStream = ref<MediaStream>();
const isRecording = ref(false);
let lediaRecorder: MediaRecorder | null = null;
const record = () => {
  if (!localStream.value) return;
  if (isRecording.value) {
    lediaRecorder?.stop();
    return;
  }
  isRecording.value = true;
  lediaRecorder = startRecord({
    stream: localStream.value,
    onstop: () => {
      isRecording.value = false;
    },
  });
};
// 获取屏幕共享的媒体流
async function shareScreen() {
  localStream.value = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });
  // 播放本地视频流
  emit('playStream', localStream.value);
}
</script>
