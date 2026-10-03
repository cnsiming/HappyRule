# -*- coding: utf-8 -*-
"""把「海角视频 会员视频解锁小助手.user.js」（浏览器 userscript）移植为多平台网络重写脚本 + 各平台规则。

移植策略（与 build_ai_duanju.py 同一模式）：
  1. 剥掉 ==UserScript== 头，保留 IIFE 主体；
  2. 'use strict'; 之后插入沙箱垫片：window/document/navigator/location/localStorage/
     atob/btoa/TextEncoder/TextDecoder，以及基于 $httpClient 的 fetch 垫片
     （Surge/Stash 可用；QX/Loon 重写脚本无出站 HTTP 能力，垫片拒绝即可安全降级）；
  3. 末尾 }})(); 前插网络入口：
     - 请求阶段：/api/attachment POST 体改写（video_center -> 免费 topic  trick，纯本地）；
     - 响应阶段：优先调用上游 transformApiBody（异步，Surge 链）；无 $httpClient 时
       走同步子集 __hjSyncTransform（手工镜像上游纯本地分支，跳过需联网的 fetchRealAttachment）；
     - m3u8 响应观察（记录 keyUrl->secretUrl 到持久存储，仅 $httpClient 平台）；
     - key 响应 XOR 还原（仅 $httpClient 平台）；
     - 强制 hjScheme='b'：网关无 WebCrypto，方案 A/B 探测的 AES 校验不可用，方案 B 无需验证。
"""
import io, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "Rewrite", "src", "haijiao-unlock.user.js")
OUT_DIR = os.path.join(ROOT, "Rewrite", "qx")
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx"

MIRROR = r"(?:[\w-]+\.)*(?:[0-9a-fA-F]{8,32}|hj\d+)\.top"
SITE = r"(?:(?:[\w-]+\.)*haijiao\.com|" + MIRROR + ")"
API_PATHS = (r"banner/banner_list|attachment|topic/\d+|"
             r"video-center/video/(?:detail|list|related-list)|"
             r"video/(?:checkVideoCanPlay|user_list|list|\d+)")
RESP_RE = r"^https?:\/\/" + SITE + r"\/api\/(?:" + API_PATHS + r")(?:\?|$)"
REQ_RE = r"^https?:\/\/" + SITE + r"\/api\/attachment(?:\?|$)"
M3U8_RE = r"^https?:\/\/" + MIRROR + r"\/.*\.m3u8(?:\?|$)"
KEY_RE = r"^https?:\/\/" + MIRROR + r"\/.*\.key(?:\?|$)"
SCRIPT_URL = RAW + "/haijiao-unlock.js"

src = io.open(SRC, encoding="utf-8").read()

# ---- 1. 剥掉 ==UserScript== 头，保留 IIFE 主体 ----
i = src.index("==/UserScript==")
body = src[i + len("==/UserScript=="):]
j = body.index("(function () {")
body = body[j:]

# ---- 2. 'use strict'; 之后插入沙箱垫片 ----
SHIM = r'''

/* ===================================================================
 * 网络重写沙箱垫片（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 * 这些环境没有 window/document/atob 等浏览器全局对象，这里提供最小垫片，
 * 使页面级钩子安装代码（patchFetch/patchXHR/悬浮球 UI）自然空转，
 * 网络入口在脚本末尾执行。
 * 出站 HTTP 仅 Surge/Stash（$httpClient）可用；QX/Loon 重写脚本不支持
 * 脚本内发请求，相关功能自动降级为「纯响应补丁」，不会破坏请求。
 * =================================================================== */
var window = {};
var navigator = { userAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36", platform: "Linux armv8l", language: "zh-CN" };
var location = { hostname: "haijiao.com", host: "haijiao.com", href: "https://haijiao.com/", search: "", protocol: "https:", origin: "https://haijiao.com" };
var localStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
var sessionStorage = { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
var document = {
  body: null, cookie: "", documentElement: null, readyState: "loading",
  addEventListener: function () {}, removeEventListener: function () {},
  createElement: function () { return { style: {}, classList: { add: function () {}, remove: function () {} }, setAttribute: function () {}, appendChild: function () {}, addEventListener: function () {}, set innerHTML(v) {}, get innerHTML() { return ""; } }; },
  querySelector: function () { return null; }, getElementById: function () { return null; },
  head: null, querySelectorAll: function () { return []; }
};
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
/* ---- 出站 HTTP 后端：$httpClient（Surge/Stash）---- */
var __hjHttpClient = (typeof $httpClient !== "undefined") ? $httpClient : null;
/* fetch 垫片：仅供脚本内部下载（m3u8/key/secret/附件 POST），页面 fetch 不会被调用 */
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
        arrayBuffer: function () {
          if (!ab) { ab = new ArrayBuffer(u8.length); new Uint8Array(ab).set(u8); }
          return Promise.resolve(ab);
        },
        text: function () { return Promise.resolve(__hdUtf8Dec(u8)); }
      });
    });
  });
};
'''

