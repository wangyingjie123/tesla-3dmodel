import { ElMessage } from 'element-plus';
export const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('Page URL copied to clipboard');
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
};
