# -*- coding: utf-8 -*-
"""把 ai短剧助手bg.user.js（浏览器 userscript）移植为多平台网络重写脚本 + 各平台规则。"""
import io, os

# 以 tools/ 所在仓库为根
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "Rewrite", "src", "ai-duanju-bg.user.js")
OUT_DIR = os.path.join(ROOT, "Rewrite", "qx")
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx"

DOMAINS = ["cocoaview.cc","hdmgdj.com","sxqirtho.top","qicuknlj.top","ferncider.cc","hvthtcpa.top",
"onyxripple.cc","vivifable.top","kucvcxrv.cc","larkgarden.top","niniharbor.top","larksummit.icu",
"lzlukvca.cc","fdxqupvz.cc","huangguoai.com","huangguoai.ai","huangguo4.com","zxzddtzt.cc",
"ediayikma.cc","iwgsqufx.cc","nbsito.top","tideember.cc","momodrift.top","zuzuspot.top","zuzucast.top",
"glowcanvas.cc","eyeonneb.cc","cocoacider.cc","nbyuikk.top","reefbloom.icu","yoyoflow.cc","riripixel.cc",
"iriscider.cc","bobacast.icu","tamaripple.cc","pomrrsrm.cc","svlyibwt.cc","hddj01.com","hddj02.com",
"hddj03.com","voltwillow.cc","yuhterdss.cc","hddj08.com","hddj09.com","hddj22.com"]

AD_NETS = ["jcjoss.com","fkm6sqh.cc","hmw3nbp.cc","qy4wb8k.cc","xwd6gwp.cc"]

API_PATHS = ("system/info|ad/policy|user/info|user/home|user/vip|user/favorite|drama/play|drama/doBuy|"
"drama/detail|drama/navBlock|drama/navFilter|drama/searchResult|drama/more|drama/rank|drama/topicDetail|"
"drama/topicList|drama/favorite|drama/love|drama/wish|movie/navBlock|movie/detail|movie/navFilter|"
"movie/favorite|movie/love|movie/history|search/movie|up/episodePreview|up/bannerList|up/episodeFeed|"
"up/recommend|up/home|up/content|up/episodeList|up/detail|up/unlock|up/access|up/subscribe")
PLAY_PATHS = "drama/play|up/episodePreview"

DOM_RE = "|".join(d.replace(".", r"\.") for d in DOMAINS)
HOSTNAME_LINE = ", ".join(sum(([d, "*." + d] for d in DOMAINS), []))
AD_RE = "|".join(d.replace(".", r"\.") for d in AD_NETS)

RESP_RE = r"^https?:\/\/([\w-]+\.)?(?:" + DOM_RE + r")\/api\/(?:" + API_PATHS + r")(?:\?|$)"
PLAY_RE = r"^https?:\/\/([\w-]+\.)?(?:" + DOM_RE + r")\/api\/(?:" + PLAY_PATHS + r")(?:\?|$)"
SCRIPT_URL = RAW + "/ai-duanju-unlock.js"

src = io.open(SRC, encoding="utf-8").read()

# ---- 1. 剥掉 ==UserScript== 头，保留 IIFE 主体 ----
i = src.index("==/UserScript==")
body = src[i + len("==/UserScript=="):]
j = body.index("(function () {")
body = body[j:]

# ---- 2. "use strict"; 之后插入网络沙箱垫片 ----
SHIM = r'''

/* ===================================================================
 * 网络重写沙箱垫片（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 * 这些环境没有 window / TextEncoder 等浏览器全局对象，这里提供最小垫片，
 * 使下方的页面级钩子安装代码自然空转，网络入口在最后执行。
 * =================================================================== */
try { if (typeof window === "undefined" && typeof globalThis !== "undefined") globalThis.window = {}; } catch (e) {}
try {
  if (typeof globalThis !== "undefined") {
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
      globalThis.TextDecoder = function () {};
      globalThis.TextDecoder.prototype.decode = function (u8) { return __hdUtf8Dec(u8); };
    }
    if (typeof TextEncoder === "undefined") {
      globalThis.TextEncoder = function () {};
      globalThis.TextEncoder.prototype.encode = function (s) { return __hdUtf8Enc(s); };
    }
  }
} catch (e) {}
'''

anchor = '"use strict";'
k = body.index(anchor) + len(anchor)
body = body[:k] + SHIM + body[k:]

# ---- 3. Sr 内每次响应都打印的 console.log 降噪为 t.debug ----
body = body.replace("try{console.log(`[HD] response body", "try{t.debug(`[HD] response body")

# ---- 3b. 修复上游明文分支的 CJK 损坏：JSON 字符串先按 UTF-8 编码为二进制串再交给 br() ----
_PLAIN_OLD = 'return t.debug("原始为明文 JSON，返回明文"),{body:d,payload:s}'
_PLAIN_NEW = ('return t.debug("原始为明文 JSON，返回明文"),'
              '{body:(function(e){let t="";for(let r=0;r<e.length;r+=32768)'
              't+=String.fromCharCode.apply(null,e.subarray(r,r+32768));return t})(__hdUtf8Enc(d)),payload:s}')
