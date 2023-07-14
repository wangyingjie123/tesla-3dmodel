<template>
  <footer class="footer">
    <div class="footer-square">
      <div class="footer-radar"></div>
      <div class="footer-text">
        <p class="footer-title">5024.88</p>
        <p class="footer-description">距离</p>
      </div>
    </div>
    <div class="footer-square">
      <div class="footer-radar"></div>
      <div class="footer-text">
        <p class="footer-title">0.00025%</p>
        <p class="footer-description">含氧量</p>
      </div>
    </div>
    <div class="footer-square">
      <div class="footer-radar"></div>
      <div class="footer-text">
        <p class="footer-title">2077.77</p>
        <p class="footer-description">辐射</p>
      </div>
    </div>
  </footer>
</template>
<script setup></script>
<style lang="scss" scoped>
.footer {
  align-items: center;
  backdrop-filter: blur(4px);
  background: rgba(0, 20, 50, 0.2);
  border-radius: 16px;
  bottom: 16px;
  display: flex;
  height: 80px;
  justify-content: space-around;
  left: 50%;
  padding: 16px 32px;
  transform: translateX(-50%);
  width: 600px;
  position: absolute;
  &-square {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: space-between;
  }
  &-radar {
    background: radial-gradient(center, rgba(32, 255, 77, 0.3) 0, rgba(32, 255, 77, 0) 75%),
      repeating-radial-gradient(
        rgba(32, 255, 77, 0) 5.8%,
        rgba(32, 255, 77, 0) 18%,
        #20ff4d 18.6%,
        rgba(32, 255, 77, 0) 18.9%
      ),
      linear-gradient(90deg, rgba(32, 255, 77, 0) 49.5%, #20ff4d 50%, #20ff4d 0, rgba(32, 255, 77, 0) 50.2%),
      linear-gradient(0deg, rgba(32, 255, 77, 0) 49.5%, #20ff4d 50%, #20ff4d 0, rgba(32, 255, 77, 0) 50.2%);
    border: 0.1rem solid #20ff4d;
    border: 0.1rem solid #20ff4d;
    border-radius: 50%;
    height: 60px;
    max-height: 60px;
    max-width: 60px;
    opacity: 0.8;
    overflow: hidden;
    position: relative;
    width: 60px;
    &::before {
      animation: blips 5s infinite;
      animation-delay: 1.4s;
      animation-timing-function: linear;
      border-radius: 50%;
      content: ' ';
      display: block;
      height: 100%;
      position: absolute;
      width: 100%;
    }
    &::after {
      animation: radar-beam 5s infinite;
      animation-timing-function: linear;
      background-image: linear-gradient(44deg, rgba(0, 255, 51, 0) 50%, #0f3);
      border-radius: 100% 0 0 0;
      content: '';
      display: block;
      height: 50%;
      left: 0;
      position: absolute;
      top: 0;
      transform-origin: bottom right;
      width: 50%;
    }
  }
  &-text {
    display: inline-block;
    padding: 0 16px;
  }
  &-title {
    color: var(--yellow-color);
    font-size: 20px;
  }
  &-description {
    color: #fff;
    font-size: 14px;
  }
}
@keyframes radar-beam {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes blips {
  14% {
    background: radial-gradient(2vmin circle at 75% 70%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%);
  }
  14.0002% {
    background: radial-gradient(2vmin circle at 75% 70%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 63% 72%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%);
  }
  25% {
    background: radial-gradient(2vmin circle at 75% 70%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 63% 72%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 56% 86%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%);
  }
  26% {
    background: radial-gradient(2vmin circle at 75% 70%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 63% 72%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 56% 86%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%);
    opacity: 1;
  }
  100% {
    background: radial-gradient(2vmin circle at 75% 70%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 63% 72%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%),
      radial-gradient(2vmin circle at 56% 86%, white 10%, #20ff4d 30%, rgba(255, 255, 255, 0) 100%);
    opacity: 0;
  }
}
</style>
