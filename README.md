# HappyRule（rules 分支）

个人规则集：分流策略 / 广告策略 / 防追踪，一处维护，Quantumult X 与旁路由（SmartDNS + PassWall）多端订阅。

> 分支约定：`main` 仅作占位，**所有内容在本 `rules` 分支维护，永不合并回 main**。
> raw 订阅地址一律用 `https://raw.githubusercontent.com/cnsiming/HappyRule/rules/...`

## 目录结构

```
Rules/            分流策略（纯域名清单，一域一行，# 开头为注释）
  AI/             按 AI 产品拆分，各自独立绑节点
    ChatGPT.list    → 日本专线节点
    Claude.list     → 高纯度 IP 节点
    Muse.list       → 美国节点（含 meta/facebook API 域，注意影响面）
    Google.list     → 默认（香港）即可，不单独建组
    General.list    → perplexity/poe/grok 等，默认即可
  Korea.list        韩国服务（Kakao/Naver/Melon/Coupang...）
  Games-HK.list     游戏港服（注意内含 azureedge/akamaihd 大 CDN）
  PayPal-US.list    PayPal/美国基础服务
  Direct.list       国内直连（QX 端语义）
Filter/           广告与防追踪
  Ads.list          广告补充（主列表为外部 anti-AD + AdGuard）
  AntiTracking.list 行为追踪/日志上报
dist/             【自动生成，勿手改】qx/ 与 smartdns/ 两种格式
Rewrite/          Quantumult X 重写（待建设）
Icon/             图标资源（待建设，参考 Qure/Orz-3）
Profile/          整机配置模板
```

## 各端用法

### Quantumult X
`[filter_remote]` 订阅（reject 类）：
```
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/qx/Ads.list, tag=HappyAds, force-policy=reject, update-interval=86400, opt-parser=false, enabled=true
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/qx/AntiTracking.list, tag=HappyTracking, force-policy=reject, update-interval=86400, opt-parser=false, enabled=true
```
分流类（Rules/ 下的 list）直接复制进 `[filter_local]`，把行尾策略名换成你自己的策略组。
整机模板见 `Profile/QuantumultX.conf`。

### 旁路由（ImmortalWrt SmartDNS）
每日更新脚本拉取：
```
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/smartdns/ads.conf
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/smartdns/antitracking.conf
```

### PassWall 分流
在分流节点的分流规则里，把 Rules/AI/*.list 的域名粘贴进对应规则的域名列表（或等后续支持 URL 拉取）。

## 维护方式

只改 `Rules/` 与 `Filter/` 下的源文件，push 后 GitHub Action 自动重新生成 `dist/`。
