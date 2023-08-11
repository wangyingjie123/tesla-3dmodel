<template>
  <div class="p2p-container" v-loading="loading" element-loading-text="正在建立连接...">
    <el-row class="p2p-container__row">
      <el-col :span="12">
        <div class="video-container">
          <video id="remote-video" class="video-dom" autoplay playsinline></video>
          <div class="video-title">远程视频</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="video-container">
          <video id="local-video" class="video-dom" autoplay playsinline></video>
          <div class="video-title">本地视频</div>
        </div>
      </el-col>
    </el-row>
    <el-row class="operation">
      <el-col :span="24" class="margin-bottom-10">
        <el-card class="box-card">
          <label class="operation-label">连接地址：</label>
          <el-input
            v-model="roomId"
            :disabled="!btnDiabled"
            style="width: 200px; margin-right: 10px"
            placeholder="请输入完整wesocket地址"
            clearable
            @keyup.enter="setupConnect"
          ></el-input>
          <el-button type="primary" @click="setupConnect" :disabled="!btnDiabled">加入</el-button>
          <el-button type="danger" @click="handleLeave" :disabled="btnDiabled">关闭连接</el-button>
        </el-card>
      </el-col>
      <el-col :span="24">
        <ConsoleForm
          :localStream="localStream"
          :peerConnection="peerConnection"
          :dataChannel="dataChannel"
          :btnDiabled="btnDiabled"
          :mediaDevices="mediaDevices"
          :experiment="false"
          @handleAudio="handleAudio"
          @handleVideo="handleVideo"
          ref="consoleRef"
        ></ConsoleForm>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { WebSocketClient, CloseState } from '@/utils/websocket';
import ConsoleForm from './components/console-form.vue';
const peerConnection = ref<RTCPeerConnection | null>(null);
const dataChannel = ref<RTCDataChannel | null>(null);
const localStream = ref<MediaStream>(new MediaStream());
const consoleRef = ref<{ writeInfo: (info: string) => void; reduction: () => void }>();
const roomId = ref('');
const btnDiabled = ref(true);
const loading = ref(false);
const mediaDevices = reactive<Record<'audio' | 'video', boolean>>({ audio: true, video: true });

let socket: WebSocketClient;
let timer: number;

