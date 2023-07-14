<template>
  <div class="games">
    <header class="games-header">
      <div class="games-header-bg"></div>
      <div class="games-header-inner">
        <HeaderLeft />
      </div>
      <div class="games-header-logo"></div>
    </header>
    <canvas id="webgl"></canvas>
    <aside class="aside left">
      <AsideText @handleStartButtonClick="handleStartButtonClick" />
      <div class="box">
        <div class="box-chart" id="chart_1"></div>
      </div>
      <div class="box dotted aside-text">
        <div class="box-chart" id="chart_2"></div>
      </div>
    </aside>
    <aside class="aside right">
      <div class="box">
        <div class="box-chart" id="chart_3"></div>
      </div>
      <div class="box">
        <div class="box-chart" id="chart_4"></div>
      </div>
      <div class="box dotted aside-text">
        <div class="box-chart" id="chart_5"></div>
      </div>
    </aside>
    <Footer />
    <div class="games-mask"></div>
  </div>
</template>
<script setup>
// https://dragonir.github.io/3d/#/earthDigital
import { ref, onMounted } from 'vue';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Tween, update } from 'three/examples/jsm/libs/tween.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { randFloat, randInt } from 'three/src/math/MathUtils';
// echarts
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  PolarComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
// other
import { chart_1_option, chart_2_option, chart_3_option, chart_4_option, chart_5_option } from './cyberpunk-config';
import imgData from '@/assets/images/cyberpunk/earth.jpg';
import lineFragmentShader from '@/assets/line/fragment.glsl?raw';
import HeaderLeft from './components/header-left/index.vue';
import AsideText from './components/aside-text/index.vue';
import Footer from './components/footer/index.vue';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  BarChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  PolarComponent,
  LegendComponent,
  ToolboxComponent,
  LineChart,
  PieChart,
]);
const renderGlithPass = ref(false);
const initThree = () => {
  let earth;
  // 创建场景
  const scene = new THREE.Scene();
  // 创建相机
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 50);
  camera.position.set(0, 0, 15.5);
  // 渲染器
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#webgl'),
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // 后期
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const glitchPass = new GlitchPass();
  composer.addPass(glitchPass);
  // 添加镜头轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  const params = {
    colors: { base: '#f9f002', gradInner: '#8ae66e', gradOuter: '#03c03c' },
    reset: () => {
      controls.reset();
    },
  };

  const maxImpactAmount = 10;
  const impacts = [];
  const trails = [];
  for (let i = 0; i < maxImpactAmount; i++) {
    impacts.push({
      impactPosition: new THREE.Vector3().random().subScalar(0.5).setLength(5),
      impactMaxRadius: 5 * randFloat(0.5, 0.75),
      impactRatio: 0,
      prevPosition: new THREE.Vector3().random().subScalar(0.5).setLength(5),
      trailRatio: { value: 0 },
      trailLength: { value: 0 },
    });
    makeTrail(i);
  }
  const uniforms = {
    impacts: {
      value: impacts,
    },
    // 陆地色块大小
    maxSize: {
      value: 0.04,
    },
    // 海洋色块大小
    minSize: {
      value: 0.025,
    },
    // 冲击波高度
    waveHeight: {
      value: 0.1,
    },
    // 冲击波范围
    scaling: {
      value: 1,
    },
    // 冲击波径向渐变内侧颜色
    gradInner: {
      value: new THREE.Color(params.colors.gradInner),
    },
    // 冲击波径向渐变外侧颜色
    gradOuter: {
      value: new THREE.Color(params.colors.gradOuter),
    },
  };

  const tweens = [];
  for (let i = 0; i < maxImpactAmount; i++) {
    tweens.push({
      runTween: () => {
        const path = trails[i];
        const speed = 3;
        const len = path.geometry.attributes.lineDistance.array[99];
        const dur = len / speed;
        const tweenTrail = new Tween({ value: 0 }).to({ value: 1 }, dur * 1000).onUpdate((val) => {
          impacts[i].trailRatio.value = val.value;
        });
        const tweenImpact = new Tween({ value: 0 })
          .to({ value: 1 }, randInt(2500, 5000))
          .onUpdate((val) => {
            uniforms.impacts.value[i].impactRatio = val.value;
          })
          .onComplete(() => {
            impacts[i].prevPosition.copy(impacts[i].impactPosition);
            impacts[i].impactPosition.random().subScalar(0.5).setLength(5);
            setPath(path, impacts[i].prevPosition, impacts[i].impactPosition, 1);
            uniforms.impacts.value[i].impactMaxRadius = 5 * randFloat(0.5, 0.75);
            tweens[i].runTween();
          });
        tweenTrail.chain(tweenImpact);
        tweenTrail.start();
      },
    });
  }

  tweens.forEach((t) => {
    t.runTween();
  });
  makeGlobeOfPoints();
  // 页面缩放监听并重新更新场景和相机
  window.addEventListener('resize', onWindowResize);

  const gui = new dat.GUI();
  gui.add(uniforms.maxSize, 'value', 0.01, 0.06).step(0.001).name('陆地');
  gui.add(uniforms.minSize, 'value', 0.01, 0.06).step(0.001).name('海洋');
  gui.add(uniforms.waveHeight, 'value', 0.1, 1).step(0.001).name('浪高');
  gui.add(uniforms.scaling, 'value', 1, 5).step(0.01).name('范围');
  gui
    .addColor(params.colors, 'base')
    .name('基础色')
    .onChange((val) => {
      earth && earth.material.color.set(val);
    });
  gui
    .addColor(params.colors, 'gradInner')
    .name('渐变内')
    .onChange((val) => {
      uniforms.gradInner.value.set(val);
    });
  gui
    .addColor(params.colors, 'gradOuter')
    .name('渐变外')
    .onChange((val) => {
      uniforms.gradOuter.value.set(val);
    });
  gui.add(params, 'reset').name('重置');
  gui.hide();

  // 页面重绘动画
  renderer.setAnimationLoop(() => {
    update();
    earth.rotation.y += 0.001;
    renderer.render(scene, camera);
    renderGlithPass.value && composer.render();
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  window.addEventListener(
    'dblclick',
    (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(earth.children);
      if (intersects.length > 0) {
        // this.setState({
        //   showModal: true,
        //   modelText: tips[Math.floor(Math.random() * tips.length)],
        // });
      }
    },
    false
  );

  function makeGlobeOfPoints() {
    const dummyObj = new THREE.Object3D();
    const p = new THREE.Vector3();
    const sph = new THREE.Spherical();
    const geoms = [];
    const tex = new THREE.TextureLoader().load(imgData);
    const counter = 75000;
    const rad = 5;
    let r = 0;
    const dlong = Math.PI * (3 - Math.sqrt(5));
    const dz = 2 / counter;
    let long = 0;
    let z = 1 - dz / 2;
    // 创建10000个平面圆点网格并将其定位到球坐标
    for (let i = 0; i < counter; i++) {
      r = Math.sqrt(1 - z * z);
      p.set(Math.cos(long) * r, z, -Math.sin(long) * r).multiplyScalar(rad);
      z = z - dz;
      long = long + dlong;
      sph.setFromVector3(p);
      dummyObj.lookAt(p);
      dummyObj.updateMatrix();
      const g = new THREE.PlaneGeometry(1, 1);
      g.applyMatrix4(dummyObj.matrix);
      g.translate(p.x, p.y, p.z);
      const centers = [p.x, p.y, p.z, p.x, p.y, p.z, p.x, p.y, p.z, p.x, p.y, p.z];
      const uv = new THREE.Vector2((sph.theta + Math.PI) / (Math.PI * 2), 1 - sph.phi / Math.PI);
      const uvs = [uv.x, uv.y, uv.x, uv.y, uv.x, uv.y, uv.x, uv.y];
      g.setAttribute('center', new THREE.Float32BufferAttribute(centers, 3));
      g.setAttribute('baseUv', new THREE.Float32BufferAttribute(uvs, 2));
      geoms.push(g);
    }
    const g = mergeGeometries(geoms);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(params.colors.base),
      onBeforeCompile: (shader) => {
        shader.uniforms.impacts = uniforms.impacts;
        shader.uniforms.maxSize = uniforms.maxSize;
        shader.uniforms.minSize = uniforms.minSize;
        shader.uniforms.waveHeight = uniforms.waveHeight;
        shader.uniforms.scaling = uniforms.scaling;
        shader.uniforms.gradInner = uniforms.gradInner;
        shader.uniforms.gradOuter = uniforms.gradOuter;
        shader.uniforms.tex = { value: tex };
        shader.vertexShader = `
            struct impact {
              vec3 impactPosition;
              float impactMaxRadius;
              float impactRatio;
            };
            uniform impact impacts[${maxImpactAmount}];
            uniform sampler2D tex;
            uniform float maxSize;
            uniform float minSize;
            uniform float waveHeight;
            uniform float scaling;
            attribute vec3 center;
            attribute vec2 baseUv;
            varying float vFinalStep;
            varying float vMap;
            ${shader.vertexShader}
          `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
            float finalStep = 0.0;
            for (int i = 0; i < ${maxImpactAmount};i++){
              float dist = distance(center, impacts[i].impactPosition);
              float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio;
              float sstep = smoothstep(0., curRadius, dist) - smoothstep(curRadius - ( 0.25 * impacts[i].impactRatio ), curRadius, dist);
              sstep *= 1. - impacts[i].impactRatio;
              finalStep += sstep;
            }
            finalStep = clamp(finalStep, 0., 1.);
            vFinalStep = finalStep;
            float map = texture(tex, baseUv).g;
            vMap = map;
            float pSize = map < 0.5 ? maxSize : minSize;
            float scale = scaling;
            transformed = (position - center) * pSize * mix(1., scale * 1.25, finalStep) + center; // scale on wave
            transformed += normal * finalStep * waveHeight; // lift on wave
            `
        );
        shader.fragmentShader = `
            uniform vec3 gradInner;
            uniform vec3 gradOuter;
            varying float vFinalStep;
            varying float vMap;
            ${shader.fragmentShader}
            `.replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `
            // shaping the point, pretty much from The Book of Shaders
            vec2 hUv = (vUv - 0.5);
            int N = 8;
            float a = atan(hUv.x,hUv.y);
            float r = PI2/float(N);
            float d = cos(floor(.5+a/r)*r-a)*length(hUv);
            float f = cos(PI / float(N)) * 0.5;
            if (d > f) discard;
            vec3 grad = mix(gradInner, gradOuter, clamp( d / f, 0., 1.)); // gradient
            vec3 diffuseMap = diffuse * ((vMap > 0.5) ? 0.5 : 1.);
            vec3 col = mix(diffuseMap, grad, vFinalStep); // color on wave
            //if (!gl_FrontFacing) col *= 0.25; // moderate the color on backside
            vec4 diffuseColor = vec4( col , opacity );
            `
        );
      },
    });
    m.defines = { USE_UV: '' };
    earth = new THREE.Mesh(g, m);
    earth.rotation.y = Math.PI;
    trails.forEach((t) => {
      earth.add(t);
    });
    earth.position.set(0, -0.4, 0);
    scene.add(earth);
  }

  function makeTrail(idx) {
    const pts = new Array(100 * 3).fill(0);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const m = new THREE.LineDashedMaterial({
      color: params.colors.gradOuter,
      transparent: true,
      onBeforeCompile: (shader) => {
        shader.uniforms.actionRatio = impacts[idx].trailRatio;
        shader.uniforms.lineLength = impacts[idx].trailLength;
        shader.fragmentShader = lineFragmentShader;
      },
    });
    const l = new THREE.Line(g, m);
    l.userData.idx = idx;
    setPath(l, impacts[idx].prevPosition, impacts[idx].impactPosition, 1);
    trails.push(l);
  }

  function setPath(l, startPoint, endPoint, peakHeight, cycles) {
    const pos = l.geometry.attributes.position;
    const division = pos.count - 1;
    const cycle = cycles || 1;
    const peak = peakHeight || 1;
    const radius = startPoint.length();
    const angle = startPoint.angleTo(endPoint);
    const arcLength = radius * angle;
    const diameterMinor = arcLength / Math.PI;
    const radiusMinor = (diameterMinor * 0.5) / cycle;
    const peakRatio = peak / diameterMinor;
    const radiusMajor = startPoint.length() + radiusMinor;
    const basisMajor = new THREE.Vector3().copy(startPoint).setLength(radiusMajor);
    const basisMinor = new THREE.Vector3().copy(startPoint).negate().setLength(radiusMinor);
    const tri = new THREE.Triangle(startPoint, endPoint, new THREE.Vector3());
    const nrm = new THREE.Vector3();
    tri.getNormal(nrm);
    const v3Major = new THREE.Vector3();
    const v3Minor = new THREE.Vector3();
    const v3Inter = new THREE.Vector3();
    const vFinal = new THREE.Vector3();
    for (let i = 0; i <= division; i++) {
      const divisionRatio = i / division;
      const angleValue = angle * divisionRatio;
      v3Major.copy(basisMajor).applyAxisAngle(nrm, angleValue);
      v3Minor.copy(basisMinor).applyAxisAngle(nrm, angleValue + Math.PI * 2 * divisionRatio * cycle);
      v3Inter.addVectors(v3Major, v3Minor);
      const newLength = (v3Inter.length() - radius) * peakRatio + radius;
      vFinal.copy(v3Inter).setLength(newLength);
      pos.setXYZ(i, vFinal.x, vFinal.y, vFinal.z);
    }
    pos.needsUpdate = true;
    l.computeLineDistances();
    l.geometry.attributes.lineDistance.needsUpdate = true;
    impacts[l.userData.idx].trailLength.value = l.geometry.attributes.lineDistance.array[99];
    l.material.dashSize = 3;
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  }
};

const initCharts = () => {
  const chart_1 = echarts.init(document.querySelector('#chart_1'), 'dark');
  chart_1 && chart_1.setOption(chart_1_option);

  const chart_2 = echarts.init(document.querySelector('#chart_2'), 'dark');
  chart_2 && chart_2.setOption(chart_2_option);

  const chart_3 = echarts.init(document.querySelector('#chart_3'), 'dark');
  chart_3 && chart_3.setOption(chart_3_option);

  const chart_4 = echarts.init(document.querySelector('#chart_4'), 'dark');
  chart_4 && chart_4.setOption(chart_4_option);

  const chart_5 = echarts.init(document.querySelector('#chart_5'), 'dark');
  chart_5 && chart_5.setOption(chart_5_option);
};

// 添加故障风格后期处理
const handleStartButtonClick = () => {
  renderGlithPass.value = !renderGlithPass.value;
};
onMounted(() => {
  initThree();
  initCharts();
});
</script>
<style lang="scss" scoped src="./cyberpunk.scss"></style>