assert _PLAIN_OLD in body, "plaintext branch pattern not found"
body = body.replace(_PLAIN_OLD, _PLAIN_NEW)

# ---- 4. 在最后的 })(); 前插入网络重写入口 ----
ENTRY = r'''

/* ===================================================================
 * 网络重写入口（QX / Surge / Loon / Stash / Shadowrocket / Egern）
 * 请求阶段：缓存 drama/play 请求体（requestId 关联），供响应阶段构造免费线路
 * 响应阶段：解密 -> 按接口分发 handler(VIP解锁/去广告) -> 重加密 -> $done
 * 匹配不到的接口原样透传，任何异常都安全回落为不改写。
 * =================================================================== */
try {
  if (typeof $request !== "undefined") {
    var __hdReq = { url: $request.url || "", method: String($request.method || "GET").toUpperCase(), headers: $request.headers || {} };
    var __hdRid = HD_headerGet(__hdReq.headers, "requestid") || HD_headerGet(__hdReq.headers, "requestId") || "";
    var __hdDt  = HD_headerGet(__hdReq.headers, "devicetype") || HD_headerGet(__hdReq.headers, "deviceType") || "web";

    if (typeof $response === "undefined") {
      /* ---------- 请求阶段（script-request-body / http-request） ---------- */
      try {
        if (/\/api\/(?:drama\/play|up\/episodePreview)/.test(__hdReq.url) && __hdRid) {
          var __parsed = null;
          try { __parsed = HD_parseBody($request.body || "", __hdRid, __hdDt); } catch (e) {}
          if (__parsed && __parsed.json) {
            var __data = __parsed.json.data || __parsed.json;
            var __ctx = { id: String(__data.id || ""), seq: String(__data.seq || ""), drama_id: String(__data.drama_id || __data.id || "") };
            if (__ctx.id) {
              try { HD_CTX_BY_RID[__hdRid] = __ctx; } catch (e) {}
              try { if (typeof $persistentStore !== "undefined") $persistentStore.write(JSON.stringify({ rid: __hdRid, ctx: __ctx }), "ai_dj_play_ctx"); } catch (e) {}
            }
          }
        }
      } catch (e) {}
      try { $done({}); } catch (e) {}
    } else {
      /* ---------- 响应阶段（script-response-body / http-response） ---------- */
      var __ctxHit = null;
      try { __ctxHit = (__hdRid && HD_CTX_BY_RID[__hdRid]) || null; } catch (e) {}
      if (!__ctxHit) {
        try {
          var __saved = (typeof $persistentStore !== "undefined") ? $persistentStore.read("ai_dj_play_ctx") : null;
          if (__saved) {
            var __sv = JSON.parse(__saved);
            if (__sv && __sv.ctx && __sv.ctx.id && (!__sv.rid || !__hdRid || __sv.rid === __hdRid)) __ctxHit = __sv.ctx;
          }
        } catch (e) {}
      }
      if (__ctxHit && __ctxHit.id) { try { __hdReq.__cachedBody = __ctxHit; } catch (e) {} }

      var __rb = $response.bodyBytes || $response.rawBody || $response.body || "";
      var __resp = {
        url: __hdReq.url, method: __hdReq.method,
        headers: Object.assign({}, $response.headers || {}),
        status: $response.status || $response.statusCode || 200,
        statusText: "", bodyBytes: __rb
      };
      var __finish = function (out) {
        try {
          if (out && out.body && out.body.length) {
            var __h = out.headers || __resp.headers || {};
            try { __h["Content-Encoding"] = "identity"; } catch (e) {}
            if (typeof out.body === "string") {
              try { $done({ body: out.body, headers: __h }); } catch (e) { $done({}); }
            } else {
              try { $done({ bodyBytes: out.body, headers: __h }); }
              catch (e) {
                try { $done({ body: Array.prototype.map.call(out.body, function (b) { return String.fromCharCode(b); }).join(""), headers: __h }); }
                catch (e2) { $done({}); }
              }
            }
          } else {
            $done({});
          }
        } catch (e) { try { $done({}); } catch (e2) {} }
      };
      try {
        var __r0 = (typeof Sr === "function") ? Sr(__hdReq, __resp) : null;
        if (__r0 && typeof __r0.then === "function") {
          __r0.then(__finish, function () { try { $done({}); } catch (e) {} });
        } else {
          __finish(__r0);
        }
      } catch (e) { try { $done({}); } catch (e2) {} }
    }
  }
} catch (e) { try { $done({}); } catch (e2) {} }
'''

tail = body.rstrip()
assert tail.endswith("})();"), "unexpected tail"
body = tail[: -len("})();")] + ENTRY + "\n})();\n"

