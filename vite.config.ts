import { defineConfig } from 'vite';
import path from 'path';
import * as fs from 'fs';
import vue from '@vitejs/plugin-vue';
import eslintPlugin from 'vite-plugin-eslint'; //导入包
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/mixin.scss";`,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // map '@' to './src'
    },
  },
  build: {
    target: 'es2015',
  },
  plugins: [
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    vue(), // 增加下面的配置项,这样在运行时就能检查eslint规范
    eslintPlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 9005,
    https: {
      key: fs.readFileSync(`${__dirname}/server/assets/localhost-key.pem`),
      cert: fs.readFileSync(`${__dirname}/server/assets/localhost.pem`),
    },
  },
});
