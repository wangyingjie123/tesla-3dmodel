export const audioprocess = async () => {
  const audioContext = new AudioContext();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const sourceNode = audioContext.createMediaStreamSource(stream);

    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = async (event) => {
      // 处理回调中拿到输入声音数据
      const inputBuffer = event.inputBuffer;
      // 创建新的输出源
      const outputSource = audioContext.createMediaStreamDestination();
      const audioBuffer = audioContext.createBufferSource();
      audioBuffer.buffer = inputBuffer;
      // 设置声音加粗，慢放0.7倍
      // audioBuffer.playbackRate.value = 0.7;
      audioBuffer.connect(outputSource);
      audioBuffer.start();

      // 返回新的 MediaStream
      const newStream = outputSource.stream;
      const node = audioContext.createMediaStreamSource(newStream);
      // 连接到扬声器播放
      node.connect(audioContext.destination);
    };
    // 添加处理节点
    sourceNode.connect(processor);
    processor.connect(audioContext.destination);
  } catch (err) {
    console.log(err);
  }
};
