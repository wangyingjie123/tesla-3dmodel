<template>
  <h2>这是首页</h2>
  <div v-for="item in routes" :key="item.path" class="margin-left-20">
    <router-link v-if="item.title" :to="item.path">{{ item.title }}</router-link>
  </div>
</template>
<script setup lang="ts">
import { routes } from '@/routes';
</script>
