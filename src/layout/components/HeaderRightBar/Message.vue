<template>
  <div class="message">
    <div class="alarm-block">
      <div class="alarm-header">
        <span>环卫告警</span>
        <a-tag color="red" size="small">{{ alertMessages.length }} 条</a-tag>
      </div>
      <div
        v-for="item in alertMessages"
        :key="item.id"
        class="alarm-item"
        @click="openAlert"
      >
        <div class="alarm-title">
          <b>{{ item.type }}</b>
          <span>{{ item.triggerTime }}</span>
        </div>
        <p>{{ item.boxName }}：{{ item.content }}</p>
        <div class="alarm-action">
          <a-link v-if="item.type === '满溢告警'" status="warning" @click.stop="openCreate">快速创建</a-link>
        </div>
      </div>
    </div>
    <div class="alarm-footer">
      <a class="more-btn" @click="open">查看更多 <icon-right /></a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import router from '@/router'
import { sanitationAlarms } from '@/views/sanitation/data/alert-task'

// 弹层仅展示当前待关注告警中发生时间最新的 5 条，避免通栏浮层过长。
const alertMessages = computed(() => [...sanitationAlarms]
  .filter((item) => item.readStatus === '未读' || item.handleStatus === '待处理')
  .sort((a, b) => new Date(b.triggerTime).getTime() - new Date(a.triggerTime).getTime())
  .slice(0, 5))

// 打开消息中心
const open = () => {
  router.push('/sanitation/workOrderCreate')
}

const openAlert = () => {
  router.push('/sanitation/alarmCenter')
}

const openCreate = () => {
  router.push('/sanitation/workOrderCreate')
}

</script>

<style scoped lang="scss">
.message {
  height: auto;
  max-height: calc(100% - 51px);
  width: 300px;

  .alarm-block {
    padding: 10px;
    border-bottom: 1px solid var(--color-border-2);
  }

  .alarm-header,
  .alarm-title,
  .alarm-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .alarm-header {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
  }

  .alarm-item {
    padding: 10px;
    background: rgba(var(--red-1), 0.55);
    border-radius: var(--border-radius-medium);
    cursor: pointer;

    & + .alarm-item {
      margin-top: 8px;
    }

    p {
      margin: 6px 0;
      color: var(--color-text-2);
      font-size: 12px;
      line-height: 1.5;
    }
  }

  .alarm-title {
    b {
      color: rgb(var(--red-6));
      font-size: 13px;
    }

    span {
      color: var(--color-text-4);
      font-size: 12px;
    }
  }

  .alarm-footer {
    padding: 9px 12px;
    border-top: 1px solid var(--color-border-2);
    color: rgb(var(--arcoblue-6));
    font-size: 12px;

    .more-btn {
      margin-right: auto;
    }
  }
}
</style>