const onMessageCallback = (wsMessage: string) => {
  try {
    const message = JSON.parse(wsMessage);
    console.log('服务端推送：', message);
    if (message.type === 'answer') {
      const answer = new RTCSessionDescription(message.payload);
      addAnswer(answer);
    } else if (message.type === 'candidate') {
      addIceCandidate(new RTCIceCandidate(message.payload));
    }
  } catch (e) {
    console.error(e);
  }
};
// websocket连接
const setupConnect = () => {
  const regExp = /^(ws:\/\/|wss:\/\/)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/;
  const wsuri = roomId.value.trim();
  if (!regExp.test(wsuri)) {
    ElMessage.error('请输入正确的websocket地址');
    return;
  }
  loading.value = true;
  socket = new WebSocketClient({
    wsuri,
    // wsuri: `ws://10.1.60.209:9012`,
    // wsuri: 'ws://10.1.49.170:9012', // nx卡
    // wsuri: 'ws://10.1.60.137:9012',
    onMessageCallback,
    onOpenCallback: () => {
      initp2p();
      createOffer();
    },
    onCloseCallback: (state: CloseState) => {
      if (state === CloseState.Error) {
        ElMessage.error('连接超过最大次数，已自动断开连接');
        loading.value = false;
      }
    },
  });
  roomId.value = '';
};
// 初始化本地媒体
const initLocalStream = async () => {
  try {
    const localVideo = document.getElementById('local-video') as HTMLVideoElement;
    localStream.value = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true,
    });
    localVideo.srcObject = localStream.value;
    handleAudio(false);
  } catch (e) {
    ElMessage.error(`获取本地媒体流失败：${e}`);
  }
};
// 初始化peerConnection
const initp2p = () => {
  const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
  peerConnection.value = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  });
  // 添加本地媒体流的轨道都添加到 RTCPeerConnection 中
  localStream.value.getTracks().forEach((track) => {
    peerConnection.value!.addTrack(track, localStream.value);
  });
  // 设置远程视频流
  const remoteStream: MediaStream = new MediaStream();
  peerConnection.value.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    remoteVideo.srcObject = remoteStream;
  };
  // 监听连接状态变化
  peerConnection.value.oniceconnectionstatechange = () => {
    const connectionState = peerConnection.value?.iceConnectionState;
    console.log('peerConnection 状态:', connectionState);
    if (connectionState === 'connected') {
      ElMessage.success('webrtc连接已建立');
      btnDiabled.value = false;
      loading.value = false;
      clearTimer();
      socket.destory();
    } else if (connectionState === 'disconnected' || connectionState === 'failed') {
      if (timer) return;
      timer = window.setTimeout(() => handleLeave(), 30000);
    } else if (connectionState === 'closed') {
      clearTimer();
      handleLeave();
    } else {
      clearTimer();
    }
  };
  // 创建dataChannel
  dataChannel.value = peerConnection.value.createDataChannel('message', {
    ordered: false, // 是否有序
    maxRetransmits: 0, // 重传消息失败的最大次数
    negotiated: true, // 默认false，表示由浏览器自动创建，true表示由开发者创建，与id配合使用
    id: 0,
  });
  // 接收到服务端的消息
  dataChannel.value.onmessage = (event) => {
    consoleRef.value?.writeInfo(`接收到的指令：${event.data}`);
  };
  // 远方调用createDataChannel时触发
  // peerConnection.value.ondatachannel = (event) => {
  //   const channel = event.channel;
  //   dataChannel.value = channel;
  //   channel.onopen = () => {
  //     ElMessage.success('dataChannel连接已建立');
  //   };
  //   channel.onmessage = (event) => {
  //     console.log(`接收到的指令：${event.data}`);
  //   };
  // };
};
// 创建 offer
async function createOffer() {
  // 当一个新的offer ICE候选人被创建时触发事件
  peerConnection.value!.onicecandidate = async (event) => {
    if (event.candidate) {
      // 发送 ice 代理
      socket.send(JSON.stringify({ type: 'candidate', payload: event.candidate }));
    }
  };
  try {
    const offer = await peerConnection.value?.createOffer();
    await peerConnection.value?.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: 'offer', payload: offer }));
  } catch (e) {
    console.error(e);
  }
}
// 添加 answer
async function addAnswer(answerSdp: RTCSessionDescription) {
  try {
    await peerConnection.value?.setRemoteDescription(answerSdp);
  } catch (e) {
    console.error(e);
  }
}
// 添加ice代理
async function addIceCandidate(candidate: RTCIceCandidate) {
  try {
    await peerConnection.value?.addIceCandidate(candidate);
  } catch (e) {
    // console.error(e);
  }
}

// 打开/关闭麦克风
const handleAudio = (flag: boolean) => {
  mediaDevices.audio = flag;
  localStream.value.getAudioTracks().forEach((track) => {
    track.enabled = flag;
  });
};
// 打开/关闭摄像头
const handleVideo = (flag: boolean) => {
  mediaDevices.video = flag;
  localStream.value.getVideoTracks().forEach((track) => {
    track.enabled = flag;
  });
};
const clearTimer = () => {
  timer && window.clearTimeout(timer);
  timer = 0;
};
// 离开房间
const handleLeave = () => {
  // 关闭本地媒体
  // localStream.value.getTracks().forEach((track) => {
  //   track.stop();
  // });
  ElMessage.error('webrtc连接已断开');
  btnDiabled.value = true;
  loading.value = false;
  dataChannel.value?.close();
  peerConnection.value?.close();
  consoleRef.value?.reduction();
};
onMounted(() => {
  initLocalStream();
});
onUnmounted(() => {
  clearTimeout(timer);
  handleLeave();
});
</script>
<style lang="scss" scoped>
$video-width: 540px;
.p2p-container {
  height: 100%;
  min-width: 1200px;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  &__row {
    width: 100%;
    background-color: #000;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    flex: 1;
  }
  .video {
    &-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    &-dom {
      display: block;
      margin: 0 auto;
      border: 2px solid #048ff2;
      border-radius: 4px;
      width: 540px;
      aspect-ratio: 16 / 9;
    }
    &-title {
      width: $video-width;
      background-color: #000000b3;
      color: #fff;
      text-align: center;
      box-sizing: border-box;
      border: 2px solid;
      padding: 5px 0;
      border-color: #048ff2;
    }
  }

  .operation {
    width: 100%;
    padding: 10px;
    background-color: #405982;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
}
</style>
