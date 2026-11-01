# adblock-rules
自维护的 iOS 去广告模块（.module 格式，适用于 Shadowrocket / Surge / Loon / Stash）。

## 文件说明
- `merged-skip-ads.module` —— 主文件，由以下两个上游项目合并去重并补强：
  - fmz200/wool_scripts「广告拦截&净化合集」（作者：奶思）
  - yfamilys.com「APP启动页去广告 ultra+」（作者：Mixed）
- `scripts/bilibili-splash.js` —— B站开屏条目停用脚本，已于 2026-10-31 在小火箭中验证。

## 在合并基础上新增的能力

### B 站
- 主站 APP 开屏：保留列表条目，调整已有时段、时长与预下载字段，覆盖 brand/list 等开屏接口
- HTTPDNS 放行（`httpdns.bilivideo.com`）：修复被 HTTPDNS 拦截模块误伤后 CDN 调度劣化到海外镜像的问题
- 核心 CDN/接口直连：`hdslb.com` / `bilivideo.com` / `grpc.biliapi.net` / `api` / `app.bilibili.com`
- 评论接口（Reply/MainList）从 Sparkle 净化脚本摘除：修复评论区骨架屏卡死

### 养基宝（深圳小多头）
- 第三方广告平台域名补齐：`atdplus.cn` / `shenshiads.com` / `ad-scope.com.cn` / `adn-plus.com.cn` / `sigmob.cn` / `etoolads.cn` / `hubcloud.com.cn`

### 百度网盘
- 第三方广告 SDK 域名补齐（依据官方第三方清单 + 两轮真机抓包）：`zsmobi.com` / `mentamob.com` / `ubixai.com` / `advlion.com` / `vlion.cn` / `yunxish.com` / `66mobi.com` / `app-analytics-services.com` 等
- 自家广告/运营链路路径 mock：`/buy/ad/get|conf|analytics`、`/act/api/activitystatus|activityentry`、`/rest/2.0/memberact/activity`、`/api/resource/prefetch`（素材预取，断开屏广告库存源头）
- 穿山甲配置伪装：`webcast-open.douyin.com` 的 pangle/setting（仅匹配网盘包名）与 analytics 竞价上报
- CPC 换域广告服务通配：`DOMAIN-KEYWORD,cpc-service-square`（已见 yunxish / iggrowth / 58iclick 三家轮换）

### 腾讯视频
- 自家广告投放/监测/运营域名：`iacc.qq.com` / `iacc.rec.qq.com` / `mdt.qq.com`(KEYWORD) / `rdelivery.qq.com` / `snowflake.qq.com` / `galileotelemetry.tencent.com`
- 阿里妈妈 Tanx ADX：`df.tanx.com`
- 京东 IM 网关：`im-x.jd.com`（京东广告 SDK 附带组件）

### 通用
- 腾讯优量汇(GDT) 素材 CDN 拦截（`gdtimg.com` / `ugdtimg.com`）+ 开屏兜底（`adsmind.qq.com` / `tangram.qq.com`）
- 百青藤视频素材 CDN（`bdvivid.com`）
- HTTP/3(QUIC) 阻断规则，防止广告 SDK 走 UDP 443 绕过 MITM
- 苹果系统更新域直连（`mesu` / `gdmf` / `xp.apple.com`），修复走代理时报"无法检查更新"

## 安装
- 在 Surge / Loon / Stash / 小火箭中通过 URL 安装模块：
  - https://raw.githubusercontent.com/May-3/adblock-rules/main/merged-skip-ads.module
- 国内可换 jsDelivr 加速：
  - https://cdn.jsdelivr.net/gh/May-3/adblock-rules@main/merged-skip-ads.module
