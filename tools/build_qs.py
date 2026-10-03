# -*- coding: utf-8 -*-
"""把「QS(妻社)会员视频解锁小助手.user.js」（浏览器 userscript）移植为多平台网络重写脚本 + 各平台规则。

QS 脚本特点（与海角/糖心不同）：
  - @grant none，纯本地 JSON 响应补丁（VIP 用户组伪造 / 帖子与附件付费解锁 / 广告配置清除），
    无任何外部 HTTP 依赖 -> 全平台（QX/Loon/Surge/Stash/小火箭）功能等价；
  - 搜索限流解除靠请求头 deviceid 轮换（每 id 2 次额度，localStorage 持久化）。
    网关版把 localStorage 垫片接到 $persistentStore/$prefs，轮换状态跨请求保持；
  - 站点域名为动态域名族（qishe*/qs*/7she...），无法枚举进 hostname，
    conf 默认不放行任何域名，由用户把自己访问的域名加进 MITM（注释有说明）。

生成器模式与 build_haijiao.py 一致：剥头 -> 垫片 -> 入口。
"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "Rewrite", "src", "qs-unlock.user.js")
OUT_DIR = os.path.join(ROOT, "Rewrite", "qx")
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx"

API_RE = r"^https?:\/\/[^\/]+\/(?:source\/plugin\/qsts_app\/index\.php|mserver)(?:\/|$|\?)"
SCRIPT_URL = RAW + "/qs-unlock.js"

src = io.open(SRC, encoding="utf-8").read()

# ---- 1. 剥头，保留 IIFE ----
i = src.index("==/UserScript==")
body = src[i + len("==/UserScript=="):]
j = body.index("(function () {")
body = body[j:]

# 降噪：尾部加载日志
body = body.replace('console.log("[" + NAME + "] 妻社 会员解锁小助手（油猴版）已加载");', "")

# ---- 2. 沙箱垫片（插到 "use strict"; 之后） ----
SHIM = r'''

/* ===================================================================
 * 网络重写沙箱垫片（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 * 使页面级 XHR/fetch 钩子安装与悬浮球 UI 自然空转，网络入口在脚本末尾。
 * localStorage 接到 $persistentStore/$prefs，deviceid 轮换状态跨请求保持。
 * =================================================================== */
var window = { top: null, self: null };
var navigator = { userAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36", platform: "Linux armv8l", language: "zh-CN" };
var location = { hostname: "qishe1.com", host: "qishe1.com", href: "https://qishe1.com/", search: "", pathname: "/", protocol: "https:", origin: "https://qishe1.com" };
var __qsStoreRead = function (k) {
  try { if (typeof $persistentStore !== "undefined") return $persistentStore.read(k); } catch (e) {}
  try { if (typeof $prefs !== "undefined") return $prefs.valueForKey(k); } catch (e) {}
  return null;
};
var __qsStoreWrite = function (k, v) {
  try { if (typeof $persistentStore !== "undefined") return $persistentStore.write(String(v), k); } catch (e) {}
  try { if (typeof $prefs !== "undefined") return $prefs.setValueForKey(String(v), k); } catch (e) {}
  return false;
};
var localStorage = {
  getItem: function (k) { return __qsStoreRead("qs_ls_" + k); },
  setItem: function (k, v) { __qsStoreWrite("qs_ls_" + k, v); },
  removeItem: function (k) { __qsStoreWrite("qs_ls_" + k, null); }
};
var sessionStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
var document = {
  body: null, cookie: "", documentElement: null, readyState: "loading", hidden: true,
  addEventListener: function () {}, removeEventListener: function () {},
  createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, setAttribute: function () {}, appendChild: function () {}, addEventListener: function () {}, set innerHTML(v) {}, get innerHTML() { return ""; } }; },
  querySelector: function () { return null; }, getElementById: function () { return null; },
  head: null, querySelectorAll: function () { return []; }
};
var XMLHttpRequest = function () {};
XMLHttpRequest.prototype = { open: null, setRequestHeader: null, send: null };
'''

anchor = '"use strict";'
k = body.index(anchor) + len(anchor)
body = body[:k] + SHIM + body[k:]

# ---- 3. 网络入口（在末尾 })(); 前插入） ----
ENTRY = r'''

/* ===================================================================
 * 网络重写入口（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 * 请求阶段：搜索接口 deviceid 轮换（每 id 2 次额度，持久化）
 * 响应阶段：isApiUrl -> transformBody 纯本地 JSON 补丁；
 *           搜索限流响应标记 deviceid 耗尽（下次自动换新）。
 * 全部逻辑为本地改写，各平台功能一致；任何异常安全透传。
 * =================================================================== */
try {
  if (typeof $request !== "undefined") {
    var __url = $request.url || "";
    var __isApi = isApiUrl(__url);
    var __finishBody = function (out) {
      try {
        if (typeof out === "string" && out.length) {
          var __h = {};
          try { __h = Object.assign({}, $response.headers || {}); } catch (e) {}
          try { __h["Content-Encoding"] = "identity"; } catch (e) {}
          try { $done({ body: out, headers: __h }); } catch (e) { $done({}); }
        } else { $done({}); }
      } catch (e) { try { $done({}); } catch (e2) {} }
    };
    if (typeof $response === "undefined") {
      /* ---------- 请求阶段（script-request-header / http-request） ---------- */
      var __hdrs = null;
      try {
        if (__isApi && isSearchUrl(__url) && $request.headers) {
          var __src = $request.headers;
          var __name = null;
          Object.keys(__src).forEach(function (k) { if (String(k).toLowerCase() === "deviceid") __name = k; });
          if (__name) {
            __hdrs = Object.assign({}, __src);
            __hdrs[__name] = pickDeviceId();
          }
        }
      } catch (e) {}
      try { if (__hdrs) { $done({ headers: __hdrs }); } else { $done({}); } } catch (e) {}
    } else {
      /* ---------- 响应阶段（script-response-body / http-response） ---------- */
      if (__isApi) {
        var __text = "";
        try {
          __text = $response.body || "";
          if (!__text && $response.bodyBytes) {
            var __rb = $response.bodyBytes;
            if (typeof __rb !== "string") {
              if (__rb instanceof ArrayBuffer) __rb = new Uint8Array(__rb);
              else if (__rb.buffer instanceof ArrayBuffer) __rb = new Uint8Array(__rb.buffer, __rb.byteOffset || 0, __rb.byteLength);
              var __s = "";
              for (var __i = 0; __i < __rb.length; __i++) __s += String.fromCharCode(__rb[__i]);
              __text = __s;
            }
          }
        } catch (e) {}
        try { if (isSearchLimitBody(__text, __url)) markSearchExhausted(); } catch (e) {}
        var __out = null;
        try { __out = transformBody(__text, __url); } catch (e) {}
        try {
          if (typeof __out === "string" && __out.length && __out !== __text) __finishBody(__out);
          else $done({});
        } catch (e) { try { $done({}); } catch (e2) {} }
      } else {
        try { $done({}); } catch (e) {}
      }
    }
  }
} catch (e) { try { $done({}); } catch (e2) {} }
'''

tail = body.rstrip()
assert tail.endswith("})();"), "unexpected tail"
body = tail[: -len("})();")] + ENTRY + "\n})();\n"

HEADER = """/******************************************
 * @name 妻社(QS)解锁·网络重写版 (qs-unlock)
 * @description 妻社/QS 系列站点 VIP 解锁：用户组伪造(终身VIP) / 付费帖子与附件
 *   解锁 / 广告配置清除 / 搜索次数限制解除(deviceid 轮换)。
 *   由浏览器 userscript「QS会员视频解锁小助手 v1.5.0」(彭于晏+ayase) 移植。
 *   纯本地 JSON 响应补丁，QX / Loon / Surge / Stash / Shadowrocket 功能一致。
 *   Clash/mihomo/OpenWrt 不支持 JS 改写，无法使用。
 *
 * 配套规则：
 *   QX / Shadowrocket / Stash : Rewrite/qx/qs-unlock.conf
 *   Surge                     : Rewrite/qx/qs-unlock.sgmodule
 *   Loon                      : Rewrite/qx/qs-unlock.plugin
 *
 * 远程地址（rules 分支）：
 *   %s
 *
 * 注意：
 *   1. 站点为动态域名族（qishe/qs/7she/qsgg 前缀家族，随时换后缀），无法枚举进
 *      hostname；使用前必须把你在浏览器里实际访问的域名加入 MITM hostname
 *      （conf 里有说明和示例），否则规则不会生效。
 *   2. 接口路径特征为 /source/plugin/qsts_app/index.php/* 与 /mserver/*，
 *      规则按路径匹配，任何域名加上 MITM 后即生效。
 *   3. 与浏览器 userscript 不冲突；DOM 悬浮球属页面层，网关版没有（属预期差异）。
 ******************************************/
