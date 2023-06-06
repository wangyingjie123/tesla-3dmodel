<template>
  <div class="control-wrapper">
    <div class="control-btn control-top"></div>
    <div class="control-btn control-left"></div>
    <div class="control-btn control-bottom"></div>
    <div class="control-btn control-right"></div>
    <div class="control-round" style="background-color: #000000">
      <div class="control-round__inner"></div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="scss" scoped>
.control {
  &-btn {
    position: absolute;
    width: 38%;
    height: 38%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #78aee4;
    box-sizing: border-box;
    transition: all 0.3s linear;
    &:before {
      content: '';
      position: relative;
      display: block;
      width: 16px;
      height: 16px;
      border-top: 3px solid #78aee4;
      border-right: 3px solid #78aee4;
      border-radius: 0 4px 0 0;
      box-sizing: border-box;
      z-index: 2;
    }
    &:after {
      content: '';
      position: absolute;
      width: 60%;
      height: 60%;
      background: #fff;
      z-index: 2;
    }
    &:hover {
      color: black;
      background: yellow;
    }
  }
  &-round {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 51.2%;
    height: 51.2%;
    background: #fff;
    border-radius: 50%;
    &__inner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      justify-content: center;
      align-items: center;
      width: 66%;
      height: 66%;
      border: 1px solid #78aee4;
      border-radius: 50%;
      &:hover {
        color: black;
        background: yellow;
      }
      &:before {
        content: '| |';
        display: block;
        width: 50px;
        line-height: 50px;
        text-align: center;
        background: #78aee4;
        font-weight: bolder;
        color: #fff;
        border-radius: 50%;
      }
    }
  }
  &-wrapper {
    cursor: pointer;
    position: relative;
    width: 50vw;
    height: 50vw;
    max-width: 300px;
    max-height: 300px;
    min-width: 240px;
    min-height: 240px;
    margin: 0 auto;
    border-radius: 50%;
  }
  &-top {
    top: 0;
    left: 50%;
    transform: translateX(-50%) rotate(-45deg);
    border-radius: 4px 100% 4px 4px;
    &:before {
      transform: translate(30%, -25%);
    }
    &:after {
      left: 0;
      bottom: 0;
      border-top: 1px solid #78aee4;
      border-right: 1px solid #78aee4;
      border-radius: 0 100% 0 0;
    }
  }
  &-bottom {
    left: 50%;
    bottom: 0;
    transform: translateX(-50%) rotate(45deg);
    border-radius: 4px 4px 100% 4px;
    &:before {
      transform: translate(25%, 25%) rotate(90deg);
    }
    &:after {
      top: 0;
      left: 0;
      border-bottom: 1px solid #78aee4;
      border-right: 1px solid #78aee4;
      border-radius: 0 0 100% 0;
    }
  }
  &-left {
    top: 50%;
    left: 0;
    transform: translateY(-50%) rotate(45deg);
    border-radius: 4px 4px 4px 100%;
    &:before {
      transform: translate(-25%, 30%) rotate(180deg);
    }
    &:after {
      right: 0;
      top: 0;
      border-bottom: 1px solid #78aee4;
      border-left: 1px solid #78aee4;
      border-radius: 0 0 0 100%;
    }
  }
  &-right {
    top: 50%;
    right: 0;
    transform: translateY(-50%) rotate(45deg);
    border-radius: 4px 100% 4px 4px;
    &:before {
      transform: translate(30%, -25%);
    }
    &:after {
      left: 0;
      bottom: 0;
      border-top: 1px solid #78aee4;
      border-right: 1px solid #78aee4;
      border-radius: 0 100% 0 0;
    }
  }
}
</style>
