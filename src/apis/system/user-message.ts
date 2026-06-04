import type * as T from './type'
import http from '@/utils/http'
import { isPrototypeMode } from '@/utils/prototype'

export type * from './type'

const BASE_URL = '/user/message'

const nowText = () => new Date().toLocaleString('zh-CN', { hour12: false })

const prototypeMessages: T.MessageResp[] = [
  {
    id: 'prototype-msg-1',
    title: '牛家窑2号小勾臂箱满溢，请尽快派单',
    content: '满溢比例达到 91%，建议创建收运任务单。',
    type: 1,
    path: '/sanitation/alarmCenter',
    isRead: false,
    createTime: nowText(),
  },
  {
    id: 'prototype-msg-2',
    title: '马投涧压缩箱C已生成收运任务',
    content: '任务已派发至大勾臂车驾驶员。',
    type: 1,
    path: '/sanitation/workOrderMonitor',
    isRead: false,
    createTime: nowText(),
  },
]

const success = <T>(data: T): ApiRes<T> => ({
  code: 200,
  data,
  msg: 'success',
  success: true,
  timestamp: nowText(),
})

/** @desc 查询未读消息数量 */
export function getUnreadMessageCount() {
  if (isPrototypeMode) {
    return Promise.resolve(success({ total: prototypeMessages.filter((item) => !item.isRead).length }))
  }
  return http.get(`${BASE_URL}/unread`)
}

/** @desc 查询消息列表 */
export function listMessage(query: T.MessagePageQuery) {
  if (isPrototypeMode) {
    return Promise.resolve(success<PageRes<T.MessageResp[]>>({
      list: prototypeMessages.slice(0, query.size || 5),
      total: prototypeMessages.length,
    }))
  }
  return http.get<PageRes<T.MessageResp[]>>(`${BASE_URL}`, query)
}

/** @desc 获取用户消息详情 */
export function getUserMessage(id: number) {
  if (isPrototypeMode) {
    return Promise.resolve(success(prototypeMessages.find((item) => item.id === String(id)) || prototypeMessages[0]))
  }
  return http.get<T.MessageResp>(`${BASE_URL}/${id}`)
}

/** @desc 删除消息 */
export function deleteMessage(ids: Array<string>) {
  if (isPrototypeMode) {
    return Promise.resolve(success(true))
  }
  return http.del(`${BASE_URL}`, { ids })
}

/** @desc 标记已读 */
export function readMessage(ids: Array<string>) {
  if (isPrototypeMode) {
    prototypeMessages.forEach((item) => {
      if (ids.includes(item.id)) item.isRead = true
    })
    return Promise.resolve(success(true))
  }
  return http.patch(`${BASE_URL}/read`, { ids })
}

/** @desc 全部已读 */
export function readAllMessage() {
  if (isPrototypeMode) {
    prototypeMessages.forEach((item) => {
      item.isRead = true
    })
    return Promise.resolve(success(true))
  }
  return http.patch(`${BASE_URL}/readAll`)
}

/** @desc 查询未读公告数量 */
export function getUnreadNoticeCount() {
  if (isPrototypeMode) {
    return Promise.resolve(success({ total: 0 }))
  }
  return http.get(`${BASE_URL}/notice/unread`)
}

/** @desc 查询未读公告 ID 列表 */
export function getUnreadNoticeIds(method: string) {
  if (isPrototypeMode) {
    return Promise.resolve(success<number[]>([]))
  }
  return http.get<number[]>(`${BASE_URL}/notice/unread/${method}`)
}

/** @desc 分页查询用户公告 */
export function listUserNotice(query: T.NoticePageQuery) {
  if (isPrototypeMode) {
    return Promise.resolve(success<PageRes<T.NoticeResp[]>>({ list: [], total: 0 }))
  }
  return http.get<PageRes<T.NoticeResp[]>>(`${BASE_URL}/notice`, query)
}

/** @desc 获取用户公告详情 */
export function getUserNotice(id: number) {
  if (isPrototypeMode) {
    return Promise.resolve(success<T.NoticeResp>({
      id: String(id),
      title: '智慧环卫原型公告',
      type: '1',
      noticeScope: 1,
      isTiming: false,
      isTop: false,
      status: 1,
    }))
  }
  return http.get<T.NoticeResp>(`${BASE_URL}/notice/${id}`)
}
