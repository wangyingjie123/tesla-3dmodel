import http from 'http';
import { Server } from 'socket.io';
import express from 'express';
import type { AddressInfo } from 'node:net';

const port = 3001;
const app = express();
const httpServer = http.createServer(app);
// 创建信令服务器
const io = new Server(httpServer, {
  cors: {
    origin: '*', // 允许跨域
    methods: ['GET', 'POST'], // 允许的请求方式
    allowedHeaders: '*', // 允许的请求头
    credentials: true, // 允许携带cookie
  },
  allowEIO3: true, // 是否启用与Socket.IO v2客户端的兼容性
  // transport: ['websocket'], // 仅允许websocket,["polling", "websocket"]
});

// 在指定端口启动服务器
httpServer.listen(port, () => {
  console.log(
    '\n Http server up and running at => http://%s:%s',
    (httpServer.address() as AddressInfo).address,
    (httpServer.address() as AddressInfo).port
  );
});

// 监听用户连接
io.on('connection', (socket) => {
  console.log('connection~');

  // 监听连接断开
  socket.on('disconnect', () => {
    console.log('disconnect~');
  });
});
