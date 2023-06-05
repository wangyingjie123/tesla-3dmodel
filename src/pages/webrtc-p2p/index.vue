<template>
  <el-container>
    <el-header class="p2p-header">Webrtc-P2P通话</el-header>
    <el-main>
      <el-row>
        <el-col :span="16">
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
        </el-col>
        <el-col :span="8">
          <el-collapse v-model="activeNames">
            <el-collapse-item title="本地操作区域-打开2个tab页" name="1">
              <OfferForm
                :localOffer="localOffer"
                :remoteAnswer="remoteAnswer"
                @createOffer="createOffer"
                @createAnswer="createAnswer"
                @addAnswer="addAnswer"
              ></OfferForm>
            </el-collapse-item>
          </el-collapse>
        </el-col>
      </el-row>
    </el-main>
    <el-footer></el-footer>
  </el-container>
</template>
<script setup lang="ts">
import 'webrtc-adapter';
import { ref, onMounted } from 'vue';
import OfferForm from './offer-form.vue';
const localRef = ref<HTMLVideoElement>();
const remoteRef = ref<HTMLVideoElement>();
const activeNames = ref('');
// 创建本地/远程 SDP 描述, 用于描述本地/远程的媒体流
const localOffer = ref('');
const remoteAnswer = ref('');
const pc = new RTCPeerConnection({
  iceServers: [
    {
      urls: 'stun:stun.voipbuster.com',
    },
  ],
});
// 初始化
const init = async () => {
  // 获取本地端视频标签
  const localVideo = localRef.value!;
  // 获取远程端视频标签
  const remoteVideo = remoteRef.value!;
  // 采集本地媒体流
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  // 设置本地视频流
  localVideo.srcObject = localStream;
  // 不推荐使用：已经过时的方法 [addStream API](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream)
  // pc.addStream(localStream);
  // 添加本地媒体流的轨道都添加到 RTCPeerConnection 中
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });
  // 监听远程流，方法一：
  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };
  // 方法二：你也可以使用 addStream API，来更加详细的控制流的添加
  // const remoteStream: MediaStream = new MediaStream()
  // pc.ontrack = (event) => {
  //   event.streams[0].getTracks().forEach((track) => {
  //     remoteStream.addTrack(track)
  //   })
  //   // 设置远程视频流
  //   remoteVideo.srcObject = remoteStream
  // }
};
const createOffer = async () => {
  // 创建 offer
  const offer = await pc.createOffer();
  // 设置本地描述
  await pc.setLocalDescription(offer);
  // 到这里，我们本地的 offer 就创建好了，一般在这里通过信令服务器发送 offerSdp 给远端
  // 监听 RTCPeerConnection 的 onicecandidate 事件，当 ICE 服务器返回一个新的候选地址时，就会触发该事件
  pc.onicecandidate = async (event) => {
    if (!event.candidate) {
      return;
    }
    localOffer.value = JSON.stringify(pc.localDescription);
  };
};
const createAnswer = async (localOffer: string) => {
  if (!localOffer) return;
  // 解析字符串
  const offer = JSON.parse(localOffer);
  pc.onicecandidate = async (event) => {
    // Event that fires off when a new answer ICE candidate is created
    if (event.candidate) {
      const answer = JSON.stringify(pc.localDescription);
      remoteAnswer.value = answer;
    }
  };
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
};
// 添加 answer(应答)
const addAnswer = async (remoteAnswer: string) => {
  if (!remoteAnswer) return;
  const answer = JSON.parse(remoteAnswer);
  if (!pc.currentRemoteDescription) {
    pc.setRemoteDescription(answer);
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
    text-align: center;
    font-size: var(--el-font-size-medium);
    line-height: var(--el-header-height);
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
      width: 480px;
    }
  }
}
</style>
