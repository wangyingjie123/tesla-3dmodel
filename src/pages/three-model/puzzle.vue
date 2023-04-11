<template>
  <div class="canvas-box">
    <canvas id="webgl" class="canvas"></canvas>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// 初始化Three.js场景
let camera = null;
let renderer = null;
let scene = null;
let textureLoader = null;
let material = null;
const images = [
  'home.back.jpg',
  'home.bottom.jpg',
  'home.front.jpg',
  'home.left.jpg',
  'home.right.jpg',
  'home.top.jpg',
];
const init = () => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 50);
  camera.position.z = 5;
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#webgl'),
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 加载拼图碎片纹理图片
  textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('/panorama/home.back.jpg');
  material = new THREE.MeshBasicMaterial({ map: texture });
  // material = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  // 创建球体并贴上拼图碎片纹理
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  // 从球里面往外看
  geometry.scale(-1, 1, 1);
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  // 创建光源和材质
  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(0, 0, 5);
  scene.add(light);
  for (let i = 0; i < images.length; i++) {
    loadImg(i);
  }
  // 添加拖拽控制
  new OrbitControls(camera, renderer.domElement);
};

// 创建拼图碎片并将其放置在球体表面上
const loadImg = (index) => {
  textureLoader.load(`/panorama/${images[index]}`, function (texture) {
    // 创建拼图碎片并将其放置在球体表面上
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const piece = new THREE.Mesh(geometry, material);
    const u = index / 6;
    piece.position.x = Math.sin(u * Math.PI * 2) * 1.2;
    piece.position.y = Math.cos(u * Math.PI * 2) * 1.2;
    piece.position.z = Math.sqrt(1 - piece.position.x * piece.position.x - piece.position.y * piece.position.y);
    piece.lookAt(new THREE.Vector3(0, 0, 0));
    piece.material.map = texture;
    scene.add(piece);
  });
};
// 渲染场景
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

onMounted(() => {
  init();
  render();
});
</script>
<style lang="scss" scoped>
.canvas {
  &-box {
    filter: saturate(0.85);
    overflow: hidden;
    user-select: none;
    width: 100%;
    height: 100%;
    background-color: #000;
    position: relative;
  }
  width: 100%;
  height: 100%;
}
</style>
