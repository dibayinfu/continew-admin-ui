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
        @click="openAlert(item.id)"
      >
        <div class="alarm-title">
          <b>{{ item.type }}</b>
          <span>{{ item.triggerTime }}</span>
        </div>
        <p>{{ item.boxName }}：{{ item.content }}</p>
        <div class="alarm-action">
          <a-link v-if="item.type === '满溢告警'" status="warning" @click.stop="openCreate">快速创建</a-link>
          <a-link status="warning" @click.stop="markPending(item.id)">标待处理</a-link>
          <a-link status="success" @click.stop="markProcessed(item.id)">标已处理</a-link>
        </div>
      </div>
    </div>
    <a-list :loading="loading">
      <template #header>通知</template>
      <a-list-item v-for="item in messageList" :key="item.id">
        <div class="content-wrapper" @click="open(item.path)">
          <div class="content">{{ item.title }}</div>
          <div class="date">{{ item.createTime }}</div>
        </div>
      </a-list-item>
      <template #footer>
        <a class="more-btn" @click="open()">查看更多
          <icon-right />
        </a>
        <a class="read-all-btn" @click="readAll">全部已读</a>
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { type MessageResp, listMessage, readAllMessage } from '@/apis'
import router from '@/router'
import { sanitationAlarms } from '@/views/sanitation/data/alert-task'

const emit = defineEmits<{
  (e: 'readall-success'): void
}>()

const queryParam = reactive({
  isRead: false,
  sort: ['createTime,desc'],
  page: 1,
  size: 5,
})

const messageList = ref<MessageResp[]>()
const loading = ref(false)
const alertMessages = computed(() => sanitationAlarms.filter((item) => item.readStatus === '未读' || item.handleStatus === '待处理').slice(0, 3))
// 查询消息数据
const getMessageData = async () => {
  try {
    loading.value = true
    const { data } = await listMessage(queryParam)
    messageList.value = data.list
  } finally {
    loading.value = false
  }
}

// 打开消息中心
const open = (path?: string) => {
  if (path) {
    router.push(path)
    return
  }
  router.push({ path: '/user/message', query: { tab: 'msg' } })
}

const openAlert = (alarmId: string) => {
  const alarm = sanitationAlarms.find((item) => item.id === alarmId)
  if (alarm && alarm.readStatus === '未读') alarm.readStatus = '已读'
  router.push('/sanitation/alarmCenter')
}

const openCreate = () => {
  router.push('/sanitation/workOrderCreate')
}

const markPending = (alarmId: string) => {
  const alarm = sanitationAlarms.find((item) => item.id === alarmId)
  if (!alarm) return
  alarm.handleStatus = '待处理'
  if (alarm.readStatus === '未读') alarm.readStatus = '已读'
  alarm.offlineRemark = '已在顶部消息中手动标记为待处理。'
}

const markProcessed = (alarmId: string) => {
  const alarm = sanitationAlarms.find((item) => item.id === alarmId)
  if (!alarm) return
  alarm.handleStatus = '已处理'
  if (alarm.readStatus === '未读') alarm.readStatus = '已读'
  alarm.offlineRemark = '已在顶部消息中手动标记为已处理。'
}

// 全部已读
const readAll = async () => {
  await readAllMessage()
  sanitationAlarms.forEach((item) => {
    if (item.readStatus === '未读') item.readStatus = '已读'
  })
  await getMessageData()
  emit('readall-success')
}

onMounted(() => {
  getMessageData()
})
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
  .alarm-action {
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

  .content-wrapper {
    padding: 10px;
    border-radius: var(--border-radius-medium);
    cursor: pointer;
    .content {
      font-size: 12px;
      height: 20px;
      max-width: 265px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 265px;
    }
    .date {
      color: var(--color-text-4);
      font-size: 12px;
      margin-top: 4px;
    }

    &:hover {
      background-color: var(--color-bg-4);
      color: rgb(var(--arcoblue-6));
    }
  }

  :deep(.arco-list) {
    border-radius: var(--border-radius-medium);
    .arco-list-header {
      font-size: 13px;
      padding: 9px 12px;
    }

    .arco-list-content {
      max-height: 184px;
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--color-text-4);
        border-radius: 3px;

        &:hover {
          background-color: var(--color-text-3);
        }
      }

      .arco-list-item {
        padding: 6px;
      }
    }

    .arco-list-footer {
      font-size: 12px;
      color: rgb(var(--arcoblue-6));
      padding: 9px 12px;
      display: flex;

      .more-btn {
        margin-right: auto;
      }
    }
  }
}
</style>
