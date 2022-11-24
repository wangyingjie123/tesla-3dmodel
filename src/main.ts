import { createApp } from 'vue';
import '@/assets/styles/index.scss';
import App from './App.vue';
import { router } from '@/routes';

const app = createApp(App);
//确保 _use_ 路由实例使
//整个应用支持路由。
app.use(router);

app.mount('#app');
