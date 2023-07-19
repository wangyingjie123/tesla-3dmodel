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
      :icon="isCameraOpen ? VideoPause : VideoPlay"
      >{{ isCameraOpen ? '关闭' : '打开' }}本地视频</el-button
    >
    <el-popover placement="bottom" title="指令面板" :width="500" trigger="click">
      <el-input v-model="textarea" readonly placeholder="Please input" :rows="6" show-word-limit type="textarea" />
      <template #reference>
        <el-button :disabled="btnDiabled">打开对话框</el-button>
      </template>
    </el-popover>
    <el-button type="primary" v-if="experiment" @click="recognitionStart">开始录音</el-button>
    <el-button type="primary" v-if="experiment" @click="recognitionStop">结束录音</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Mute, Microphone, VideoPause, VideoPlay } from '@element-plus/icons-vue';
interface Props {
  localStream: MediaStream;
  dataChannel: RTCDataChannel | null;
  peerConnection: RTCPeerConnection | null;
  btnDiabled: boolean;
  experiment: boolean;
}
const props = defineProps<Props>();

const instruction = ref('');
const textarea = ref('');
const isAudioOpen = ref(false);
const isCameraOpen = ref(true);

let recognition: any;

const writeInfo = (info: string) => {
  textarea.value += `${info}\n`;
};
const sendInstruction = () => {
  if (!instruction.value) {
    return;
  }
  props.dataChannel?.send(instruction.value);
  writeInfo(`发送指令：${instruction.value}`);
  instruction.value = '';
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
// 还原设置
const reduction = () => {
  textarea.value = '';
  isAudioOpen.value = false;
  props.localStream.getAudioTracks().forEach((track) => {
    track.enabled = false;
  });
};
onMounted(() => {
  if ('webkitSpeechRecognition' in window) {
    // eslint-disable-next-line no-undef, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-undef
    recognition = new webkitSpeechRecognition();

    // 设置语音识别语言，默认为浏览器的语言
    recognition.lang = 'zh-CN'; // 可以根据需要更改语言，如'zh-CN'为中文

    // 在语音识别结果可用时触发此事件
    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex][0].transcript;
      console.log('语音识别结果：', result);
    };

    // 在出错时触发此事件
    recognition.onerror = function (event: any) {
      console.error('语音识别错误：', event.error);
    };
  }
});
const recognitionStart = () => {
  recognition.start();
};
const recognitionStop = () => {
  recognition.stop();
};

// 将这个方法暴露出去,这样父组件就可以使用了哈
defineExpose({
  writeInfo,
  reduction,
});
</script>
<style lang="scss" scoped></style>
