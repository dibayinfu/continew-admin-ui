<template>
  <a-button v-if="task.collectionStatus === '待接单'" status="danger" :size="size" @click="confirmCancellation">
    取消
  </a-button>
  <a-button
    v-else-if="task.collectionStatus === '已接单' || task.collectionStatus === '收运中'"
    status="danger"
    :size="size"
    @click="confirmForceCompletion"
  >
    强制完成
  </a-button>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { autoCompleteCollectionTask, cancelCollectionTask, type CollectionTask } from '../data/alert-task'

const props = defineProps<{
  task: CollectionTask
  size?: 'mini' | 'medium'
}>()

function confirmCancellation() {
  const task = props.task
  Modal.confirm({
    title: '取消运单',
    content: `确定取消运单「${task.id}」吗？`,
    okText: '确认取消',
    cancelText: '返回',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      if (cancelCollectionTask(task)) {
        Message.success('运单已取消')
      } else {
        Message.warning('仅待接单的运单可以取消')
      }
    },
  })
}

function confirmForceCompletion() {
  const task = props.task
  Modal.confirm({
    title: '强制完成运单',
    content: `确定将运单「${task.id}」设为已完成吗？`,
    okText: '确认完成',
    cancelText: '返回',
    okButtonProps: { status: 'danger' },
    onOk: () => {
      if (task.collectionStatus !== '已接单' && task.collectionStatus !== '收运中') {
        Message.warning('仅已接单或收运中的运单可以强制完成')
        return
      }
      if (autoCompleteCollectionTask(task, 'force')) Message.success('已强制完成')
    },
  })
}
</script>
