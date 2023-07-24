var K=Object.defineProperty;var P=(l,t,s)=>t in l?K(l,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):l[t]=s;var r=(l,t,s)=>(P(l,typeof t!="symbol"?t+"":t,s),s);import{n as M,r as q,t as z,o as F,m as Z,x as G,y as Q,p as X}from"./vendor-ac01758b.js";import{d as Y,b as u,r as ee,j as te,J as ae,m as C,q as A,O as i,R as d,ai as oe,V as B,P as ne,a7 as se,S as ce,ao as ie,ap as le,t as p}from"./@vue-cdc79bd8.js";import{_ as re}from"./console-form.vue_vue_type_script_setup_true_lang-c5d47123.js";import{_ as de}from"./index-21675fd9.js";class ue{constructor({onMessageCallback:t,wsuri:s,maxReconnectCount:c,onOpenCallback:h}){r(this,"heartbeatStr","ping");r(this,"onMessageCallback");r(this,"wsuri","");r(this,"maxReconnectCount",5);r(this,"onOpenCallback");r(this,"pingCount",0);r(this,"websocket",null);r(this,"connectRetryCount",0);r(this,"timeoutnum");r(this,"heartbeat");this.onMessageCallback=t,this.wsuri=s,this.maxReconnectCount=c??this.maxReconnectCount,this.onOpenCallback=h,this.initWebsocket()}initWebsocket(){this.websocket=new WebSocket(this.wsuri),this.websocket.onmessage=this.onMessage.bind(this),this.websocket.onopen=this.onOpen.bind(this),this.websocket.onerror=this.onError.bind(this),this.websocket.onclose=this.onClose.bind(this)}onMessage(t){t.data!==this.heartbeatStr&&this.onMessageCallback(t.data)}onOpen(){var t;this.connectRetryCount=0,console.log("websocket建立连接"),(t=this.onOpenCallback)==null||t.call(this)}send(t){this.websocket.send(t)}onClose(){console.log("websocket连接关闭")}onError(t){this.reconnect(),console.error("websocket出现错误",t.target)}sendHeart(){this.heartbeat&&clearTimeout(this.heartbeat),this.heartbeat=setTimeout(()=>{var t;if(((t=this.websocket)==null?void 0:t.readyState)==1){const s={type:this.heartbeat,payload:`${this.pingCount}`};this.send(JSON.stringify(s)),this.pingCount++}else this.reconnect()},1e3)}reconnect(){if(this.connectRetryCount>=this.maxReconnectCount){this.timeoutnum&&clearTimeout(this.timeoutnum);return}this.timeoutnum&&clearTimeout(this.timeoutnum),console.log(`尝试重新连接-第 ${this.connectRetryCount+1}次`),this.timeoutnum=setTimeout(()=>{this.initWebsocket(),this.connectRetryCount+=1},1e4)}destory(){var t;(t=this.websocket)==null||t.close(),this.heartbeat&&clearTimeout(this.heartbeat),this.timeoutnum&&clearTimeout(this.timeoutnum)}}const S=l=>(ie("data-v-8973e040"),l=l(),le(),l),me={class:"p2p-container"},pe=S(()=>p("div",{class:"video-container"},[p("video",{id:"remote-video",class:"video-dom",autoplay:"",playsinline:""}),p("div",{class:"video-title"},"远程视频")],-1)),ve=S(()=>p("div",{class:"video-container"},[p("video",{id:"local-video",class:"video-dom",autoplay:"",playsinline:""}),p("div",{class:"video-title"},"本地视频")],-1)),he=S(()=>p("label",{class:"operation-label"},"连接地址：",-1)),fe=Y({__name:"single-remote",setup(l){const t=u(null),s=u(null),c=u(new MediaStream),h=u(),k=u(""),T=u([]),f=u(""),b=ee({audio:!0,video:!0}),v=u(!0);let w,R="closed";const N=o=>{try{const e=JSON.parse(o);if(console.log("服务端推送：",e),e.type==="answer"){const a=new RTCSessionDescription(e.payload);W(a)}else e.type==="candidate"&&L(new RTCIceCandidate(e.payload))}catch(e){console.error(e)}},E=()=>{const o=/^(ws:\/\/|wss:\/\/)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/,e=k.value.trim();if(!o.test(e)){M.error("请输入正确的websocket地址");return}w=new ue({wsuri:e,onMessageCallback:N,onOpenCallback:()=>{$(),J()}}),k.value=""},x=async o=>{const e=document.getElementById("local-video");c.value=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720},audio:{deviceId:{exact:o}}}),e.srcObject=c.value,navigator.mediaDevices.ondevicechange=async()=>{await I(),await D()}},$=()=>{const o=document.getElementById("remote-video");t.value=new RTCPeerConnection({iceServers:[{urls:"stun:stun.l.google.com:19302"}]}),s.value=t.value.createDataChannel("message",{ordered:!1,maxRetransmits:0}),c.value.getTracks().forEach(a=>{t.value.addTrack(a,c.value)});const e=new MediaStream;t.value.ontrack=a=>{a.streams[0].getTracks().forEach(n=>{e.addTrack(n)}),o.srcObject=e},t.value.oniceconnectionstatechange=()=>{var n;const a=(n=t.value)==null?void 0:n.iceConnectionState;console.log("peerConnection 状态:",a),R=a,(a==="disconnected"||a==="failed")&&console.log("peerConnection 远程连接已断开")},s.value.onmessage=a=>{var n;(n=h.value)==null||n.writeInfo(`接收到的指令：${a.data}`)},t.value.ondatachannel=a=>{M.success("已建立p2p连接"),v.value=!1;const n=a.channel;n.onopen=()=>{n.send("建立连接!")},n.onmessage=_=>{console.log(_.data)}}};async function J(){var o,e;t.value.onicecandidate=async a=>{a.candidate&&w.send(JSON.stringify({type:"candidate",payload:a.candidate}))};try{const a=await((o=t.value)==null?void 0:o.createOffer());await((e=t.value)==null?void 0:e.setLocalDescription(a)),w.send(JSON.stringify({type:"offer",payload:a}))}catch(a){console.error(a)}}async function W(o){var e;await((e=t.value)==null?void 0:e.setRemoteDescription(o)),w.destory()}async function L(o){var e;try{await((e=t.value)==null?void 0:e.addIceCandidate(o))}catch{}}async function I(){const e=(await navigator.mediaDevices.enumerateDevices()).filter(a=>a.kind==="audioinput");T.value=e,f.value=e[0].deviceId,console.log("🎤🎤🎤 / 麦克风列表",e)}const D=async()=>{var o;try{const e=c.value.getAudioTracks()[0];e.stop(),await x(f.value),b.audio===!1&&y(!1),b.video===!1&&O(!1);const a=c.value.getAudioTracks()[0];if(c.value.removeTrack(e),c.value.addTrack(a),R==="connected"){const n=(o=t.value)==null?void 0:o.getTransceivers().find(_=>{var g;return((g=_.sender.track)==null?void 0:g.kind)==="audio"});n==null||n.sender.replaceTrack(a)}console.log("麦克风切换成功!")}catch(e){console.error("Error switching microphone:",e)}},y=o=>{b.audio=o,c.value.getAudioTracks().forEach(e=>{e.enabled=o})},O=o=>{b.video=o,c.value.getVideoTracks().forEach(e=>{e.enabled=o})};function V(){var o,e;v.value=!0,(o=t.value)==null||o.close(),(e=h.value)==null||e.reduction()}return te(()=>{I().then(()=>{x(f.value),y(!1)})}),ae(()=>{V()}),(o,e)=>{const a=q,n=z,_=F,g=Z,U=G,j=Q,H=X;return C(),A("div",me,[i(n,{class:"p2p-container__row"},{default:d(()=>[i(a,{span:12},{default:d(()=>[pe]),_:1}),i(a,{span:12},{default:d(()=>[ve]),_:1})]),_:1}),i(n,{class:"operation"},{default:d(()=>[i(a,{span:24,class:"margin-bottom-10"},{default:d(()=>[i(H,{class:"box-card"},{default:d(()=>[he,i(_,{modelValue:k.value,"onUpdate:modelValue":e[0]||(e[0]=m=>k.value=m),disabled:!v.value,style:{width:"200px","margin-right":"10px"},placeholder:"请输入完整wesocket地址",clearable:"",onKeyup:oe(E,["enter"])},null,8,["modelValue","disabled","onKeyup"]),i(g,{type:"primary",onClick:E,disabled:!v.value},{default:d(()=>[B("加入")]),_:1},8,["disabled"]),i(g,{type:"danger",onClick:V,disabled:v.value},{default:d(()=>[B("关闭连接")]),_:1},8,["disabled"]),i(j,{modelValue:f.value,"onUpdate:modelValue":e[1]||(e[1]=m=>f.value=m),onChange:D,placeholder:"Select",class:"margin-left-10"},{default:d(()=>[(C(!0),A(ne,null,se(T.value,m=>(C(),ce(U,{key:m.deviceId,label:m.label,value:m.deviceId},null,8,["label","value"]))),128))]),_:1},8,["modelValue"])]),_:1})]),_:1}),i(a,{span:24},{default:d(()=>[i(re,{localStream:c.value,peerConnection:t.value,dataChannel:s.value,btnDiabled:v.value,mediaDevices:b,experiment:!1,onHandleAudio:y,onHandleVideo:O,ref_key:"consoleRef",ref:h},null,8,["localStream","peerConnection","dataChannel","btnDiabled","mediaDevices"])]),_:1})]),_:1})])}}});const ye=de(fe,[["__scopeId","data-v-8973e040"]]);export{ye as default};
