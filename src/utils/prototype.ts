import type { UserInfo } from '@/apis'

export const isPrototypeMode = import.meta.env.VITE_PROTOTYPE_MODE === 'true'

export const prototypeHomePath = import.meta.env.VITE_PROTOTYPE_HOME || '/sanitation/command-center'

export const prototypeToken = 'prototype-token'

export const prototypeUserInfo: UserInfo = {
  id: 'prototype-admin',
  username: 'prototype',
  nickname: '智慧环卫演示账号',
  gender: 1,
  email: 'prototype@longan.local',
  phone: '13800000000',
  avatar: '',
  pwdResetTime: '2026-06-04 00:00:00',
  pwdExpired: false,
  registrationDate: '2026-06-04',
  deptName: '龙安区智慧环卫运营中心',
  roles: ['admin', 'sanitation-admin'],
  roleNames: ['超级管理员', '智慧环卫运营主管'],
  permissions: ['*'],
}