""" % SCRIPT_URL

out_js = HEADER + body
os.makedirs(OUT_DIR, exist_ok=True)
with io.open(os.path.join(OUT_DIR, "qs-unlock.js"), "w", encoding="utf-8", newline="\n") as f:
    f.write(out_js)
print("JS written:", len(out_js), "chars")

# ---- QX conf ----
qx = """# ===================================================================
# 妻社(QS)解锁 · 网络重写版  (QX / Shadowrocket / Stash 通用)
# 功能：VIP 用户组伪造 / 付费帖子与附件解锁 / 广告配置清除 / 搜索限流解除
# 脚本：%s
# 生成自：QS会员视频解锁小助手.user.js v1.5.0（作者 彭于晏+ayase）
#
# 【必看】站点域名为动态域名族（qishe*/qs*/7she/qsgg*/qsiosxz*/smzf* 等，
# 随时改名换数字后缀），无法预置进 hostname。
# 使用方法：先正常在浏览器打开妻社站点，看到当前域名（例如 qishegg56.com）后：
#   1) 把本文件内容复制到 QX 的 rewrite_local（或自建 conf）
#   2) 把下面 hostname 一行的 example 换成你的实际域名
# 规则按接口路径匹配（/source/plugin/qsts_app/index.php/* 与 /mserver/*），
# 域名加对即生效，换域名只需改 hostname。
#
# 用法：两条脚本规则都要启用（请求阶段负责搜索 deviceid 轮换，响应阶段负责解锁）
# ===================================================================

