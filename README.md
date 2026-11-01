# adblock-rules

自维护的 iOS 去广告模块（`.module` 格式），面向 **Surge / Loon / Stash / Shadowrocket**。
在社区规则基础上按**真机抓包 + 代理日志**逐条核对，只留真正打中广告的规则，误伤的能删就删。

- 主文件：`merged-skip-ads.module`（约 8.0k 行，2 830 条域名规则 / 2 745 条路径改写）
- 上游来源：fmz200/wool_scripts 的「广告拦截 & 净化合集」（作者：奶思）、yfamilys.com 的「APP 启动页去广告 ultra+」（作者：Mixed），合并去重后按 App 分组维护
- 最近一次大动作：**2026-11-02 误杀审计**，依据一整天的真实代理日志（4 297 次规则命中 / 1 519 次拦截 / 119 条生效规则）逐条回查，修掉 20 处误杀（12 条整域或整 IP + 6 组功能性接口 + 2 处正则路径），详见下文

---

## 特性

### B 站
- 主站 APP 开屏：保留列表条目，调整已有时段、时长与预下载字段，覆盖 `brand/list` 等开屏接口
- HTTPDNS 放行（`httpdns.bilivideo.com`）：曾被 HTTPDNS 拦截类模块误伤，导致 CDN 调度劣化到海外镜像
- 核心 CDN / 接口直连：`hdslb.com` / `bilivideo.com` / `grpc.biliapi.net` / `api.bilibili.com` / `app.bilibili.com`
- 评论接口（Reply / MainList）从 Sparkle 净化脚本中摘除：修复评论区骨架屏卡死

### 百度网盘
- 第三方广告 SDK 域名补齐（官方第三方清单 + 两轮真机抓包）：`zsmobi.com` / `mentamob.com` / `ubixai.com` / `advlion.com` / `vlion.cn` / `yunxish.com` / `66mobi.com` / `app-analytics-services.com` 等
- 自家广告 / 运营链路按路径 mock：`/buy/ad/get|conf|analytics`、`/act/api/activitystatus|activityentry`、`/rest/2.0/memberact/activity`、`/api/resource/prefetch`（素材预取，断掉开屏广告库存来源）
- 穿山甲配置伪装：`webcast-open.douyin.com` 的 `pangle/setting`（仅匹配 `com.baidu.netdisk` 包名）+ analytics 竞价上报
- CPC 换域广告服务通配：`DOMAIN-KEYWORD,cpc-service-square`（已见 yunxish / iggrowth / 58iclick 三家轮换）

### 腾讯视频
- 自家广告投放 / 监测 / 运营域：`iacc.qq.com` / `iacc.rec.qq.com` / `mdt.qq.com`(KEYWORD) / `rdelivery.qq.com` / `snowflake.qq.com` / `galileotelemetry.tencent.com`
- 阿里妈妈 Tanx ADX：`df.tanx.com`
- 京东 IM 网关：`im-x.jd.com`（京东广告 SDK 附带组件）
- 开屏广告分片：按 URL 里的素材/模板 ID 精确拦（广告 `svp_1050` + `gzc_1000173`，正片 `svp_50112` + `gzc_1000102`，互不影响）。这类分片走 HTTP 明文，host 甚至可能藏在路径里或直连 IP，只有按 ID 才拦得住

### 养基宝（深圳小多头）
- 第三方广告平台域名补齐：`atdplus.cn` / `shenshiads.com` / `ad-scope.com.cn` / `adn-plus.com.cn` / `sigmob.cn` / `etoolads.cn` / `sdktmp.hubcloud.com.cn`（原先整域拦 `hubcloud.com.cn`，会误伤 `res1.hubcloud.com.cn` 等业务域，已收窄）

### 爱奇艺 / 优酷 / 知乎（2026-11-02 新增修正）
- 只保留明确的广告位路径，放行播放策略、CDN 调度、账号与配置类接口
- 优酷：拦 `poplayer.position.query`（弹窗广告位），放行 `play.position.preload.query`（续播预加载）
- B 站：拦搜索广场 / 顶部活动位 / 会员广告素材，放行首页 tab 配置补丁

### 通用
- 腾讯优量汇（GDT）素材 CDN 拦截（`gdtimg.com` / `ugdtimg.com`）+ 开屏兜底（`adsmind.qq.com` / `tangram.qq.com`）
- 百青藤视频素材 CDN（`bdvivid.com`）
- 阻断 HTTP/3（QUIC）：广告 SDK 会走 UDP 443 绕过 MITM，屏蔽后客户端自动回落 TCP
- 苹果系统更新域直连（`mesu` / `gdmf` / `xp.apple.com`），修复走代理时报「无法检查更新」

---