anchor = "'use strict';"
k = body.index(anchor) + len(anchor)
body = body[:k] + SHIM + body[k:]

# ---- 3. 末尾 }})(); 前插入网络入口 ----
ENTRY = r'''

/* ===================================================================
 * 网络重写入口（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 *
 * 请求阶段：/api/attachment POST 体改写（video_center -> 免费 topic，纯本地）
 * 响应阶段：
 *   - banner / video-center / checkVideoCanPlay / topic / user/current / 通用 vipLimit
 *     纯本地补丁全平台可用；
 *   - 视频/音频真实地址（fetchRealAttachment  trick）与 m3u8 key 异或还原
 *     需要脚本内发起 HTTP，仅 Surge/Stash（$httpClient）可用；
 *   - QX/Loon 走同步子集 __hjSyncTransform，跳过联网步骤，其余一致。
 * 任何异常/不匹配都安全回落为不改写。强制 hjScheme='b'（网关无 WebCrypto，
 * 竞速探测的 AES 校验不可用，方案 B 依靠 key 拦截，无需验证）。
 * =================================================================== */
try {
  hjScheme = "b";
  var __hjHasHTTP = (typeof $httpClient !== "undefined") && __hjHttpClient !== null;
  var __hjStoreRead = function (k) {
    try { if (typeof $persistentStore !== "undefined") return $persistentStore.read(k); } catch (e) {}
    try { if (typeof $prefs !== "undefined") return $prefs.valueForKey(k); } catch (e) {}
    return null;
  };
  var __hjStoreWrite = function (k, v) {
    try { if (typeof $persistentStore !== "undefined") return $persistentStore.write(v, k); } catch (e) {}
    try { if (typeof $prefs !== "undefined") return $prefs.setValueForKey(v, k); } catch (e) {}
    return false;
  };
  var __hjToU8 = function (d) {
    if (d == null) return new Uint8Array(0);
    if (typeof d === "string") return __hdUtf8Enc(d);
    if (d instanceof Uint8Array) return d;
    try { return new Uint8Array(d); } catch (e) { return new Uint8Array(0); }
  };
  var __hjBodyText = function () {
    var rb = null;
    try { rb = $response.bodyBytes || $response.rawBody || $response.body || ""; } catch (e) { return ""; }
    return __hdUtf8Dec(rb);
  };
  var __hjFinish = function (out) {
    try {
      var __h = {};
      try { __h = Object.assign({}, $response.headers || {}); } catch (e) {}
      try { __h["Content-Encoding"] = "identity"; } catch (e) {}
      if (typeof out === "string" && out.length) {
        try { $done({ body: out, headers: __h }); } catch (e) { $done({}); }
      } else { $done({}); }
    } catch (e) { try { $done({}); } catch (e2) {} }
  };
  /* 同步子集：镜像上游 transformApiBody 的纯本地分支（无 $httpClient 平台使用）。
   * 上游更新时若纯本地分支变化需同步此处。 */
  var __hjSyncTransform = function (url, headers, text) {
    var body = safeJson(text);
    if (!body) return null;
    if (url.indexOf("/api/banner/banner_list") !== -1) { body.data = ENC_NULL; return JSON.stringify(body); }
    if (/\/api\/video-center\//.test(url)) {
      if (!body.data) return null;
      var vc = tryDecode3(body.data);
      if (!vc) return null;
      forgeVideoCenterPlayable(vc);
      body.data = encode3(JSON.stringify(vc));
      counts.attachment++;
      updateFab();
      return JSON.stringify(body);
    }
    if (url.indexOf("/api/video/checkVideoCanPlay") !== -1) {
      if (!body.data) return null;
      var sv = tryDecode3(body.data);
      if (!sv || typeof sv !== "object") return null;
      if (Number(sv.type) >= 2) { sv.type = 1; sv.message = ""; counts.shortvideo++; updateFab(); }
      body.data = encode3(JSON.stringify(sv));
      return JSON.stringify(body);
    }
    if (/\/api\/topic\/\d+/.test(url)) {
      var token = getHeader(headers, "x-user-token");
      if (!token) return null;
      loginState = true; updateFab();
      if (!body.data) return null;
      var a = tryDecode3(body.data);
      if (!a) return null;
      var vipNode = !!(a.node && Number(a.node.vipLimit) > 0);
      forgePurchased(a);
      scrubVipLimit(a);
      if (a.sale) { a.sale.is_buy = true; a.sale.buy_index = 9999; }
      a.currentUserPurchased = true;
      var video = null, audio = null;
      if (Array.isArray(a.attachments)) {
        video = a.attachments.find(function (x) { return x.category === "video" && x.id; }) || null;
        audio = a.attachments.find(function (x) { return x.category === "audio" && x.id; }) || null;
      }
      var gatedContent = vipNode || (typeof a.content === "string" && a.content.indexOf('class="sell-btn"') !== -1);
      var inlineVideo = !!(video && gatedContent && typeof a.content === "string" && a.content.indexOf("<video") === -1);
      unlockImageContent(a, vipNode);
      if (inlineVideo) {
        a.content += '<video src="" data-id="' + video.id + '"></video>';
      }
      if (audio && typeof a.content === "string") {
        var audioUrl = audio.remoteUrl || "";
        if (/^https?:.*\.(mp3|m4a|aac|ogg|wav|flac)(\?|$)/i.test(audioUrl)) {
          var audioHtml = '<audio src="' + escapeAttr(audioUrl) + '" controls="controls" controlslist="nodownload" id="showaudio" data-id="' + audio.id + '"></audio>';
          if (a.content.indexOf("<audio") !== -1) {
            a.content = a.content.replace(/(<audio\b[^>]*?)src="[^"]*"/i, '$1src="' + escapeAttr(audioUrl) + '"');
          } else {
            if (a.content.indexOf('class="sell-btn"') === -1) a.content += audioHtml;
            else a.content = a.content.replace(/<p>\s*<span class="sell-btn"[^>]*>.*?<\/span><\/span>\s*<\/p>|<span class="sell-btn"[^>]*>.*?<\/span><\/span>/gs, audioHtml);
            if (a.content.indexOf("<audio") === -1) a.content += audioHtml;
          }
          if (a.content.indexOf("免费脚本，禁止贩卖") === -1) prependHtml(a, creditHtml("音频帖子解锁来自 " + TG_BABY));
        }
      }
      var SELL_RE = /<p>\s*<span class="sell-btn"[^>]*>.*?<\/span><\/span>\s*<\/p>|<span class="sell-btn"[^>]*>.*?<\/span><\/span>/gs;
      if (typeof a.content === "string" && a.content.indexOf('class="sell-btn"') !== -1) {
        var price = "";
        if (a.sale && Number(a.sale.amount) > 0) {
          price = "，售价 " + (Number(a.sale.money_type) === 2 ? (Number(a.sale.amount) / 100).toFixed(2) + " 钻石" : Number(a.sale.amount) + " 金币");
        }
        a.content = a.content.replace(SELL_RE, "");
        a.content += '<div style="color:#888;font-size:13px;margin:12px 0;">此贴正文已被服务端隐藏' + price + "，客户端无法还原，需购买后才能查看完整内容</div>";
      }
      body.data = encode3(JSON.stringify(a));
      counts.topic++;
      updateFab();
      showToast("✅ 免费脚本，禁止贩卖，正在解析");
      return JSON.stringify(body);
    }
    if (url.indexOf("/api/user/current") !== -1) {
      if (!body.data) return null;
      var u = tryDecode3(body.data);
      if (!forgeUserVip(u)) return null;
      body.data = encode3(JSON.stringify(u));
      return JSON.stringify(body);
    }
    if (body.data) {
      var g = tryDecode3(body.data);
      if (g && scrubVipLimit(g) > 0) {
        body.data = encode3(JSON.stringify(g));
        return JSON.stringify(body);
      }
    }
    return null;
  };

  if (typeof $request !== "undefined") {
    var __url = $request.url || "";
    var __headers = $request.headers || {};

    if (typeof $response === "undefined") {
      /* ---------- 请求阶段：attachment POST 体改写 ---------- */
      var __reqHit = false;
      try {
        if (/\/api\/attachment(\?|$)/.test(__url) && $request.body) {
          var __nb = rewriteVcAttachmentBody($request.body);
          if (__nb !== $request.body) { __reqHit = true; $done({ body: __nb }); }
        }
      } catch (e) {}
      if (!__reqHit) { try { $done({}); } catch (e) {} }
    } else {
      /* ---------- 响应阶段 ---------- */
      var __done = false;
      /* key 请求 XOR 还原（仅 Surge/Stash） */
      if (!__done && __hjHasHTTP && new RegExp("^https?://" + HJ_MIRROR_HOST + "/.*\\.key(?:\\?|$)").test(__url)) {
        var __kbs = null;
        try { __kbs = $response.bodyBytes || $response.rawBody || null; } catch (e) {}
        var __kmap = null;
        try { __kmap = JSON.parse(__hjStoreRead("hj_keymap") || "{}"); } catch (e) { __kmap = {}; }
        var __secUrl = __kmap[__url];
        if (__kbs && __secUrl) {
          __done = true;
          __hjHttpClient.get({ url: __secUrl, responseType: "arraybuffer" }, function (e2, r2, d2) {
            try {
              if (e2) { $done({}); return; }
              var keyB = __hjToU8(__kbs), secB = __hjToU8(d2);
              if (keyB.length !== 16 || secB.length < 16) { $done({}); return; }
              var real = new Uint8Array(16);
              for (var i = 0; i < 16; i++) real[i] = keyB[i] ^ secB[i];
              $done({ bodyBytes: real, headers: { "Content-Type": "application/octet-stream", "Content-Length": "16" } });
            } catch (e3) { try { $done({}); } catch (e4) {} }
          });
        }
      }
      /* m3u8 观察：记录 keyUrl -> secretUrl（仅 Surge/Stash，供后续 key 还原） */
      if (!__done && __hjHasHTTP && RX_M3U8.test(__url)) {
        __done = true;
        try {
          observePlaylist(__url, __hjBodyText());
          var __m = null;
          try { __m = JSON.parse(__hjStoreRead("hj_keymap") || "{}"); } catch (e) { __m = {}; }
          keyMap.forEach(function (v, kk) { __m[kk] = v.secretUrl; });
          var __ks = Object.keys(__m);
          if (__ks.length > 300) { for (var __i = 0; __i < __ks.length - 300; __i++) delete __m[__ks[__i]]; }
          __hjStoreWrite("hj_keymap", JSON.stringify(__m));
        } catch (e) {}
        $done({});
      }
      /* API 响应改写（RX_API_ALL 与上游 XHR 钩子一致：全部 /api/ 进入，由各分支自行判断） */
      if (!__done) {
        if (RX_API_ALL.test(__url)) {
          __done = true;
          if (__hjHasHTTP) {
            try {
              transformApiBody(__url, __headers, __hjBodyText()).then(__hjFinish, function () { try { $done({}); } catch (e) {} });
            } catch (e) { try { $done({}); } catch (e2) {} }
          } else {
            try { __hjFinish(__hjSyncTransform(__url, __headers, __hjBodyText())); } catch (e) { try { $done({}); } catch (e2) {} }
          }
        }
      }
      if (!__done) { try { $done({}); } catch (e) {} }
    }
  }
} catch (e) { try { $done({}); } catch (e2) {} }
'''

