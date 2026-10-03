# HappyRule（rules 分支）

个人规则集：分流 / 广告 / 防追踪，一处维护，多端生成。Quantumult X 为主维护端，自动生成 OpenWrt(SmartDNS/dnsmasq/PassWall)、Clash Verge、Surge 格式。

> 分支约定：`main` 仅作占位，**所有内容在本 `rules` 分支维护，永不合并回 main**。
> raw 订阅基地址：`https://raw.githubusercontent.com/cnsiming/HappyRule/rules/`

## 目录结构

```
Rules/            分流策略源（纯域名，一域一行）——主维护入口
  AI/             按 AI 产品拆分（ChatGPT/Claude/Muse/Google/General）
  Korea.list  Games-HK.list  PayPal-US.list  Direct.list
Filter/           广告与防追踪源（纯域名）
  Ads.list  AntiTracking.list
Vendor/           上游规则副本（QX/Surge 原文，upstream.txt 驱动每周同步）
Rewrite/qx/       重写副本（rewrite.txt 驱动同步，Profile 引用自有链接）
Scripts/          脚本副本（scripts.txt 驱动同步：task/backend/parser）
Profile/          QX 整机配置（脱敏模板，引用全部为本仓库 raw 链接）
tools/
  generate.sh      多格式生成器（dist 的唯一生产者）
  sync_upstream.sh  上游抓取器（raw → API 兜底）
  dedupe.py        提交前查重（Rules+Filter）
  stats.py         规则统计
  update.sh        通用拉取（其他 Linux 设备）
dist/             【自动生成，勿手改】qx/ clash/ surge/ smartdns/ dnsmasq/ passwall/
.github/workflows/
  generate.yml      push 后重新生成 dist
  sync-upstream.yml 每周一 11:23(北京) 抓取上游更新，有变化自动提交
```

## 各端用法

### Quantumult X（主）
整机配置模板：`Profile/QuantumultX.conf`（复制到本地后填回订阅链接与 MITM 证书）。
其中的 filter_remote / rewrite_remote / task_local 已全部指向本仓库 raw 链接，
上游更新由 GitHub Actions 每周同步进 Vendor/Rewrite/Scripts，QX 按 update-interval 自动刷新。

### iOS 浏览器脚本（Userscripts）
**iOS 上 Chrome 无法使用脚本**（Apple 强制所有 iOS 浏览器使用 WebKit 内核，Chrome iOS 没有扩展体系）。
请使用 **Safari + Userscripts**（App Store 免费）或 Stay：
1. 与 PC 端一样，把 `.user.js` 文件从电脑传到 iPhone（文件 App / AirDrop）
2. 在 Userscripts 中导入该脚本，按提示在「设置 → Safari → 扩展」里启用
3. 用 Safari 打开目标站点，脚本自动注入运行

本仓库 `Rewrite/qx/` 下的 4 条解锁规则（ai短剧/海角/妻社QS/糖心）是 QX 网络重写移植版，
仅供 QX 订阅；iOS 上直接使用原版 userscript 请走上述 Userscripts + Safari 方式。

### Clash Verge
分流（以 AI 为例）：
```yaml
rule-providers:
  ai-chatgpt:
    type: http
    url: https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/clash/AI/ChatGPT.yaml
    path: ./ruleset/ai-chatgpt.yaml
    interval: 86400
```
广告拦截直接引用 `dist/clash/Ads.yaml`、`dist/clash/AntiTracking.yaml`。

### Surge
```
[Rule]
RULE-SET,https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/surge/AI/ChatGPT.list,AI-ChatGPT
RULE-SET,https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/surge/Ads.list,REJECT
```

### OpenWrt 旁路由
SmartDNS 每日更新脚本拉取（已部署）：
```
dist/smartdns/ads.conf  dist/smartdns/antitracking.conf
```
分流规则可用 `dist/passwall/AI/ChatGPT.txt`（domain: 格式）粘贴进 PassWall 分流域名列表。

## 维护方式

1. 改 `Rules/` 或 `Filter/` 下的源文件 → push → Action 自动重新生成 `dist/`
2. push 前运行 `python3 scripts/dedupe.py` 查重
3. 上游有更新不用管：每周一自动同步；想立即同步可在 Actions 里手动运行 `sync-upstream`
4. 新增上游引用：在对应 `*.txt` 清单加一行即可