## 安装

1. 在 Surge / Loon / Stash / 小火箭中通过 URL 安装模块：

   ```
   https://raw.githubusercontent.com/May-3/adblock-rules/main/merged-skip-ads.module
   ```

   国内加速（jsDelivr）：

   ```
   https://cdn.jsdelivr.net/gh/May-3/adblock-rules@main/merged-skip-ads.module
   ```

2. 开启 HTTPS 解密（MITM）并信任证书 —— B 站开屏与路径级改写依赖它。

3. 停用冲突模块：
   - 独立的「B站开屏·条目停用测试」及旧 B 站开屏模块（避免重复处理）
   - **`blockHTTPDNS.module`（HTTPDNS 拦截器）**：它会拦掉 B 站 / 淘宝 / 美团等 App 的 HTTPDNS 调度服务，导致 CDN 调度劣化到海外镜像（B 站实测刷视频、评论区极慢）。本合集的去广告全在域名与路径层，不依赖 DNS 层。

---

## 误杀审计（2026-11-02）

去广告规则最怕的不是漏广告，而是**把正常接口一起拦了**。本次用一整天（00:00–23:59）的真实代理日志做了一次全量回查：4 297 次规则命中、1 519 次拦截、119 条规则实际生效、157 个目标主机，逐条对照 URL 路径判断「这是广告还是功能」。

**修掉的典型误杀**

| 被拦的东西 | 它其实是什么 |
|---|---|
| `api.iqiyi.com` | 爱奇艺统一配置网关：风控开关、生物识别基线、通用配置包 |
| `policy.video.iqiyi.com` | 播放器 QTP / HCDN / MSS / netdoctor **播放与 CDN 策略** |
| `static-s.iqiyi.com` | 带 authcookie 的**账号接口** + 基础配置 |
| `httpdns.alicdn.com`、`119.29.29.x/d` | 阿里 / DNSPod **HTTPDNS 解析**（拦了会解析到远端节点，越拦越卡） |
| `180.76.76.200`（IP 级） | 百度网盘传输节点的裸 IP 连接，17 秒内被拒 31 次 |
| `DOMAIN-KEYWORD,umeng` | 连带拦掉 `utoken` / `msg.umengcloud` / `resolve` —— **友盟推送**，优酷收不到推送 |
| `pan.baidu.com/api/certuser/get`、`pmall/order/privilege/info` | 实名认证状态、会员权益 |
| B 站 `Search/DefaultWords`、`/x/resource/patch/tab/v2` | 搜索框默认词、首页 tab 配置 |
| `i\d.hdslb.com/bfs/fawkes` | B 站客户端动态化资源包（热更） |
| `m.suning.com`（关键词） | 苏宁易购移动主站 |
| `trace.qq.com`、`volces.com`（关键词通配） | 灯塔遥测泛匹配、火山引擎 SDK 全家族 |

**顺带发现的结构性问题**

- 该模块当时有 800+ 条 `[Map Local]`，本意是「返回空数据骗过 App」，但 Shadowrocket 没有这个区，条目被当 `REJECT` 执行，连接直接关闭、mock 从未生效 —— App 当作网络错误反复重连（一天 94 次同一 URL 的重试），比不拦更耗电。**已于 11-02 00:30 全量迁移到 `[URL Rewrite]`，问题闭环**（见更新记录）。
- 同一批 URL 在 `[URL Rewrite]`（reject 写法）与 `[Map Local]`（mock 写法）里各存一份（Surge / Loon 两套方言），合并时按整行文本去重，两份都留下了。迁移时已顺手清掉这 761 条重复。

---

## 实测

| 日期 | App | 结果 |
|---|---|---|
| 2026-10-31 ~ 11-01 | 养基宝、百度网盘、腾讯视频 | 重装 App 后广告清零（含开屏、运营弹窗、贴片） |
| 2026-10-31 ~ 11-01 | B 站 | 刷视频 / 评论区卡顿修复（CDN 调度恢复，全部直连） |
| 2026-10-31 | iOS 系统更新 | 「无法检查更新」修复 |
| 2026-11-02 | Shadowrocket 兼容性 | `[Map Local]` 迁移到 `[URL Rewrite]` 后，不再出现「mock 变断链 → App 反复重连」；模块只依赖 `[Rule]` + `[URL Rewrite]` |
| 2026-11-02 | 爱奇艺 / 优酷 / B 站 / 网盘 / 推送 | 误杀修正后**待真机回归**，验证清单见下 |

回归清单（改完模块后逐项过一遍）：爱奇艺能播放并切换清晰度、会员中心权益不空白；优酷起播正常、续播位置还在；B 站首页 tab 能刷新、搜索默认词正常；网盘实名状态与传输速度正常；接友盟 / 个推的 App 能收到推送。

