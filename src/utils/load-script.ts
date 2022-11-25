// promise版
export const loadScript = (url: string, attrs?: Record<string, any>) => {
  return new Promise((resolve) => {
    if (!url) {
      return resolve('empty');
    }
    const oHead = document.getElementsByTagName('head')[0];
    const oScript = document.createElement('script');
    oScript.type = 'text/javascript';
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        oScript.setAttribute(key, attrs[key]);
      });
    }
    oScript.onload = oScript.onerror = function (e) {
      resolve(e);
      this.onload = null;
      this.onerror = null;
      // setTimeout(function () {
      //     oScript.parentNode.removeChild(oScript);
      // }, 100);
    };
    oScript.src = url;
    oHead.appendChild(oScript);
  });
};
