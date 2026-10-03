# -*- coding: utf-8 -*-
"""把「糖心Vlog 会员视频解锁小助手.user.js」（浏览器 userscript）移植为多平台网络重写脚本 + 各平台规则。

糖心脚本特点：
  - 响应体为 AES-128-ECB + base64（密钥内置、自实现，无 WebCrypto 依赖），本地可解；
  - user/info / system/info / movie/block / movie/search / movie/detail 的
    广告清除与 VIP 伪造全部本地（adsStrip + rewriteLocal），全平台可用；
  - movie/detail 的播放解锁依赖作者解析服务 tx-unlock.6ayase.workers.dev
    （unlockOne -> apiPost /v1/unlock）。网关版仅在 Surge/Stash（$httpClient）走
    完整替换语义；QX/Loon 降级为「本地广告清除 + 原响应透传」（视频仍锁，页面正常）；
  - 页面 fetch/XHR 钩子为全接管代理模式，网关版不调用，垫片使其空转；
  - 域名为 txh<数字>.com 动态族，无法枚举进 hostname，conf 由用户自填。

生成器模式与 build_haijiao.py / build_qs.py 一致：剥头 -> 垫片 -> 入口。
"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "Rewrite", "src", "tangxin-vlog.user.js")
OUT_DIR = os.path.join(ROOT, "Rewrite", "qx")
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx"

HOST = r"(?:[a-z0-9-]+\.)*txh\d+\.com"
API_RE = r"^https?:\/\/" + HOST + r"\/h5\/(?:user\/info|system\/info|movie\/(?:detail|block|search))(?:\?|$)"
DETAIL_RE = r"^https?:\/\/" + HOST + r"\/h5\/movie\/detail(?:\?|$)"
SCRIPT_URL = RAW + "/tangxin-unlock.js"

src = io.open(SRC, encoding="utf-8").read()

# ---- 1. 剥头，保留 IIFE ----
i = src.index("==/UserScript==")
body = src[i + len("==/UserScript=="):]
j = body.index("(function () {")
body = body[j:]

# 降噪：顶部注入日志（W.location.href 在网关里无意义）
body = body.replace('console.log("[TX] 糖心Vlog 解锁油猴脚本已注入:", W.location.href);', "")

# ---- 2. 沙箱垫片 ----
SHIM = r'''

/* ===================================================================
 * 网络重写沙箱垫片（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 * 使页面 fetch/XHR 全接管代理钩子与播放器 UI 自然空转，网络入口在脚本末尾。
 * 出站 HTTP（解析服务 tx-unlock.6ayase.workers.dev）仅 Surge/Stash 可用：
 * GM_xmlhttpRequest 桥接到 $httpClient；QX/Loon 为 undefined，解锁路径自动降级。
 * =================================================================== */
var navigator = { userAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36", platform: "Linux armv8l", language: "zh-CN" };
var location = { hostname: "txh55.com", host: "txh55.com", href: "https://txh55.com/h5/", search: "", pathname: "/h5/", protocol: "https:", origin: "https://txh55.com" };
var window = {
  top: null, self: null, location: location,
  addEventListener: function () {}, removeEventListener: function () {},
  open: function () {}, close: function () {}, focus: function () {},
  matchMedia: function () { return { matches: false, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} }; },
  requestAnimationFrame: function () { return 0; }, cancelAnimationFrame: function () {},
  getComputedStyle: function () { return { getPropertyValue: function () { return ""; } }; },
  scrollTo: function () {}, dispatchEvent: function () { return true; }
};
var localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
var sessionStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
var document = {
  body: null, cookie: "", documentElement: null, readyState: "loading", hidden: true,
  addEventListener: function () {}, removeEventListener: function () {},
  createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, setAttribute: function () {}, appendChild: function () {}, addEventListener: function () {}, set innerHTML(v) {}, get innerHTML() { return ""; }, canPlayType: function () { return ""; } }; },
  querySelector: function () { return null; }, getElementById: function () { return null; },
  head: null, querySelectorAll: function () { return []; }, createElementNS: function () { return this.createElement(); }
};
var setInterval = function () { return 0; };
var clearInterval = function () {};
/* ---- 纯 JS base64（JSC 环境通常没有 atob/btoa）---- */
var __hjB64c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var atob = function (input) {
  var str = String(input).replace(/\s+/g, "").replace(/=+$/, ""), out = "";
  for (var i = 0; i < str.length; i += 4) {
    var g = str.substr(i, 4);
    var c1 = __hjB64c.indexOf(g.charAt(0)), c2 = __hjB64c.indexOf(g.charAt(1)),
        c3 = g.length > 2 ? __hjB64c.indexOf(g.charAt(2)) : -1,
        c4 = g.length > 3 ? __hjB64c.indexOf(g.charAt(3)) : -1;
    if (c1 < 0 || c2 < 0) break;
    out += String.fromCharCode((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) out += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
    if (c3 >= 0 && c4 >= 0) out += String.fromCharCode(((c3 & 3) << 6) | c4);
  }
  return out;
};
var btoa = function (input) {
  var str = String(input), out = "";
  for (var i = 0; i < str.length; i += 3) {
    var c1 = str.charCodeAt(i) & 255,
        c2 = i + 1 < str.length ? str.charCodeAt(i + 1) & 255 : null,
        c3 = i + 2 < str.length ? str.charCodeAt(i + 2) & 255 : null;
    out += __hjB64c.charAt(c1 >> 2);
    out += __hjB64c.charAt(((c1 & 3) << 4) | (c2 === null ? 0 : c2 >> 4));
    out += c2 === null ? "=" : __hjB64c.charAt(((c2 & 15) << 2) | (c3 === null ? 0 : c3 >> 6));
    out += c3 === null ? "=" : __hjB64c.charAt(c3 & 63);
  }
  return out;
};
/* ---- UTF-8 编解码 ---- */
var __hdUtf8Enc = function (s) {
  s = String(s); var out = [], i = 0, c;
  for (; i < s.length; i++) {
    c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
    else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) {
      c = 0x10000 + ((c - 0xD800) << 10) + (s.charCodeAt(++i) - 0xDC00);
      out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 0x3F), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    } else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
  }
  return new Uint8Array(out);
};
var __hdUtf8Dec = function (u8) {
  if (u8 == null) return "";
  if (typeof u8 === "string") return u8;
  if (u8 instanceof ArrayBuffer) u8 = new Uint8Array(u8);
  else if (u8.buffer instanceof ArrayBuffer) u8 = new Uint8Array(u8.buffer, u8.byteOffset || 0, u8.byteLength);
  var s = "", i = 0, c, c2, c3, c4;
  while (i < u8.length) {
    c = u8[i++];
    if (c < 0x80) s += String.fromCharCode(c);
    else if (c < 0xE0) { c2 = u8[i++] & 0x3F; s += String.fromCharCode(((c & 0x1F) << 6) | c2); }
    else if (c < 0xF0) { c2 = u8[i++] & 0x3F; c3 = u8[i++] & 0x3F; s += String.fromCharCode(((c & 0x0F) << 12) | (c2 << 6) | c3); }
    else { c2 = u8[i++] & 0x3F; c3 = u8[i++] & 0x3F; c4 = u8[i++] & 0x3F; c = ((c & 0x07) << 18) | (c2 << 12) | (c3 << 6) | c4; c -= 0x10000; s += String.fromCharCode(0xD800 + (c >> 10), 0xDC00 + (c & 0x3FF)); }
  }
  return s;
};
if (typeof TextDecoder === "undefined") {
  try { globalThis.TextDecoder = function () {}; globalThis.TextDecoder.prototype.decode = function (u8) { return __hdUtf8Dec(u8); }; } catch (e) {}
  var TextDecoder = function () {}; TextDecoder.prototype.decode = function (u8) { return __hdUtf8Dec(u8); };
}
if (typeof TextEncoder === "undefined") {
  try { globalThis.TextEncoder = function () {}; globalThis.TextEncoder.prototype.encode = function (s) { return __hdUtf8Enc(s); }; } catch (e) {}
  var TextEncoder = function () {}; TextEncoder.prototype.encode = function (s) { return __hdUtf8Enc(s); };
}
/* ---- 出站 HTTP 后端 + fetch/GM 桥接（Surge/Stash） ---- */
var __hjHttpClient = (typeof $httpClient !== "undefined") ? $httpClient : null;
window.fetch = function (input, init) {
  init = init || {};
  var method = String(init.method || "GET").toUpperCase();
  var url = (typeof input === "string") ? input : ((input && input.url) || String(input || ""));
  var headers = init.headers || {};
  if (typeof Headers !== "undefined" && headers instanceof Headers) { var o = {}; headers.forEach(function (v, k) { o[k] = v; }); headers = o; }
  return new Promise(function (resolve, reject) {
    if (!__hjHttpClient) { reject(new Error("当前平台重写脚本不支持出站请求")); return; }
    var fn = __hjHttpClient[method.toLowerCase()];
    if (typeof fn !== "function") { reject(new Error("unsupported method " + method)); return; }
    var req = { url: url, method: method, headers: headers, responseType: "arraybuffer" };
    if (init.body != null && init.body !== "") req.body = init.body;
    fn.call(__hjHttpClient, req, function (err, resp, data) {
      if (err) { reject(err); return; }
      var status = (resp && (resp.status || resp.statusCode)) || 0;
      var u8;
      try {
        if (typeof data === "string") u8 = __hdUtf8Enc(data);
        else if (data instanceof Uint8Array) u8 = data;
        else u8 = new Uint8Array(data || []);
      } catch (e) { u8 = new Uint8Array(0); }
      var ab = null;
      resolve({
        ok: status >= 200 && status < 300, status: status,
        arrayBuffer: function () { if (!ab) { ab = new ArrayBuffer(u8.length); new Uint8Array(ab).set(u8); } return Promise.resolve(ab); },
        text: function () { return Promise.resolve(__hdUtf8Dec(u8)); }
      });
    });
  });
};
var GM_xmlhttpRequest = __hjHttpClient ? function (opts) {
  var method = String(opts.method || "GET").toUpperCase();
  var req = { url: opts.url, method: method, headers: opts.headers || {} };
  if (opts.data != null) req.body = opts.data;
  if (opts.responseType === "arraybuffer") req.responseType = "arraybuffer";
  try {
    __hjHttpClient[method.toLowerCase()](req, function (err, resp, data) {
      if (err) { if (opts.onerror) opts.onerror(err); return; }
      var r = { status: (resp && (resp.status || resp.statusCode)) || 0, responseText: "", response: null };
      try {
        if (typeof data === "string") r.responseText = data;
        else if (data) { r.response = data; r.responseText = __hdUtf8Dec(data); }
      } catch (e) {}
      if (opts.onload) opts.onload(r);
    });
  } catch (e) { if (opts.onerror) opts.onerror(e); }
} : undefined;
'''

anchor = '"use strict";'
k = body.index(anchor) + len(anchor)
body = body[:k] + SHIM + body[k:]

# ---- 3. 网络入口 ----
ENTRY = r'''

/* ===================================================================
 * 网络重写入口（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 *
 * 请求阶段：缓存 movie/detail POST 请求体（响应阶段向解析服务换解锁结果用）
 * 响应阶段（RX_MATCH 命中）：
 *   - user/info | system/info | movie/block | movie/search | movie/detail(GET)：
 *     rewriteLocal 本地 AES 解密 -> 广告清除/VIP 伪造 -> 重加密（全平台可用）
 *   - movie/detail(POST)：Surge/Stash 走 unlockedDetail（解析服务返回完整替换
 *     响应体，与上游语义一致；失败/无服务时返回 benignDetail 占位）；
 *     QX/Loon 降级为 rewriteLocal 本地补丁 + 原响应透传（视频仍锁，页面可用）。
 * 任何异常安全透传。
 * =================================================================== */
try {
  var __txHasHTTP = (typeof $httpClient !== "undefined") && __hjHttpClient !== null;
  var __txStoreRead = function (k) {
    try { if (typeof $persistentStore !== "undefined") return $persistentStore.read(k); } catch (e) {}
    try { if (typeof $prefs !== "undefined") return $prefs.valueForKey(k); } catch (e) {}
    return null;
  };
  var __txStoreWrite = function (k, v) {
    try { if (typeof $persistentStore !== "undefined") return $persistentStore.write(String(v), k); } catch (e) {}
    try { if (typeof $prefs !== "undefined") return $prefs.setValueForKey(String(v), k); } catch (e) {}
    return false;
  };
  var __txBodyText = function () {
    try {
      var rb = $response.bodyBytes || $response.rawBody || $response.body || "";
      return __hdUtf8Dec(rb);
    } catch (e) { return ""; }
  };
  var __txFinish = function (out) {
    try {
      if (typeof out === "string" && out.length) {
        var __h = {};
        try { __h = Object.assign({}, $response.headers || {}); } catch (e) {}
        try { __h["Content-Encoding"] = "identity"; } catch (e) {}
        try { $done({ body: out, headers: __h }); } catch (e) { $done({}); }
      } else { $done({}); }
    } catch (e) { try { $done({}); } catch (e2) {} }
  };

  if (typeof $request !== "undefined") {
    var __url = $request.url || "";
    var __method = String($request.method || "GET").toUpperCase();
    if (typeof $response === "undefined") {
      /* ---------- 请求阶段：缓存 detail POST 体 ---------- */
      try {
        if (RX_DETAIL.test(__url) && __method === "POST" && $request.body) {
          __txStoreWrite("tx_detail_body", JSON.stringify({ url: __url, body: $request.body }));
        }
      } catch (e) {}
      try { $done({}); } catch (e) {}
    } else {
      /* ---------- 响应阶段 ---------- */
      if (RX_MATCH.test(__url)) {
        var __text = __txBodyText();
        var __isDetailPost = RX_DETAIL.test(__url) && __method === "POST";
        if (__isDetailPost && __txHasHTTP) {
          /* Surge/Stash：完整解锁（解析服务替换语义） */
          var __bodyText = "";
          try {
            var __sv = JSON.parse(__txStoreRead("tx_detail_body") || "null");
            if (__sv && __sv.url === __url && typeof __sv.body === "string") __bodyText = __sv.body;
          } catch (e) {}
          try { __txStoreWrite("tx_detail_body", ""); } catch (e) {}
          if (!__bodyText && $request.body) { try { __bodyText = String($request.body); } catch (e) {} }
          if (__bodyText) {
            try {
              unlockedDetail(__bodyText).then(function (out) {
                try { __txFinish(out || benignDetail()); } catch (e) { try { $done({}); } catch (e2) {} }
              }, function () { try { __txFinish(benignDetail()); } catch (e) { try { $done({}); } catch (e2) {} } });
            } catch (e) { try { __txFinish(benignDetail()); } catch (e2) { try { $done({}); } catch (e3) {} } }
          } else {
            try {
              var __local0 = rewriteLocal(__url, __text);
              if (__local0 && __local0 !== __text) __txFinish(__local0); else $done({});
            } catch (e) { try { $done({}); } catch (e2) {} }
          }
        } else {
          /* 全平台本地补丁（QX/Loon 的 detail POST 也走这里，安全降级） */
          try {
            var __local = rewriteLocal(__url, __text);
            if (__local && __local !== __text) __txFinish(__local); else $done({});
          } catch (e) { try { $done({}); } catch (e2) {} }
        }
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
 * @name 糖心Vlog解锁·网络重写版 (tangxin-unlock)
 * @description 糖心Vlog(txh 数字 .com 动态域名) 会员解锁：user/info VIP 伪造、
 *   system/info 公告清除、movie/block|search|detail 广告清除。
 *   由浏览器 userscript「糖心Vlog 会员视频解锁小助手 v2.5.5」(ayase+baby) 移植。
 *   响应体 AES-128-ECB 加解密为脚本内置自实现，本地可解，全平台可用。
 *
 * 平台能力差异：
 *   Surge / Stash（$httpClient）：movie/detail 播放解锁走作者解析服务
 *     （tx-unlock.6ayase.workers.dev），返回完整解锁响应体；
 *   QX / Loon / Shadowrocket / Egern：重写脚本内无法发起出站 HTTP，
 *     movie/detail 降级为「本地广告清除 + 原响应透传」（视频仍锁、页面正常），
 *     其余接口与 Surge 完全一致。
 *   Clash/mihomo/OpenWrt 不支持 JS 改写，无法使用。
 *
 * 配套规则：
 *   QX / Shadowrocket / Stash : Rewrite/qx/tangxin-unlock.conf
 *   Surge                     : Rewrite/qx/tangxin-unlock.sgmodule
 *   Loon                      : Rewrite/qx/tangxin-unlock.plugin
 *
 * 远程地址（rules 分支）：
 *   %s
 *
 * 注意：
 *   1. 域名为 txh<数字>.com 动态族（txh55.com / txh128.com ...），无法枚举进
 *      hostname；使用前把你在浏览器里实际访问的域名加入 MITM hostname
 *      （conf 里有说明），否则规则不会生效。
 *   2. 视频下载/转封装（mux.js）与悬浮球属页面 DOM 层，网关版没有（预期差异）。
 *   3. 解析服务为第三方（作者维护），可用性不受本仓库控制。
 ******************************************/
""" % SCRIPT_URL

