<template>
  <el-card shadow="always">
    <template #header>
      <div class="card-header">
        <div class="card-header__title">
          <h3>用户1操作区</h3>
          <el-button type="primary" @click="emit('createOffer')">create offer</el-button>
        </div>
        <p class="margin-top-10">点击create offer，生成SDP offer，把下面生成的offer复制给用户2</p>
      </div>
    </template>
    <el-input :value="localOffer" disabled placeholder="点击上方create offer" class="input-with-select">
      <template #append>
        <el-button @click="copyOffer(localOffer)" :disabled="!localOffer">复制</el-button>
      </template>
    </el-input>
  </el-card>
  <el-card shadow="always" class="margin-top-10">
    <template #header>
      <div class="card-header">
        <div class="card-header__title">
          <h3>用户2操作区</h3>
        </div>
        <p class="margin-top-10">
          将上方用户1生成的offer粘贴到下方，点击create answer生成SDP answer，然后将生成的答案复制给下方用户1
        </p>
      </div>
    </template>
    <el-input placeholder="请粘贴用户1 SDP offer" v-model="sdpOffer" clearable class="input-with-select">
      <template #append>
        <el-button :disabled="!sdpOffer" @click="emit('createAnswer', sdpOffer)">create answer</el-button>
      </template>
    </el-input>
    <el-input placeholder="SDP answer" :value="remoteAnswer" disabled class="margin-top-10">
      <template #append>
        <el-button @click="copyOffer(remoteAnswer)" :disabled="!remoteAnswer">复制</el-button>
      </template>
    </el-input>
  </el-card>
  <el-card shadow="always" class="margin-top-10">
    <template #header>
      <div class="card-header">
        <div class="card-header__title">
          <h3>用户1操作区</h3>
        </div>
        <p class="margin-top-10">将用户2生成的SDP answer粘贴到下方，然后点击add answer</p>
      </div>
    </template>
    <el-input placeholder="请粘贴用户2 SDP answer" v-model="remoteAnswerCopy" clearable class="input-with-select">
      <template #append>
        <el-button @click="emit('addAnswer', remoteAnswerCopy)" :disabled="!remoteAnswerCopy">add answer</el-button>
      </template>
    </el-input>
  </el-card>
</template>
<script setup lang="ts">
import { copy } from '@/utils/copy';
import { ref } from 'vue';
const sdpOffer = ref('');
const remoteAnswerCopy = ref('');
defineProps<{ localOffer: string; remoteAnswer: string }>();
const emit = defineEmits<{
  (e: 'createOffer'): void;
  (e: 'createAnswer', localOffer: string): void;
  (e: 'addAnswer', remoteAnswer: string): void;
}>();
const copyOffer = (value: string) => {
  copy(value);
};
</script>
<style scoped lang="scss">
.card {
  &-header {
    &__title {
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>
