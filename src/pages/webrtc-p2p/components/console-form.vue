<template>
  <el-card class="box-card">
    <label class="operation-label">文本指令：</label>
    <el-input
      v-model="instruction"
      style="width: 200px; margin-right: 10px"
      placeholder="要发送的指令"
      clearable
      :disabled="btnDiabled"
      @keyup.enter="sendInstruction"
    ></el-input>
    <el-button type="primary" @click="sendInstruction" :disabled="btnDiabled">发送指令</el-button>
    <el-button
      :type="isAudioOpen ? 'success' : 'warning'"
      @click="handleMedia('audio')"
      :disabled="btnDiabled"
      :icon="isAudioOpen ? Mute : Microphone"
    >
      {{ isAudioOpen ? '关闭' : '打开' }}麦克风
    </el-button>
    <el-button
      :type="isVideoOpen ? 'success' : 'warning'"
      @click="handleMedia('video')"
      :icon="isVideoOpen ? VideoPause : VideoPlay"
      >{{ isVideoOpen ? '关闭' : '打开' }}本地视频</el-button
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
import { ref, onMounted, computed } from 'vue';
import { Mute, Microphone, VideoPause, VideoPlay } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
interface Props {
  localStream: MediaStream;
  dataChannel: RTCDataChannel | null;
  peerConnection: RTCPeerConnection | null;
  btnDiabled: boolean;
  experiment: boolean;
  mediaDevices: Record<'audio' | 'video', boolean>;
}
const props = defineProps<Props>();
const emits = defineEmits<{
  (e: 'handleAudio', flag: boolean): void;
  (e: 'handleVideo', flag: boolean): void;
}>();
const instruction = ref('');
const textarea = ref('');

let recognition: any;

const isAudioOpen = computed(() => props.mediaDevices.audio);
const isVideoOpen = computed(() => props.mediaDevices.video);
const writeInfo = (info: string) => {
  textarea.value += `${info}\n`;
};
const sendInstruction = () => {
  if (!instruction.value) {
    return;
  }
  if (props.dataChannel?.readyState !== 'open') {
    ElMessage.error('信道未建立，无法发送指令');
    return;
  }
  props.dataChannel?.send(instruction.value);
  writeInfo(`发送指令：${instruction.value}`);
  instruction.value = '';
};
// 还原设置
const reduction = () => {
  textarea.value = '';
  emits('handleAudio', false);
};
const handleMedia = (media: 'audio' | 'video') => {
  if (media === 'audio') {
    emits('handleAudio', !props.mediaDevices.audio);
  } else {
    emits('handleVideo', !props.mediaDevices.video);
  }
};
// 语音转文字-实验中功能
const asr = () => {
  if ('webkitSpeechRecognition' in window) {
    // eslint-disable-next-line no-undef, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line no-undef
    recognition = new webkitSpeechRecognition() || new SpeechRecognition();
    // 连续识别
    recognition.continuous = true;
    // 设置语音识别语言，默认为浏览器的语言
    recognition.lang = 'zh-CN'; // 可以根据需要更改语言，如'zh-CN'为中文
    recognition.onaudiostart = () => {
      console.log('录音开始-audiostart');
    };
    recognition.onaudioend = () => {
      console.log('录音结束-audioend');
    };
    recognition.onstart = () => {
      console.log('收声开始-start');
    };
    recognition.onnomatch = () => {
      console.log('未匹配');
    };
    recognition.onsoundstart = () => {
      console.log('收声开始-soundstart');
    };
    recognition.onsoundend = () => {
      console.log('收声结束-soundend');
    };
    recognition.onspeechend = () => {
      console.log('语音结束-speeched');
    };
    recognition.onspeechstart = () => {
      console.log('语音开始-speechstart');
    };
    recognition.onend = () => {
      console.log('收声结束-end');
    };
    // 在语音识别结果可用时触发此事件
    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex][0].transcript;
      console.log('语音识别结果：', result);
    };

    // 在出错时触发此事件
    recognition.onerror = (event: any) => {
      console.error('语音识别错误：', event.error);
    };
  }
};
onMounted(() => {
  asr();
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
