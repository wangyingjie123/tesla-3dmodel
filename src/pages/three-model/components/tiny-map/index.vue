<template>
  <div class="tiny-map">
    <div class="tiny-map__inner">
      <i
        class="tiny-map__rotate"
        :style="{
          transform: `rotate(${rotate}deg)`,
          left: `${position.left}px`,
          top: `${position.top}px`,
        }"
      ></i>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rotate: {
    type: Number,
    default: 0,
  },
  position: {
    type: Object,
    default: () => ({ left: 0, top: 0 }),
  },
});
</script>
<style lang="scss" scoped>
.tiny-map {
  position: absolute;
  top: 30px;
  right: 30px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px groove rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  &-inner {
    height: 220px;
    width: 180px;
    background: url('@/assets/images/home/tiny_map.png') no-repeat center;
    background-size: 100% 100%;
    position: relative;
  }
  &__rotat {
    display: inline-block;
    height: 38px;
    width: 38px;
    background: url('@/assets/images/home/rotate.png') no-repeat center;
    background-size: 100% 100%;
    transition:
      left 0.5s ease-in-out,
      top 0.5s ease-in-out,
      transform ease-in-out;
    position: absolute;
    transform-origin: center bottom;
  }
}
</style>
