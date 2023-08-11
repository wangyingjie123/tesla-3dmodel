var j=Object.defineProperty;var L=(n,e,s)=>e in n?j(n,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):n[e]=s;var i=(n,e,s)=>(L(n,typeof e!="symbol"?e+"":e,s),s);import{n as _,r as H,t as K,o as U,m as q,p as z,x as P}from"./vendor-0d15525d.js";import{d as Z,b as u,r as F,j as G,J as Q,_ as X,m as Y,q as ee,O as c,R as d,ak as te,V as S,ai as oe,aj as ae,t as m}from"./@vue-30559afa.js";import{_ as ne}from"./console-form.vue_vue_type_script_setup_true_lang-29541ee0.js";import{_ as se}from"./index-8f5c279f.js";var x=(n=>(n[n.Normal=1e3]="Normal",n[n.Error=1001]="Error",n))(x||{});class ie{constructor({onMessageCallback:e,wsuri:s,maxReconnectCount:r,onOpenCallback:b,onCloseCallback:h}){i(this,"onMessageCallback");i(this,"wsuri","");i(this,"maxReconnectCount",5);i(this,"onOpenCallback");i(this,"onCloseCallback");i(this,"heartbeatStr","ping");i(this,"pingCount",0);i(this,"websocket",null);i(this,"isError",!1);i(this,"connectRetryCount",0);i(this,"timeoutnum");i(this,"heartbeat");this.onMessageCallback=e,this.wsuri=s,this.maxReconnectCount=r??this.maxReconnectCount,this.onOpenCallback=b,this.onCloseCallback=h,this.initWebsocket()}initWebsocket(){this.websocket=new WebSocket(this.wsuri),this.websocket.onmessage=this.onMessage.bind(this),this.websocket.onopen=this.onOpen.bind(this),this.websocket.onerror=this.onError.bind(this),this.websocket.onclose=this.onClose.bind(this)}onMessage(e){e.data!==this.heartbeatStr&&this.onMessageCallback(e.data)}onOpen(){var e;this.connectRetryCount=0,this.isError=!1,(e=this.onOpenCallback)==null||e.call(this)}send(e){this.websocket.send(e)}onClose(){var e,s;this.connectRetryCount===this.maxReconnectCount?(e=this.onCloseCallback)==null||e.call(this,1001):(s=this.onCloseCallback)==null||s.call(this,1e3),console.log("websocket连接关闭")}onError(e){this.reconnect(),this.isError=!0,console.error("websocket出现错误",e.target)}sendHeart(){this.heartbeat&&clearTimeout(this.heartbeat),this.heartbeat=setTimeout(()=>{var e;if(((e=this.websocket)==null?void 0:e.readyState)==1){const s={type:this.heartbeat,payload:`${this.pingCount}`};this.send(JSON.stringify(s)),this.pingCount++}else this.reconnect()},1e3)}reconnect(){if(this.connectRetryCount>=this.maxReconnectCount){this.timeoutnum&&clearTimeout(this.timeoutnum);return}this.timeoutnum&&clearTimeout(this.timeoutnum),console.log(`尝试重新连接-第 ${this.connectRetryCount+1}次`),this.timeoutnum=setTimeout(()=>{this.initWebsocket(),this.connectRetryCount+=1},1e4)}destory(){var e;(e=this.websocket)==null||e.close(),this.heartbeat&&clearTimeout(this.heartbeat),this.timeoutnum&&clearTimeout(this.timeoutnum)}}const k=n=>(oe("data-v-6dbde2d3"),n=n(),ae(),n),ce={class:"p2p-container","element-loading-text":"正在建立连接..."},le=k(()=>m("div",{class:"video-container"},[m("video",{id:"remote-video",class:"video-dom",autoplay:"",playsinline:""}),m("div",{class:"video-title"},"远程视频")],-1)),re=k(()=>m("div",{class:"video-container"},[m("video",{id:"local-video",class:"video-dom",autoplay:"",playsinline:""}),m("div",{class:"video-title"},"本地视频")],-1)),de=k(()=>m("label",{class:"operation-label"},"连接地址：",-1)),ue=Z({__name:"single-remote",setup(n){const e=u(null),s=u(null),r=u(new MediaStream),b=u(),h=u(""),p=u(!0),f=u(!1),g=F({audio:!0,video:!0});let C,v;const O=a=>{try{const o=JSON.parse(a);if(console.log("服务端推送：",o),o.type==="answer"){const t=new RTCSessionDescription(o.payload);M(t)}else o.type==="candidate"&&N(new RTCIceCandidate(o.payload))}catch(o){console.error(o)}},E=()=>{const a=/^(ws:\/\/|wss:\/\/)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/,o=h.value.trim();if(!a.test(o)){_.error("请输入正确的websocket地址");return}f.value=!0,C=new ie({wsuri:o,onMessageCallback:O,onOpenCallback:()=>{V(),D()},onCloseCallback:t=>{t===x.Error&&(_.error("连接超过最大次数，已自动断开连接"),f.value=!1)}}),h.value=""},I=async()=>{try{const a=document.getElementById("local-video");r.value=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720},audio:!0}),a.srcObject=r.value,R(!1)}catch(a){_.error(`获取本地媒体流失败：${a}`)}},V=()=>{const a=document.getElementById("remote-video");e.value=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]}),r.value.getTracks().forEach(t=>{e.value.addTrack(t,r.value)});const o=new MediaStream;e.value.ontrack=t=>{t.streams[0].getTracks().forEach(l=>{o.addTrack(l)}),a.srcObject=o},e.value.oniceconnectionstatechange=()=>{var l;const t=(l=e.value)==null?void 0:l.iceConnectionState;if(console.log("peerConnection 状态:",t),t==="connected")_.success("webrtc连接已建立"),p.value=!1,f.value=!1,y(),C.destory();else if(t==="disconnected"||t==="failed"){if(v)return;v=window.setTimeout(()=>w(),3e4)}else t==="closed"?(y(),w()):y()},s.value=e.value.createDataChannel("message",{ordered:!1,maxRetransmits:0,negotiated:!0,id:0}),s.value.onmessage=t=>{var l;(l=b.value)==null||l.writeInfo(`接收到的指令：${t.data}`)}};async function D(){var a,o;e.value.onicecandidate=async t=>{t.candidate&&C.send(JSON.stringify({type:"candidate",payload:t.candidate}))};try{const t=await((a=e.value)==null?void 0:a.createOffer());await((o=e.value)==null?void 0:o.setLocalDescription(t)),C.send(JSON.stringify({type:"offer",payload:t}))}catch(t){console.error(t)}}async function M(a){var o;try{await((o=e.value)==null?void 0:o.setRemoteDescription(a))}catch(t){console.error(t)}}async function N(a){var o;try{await((o=e.value)==null?void 0:o.addIceCandidate(a))}catch{}}const R=a=>{g.audio=a,r.value.getAudioTracks().forEach(o=>{o.enabled=a})},$=a=>{g.video=a,r.value.getVideoTracks().forEach(o=>{o.enabled=a})},y=()=>{v&&window.clearTimeout(v),v=0},w=()=>{var a,o,t;_.error("webrtc连接已断开"),p.value=!0,f.value=!1,(a=s.value)==null||a.close(),(o=e.value)==null||o.close(),(t=b.value)==null||t.reduction()};return G(()=>{I()}),Q(()=>{clearTimeout(v),w()}),(a,o)=>{const t=H,l=K,B=U,T=q,A=z,J=P;return X((Y(),ee("div",ce,[c(l,{class:"p2p-container__row"},{default:d(()=>[c(t,{span:12},{default:d(()=>[le]),_:1}),c(t,{span:12},{default:d(()=>[re]),_:1})]),_:1}),c(l,{class:"operation"},{default:d(()=>[c(t,{span:24,class:"margin-bottom-10"},{default:d(()=>[c(A,{class:"box-card"},{default:d(()=>[de,c(B,{modelValue:h.value,"onUpdate:modelValue":o[0]||(o[0]=W=>h.value=W),disabled:!p.value,style:{width:"200px","margin-right":"10px"},placeholder:"请输入完整wesocket地址",clearable:"",onKeyup:te(E,["enter"])},null,8,["modelValue","disabled","onKeyup"]),c(T,{type:"primary",onClick:E,disabled:!p.value},{default:d(()=>[S("加入")]),_:1},8,["disabled"]),c(T,{type:"danger",onClick:w,disabled:p.value},{default:d(()=>[S("关闭连接")]),_:1},8,["disabled"])]),_:1})]),_:1}),c(t,{span:24},{default:d(()=>[c(ne,{localStream:r.value,peerConnection:e.value,dataChannel:s.value,btnDiabled:p.value,mediaDevices:g,experiment:!1,onHandleAudio:R,onHandleVideo:$,ref_key:"consoleRef",ref:b},null,8,["localStream","peerConnection","dataChannel","btnDiabled","mediaDevices"])]),_:1})]),_:1})])),[[J,f.value]])}}});const fe=se(ue,[["__scopeId","data-v-6dbde2d3"]]);export{fe as default};
