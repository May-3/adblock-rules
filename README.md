# adblock-rules
自维护的 iOS 去广告模块（.module 格式）。

文件说明
- merged-skip-ads.module —— 主文件，由以下两个上游项目合并去重并补强：
  - fmz200/wool_scripts「广告拦截&净化合集」（作者：奶思）
  - yfamilys.com「APP启动页去广告 ultra+」（作者：Mixed）
- scripts/bilibili-splash.js —— B站开屏条目停用脚本，已于 2026-10-31 在小火箭中验证。
- 在合并基础上新增：
  - B 站主站 APP 开屏：保留列表条目，调整已有时段、时长与预下载字段，覆盖 brand/list 等开屏接口。
  - 腾讯优量汇(GDT)广告素材 CDN 拦截（gdtimg.com / ugdtimg.com）
  - HTTP/3(QUIC) 阻断规则，防止广告 SDK 走 UDP 443 绕过 MITM
    
安装
- 在 Surge / Loon / Stash /小火箭中通过 URL 安装模块：
  - https://raw.githubusercontent.com/May-3/adblock-rules/main/merged-skip-ads.module
- 国内可换 jsDelivr 加速：
  - https://cdn.jsdelivr.net/gh/May-3/adblock-rules@main/merged-skip-ads.module
- B站开屏修复需要开启 HTTPS 解密并信任证书。刷新并启用本合集后，停用独立的「B站开屏·条目停用测试」及旧B站开屏测试模块，避免重复处理。
- 本次只合入已验证的B站开屏修复，腾讯视频开屏问题尚未解决。

验证
- 在仓库目录运行 `node tests/bilibili-splash.test.cjs`。

维护
- 规则按 APP 分组注释，新增规则时同步把主机名加进 [MITM] hostname
- 某条规则导致 APP 异常时，把 reject 换成 reject-dict 或 reject-200 试试
- 拦不住已显示的开屏广告：清该 APP 缓存或重装（广告素材已本地缓存）

许可证
- GPL-3.0。规则源自上述社区项目（wool_scripts 为 GPL-3.0），衍生分发遵循相同许可证，感谢原作者。
