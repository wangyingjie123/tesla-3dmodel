import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/home/index.vue';
export const routes = [
  { path: '/', component: Home },
  { path: '/webrtc', component: () => import('@/pages/webrtc/index.vue'), title: 'webrtc' },
  { path: '/webrtc-p2p', component: () => import('@/pages/webrtc-p2p/index.vue'), title: 'webrtc远程通话' },
  { path: '/webrtc-player', component: () => import('@/pages/webrtc-player/index.vue'), title: 'webrtc播放' },
  { path: '/three', component: () => import('@/pages/three/index.vue'), title: 'threejs-特斯拉' },
];

// 3. 创建路由实例并传递 `routes` 配置
// 你可以在这里输入更多的配置，但我们在这里
// 暂时保持简单
export const router = createRouter({
  history: createWebHistory(),
  routes,
});