- B站开屏修复需要开启 HTTPS 解密并信任证书。刷新并启用本合集后，停用独立的「B站开屏·条目停用测试」及旧B站开屏测试模块，避免重复处理。
- **建议同时停用 `blockHTTPDNS.module`（HTTPDNS拦截器）**：它会拦掉 B站/淘宝/美团等 App 的 HTTPDNS 调度服务，导致 CDN 调度劣化到海外镜像（B站实测刷视频/评论区极慢）。本合集的去广告全在域名/路径层，不依赖 DNS 层，无需该模块。

## 实测效果（2026-10-31 ~ 11-01）
- 养基宝、百度网盘、腾讯视频：重装 App 后广告清零（含开屏、运营弹窗、贴片）
- B站：刷视频/评论区卡顿修复（CDN 调度恢复正常，全部直连）
- 苹果系统更新："无法检查更新"修复

## 验证
- 在仓库目录运行 `node tests/bilibili-splash.test.cjs`。

## 维护
- 拦截域名规则必须写在 `[Rule]` 区【自维护新增】段内（写在 `[Script]`/`[URL Rewrite]` 区会被静默忽略，曾踩坑）
- 路径级改写写在 `[URL Rewrite]` 区；新改写域名记得同步加进 `[MITM] hostname`
- 头部"最后修改时间"与"更新记录"（一行一条，新→旧）随每次改动同步更新
- 某条规则导致 APP 异常时，把 reject 换成 reject-dict 或 reject-200 试试
- 拦不住已显示的开屏广告：清该 APP 缓存或重装（广告素材已本地预缓存，如百度网盘走 `resource/prefetch`）
- 同一子域名在多个主域间轮换的广告服务（如 `cpc-service-square.*`），用 DOMAIN-KEYWORD 一条通配
- 广告寄生在业务域名路径下时（如 `pan.baidu.com/buy/ad/`），域名规则无解，用 [URL Rewrite] 按路径 mock

## 更新记录（新→旧）
- 2026-11-01 10:49 B站：评论接口 Reply/MainList 从 Sparkle 净化脚本摘除（修复评论区骨架屏卡死）
- 2026-11-01 10:37 B站：HTTPDNS 放行 + hdslb/bilivideo/biliapi/bilibili 核心 CDN 直连（修复调度劣化导致的卡顿）
- 2026-10-31 22:59 删除腾讯视频素材ID精确规则与 svp_1050/gzc_1000173 试验规则（两 App 重装后广告清零）
- 2026-10-31 22:56 全文件体检整理：0 重复 / 0 错位 / 0 冲突，自维护段按 App 分组
- 2026-10-31 22:49 苹果系统更新域直连（修复走代理时报"无法检查更新"）
- 2026-10-31 21:53 腾讯视频：广告视频分片按素材ID精确拦截 + galileotelemetry 遥测拦截
- 2026-10-31 21:39 腾讯视频域名补漏：iacc / mdt(KEYWORD) / df.tanx / rdelivery / snowflake
- 2026-10-31 21:18 百度网盘：/api/resource/prefetch 素材预取 mock
- 2026-10-31 21:10 百度网盘：memberact/activity 运营位 mock
- 2026-10-31 21:06 百度网盘：webcast-open 穿山甲配置 mock + analytics 竞价统计 mock
- 2026-10-31 21:01 百度网盘：cpc-service-square 合并为 DOMAIN-KEYWORD 通配（防换域）
- 2026-10-31 20:50~20:55 百度网盘：/buy/ad/ 路径 mock 及域名补漏（advlion/vlion/yunxish/66mobi 等）
- 2026-10-31 20:26 养基宝：规则从 [Script] 区移回 [Rule] 区（修复不生效）+ 域名补漏
- 2026-10-31 合并 adultraplus + blockAds 两个上游模块，B站开屏条目停用修复（真机验证）

## 待办
- 腾讯视频首页 VIP 运营轮播位（"11.11 VIP 6.2 折"）：需抓取首页日志定位下发接口后做 mock 或响应体字段手术

## 许可证
- GPL-3.0。规则源自上述社区项目（wool_scripts 为 GPL-3.0），衍生分发遵循相同许可证，感谢原作者。
