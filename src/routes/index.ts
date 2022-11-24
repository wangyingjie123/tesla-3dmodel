import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/pages/home/index.vue';
const routes = [
  { path: '/', component: Home },
  { path: '/webrtc', component: () => import('@/pages/webrtc/index.vue') },
  { path: '/webrtc-p2p', component: () => import('@/pages/webrtc-p2p/index.vue') },
  { path: '/three', component: () => import('@/pages/three/index.vue') },
];

// 3. 创建路由实例并传递 `routes` 配置
// 你可以在这里输入更多的配置，但我们在这里
// 暂时保持简单
export const router = createRouter({
  history: createWebHistory(),
  routes,
});