hostname = qishe.example.com

# 响应改写：VIP 伪造 / 付费解锁 / 广告清除
%s url script-response-body %s

# 请求改写：搜索接口 deviceid 轮换（每 deviceid 2 次额度，自动换新）
%s url script-request-header %s
""" % (SCRIPT_URL, API_RE, SCRIPT_URL, API_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "qs-unlock.conf"), "w", encoding="utf-8", newline="\n") as f:
    f.write(qx)
print("QX conf written")

# ---- Surge sgmodule ----
surge = """#!name=妻社(QS)解锁
#!desc=妻社/QS 系列站点 VIP 解锁 · 网络重写版（由 userscript v1.5.0 移植）。纯本地补丁，全平台功能一致。站点为动态域名族，使用前需把实际访问域名加入 MITM（见模块注释）。
#!author=彭于晏+ayase（移植：网络重写版）
#!version=1.5.0-net.1
#!system=ios,mac

[Script]
妻社·响应 = type=http-response,pattern=%s,requires-body=1,timeout=15,script-path=%s
妻社·搜索轮换 = type=http-request,pattern=%s,timeout=10,script-path=%s

[MITM]
# 把实际访问的妻社域名追加到下一行（动态域名族，无法预置），例如：
# hostname = %%APPEND%% qishegg56.com, www.qishegg56.com
""" % (API_RE, SCRIPT_URL, API_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "qs-unlock.sgmodule"), "w", encoding="utf-8", newline="\n") as f:
    f.write(surge)
print("Surge module written")

# ---- Loon plugin ----
loon = """#!name=妻社(QS)解锁
#!desc=妻社/QS 系列站点 VIP 解锁 · 网络重写版（由 userscript v1.5.0 移植）。纯本地补丁。站点为动态域名族，使用前需把实际访问域名加入 MITM。
#!author=彭于晏+ayase（移植：网络重写版）
#!version=1.5.0-net.1
#!system=ios

[Script]
http-response %s script-path=%s, requires-body=true, timeout=15, tag=妻社·响应
http-request %s script-path=%s, timeout=10, tag=妻社·搜索轮换

[MITM]
# 把实际访问的妻社域名写进下一行（动态域名族，无法预置）
hostname = qishe.example.com
""" % (API_RE, SCRIPT_URL, API_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "qs-unlock.plugin"), "w", encoding="utf-8", newline="\n") as f:
    f.write(loon)
print("Loon plugin written")