tail = body.rstrip()
assert tail.endswith("})();"), "unexpected tail"
body = tail[: -len("})();")] + ENTRY + "\n})();\n"

HEADER = """/******************************************
 * @name 海角视频解锁·网络重写版 (haijiao-unlock)
 * @description 海角视频(haijiao.com 及 *.top 镜像) 会员解锁：
 *   banner 广告清除 / 视频中心解锁 / 短视频试看解除 / 帖子付费/VIP 伪造 /
 *   付费图片还原 / 音频直链修正 / 用户 VIP 标识伪造。
 *   由浏览器 userscript「海角视频 会员视频解锁小助手 v1.4.5」(ayase+baby) 移植。
 *
 * 平台能力差异：
 *   Surge / Stash（$httpClient）：完整功能——视频/音频真实地址解析
 *     （免费资源位 trick）、m3u8 加密 key 异或还原（方案 B）。
 *   QX / Loon / Shadowrocket / Egern：重写脚本内无法发起出站 HTTP，
 *     仅纯响应补丁（上述除真实地址解析/key 还原外的全部功能），
 *     视频帖的真实播放地址解析不可用，图片帖/短视频/VIP 伪造不受影响。
 *   Clash/mihomo/OpenWrt：不支持 JS 改写，无法使用。
 *
 * 配套规则：
 *   QX / Shadowrocket / Stash : Rewrite/qx/haijiao.conf
 *   Surge                     : Rewrite/qx/haijiao.sgmodule
 *   Loon                      : Rewrite/qx/haijiao.plugin
 *
 * 远程地址（rules 分支）：
 *   %s
 *
 * 注意：
 *   1. 镜像站为动态域名（8~32 位十六进制或 hj+数字 .top），无法枚举进
 *      hostname；默认仅 haijiao.com。使用镜像站需自行在 MITM hostname
 *      添加对应镜像域名（或按注释对整个 *.top 开 MITM，自行权衡风险）。
 *   2. m3u8/key 改写仅在 Surge/Stash 且镜像域名已加入 MITM 时生效。
 *   3. 与浏览器 userscript 不冲突；同时使用效果更佳（userscript 负责
 *      页面 DOM，本脚本负责网关层 API）。
 ******************************************/
""" % SCRIPT_URL

