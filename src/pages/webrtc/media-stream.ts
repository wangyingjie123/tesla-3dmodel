// 获取支持的媒体类型
export function getSupportedMimeTypes() {
  const media = 'video';
  // 常用的视频格式
  const types = ['webm', 'mp4', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'ts', 'x-matroska'];
  // 常用的视频编码
  const codecs = ['vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1', 'h265', 'h264'];
  // 支持的媒体类型
  const supported: string[] = [];
  const isSupported = MediaRecorder.isTypeSupported;
  // 遍历判断所有的媒体类型
  types.forEach((type: string) => {
    const mimeType = `${media}/${type}`;
    codecs.forEach((codec: string) =>
      [`${mimeType};codecs=${codec}`, `${mimeType};codecs=${codec.toUpperCase()}`].forEach((variation) => {
        if (isSupported(variation)) supported.push(variation);
      })
    );
    if (isSupported(mimeType)) supported.push(mimeType);
  });
  return supported;
}
// 录制媒体流
interface RecordProps {
  stream: MediaStream;
  onstop: () => void;
}
export function startRecord({ stream, onstop }: RecordProps) {
  const options = {
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000,
    mimeType: 'video/webm; codecs="vp8,opus"',
  };
  const mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.start();

  mediaRecorder.ondataavailable = (e) => {
    // 将录制的数据合并成一个 Blob 对象
    const blob = new Blob([e.data], { type: e.data.type });
    // 🌸重点是这个地方，我们不要把获取到的 e.data.type设置成 blob 的 type，而是直接改成 mp4
    // const blob = new Blob([e.data], { type: 'video/mp4' });
    downloadBlob(blob);
  };
  mediaRecorder.onstop = (e: Event) => {
    // 停止录制
    console.log(`停止录制 ${e.type}`);
    onstop();
  };
  return mediaRecorder;
}

// 下载 Blob
function downloadBlob(blob: Blob) {
  // 将 Blob 对象转换成一个 URL 地址
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  // 设置 a 标签的 href 属性为刚刚生成的 URL 地址
  a.href = url;
  // 设置 a 标签的 download 属性为文件名
  a.download = `${new Date().getTime()}.${blob.type.split('/')[1]}`;
  // 模拟点击 a 标签
  a.click();
  // 释放 URL 地址
  URL.revokeObjectURL(url);
}
