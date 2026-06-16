import type { RouteRecordRaw } from 'vue-router'
import { isPrototypeMode, prototypeHomePath } from '@/utils/prototype'

/** 默认布局 */
const Layout = () => import('@/layout/index.vue')

/** 系统路由 */
export const systemRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Layout,
    redirect: '/sanitation/command-center',
    meta: { title: '仪表盘', icon: 'dashboard', hidden: false },
    children: [
      {
        path: '/dashboard/workplace',
        name: 'Workplace',
        component: () => import('@/views/dashboard/workplace/index.vue'),
        meta: { title: '工作台', icon: 'desktop', hidden: false, affix: true },
      },
      {
        path: '/dashboard/analysis',
        name: 'Analysis',
        component: () => import('@/views/dashboard/analysis/index.vue'),
        meta: { title: '分析页', icon: 'insert-chart', hidden: false },
      },
    ],
  },
  {
    path: '/social/callback',
    component: () => import('@/views/login/social/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/pwdExpired',
    component: () => import('@/views/login/pwdExpired/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/user',
    name: 'User',
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: '/user/profile',
        name: 'UserProfile',
        component: () => import('@/views/user/profile/index.vue'),
        meta: { title: '个人中心', showInTabs: false },
      },
      {
        path: '/user/message',
        name: 'UserMessage',
        component: () => import('@/views/user/message/index.vue'),
        meta: { title: '消息中心', showInTabs: false },
      },
      {
        path: '/user/notice',
        name: 'UserNotice',
        component: () => import('@/views/user/message/components/view/index.vue'),
        meta: { title: '查看公告' },
      },
    ],
  },
  {
    path: '/about',
    name: 'About',
    component: Layout,
    meta: { title: '关于项目', icon: 'apps', hidden: false, sort: 999 },
    redirect: '/about/document/api',
    children: [
      {
        path: '/about/document/api',
        component: () => import('@/views/about/document/api/index.vue'),
        meta: { title: '接口文档', icon: 'swagger', hidden: false, keepAlive: true },
      },
      {
        path: '/about/document/changelog',
        component: () => import('@/views/about/document/changelog/index.vue'),
        meta: { title: '更新日志', icon: 'continew', hidden: false, keepAlive: true },
      },
      {
        path: 'https://arco.design/vue/component/button',
        meta: { title: 'Arco Design文档', icon: 'arco', hidden: false },
      },
      {
        path: '/about/source',
        name: 'AboutSource',
        meta: { title: '开源地址', icon: 'github', hidden: false },
        children: [
          {
            path: 'https://gitee.com/continew/continew-admin',
            meta: { title: 'Gitee', icon: 'gitee', hidden: false },
          },
          {
            path: 'https://gitcode.com/continew/continew-admin',
            meta: { title: 'GitCode', icon: 'gitcode', hidden: false },
          },
          {
            path: 'https://github.com/continew-org/continew-admin',
            meta: { title: 'GitHub', icon: 'github', hidden: false },
          },
        ],
      },
    ],
  },
  {
    path: '/sanitation',
    name: 'Sanitation',
    component: Layout,
    redirect: '/sanitation/overview',
    meta: { title: '智慧环卫', icon: 'dashboard', hidden: false, sort: 12 },
    children: [
      // ===== 数字大屏指挥中心 =====
      {
        path: '/sanitation/command-center',
        name: 'SanitationCommandCenter',
        component: () => import('@/views/sanitation/command-center.vue'),
        meta: { title: '数字大屏指挥中心', icon: 'dashboard', hidden: false },
      },

      // ===== 基础档案（子菜单） =====
      {
        path: '/sanitation/archives',
        name: 'SanitationArchives',
        redirect: '/sanitation/townArchive',
        meta: { title: '基础档案', icon: 'file', hidden: false },
        children: [
          { path: '/sanitation/townArchive', name: 'SanitationTownArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'townArchive' }, meta: { title: '乡镇档案', icon: 'file', hidden: false } },
          { path: '/sanitation/villageArchive', name: 'SanitationVillageArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'villageArchive' }, meta: { title: '村庄档案', icon: 'file', hidden: false } },
          { path: '/sanitation/collectionPoint', name: 'SanitationCollectionPoint', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'collectionPoint' }, meta: { title: '收集点档案', icon: 'file', hidden: false } },
          { path: '/sanitation/vehicleArchive', name: 'SanitationVehicleArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'vehicleArchive' }, meta: { title: '车辆档案', icon: 'file', hidden: false } },
          { path: '/sanitation/peopleArchive', name: 'SanitationPeopleArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'peopleArchive' }, meta: { title: '人员档案', icon: 'file', hidden: false } },
          { path: '/sanitation/stationArchive', name: 'SanitationStationArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'stationArchive' }, meta: { title: '中转站档案', icon: 'file', hidden: false } },
          { path: '/sanitation/plantArchive', name: 'SanitationPlantArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'plantArchive' }, meta: { title: '焚烧厂档案', icon: 'file', hidden: false } },
          { path: '/sanitation/smallBoxArchive', name: 'SanitationSmallBoxArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'smallBoxArchive' }, meta: { title: '小勾臂箱档案', icon: 'file', hidden: false } },
          { path: '/sanitation/largeBoxArchive', name: 'SanitationLargeBoxArchive', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'largeBoxArchive' }, meta: { title: '大勾臂箱档案', icon: 'file', hidden: false } },
        ],
      },

      // ===== 箱体垃圾监控（子菜单） =====
      {
        path: '/sanitation/box-supervision',
        name: 'SanitationBoxSupervision',
        redirect: '/sanitation/smallBoxState',
        meta: { title: '箱体监控', icon: 'storage', hidden: false },
        children: [
          { path: '/sanitation/smallBoxState', name: 'SanitationSmallBoxState', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'smallBoxState' }, meta: { title: '小勾臂箱监控', icon: 'file', hidden: false } },
          { path: '/sanitation/bigBoxState', name: 'SanitationBigBoxState', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'bigBoxState' }, meta: { title: '大勾臂箱监控', icon: 'file', hidden: false } },
          { path: '/sanitation/overflowRule', name: 'SanitationOverflowRule', component: () => import('@/views/sanitation/alert-rule.vue'), props: { pageKey: 'overflowRule' }, meta: { title: '监控告警规则', icon: 'file', hidden: false } },
        ],
      },

      // ===== 收运任务单（子菜单） =====
      {
        path: '/sanitation/work-orders',
        name: 'SanitationWorkOrders',
        redirect: '/sanitation/workOrderCreate',
        meta: { title: '收运任务单', icon: 'schedule', hidden: false },
        children: [
          { path: '/sanitation/workOrderCreate', name: 'SanitationWorkOrderCreate', component: () => import('@/views/sanitation/alarm-center.vue'), meta: { title: '告警建任务单', icon: 'file', hidden: false } },
          { path: '/sanitation/workOrderMonitor', name: 'SanitationWorkOrderMonitor', component: () => import('@/views/sanitation/task-monitor.vue'), meta: { title: '收运单监控', icon: 'file', hidden: false } },
          { path: '/sanitation/workOrderStats', name: 'SanitationWorkOrderStats', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'taskOrderStats' }, meta: { title: '全部任务单', icon: 'file', hidden: false } },
        ],
      },

      // ===== APP端（子菜单） =====
      {
        path: '/sanitation/apps',
        name: 'SanitationApps',
        redirect: '/sanitation/app',
        meta: { title: 'APP端', icon: 'mobile', hidden: false },
        children: [
          { path: '/sanitation/app-home', name: 'SanitationAppHome', component: () => import('@/views/sanitation/app-home.vue'), meta: { title: '功能入口', icon: 'file', hidden: false } },
          { path: '/sanitation/app-driver', name: 'SanitationAppDriver', component: () => import('@/views/sanitation/app-driver.vue'), meta: { title: '驾驶员端', icon: 'file', hidden: false } },
          { path: '/sanitation/app-dispatcher', name: 'SanitationAppDispatcher', component: () => import('@/views/sanitation/app-dispatcher.vue'), meta: { title: '调度员端', icon: 'file', hidden: false } },
          { path: '/sanitation/app-admin', name: 'SanitationAppAdmin', component: () => import('@/views/sanitation/app-admin.vue'), meta: { title: '管理员端', icon: 'file', hidden: false } },
          { path: '/sanitation/app', name: 'SanitationApp', component: () => import('@/views/sanitation/mobile.vue'), props: { type: 'app' }, meta: { title: 'APP端原型', icon: 'file', hidden: true } },
          { path: '/sanitation/mini-program', name: 'SanitationMiniProgram', component: () => import('@/views/sanitation/mobile.vue'), props: { type: 'mini' }, meta: { title: '小程序端原型', icon: 'apps', hidden: true } },
        ],
      },

      // ===== 7月份阶段（子菜单） =====
      {
        path: '/sanitation/july-phase',
        name: 'SanitationJulyPhase',
        redirect: '/sanitation/overview',
        meta: { title: '7月份阶段', icon: 'calendar', hidden: false },
        children: [
          { path: '/sanitation/overview', name: 'SanitationOverview', component: () => import('@/views/sanitation/index.vue'), meta: { title: '运营概览', icon: 'desktop', hidden: false } },
          { path: '/sanitation/map', name: 'SanitationMap', component: () => import('@/views/sanitation/map.vue'), meta: { title: '全域地图监管', icon: 'location', hidden: false } },
        ],
      },

      // ===== 其它原型（子菜单） =====
      {
        path: '/sanitation/other-prototypes',
        name: 'SanitationOtherPrototypes',
        redirect: '/sanitation/overview',
        meta: { title: '其它原型', icon: 'folder', hidden: false },
        children: [
          // ===== 主动安全（子菜单） =====
          {
            path: '/sanitation/safety',
            name: 'SanitationSafety',
            redirect: '/sanitation/safetyAlarm',
            meta: { title: '主动安全', icon: 'safe', hidden: false },
            children: [
              { path: '/sanitation/safetyAlarm', name: 'SanitationSafetyAlarm', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'safetyAlarm' }, meta: { title: '告警列表', icon: 'file', hidden: false } },
              { path: '/sanitation/safetyDetail', name: 'SanitationSafetyDetail', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'safetyDetail' }, meta: { title: '告警详情', icon: 'file', hidden: false } },
              { path: '/sanitation/safetyStats', name: 'SanitationSafetyStats', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'safetyStats' }, meta: { title: '安全统计', icon: 'file', hidden: false } },
            ],
          },
          // ===== 称重管理（子菜单） =====
          {
            path: '/sanitation/weighing',
            name: 'SanitationWeighing',
            redirect: '/sanitation/weighing',
            meta: { title: '称重管理', icon: 'weigh', hidden: false },
            children: [
              { path: '/sanitation/weighing', name: 'SanitationWeighingDetail', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'weighing' }, meta: { title: '称重明细', icon: 'file', hidden: false } },
              { path: '/sanitation/weightTrend', name: 'SanitationWeightTrend', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'weightTrend' }, meta: { title: '单车趋势', icon: 'file', hidden: false } },
              { path: '/sanitation/wasteStats', name: 'SanitationWasteStats', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'wasteStats' }, meta: { title: '垃圾量统计', icon: 'file', hidden: false } },
            ],
          },
          // ===== 中转站监管（子菜单） =====
          {
            path: '/sanitation/station-supervision',
            name: 'SanitationStationSupervision',
            redirect: '/sanitation/stationMap',
            meta: { title: '中转站监管', icon: 'building', hidden: false },
            children: [
              { path: '/sanitation/stationMap', name: 'SanitationStationMap', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'stationMap' }, meta: { title: '中转站地图', icon: 'file', hidden: false } },
              { path: '/sanitation/stationDetail', name: 'SanitationStationDetail', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'stationDetail' }, meta: { title: '中转站详情', icon: 'file', hidden: false } },
              { path: '/sanitation/stationLedger', name: 'SanitationStationLedger', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'stationLedger' }, meta: { title: '中转站台账', icon: 'file', hidden: false } },
            ],
          },
          // ===== 告警与消息（子菜单） =====
          {
            path: '/sanitation/alerts',
            name: 'SanitationAlerts',
            redirect: '/sanitation/alarmCenter',
            meta: { title: '告警与消息', icon: 'notification', hidden: false },
            children: [
              { path: '/sanitation/alarmCenter', name: 'SanitationAlarmCenter', component: () => import('@/views/sanitation/alarm-center.vue'), meta: { title: '告警中心', icon: 'notification', hidden: false } },
              { path: '/sanitation/alarmHandle', name: 'SanitationAlarmHandle', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'alarmHandle' }, meta: { title: '告警处理', icon: 'file', hidden: false } },
            ],
          },
          // ===== 作业计划与监管（子菜单） =====
          {
            path: '/sanitation/operations',
            name: 'SanitationOperations',
            redirect: '/sanitation/routeManage',
            meta: { title: '作业计划与监管', icon: 'schedule', hidden: false },
            children: [
              { path: '/sanitation/routeManage', name: 'SanitationRouteManage', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'routeManage' }, meta: { title: '线路管理', icon: 'file', hidden: false } },
              { path: '/sanitation/taskManage', name: 'SanitationTaskManage', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'taskManage' }, meta: { title: '作业任务', icon: 'file', hidden: false } },
              { path: '/sanitation/coverage', name: 'SanitationCoverage', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'coverage' }, meta: { title: '覆盖率分析', icon: 'file', hidden: false } },
              { path: '/sanitation/missed', name: 'SanitationMissed', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'missed' }, meta: { title: '疑似漏收', icon: 'file', hidden: false } },
            ],
          },
          // ===== 地磅对接与对账（子菜单） =====
          {
            path: '/sanitation/scale',
            name: 'SanitationScale',
            redirect: '/sanitation/scaleConfig',
            meta: { title: '地磅对接与对账', icon: 'weigh', hidden: false },
            children: [
              { path: '/sanitation/scaleConfig', name: 'SanitationScaleConfig', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'scaleConfig' }, meta: { title: '地磅接口配置', icon: 'file', hidden: false } },
              { path: '/sanitation/scaleData', name: 'SanitationScaleData', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'scaleData' }, meta: { title: '地磅数据采集', icon: 'file', hidden: false } },
              { path: '/sanitation/reconcile', name: 'SanitationReconcile', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'reconcile' }, meta: { title: '数据对账', icon: 'file', hidden: false } },
            ],
          },
          // ===== 统计报表与考核（子菜单） =====
          {
            path: '/sanitation/reports',
            name: 'SanitationReports',
            redirect: '/sanitation/dailyReport',
            meta: { title: '统计报表与考核', icon: 'bar-chart', hidden: false },
            children: [
              { path: '/sanitation/dailyReport', name: 'SanitationDailyReport', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'dailyReport' }, meta: { title: '运营日报', icon: 'file', hidden: false } },
              { path: '/sanitation/vehicleReport', name: 'SanitationVehicleReport', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'vehicleReport' }, meta: { title: '车辆报表', icon: 'file', hidden: false } },
              { path: '/sanitation/townWasteReport', name: 'SanitationTownWasteReport', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'townWasteReport' }, meta: { title: '乡镇垃圾量报表', icon: 'file', hidden: false } },
              { path: '/sanitation/assessment', name: 'SanitationAssessment', component: () => import('@/views/sanitation/prototype.vue'), props: { pageKey: 'assessment' }, meta: { title: '考核评价', icon: 'file', hidden: false } },
            ],
          },
          // ===== 二期新增功能（子菜单） =====
          {
            path: '/sanitation/phase2',
            name: 'SanitationPhase2',
            redirect: '/sanitation/overflow-alert',
            meta: { title: '二期新增功能', icon: 'star', hidden: false },
            children: [
              { path: '/sanitation/overflow-alert', name: 'SanitationOverflowAlert', component: () => import('@/views/sanitation/overflow-alert.vue'), meta: { title: '满溢预警与清运提醒', icon: 'file', hidden: false } },
              { path: '/sanitation/dispatch-center', name: 'SanitationDispatchCenter', component: () => import('@/views/sanitation/dispatch-center.vue'), meta: { title: '任务派发中心', icon: 'file', hidden: false } },
              { path: '/sanitation/box-remote-control', name: 'SanitationBoxRemoteControl', component: () => import('@/views/sanitation/box-remote-control.vue'), meta: { title: '小勾臂箱远程控制', icon: 'file', hidden: false } },
              { path: '/sanitation/report-enhanced', name: 'SanitationReportEnhanced', component: () => import('@/views/sanitation/report-enhanced.vue'), meta: { title: '统计报表增强', icon: 'file', hidden: false } },
              { path: '/sanitation/command-center-enhanced', name: 'SanitationCommandCenterEnhanced', component: () => import('@/views/sanitation/command-center-enhanced.vue'), meta: { title: '大屏优化版', icon: 'file', hidden: false } },
            ],
          },
          // ===== 三期新增功能（子菜单） =====
          {
            path: '/sanitation/phase3',
            name: 'SanitationPhase3',
            redirect: '/sanitation/waste-multi-analysis',
            meta: { title: '三期新增功能', icon: 'star', hidden: false },
            children: [
              { path: '/sanitation/waste-multi-analysis', name: 'SanitationWasteMultiAnalysis', component: () => import('@/views/sanitation/waste-multi-analysis.vue'), meta: { title: '垃圾量多维分析', icon: 'file', hidden: false } },
              { path: '/sanitation/scale-reconcile-center', name: 'SanitationScaleReconcileCenter', component: () => import('@/views/sanitation/scale-reconcile-center.vue'), meta: { title: '地磅对账中心', icon: 'file', hidden: false } },
              { path: '/sanitation/assessment-system', name: 'SanitationAssessmentSystem', component: () => import('@/views/sanitation/assessment-system.vue'), meta: { title: '考核评价体系', icon: 'file', hidden: false } },
              { path: '/sanitation/construction-waste', name: 'SanitationConstructionWaste', component: () => import('@/views/sanitation/construction-waste.vue'), meta: { title: '建筑垃圾识别', icon: 'file', hidden: false } },
              { path: '/sanitation/device-health', name: 'SanitationDeviceHealth', component: () => import('@/views/sanitation/device-health.vue'), meta: { title: '设备健康管理', icon: 'file', hidden: false } },
            ],
          },
          // ===== 持续迭代（子菜单） =====
          {
            path: '/sanitation/continuous',
            name: 'SanitationContinuous',
            redirect: '/sanitation/route-optimization',
            meta: { title: '持续迭代', icon: 'star', hidden: false },
            children: [
              { path: '/sanitation/route-optimization', name: 'SanitationRouteOptimization', component: () => import('@/views/sanitation/route-optimization.vue'), meta: { title: '线路优化', icon: 'file', hidden: false } },
              { path: '/sanitation/waste-prediction', name: 'SanitationWastePrediction', component: () => import('@/views/sanitation/waste-prediction.vue'), meta: { title: '垃圾量预测', icon: 'file', hidden: false } },
              { path: '/sanitation/command-center-advanced', name: 'SanitationCommandCenterAdvanced', component: () => import('@/views/sanitation/command-center-advanced.vue'), meta: { title: '调度大屏增强', icon: 'file', hidden: false } },
              { path: '/sanitation/anomaly-detection', name: 'SanitationAnomalyDetection', component: () => import('@/views/sanitation/anomaly-detection.vue'), meta: { title: '智能异常识别', icon: 'file', hidden: false } },
            ],
          },
        ],
      },
    ],
  },
]

// 固定路由（默认路由）
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/redirect',
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/default/redirect/index.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/default/error/404.vue'),
    meta: { hidden: true },
  },
  {
    path: '/403',
    component: () => import('@/views/default/error/403.vue'),
    meta: { hidden: true },
  },
]
