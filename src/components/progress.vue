<template>
  <Transition>
    <div v-if="!data.loadingComplete" class="progress">
      <el-progress type="dashboard" :percentage="data.percent" :color="colors" :width="200" />
    </div>
  </Transition>
</template>
<script setup>
import { onMounted, reactive } from 'vue';
// import { resourceList } from '@/config';
import Loader from '@/utils/loader';
const props = defineProps({
  resourceList: {
    type: Array,
    required: true,
  },
});
const data = reactive({
  loadingComplete: false,
  percent: 0,
});

const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
];

onMounted(() => {
  const resourceLoader = new Loader();
  resourceLoader.self.setData(props.resourceList);
  resourceLoader.load.start();
  resourceLoader.load.on('loading', function (event) {
    data.percent = 0 + Math.floor((event.nowProgress / event.allProgress) * 100);
  });
  resourceLoader.load.on('complete', function () {
    console.log('load complete');
    data.loadingComplete = true;
  });
});
</script>
<style lang="scss" scoped>
.progress {
  position: absolute;
  z-index: 99;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  :deep(.el-progress__text) {
    --el-text-color-regular: #fff;
  }
}
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
