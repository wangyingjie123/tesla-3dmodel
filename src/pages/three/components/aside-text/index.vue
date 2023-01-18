<template>
  <div class="aside-text flex-box box">
    <div class="aside-cover"></div>
    <div class="aside-text-info">
      <p class="text">
        <b>Cyberpunk</b> is a subgenre of science fiction in a dystopian futuristic setting that tends to focus on a
        "combination of lowlife and high tech", featuring futuristic technological and scientific achievements, such as
        artificial intelligence and cybernetics, juxtaposed with societal collapse or decay.
      </p>
      <button class="aside-btn button" @click="handleStartButtonClick">{{ btnText }}</button>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';
const props = defineProps({ renderGlithPass: Boolean });
const emit = defineEmits(['handleStartButtonClick']);
const btnText = ref('START');
const handleStartButtonClick = () => {
  btnText.value = props.renderGlithPass ? 'START' : 'STOP';
  emit('handleStartButtonClick');
};
</script>
<style lang="scss" scoped>
.aside {
  &-text {
    &-info {
      align-items: center;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
      padding-left: 16px;
      width: 55%;
      .text {
        font-size: 14px;
        height: calc(100% - 50px);
        line-height: 1.5;
        overflow: hidden auto;
        text-align: justify;
        text-align-last: left;
        text-overflow: ellipsis;
        white-space: pre-wrap;
        word-break: break-all;
        &::-webkit-scrollbar {
          background: 0 0;
          cursor: pointer;
          width: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background-clip: padding-box;
          background-color: rgba(3, 192, 60, 0.5);
          border: 1px solid transparent;
          border-radius: 4px;
        }
      }
      .button {
        &:hover {
          &::after {
            animation: glitch 1s;
            animation-timing-function: steps(2);
          }
        }
        &::after {
          --slice-0: inset(50% 50% 50% 50%);
          --slice-1: inset(80% -6px 0 0);
          --slice-2: inset(50% -6px 30% 0);
          --slice-3: inset(10% -6px 85% 0);
          --slice-4: inset(40% -6px 43% 0);
          --slice-5: inset(80% -6px 5% 0);
          background: linear-gradient(45deg, transparent 3%, #00e6f6 0, #00e6f6 5%, #ff013c 0);
          bottom: 0;
          -webkit-clip-path: var(--slice-0);
          clip-path: var(--slice-0);
          content: 'START';
          display: block;
          left: 0;
          position: absolute;
          right: 0;
          text-shadow: -3px -3px 0 #f8f005, 3px 3px 0 #00e6f6;
          top: 0;
        }
      }
    }
  }
  &-cover {
    background: url('@/assets/images/cyberpunk/role.png') no-repeat 50%;
    background-size: auto 100%;
    height: 100%;
    width: 45%;
  }
  &-btn,
  &-btn::after {
    height: 40px;
    line-height: 40px;
    background: linear-gradient(45deg, transparent 5%, #ff013c 0);
    border: 0;
    box-shadow: 6px 0 0 #00e6f6;
    color: #fff;
    cursor: pointer;
    font-size: 20px;
    height: 40px;
    letter-spacing: 3px;
    outline: transparent;
    position: relative;
    width: 120px;
  }
}
@keyframes glitch {
  0% {
    clip-path: var(--slice-1);
    transform: translate(-20px, -10px);
  }
  10% {
    clip-path: var(--slice-3);
    transform: translate(10px, 10px);
  }
  20% {
    clip-path: var(--slice-1);
    transform: translate(-10px, 10px);
  }
  30% {
    clip-path: var(--slice-3);
    transform: translate(0px, 5px);
  }
  40% {
    clip-path: var(--slice-2);
    transform: translate(-5px, 0px);
  }
  50% {
    clip-path: var(--slice-3);
    transform: translate(5px, 0px);
  }
  60% {
    clip-path: var(--slice-4);
    transform: translate(5px, 10px);
  }
  70% {
    clip-path: var(--slice-2);
    transform: translate(-10px, 10px);
  }
  80% {
    clip-path: var(--slice-5);
    transform: translate(20px, -10px);
  }
  90% {
    clip-path: var(--slice-1);
    transform: translate(-10px, 0px);
  }
  100% {
    clip-path: var(--slice-1);
    transform: translate(0);
  }
}
</style>
