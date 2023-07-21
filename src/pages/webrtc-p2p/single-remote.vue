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
          <el-select v-model="audioDeviceId" @change="switchAudio" placeholder="Select" class="margin-left-10">
            <el-option v-for="item in options" :key="item.deviceId" :label="item.label" :value="item.deviceId" />
          </el-select>
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
import { WebSocketClient } from '@/utils/websocket';
import ConsoleForm from './components/console-form.vue';
const peerConnection = ref<RTCPeerConnection | null>(null);
const dataChannel = ref<RTCDataChannel | null>(null);
const localStream = ref<MediaStream>(new MediaStream());
const consoleRef = ref<{ writeInfo: (info: string) => void; reduction: () => void }>();
const roomId = ref('');
const options = ref<MediaDeviceInfo[]>([]);
const audioDeviceId = ref('');
const mediaDevices = reactive<Record<'audio' | 'video', boolean>>({ audio: true, video: true });

const btnDiabled = ref(true);
let socket: WebSocketClient;
let iceConnectionState: RTCIceConnectionState = 'closed';

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
  // const regExp = /^(ws:\/\/|wss:\/\/)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/;
  // const wsuri = roomId.value.trim();
  // if (!regExp.test(wsuri)) {
  //   ElMessage.error('请输入正确的websocket地址');
  //   return;
  // }
  socket = new WebSocketClient({
    // wsuri,
    wsuri: `ws://10.1.60.209:9012`,
    // wsuri: 'ws://10.1.49.170:9012',
    onMessageCallback,
    onOpenCallback: () => {
      initp2p();
      createOffer();
    },
  });
  roomId.value = '';
};
// 初始化本地媒体
const initLocalStream = async (deviceId: string) => {
  const localVideo = document.getElementById('local-video') as HTMLVideoElement;
  localStream.value = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: { deviceId: { exact: deviceId } },
  });
  localVideo.srcObject = localStream.value;
  // 监听设备变化
  navigator.mediaDevices.ondevicechange = async () => {
    await getDevices();
    await switchAudio();
  };
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
  dataChannel.value = peerConnection.value.createDataChannel('message', { ordered: false, maxRetransmits: 0 });
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
    iceConnectionState = connectionState as RTCIceConnectionState;
    // 当连接状态为 disconnected 或者 failed 时，表明连接已断开
    if (connectionState === 'disconnected' || connectionState === 'failed') {
      // 连接已断开，执行相应的处理逻辑
      console.log('peerConnection 远程连接已断开');
    }
  };
  // 接收到服务端的消息
  dataChannel.value.onmessage = (event) => {
    consoleRef.value?.writeInfo(`接收到的指令：${event.data}`);
  };
  peerConnection.value.ondatachannel = (event) => {
    ElMessage.success('已建立p2p连接');
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
  await peerConnection.value?.setRemoteDescription(answerSdp);
  socket.destory();
}
// 添加ice代理
async function addIceCandidate(candidate: RTCIceCandidate) {
  try {
    await peerConnection.value?.addIceCandidate(candidate);
  } catch (e) {
    // console.error(e);
  }
}
// 获取设备列表
async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === 'audioinput');
  options.value = videoDevices;
  audioDeviceId.value = videoDevices[0].deviceId;
  console.log('🎤🎤🎤 / 麦克风列表', videoDevices);
}
// 切换麦克风
const switchAudio = async () => {
  try {
    // Get the current audio track from the local stream
    const audioTrack = localStream.value.getAudioTracks()[0];
    // Stop the current microphone track
    audioTrack.stop();
    // Get a new audio track from a different microphone
    await initLocalStream(audioDeviceId.value);
    if (mediaDevices.audio === false) {
      handleAudio(false);
    }
    if (mediaDevices.video === false) {
      handleVideo(false);
    }
    const newAudioTrack = localStream.value.getAudioTracks()[0];
    // Replace the old audio track with the new one in the local stream
    localStream.value.removeTrack(audioTrack);
    localStream.value.addTrack(newAudioTrack);
    // Get the RTCPeerConnection and transceiver (your existing setup)
    if (iceConnectionState === 'connected') {
      const audioTransceiver = peerConnection.value
        ?.getTransceivers()
        .find((transceiver) => transceiver.sender.track?.kind === 'audio');
      // Replace the old audio track with the new one in the transceiver
      audioTransceiver?.sender.replaceTrack(newAudioTrack);
    }
    console.log('麦克风切换成功!');
  } catch (error) {
    console.error('Error switching microphone:', error);
  }
};
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
// 离开房间
function handleLeave() {
  // 关闭本地媒体
  // localStream.value.getTracks().forEach((track) => {
  //   track.stop();
  // });
  btnDiabled.value = true;
  peerConnection.value?.close();
  consoleRef.value?.reduction();
}
onMounted(() => {
  getDevices().then(() => {
    initLocalStream(audioDeviceId.value);
    handleAudio(false);
  });
});
onUnmounted(() => {
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
