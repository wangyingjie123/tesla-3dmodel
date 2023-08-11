export enum CloseState {
  Normal = 1000,
  Error = 1001,
}
interface WebsocketPorops {
  onMessageCallback: (message: string) => void;
  wsuri: string;
  maxReconnectCount?: number; // 最大重连次数
  onOpenCallback?: () => void;
  onCloseCallback?: (closeState: CloseState) => void;
}
export class WebSocketClient {
  onMessageCallback: (message: string) => void;
  wsuri = '';
  maxReconnectCount = 5; // 最大重连次数
  onOpenCallback?: () => void;
  onCloseCallback?: (closeState: CloseState) => void;
  private readonly heartbeatStr = 'ping';
  private pingCount = 0; // 心跳次数
  private websocket: WebSocket | null = null;
  private isError = false; // 是否出错
  private connectRetryCount = 0; // 当前重连次数
  private timeoutnum: ReturnType<typeof setTimeout> | undefined;
  private heartbeat: ReturnType<typeof setTimeout> | undefined;

  constructor({ onMessageCallback, wsuri, maxReconnectCount, onOpenCallback, onCloseCallback }: WebsocketPorops) {
    this.onMessageCallback = onMessageCallback;
    this.wsuri = wsuri;
    this.maxReconnectCount = maxReconnectCount ?? this.maxReconnectCount;
    this.onOpenCallback = onOpenCallback;
    this.onCloseCallback = onCloseCallback;
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
    this.isError = false;
    // this.sendHeart();
    this.onOpenCallback?.();
  }

  send(message: string) {
    this.websocket!.send(message);
  }

  onClose() {
    if (this.connectRetryCount === this.maxReconnectCount) {
      this.onCloseCallback?.(CloseState.Error);
    } else {
      this.onCloseCallback?.(CloseState.Normal);
    }
    console.log('websocket连接关闭');
  }

  // 连接出错-重新连接
  onError(e: Event) {
    this.reconnect();
    this.isError = true;
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
