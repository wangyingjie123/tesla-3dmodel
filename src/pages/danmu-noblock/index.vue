<template>
  <div class="danmu">
    <div
      class="danmu-video"
      v-loading="loading"
      element-loading-text="人物检测模型加载中... "
      element-loading-background="rgba(0, 0, 0, 0.7)"
    >
      <video
        src="/video/dance.mp4"
        class="danmu-video-inner"
        preload="true"
        ref="videoRef"
        loop
        x5-video-player-fullscreen="true"
        x5-playsinline="true"
        playsInline
        webkit-playsinline="true"
        crossOrigin="anonymous"
      ></video>
      <div class="danmu-mask" ref="barrageBoxRef"></div>
      <el-button type="primary" class="danmu-video-btn" @click="videoPlay">{{
        videoStatus === VideoStatus.playing ? '暂停' : '播放'
      }}</el-button>
    </div>
    <el-form
      :inline="true"
      :model="formInline"
      :rules="rules"
      :disabled="loading"
      ref="ruleFormRef"
      @submit.stop.prevent
    >
      <el-form-item label="" prop="message" class="danmu-input">
        <el-input v-model="formInline.message" placeholder="发送弹幕" @keyup.enter="sendDanmu" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="sendDanmu">发送</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-core';
import { getCanvasImgDataByVideo, imageDataToDataURL } from '@/utils/fileloader';
import type { FormInstance, FormRules } from 'element-plus/es/';

enum VideoStatus {
  'ready',
  'playing',
  'pause',
}

const formInline = reactive({
  message: '',
});
const loading = ref(true);
const videoRef = ref<HTMLVideoElement>();
const barrageBoxRef = ref<HTMLDivElement>();
const videoStatus = ref(VideoStatus.ready);
const ruleFormRef = ref<FormInstance>();

const barrageRowNum = 10; // 弹幕行数
const barrageTextFontSize = 16; // 弹幕文字大小
const barrageMarginTop = 4; // 每行弹幕上下间距
const barrageMoveSpeed = 2; // 弹幕移动速度
const drawContour = false; // 是否在每个人的分割蒙版周围绘制轮廓
const foregroundThresholdProbability = 0.3; // 将像素着色为前景而不是背景的最小概率
const weakMap = new WeakMap();

let videoWidth = 0;
let videoHeight = 0;
let frameId = 0;
let segmentaterRef: bodySegmentation.BodySegmenter;

const rules = reactive<FormRules>({
  message: [
    {
      required: true,
      message: '请输入一个弹幕',
      trigger: 'change',
    },
  ],
});
const setBarrageBgImage = async () => {
  const imageData = getCanvasImgDataByVideo(videoRef.value!, videoWidth, videoHeight);
  if (imageData) {
    const segmentationConfig = {
      flipHorizontal: false,
      multiSegmentaion: false,
      segmentBodyParts: false, // 如果设置为true，则24个身体部位被分割输出，否则只有前景/背景二进制分割。
      segmentationThreshold: 1,
    };
    const people = await segmentaterRef?.segmentPeople(imageData, segmentationConfig);
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };
    const backgroundDarkeningMask = await bodySegmentation.toBinaryMask(
      people,
      foregroundColor,
      backgroundColor,
      drawContour,
      foregroundThresholdProbability
    );
    const dataUrl = imageDataToDataURL(backgroundDarkeningMask);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    barrageBoxRef.value.style['-webkit-mask-image'] = `url(${dataUrl})`;
    barrageBoxRef.value!.style[
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      '-webkit-mask-size'
    ] = `${videoWidth}px ${videoHeight}px`;
  }
  if (videoStatus.value === VideoStatus.playing) {
    frameId = window.requestAnimationFrame(setBarrageBgImage);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const danmuScroll = (child: HTMLSpanElement) => {
  // 处理弹幕

  const { left } = child.style;
  const leftNumber = Number(left.replace('px', ''));
  if (leftNumber >= -videoWidth) {
    child.style.left = `${leftNumber - barrageMoveSpeed}px`;
    const frameId = window.requestAnimationFrame(() => danmuScroll(child));
    weakMap.set(child, frameId);
    return;
  }
  if (child) {
    child.parentNode!.removeChild(child);
    window.cancelAnimationFrame(weakMap.get(child));
    weakMap.delete(child);
  }
};

const sendDanmu = async () => {
  await ruleFormRef.value?.validate((valid, fields) => {
    if (valid) {
      const span = document.createElement('span');
      span.innerText = formInline.message;
      span.style.fontSize = `${barrageTextFontSize}px`;
      span.style.fontWeight = '500';
      span.style.color = '#fff';
      span.style.whiteSpace = 'nowrap';
      span.style.position = 'absolute';
      const rowIndex = Math.floor(Math.random() * barrageRowNum);
      const top = rowIndex * (barrageTextFontSize + barrageMarginTop) + barrageTextFontSize;
      span.style.top = `${top}px`;
      span.style.left = `${videoWidth}px`;
      barrageBoxRef.value!.appendChild(span);
      danmuScroll(span);
      ruleFormRef.value?.resetFields();
    } else {
      console.log('error submit!', fields);
    }
  });
};

const videoPlay = () => {
  const video = videoRef.value!;
  if (video.paused) {
    video.play();
    videoStatus.value = VideoStatus.playing;
    setBarrageBgImage();
  } else {
    video.pause();
    videoStatus.value = VideoStatus.pause;
    window.cancelAnimationFrame(frameId);
  }
};

const init = async () => {
  // 加载模型
  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
  const segmenterConfig = {
    runtime: 'mediapipe',
    modelType: 'landscape',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
  };
  try {
    const segmentater = await bodySegmentation.createSegmenter(
      model,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      segmenterConfig
    );
    segmentaterRef = segmentater;
    loading.value = false;
    const { width, height } = videoRef.value!.getBoundingClientRect();
    videoWidth = width;
    videoHeight = height;
    setBarrageBgImage();
  } catch (e) {
    console.log(e);
  }
};

onMounted(() => init());

onUnmounted(() => {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
  }
});
</script>
<style scoped lang="scss">
.danmu {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  &-video {
    width: 324px;
    position: relative;
    &-inner {
      display: block;
      width: 100%;
      object-fit: contain;
    }
    &-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
  &-mask {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  &-input {
    width: 420px;
    margin-right: 10px;
  }
}
</style>
