<template>
  <div class="home">
    <Progress :resourceList="resourceList"></Progress>
    <canvas class="webgl"></canvas>
    <div class="vr">
      <span class="vr-box">
        <i class="vr-icon"></i>
        <b class="vr-text">全景漫游</b>
      </span>
    </div>
    <!-- 场景切换点 -->
    <div class="switch">
      <span
        class="switch-button"
        v-for="(room, index) in rooms"
        :key="index"
        @click="handleSwitchButtonClick(room.key)"
        v-show="room.key !== data.currentRoom"
      >
        <b class="switch-button__text">{{ room.name }}</b>
        <i class="switch-button__icon"></i>
      </span>
    </div>
    <!-- 交互点 -->
    <div
      class="point"
      v-for="(point, index) in interactivePoints"
      :key="index"
      :class="[`point-${index}`, `point-${point.key}`]"
      @click="handleReactivePointClick(point)"
      v-show="point.room === data.currentRoom"
    >
      <div class="point-label animate-point-wave" :class="[`label-${index}`, `label-${point.key}`]">
        <label class="point-label__tips">
          <div class="point-cover">
            <i
              class="point-cover__icon"
              :style="{
                background: `url(${point.cover}) no-repeat center`,
                'background-size': 'contain',
              }"
            ></i>
          </div>
          <div class="point-info">
            <p class="point-info__text p1">{{ point.value }}</p>
            <p class="point-info__text p2">{{ point.description }}</p>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, reactive, computed, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
import { update } from 'three/examples/jsm/libs/tween.module.js';
import { OrbitControls } from '@/utils/orbit-controls';
import Animations from '@/utils/animations';
import { rooms, resourceList } from './home-data';
import Progress from '@/components/progress.vue';

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(resolve, duration);
  });

const data = reactive({
  renderer: null,
  camera: null,
  scene: null,
  controls: null,
  cameraZAxis: 2,
  currentRoom: 'living-room',
});
// 更新窗口大小
const sizes = {};
let rafId = 0;
// 获取交互点的信息
const interactivePoints = computed(() => {
  const res = [];
  rooms.forEach((room) => {
    if (room.interactivePoints && room.interactivePoints.length > 0) {
      room.interactivePoints.forEach((point) => {
        point = {
          room: room.key,
          ...point,
        };
        res.push(point);
      });
    }
  });
  return res;
});

const resizeFun = () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  // 更新渲染
  data.renderer.setSize(sizes.width, sizes.height);
  data.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // 更新相机
  data.camera.aspect = sizes.width / sizes.height;
  data.camera.updateProjectionMatrix();
};
const initScene = () => {
  // 初始化渲染器
  const canvas = document.querySelector('canvas.webgl');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  data.renderer = renderer;
  // 初始化场景
  const scene = new THREE.Scene();
  data.scene = scene;
  // 初始化相机
  const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 1000);
  camera.position.z = data.cameraZAxis;
  scene.add(camera);
  data.camera = camera;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  // 缩放限制
  controls.maxDistance = 12;
  // 垂直旋转限制
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;
  data.controls = controls;
  // 页面缩放事件监听
  window.addEventListener('resize', resizeFun);
  const textLoader = new THREE.TextureLoader();
  // 创建空间
  const createRoom = (name, position, map) => {
    const geometry = new THREE.SphereGeometry(16, 256, 256);
    geometry.scale(1, 1, -1);
    const material = new THREE.MeshBasicMaterial({
      map: textLoader.load(map),
      side: THREE.DoubleSide,
    });
    const room = new THREE.Mesh(geometry, material);
    room.name = name;
    room.position.set(position.x, position.y, position.z);
    room.rotation.y = Math.PI / 2;
    scene.add(room);
    return room;
  };
  // 创建网格对象
  rooms.map((item) => {
    const room = createRoom(item.key, item.position, item.map);
    return room;
  });
  // 添加交互点
  const raycaster = new THREE.Raycaster();
  // 室内悬浮标记物
  const _points = interactivePoints.value.map((item, index) => ({
    ...item,
    element: document.querySelector(`.point-${index}`),
  }));
  // 动画
  const tick = () => {
    if (renderer) {
      for (const point of _points) {
        // 获取2D屏幕位置
        const screenPosition = point.position.clone();
        const pos = screenPosition.project(camera);
        raycaster.setFromCamera(screenPosition, camera);
        // const intersects = raycaster.intersectObjects(scene.children, true);
        if (Math.abs(pos.x) > 1 || Math.abs(pos.y) > 1 || Math.abs(pos.z) > 1) {
          // 点在摄像机外面 不显示
          point.element.style.transform = 'scale(0, 0)';
          continue;
        }

        // 找到相交点
        // 获取相交点的距离和点的距离
        // const intersectionDistance = intersects[0].distance;
        // const pointDistance = point.position.distanceTo(camera.position);
        // 相交点距离比点距离近，隐藏；相交点距离比点距离远，显示
        // intersectionDistance < pointDistance
        //   ? point.element.classList.remove('visible')
        //   : point.element.classList.add('visible');

        // pos.z > 1 ? point.element.classList.remove('visible') : point.element.classList.add('visible');
        const translateX = screenPosition.x * sizes.width * 0.5;
        const translateY = -screenPosition.y * sizes.height * 0.5;
        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
      }
    }
    controls && controls.update();
    update();
    // 更新渲染器
    renderer.render(scene, camera);
    // 页面重绘时调用自身
    rafId = window.requestAnimationFrame(tick);
  };
  tick();
};

// 点击切换场景
const handleSwitchButtonClick = async (key) => {
  const room = rooms.filter((item) => item.key === key)[0];
  if (data.camera) {
    const x = room.position.x;
    const y = room.position.y;
    const z = room.position.z;
    Animations.animateCamera(data.camera, data.controls, { x, y, z: data.cameraZAxis }, { x, y, z }, 1600, () => ({}));
    data.controls.update();
  }
  await sleep(1600);
  data.currentRoom = room.key;
};
// 点击交互点
const handleReactivePointClick = (point) => {
  ElMessage.success(`您点击了${point.value}`);
};
onMounted(() => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  initScene();
});
onUnmounted(() => {
  window.removeEventListener('resize', resizeFun);
  window.cancelAnimationFrame(rafId);
});
</script>
<style lang="scss">
@import url('@/assets/styles/keyframes.scss');
</style>
<style lang="scss" scoped src="./home-view.scss"></style>
