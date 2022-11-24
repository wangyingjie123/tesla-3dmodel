<template>
  <div class="videos margin-top-20">
    <canvas ref="virtualVideoCanvas" class="margin-right-10" width="480" height="300"></canvas>
    <video id="virtual-video" width="480" height="300" autoplay muted></video>
  </div>
</template>
<script lang="ts">
import { ref, defineComponent } from 'vue';
import { processFrameDrawToVirtualVideo } from '@/utils/color';
export default defineComponent({
  setup() {
    const virtualVideoCanvas = ref<HTMLCanvasElement>();
    // 获取背景图像数据
    function getBackgroundImageData(): Promise<ImageData> {
      const backgroundCtx = virtualVideoCanvas.value!.getContext('2d', {
        willReadFrequently: true,
      }) as CanvasRenderingContext2D;
      const img = new Image();
      img.setAttribute('crossOrigin', '');
      return new Promise((resolve) => {
        img.src = 'https://t7.baidu.com/it/u=1819248061,230866778&fm=193&f=GIF';
        img.onload = () => {
          backgroundCtx.drawImage(img, 0, 0, virtualVideoCanvas.value!.width, virtualVideoCanvas.value!.height);
          const backgroundImageData = backgroundCtx.getImageData(
            0,
            0,
            virtualVideoCanvas.value!.width,
            virtualVideoCanvas.value!.height
          );
          resolve(backgroundImageData);
        };
      });
    }
    const WIDTH = 480; // 视频宽度
    const HEIGHT = 300; // 视频高度

    // 将视频写到 canvas 中
    function drawVideoToCanvas(realVideo: HTMLVideoElement, backgroundImageData: ImageData) {
      const realVideoCanvas = document.createElement('canvas') as HTMLCanvasElement;
      const realVideoCtx = realVideoCanvas.getContext('2d', { willReadFrequently: true })!;
      const virtualCanvas = document.createElement('canvas') as HTMLCanvasElement;
      const virtualVideoCtx = virtualCanvas.getContext('2d')!;
      realVideoCanvas.width = virtualCanvas.width = WIDTH;
      realVideoCanvas.height = virtualCanvas.height = HEIGHT;

      // 每隔 100ms 将真实的视频写到 canvas 中，并获取视频的图像数据
      setInterval(() => {
        realVideoCtx.drawImage(realVideo, 0, 0, realVideoCanvas.width, realVideoCanvas.height);
        // 获取 realVideoCanvas 中的图像数据
        const realVideoImageData = realVideoCtx.getImageData(0, 0, realVideoCanvas.width, realVideoCanvas.height);
        // 处理真实视频的图像数据，将其写到虚拟视频的 canvas 中
        processFrameDrawToVirtualVideo({
          backgroundImageData,
          realVideoImageData,
          virtualVideoCtx,
          allowance: 50,
          backgroundColor: [245, 245, 245],
        });
      }, 40);
      // 从 VirtualVideoCanvas 中获取视频流并在 virtualVideo 中播放
      getStreamFromVirtualVideoCanvas(virtualCanvas);
    }
    // 从 VirtualVideoCanvas 中获取视频流并在 virtualVideo 中播放
    function getStreamFromVirtualVideoCanvas(virtualCanvas: HTMLCanvasElement) {
      const virtualVideo = document.querySelector('#virtual-video') as HTMLVideoElement;
      const stream = virtualCanvas.captureStream(30);
      virtualVideo.srcObject = stream;
    }
    const onMounted = (video: HTMLVideoElement) => {
      getBackgroundImageData().then((res) => {
        drawVideoToCanvas(video, res);
      });
    };
    return {
      virtualVideoCanvas,
      onMounted,
    };
  },
});
</script>
