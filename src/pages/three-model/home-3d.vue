<template>
  <div ref="panorama" class="panorama"></div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const panorama = ref<HTMLVideoElement>();
const urls = [
  './panorama/home.left.jpg',
  './panorama/home.right.jpg',
  './panorama/home.top.jpg',
  './panorama/home.bottom.jpg',
  './panorama/home.front.jpg',
  './panorama/home.back.jpg',
];

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let loop: number;
const initModel = () => {
  scene = new THREE.Scene();
  const cubeTexture = new THREE.CubeTextureLoader().load(urls);
  scene.background = cubeTexture;
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 100);
  camera.lookAt(scene.position);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  const controls = new OrbitControls(camera, renderer.domElement);
  panorama.value?.appendChild(renderer.domElement);
  controls.keys = {
    LEFT: 'ArrowLeft', //left arrow
    UP: 'ArrowUp', // up arrow
    RIGHT: 'ArrowRight', // right arrow
    BOTTOM: 'ArrowDown', // down arrow
  };
};

function render() {
  renderer.render(scene, camera);
  loop = requestAnimationFrame(render);
}
const onResizeFun = () => {
  // setCamera();
  // 重置渲染器输出画布canvas尺寸
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 通常是使用画布的宽/画布的高。默认值是1
  camera.aspect = window.innerWidth / window.innerHeight;
  // 更新摄像机投影
  camera.updateProjectionMatrix();
};

onMounted(() => {
  initModel();
  render();
  window.addEventListener('resize', onResizeFun);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResizeFun);
  window.cancelAnimationFrame(loop);
});
</script>
<style lang="scss" scoped>
.panorama {
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