---

## 兼容性

| 能力 | 说明 |
|---|---|
| `[Rule]` 域名 / IP 规则 | 四端通用，本合集的主体 |
| `[URL Rewrite]` 路径改写 | 四端通用（小火箭为 URL Rewrite + 脚本体系），依赖 MITM |
| `[Map Local]` 本地 mock | **2026-11-02 起已全量迁移到 `[URL Rewrite]`**。小火箭不支持该区，会把条目当 `REJECT` 执行、mock 从不生效，迁移后不再依赖任何客户端的 mock 能力 |
| `[Script]` 脚本 | 视客户端与版本而定 |

整个模块现在只用 `[Rule]` + `[URL Rewrite]` 两区完成拦截，四端行为一致；`[Script]` 是锦上添花，可以按需关闭。这次迁移就是针对 Shadowrocket 的实测问题（Map Local 全区被当 `REJECT` 执行、连接被直接掐断）做的，迁完不再依赖这个区。

---

## 仓库结构

```
adblock-rules/
├── merged-skip-ads.module        # 主文件（唯一需要安装的）
├── README.md
└── scripts/
    └── bilibili-splash.js        # B站开屏条目停用脚本，已于 2026-10-31 真机验证
```

---

## 维护规范

- **拦截域名规则必须写在 `[Rule]` 区**（写进 `[Script]` / `[URL Rewrite]` 会被静默忽略，踩过坑）
- **路径级改写写在 `[URL Rewrite]` 区**；新增改写域名记得同步加进 `[MITM] hostname`
- 头部「最后修改时间」与「更新记录」（一行一条，新→旧）随每次改动同步更新
- **加规则前先看路径**：`config` / `cert` / `privilege` / `token` / `push` / `dns` / `resolve` / `play` 这类词基本是功能接口，别用整域拦
- 关键词规则（`DOMAIN-KEYWORD`）只用于「厂商专属、不可能撞车」的串（如 `pangolin-sdk-toutiao`）；`umeng`、`m.suning.com` 这类宽词已证明会误伤
- IP 级规则（`IP-CIDR /32`）慎用：裸 IP 连接没有 SNI，规则区分不了广告与传输节点，且 IP 会随 CDN 调度漂移
- 某条规则导致 App 异常时，先把 `reject` 换成 `reject-dict` 或 `reject-200` 试
- 拦不住已显示的开屏广告：清该 App 缓存或重装（素材已本地预缓存，如网盘走 `resource/prefetch`）
- 广告寄生在业务域名路径下时（如 `pan.baidu.com/buy/ad/`），域名规则无解，用 `[URL Rewrite]` 按路径 mock

---

## 已知限制

- **开屏广告可能是本地缓存**：拦截生效后 App 仍会播已缓存的素材。腾讯视频 2026-11-02 就是这么回事——`iacc.qq.com`(投放配置)、`rdelivery.qq.com`、`pgdt.gtimg.cn`(素材) 全部在拦，开屏照播；清掉 App 缓存后立刻消失。判断方法：清缓存后还在 = 规则没拦住；清缓存后消失 = 缓存，不是规则问题。腾讯视频这条已从源头处理：开屏分片（`svp_1050`/`gzc_1000173`）会被拒，清一次缓存后不会再下载回来。
- **gRPC 类广告位只能放行**：B 站 `Teenagers/ModeStatus`、`View/TFInfo`、`ViewEndPage` 原本靠 `[Map Local]` 塞 base64 protobuf 假包，`[URL Rewrite]` 复现不了，已删除并恢复真实响应 —— 视频结尾页的推荐位可能重新出现，这是已知取舍。
- 关键词与整域规则仍可能误伤小众 App，遇到问题请带上 App 名称 + 出问题的页面反馈。
- 只覆盖上述 App 的主要广告链路；信息流内的原生广告、服务端已兜底的广告位不一定能清。

---

## 更新记录（新→旧）

