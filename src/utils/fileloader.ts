// 根据video元素获取图片二进制数据
export const getCanvasImgDataByVideo = (video: HTMLVideoElement, width = 0, height = 0) => {
  if (video && width && height) {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height) as ImageData;
    return imageData;
  }
  return null;
};

// ImageData对象转DataURL
export const imageDataToDataURL = (imageData: ImageData) => {
  if (!imageData) {
    return null;
  }
  const { width, height } = imageData;
  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(imageData, 0, 0, 0, 0, width, height);
  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl;
};
