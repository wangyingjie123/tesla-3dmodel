<template>
  <div class="header-left">
    <p class="header-left-text">
      <span class="timer">{{ `${week}曜日` }}</span>
      <span class="timer">{{ time }}</span>
      <span class="timer">Kepler-90 +49°18′18.58″</span>
    </p>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { weekMap } from '@/pages/three/config';
const week = ref(weekMap[new Date().getDay()]);
const time = ref('00:00:00');
let timeInterval;
const updateTime = () => {
  timeInterval = setInterval(() => {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const times = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${
      seconds < 10 ? '0' + seconds : seconds
    }`;
    time.value = times;
  }, 1000);
};
onMounted(() => {
  updateTime();
});

onUnmounted(() => {
  clearInterval(timeInterval);
});
</script>
<style lang="scss" scoped>
.header {
  &-left {
    height: 100%;
    min-width: var(--aside-width);
    width: 27.5%;
    &-text {
      animation-duration: 1.26s;
      animation-duration: calc(var(--glitched-duration) * 1.4);
      animation-iteration-count: infinite;
      animation-name: h1glitched;
      animation-timing-function: linear;
      padding: 8px 16px;
      position: relative;
      text-align: left;
      .timer {
        color: #000;
        font-size: 18px;
        font-weight: 600;
        padding-right: 8px;
      }
      &::before {
        animation-duration: calc(var(--glitched-duration) * 2);
        animation-iteration-count: infinite;
        animation-name: h1beforeglitched;
        animation-timing-function: linear;
        background-color: #000;
        bottom: 2px;
        -webkit-clip-path: polygon(0 0, 85px 0, 90px 5px px, 100% 5px, 100% 6px, 85px 6px, 80px 10px, 0 10px);
        clip-path: polygon(0 0, 85px 0, 90px 5px, 100% 5px, 100% 6px, 85px 6px, 80px 10px, 0 10px);
        content: '';
        display: block;
        height: 8px;
        left: -20px;
        position: absolute;
        width: 100%;
      }
      &::after {
        -webkit-animation-duration: 0.9s;
        animation-duration: 0.9s;
        -webkit-animation-duration: var(--glitched-duration);
        animation-duration: var(--glitched-duration);
        -webkit-animation-iteration-count: infinite;
        animation-iteration-count: infinite;
        -webkit-animation-name: hxafter;
        animation-name: hxafter;
        -webkit-animation-timing-function: linear;
        animation-timing-function: linear;
        color: #000;
        content: '_';
        font-size: 22px;
        font-weight: 600;
      }
    }
  }
}
@keyframes h1glitched {
  0% {
    transform: skew(-20deg);
    left: -4px;
  }
  10% {
    transform: skew(-20deg);
    left: -4px;
  }
  11% {
    transform: skew(0deg);
    left: 2px;
  }
  50% {
    transform: skew(0deg);
  }
  51% {
    transform: skew(10deg);
  }
  59% {
    transform: skew(10deg);
  }
  60% {
    transform: skew(0deg);
  }
  100% {
    transform: skew(0deg);
  }
}
@keyframes hxafter {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  51% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
}
</style>
