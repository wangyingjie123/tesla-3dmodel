// 计算颜色差
export function colorDiff(color1: number[], color2: number[]) {
  const r = color1[0] - color2[0];
  const g = color1[1] - color2[1];
  const b = color1[2] - color2[2];
  return Math.sqrt(r * r + g * g + b * b);
}
interface VirtualVideoProps {
  backgroundImageData: ImageData;
  realVideoImageData: ImageData;
  allowance: number;
  backgroundColor: number[];
  virtualVideoCtx: CanvasRenderingContext2D;
}
// 处理真实视频的图像数据，将其写到虚拟视频的 canvas 中
export function processFrameDrawToVirtualVideo({
  realVideoImageData,
  backgroundImageData,
  backgroundColor,
  allowance,
  virtualVideoCtx,
}: VirtualVideoProps): ImageData {
  // 逐像素计算与要处理的目标颜色的差值，如果差值小于阈值，则将该像素设置为背景图片中的对应像素
  for (let i = 0; i < realVideoImageData.data.length; i += 4) {
    const r = realVideoImageData.data[i];
    const g = realVideoImageData.data[i + 1];
    const b = realVideoImageData.data[i + 2];
    // const a = realVideoImageData.data[i + 3];
    const bgR = backgroundImageData.data[i];
    const bgG = backgroundImageData.data[i + 1];
    const bgB = backgroundImageData.data[i + 2];
    const bgA = backgroundImageData.data[i + 3];

    // 计算与背景色的差值
    const diff = colorDiff([r, g, b], backgroundColor);
    // 当差值小于设定的阈值，则将该像素设置为背景图片中的对应像素
    if (diff < allowance) {
      realVideoImageData.data[i] = bgR;
      realVideoImageData.data[i + 1] = bgG;
      realVideoImageData.data[i + 2] = bgB;
      realVideoImageData.data[i + 3] = bgA;
    }
  }
  virtualVideoCtx.putImageData(realVideoImageData, 0, 0);
  // 将处理后的图像数据写到虚拟视频的 canvas 中
  return realVideoImageData;
}