out_js = HEADER + body
os.makedirs(OUT_DIR, exist_ok=True)
with io.open(os.path.join(OUT_DIR, "tangxin-unlock.js"), "w", encoding="utf-8", newline="\n") as f:
    f.write(out_js)
print("JS written:", len(out_js), "chars")

# ---- QX conf ----
qx = """# ===================================================================
# 糖心Vlog解锁 · 网络重写版  (QX / Shadowrocket / Stash 通用)
# 功能：user/info VIP 伪造 / system/info 公告清除 / movie 列表·搜索·详情广告清除
# 脚本：%s
# 生成自：糖心Vlog 会员视频解锁小助手.user.js v2.5.5（作者 ayase+baby）
#
# 【必看】域名为 txh<数字>.com 动态族（txh55.com / txh128.com ...），
# 无法预置进 hostname。使用方法：
#   1) 先在浏览器打开糖心站点，确认当前域名（例如 txh55.com）
#   2) 把本文件复制到 QX 的 rewrite_local（或自建 conf），
#      把下面 hostname 的 example 换成你的实际域名（含 www 子域）
# 限制：QX/小火箭/Loon 重写脚本无法发起出站 HTTP，电影详情的「播放解锁」
# （依赖作者解析服务）不可用——详情页会正常显示但视频仍锁；
# 需要完整解锁请用 Surge 版模块。广告清除与 VIP 伪造全平台可用。
# ===================================================================

hostname = txh55.example.com

# 响应改写：VIP 伪造 / 广告清除（movie/detail 在 QX 上仅本地广告清除）
%s url script-response-body %s

# 请求改写：缓存 movie/detail POST 请求体（供 Surge 完整版换取解锁结果；QX 上无开销）
%s url script-request-body %s
""" % (SCRIPT_URL, API_RE, SCRIPT_URL, DETAIL_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "tangxin-unlock.conf"), "w", encoding="utf-8", newline="\n") as f:
    f.write(qx)