HEADER = """/******************************************
 * @name ai短剧助手·网络重写版 (ai-duanju-unlock)
 * @description 短剧平台（黄豆/黄果系共 %d 个域名）VIP 解锁 + 广告接口清除。
 *   由浏览器 userscript「ai短剧助手bg v1.1.7」移植为 QX / Surge / Loon / Stash / Shadowrocket / Egern 网络重写脚本。
 *   原脚本的 DOM 广告清理部分（CSS 注入/MutationObserver）无法在网关层实现，仍建议浏览器端保留 userscript；
 *   本脚本负责 API 层：会员信息伪造、价格清零、广告策略清空、播放接口免费线路构造。
 * @author morgan
 * @version 1.1.7-net.1
 *
 * 配套规则：
 *   QX  / Shadowrocket / Stash : Rewrite/qx/ai-duanju.conf
 *   Surge                      : Rewrite/qx/ai-duanju.sgmodule
 *   Loon                       : Rewrite/qx/ai-duanju.plugin
 *
 * 远程地址（rules 分支）：
 *   %s
 *
 * 注意：加密接口（AES-CBC，key 由 requestId+deviceType 派生）需要客户端支持
 *   bodyBytes 二进制读写：QX>=1.4.0 / Stash / Surge(开 binary-body-mode) / 新版 Loon。
 *   不支持的客户端会自动透传，不会破坏请求。
 ******************************************/
""" % (len(DOMAINS), SCRIPT_URL)

out_js = HEADER + body
os.makedirs(OUT_DIR, exist_ok=True)
with io.open(os.path.join(OUT_DIR, "ai-duanju-unlock.js"), "w", encoding="utf-8", newline="\n") as f:
    f.write(out_js)
print("JS written:", len(out_js), "chars")

# ---- QX conf ----
qx = """# ===================================================================
# ai短剧助手 · 网络重写版  (QX / Shadowrocket / Stash 通用)
# 功能：短剧平台（黄豆/黄果系 %d 个域名）VIP 解锁 + 广告接口清除
# 脚本：%s
# 生成自：ai短剧助手bg.user.js v1.1.7（作者 morgan）
#
# 用法：QX   -> [rewrite_remote] 添加本文件 raw 地址；[mitm] 已含 hostname
#       Shadowrocket / Stash -> 直接订阅本文件（兼容 QX 重写语法）
# 注意：加密接口需要客户端支持 bodyBytes（QX>=1.4.0 / Stash / 新版小火箭）；
#       播放免费线路构造依赖请求阶段缓存，两条脚本规则都需要启用。
# ===================================================================

hostname = %s

# 响应改写：会员解锁 / 广告策略 / 价格清零 / 播放线路
%s url script-response-body %s

# 播放请求体缓存：为响应阶段构造免费 m3u8 线路提供参数（勿单独关闭）
%s url script-request-body %s

# 黄果系广告网络域名直连拦截（对应 userscript 的 hdAdBlockFetchUrl）
^https?:\\/\\/([\\w-]+\\.)?(%s)\\/ url reject-200
""" % (len(DOMAINS), SCRIPT_URL, HOSTNAME_LINE, RESP_RE, SCRIPT_URL, PLAY_RE, SCRIPT_URL, AD_RE)
with io.open(os.path.join(OUT_DIR, "ai-duanju.conf"), "w", encoding="utf-8", newline="\n") as f:
    f.write(qx)
print("QX conf written")

# ---- Surge sgmodule ----
surge = """#!name=ai短剧助手
#!desc=短剧平台（黄豆/黄果系 %d 个域名）VIP 解锁 + 广告接口清除 · 网络重写版（由 ai短剧助手bg v1.1.7 移植）
#!author=morgan
#!version=1.1.7-net.1
#!system=ios,mac

[Script]
ai短剧助手·响应 = type=http-response,pattern=%s,requires-body=1,binary-body-mode=1,timeout=15,script-path=%s
ai短剧助手·播放请求 = type=http-request,pattern=%s,requires-body=1,timeout=15,script-path=%s

[MITM]
hostname = %%APPEND%% %s

# 备注：binary-body-mode=1 用于读写 AES 加密二进制响应体；
# 黄果系广告网络域名（%s）如有需要可在 [Rule] 自行 REJECT。
""" % (len(DOMAINS), RESP_RE, SCRIPT_URL, PLAY_RE, SCRIPT_URL, HOSTNAME_LINE, ", ".join(AD_NETS))
with io.open(os.path.join(OUT_DIR, "ai-duanju.sgmodule"), "w", encoding="utf-8", newline="\n") as f:
    f.write(surge)
print("Surge module written")

# ---- Loon plugin ----
loon = """#!name=ai短剧助手
#!desc=短剧平台（黄豆/黄果系 %d 个域名）VIP 解锁 + 广告接口清除 · 网络重写版（由 ai短剧助手bg v1.1.7 移植）
#!author=morgan
#!version=1.1.7-net.1
#!system=ios

[Script]
http-response %s script-path=%s, requires-body=true, timeout=15, tag=ai短剧助手·响应
http-request %s script-path=%s, requires-body=true, timeout=15, tag=ai短剧助手·播放请求

[MITM]
hostname = %s
""" % (len(DOMAINS), RESP_RE, SCRIPT_URL, PLAY_RE, SCRIPT_URL, HOSTNAME_LINE)
with io.open(os.path.join(OUT_DIR, "ai-duanju.plugin"), "w", encoding="utf-8", newline="\n") as f:
    f.write(loon)
print("Loon plugin written")
