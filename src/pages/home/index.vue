<template>
  <div class="inner">
    <el-skeleton animated />
    <el-skeleton style="--el-skeleton-circle-size: 100px" animated>
      <template #template>
        <el-skeleton-item variant="circle" />
      </template>
    </el-skeleton>
  </div>
</template>
<script setup lang="ts">
// import Layout from '@/layout/index.vue';
</script>
