<template>
  <div class="loading" v-if="isLoading">
    <div class="loading-inner">
      <div class="loading-inner__item" :style="{ width: loadingWidth + '%' }"></div>
    </div>
    <div class="margin-left-10">{{ parseInt(loadingWidth) }}%</div>
  </div>
  <div class="mask">
    <p class="margin-bottom-10">x : {{ x }} y:{{ y }} z :{{ z }}</p>
    <div>
      <el-button @click="isAutoFun" type="primary">转动车</el-button>
      <el-button @click="stop" type="warning">停止</el-button>
    </div>
    <div class="mask-flex">
      <div
        @click="setCarColor(index)"
        class="mask-flex__item"
        v-for="(item, index) in colorAry"
        :key="index"
        :style="{ backgroundColor: item }"
      ></div>
    </div>
  </div>
  <div class="canvas" ref="canvas"></div>
</template>

<script setup>
// https://juejin.cn/post/6982435184838705159
import { onMounted, onUnmounted, reactive, ref, toRefs } from 'vue';
import {
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLight,
  HemisphereLightHelper,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const colorAry = [
  'rgb(142, 36, 170)',
  'rgb(81, 45, 168)',
  'rgb(48, 63, 159)',
  'rgb(251, 140, 0)',
  'rgb(244, 81, 30)',
  'rgb(66, 165, 245)',
  'rgb(38, 166, 154)',
  'rgb(129, 199, 132)',
  'rgb(255, 235, 59)',
  'rgb(90, 90, 90)',
  'rgb(22, 22, 22)',
  'rgb(0, 0, 0)',
];
//const lightColor = new Color(colorAry[Math.floor(Math.random() * colorAry.length)])
const loader = new GLTFLoader();
const defaultMap = {
  x: 510,
  y: 128,
  z: 0,
};
const map = reactive(defaultMap);
const { x, y, z } = toRefs(map);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let scene, camera, renderer, controls, floor, dhelper, hHelper, directionalLight, hemisphereLight;
const isLoading = ref(true);
const loadingWidth = ref(0);
const canvas = ref();

const setFloor = () => {
  const floorGeometry = new PlaneGeometry(5000, 5000, 1, 1.1);
  const floorMaterial = new MeshPhongMaterial({
    color: 0x77f28f,
    // wireframe: true
  });
  floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -0.5 * Math.PI;
  floor.position.y = -2.1;
  scene.add(floor);
};

const setLight = () => {
  directionalLight = new DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(-4, 8, 4);
  dhelper = new DirectionalLightHelper(directionalLight, 5, 0xff0000);
  hemisphereLight = new HemisphereLight(0xffffff, 0xffffff, 0.4);
  hemisphereLight.position.set(0, 8, 0);
  hHelper = new HemisphereLightHelper(hemisphereLight, 5);
  scene.add(directionalLight);
  scene.add(hemisphereLight);
};

const setCamera = () => {
  const { x, y, z } = defaultMap;
  scene = new Scene();
  camera = new PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
  camera.position.set(x, y, z);
  renderer = new WebGLRenderer();
  renderer.setSize(innerWidth, innerHeight);
  canvas.value.appendChild(renderer.domElement);
};
const setControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = true;
  controls.addEventListener('change', render);
};

const init = async () => {
  const gltf = await loadFile('./tesla_2018_model_3/scene.gltf');
  setCamera();
  setLight();
  console.log(setFloor);
  setControls();
  scene.add(gltf.scene);
  loop();
};

const loop = () => {
  window.requestAnimationFrame(loop);
  renderer.render(scene, camera);
  controls.update();
};
const isAutoFun = () => {
  controls.autoRotate = true;
};
const stop = () => {
  controls.autoRotate = false;
};

const render = () => {
  map.x = Number.parseInt(camera.position.x);
  map.y = Number.parseInt(camera.position.y);
  map.z = Number.parseInt(camera.position.z);
};

const setCarColor = (index) => {
  const currentColor = new Color(colorAry[index]);
  scene.traverse((child) => {
    if (child.isMesh) {
      console.log(child.name);
      if (child.name.includes('door_')) {
        child.material.color.set(currentColor);
      }
    }
  });
};

const loadFile = (url) => {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        resolve(gltf);
      },
      ({ loaded, total }) => {
        const load = Math.abs((loaded / total) * 100);
        loadingWidth.value = load;

        if (load >= 100) {
          setTimeout(() => {
            isLoading.value = false;
          }, 1000);
        }
        console.log((loaded / total) * 100 + '% loaded');
      },
      (err) => {
        reject(err);
      }
    );
  });
};
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
  init();
  window.addEventListener('resize', onResizeFun);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResizeFun);
  window.cancelAnimationFrame(loop);
});
</script>

<style scoped lang="scss">
.loading {
  background: #000;
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 1111111;
  color: #fff;
  &-inner {
    width: 400px;
    height: 20px;
    border: 1px solid #fff;
    background: #000;
    overflow: hidden;
    border-radius: 10px;
    &__item {
      background: #fff;
      height: 20px;
      width: 0;
      transition-duration: 500ms;
      transition-timing-function: ease-in;
    }
  }
}

canvas {
  width: 100%;
  height: 100%;
  margin: auto;
}

.mask {
  color: #fff;
  position: absolute;
  top: 20px;
  left: 20px;
  &-flex {
    display: flex;
    flex-wrap: wrap;
    padding: 10px 0;
    &__item {
      width: 15px;
      height: 15px;
      margin: 5px;
      cursor: pointer;
    }
  }
}
</style>
