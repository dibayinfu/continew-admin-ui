# 浏览器完整加载诊断

目标：`https://longan.mozi365.com/`，最终路由为 `/sanitation/boxMap`。

## 测试范围

已通过 Chrome 窗口属性确认用户打开的是 incognito 窗口，并在该窗口输入网址。Chrome 禁用了“Allow JavaScript from Apple Events”，因此无法读取这个无痕窗口的完整性能记录；没有更改该安全设置。

以下性能数据来自用户随后允许使用的 Ego Lite：禁用页面 HTTP 缓存，捕获 Resource Timing、页面阶段和 CDP 网络事件。该浏览器仍有 16 条既存 localStorage 记录，复测也复用了部分连接，不能称为全新无痕会话。未清空用户存储、Cookie 或修改系统代理。

## 主要发现

### 1. 实际使用的代理路径明显拖慢高德资源

系统 HTTP/HTTPS 代理为 `127.0.0.1:58591`。CDP 显示页面请求的实际连接也是这个地址及端口；Cloudflare trace 返回 `colo=LAX`、`loc=US`。

不改变系统配置，仅用 curl 对同一个高德静态资源进行对照：

资源：`https://webapi.amap.com/theme/v2.0/logo@2x.png`。

| 路径 | TLS 建连完成 | 首字节 | 总时间 |
| --- | ---: | ---: | ---: |
| 直连 | 58 ms | 136 ms | 136 ms |
| 当前系统代理 | 1,734 ms | 2,150 ms | 2,150 ms |

这一次样本中，该资源经代理约慢 16 倍。浏览器中的 `jsapi.amap.com`、`custyle.amap.com`、`o4.amap.com` 等新连接，也分别出现约 1～2 秒的 TLS 建连时间。

站点自身的 Cloudflare trace 小请求：直连约 824 ms（colo=AMS、loc=CN），代理约 993 ms（colo=LAX、loc=US）。直连也到达海外 CDN 节点，所以不能把“关闭代理”视为解决全部站点延迟的充分条件。完整浏览器的直连对照仍需另做。

### 2. 框架不是全部等待时间

第一轮页面阶段采样：

| 阶段 | 导航后时间 |
| --- | ---: |
| HTML 首字节 | 0.946 秒 |
| 第一次内容绘制 | 2.140 秒 |
| 箱体地图页面 DOM 出现 | 3.911 秒 |
| 地图 canvas / 标记出现 | 5.644 秒 |
| 运单接口响应头返回 | 6.205 秒 |

从发起 fetch 到响应头交给页面的等待：收集点约 397 ms；车辆位置约 1,490 ms；箱体约 1,780 ms；运单约 2,325 ms。它们并行执行，不能简单累加。

第二轮 CDP 记录中，高德初始化请求约在第 7.8 秒发出，瓦片、样式和地图内置图标的响应头持续到第 10～14 秒。最终截图已确认完整底图显示。canvas 出现不等于底图加载完成。

第一轮记录到的长任务分别约 55、174、146、143 ms，无法支持“主要耗时全部是框架 CPU 执行”的结论。

### 3. 框架预加载脚本仍有一处执行顺序问题

线上预加载代码已部署，但位于全局样式表之后。第一轮全局 CSS 约第 1.879 秒结束，页面资源第 1.882 秒才开始；第二轮也分别是第 1.093 秒和第 1.096 秒。

本轮已将预加载代码放到所有样式表之前，同时保证 UTF-8 编码声明仍在 head 开头。只在测试浏览器临时替换 HTML 的验证中，页面资源可在第 0.275 秒发出，而全局 CSS 当时仍在下载。这证明消除了“等待 CSS 后才发现页面资源”的延迟，但不等于整体页面耗时必然缩短相同秒数。

一次使用高层 reload 的拦截实验被工具等待机制挂起，产生了无效的 15 秒延迟；该样本已排除，未作为站点慢加载证据。有效的位置验证改用底层导航触发后再处理响应。

## 建议优先级

1. 先在网络客户端中对业务域名及高德资源域名做直连对照，再用同一浏览器和相同条件复测。未自动更改任何代理规则。
2. 国内用户仍慢时，检查 Cloudflare 到源站的线路及国内静态资源加速方案。已有 gzip、HTTP/2 和静态缓存，不应重复将问题归因为没有启用压缩。
3. 部署本轮预加载顺序修正。地图源码、标记、坐标、SVG 及业务接口没有修改。
4. 暂不为这次网络瓶颈继续替换框架或删减地图功能。

## 证据文件

- `outputs/performance/browser-http-cold-1.json`
- `outputs/performance/browser-network-2.json`
- `outputs/performance/preload-position-check.json`

复现高德静态资源路径对照：

```sh
curl --noproxy '*' -sS -o /dev/null -w 'TLS=%{time_appconnect} TTFB=%{time_starttransfer} TOTAL=%{time_total}\n' https://webapi.amap.com/theme/v2.0/logo@2x.png
curl --proxy http://127.0.0.1:58591 --noproxy '' -sS -o /dev/null -w 'TLS=%{time_appconnect} TTFB=%{time_starttransfer} TOTAL=%{time_total}\n' https://webapi.amap.com/theme/v2.0/logo@2x.png
```
