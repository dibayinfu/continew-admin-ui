import { type EChartsOption, graphic } from 'echarts'
import { type Ref, computed } from 'vue'

export function useCommandCenterCharts(resolutionMode: Ref<'formal' | 'test'>) {
const townWasteRank = [
  { name: '龙泉镇', value: 186 },
  { name: '马家乡', value: 168 },
  { name: '彰武街道', value: 151 },
  { name: '东风乡', value: 136 },
  { name: '罗庄镇', value: 118 },
  { name: '善应镇', value: 96 },
  { name: '太行街道', value: 84 },
  { name: '文明大道街道', value: 72 },
]

const wasteTrend = [
  { date: '06-19', value: 210 },
  { date: '06-20', value: 238 },
  { date: '06-21', value: 196 },
  { date: '06-22', value: 265 },
  { date: '06-23', value: 228 },
  { date: '06-24', value: 252 },
  { date: '06-25', value: 241 },
]

const driverRank = [
  { name: '张师傅', tasks: 42, rate: 98 },
  { name: '李师傅', tasks: 39, rate: 97 },
  { name: '王师傅', tasks: 36, rate: 96 },
  { name: '赵师傅', tasks: 34, rate: 95 },
  { name: '陈师傅', tasks: 31, rate: 94 },
  { name: '郑师傅', tasks: 28, rate: 93 },
  { name: '孙师傅', tasks: 26, rate: 92 },
]

const ontimeTaskTrend = [
  { date: '06-19', tasks: 188, rate: 94 },
  { date: '06-20', tasks: 205, rate: 96 },
  { date: '06-21', tasks: 176, rate: 93 },
  { date: '06-22', tasks: 232, rate: 98 },
  { date: '06-23', tasks: 218, rate: 95 },
  { date: '06-24', tasks: 246, rate: 99 },
  { date: '06-25', tasks: 226, rate: 96 },
]

const chartTextColor = '#b8d8f2'
const chartGridColor = 'rgba(72, 174, 255, 0.14)'
const axisLabel = {
  color: chartTextColor,
  fontSize: 11,
}
const formalAxisLabel = {
  color: chartTextColor,
  fontSize: 18,
}

function chartFontSize(testSize: number, formalSize: number) {
  return resolutionMode.value === 'formal' ? formalSize : testSize
}

function chartSpace(testSize: number, formalSize: number) {
  return resolutionMode.value === 'formal' ? formalSize : testSize
}

const townWasteChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(12, 22),
    right: chartSpace(52, 170),
    bottom: chartSpace(8, 20),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: '{b}<br/>昨日垃圾量：{c} 吨',
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { ...(resolutionMode.value === 'formal' ? formalAxisLabel : axisLabel) },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: townWasteRank.map((item) => item.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#d7ecff', fontSize: chartFontSize(12, 24), margin: 10, interval: 0 },
  },
  series: [{
    type: 'bar',
    data: townWasteRank.map((item) => item.value),
    barWidth: '48%',
    showBackground: true,
    backgroundStyle: { color: 'rgba(55, 126, 180, 0.14)', borderRadius: 8 },
    itemStyle: {
      borderRadius: [0, 8, 8, 0],
      color: new graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: 'rgba(36, 107, 255, 0.72)' },
        { offset: 0.55, color: '#24d6ff' },
        { offset: 1, color: '#83fff1' },
      ]),
      shadowBlur: 14,
      shadowColor: 'rgba(36, 214, 255, 0.35)',
    },
    label: {
      show: true,
      position: 'right',
      color: '#e5fbff',
      fontSize: chartFontSize(11, 22),
      formatter: '{c} 吨',
    },
  }],
  animation: false,
}))

const wasteTrendChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(22, 38),
    right: chartSpace(28, 70),
    bottom: chartSpace(14, 28),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: '{b}<br/>清运量：{c} 吨',
  },
  xAxis: {
    type: 'category',
    // 给首尾数据点留出半个类目宽度，避免正式分辨率下数值标签与纵轴、右边界相撞。
    boundaryGap: true,
    data: wasteTrend.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(96, 164, 220, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  series: [{
    type: 'line',
    data: wasteTrend.map((item) => item.value),
    smooth: true,
    symbol: 'circle',
    symbolSize: chartFontSize(7, 14),
    lineStyle: {
      width: chartFontSize(3, 6),
      color: '#38f58b',
      shadowBlur: 14,
      shadowColor: 'rgba(56, 245, 139, 0.45)',
    },
    itemStyle: { color: '#eafff2', borderColor: '#38f58b', borderWidth: 2 },
    areaStyle: {
      color: new graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(56, 245, 139, 0.34)' },
        { offset: 1, color: 'rgba(56, 245, 139, 0.02)' },
      ]),
    },
    label: {
      show: true,
      color: '#c8ffd9',
      fontSize: chartFontSize(10, 19),
      formatter: '{c}',
    },
  }],
  animation: false,
}))

const driverRankChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(12, 22),
    right: chartSpace(76, 220),
    bottom: chartSpace(10, 22),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
    formatter: (params: any) => {
      const point = Array.isArray(params) ? params[0] : params
      const item = driverRank[point?.dataIndex ?? 0]
      return `${item.name}<br/>任务量：${item.tasks} 单<br/>准点率：${item.rate}%`
    },
  },
  xAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: chartGridColor } },
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: driverRank.map((item) => item.name),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#d7ecff', fontSize: chartFontSize(12, 24), margin: 10, interval: 0 },
  },
  series: [
    {
      name: '任务量',
      type: 'bar',
      data: driverRank.map((item) => item.tasks),
      barWidth: '46%',
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: new graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(22, 103, 255, 0.68)' },
          { offset: 1, color: '#20e7ff' },
        ]),
        shadowBlur: 14,
        shadowColor: 'rgba(32, 231, 255, 0.35)',
      },
      label: {
        show: true,
        position: 'right',
        distance: chartSpace(6, 12),
        formatter: (params: any) => {
          const item = driverRank[params.dataIndex]
          return `{tasks|${item.tasks} 单}  {rate|${item.rate}%}`
        },
        rich: {
          tasks: { color: '#e7f7ff', fontSize: chartFontSize(11, 22) },
          rate: { color: '#43f08f', fontSize: chartFontSize(11, 22) },
        },
      },
    },
  ],
  animation: false,
}))

const ontimeTaskChartOption = computed<EChartsOption>(() => ({
  grid: {
    top: chartSpace(32, 62),
    right: chartSpace(46, 86),
    bottom: chartSpace(16, 30),
    left: chartSpace(12, 24),
    containLabel: true,
  },
  legend: {
    top: 0,
    right: 4,
    itemWidth: chartFontSize(12, 22),
    itemHeight: chartFontSize(8, 14),
    textStyle: { color: '#aac9e5', fontSize: chartFontSize(10, 20) },
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(4, 19, 33, 0.92)',
    borderColor: 'rgba(69, 196, 255, 0.38)',
    textStyle: { color: '#dff7ff', fontSize: chartFontSize(12, 22) },
  },
  xAxis: {
    type: 'category',
    data: ontimeTaskTrend.map((item) => item.date),
    axisLine: { lineStyle: { color: 'rgba(96, 164, 220, 0.2)' } },
    axisTick: { show: false },
    axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20), interval: 0 },
  },
  yAxis: [
    {
      type: 'value',
      name: '单',
      splitLine: { lineStyle: { color: chartGridColor } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20) },
      nameTextStyle: { color: chartTextColor, fontSize: chartFontSize(10, 18) },
    },
    {
      type: 'value',
      min: 90,
      max: 100,
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: chartTextColor, fontSize: chartFontSize(11, 20), formatter: '{value}%' },
      nameTextStyle: { color: chartTextColor, fontSize: chartFontSize(10, 18) },
    },
  ],
  series: [
    {
      name: '任务数',
      type: 'bar',
      data: ontimeTaskTrend.map((item) => item.tasks),
      barWidth: '32%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2ee7ff' },
          { offset: 1, color: 'rgba(27, 99, 255, 0.38)' },
        ]),
        shadowBlur: 14,
        shadowColor: 'rgba(46, 231, 255, 0.32)',
      },
    },
    {
      name: '准点率',
      type: 'line',
      yAxisIndex: 1,
      data: ontimeTaskTrend.map((item) => item.rate),
      smooth: true,
      symbol: 'circle',
      symbolSize: chartFontSize(7, 14),
      lineStyle: { width: chartFontSize(3, 6), color: '#43f08f' },
      itemStyle: { color: '#f4fff7', borderColor: '#43f08f', borderWidth: 2 },
      label: {
        show: true,
        color: '#caffdc',
        fontSize: chartFontSize(10, 18),
        formatter: '{c}%',
      },
    },
  ],
  animation: false,
}))

const chartInitOptions = computed(() => ({
  renderer: 'canvas' as const,
  // 测试模式会整体缩放 4784px 画布，降低像素比可显著减少四张图表的绘制面积。
  devicePixelRatio: resolutionMode.value === 'test' ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
}))
  return {
    townWasteChartOption,
    wasteTrendChartOption,
    driverRankChartOption,
    ontimeTaskChartOption,
    chartInitOptions,
  }
}