out_js = HEADER + body
os.makedirs(OUT_DIR, exist_ok=True)
with io.open(os.path.join(OUT_DIR, "haijiao-unlock.js"), "w", encoding="utf-8", newline="\n") as f:
    f.write(out_js)
print("JS written:", len(out_js), "chars")

# ---- QX conf ----
qx = """# ===================================================================
# 海角视频解锁 · 网络重写版  (QX / Shadowrocket / Stash 通用)
# 功能：banner 广告清除 / 视频中心解锁 / 短视频试看解除 / 帖子付费与 VIP 伪造
#       / 付费图片还原 / 音频直链修正 / 用户 VIP 标识伪造
# 脚本：%s
# 生成自：海角视频 会员视频解锁小助手.user.js v1.4.5（作者 ayase+baby）
#
# 用法：QX -> [rewrite_remote] 添加本文件 raw 地址；[mitm] hostname 已含
#       Shadowrocket / Stash -> 直接订阅本文件（兼容 QX 重写语法）
#
# 限制（QX/小火箭/Loon 重写脚本无法发起出站 HTTP）：
#   - 视频/音频帖的真实播放地址解析不可用（仅 Surge 完整版支持）
#   - 图片帖 / 短视频 / VIP 伪造 / 广告清除不受影响（Stash 支持 $httpClient 时除外）
#
# 镜像站说明：海角镜像域名为动态域名（8~32 位十六进制或 hj+数字 .top），
# 无法枚举。默认仅 haijiao.com；如使用镜像站，把镜像域名加进下面 hostname
# （例如：hostname = haijiao.com, *.haijiao.com, abcd1234.top），
# 切勿对整个 *.top 开 MITM，除非你清楚风险。
# ===================================================================

hostname = haijiao.com, *.haijiao.com

# 响应改写：会员解锁 / 广告清除 / 付费图片还原 / VIP 伪造
%s url script-response-body %s

# 请求改写：观影券附件请求体改写（resource_type video_center -> 免费 topic，勿单独关闭）
%s url script-request-body %s
""" % (SCRIPT_URL, RESP_RE, SCRIPT_URL, REQ_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "haijiao.conf"), "w", encoding="utf-8", newline="\n") as f:
    f.write(qx)
