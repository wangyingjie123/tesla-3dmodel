<template>
  <div class="p2p-container">
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
    <div class="operation">
      <el-card class="box-card">
        <label class="operation-label">房间号：</label>
        <el-input
          v-model="roomId"
          style="width: 150px; margin-right: 20px"
          placeholder="要加入的房间号"
          clearable
          @keyup.enter="initConnect"
        ></el-input>
        <el-button type="primary" @click="initConnect">加入</el-button>
      </el-card>
      <ConsoleForm
        :localStream="localStream"
        :peerConnection="peerConnection"
        :dataChannel="dataChannel"
        :btnDiabled="btnDiabled"
        ref="consoleRef"
      ></ConsoleForm>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { WebSocketClient } from '@/utils/websocket';
import ConsoleForm from './components/console-form.vue';
const peerConnection = ref<RTCPeerConnection>(
  new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  })
);
const dataChannel = ref<RTCDataChannel>(
  peerConnection.value.createDataChannel('message', { ordered: false, maxRetransmits: 0 })
);
const localStream = ref<MediaStream>(new MediaStream());
const roomId = ref('');
const btnDiabled = ref(true);
let socket: WebSocketClient;

const onMessageCallback = (wsMessage: string) => {
  try {
    const message = JSON.parse(wsMessage);
    console.log(message);
    if (message.type === 'answer') {
      const answer = new RTCSessionDescription(message.payload);
      addAnswer(answer);
    } else if (message.type === 'candidate') {
      // addIceCandidate(new RTCIceCandidate(message.payload));
    }
  } catch (e) {
    console.error(e);
  }
};
const initConnect = () => {
  if (!roomId.value) {
    ElMessage.error('请输入房间号');
    return;
  }
  socket = new WebSocketClient({
    wsuri: 'ws://10.1.60.209:8080',
    onMessageCallback,
    onOpenCallback: createOffer,
  });
  roomId.value = '';
};
// 连接成功
const init = async () => {
  const localVideo = document.getElementById('local-video') as HTMLVideoElement;
  const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
  localStream.value = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: true,
  });
  localVideo.srcObject = localStream.value;
  // 添加本地媒体流的轨道都添加到 RTCPeerConnection 中
  localStream.value.getTracks().forEach((track) => {
    peerConnection.value.addTrack(track, localStream.value);
  });
  // 设置远程视频流
  const remoteStream: MediaStream = new MediaStream();
  peerConnection.value.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    // 设置远程视频流
    remoteVideo.srcObject = remoteStream;
  };
  // 先禁用音频
  localStream.value.getAudioTracks().forEach((track) => {
    track.enabled = false;
  });
  dataChannel.value.onopen = () => {
    console.log('Data channel opened!');
  };
  peerConnection.value.ondatachannel = (event) => {
    ElMessage.success('建立连接');
    btnDiabled.value = false;
    const channel = event.channel;
    channel.onopen = () => {
      channel.send('建立连接!');
    };
    channel.onmessage = (event) => {
      console.log(event.data);
    };
  };
};
// 创建 offer
async function createOffer() {
  // 当一个新的offer ICE候选人被创建时触发事件
  peerConnection.value.onicecandidate = async (event) => {
    if (event.candidate) {
      // 发送 ice 代理
      socket.send(JSON.stringify({ type: 'candidate', payload: event.candidate }));
    }
  };
  try {
    const offer = await peerConnection.value.createOffer();
    await peerConnection.value.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: 'offer', payload: offer }));
  } catch (e) {
    console.error(e);
  }
}
// 添加 answer
async function addAnswer(answerSdp: RTCSessionDescription) {
  await peerConnection.value.setRemoteDescription(answerSdp);
  socket.destory();
}
// 添加ice代理
// async function addIceCandidate(candidate: RTCIceCandidate) {
//   try {
//     await peerConnection.value.addIceCandidate(candidate);
//   } catch (e) {
//     console.error(e);
//   }
// }

// 离开房间
function handleLeave() {
  // 关闭本地媒体
  localStream.value.getTracks().forEach((track) => {
    track.stop();
  });
  peerConnection.value.close();
}
onMounted(() => {
  init();
});
onUnmounted(() => {
  handleLeave();
});
</script>
<style lang="scss" scoped>
$video-width: 540px;
.p2p-container {
  height: 100%;
  min-width: 1300px;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  &__row {
    width: 100%;
    background-color: #000;
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
      background-color: #363739;
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
    height: 100px;
    padding: 0 20px;
    text-align: center;
    background-color: #405982;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
