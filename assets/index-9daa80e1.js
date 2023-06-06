import{n as P,m as A,o as T,p as I,q as z,r as H,g as Q,t as W,v as G,h as X,w as Y,i as Z,x as ee}from"./vendor-fec9aa6e.js";import{d as E,a as c,l as x,m as M,M as a,Q as e,q as s,U as _,O as U,ai as N,aj as q,R as ae,ak as te,V as $,f as le}from"./@vue-8492d132.js";import{_ as B}from"./index-8cc47a06.js";const ne=async n=>{try{await navigator.clipboard.writeText(n),P.success("Page URL copied to clipboard")}catch(v){console.error("Failed to copy: ",v)}},O=n=>(N("data-v-483e5b80"),n=n(),q(),n),oe={class:"card-header"},se={class:"card-header__title"},re=O(()=>s("h3",null,"用户1操作区",-1)),de=O(()=>s("p",{class:"margin-top-10"},"点击create offer，生成SDP offer，把下面生成的offer复制给用户2",-1)),ce=O(()=>s("div",{class:"card-header"},[s("div",{class:"card-header__title"},[s("h3",null,"用户2操作区")]),s("p",{class:"margin-top-10"}," 将上方用户1生成的offer粘贴到下方，点击create answer生成SDP answer，然后将生成的答案复制给下方用户1 ")],-1)),ie=O(()=>s("div",{class:"card-header"},[s("div",{class:"card-header__title"},[s("h3",null,"用户1操作区")]),s("p",{class:"margin-top-10"},"将用户2生成的SDP answer粘贴到下方，然后点击add answer")],-1)),ue=E({__name:"offer-form",props:{localOffer:{},remoteAnswer:{}},emits:["createOffer","createAnswer","addAnswer"],setup(n,{emit:v}){const f=c(""),o=c(""),t=r=>{ne(r)};return(r,l)=>{const m=A,b=T,w=I;return x(),M(U,null,[a(w,{shadow:"always"},{header:e(()=>[s("div",oe,[s("div",se,[re,a(m,{type:"primary",onClick:l[0]||(l[0]=p=>v("createOffer"))},{default:e(()=>[_("create offer")]),_:1})]),de])]),default:e(()=>[a(b,{value:r.localOffer,disabled:"",placeholder:"点击上方create offer",class:"input-with-select"},{append:e(()=>[a(m,{onClick:l[1]||(l[1]=p=>t(r.localOffer)),disabled:!r.localOffer},{default:e(()=>[_("复制")]),_:1},8,["disabled"])]),_:1},8,["value"])]),_:1}),a(w,{shadow:"always",class:"margin-top-10"},{header:e(()=>[ce]),default:e(()=>[a(b,{placeholder:"请粘贴用户1 SDP offer",modelValue:f.value,"onUpdate:modelValue":l[3]||(l[3]=p=>f.value=p),clearable:"",class:"input-with-select"},{append:e(()=>[a(m,{disabled:!f.value,onClick:l[2]||(l[2]=p=>v("createAnswer",f.value))},{default:e(()=>[_("create answer")]),_:1},8,["disabled"])]),_:1},8,["modelValue"]),a(b,{placeholder:"SDP answer",value:r.remoteAnswer,disabled:"",class:"margin-top-10"},{append:e(()=>[a(m,{onClick:l[4]||(l[4]=p=>t(r.remoteAnswer)),disabled:!r.remoteAnswer},{default:e(()=>[_("复制")]),_:1},8,["disabled"])]),_:1},8,["value"])]),_:1}),a(w,{shadow:"always",class:"margin-top-10"},{header:e(()=>[ie]),default:e(()=>[a(b,{placeholder:"请粘贴用户2 SDP answer",modelValue:o.value,"onUpdate:modelValue":l[6]||(l[6]=p=>o.value=p),clearable:"",class:"input-with-select"},{append:e(()=>[a(m,{onClick:l[5]||(l[5]=p=>v("addAnswer",o.value)),disabled:!o.value},{default:e(()=>[_("add answer")]),_:1},8,["disabled"])]),_:1},8,["modelValue"])]),_:1})],64)}}});const pe=B(ue,[["__scopeId","data-v-483e5b80"]]),fe=s("label",{class:"operation-label"},"指令：",-1),_e=E({__name:"console-form",props:{localStream:{type:MediaStream,required:!0},dataChannel:{type:RTCDataChannel,required:!0},peerConnection:{type:RTCPeerConnection,required:!0},btnDiabled:{type:Boolean,required:!0}},setup(n,{expose:v}){const f=n,o=c(""),t=c(""),r=c(!1),l=c(!0),m=h=>{t.value+=`${h}
`},b=()=>{f.dataChannel.send(o.value),m(`发送指令：${o.value}`),o.value=""},w=()=>{f.peerConnection.close()},p=()=>{r.value=!r.value,f.localStream.getAudioTracks().forEach(h=>{h.enabled=r.value})},V=()=>{l.value=!l.value,f.localStream.getVideoTracks().forEach(h=>{h.enabled=l.value})};return v({writeInfo:m}),(h,C)=>{const k=T,d=A,u=z,g=I;return x(),ae(g,{class:"box-card"},{default:e(()=>[fe,a(k,{modelValue:o.value,"onUpdate:modelValue":C[0]||(C[0]=i=>o.value=i),style:{width:"200px","margin-right":"20px"},placeholder:"要发送的指令",clearable:"",disabled:n.btnDiabled,onKeyup:te(b,["enter"])},null,8,["modelValue","disabled","onKeyup"]),a(d,{type:"primary",onClick:b,disabled:n.btnDiabled},{default:e(()=>[_("发送指令")]),_:1},8,["disabled"]),a(d,{type:r.value?"warning":"primary",onClick:p,disabled:n.btnDiabled},{default:e(()=>[_($(r.value?"关闭":"打开")+"麦克风 ",1)]),_:1},8,["type","disabled"]),a(d,{type:l.value?"warning":"primary",onClick:V,disabled:n.btnDiabled},{default:e(()=>[_($(l.value?"关闭":"打开")+"视频",1)]),_:1},8,["type","disabled"]),a(d,{type:"danger",onClick:w,disabled:n.btnDiabled},{default:e(()=>[_("关闭通信")]),_:1},8,["disabled"]),a(u,{placement:"bottom",title:"指令面板",width:500,trigger:"click"},{reference:e(()=>[a(d,{disabled:n.btnDiabled},{default:e(()=>[_("打开对话框")]),_:1},8,["disabled"])]),default:e(()=>[a(k,{modelValue:t.value,"onUpdate:modelValue":C[1]||(C[1]=i=>t.value=i),readonly:"",placeholder:"Please input",rows:6,"show-word-limit":"",type:"textarea"},null,8,["modelValue"])]),_:1})]),_:1})}}}),F=n=>(N("data-v-b62b6929"),n=n(),q(),n),me=F(()=>s("h2",{class:"p2p-subtitle margin-bottom-10"},"本地摄像头",-1)),ve=F(()=>s("h2",{class:"p2p-subtitle margin-bottom-10"},"用户2摄像头",-1)),be=E({__name:"index",setup(n){const v=c(),f=c(),o=c(new MediaStream),t=c(new RTCPeerConnection({iceServers:[{urls:"stun:172.16.40.202:3478"}]})),r=c(t.value.createDataChannel("message")),l=c(),m=c(""),b=c(""),w=c(!1),p=c(!0),V=async()=>{const d=v.value,u=f.value;o.value=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0}),d.srcObject=o.value,o.value.getTracks().forEach(i=>{t.value.addTrack(i,o.value)}),o.value.getAudioTracks().forEach(i=>{i.enabled=!0}),t.value.ondatachannel=function(i){P.success("建立连接"),p.value=!1;const y=i.channel;y.onopen=function(){y.send("建立连接!")},y.onmessage=D=>{var S;console.log(D.data),(S=l.value)==null||S.writeInfo(`接收到的指令：${D.data}`)}};const g=new MediaStream;t.value.ontrack=i=>{i.streams[0].getTracks().forEach(y=>{g.addTrack(y)}),u.srcObject=g}},h=async()=>{const d=await t.value.createOffer();await t.value.setLocalDescription(d),t.value.onicecandidate=async u=>{u.candidate&&(m.value=JSON.stringify(t.value.localDescription))}},C=async d=>{if(!d)return;const u=JSON.parse(d);t.value.onicecandidate=async i=>{if(i.candidate){const y=JSON.stringify(t.value.localDescription);b.value=y}},await t.value.setRemoteDescription(u);const g=await t.value.createAnswer();await t.value.setLocalDescription(g)},k=async d=>{if(!d)return;const u=JSON.parse(d);t.value.currentRemoteDescription||t.value.setRemoteDescription(u)};return le(()=>{V()}),(d,u)=>{const g=H,i=A,y=Q,D=W,S=G,J=X,L=Y,j=Z,K=ee;return x(),M(U,null,[a(j,{class:"p2p-main"},{default:e(()=>[a(y,{class:"p2p-header"},{default:e(()=>[a(g,{type:"warning",size:"large"},{default:e(()=>[_("Webrtc-P2P通话")]),_:1}),a(i,{onClick:u[0]||(u[0]=R=>w.value=!0),type:"primary"},{default:e(()=>[_("打开操作面板")]),_:1})]),_:1}),a(J,null,{default:e(()=>[a(S,null,{default:e(()=>[a(D,{span:12,class:"p2p-video"},{default:e(()=>[me,s("video",{class:"p2p-video__dom",ref_key:"localRef",ref:v,autoplay:"",playsinline:"",muted:""},null,512)]),_:1}),a(D,{span:12,class:"p2p-video"},{default:e(()=>[ve,s("video",{class:"p2p-video__dom",ref_key:"remoteRef",ref:f,autoplay:"",playsinline:""},null,512)]),_:1})]),_:1})]),_:1}),a(L,null,{default:e(()=>[a(_e,{localStream:o.value,peerConnection:t.value,dataChannel:r.value,btnDiabled:p.value,ref_key:"consoleRef",ref:l},null,8,["localStream","peerConnection","dataChannel","btnDiabled"])]),_:1})]),_:1}),a(K,{modelValue:w.value,"onUpdate:modelValue":u[1]||(u[1]=R=>w.value=R),title:"本地操作区域-打开2个tab页"},{default:e(()=>[a(pe,{localOffer:m.value,remoteAnswer:b.value,onCreateOffer:h,onCreateAnswer:C,onAddAnswer:k},null,8,["localOffer","remoteAnswer"])]),_:1},8,["modelValue"])],64)}}});const ge=B(be,[["__scopeId","data-v-b62b6929"]]);export{ge as default};
