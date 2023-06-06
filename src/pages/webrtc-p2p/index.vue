<template>
  <el-container class="p2p-main">
    <el-header class="p2p-header">
      <el-text type="warning" size="large">Webrtc-P2P通话</el-text>
      <el-button @click="drawer = true" type="primary">打开操作面板</el-button>
    </el-header>
    <el-main>
      <el-row>
        <!-- 给自己本地的视频播放设置静音，防止产生回音 -->
        <el-col :span="12" class="p2p-video">
          <h2 class="p2p-subtitle margin-bottom-10">本地摄像头</h2>
          <video class="p2p-video__dom" ref="localRef" autoplay playsinline muted></video>
        </el-col>
        <el-col :span="12" class="p2p-video">
          <h2 class="p2p-subtitle margin-bottom-10">用户2摄像头</h2>
          <video class="p2p-video__dom" ref="remoteRef" autoplay playsinline></video>
        </el-col>
      </el-row>
    </el-main>
    <el-footer>
      <ConsoleForm
        :localStream="localStream"
        :peerConnection="peerConnection"
        :dataChannel="dataChannel"
        :btnDiabled="btnDiabled"
        ref="consoleRef"
      ></ConsoleForm>
    </el-footer>
  </el-container>
  <el-drawer v-model="drawer" title="本地操作区域-打开2个tab页">
    <OfferForm
      :localOffer="localOffer"
      :remoteAnswer="remoteAnswer"
      @createOffer="createOffer"
      @createAnswer="createAnswer"
      @addAnswer="addAnswer"
    ></OfferForm>
  </el-drawer>
</template>
<script setup lang="ts">
import 'webrtc-adapter';
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import OfferForm from './components/offer-form.vue';
import ConsoleForm from './components/console-form.vue';
const localRef = ref<HTMLVideoElement>();
const remoteRef = ref<HTMLVideoElement>();
// 创建本地/远程 SDP 描述, 用于描述本地/远程的媒体流
const localStream = ref<MediaStream>(new MediaStream());
const peerConnection = ref<RTCPeerConnection>(
  new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:1.119.169.85:10042', // stun:stun.voipbuster.com
      },
    ],
  })
);
const dataChannel = ref<RTCDataChannel>(peerConnection.value.createDataChannel('message'));
const consoleRef = ref<{ writeInfo: (info: string) => void }>();
const localOffer = ref('');
const remoteAnswer = ref('');
const drawer = ref(false);
const btnDiabled = ref(true);
// 初始化
const init = async () => {
  // 获取本地端视频标签
  const localVideo = localRef.value!;
  // 获取远程端视频标签
  const remoteVideo = remoteRef.value!;
  // 采集本地媒体流
  localStream.value = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  // 设置本地视频流
  localVideo.srcObject = localStream.value;
  // 添加本地媒体流的轨道都添加到 RTCPeerConnection 中
  localStream.value.getTracks().forEach((track) => {
    peerConnection.value.addTrack(track, localStream.value);
  });
  // 先禁用音频
  localStream.value.getAudioTracks().forEach((track) => {
    track.enabled = false;
  });
  // 监听文本信息
  peerConnection.value.ondatachannel = function (event) {
    ElMessage.success('建立连接');
    btnDiabled.value = false;
    const channel = event.channel;
    channel.onopen = function () {
      channel.send('建立连接!');
    };
    channel.onmessage = (event) => {
      console.log(event.data);
      consoleRef.value?.writeInfo(`接收到的指令：${event.data}`);
    };
  };
  // 监听远程流，方法一：
  // peerConnection.value.ontrack = (event) => {
  //   remoteVideo.srcObject = event.streams[0];
  // };
  // 方法二：你也可以使用 addStream API，来更加详细的控制流的添加
  const remoteStream: MediaStream = new MediaStream();
  peerConnection.value.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
    // 设置远程视频流
    remoteVideo.srcObject = remoteStream;
  };
};
const createOffer = async () => {
  // 创建 offer
  const offer = await peerConnection.value.createOffer();
  // 设置本地描述
  await peerConnection.value.setLocalDescription(offer);
  // 到这里，我们本地的 offer 就创建好了，一般在这里通过信令服务器发送 offerSdp 给远端
  // 监听 RTCPeerConnection 的 onicecandidate 事件，当 ICE 服务器返回一个新的候选地址时，就会触发该事件
  peerConnection.value.onicecandidate = async (event) => {
    if (!event.candidate) {
      return;
    }
    localOffer.value = JSON.stringify(peerConnection.value.localDescription);
  };
};
const createAnswer = async (localOffer: string) => {
  if (!localOffer) return;
  // 解析字符串
  const offer = JSON.parse(localOffer);
  peerConnection.value.onicecandidate = async (event) => {
    // Event that fires off when a new answer ICE candidate is created
    if (event.candidate) {
      const answer = JSON.stringify(peerConnection.value.localDescription);
      remoteAnswer.value = answer;
    }
  };
  await peerConnection.value.setRemoteDescription(offer);
  const answer = await peerConnection.value.createAnswer();
  await peerConnection.value.setLocalDescription(answer);
};
// 添加 answer(应答)
const addAnswer = async (remoteAnswer: string) => {
  if (!remoteAnswer) return;
  const answer = JSON.parse(remoteAnswer);
  if (!peerConnection.value.currentRemoteDescription) {
    peerConnection.value.setRemoteDescription(answer);
  }
};
onMounted(() => {
  init();
});
</script>
<style scoped lang="scss">
.p2p {
  &-header {
    background-color: var(--el-color-primary-light-7);
    color: var(--el-text-color-primary);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &-main {
    height: 100%;
  }
  &-footer {
    background-color: var(--el-color-primary-light-7);
    height: var(--el-header-height);
  }
  &-subtitle {
    text-align: center;
  }
  &-video {
    text-align: center;
    &__dom {
      width: 560px;
      aspect-ratio: 16/9;
      object-fit: contain;
      background-color: #000;
    }
  }
}
</style>
