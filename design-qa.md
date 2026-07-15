# 资产设备监控视觉核对

- source visual truth: `/var/folders/wr/jc4c_4nx45s9zk_tk7vhnplr0000gn/T/codex-clipboard-658309ff-8136-4cff-8f3b-b15dc88eebf7.png`
- implementation screenshot: in-app browser, `http://127.0.0.1:5174/#/sanitation/command-center-july-v2`
- viewport: Codex Desktop default viewport
- state: 测试分辨率、左侧资产设备监控默认展示

**Findings**

- [P2] 资产模块可用高度受整页三段式左栏约束，测试分辨率下会整体缩放；本次已将图标替换为透明 PNG，并把左栏配比从 `1.65/1/0.52` 调整为 `1.8/0.8/0.75`，保证图标、数量及健康度不再相互遮挡。
  - Evidence: 浏览器实时预览已加载 3 张独立 PNG；卡片文字均可见。
  - Fix: 若后续继续追求参考图的大尺寸卡片，需要产品确认是否允许压缩“累计数据”或增加左栏高度。

**Required fidelity surfaces**

- Fonts and typography: 保持现有大屏 DINPro 数字与中文字体层级。
- Spacing and layout rhythm: 卡片间距 18px，图标与文本采用 48%/52% 分栏。
- Colors and visual tokens: 延续深蓝面板、青色描边，健康度使用绿/黄/红语义色。
- Image quality and asset fidelity: 已使用透明 PNG 图标，不再使用 CSS 绘制图标；透明边缘经色键去背验证。
- Copy and content: 箱体 382 个 / 健康度 98%，车辆 26 台 / 健康度 97%，小三轮 540 辆 / 健康度 95%。

**Implementation Checklist**

- [x] 生成并接入三个透明 PNG 图标。
- [x] 重构资产设备监控卡片结构与排版。
- [x] 完成 TypeScript 与 Vite 构建校验。

final result: passed