print("QX conf written")

# ---- Surge sgmodule ----
surge = """#!name=糖心Vlog解锁
#!desc=糖心Vlog(txh 数字 .com) 会员解锁 · 网络重写版（由 userscript v2.5.5 移植）。Surge 完整支持电影详情播放解锁（作者解析服务）；域名动态，使用前需把实际访问域名加入 MITM。
#!author=ayase+baby（移植：网络重写版）
#!version=2.5.5-net.1
#!system=ios,mac

[Script]
糖心·响应 = type=http-response,pattern=%s,requires-body=1,timeout=30,script-path=%s
糖心·详情请求体 = type=http-request,pattern=%s,requires-body=1,timeout=10,script-path=%s

[MITM]
# 把实际访问的糖心域名追加到下一行（txh 数字 .com 动态族），例如：
# hostname = %%APPEND%% txh55.com, www.txh55.com
""" % (API_RE, SCRIPT_URL, DETAIL_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "tangxin-unlock.sgmodule"), "w", encoding="utf-8", newline="\n") as f:
    f.write(surge)
print("Surge module written")

# ---- Loon plugin ----
loon = """#!name=糖心Vlog解锁
#!desc=糖心Vlog 会员解锁 · 网络重写版（由 userscript v2.5.5 移植）。Loon 无出站 HTTP：电影详情播放解锁不可用（广告清除/VIP 伪造正常）。域名动态，使用前需把实际访问域名加入 MITM。
#!author=ayase+baby（移植：网络重写版）
#!version=2.5.5-net.1
#!system=ios

[Script]
http-response %s script-path=%s, requires-body=true, timeout=30, tag=糖心·响应
http-request %s script-path=%s, requires-body=true, timeout=10, tag=糖心·详情请求体

[MITM]
# 把实际访问的糖心域名写进下一行（txh 数字 .com 动态族）
hostname = txh55.example.com
""" % (API_RE, SCRIPT_URL, DETAIL_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "tangxin-unlock.plugin"), "w", encoding="utf-8", newline="\n") as f:
    f.write(loon)
print("Loon plugin written")
