# Rewrite（Quantumult X 重写）

## 目录结构

- `qx/` — 各重写规则的落地文件（QX conf / Surge sgmodule / Loon plugin / 脚本 .js）
- `src/` — **自建规则的源文件**（userscript 等原始形态，改这里再重新生成）
- `rewrite.txt` — 上游同步清单（`sync_upstream.sh` 按此抓取上游更新）

## 自建：ai短剧助手网络重写版

| 文件 | 平台 |
|---|---|
| `qx/ai-duanju.conf` | QX / Shadowrocket / Stash（含 hostname，直接订阅） |
| `qx/ai-duanju.sgmodule` | Surge（已开 binary-body-mode） |
| `qx/ai-duanju.plugin` | Loon |
| `qx/ai-duanju-unlock.js` | 上述规则共用的网络重写脚本 |

- 源：`src/ai-duanju-bg.user.js`（浏览器 userscript v1.1.7，作者 morgan）
- 覆盖黄豆/黄果系 45 个域名、38 个 API 路径；VIP 解锁 + 广告接口清除 + 播放免费线路构造
- Clash/mihomo（含 OpenWrt OpenClash/Passwall）**不支持** JS 响应体改写，无法使用
- DOM 级广告清理只能在浏览器 userscript 内生效，属预期差异

### 更新流程（源脚本升级后）

```bash
python tools/build_ai_duanju.py     # src/ → qx/ 四个文件重新生成
node   tools/test_ai_duanju.js Rewrite/qx/ai-duanju-unlock.js   # Node 沙箱 6 组回归测试
```

### 订阅地址（rules 分支）

```
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/ai-duanju.conf
```

## 自建：海角视频解锁网络重写版

| 文件 | 平台 |
|---|---|
| `qx/haijiao.conf` | QX / Shadowrocket / Stash（含 hostname，直接订阅） |
| `qx/haijiao.sgmodule` | Surge（完整版：含 m3u8 key 还原，binary-body-mode） |
| `qx/haijiao.plugin` | Loon |
| `qx/haijiao-unlock.js` | 上述规则共用的网络重写脚本 |

- 源：`src/haijiao-unlock.user.js`（浏览器 userscript v1.4.5，作者 ayase+baby）
- 功能：banner 广告清除 / 视频中心解锁 / 短视频试看解除 / 帖子付费与 VIP 伪造 /
  付费图片还原 / 音频直链修正 / 用户 VIP 标识伪造
- 平台差异：Surge/Stash（$httpClient）额外支持视频/音频**真实地址解析**与
  m3u8 加密 **key 异或还原**；QX/Loon/小火箭重写脚本无法发起出站 HTTP，
  自动降级为纯响应补丁（视频帖真实播放地址不可用，图片/短视频/VIP 不受影响）。
  Clash/mihomo（含 OpenWrt）**不支持** JS 改写，无法使用。
- 镜像站为动态 .top 域名（8~32 位十六进制或 hj+数字），无法枚举进 hostname；
  默认仅 haijiao.com，使用镜像站需自行把镜像域名加入 MITM（勿对整个 `*.top` 开 MITM）。
- key 还原依赖 m3u8 响应观察 → 持久化 keyUrl→secretUrl 映射 → key 请求 XOR 替换，
  仅 Surge 模块内已配置对应规则。

### 更新流程（源脚本升级后）

```bash
python tools/build_haijiao.py     # src/ → qx/ 四个文件重新生成
node   tools/test_haijiao.js Rewrite/qx/haijiao-unlock.js   # Node 沙箱 12 组回归测试
```

### 订阅地址（rules 分支）

```
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/haijiao.conf
```

## 自建：妻社(QS)解锁网络重写版

| 文件 | 平台 |
|---|---|
| `qx/qs-unlock.conf` | QX / Shadowrocket / Stash（含 hostname 占位，需自填域名） |
| `qx/qs-unlock.sgmodule` | Surge |
| `qx/qs-unlock.plugin` | Loon |
| `qx/qs-unlock.js` | 上述规则共用的网络重写脚本 |

- 源：`src/qs-unlock.user.js`（浏览器 userscript v1.5.0，作者 彭于晏+ayase）
- 功能：VIP 用户组伪造（终身VIP）/ 付费帖子与附件解锁（含内嵌 apptag 视频）/
  广告配置清除 / 搜索次数限制解除（deviceid 轮换，每 id 2 次额度，持久化跨请求）
- **纯本地 JSON 补丁，无外部 HTTP 依赖 → QX / Loon / Surge / Stash / 小火箭功能完全等价**；
  Clash/mihomo（含 OpenWrt）不支持 JS 改写，无法使用。
- 站点为动态域名族（qishe/qs/7she/qsgg 前缀家族，随时换数字后缀），无法枚举进
  hostname；conf 内为占位域名，使用前换成实际访问域名（接口路径
  `/source/plugin/qsts_app/index.php/*` 与 `/mserver/*` 按路径匹配，换域名只改 hostname）。
- 与浏览器 userscript 不冲突；悬浮球属页面层，网关版没有（预期差异）。

### 更新流程（源脚本升级后）

```bash
python tools/build_qs.py     # src/ → qx/ 四个文件重新生成
node   tools/test_qs.js Rewrite/qx/qs-unlock.js   # Node 沙箱 12 组回归测试
```

### 订阅地址（rules 分支）

```
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/qs-unlock.conf
```

## 自建：糖心Vlog解锁网络重写版

| 文件 | 平台 |
|---|---|
| `qx/tangxin-unlock.conf` | QX / Shadowrocket / Stash（含 hostname 占位，需自填域名） |
| `qx/tangxin-unlock.sgmodule` | Surge（完整版：电影详情播放解锁） |
| `qx/tangxin-unlock.plugin` | Loon |
| `qx/tangxin-unlock.js` | 上述规则共用的网络重写脚本 |

- 源：`src/tangxin-vlog.user.js`（浏览器 userscript v2.5.5，作者 ayase+baby）
- 功能：user/info VIP 伪造 / system/info 公告清除 / movie 列表·搜索·详情广告清除
  （响应体 AES-128-ECB 加解密为脚本内置自实现，本地完成，全平台可用）
- 平台差异：电影详情的**播放解锁**依赖作者解析服务（tx-unlock.6ayase.workers.dev），
  仅 Surge/Stash（$httpClient）可用，返回完整解锁响应体（与 userscript 语义一致，
  服务失败时返回占位避免页面刷新）；QX/Loon/小火箭降级为「本地广告清除 + 原响应
  透传」——详情页正常显示但视频仍锁。Clash/mihomo/OpenWrt 不支持 JS 改写，无法使用。
- 域名为 txh<数字>.com 动态族，无法枚举；conf 内为占位域名，使用前换成实际访问域名。
- 视频下载/转封装（mux.js）与悬浮球属页面 DOM 层，网关版没有（预期差异）。

### 更新流程（源脚本升级后）

```bash
python tools/build_tangxin.py     # src/ → qx/ 四个文件重新生成
node   tools/test_tangxin.js Rewrite/qx/tangxin-unlock.js   # Node 沙箱 9 组回归测试
```

### 订阅地址（rules 分支）

```
https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/tangxin-unlock.conf
```

## 上游同步规则

`rewrite.txt` 每行格式：`<仓库内路径> <上游URL>`，由 `tools/sync_upstream.sh` 抓取更新。
自建文件**不要**登记进 rewrite.txt（没有上游，重新生成走 `tools/build_ai_duanju.py`）。