- 2026-11-02 01:10 腾讯视频开屏广告**真正修好**：抓包确认开屏分片走 HTTP、host 藏在路径里（`/omts.tc.qq.com/…/svp_1050/…gzc_1000173….ts`），域名规则天生拦不到。已按 `svp_1050` / `gzc_1000173` 重建精确拦截（正片 `svp_50112`/`gzc_1000102` 不受影响），清一次缓存后不会再预取
- 2026-11-02 01:05 排障结论：腾讯视频开屏广告来自**本地缓存**（投放域 `iacc.qq.com` / `rdelivery.qq.com` / 素材域 `pgdt.gtimg.cn` 全程在拦），清 App 缓存后消失，与规则改动无关。同期把 `DOMAIN-KEYWORD,trace.qq.com` 恢复（此前误改为精确 `h.trace.qq.com`），并移除临时诊断用 MITM 主机
- 2026-11-02 00:30 `[Map Local]` 全区迁移到 `[URL Rewrite]`（适配 Shadowrocket 等不支持该区的客户端）：删除 761 条与 `[URL Rewrite]` 完全重复的条目（行为不变），迁移 45 条（33 条 `reject-dict` / 12 条 `reject-200`），2 条 gRPC base64 mock 无法复现已删除；原有 100 条 `reject-img` 保持不动，并清掉 1 条无效规则（`hostname - reject`）。模块从 9 754 行降到 7 966 行，mock 不再依赖客户端特性
- 2026-11-02 00:15 误杀审计修正：删 12 条整域 / 整 IP 误杀（`api.iqiyi`、`policy.video.iqiyi`、`static-s.iqiyi`、`httpdns.alicdn`、`180.76.76.200`×2、`203.107.1.1/24`、`umeng` 关键词、`m.suning`、`XiaoQiang`、`appcloud.zhihu`×2）；删 6 组功能性 URL 拦截（网盘 `certuser` `pmall`、优酷 `zconfig`、`119.29.29` HTTPDNS、B 站 `fawkes`、知乎 `guide`/`ecom`）；优酷与 B 站正则剔除功能性路径；`hubcloud` / `trace.qq.com` / `volc` / 穿山甲正则改窄；`umeng` 推送链路放行并补 `cnlogs` `oslogs` 精确域
- 2026-11-01 23:06 删除 `resolv` 通配拦截：误杀 B 站备用解析，导致「网络错误」重试风暴（当晚 B 站卡顿与报错的真正根因）
- 2026-11-01 10:49 B站：评论接口 Reply/MainList 从 Sparkle 净化脚本摘除（修复评论区骨架屏卡死）
- 2026-11-01 10:37 B站：HTTPDNS 放行 + hdslb/bilivideo/biliapi/bilibili 核心 CDN 直连（修复调度劣化导致的卡顿）
- 2026-10-31 22:59 删除腾讯视频素材 ID 精确规则与 `svp_1050` / `gzc_1000173` 试验规则（两个 App 重装后广告清零）
- 2026-10-31 22:56 全文件体检整理：0 重复 / 0 错位 / 0 冲突，自维护段按 App 分组
- 2026-10-31 22:49 苹果系统更新域直连（修复走代理时报「无法检查更新」）
- 2026-10-31 21:53 腾讯视频：广告视频分片按素材 ID 精确拦截 + `galileotelemetry` 遥测拦截
- 2026-10-31 21:39 腾讯视频域名补漏：`iacc` / `mdt`(KEYWORD) / `df.tanx` / `rdelivery` / `snowflake`
- 2026-10-31 21:18 百度网盘：`/api/resource/prefetch` 素材预取 mock
- 2026-10-31 21:10 百度网盘：`memberact/activity` 运营位 mock
- 2026-10-31 21:06 百度网盘：`webcast-open` 穿山甲配置 mock + analytics 竞价统计 mock
- 2026-10-31 21:01 百度网盘：`cpc-service-square` 合并为 `DOMAIN-KEYWORD` 通配（防换域）
- 2026-10-31 20:50~20:55 百度网盘：`/buy/ad/` 路径 mock 及域名补漏（advlion / vlion / yunxish / 66mobi 等）
- 2026-10-31 20:26 养基宝：规则从 `[Script]` 区移回 `[Rule]` 区（修复不生效）+ 域名补漏
- 2026-10-31 合并 adultraplus + blockAds 两个上游模块，B 站开屏条目停用修复（真机验证）

---

## 待办

- 腾讯视频首页 VIP 运营轮播位（「11.11 VIP 6.2 折」）：需抓包定位下发接口后做 mock 或响应体字段手术
- `getui.com` / `getui.net` 整域拦截（个推是推送服务商，不是纯广告）：待装了接个推的 App 后决定收窄还是删除

---

## 免责声明

规则来自社区维护的广告拦截实践，按「现状」提供，不保证对所有 App、所有版本生效，也不保证零误伤。使用后出现某 App 功能异常，请先停用本模块确认因果；因使用本规则造成的任何影响由使用者自行承担。

---

## 许可证与致谢

- GPL-3.0。规则源自上述社区项目（wool_scripts 为 GPL-3.0），衍生分发遵循相同许可证。
- 感谢 [@fmz200](https://github.com/fmz200) 的 wool_scripts、yfamilys 的 ultra+ 规则，以及各路分享抓包结果的网友 —— 这个文件里绝大多数条目都不是我原创的，我只是负责核对和删减。
