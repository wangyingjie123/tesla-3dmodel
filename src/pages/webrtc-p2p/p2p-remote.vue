<template>
  <div class="p2p-container">
    <el-row class="p2p-container__row">
      <el-col :span="17" class="remote__left">
        <div class="remote-video">
          <video id="remote-video" class="remote-video__dom" autoplay playsinline></video>
        </div>
        <div class="video-title">远程视频</div>
      </el-col>
      <el-col :span="7" class="local__right">
        <div class="local-video">
          <video id="local" class="local-video__dom" autoplay playsinline></video>
        </div>
        <div class="video-title">我</div>
      </el-col>
    </el-row>
    <div class="operation">
      <label class="operation-label">房间号：</label>
      <el-input
        v-model="roomId"
        style="width: 150px; margin-right: 20px"
        placeholder="要加入的房间号"
        clearable
        @keyup.enter="initConnect"
      ></el-input>
      <el-button type="primary" @click="initConnect">加入</el-button>
      <el-button :type="cameraOpen ? 'warning' : 'primary'" @click="handleCamera"
        >{{ cameraOpen ? '关闭' : '打开' }}视频</el-button
      >
      <el-button type="danger" @click="handleLeave">离开</el-button>
      <!-- <el-button :type="cameraOpen ? 'warning' : 'primary'" @click="handleMic">
        {{ cameraOpen ? '关闭' : '打开' }}麦克风
      </el-button> -->
      <!--   <el-button type="primary" @click="createAnswer(offerSdp)">
        创建answer
      </el-button>
      <el-button type="primary" @click="addAnswer">添加answer</el-button> -->
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import io, { Socket } from 'socket.io-client';
// import VConsole from 'vconsole';
// const vConsole = new VConsole();
const peerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: 'stun:stun.voipbuster.com',
    },
  ],
});
const userId = Math.random().toString(36).substring(2);
const roomId = ref('');
let socket: Socket;
let localStream: MediaStream;
let remoteStream: MediaStream;
let offerSdp = '';
function initConnect() {
  if (!roomId.value) {
    ElMessage.error('请输入房间号');
    return;
  }
  socket = io('http://localhost:3001');
  // socket = io('https://192.168.1.126:12345');
  // 连接成功时触发
  socket.on('connect', () => {
    handleConnect();
  });
  // 断开连接时触发
  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // 断线是由服务器发起的，重新连接。
      socket.connect();
    }
    ElMessage.warning('您已断开连接');
  });
  // 服务端发送报错信息
  socket.on('error', (data) => {
    ElMessage.error(data);
  });
  // 当有用户加入房间时触发
  socket.on('welcome', (data) => {
    ElMessage.success(data.userId === userId ? '🦄成功加入房间' : `🦄${data.userId}加入房间`);
  });
  // 当有用户离开房间时触发
  socket.on('leave', (data) => {
    ElMessage.warning(data.userId === userId ? '🦄成功离开房间' : `🦄${data.userId}离开房间`);
  });
  // 当有用户发送消息时触发
  socket.on('message', (data) => {
    console.log(data);
  });
  // 创建offer,发送给远端
  socket.on('createOffer', () => {
    // 发送 offer
    if (offerSdp) {
      socket.emit('offer', {
        userId,
        roomId: roomId.value,
        sdp: offerSdp,
      });
      return;
    }
    createOffer();
  });
  // 收到offer,创建answer
  socket.on('offer', (data) => {
    createAnswer(data.sdp);
  });
  // 收到answer,设置远端sdp
  socket.on('answer', (data) => {
    addAnswer(data.sdp);
  });
}
// 连接成功
function handleConnect() {
  socket.emit('join', { userId, roomId: roomId.value });
}
const init = async () => {
  const localVideo = document.getElementById('local') as HTMLVideoElement;
  const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  remoteStream = new MediaStream();
  localVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };
};
// 创建 offer
async function createOffer() {
  // 当一个新的offer ICE候选人被创建时触发事件
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      offerSdp = JSON.stringify(peerConnection.localDescription);
      // 发送 offer
      if (offerSdp) {
        socket.emit('offer', {
          userId,
          roomId: roomId.value,
          sdp: offerSdp,
        });
      }
    }
  };
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
  } catch (e) {
    console.log(e);
  }
}
// 创建 answer
async function createAnswer(val: string) {
  const offer = JSON.parse(val);
  peerConnection.onicecandidate = async (event) => {
    // 当一个新的 answer ICE candidate 被创建时
    if (event.candidate) {
      socket.emit('answer', {
        userId,
        roomId: roomId.value,
        sdp: JSON.stringify(peerConnection.localDescription),
      });
    }
  };
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
}
// 添加 answer
async function addAnswer(answerSdp: string) {
  const answer = JSON.parse(answerSdp);
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
}
// 打关摄像头
const cameraOpen = ref(true);
function handleCamera() {
  cameraOpen.value = !cameraOpen.value;
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = cameraOpen.value;
  });
}
// // 开关麦克风
// const isAudioOpen = ref(true)
// function handleMic() {
//   localStream.getAudioTracks().forEach((track) => {
//     track.stop()
//   })
//   isAudioOpen.value = !isAudioOpen.value
// }
// 离开房间
function handleLeave() {
  // 关闭对等连接
  peerConnection.close();
  // 发送离开的消息
  socket.emit('leave', { userId, roomId: roomId.value });
  // 关闭socket连接
  socket.disconnect();
}
onMounted(() => {
  init();
});
</script>
<style lang="scss" scoped>
.p2p-container {
  height: 100vh;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  align-items: center;
  &__row {
    width: 100%;
    background-color: #000;
    flex: 1;
  }
  .remote {
    &__left {
      display: flex;
      flex-direction: column;
    }
    &-video {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      &__dom {
        border: 2px solid #048ff2;
        background-color: #363739;
        border-radius: 4px;
        width: 60%;
        aspect-ratio: 16 / 9;
      }
    }
  }
  .local {
    &__right {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0 30px;
    }
    &-video {
      width: 100%;
      &__dom {
        width: 100%;
        border: 2px solid #048ff2;
        background-color: #363739;
        border-radius: 4px;
        aspect-ratio: 16 / 9;
      }
    }
  }
  .video-title {
    width: 100%;
    background-color: #000000b3;
    color: #fff;
    text-align: center;
    box-sizing: border-box;
    border: 2px solid;
    padding: 5px 0;
    border-color: #048ff2;
  }

  .operation {
    &-label {
      color: #fff;
    }
    width: 100%;
    height: 100px;
    text-align: center;
    background-color: #405982;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
