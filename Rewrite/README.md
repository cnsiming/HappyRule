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

## 上游同步规则

`rewrite.txt` 每行格式：`<仓库内路径> <上游URL>`，由 `tools/sync_upstream.sh` 抓取更新。
自建文件**不要**登记进 rewrite.txt（没有上游，重新生成走 `tools/build_ai_duanju.py`）。
