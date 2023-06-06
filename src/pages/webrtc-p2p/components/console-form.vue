<template>
  <el-card class="box-card">
    <label class="operation-label">指令：</label>
    <el-input
      v-model="instruction"
      style="width: 200px; margin-right: 20px"
      placeholder="要发送的指令"
      clearable
      :disabled="btnDiabled"
      @keyup.enter="sendInstruction"
    ></el-input>
    <el-button type="primary" @click="sendInstruction" :disabled="btnDiabled">发送指令</el-button>
    <el-button
      :type="isAudioOpen ? 'warning' : 'primary'"
      @click="handleAudio"
      :disabled="btnDiabled"
      :icon="isAudioOpen ? Mute : Microphone"
    >
      {{ isAudioOpen ? '关闭' : '打开' }}麦克风
    </el-button>
    <el-button
      :type="isCameraOpen ? 'warning' : 'primary'"
      @click="handleCamera"
      :disabled="btnDiabled"
      :icon="isCameraOpen ? VideoPause : VideoPlay"
      >{{ isCameraOpen ? '关闭' : '打开' }}视频</el-button
    >
    <el-button type="danger" @click="handleLeave" :disabled="btnDiabled">关闭通信</el-button>
    <el-popover placement="bottom" title="指令面板" :width="500" trigger="click">
      <el-input v-model="textarea" readonly placeholder="Please input" :rows="6" show-word-limit type="textarea" />
      <template #reference>
        <el-button :disabled="btnDiabled">打开对话框</el-button>
      </template>
    </el-popover>
  </el-card>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { Mute, Microphone, VideoPause, VideoPlay } from '@element-plus/icons-vue';
const props = defineProps({
  localStream: {
    type: MediaStream,
    required: true,
  },
  dataChannel: {
    type: RTCDataChannel,
    required: true,
  },
  peerConnection: {
    type: RTCPeerConnection,
    required: true,
  },
  btnDiabled: {
    type: Boolean,
    required: true,
  },
});
const instruction = ref('');
const textarea = ref('');
const isAudioOpen = ref(false);
const isCameraOpen = ref(true);

const writeInfo = (info: string) => {
  textarea.value += `${info}\n`;
};
const sendInstruction = () => {
  props.dataChannel.send(instruction.value);
  writeInfo(`发送指令：${instruction.value}`);
  instruction.value = '';
};
// 关闭连接
const handleLeave = () => {
  props.peerConnection.close();
};
// 打开/关闭麦克风
const handleAudio = () => {
  isAudioOpen.value = !isAudioOpen.value;
  props.localStream.getAudioTracks().forEach((track) => {
    track.enabled = isAudioOpen.value;
  });
};
// 打开/关闭摄像头
const handleCamera = () => {
  isCameraOpen.value = !isCameraOpen.value;
  props.localStream.getVideoTracks().forEach((track) => {
    track.enabled = isCameraOpen.value;
  });
};
// 将这个方法暴露出去,这样父组件就可以使用了哈
defineExpose({
  writeInfo,
});
</script>
<style lang="scss" scoped></style>
