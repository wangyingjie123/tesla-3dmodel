interface WebsocketPorops {
  onMessageCallback: (message: string) => void;
  wsuri: string;
  maxReconnectCount?: number; // 最大重连次数
  onOpenCallback?: () => void;
}
export class WebSocketClient {
  readonly heartbeatStr = 'ping';
  onMessageCallback: (message: string) => void;
  wsuri = '';
  maxReconnectCount = 5; // 最大重连次数
  onOpenCallback?: () => void;
  private pingCount = 0; // 心跳次数
  private websocket: WebSocket | null = null;
  private connectRetryCount = 0; // 当前重连次数
  private timeoutnum: ReturnType<typeof setTimeout> | undefined;
  private heartbeat: ReturnType<typeof setTimeout> | undefined;

  constructor({ onMessageCallback, wsuri, maxReconnectCount, onOpenCallback }: WebsocketPorops) {
    this.onMessageCallback = onMessageCallback;
    this.wsuri = wsuri;
    this.maxReconnectCount = maxReconnectCount ?? this.maxReconnectCount;
    this.onOpenCallback = onOpenCallback;
    this.initWebsocket();
  }
  // 初始化weosocket
  initWebsocket() {
    this.websocket = new WebSocket(this.wsuri);
    this.websocket.onmessage = this.onMessage.bind(this);
    this.websocket.onopen = this.onOpen.bind(this);
    this.websocket.onerror = this.onError.bind(this);
    this.websocket.onclose = this.onClose.bind(this);
  }

  onMessage(e: MessageEvent<string>) {
    if (e.data !== this.heartbeatStr) {
      this.onMessageCallback(e.data);
    }
  }

  onOpen() {
    this.connectRetryCount = 0;
    // this.sendHeart();
    console.log('websocket建立连接');
    this.onOpenCallback?.();
  }

  send(message: string) {
    this.websocket!.send(message);
  }

  onClose() {
    console.log('websocket连接关闭');
  }

  // 连接出错-重新连接
  onError(e: Event) {
    this.reconnect();
    console.error('websocket出现错误', e.target);
  }

  // 心跳保活
  private sendHeart() {
    this.heartbeat && clearTimeout(this.heartbeat);
    this.heartbeat = setTimeout(() => {
      // 这里发送一个心跳，后端收到后，返回一个心跳消息，
      if (this.websocket?.readyState == 1) {
        // 如果连接正常
        const message = { type: this.heartbeat, payload: `${this.pingCount}` };
        this.send(JSON.stringify(message));
        this.pingCount++;
      } else {
        // 否则重连
        this.reconnect();
      }
    }, 1000);
  }

  // 重新连接
  private reconnect() {
    if (this.connectRetryCount >= this.maxReconnectCount) {
      this.timeoutnum && clearTimeout(this.timeoutnum);
      return;
    }
    //没连接上会一直重连，设置延迟避免请求过多
    this.timeoutnum && clearTimeout(this.timeoutnum);
    console.log(`尝试重新连接-第 ${this.connectRetryCount + 1}次`);
    this.timeoutnum = setTimeout(() => {
      // 新连接
      this.initWebsocket();
      this.connectRetryCount += 1;
    }, 10000);
  }

  // 销毁
  destory() {
    this.websocket?.close();
    this.heartbeat && clearTimeout(this.heartbeat);
    this.timeoutnum && clearTimeout(this.timeoutnum);
  }
}
