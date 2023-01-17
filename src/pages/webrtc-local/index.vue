<template>
  <div class="webrtc">
    <div class="webrtc-video margin-right-20">
      <video ref="video" class="webrtc-video__inner" width="480" height="300" autoplay playsinline muted></video>
      <el-button type="primary" @click="takePhoto" class="button">拍摄</el-button>
      <el-button @click="setVideoBackground">设置虚拟背景</el-button>
    </div>
    <div class="webrtc-img">
      <img
        v-for="(item, index) in imgList"
        :key="index"
        :src="item"
        alt=""
        class="webrtc-img__item margin-right-10 margin-bottom-10"
      />
    </div>
    <div class="webrtc-device margin-left-20">
      <div class="webrtc-device__list">
        <label class="webrtc-device__label">切换设备</label>
        <select>
          <option v-for="item in deviceList" :key="item.deviceId" :value="item.deviceId">{{ item.label }}</option>
        </select>
      </div>
      <div class="webrtc-device__list">
        <label class="webrtc-device__label">切换方向</label>
        <select v-model="cameraDirection" @change="switchCamera">
          <option :value="1">前置摄像头</option>
          <option :value="2">后置摄像头</option>
        </select>
      </div>
      <Shared @playStream="playLocalStream"></Shared>
    </div>
  </div>
  <Video ref="sonRef"></Video>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Shared from './shared.vue';
import Video from './video.vue';
const video = ref<HTMLVideoElement>();
const imgList = ref<string[]>([]);
const sonRef = ref<{ onMounted: (video: HTMLVideoElement) => void }>();
const deviceList = ref<MediaDeviceInfo[]>([]);
const cameraDirection = ref(1);

let localStream: MediaStream;
// 获取本地音视频流
async function getLocalStream(constraints?: MediaStreamConstraints) {
  // 获取媒体流
  localStream = await navigator.mediaDevices.getUserMedia(constraints);
  playLocalStream(localStream);
}

// 播放本地视频流
function playLocalStream(stream: MediaStream) {
  video.value!.srcObject = stream;
}
// 拍照
function takePhoto() {
  const videoEl = video.value as HTMLVideoElement;
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  imgList.value.push(canvas.toDataURL('image/png'));

  // 添加滤镜
  const filterList = [
    'blur(5px)', // 模糊
    'brightness(0.5)', // 亮度
    'contrast(200%)', // 对比度
    'grayscale(100%)', // 灰度
    'hue-rotate(90deg)', // 色相旋转
    'invert(100%)', // 反色
    'opacity(90%)', // 透明度
    'saturate(200%)', // 饱和度
    'saturate(20%)', // 饱和度
    'sepia(100%)', // 褐色
    'drop-shadow(4px 4px 8px blue)', // 阴影
  ];
  imgList.value = [];
  for (let i = 0; i < filterList.length; i++) {
    ctx.filter = filterList[i];
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    imgList.value.push(canvas.toDataURL('image/png'));
  }
}

// 切换摄像头
const switchCamera = () => {
  const constraints: MediaStreamConstraints = {
    video: true, // 开启默认摄像头
    audio: true,
  };
  constraints.video = {
    // 强制切换前后摄像头时，当摄像头不支持时，会报一个OverconstrainedError［无法满足要求的错误］
    facingMode: { exact: cameraDirection.value === 1 ? 'user' : 'environment' },
    // 也可以这样当前后摄像头不支持切换时，会继续使用当前摄像头，好处是不会报错
    // facingMode: val === 1 ? 'user' : 'environment',
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      console.log('切换成功');
      playLocalStream(stream);
    })
    .catch((err) => {
      console.error(`你的设备不支持切换前后摄像头 ${err}`);
    });
};
// 获取所有视频输入设备
async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log('🚀🚀🚀 / 设备列表', devices);
  const videoDevices = devices.filter((device) => device.kind === 'videoinput');
  deviceList.value = videoDevices;
  console.log('🚀🚀🚀 / 摄像头列表', videoDevices);
}
// 虚拟背景
const setVideoBackground = () => {
  sonRef.value?.onMounted(video.value as HTMLVideoElement);
};
onMounted(() => {
  getLocalStream({
    video: true,
    audio: true,
  });
  getDevices();
});

onUnmounted(() => {
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = false;
  });
});
</script>
<style scoped lang="scss">
.webrtc {
  width: 100%;
  background-color: #fff;
  display: flex;
  &-video {
    width: 480px;
    text-align: center;
    &__inner {
      width: 100%;
    }
  }
  &-img {
    display: flex;
    width: 50%;
    flex-wrap: wrap;
    &__item {
      width: 120px;
    }
  }
  &-device {
    &__list {
      line-height: 40px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
</style>