print("QX conf written")

# ---- Surge sgmodule ----
surge = """#!name=海角视频解锁
#!desc=海角视频(haijiao.com 及 .top 镜像) 会员解锁 · 网络重写版（由 userscript v1.4.5 移植）。完整功能含真实地址解析与 m3u8 key 还原；镜像域名为动态 .top 域名，使用镜像站需自行把镜像域名加入 MITM（不建议对整个 *.top 开 MITM）。
#!author=ayase+baby（移植：网络重写版）
#!version=1.4.5-net.1
#!system=ios,mac

[Script]
海角视频·响应 = type=http-response,pattern=%s,requires-body=1,timeout=20,script-path=%s
海角视频·附件请求 = type=http-request,pattern=%s,requires-body=1,timeout=15,script-path=%s
# 以下两条需镜像域名已在 MITM 中才生效（m3u8 观察 + 加密 key 异或还原）：
海角视频·m3u8观察 = type=http-response,pattern=%s,requires-body=1,timeout=15,script-path=%s
海角视频·key还原 = type=http-response,pattern=%s,requires-body=1,binary-body-mode=1,timeout=20,script-path=%s

[MITM]
hostname = %%APPEND%% haijiao.com, *.haijiao.com
# 镜像站（动态 .top 域名）请按需追加，例如：hostname = %%APPEND%% hj123456.top
""" % (RESP_RE, SCRIPT_URL, REQ_RE, SCRIPT_URL, M3U8_RE, SCRIPT_URL, KEY_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "haijiao.sgmodule"), "w", encoding="utf-8", newline="\n") as f:
    f.write(surge)
print("Surge module written")

# ---- Loon plugin ----
loon = """#!name=海角视频解锁
#!desc=海角视频(haijiao.com) 会员解锁 · 网络重写版（由 userscript v1.4.5 移植）。Loon 重写脚本无法发起出站 HTTP：视频/音频真实地址解析与 key 还原不可用，图片帖/短视频/VIP 伪造/广告清除不受影响。
#!author=ayase+baby（移植：网络重写版）
#!version=1.4.5-net.1
#!system=ios

[Script]
http-response %s script-path=%s, requires-body=true, timeout=20, tag=海角视频·响应
http-request %s script-path=%s, requires-body=true, timeout=15, tag=海角视频·附件请求

[MITM]
hostname = haijiao.com, *.haijiao.com
# 镜像站（动态 .top 域名）请按需追加
""" % (RESP_RE, SCRIPT_URL, REQ_RE, SCRIPT_URL)
with io.open(os.path.join(OUT_DIR, "haijiao.plugin"), "w", encoding="utf-8", newline="\n") as f:
    f.write(loon)
print("Loon plugin written")
