<template>
  <div class="inner">
    <el-skeleton animated :loading="loading" />
    <el-skeleton style="--el-skeleton-circle-size: 100px" animated :loading="loading">
      <template #template>
        <el-skeleton-item variant="circle" />
      </template>
    </el-skeleton>
    <el-calendar v-if="!loading" v-model="date" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
// import { audioprocess } from '@/utils/audioprocess';

const date = ref(new Date());
const loading = ref(true);
onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 2000);
});
</script>
