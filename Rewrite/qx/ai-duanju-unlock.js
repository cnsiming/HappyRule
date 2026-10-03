/******************************************
 * @name ai短剧助手·网络重写版 (ai-duanju-unlock)
 * @description 短剧平台（黄豆/黄果系共 45 个域名）VIP 解锁 + 广告接口清除。
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
 *   https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/ai-duanju-unlock.js
 *
 * 注意：加密接口（AES-CBC，key 由 requestId+deviceType 派生）需要客户端支持
 *   bodyBytes 二进制读写：QX>=1.4.0 / Stash / Surge(开 binary-body-mode) / 新版 Loon。
 *   不支持的客户端会自动透传，不会破坏请求。
 ******************************************/
(function () {
  "use strict";

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



  var HD_IS_FRAME = (function () { try { return window.top !== window.self; } catch (e) { return true; } })();
  if (HD_IS_FRAME) {
    try {
      var hgFrames = function () {
        var hgDoms = ["fdxqupvz.cc", "huangguoai.com", "huangguoai.ai", "huangguo4.com", "zxzddtzt.cc", "ediayikma.cc"];
        var hgAds  = ["jcjoss.com", "fkm6sqh.cc", "hmw3nbp.cc", "qy4wb8k.cc", "xwd6gwp.cc"];
        function host(h, list) {
          h = String(h || "").toLowerCase();
          for (var i = 0; i < list.length; i++) {
            var d = String(list[i]).toLowerCase();
            if (h === d) return true;
            if (h.length > d.length + 1 && h.slice(h.length - d.length - 1) === "." + d) return true;
          }
          return false;
        }
        function onHg() { try { return host(location.hostname, hgDoms); } catch (e) { return false; } }
        function style() {
          var target = document.head || document.documentElement || document.body;
          if (!target || !target.appendChild) { setTimeout(style, 80); return; }
          if (document.getElementById("hd-hg-fstyle")) return;
          var st = document.createElement("style");
          st.id = "hd-hg-fstyle";
          st.textContent = ".hg-ssp-slot,[data-ssp-slot-key],.hg-ssp-pause,[data-ssp-pause],.hg-ssp-pause__card,.hg-ssp-pause *,.hg-ssp-pause__card *,[data-ssp-render-root],[data-ssp-label]{display:none!important;visibility:hidden!important;pointer-events:none!important}";
          target.appendChild(st);
        }
        function sweep() {
          if (!document.body) return;
          var i, el;
          var els = document.querySelectorAll(".hg-ssp-slot,[data-ssp-slot-key],[data-ssp-pause],.hg-ssp-pause,.hg-ssp-pause__card,[data-ssp-render-root],[data-ssp-label]");
          for (i = 0; i < els.length; i++) { el = els[i]; if (el && el.parentNode) { try { el.remove(); } catch (e) {} } }
          var anchors = document.querySelectorAll("a[href]");
          for (i = 0; i < anchors.length; i++) {
            var a = anchors[i];
            var h = "";
            try { h = new URL(a.getAttribute("href"), location.href).hostname; } catch (e) {}
            if (h && host(h, hgAds)) { try { a.remove(); } catch (e) {} }
          }
        }
        style();
        var go = function () { try { sweep(); } catch (e) {} };
        if (typeof MutationObserver !== "undefined") {
          var obs = new MutationObserver(function () { clearTimeout(obs._t); obs._t = setTimeout(go, 40); });
          var start = function () {
            if (!document.body) { setTimeout(start, 120); return; }
            obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["alt", "class", "hidden", "style"], characterData: false });
            go();
          };
          start();
        }
        setInterval(go, 1000);
      };
      hgFrames();
    } catch (e) {}
    return;
  }


  try { if (!("Cloudflare" in globalThis)) globalThis.Cloudflare = true; } catch (e) {}
  try { if (typeof t !== "undefined" && t) t.logLevel = "warn"; } catch (e) {}


const e=(()=>{const e=e=>e in globalThis;switch(!0){case e("$task"):return"Quantumult X";case e("$loon"):return"Loon";case e("$rocket"):return"Shadowrocket";case e("Egern"):return"Egern";case Boolean(globalThis.$environment?.["surge-version"]):return"Surge";case Boolean(globalThis.$environment?.["stash-version"]):return"Stash";case e("Cloudflare"):return"Worker";case Boolean(globalThis.process?.versions?.node):return"Node.js";default:return}})();class t{static#e=new Map([]);static#t=[];static#r=new Map([]);static clear=()=>{};static count=(e="default")=>{switch(t.#e.has(e)){case!0:t.#e.set(e,t.#e.get(e)+1);break;case!1:t.#e.set(e,0)}t.log(`${e}: ${t.#e.get(e)}`)};static countReset=(e="default")=>{switch(t.#e.has(e)){case!0:t.#e.set(e,0),t.log(`${e}: ${t.#e.get(e)}`);break;case!1:t.warn(`Counter "${e}" doesn’t exist`)}};static debug=(...e)=>{t.#o<4||(e=e.map(e=>`🅱️ ${e}`),t.log(...e))};static error(...r){if(!(t.#o<1)){switch(e){case"Surge":case"Loon":case"Stash":case"Egern":case"Shadowrocket":case"Quantumult X":default:r=r.map(e=>`❌ ${e}`);break;case"Worker":case"Node.js":r=r.map(e=>`❌ ${e?.stack??e}`)}t.log(...r)}}static exception=(...e)=>t.error(...e);static group=e=>t.#t.unshift(e);static groupEnd=()=>t.#t.shift();static info(...e){t.#o<3||(e=e.map(e=>`ℹ️ ${e}`),t.log(...e))}static#o=3;static get logLevel(){switch(t.#o){case 0:return"OFF";case 1:return"ERROR";case 2:return"WARN";case 3:default:return"INFO";case 4:return"DEBUG";case 5:return"ALL"}}static set logLevel(e){switch(typeof e){case"string":e=e.toLowerCase();break;case"number":break;default:e="warn"}switch(e){case 0:case"off":t.#o=0;break;case 1:case"error":t.#o=1;break;case 2:case"warn":case"warning":default:t.#o=2;break;case 3:case"info":t.#o=3;break;case 4:case"debug":t.#o=4;break;case 5:case"all":t.#o=5}}static log=(...e)=>{0!==t.#o&&(e=e.flatMap(e=>{switch(typeof e){case"object":return[JSON.stringify(e)];case"bigint":case"number":case"boolean":return[e.toString()];case"string":return e.split(/\r?\n/u);default:return[e]}}),t.#t.forEach(t=>{(e=e.map(e=>`  ${e}`)).unshift(`▼ ${t}:`)}),e=["",...e],console.log(e.join("\n")))};static time=(e="default")=>t.#r.set(e,Date.now());static timeEnd=(e="default")=>t.#r.delete(e);static timeLog=(e="default")=>{const r=t.#r.get(e);r?t.log(`${e}: ${Date.now()-r}ms`):t.warn(`Timer "${e}" doesn’t exist`)};static warn(...e){t.#o<2||(e=e.map(e=>`⚠️ ${e}`),t.log(...e))}}class r{static escape(e){const t={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};return e.replace(/[&<>"']/g,e=>t[e])}static get(e={},t="",o=void 0){Array.isArray(t)||(t=r.toPath(t));const n=t.reduce((e,t)=>Object(e)[t],e);return void 0===n?o:n}static merge(e,...t){if(null==e)return e;for(const o of t)if(null!=o)for(const t of Object.keys(o)){const n=o[t],i=e[t];switch(!0){case r.#n(n)&&r.#n(i):e[t]=r.merge(i,n);break;case n instanceof Map&&i instanceof Map:if(n.size>0)for(const[e,t]of n)i.set(e,t);break;case n instanceof Set&&i instanceof Set:if(n.size>0)for(const e of n)i.add(e);break;case Array.isArray(n)&&0===n.length&&void 0!==i:case n instanceof Map&&0===n.size&&void 0!==i:case n instanceof Set&&0===n.size&&void 0!==i:break;case void 0!==n:e[t]=n}}return e}static#n(e){if(null===e||"object"!=typeof e)return!1;const t=Object.getPrototypeOf(e);return null===t||t===Object.prototype}static omit(e={},t=[]){return Array.isArray(t)||(t=[t.toString()]),t.forEach(t=>r.unset(e,t)),e}static pick(e={},t=[]){Array.isArray(t)||(t=[t.toString()]);const r=Object.entries(e).filter(([e,r])=>t.includes(e));return Object.fromEntries(r)}static set(e,t,o){return Array.isArray(t)||(t=r.toPath(t)),t.slice(0,-1).reduce((e,r,o)=>Object(e[r])===e[r]?e[r]:e[r]=/^\d+$/.test(t[o+1])?[]:{},e)[t[t.length-1]]=o,e}static toPath(e){return e.replace(/\[(\d+)\]/g,".$1").split(".").filter(Boolean)}static unescape(e){const t={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"};return e.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g,e=>t[e])}static unset(e={},t=""){Array.isArray(t)||(t=r.toPath(t));return t.reduce((e,r,o)=>o===t.length-1?(delete e[r],!0):Object(e)[r],e)}}class o{static parse(e){let t={};switch(typeof e){case"string":{const n=e.replace(/^\?/,"");if(!n)break;const i=Object.fromEntries(n.split("&").filter(Boolean).map(e=>{const[t="",r=""]=e.split("=",2);return[o.#i(t).replace(/\[([^\[\]]+)\]/g,".$1"),o.#i(r).replace(/\"/g,"")]}));Object.keys(i).forEach(e=>r.set(t,e,i[e]));break}case"object":switch(e){case null:break;default:{const o={};Object.keys(e).forEach(t=>r.set(o,t,e[t])),t=o;break}}break;case"undefined":t={}}return t}static stringify(e={}){if(!e||"object"!=typeof e)return"";const t=[];return Object.keys(e).forEach(r=>o.#a(e,r,t)),0===t.length?"":t.map(([e,t])=>`${o.#s(o.#c(e))}=${o.#s(t)}`).join("&")}static#a(e,t,n){const i=r.get(e,t);void 0!==i&&(null!==i?Array.isArray(i)?i.forEach((r,i)=>{void 0!==r&&o.#a(e,`${t}[${i}]`,n)}):o.#n(i)?Object.keys(i).forEach(r=>o.#a(e,`${t}.${r}`,n)):n.push([t,String(i)]):n.push([t,""]))}static#c(e){const[t,...o]=r.toPath(e);return o.reduce((e,t)=>/^\d+$/.test(t)?`${e}[${t}]`:`${e}.${t}`,t)}static#n(e){if(null===e||"object"!=typeof e||Array.isArray(e))return!1;const t=Object.getPrototypeOf(e);return null===t||t===Object.prototype}static#s(e){return encodeURIComponent(e)}static#i(e){return decodeURIComponent(e.replace(/\+/g," "))}}t.debug("☑️ $argument"),globalThis.$argument=o.parse(globalThis.$argument),globalThis.$argument.LogLevel&&(t.logLevel=globalThis.$argument.LogLevel),t.debug("✅ $argument",`$argument: ${JSON.stringify(globalThis.$argument)}`);const n={100:"Continue",101:"Switching Protocols",102:"Processing",103:"Early Hints",200:"OK",201:"Created",202:"Accepted",203:"Non-Authoritative Information",204:"No Content",205:"Reset Content",206:"Partial Content",207:"Multi-Status",208:"Already Reported",226:"IM Used",300:"Multiple Choices",301:"Moved Permanently",302:"Found",304:"Not Modified",307:"Temporary Redirect",308:"Permanent Redirect",400:"Bad Request",401:"Unauthorized",402:"Payment Required",403:"Forbidden",404:"Not Found",405:"Method Not Allowed",406:"Not Acceptable",407:"Proxy Authentication Required",408:"Request Timeout",409:"Conflict",410:"Gone",411:"Length Required",412:"Precondition Failed",413:"Content Too Large",414:"URI Too Long",415:"Unsupported Media Type",416:"Range Not Satisfiable",417:"Expectation Failed",418:"I'm a teapot",421:"Misdirected Request",422:"Unprocessable Entity",423:"Locked",424:"Failed Dependency",425:"Too Early",426:"Upgrade Required",428:"Precondition Required",429:"Too Many Requests",431:"Request Header Fields Too Large",451:"Unavailable For Legal Reasons",500:"Internal Server Error",501:"Not Implemented",502:"Bad Gateway",503:"Service Unavailable",504:"Gateway Timeout",505:"HTTP Version Not Supported",506:"Variant Also Negotiates",507:"Insufficient Storage",508:"Loop Detected",510:"Not Extended",511:"Network Authentication Required"};function i(o={}){switch(e){case"Surge":o.policy&&r.set(o,"headers.X-Surge-Policy",o.policy),t.log("🚩 执行结束!",`🕛 ${(new Date).getTime()/1e3-$script.startTime} 秒`),$done(o);break;case"Loon":o.policy&&(o.node=o.policy),t.log("🚩 执行结束!",`🕛 ${(new Date-$script.startTime)/1e3} 秒`),$done(o);break;case"Stash":o.policy&&r.set(o,"headers.X-Stash-Selected-Proxy",encodeURI(o.policy)),t.log("🚩 执行结束!",`🕛 ${(new Date-$script.startTime)/1e3} 秒`),$done(o);break;case"Egern":case"Shadowrocket":t.log("🚩 执行结束!"),$done(o);break;case"Quantumult X":switch(o.policy&&r.set(o,"opts.policy",o.policy),typeof(o=r.pick(o,["status","url","headers","body","bodyBytes"])).status){case"number":o.status=`HTTP/1.1 ${o.status} ${n[o.status]}`;break;case"string":case"undefined":break;default:throw new TypeError(`${Function.name}: 参数类型错误, status 必须为数字或字符串`)}o.body instanceof ArrayBuffer?(o.bodyBytes=o.body,o.body=void 0):ArrayBuffer.isView(o.body)?(o.bodyBytes=o.body.buffer.slice(o.body.byteOffset,o.body.byteLength+o.body.byteOffset),o.body=void 0):o.body&&(o.bodyBytes=void 0),t.log("🚩 执行结束!"),$done(o);break;case"Worker":default:t.log("🚩 执行结束!");break;case"Node.js":t.log("🚩 执行结束!"),process.exit(1)}}class a{static data=null;static dataFile="box.dat";static nodeBackend=null;static#l=/^@(?<key>[^.]+)(?:\.(?<path>.*))?$/;static getItem(t,o=null){let n=o;switch(t.startsWith("@")){case!0:{const{key:e,path:o}=t.match(a.#l)?.groups;t=e;let i=a.getItem(t,{});"object"!=typeof i&&(i={}),n=r.get(i,o);try{n=JSON.parse(n)}catch{}break}default:switch(e){case"Surge":case"Loon":case"Stash":case"Egern":case"Shadowrocket":n=$persistentStore.read(t);break;case"Quantumult X":n=$prefs.valueForKey(t);break;case"Worker":a.data=a.data??{},n=a.data[t];break;case"Node.js":a.data=a.nodeBackend.load(a.dataFile),n=a.data?.[t];break;default:n=a.data?.[t]||null}try{n=JSON.parse(n)}catch{}}return n??o}static setItem(t=new String,o=new String){let n=!1;if("object"==typeof o)o=JSON.stringify(o);else o=String(o);switch(t.startsWith("@")){case!0:{const{key:e,path:i}=t.match(a.#l)?.groups;t=e;let s=a.getItem(t,{});"object"!=typeof s&&(s={}),r.set(s,i,o),n=a.setItem(t,s);break}default:switch(e){case"Surge":case"Loon":case"Stash":case"Egern":case"Shadowrocket":n=$persistentStore.write(o,t);break;case"Quantumult X":n=$prefs.setValueForKey(o,t);break;case"Worker":a.data=a.data??{},a.data[t]=o,n=!0;break;case"Node.js":a.data=a.nodeBackend.load(a.dataFile),a.data[t]=o,a.nodeBackend.write(a.dataFile,a.data),n=!0;break;default:n=a.data?.[t]||null}}return n}static removeItem(t){let o=!1;switch(t.startsWith("@")){case!0:{const{key:e,path:n}=t.match(a.#l)?.groups;t=e;let i=a.getItem(t);"object"!=typeof i&&(i={}),r.unset(i,n),o=a.setItem(t,i);break}default:switch(e){case"Surge":o=$persistentStore.write(null,t);break;case"Loon":case"Stash":case"Egern":case"Shadowrocket":default:o=!1;break;case"Quantumult X":o=$prefs.removeValueForKey(t);break;case"Worker":a.data=a.data??{},delete a.data[t],o=!0;break;case"Node.js":a.data=a.nodeBackend.load(a.dataFile),delete a.data[t],a.nodeBackend.write(a.dataFile,a.data),o=!0}}return o}static clear(){let t=!1;switch(e){case"Surge":case"Loon":case"Stash":case"Egern":case"Shadowrocket":default:t=!1;break;case"Quantumult X":t=$prefs.removeAllValues();break;case"Worker":a.data={},t=!0;break;case"Node.js":a.data=a.nodeBackend.load(a.dataFile),a.data={},a.nodeBackend.write(a.dataFile,a.data),t=!0}return t}}const s=globalThis.$argument??{};function c(e,t){const r=Object.keys(e||{}).find(e=>e.toLowerCase()===t.toLowerCase());return r?e[r]:""}const l=Object.freeze({passwords:Object.freeze({web:"7961beb44246e3012ce228d6b5ced05a",ios:"6be13f303785864aac6a6cc2cb3c9dc6",android:"c10ca2986a31fb46d4481ce8631c2725"}),imgKey:"525202f9149e061d",ivLength:16,keyLength:32,signPrefix:"Dart",defaultDeviceType:"web"}),d=Object.freeze({logLevel:"hd_log_level"});function u(){const e=function(){const e=a.getItem(d.logLevel,""),t={logLevel:"info"};return e&&(t.logLevel=e),t}();return function(e){if(void 0===s||!s)return;if("object"==typeof s&&!Array.isArray(s)){const{logLevel:t}=s;return void(t&&(e.logLevel=String(t)))}const t=String(s);if(t.startsWith("[")&&t.endsWith("]")){const r=t.slice(1,-1).split(",").map(e=>e.trim());return void(r[0]&&(e.logLevel=r[0]))}const r=Object.fromEntries(new URLSearchParams(t));r.logLevel&&(e.logLevel=decodeURIComponent(r.logLevel))}(e),t.debug(`Settings: ${JSON.stringify(e)}`),e}const f=new Set(["splash","startup_popups"]),p=new Set(["splash_skippable","ad_popup_skippable","ad_pause_skippable","ad_gap_skippable"]),h=new Set(["splash_skippable_vip","ad_popup_vip_skip","ad_pause_vip_skip","ad_gap_vip_skip"]),y=new Set(["splash_time","splash_rotate_secs"]);function v(e){if(!Array.isArray(e)||0===e.length)return!1;let t=!1;for(const r of e)r&&"object"==typeof r&&(Array.isArray(r.ads)&&r.ads.length>0&&(r.ads=[],t=!0),void 0!==r.insert_every&&0!==r.insert_every&&(r.insert_every=0,t=!0));return e.length>0&&(e.length=0,t=!0),t}function _(e){if(!e||"object"!=typeof e)return!1;let t=!1;if(e.ads&&"object"==typeof e.ads)for(const r of Object.keys(e.ads))v(e.ads[r])&&(t=!0);if(e.page_ad_slots&&"object"==typeof e.page_ad_slots)for(const r of Object.keys(e.page_ad_slots)){const o=e.page_ad_slots[r];if(Array.isArray(o))for(const e of o)e&&"object"==typeof e&&(Array.isArray(e.ads)&&e.ads.length>0&&(e.ads=[],t=!0),void 0!==e.insert_every&&0!==e.insert_every&&(e.insert_every=0,t=!0))}for(const r of f)Array.isArray(e[r])&&e[r].length>0&&(e[r]=[],t=!0);for(const r of p)void 0!==e[r]&&"y"!==e[r]&&(e[r]="y",t=!0);for(const r of h)void 0!==e[r]&&"y"!==e[r]&&(e[r]="y",t=!0);for(const r of y)void 0!==e[r]&&"0"!==e[r]&&(e[r]="0",t=!0);return void 0!==e.splash_auto_jump&&"y"!==e.splash_auto_jump&&(e.splash_auto_jump="y",t=!0),void 0!==e.ad_label&&"n"!==e.ad_label&&(e.ad_label="n",t=!0),void 0!==e.place_ad&&""!==e.place_ad&&(e.place_ad="",t=!0),t}function g(e){if(!e||"object"!=typeof e)return!1;let t=!1;return e.data&&"object"==typeof e.data&&(t=_(e.data)||t),t=_(e)||t,t}function b(e){if(!e||"object"!=typeof e)return!1;let t=!1;return"y"!==e.is_vip&&(e.is_vip="y",t=!0),void 0!==e.is_up&&"y"!==e.is_up&&(e.is_up="y",t=!0),void 0!==e.up_status&&1!==e.up_status&&(e.up_status=1,t=!0),void 0!==e.balance&&"999999"!==e.balance&&(e.balance="999999",t=!0),void 0!==e.score&&"999999"!==e.score&&(e.score="999999",t=!0),void 0!==e.level&&"99"!==e.level&&(e.level="99",t=!0),void 0!==e.play_num&&(e.play_num="999999/999999",t=!0),void 0!==e.need_bind_email&&(e.need_bind_email=!1,t=!0),void 0!==e.need_bind_contact&&(e.need_bind_contact=!1,t=!0),void 0===e.group_name||e.group_name||(e.group_name="至尊SVIP",t=!0),void 0===e.group_end_time||e.group_end_time||(e.group_end_time="2099-12-31",t=!0),void 0!==e.nickname&&(e.nickname="免费脚本禁止贩卖",t=!0),t}function m(e){if(!e||"object"!=typeof e)return!1;let t=!1;return t=b(e)||t,e.data&&"object"==typeof e.data&&(t=b(e.data)||t),e.userInfo&&"object"==typeof e.userInfo&&(t=b(e.userInfo)||t),e.user&&"object"==typeof e.user&&(t=b(e.user)||t),t}function w(e){if(!e||"object"!=typeof e)return!1;let t=!1;for(const r of["isFree","free","is_free"])if(void 0!==e[r]){const o=e[r];!0!==o&&"1"!==o&&"y"!==o&&1!==o&&(e[r]="boolean"==typeof o||("number"==typeof o?1:"1"),t=!0)}return void 0!==e.type&&"free"!==e.type&&""!==e.type&&(e.type="free",t=!0),void 0!==e.pay_type&&"free"!==e.pay_type&&""!==e.pay_type&&(e.pay_type="free",t=!0),void 0!==e.price&&"0"!==e.price&&0!==e.price&&(e.price="0",t=!0),void 0!==e.money&&"0"!==e.money&&0!==e.money&&(e.money="0",t=!0),void 0!==e.price_coin&&"0"!==e.price_coin&&0!==e.price_coin&&(e.price_coin="0",t=!0),void 0!==e.cost_gold&&"0"!==e.cost_gold&&0!==e.cost_gold&&(e.cost_gold="0",t=!0),void 0!==e.whole_price_coin&&"0"!==e.whole_price_coin&&0!==e.whole_price_coin&&(e.whole_price_coin="0",t=!0),void 0!==e.corner&&""!==e.corner&&"免费"!==e.corner&&(e.corner="",t=!0),t}function k(e){let t=!1;if(Array.isArray(e))for(const r of e)t=w(r)||k(r)||t;else if(e&&"object"==typeof e){if(t=function(e){if(!e||"object"!=typeof e)return!1;let t=!1;return void 0!==e.ad_insert_every&&0!==e.ad_insert_every&&(e.ad_insert_every=0,t=!0),void 0!==e.ad_source&&""!==e.ad_source&&(e.ad_source="",t=!0),void 0!==e.ad_every&&0!==e.ad_every&&(e.ad_every=0,t=!0),t}(e)||t,Array.isArray(e.items))for(const r of e.items)t=w(r)||t;if(Array.isArray(e.list))for(const r of e.list)t=w(r)||k(r)||t;for(const r of Object.keys(e))"items"!==r&&"list"!==r&&(t=k(e[r])||t)}return t}function x(e){if(!e||"object"!=typeof e)return!1;let t=!1;return t=e.data&&"object"==typeof e.data?k(e.data)||t:k(e)||t,t}function B(e){if(!e||"object"!=typeof e)return!1;let t=!1;void 0!==e.type&&"free"!==e.type&&(e.type="free",t=!0),void 0!==e.is_buy&&!0!==e.is_buy&&(e.is_buy=!0,t=!0),void 0!==e.price&&0!==e.price&&"0"!==e.price&&(e.price=0,t=!0),void 0!==e.money&&0!==e.money&&"0"!==e.money&&(e.money=0,t=!0),void 0!==e.price_coin&&"0"!==e.price_coin&&0!==e.price_coin&&(e.price_coin="0",t=!0),void 0!==e.methods&&Array.isArray(e.methods)&&e.methods.length>0&&(e.methods=[],t=!0);for(const r of["is_free","isFree","free"])void 0!==e[r]&&!0!==e[r]&&"1"!==e[r]&&"y"!==e[r]&&(e[r]=!0,t=!0);return void 0!==e.pay_type&&"free"!==e.pay_type&&""!==e.pay_type&&(e.pay_type="free",t=!0),t}function S(e){if(!e||"object"!=typeof e)return!1;let t=!1;void 0!==e.pay_type&&"free"!==e.pay_type&&""!==e.pay_type&&(e.pay_type="free",t=!0),void 0!==e.money&&"0"!==e.money&&0!==e.money&&(e.money="0",t=!0),void 0!==e.episode_price&&"0"!==e.episode_price&&0!==e.episode_price&&(e.episode_price="0",t=!0),void 0!==e.points_price&&"0"!==e.points_price&&0!==e.points_price&&(e.points_price="0",t=!0),void 0!==e.free_episodes&&e.episodes&&Array.isArray(e.episodes)&&e.free_episodes!==e.episodes.length&&(e.free_episodes=e.episodes.length,t=!0),void 0!==e.vip_episodes&&""!==e.vip_episodes&&e.vip_episodes!==[]&&(e.vip_episodes=[],t=!0),void 0!==e.coin_episodes&&""!==e.coin_episodes&&e.coin_episodes!==[]&&(e.coin_episodes=[],t=!0),void 0!==e.points_episodes&&""!==e.points_episodes&&e.points_episodes!==[]&&(e.points_episodes=[],t=!0),void 0!==e.is_buy_whole&&!0!==e.is_buy_whole&&(e.is_buy_whole=!0,t=!0),void 0!==e.can_vip_watch&&!0!==e.can_vip_watch&&(e.can_vip_watch=!0,t=!0),void 0!==e.corner&&""!==e.corner&&"免费"!==e.corner&&(e.corner="",t=!0),Array.isArray(e.play_ads)&&e.play_ads.length>0&&(e.play_ads=[],t=!0),void 0!==e.play_ads_auto_jump&&"y"!==e.play_ads_auto_jump&&(e.play_ads_auto_jump="y",t=!0),void 0!==e.play_ads_time&&"0"!==e.play_ads_time&&0!==e.play_ads_time&&(e.play_ads_time="0",t=!0);for(const r of["episodes","list","items","episode_list"])if(Array.isArray(e[r]))for(const o of e[r])t=B(o)||t;return t}function A(e){if(!e||"object"!=typeof e)return!1;let t=!1;return t=S(e.data&&"object"==typeof e.data?e.data:e)||t,t=S(e)||t,t}function j(e,t){if(!e||"object"!=typeof e)return!1;let r=!1;if("n"===e.status&&[813004,813005,813006,813103,"813004","813005","813006","813103"].includes(e.errorCode)){const o=t?.__cachedBody||null;if(o&&o.id){const n=function(e){try{const t=String(e).match(/^https?:\/\/([^/]+)/);return t?t[1]:null}catch{return null}}(t?.url),i=function(e,t,r){const o=`https://${r||"cocoaview.cc"}/api/drama/hls/${e}/${t}/play.m3u8?line=free`;return{status:"y",data:{drama_id:String(e),duration:0,hls_key:"",lines:[{name:"free",url:o}],m3u8:o,name:String(t),preview_m3u8:"",seq:Number(t)||t,is_preview:!1,preview_seconds:0},time:(new Date).toISOString().replace("T"," ").slice(0,19)}}(o.id,o.seq||o.drama_id,n);return Object.keys(e).forEach(t=>delete e[t]),Object.assign(e,i),r=!0,r}return!1}const o=e.data&&"object"==typeof e.data?e.data:null;if(o){const _pv=(o.is_preview===!0||o.is_preview==="1")||/preview/i.test(String(o.m3u8||""))||(Array.isArray(o.lines)&&o.lines.some(function(_l){return _l&&/preview/i.test(String(_l.url||""))}));if(_pv){const _cb=(t&&t.__cachedBody)||null;if(_cb&&_cb.id){const _id=_cb.id,_seq=_cb.seq||_cb.drama_id;const _host=function(_u){try{const _x=String(_u).match(/^https?:\/\/([^/]+)/);return _x?_x[1]:null}catch(_e){return null}}(t&&t.url);const _o=`https://${_host||"cocoaview.cc"}/api/drama/hls/${_id}/${_seq}/play.m3u8?line=free`;const _full={status:"y",data:{drama_id:String(_id),duration:0,hls_key:"",lines:[{name:"free",url:_o}],m3u8:_o,name:String(_seq),preview_m3u8:"",seq:Number(_seq)||_seq,is_preview:!1,preview_seconds:0},time:(new Date).toISOString().replace("T"," ").slice(0,19)};Object.keys(e).forEach(function(_k){delete e[_k]});Object.assign(e,_full);return!0}}void 0!==o.is_preview&&!1!==o.is_preview&&"0"!==o.is_preview&&(o.is_preview=!1,r=!0),void 0!==o.preview_seconds&&"0"!==o.preview_seconds&&0!==o.preview_seconds&&(o.preview_seconds="0",r=!0)}return r}function C(e){if(!e||"object"!=typeof e)return!1;let t=!1;return!0!==e.status&&(e.status=!0,t=!0),void 0!==e.error&&(delete e.error,t=!0),void 0!==e.errorCode&&(delete e.errorCode,t=!0),t}function R(e){if(!e||"object"!=typeof e)return!1;let t=!1;return void 0!==e.can_view&&!0!==e.can_view&&(e.can_view=!0,t=!0),void 0!==e.ep_is_free&&!0!==e.ep_is_free&&(e.ep_is_free=!0,t=!0),void 0!==e.ep_price_coin&&0!==e.ep_price_coin&&"0"!==e.ep_price_coin&&(e.ep_price_coin=0,t=!0),void 0!==e.episode_min_coin&&0!==e.episode_min_coin&&"0"!==e.episode_min_coin&&(e.episode_min_coin=0,t=!0),void 0!==e.whole_coin&&0!==e.whole_coin&&"0"!==e.whole_coin&&(e.whole_coin=0,t=!0),void 0!==e.pay_type&&"free"!==e.pay_type&&""!==e.pay_type&&(e.pay_type="free",t=!0),void 0!==e.pay_mode&&""!==e.pay_mode&&"free"!==e.pay_mode&&(e.pay_mode="free",t=!0),void 0!==e.money&&"0"!==e.money&&0!==e.money&&(e.money="0",t=!0),void 0!==e.corner&&""!==e.corner&&(e.corner="",t=!0),t}function $(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e;if(Array.isArray(r?.list))for(const e of r.list)t=R(e)||t;return t}function E(e){return!1}function H(e){if(!e||"object"!=typeof e)return!1;let t=!1;void 0!==e.pay_type&&"free"!==e.pay_type&&""!==e.pay_type&&(e.pay_type="free",t=!0),void 0!==e.money&&"0"!==e.money&&0!==e.money&&(e.money="0",t=!0),void 0!==e.cost_gold&&"0"!==e.cost_gold&&0!==e.cost_gold&&(e.cost_gold="0",t=!0),void 0!==e.is_buy&&!0!==e.is_buy&&(e.is_buy=!0,t=!0),void 0!==e.can_view&&!0!==e.can_view&&(e.can_view=!0,t=!0),void 0!==e.ep_is_free&&!0!==e.ep_is_free&&(e.ep_is_free=!0,t=!0),void 0!==e.ep_price_coin&&0!==e.ep_price_coin&&"0"!==e.ep_price_coin&&(e.ep_price_coin=0,t=!0),void 0!==e.episode_min_coin&&0!==e.episode_min_coin&&"0"!==e.episode_min_coin&&(e.episode_min_coin=0,t=!0),void 0!==e.whole_coin&&0!==e.whole_coin&&"0"!==e.whole_coin&&(e.whole_coin=0,t=!0),void 0!==e.type&&"free"!==e.type&&""!==e.type&&(e.type="free",t=!0);for(const r of["episodes","list","items","episode_list"])if(Array.isArray(e[r]))for(const o of e[r])void 0!==o.type&&"free"!==o.type&&(o.type="free",t=!0),void 0!==o.is_buy&&!0!==o.is_buy&&(o.is_buy=!0,t=!0),void 0!==o.can_view&&!0!==o.can_view&&(o.can_view=!0,t=!0),void 0!==o.ep_is_free&&!0!==o.ep_is_free&&(o.ep_is_free=!0,t=!0),void 0!==o.cost_gold&&"0"!==o.cost_gold&&0!==o.cost_gold&&(o.cost_gold="0",t=!0),void 0!==o.ep_price_coin&&0!==o.ep_price_coin&&"0"!==o.ep_price_coin&&(o.ep_price_coin=0,t=!0),void 0!==o.price&&"0"!==o.price&&0!==o.price&&(o.price="0",t=!0);return t}function z(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e;return t=H(r)||t,t=H(e)||t,r&&Array.isArray(r.play_ads)&&r.play_ads.length>0&&(r.play_ads=[],t=!0),t}function O(e,t){if(!e||"object"!=typeof e)return!1;let r=!1;if(!0!==e.status&&"y"!==e.status){if(e.status=!0,delete e.msg,!e.m3u8){const r=t?.__cachedBody;if(r&&r.id){const o=function(e){try{const t=String(e).match(/^https?:\/\/([^/]+)/);return t?t[1]:null}catch{return null}}(t?.url);e.m3u8=`https://${o||"cocoaview.cc"}/api/drama/hls/${r.id}/0/preview.m3u8?line=free`}}r=!0}return r}function M(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e;return r&&Array.isArray(r.list)&&r.list.length>0&&(r.list=[],t=!0),t}function D(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e;for(const e of["banner","ads","banners","play_ads","features"])Array.isArray(r[e])&&r[e].length>0&&(r[e]=[],t=!0);for(const e of["list","items","dramas","contents"])if(Array.isArray(r[e]))for(const o of r[e])t=R(o)||H(o)||t;return t}function L(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e;t=H(r)||R(r)||t;for(const e of["banner","ads","play_ads","features"])Array.isArray(r[e])&&r[e].length>0&&(r[e]=[],t=!0);return t}function P(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e,o=e=>{e&&"object"==typeof e&&(void 0!==e.type&&"free"!==e.type&&(e.type="free",t=!0),void 0!==e.is_buy&&!0!==e.is_buy&&(e.is_buy=!0,t=!0),void 0!==e.can_view&&!0!==e.can_view&&(e.can_view=!0,t=!0),void 0!==e.ep_is_free&&!0!==e.ep_is_free&&(e.ep_is_free=!0,t=!0),void 0!==e.cost_gold&&"0"!==e.cost_gold&&0!==e.cost_gold&&(e.cost_gold="0",t=!0),void 0!==e.ep_price_coin&&0!==e.ep_price_coin&&"0"!==e.ep_price_coin&&(e.ep_price_coin=0,t=!0),void 0!==e.price&&"0"!==e.price&&0!==e.price&&(e.price="0",t=!0))};if(Array.isArray(r))for(const e of r)o(e);else if(r&&"object"==typeof r)for(const e of["list","items","episodes"])if(Array.isArray(r[e]))for(const t of r[e])o(t);return t}function F(e){if(!e||"object"!=typeof e)return!1;let t=!1;const r=e.data&&"object"==typeof e.data?e.data:e;return!(!r||"object"!=typeof r)&&(void 0!==r.no_ad&&!0!==r.no_ad&&(r.no_ad=!0,t=!0),void 0!==r.pre_roll_ok&&!1!==r.pre_roll_ok&&(r.pre_roll_ok=!1,t=!0),void 0!==r.popup_ok&&!1!==r.popup_ok&&(r.popup_ok=!1,t=!0),void 0!==r.pause_ok&&!1!==r.pause_ok&&(r.pause_ok=!1,t=!0),void 0!==r.insert_every&&0!==r.insert_every&&(r.insert_every=0,t=!0),void 0!==r.pre_roll_every_vip&&0!==r.pre_roll_every_vip&&(r.pre_roll_every_vip=0,t=!0),void 0!==r.pre_roll_every_normal&&0!==r.pre_roll_every_normal&&(r.pre_roll_every_normal=0,t=!0),void 0!==r.base_every_vip&&0!==r.base_every_vip&&(r.base_every_vip=0,t=!0),void 0!==r.base_every_normal&&0!==r.base_every_normal&&(r.base_every_normal=0,t=!0),void 0!==r.popup_every_vip&&0!==r.popup_every_vip&&(r.popup_every_vip=0,t=!0),void 0!==r.popup_every_normal&&0!==r.popup_every_normal&&(r.popup_every_normal=0,t=!0),void 0!==r.pause_every_episodes&&0!==r.pause_every_episodes&&(r.pause_every_episodes=0,t=!0),void 0!==r.session_cap&&0!==r.session_cap&&(r.session_cap=0,t=!0),void 0!==r.apply&&!1!==r.apply&&(r.apply=!1,t=!0),t)}var T="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};function I(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var U={exports:{}};var N,W={exports:{}};function q(){return N||(N=1,W.exports=function(){var e=e||function(e,t){var r;if("undefined"!=typeof window&&window.crypto&&(r=window.crypto),"undefined"!=typeof self&&self.crypto&&(r=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(r=globalThis.crypto),!r&&"undefined"!=typeof window&&window.msCrypto&&(r=window.msCrypto),!r&&void 0!==T&&T.crypto&&(r=T.crypto),!r)try{r=require("crypto")}catch(e){}var o=function(){if(r){if("function"==typeof r.getRandomValues)try{return r.getRandomValues(new Uint32Array(1))[0]}catch(e){}if("function"==typeof r.randomBytes)try{return r.randomBytes(4).readInt32LE()}catch(e){}}throw new Error("Native crypto module could not be used to get secure random number.")},n=Object.create||function(){function e(){}return function(t){var r;return e.prototype=t,r=new e,e.prototype=null,r}}(),i={},a=i.lib={},s=a.Base={extend:function(e){var t=n(this);return e&&t.mixIn(e),t.hasOwnProperty("init")&&this.init!==t.init||(t.init=function(){t.$super.init.apply(this,arguments)}),t.init.prototype=t,t.$super=this,t},create:function(){var e=this.extend();return e.init.apply(e,arguments),e},init:function(){},mixIn:function(e){for(var t in e)e.hasOwnProperty(t)&&(this[t]=e[t]);e.hasOwnProperty("toString")&&(this.toString=e.toString)},clone:function(){return this.init.prototype.extend(this)}},c=a.WordArray=s.extend({init:function(e,r){e=this.words=e||[],this.sigBytes=r!=t?r:4*e.length},toString:function(e){return(e||d).stringify(this)},concat:function(e){var t=this.words,r=e.words,o=this.sigBytes,n=e.sigBytes;if(this.clamp(),o%4)for(var i=0;i<n;i++){var a=r[i>>>2]>>>24-i%4*8&255;t[o+i>>>2]|=a<<24-(o+i)%4*8}else for(var s=0;s<n;s+=4)t[o+s>>>2]=r[s>>>2];return this.sigBytes+=n,this},clamp:function(){var t=this.words,r=this.sigBytes;t[r>>>2]&=4294967295<<32-r%4*8,t.length=e.ceil(r/4)},clone:function(){var e=s.clone.call(this);return e.words=this.words.slice(0),e},random:function(e){for(var t=[],r=0;r<e;r+=4)t.push(o());return new c.init(t,e)}}),l=i.enc={},d=l.Hex={stringify:function(e){for(var t=e.words,r=e.sigBytes,o=[],n=0;n<r;n++){var i=t[n>>>2]>>>24-n%4*8&255;o.push((i>>>4).toString(16)),o.push((15&i).toString(16))}return o.join("")},parse:function(e){for(var t=e.length,r=[],o=0;o<t;o+=2)r[o>>>3]|=parseInt(e.substr(o,2),16)<<24-o%8*4;return new c.init(r,t/2)}},u=l.Latin1={stringify:function(e){for(var t=e.words,r=e.sigBytes,o=[],n=0;n<r;n++){var i=t[n>>>2]>>>24-n%4*8&255;o.push(String.fromCharCode(i))}return o.join("")},parse:function(e){for(var t=e.length,r=[],o=0;o<t;o++)r[o>>>2]|=(255&e.charCodeAt(o))<<24-o%4*8;return new c.init(r,t)}},f=l.Utf8={stringify:function(e){try{return decodeURIComponent(escape(u.stringify(e)))}catch(e){throw new Error("Malformed UTF-8 data")}},parse:function(e){return u.parse(unescape(encodeURIComponent(e)))}},p=a.BufferedBlockAlgorithm=s.extend({reset:function(){this._data=new c.init,this._nDataBytes=0},_append:function(e){"string"==typeof e&&(e=f.parse(e)),this._data.concat(e),this._nDataBytes+=e.sigBytes},_process:function(t){var r,o=this._data,n=o.words,i=o.sigBytes,a=this.blockSize,s=i/(4*a),l=(s=t?e.ceil(s):e.max((0|s)-this._minBufferSize,0))*a,d=e.min(4*l,i);if(l){for(var u=0;u<l;u+=a)this._doProcessBlock(n,u);r=n.splice(0,l),o.sigBytes-=d}return new c.init(r,d)},clone:function(){var e=s.clone.call(this);return e._data=this._data.clone(),e},_minBufferSize:0});a.Hasher=p.extend({cfg:s.extend(),init:function(e){this.cfg=this.cfg.extend(e),this.reset()},reset:function(){p.reset.call(this),this._doReset()},update:function(e){return this._append(e),this._process(),this},finalize:function(e){return e&&this._append(e),this._doFinalize()},blockSize:16,_createHelper:function(e){return function(t,r){return new e.init(r).finalize(t)}},_createHmacHelper:function(e){return function(t,r){return new h.HMAC.init(e,r).finalize(t)}}});var h=i.algo={};return i}(Math);return e}()),W.exports}var X,K={exports:{}};function J(){return X||(X=1,K.exports=function(e){return o=(r=e).lib,n=o.Base,i=o.WordArray,(a=r.x64={}).Word=n.extend({init:function(e,t){this.high=e,this.low=t}}),a.WordArray=n.extend({init:function(e,r){e=this.words=e||[],this.sigBytes=r!=t?r:8*e.length},toX32:function(){for(var e=this.words,t=e.length,r=[],o=0;o<t;o++){var n=e[o];r.push(n.high),r.push(n.low)}return i.create(r,this.sigBytes)},clone:function(){for(var e=n.clone.call(this),t=e.words=this.words.slice(0),r=t.length,o=0;o<r;o++)t[o]=t[o].clone();return e}}),e;var t,r,o,n,i,a}(q())),K.exports}var V,Q={exports:{}};function G(){return V||(V=1,Q.exports=function(e){return function(){if("function"==typeof ArrayBuffer){var t=e.lib.WordArray,r=t.init,o=t.init=function(e){if(e instanceof ArrayBuffer&&(e=new Uint8Array(e)),(e instanceof Int8Array||"undefined"!=typeof Uint8ClampedArray&&e instanceof Uint8ClampedArray||e instanceof Int16Array||e instanceof Uint16Array||e instanceof Int32Array||e instanceof Uint32Array||e instanceof Float32Array||e instanceof Float64Array)&&(e=new Uint8Array(e.buffer,e.byteOffset,e.byteLength)),e instanceof Uint8Array){for(var t=e.byteLength,o=[],n=0;n<t;n++)o[n>>>2]|=e[n]<<24-n%4*8;r.call(this,o,t)}else r.apply(this,arguments)};o.prototype=t}}(),e.lib.WordArray}(q())),Q.exports}var Z,Y={exports:{}};function ee(){return Z||(Z=1,Y.exports=function(e){return function(){var t=e,r=t.lib.WordArray,o=t.enc;function n(e){return e<<8&4278255360|e>>>8&16711935}o.Utf16=o.Utf16BE={stringify:function(e){for(var t=e.words,r=e.sigBytes,o=[],n=0;n<r;n+=2){var i=t[n>>>2]>>>16-n%4*8&65535;o.push(String.fromCharCode(i))}return o.join("")},parse:function(e){for(var t=e.length,o=[],n=0;n<t;n++)o[n>>>1]|=e.charCodeAt(n)<<16-n%2*16;return r.create(o,2*t)}},o.Utf16LE={stringify:function(e){for(var t=e.words,r=e.sigBytes,o=[],i=0;i<r;i+=2){var a=n(t[i>>>2]>>>16-i%4*8&65535);o.push(String.fromCharCode(a))}return o.join("")},parse:function(e){for(var t=e.length,o=[],i=0;i<t;i++)o[i>>>1]|=n(e.charCodeAt(i)<<16-i%2*16);return r.create(o,2*t)}}}(),e.enc.Utf16}(q())),Y.exports}var te,re={exports:{}};function oe(){return te||(te=1,re.exports=function(e){return function(){var t=e,r=t.lib.WordArray;function o(e,t,o){for(var n=[],i=0,a=0;a<t;a++)if(a%4){var s=o[e.charCodeAt(a-1)]<<a%4*2|o[e.charCodeAt(a)]>>>6-a%4*2;n[i>>>2]|=s<<24-i%4*8,i++}return r.create(n,i)}t.enc.Base64={stringify:function(e){var t=e.words,r=e.sigBytes,o=this._map;e.clamp();for(var n=[],i=0;i<r;i+=3)for(var a=(t[i>>>2]>>>24-i%4*8&255)<<16|(t[i+1>>>2]>>>24-(i+1)%4*8&255)<<8|t[i+2>>>2]>>>24-(i+2)%4*8&255,s=0;s<4&&i+.75*s<r;s++)n.push(o.charAt(a>>>6*(3-s)&63));var c=o.charAt(64);if(c)for(;n.length%4;)n.push(c);return n.join("")},parse:function(e){var t=e.length,r=this._map,n=this._reverseMap;if(!n){n=this._reverseMap=[];for(var i=0;i<r.length;i++)n[r.charCodeAt(i)]=i}var a=r.charAt(64);if(a){var s=e.indexOf(a);-1!==s&&(t=s)}return o(e,t,n)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}(),e.enc.Base64}(q())),re.exports}var ne,ie={exports:{}};function ae(){return ne||(ne=1,ie.exports=function(e){return function(){var t=e,r=t.lib.WordArray;function o(e,t,o){for(var n=[],i=0,a=0;a<t;a++)if(a%4){var s=o[e.charCodeAt(a-1)]<<a%4*2|o[e.charCodeAt(a)]>>>6-a%4*2;n[i>>>2]|=s<<24-i%4*8,i++}return r.create(n,i)}t.enc.Base64url={stringify:function(e,t){void 0===t&&(t=!0);var r=e.words,o=e.sigBytes,n=t?this._safe_map:this._map;e.clamp();for(var i=[],a=0;a<o;a+=3)for(var s=(r[a>>>2]>>>24-a%4*8&255)<<16|(r[a+1>>>2]>>>24-(a+1)%4*8&255)<<8|r[a+2>>>2]>>>24-(a+2)%4*8&255,c=0;c<4&&a+.75*c<o;c++)i.push(n.charAt(s>>>6*(3-c)&63));var l=n.charAt(64);if(l)for(;i.length%4;)i.push(l);return i.join("")},parse:function(e,t){void 0===t&&(t=!0);var r=e.length,n=t?this._safe_map:this._map,i=this._reverseMap;if(!i){i=this._reverseMap=[];for(var a=0;a<n.length;a++)i[n.charCodeAt(a)]=a}var s=n.charAt(64);if(s){var c=e.indexOf(s);-1!==c&&(r=c)}return o(e,r,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",_safe_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"}}(),e.enc.Base64url}(q())),ie.exports}var se,ce={exports:{}};function le(){return se||(se=1,ce.exports=function(e){return function(t){var r=e,o=r.lib,n=o.WordArray,i=o.Hasher,a=r.algo,s=[];!function(){for(var e=0;e<64;e++)s[e]=4294967296*t.abs(t.sin(e+1))|0}();var c=a.MD5=i.extend({_doReset:function(){this._hash=new n.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(e,t){for(var r=0;r<16;r++){var o=t+r,n=e[o];e[o]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8)}var i=this._hash.words,a=e[t+0],c=e[t+1],p=e[t+2],h=e[t+3],y=e[t+4],v=e[t+5],_=e[t+6],g=e[t+7],b=e[t+8],m=e[t+9],w=e[t+10],k=e[t+11],x=e[t+12],B=e[t+13],S=e[t+14],A=e[t+15],j=i[0],C=i[1],R=i[2],$=i[3];j=l(j,C,R,$,a,7,s[0]),$=l($,j,C,R,c,12,s[1]),R=l(R,$,j,C,p,17,s[2]),C=l(C,R,$,j,h,22,s[3]),j=l(j,C,R,$,y,7,s[4]),$=l($,j,C,R,v,12,s[5]),R=l(R,$,j,C,_,17,s[6]),C=l(C,R,$,j,g,22,s[7]),j=l(j,C,R,$,b,7,s[8]),$=l($,j,C,R,m,12,s[9]),R=l(R,$,j,C,w,17,s[10]),C=l(C,R,$,j,k,22,s[11]),j=l(j,C,R,$,x,7,s[12]),$=l($,j,C,R,B,12,s[13]),R=l(R,$,j,C,S,17,s[14]),j=d(j,C=l(C,R,$,j,A,22,s[15]),R,$,c,5,s[16]),$=d($,j,C,R,_,9,s[17]),R=d(R,$,j,C,k,14,s[18]),C=d(C,R,$,j,a,20,s[19]),j=d(j,C,R,$,v,5,s[20]),$=d($,j,C,R,w,9,s[21]),R=d(R,$,j,C,A,14,s[22]),C=d(C,R,$,j,y,20,s[23]),j=d(j,C,R,$,m,5,s[24]),$=d($,j,C,R,S,9,s[25]),R=d(R,$,j,C,h,14,s[26]),C=d(C,R,$,j,b,20,s[27]),j=d(j,C,R,$,B,5,s[28]),$=d($,j,C,R,p,9,s[29]),R=d(R,$,j,C,g,14,s[30]),j=u(j,C=d(C,R,$,j,x,20,s[31]),R,$,v,4,s[32]),$=u($,j,C,R,b,11,s[33]),R=u(R,$,j,C,k,16,s[34]),C=u(C,R,$,j,S,23,s[35]),j=u(j,C,R,$,c,4,s[36]),$=u($,j,C,R,y,11,s[37]),R=u(R,$,j,C,g,16,s[38]),C=u(C,R,$,j,w,23,s[39]),j=u(j,C,R,$,B,4,s[40]),$=u($,j,C,R,a,11,s[41]),R=u(R,$,j,C,h,16,s[42]),C=u(C,R,$,j,_,23,s[43]),j=u(j,C,R,$,m,4,s[44]),$=u($,j,C,R,x,11,s[45]),R=u(R,$,j,C,A,16,s[46]),j=f(j,C=u(C,R,$,j,p,23,s[47]),R,$,a,6,s[48]),$=f($,j,C,R,g,10,s[49]),R=f(R,$,j,C,S,15,s[50]),C=f(C,R,$,j,v,21,s[51]),j=f(j,C,R,$,x,6,s[52]),$=f($,j,C,R,h,10,s[53]),R=f(R,$,j,C,w,15,s[54]),C=f(C,R,$,j,c,21,s[55]),j=f(j,C,R,$,b,6,s[56]),$=f($,j,C,R,A,10,s[57]),R=f(R,$,j,C,_,15,s[58]),C=f(C,R,$,j,B,21,s[59]),j=f(j,C,R,$,y,6,s[60]),$=f($,j,C,R,k,10,s[61]),R=f(R,$,j,C,p,15,s[62]),C=f(C,R,$,j,m,21,s[63]),i[0]=i[0]+j|0,i[1]=i[1]+C|0,i[2]=i[2]+R|0,i[3]=i[3]+$|0},_doFinalize:function(){var e=this._data,r=e.words,o=8*this._nDataBytes,n=8*e.sigBytes;r[n>>>5]|=128<<24-n%32;var i=t.floor(o/4294967296),a=o;r[15+(n+64>>>9<<4)]=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8),r[14+(n+64>>>9<<4)]=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),e.sigBytes=4*(r.length+1),this._process();for(var s=this._hash,c=s.words,l=0;l<4;l++){var d=c[l];c[l]=16711935&(d<<8|d>>>24)|4278255360&(d<<24|d>>>8)}return s},clone:function(){var e=i.clone.call(this);return e._hash=this._hash.clone(),e}});function l(e,t,r,o,n,i,a){var s=e+(t&r|~t&o)+n+a;return(s<<i|s>>>32-i)+t}function d(e,t,r,o,n,i,a){var s=e+(t&o|r&~o)+n+a;return(s<<i|s>>>32-i)+t}function u(e,t,r,o,n,i,a){var s=e+(t^r^o)+n+a;return(s<<i|s>>>32-i)+t}function f(e,t,r,o,n,i,a){var s=e+(r^(t|~o))+n+a;return(s<<i|s>>>32-i)+t}r.MD5=i._createHelper(c),r.HmacMD5=i._createHmacHelper(c)}(Math),e.MD5}(q())),ce.exports}var de,ue={exports:{}};function fe(){return de||(de=1,ue.exports=function(e){return r=(t=e).lib,o=r.WordArray,n=r.Hasher,i=t.algo,a=[],s=i.SHA1=n.extend({_doReset:function(){this._hash=new o.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,t){for(var r=this._hash.words,o=r[0],n=r[1],i=r[2],s=r[3],c=r[4],l=0;l<80;l++){if(l<16)a[l]=0|e[t+l];else{var d=a[l-3]^a[l-8]^a[l-14]^a[l-16];a[l]=d<<1|d>>>31}var u=(o<<5|o>>>27)+c+a[l];u+=l<20?1518500249+(n&i|~n&s):l<40?1859775393+(n^i^s):l<60?(n&i|n&s|i&s)-1894007588:(n^i^s)-899497514,c=s,s=i,i=n<<30|n>>>2,n=o,o=u}r[0]=r[0]+o|0,r[1]=r[1]+n|0,r[2]=r[2]+i|0,r[3]=r[3]+s|0,r[4]=r[4]+c|0},_doFinalize:function(){var e=this._data,t=e.words,r=8*this._nDataBytes,o=8*e.sigBytes;return t[o>>>5]|=128<<24-o%32,t[14+(o+64>>>9<<4)]=Math.floor(r/4294967296),t[15+(o+64>>>9<<4)]=r,e.sigBytes=4*t.length,this._process(),this._hash},clone:function(){var e=n.clone.call(this);return e._hash=this._hash.clone(),e}}),t.SHA1=n._createHelper(s),t.HmacSHA1=n._createHmacHelper(s),e.SHA1;var t,r,o,n,i,a,s}(q())),ue.exports}var pe,he={exports:{}};function ye(){return pe||(pe=1,he.exports=function(e){return function(t){var r=e,o=r.lib,n=o.WordArray,i=o.Hasher,a=r.algo,s=[],c=[];!function(){function e(e){for(var r=t.sqrt(e),o=2;o<=r;o++)if(!(e%o))return!1;return!0}function r(e){return 4294967296*(e-(0|e))|0}for(var o=2,n=0;n<64;)e(o)&&(n<8&&(s[n]=r(t.pow(o,.5))),c[n]=r(t.pow(o,1/3)),n++),o++}();var l=[],d=a.SHA256=i.extend({_doReset:function(){this._hash=new n.init(s.slice(0))},_doProcessBlock:function(e,t){for(var r=this._hash.words,o=r[0],n=r[1],i=r[2],a=r[3],s=r[4],d=r[5],u=r[6],f=r[7],p=0;p<64;p++){if(p<16)l[p]=0|e[t+p];else{var h=l[p-15],y=(h<<25|h>>>7)^(h<<14|h>>>18)^h>>>3,v=l[p-2],_=(v<<15|v>>>17)^(v<<13|v>>>19)^v>>>10;l[p]=y+l[p-7]+_+l[p-16]}var g=o&n^o&i^n&i,b=(o<<30|o>>>2)^(o<<19|o>>>13)^(o<<10|o>>>22),m=f+((s<<26|s>>>6)^(s<<21|s>>>11)^(s<<7|s>>>25))+(s&d^~s&u)+c[p]+l[p];f=u,u=d,d=s,s=a+m|0,a=i,i=n,n=o,o=m+(b+g)|0}r[0]=r[0]+o|0,r[1]=r[1]+n|0,r[2]=r[2]+i|0,r[3]=r[3]+a|0,r[4]=r[4]+s|0,r[5]=r[5]+d|0,r[6]=r[6]+u|0,r[7]=r[7]+f|0},_doFinalize:function(){var e=this._data,r=e.words,o=8*this._nDataBytes,n=8*e.sigBytes;return r[n>>>5]|=128<<24-n%32,r[14+(n+64>>>9<<4)]=t.floor(o/4294967296),r[15+(n+64>>>9<<4)]=o,e.sigBytes=4*r.length,this._process(),this._hash},clone:function(){var e=i.clone.call(this);return e._hash=this._hash.clone(),e}});r.SHA256=i._createHelper(d),r.HmacSHA256=i._createHmacHelper(d)}(Math),e.SHA256}(q())),he.exports}var ve,_e={exports:{}};var ge,be={exports:{}};function me(){return ge||(ge=1,be.exports=function(e){return function(){var t=e,r=t.lib.Hasher,o=t.x64,n=o.Word,i=o.WordArray,a=t.algo;function s(){return n.create.apply(n,arguments)}var c=[s(1116352408,3609767458),s(1899447441,602891725),s(3049323471,3964484399),s(3921009573,2173295548),s(961987163,4081628472),s(1508970993,3053834265),s(2453635748,2937671579),s(2870763221,3664609560),s(3624381080,2734883394),s(310598401,1164996542),s(607225278,1323610764),s(1426881987,3590304994),s(1925078388,4068182383),s(2162078206,991336113),s(2614888103,633803317),s(3248222580,3479774868),s(3835390401,2666613458),s(4022224774,944711139),s(264347078,2341262773),s(604807628,2007800933),s(770255983,1495990901),s(1249150122,1856431235),s(1555081692,3175218132),s(1996064986,2198950837),s(2554220882,3999719339),s(2821834349,766784016),s(2952996808,2566594879),s(3210313671,3203337956),s(3336571891,1034457026),s(3584528711,2466948901),s(113926993,3758326383),s(338241895,168717936),s(666307205,1188179964),s(773529912,1546045734),s(1294757372,1522805485),s(1396182291,2643833823),s(1695183700,2343527390),s(1986661051,1014477480),s(2177026350,1206759142),s(2456956037,344077627),s(2730485921,1290863460),s(2820302411,3158454273),s(3259730800,3505952657),s(3345764771,106217008),s(3516065817,3606008344),s(3600352804,1432725776),s(4094571909,1467031594),s(275423344,851169720),s(430227734,3100823752),s(506948616,1363258195),s(659060556,3750685593),s(883997877,3785050280),s(958139571,3318307427),s(1322822218,3812723403),s(1537002063,2003034995),s(1747873779,3602036899),s(1955562222,1575990012),s(2024104815,1125592928),s(2227730452,2716904306),s(2361852424,442776044),s(2428436474,593698344),s(2756734187,3733110249),s(3204031479,2999351573),s(3329325298,3815920427),s(3391569614,3928383900),s(3515267271,566280711),s(3940187606,3454069534),s(4118630271,4000239992),s(116418474,1914138554),s(174292421,2731055270),s(289380356,3203993006),s(460393269,320620315),s(685471733,587496836),s(852142971,1086792851),s(1017036298,365543100),s(1126000580,2618297676),s(1288033470,3409855158),s(1501505948,4234509866),s(1607167915,987167468),s(1816402316,1246189591)],l=[];!function(){for(var e=0;e<80;e++)l[e]=s()}();var d=a.SHA512=r.extend({_doReset:function(){this._hash=new i.init([new n.init(1779033703,4089235720),new n.init(3144134277,2227873595),new n.init(1013904242,4271175723),new n.init(2773480762,1595750129),new n.init(1359893119,2917565137),new n.init(2600822924,725511199),new n.init(528734635,4215389547),new n.init(1541459225,327033209)])},_doProcessBlock:function(e,t){for(var r=this._hash.words,o=r[0],n=r[1],i=r[2],a=r[3],s=r[4],d=r[5],u=r[6],f=r[7],p=o.high,h=o.low,y=n.high,v=n.low,_=i.high,g=i.low,b=a.high,m=a.low,w=s.high,k=s.low,x=d.high,B=d.low,S=u.high,A=u.low,j=f.high,C=f.low,R=p,$=h,E=y,H=v,z=_,O=g,M=b,D=m,L=w,P=k,F=x,T=B,I=S,U=A,N=j,W=C,q=0;q<80;q++){var X,K,J=l[q];if(q<16)K=J.high=0|e[t+2*q],X=J.low=0|e[t+2*q+1];else{var V=l[q-15],Q=V.high,G=V.low,Z=(Q>>>1|G<<31)^(Q>>>8|G<<24)^Q>>>7,Y=(G>>>1|Q<<31)^(G>>>8|Q<<24)^(G>>>7|Q<<25),ee=l[q-2],te=ee.high,re=ee.low,oe=(te>>>19|re<<13)^(te<<3|re>>>29)^te>>>6,ne=(re>>>19|te<<13)^(re<<3|te>>>29)^(re>>>6|te<<26),ie=l[q-7],ae=ie.high,se=ie.low,ce=l[q-16],le=ce.high,de=ce.low;K=(K=(K=Z+ae+((X=Y+se)>>>0<Y>>>0?1:0))+oe+((X+=ne)>>>0<ne>>>0?1:0))+le+((X+=de)>>>0<de>>>0?1:0),J.high=K,J.low=X}var ue,fe=L&F^~L&I,pe=P&T^~P&U,he=R&E^R&z^E&z,ye=$&H^$&O^H&O,ve=(R>>>28|$<<4)^(R<<30|$>>>2)^(R<<25|$>>>7),_e=($>>>28|R<<4)^($<<30|R>>>2)^($<<25|R>>>7),ge=(L>>>14|P<<18)^(L>>>18|P<<14)^(L<<23|P>>>9),be=(P>>>14|L<<18)^(P>>>18|L<<14)^(P<<23|L>>>9),me=c[q],we=me.high,ke=me.low,xe=N+ge+((ue=W+be)>>>0<W>>>0?1:0),Be=_e+ye;N=I,W=U,I=F,U=T,F=L,T=P,L=M+(xe=(xe=(xe=xe+fe+((ue+=pe)>>>0<pe>>>0?1:0))+we+((ue+=ke)>>>0<ke>>>0?1:0))+K+((ue+=X)>>>0<X>>>0?1:0))+((P=D+ue|0)>>>0<D>>>0?1:0)|0,M=z,D=O,z=E,O=H,E=R,H=$,R=xe+(ve+he+(Be>>>0<_e>>>0?1:0))+(($=ue+Be|0)>>>0<ue>>>0?1:0)|0}h=o.low=h+$,o.high=p+R+(h>>>0<$>>>0?1:0),v=n.low=v+H,n.high=y+E+(v>>>0<H>>>0?1:0),g=i.low=g+O,i.high=_+z+(g>>>0<O>>>0?1:0),m=a.low=m+D,a.high=b+M+(m>>>0<D>>>0?1:0),k=s.low=k+P,s.high=w+L+(k>>>0<P>>>0?1:0),B=d.low=B+T,d.high=x+F+(B>>>0<T>>>0?1:0),A=u.low=A+U,u.high=S+I+(A>>>0<U>>>0?1:0),C=f.low=C+W,f.high=j+N+(C>>>0<W>>>0?1:0)},_doFinalize:function(){var e=this._data,t=e.words,r=8*this._nDataBytes,o=8*e.sigBytes;return t[o>>>5]|=128<<24-o%32,t[30+(o+128>>>10<<5)]=Math.floor(r/4294967296),t[31+(o+128>>>10<<5)]=r,e.sigBytes=4*t.length,this._process(),this._hash.toX32()},clone:function(){var e=r.clone.call(this);return e._hash=this._hash.clone(),e},blockSize:32});t.SHA512=r._createHelper(d),t.HmacSHA512=r._createHmacHelper(d)}(),e.SHA512}(q(),J())),be.exports}var we,ke={exports:{}};var xe,Be={exports:{}};function Se(){return xe||(xe=1,Be.exports=function(e){return function(t){var r=e,o=r.lib,n=o.WordArray,i=o.Hasher,a=r.x64.Word,s=r.algo,c=[],l=[],d=[];!function(){for(var e=1,t=0,r=0;r<24;r++){c[e+5*t]=(r+1)*(r+2)/2%64;var o=(2*e+3*t)%5;e=t%5,t=o}for(e=0;e<5;e++)for(t=0;t<5;t++)l[e+5*t]=t+(2*e+3*t)%5*5;for(var n=1,i=0;i<24;i++){for(var s=0,u=0,f=0;f<7;f++){if(1&n){var p=(1<<f)-1;p<32?u^=1<<p:s^=1<<p-32}128&n?n=n<<1^113:n<<=1}d[i]=a.create(s,u)}}();var u=[];!function(){for(var e=0;e<25;e++)u[e]=a.create()}();var f=s.SHA3=i.extend({cfg:i.cfg.extend({outputLength:512}),_doReset:function(){for(var e=this._state=[],t=0;t<25;t++)e[t]=new a.init;this.blockSize=(1600-2*this.cfg.outputLength)/32},_doProcessBlock:function(e,t){for(var r=this._state,o=this.blockSize/2,n=0;n<o;n++){var i=e[t+2*n],a=e[t+2*n+1];i=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8),a=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),(C=r[n]).high^=a,C.low^=i}for(var s=0;s<24;s++){for(var f=0;f<5;f++){for(var p=0,h=0,y=0;y<5;y++)p^=(C=r[f+5*y]).high,h^=C.low;var v=u[f];v.high=p,v.low=h}for(f=0;f<5;f++){var _=u[(f+4)%5],g=u[(f+1)%5],b=g.high,m=g.low;for(p=_.high^(b<<1|m>>>31),h=_.low^(m<<1|b>>>31),y=0;y<5;y++)(C=r[f+5*y]).high^=p,C.low^=h}for(var w=1;w<25;w++){var k=(C=r[w]).high,x=C.low,B=c[w];B<32?(p=k<<B|x>>>32-B,h=x<<B|k>>>32-B):(p=x<<B-32|k>>>64-B,h=k<<B-32|x>>>64-B);var S=u[l[w]];S.high=p,S.low=h}var A=u[0],j=r[0];for(A.high=j.high,A.low=j.low,f=0;f<5;f++)for(y=0;y<5;y++){var C=r[w=f+5*y],R=u[w],$=u[(f+1)%5+5*y],E=u[(f+2)%5+5*y];C.high=R.high^~$.high&E.high,C.low=R.low^~$.low&E.low}C=r[0];var H=d[s];C.high^=H.high,C.low^=H.low}},_doFinalize:function(){var e=this._data,r=e.words;this._nDataBytes;var o=8*e.sigBytes,i=32*this.blockSize;r[o>>>5]|=1<<24-o%32,r[(t.ceil((o+1)/i)*i>>>5)-1]|=128,e.sigBytes=4*r.length,this._process();for(var a=this._state,s=this.cfg.outputLength/8,c=s/8,l=[],d=0;d<c;d++){var u=a[d],f=u.high,p=u.low;f=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8),p=16711935&(p<<8|p>>>24)|4278255360&(p<<24|p>>>8),l.push(p),l.push(f)}return new n.init(l,s)},clone:function(){for(var e=i.clone.call(this),t=e._state=this._state.slice(0),r=0;r<25;r++)t[r]=t[r].clone();return e}});r.SHA3=i._createHelper(f),r.HmacSHA3=i._createHmacHelper(f)}(Math),e.SHA3}(q(),J())),Be.exports}var Ae,je={exports:{}};var Ce,Re={exports:{}};function $e(){return Ce||(Ce=1,Re.exports=function(e){var t,r,o;r=(t=e).lib.Base,o=t.enc.Utf8,t.algo.HMAC=r.extend({init:function(e,t){e=this._hasher=new e.init,"string"==typeof t&&(t=o.parse(t));var r=e.blockSize,n=4*r;t.sigBytes>n&&(t=e.finalize(t)),t.clamp();for(var i=this._oKey=t.clone(),a=this._iKey=t.clone(),s=i.words,c=a.words,l=0;l<r;l++)s[l]^=1549556828,c[l]^=909522486;i.sigBytes=a.sigBytes=n,this.reset()},reset:function(){var e=this._hasher;e.reset(),e.update(this._iKey)},update:function(e){return this._hasher.update(e),this},finalize:function(e){var t=this._hasher,r=t.finalize(e);return t.reset(),t.finalize(this._oKey.clone().concat(r))}})}(q())),Re.exports}var Ee,He={exports:{}};var ze,Oe={exports:{}};function Me(){return ze||(ze=1,Oe.exports=function(e){return r=(t=e).lib,o=r.Base,n=r.WordArray,i=t.algo,a=i.MD5,s=i.EvpKDF=o.extend({cfg:o.extend({keySize:4,hasher:a,iterations:1}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,t){for(var r,o=this.cfg,i=o.hasher.create(),a=n.create(),s=a.words,c=o.keySize,l=o.iterations;s.length<c;){r&&i.update(r),r=i.update(e).finalize(t),i.reset();for(var d=1;d<l;d++)r=i.finalize(r),i.reset();a.concat(r)}return a.sigBytes=4*c,a}}),t.EvpKDF=function(e,t,r){return s.create(r).compute(e,t)},e.EvpKDF;var t,r,o,n,i,a,s}(q(),fe(),$e())),Oe.exports}var De,Le={exports:{}};function Pe(){return De||(De=1,Le.exports=function(e){e.lib.Cipher||function(t){var r=e,o=r.lib,n=o.Base,i=o.WordArray,a=o.BufferedBlockAlgorithm,s=r.enc;s.Utf8;var c=s.Base64,l=r.algo.EvpKDF,d=o.Cipher=a.extend({cfg:n.extend(),createEncryptor:function(e,t){return this.create(this._ENC_XFORM_MODE,e,t)},createDecryptor:function(e,t){return this.create(this._DEC_XFORM_MODE,e,t)},init:function(e,t,r){this.cfg=this.cfg.extend(r),this._xformMode=e,this._key=t,this.reset()},reset:function(){a.reset.call(this),this._doReset()},process:function(e){return this._append(e),this._process()},finalize:function(e){return e&&this._append(e),this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(){function e(e){return"string"==typeof e?b:_}return function(t){return{encrypt:function(r,o,n){return e(o).encrypt(t,r,o,n)},decrypt:function(r,o,n){return e(o).decrypt(t,r,o,n)}}}}()});o.StreamCipher=d.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var u=r.mode={},f=o.BlockCipherMode=n.extend({createEncryptor:function(e,t){return this.Encryptor.create(e,t)},createDecryptor:function(e,t){return this.Decryptor.create(e,t)},init:function(e,t){this._cipher=e,this._iv=t}}),p=u.CBC=function(){var e=f.extend();function r(e,r,o){var n,i=this._iv;i?(n=i,this._iv=t):n=this._prevBlock;for(var a=0;a<o;a++)e[r+a]^=n[a]}return e.Encryptor=e.extend({processBlock:function(e,t){var o=this._cipher,n=o.blockSize;r.call(this,e,t,n),o.encryptBlock(e,t),this._prevBlock=e.slice(t,t+n)}}),e.Decryptor=e.extend({processBlock:function(e,t){var o=this._cipher,n=o.blockSize,i=e.slice(t,t+n);o.decryptBlock(e,t),r.call(this,e,t,n),this._prevBlock=i}}),e}(),h=(r.pad={}).Pkcs7={pad:function(e,t){for(var r=4*t,o=r-e.sigBytes%r,n=o<<24|o<<16|o<<8|o,a=[],s=0;s<o;s+=4)a.push(n);var c=i.create(a,o);e.concat(c)},unpad:function(e){var t=255&e.words[e.sigBytes-1>>>2];e.sigBytes-=t}};o.BlockCipher=d.extend({cfg:d.cfg.extend({mode:p,padding:h}),reset:function(){var e;d.reset.call(this);var t=this.cfg,r=t.iv,o=t.mode;this._xformMode==this._ENC_XFORM_MODE?e=o.createEncryptor:(e=o.createDecryptor,this._minBufferSize=1),this._mode&&this._mode.__creator==e?this._mode.init(this,r&&r.words):(this._mode=e.call(o,this,r&&r.words),this._mode.__creator=e)},_doProcessBlock:function(e,t){this._mode.processBlock(e,t)},_doFinalize:function(){var e,t=this.cfg.padding;return this._xformMode==this._ENC_XFORM_MODE?(t.pad(this._data,this.blockSize),e=this._process(!0)):(e=this._process(!0),t.unpad(e)),e},blockSize:4});var y=o.CipherParams=n.extend({init:function(e){this.mixIn(e)},toString:function(e){return(e||this.formatter).stringify(this)}}),v=(r.format={}).OpenSSL={stringify:function(e){var t=e.ciphertext,r=e.salt;return(r?i.create([1398893684,1701076831]).concat(r).concat(t):t).toString(c)},parse:function(e){var t,r=c.parse(e),o=r.words;return 1398893684==o[0]&&1701076831==o[1]&&(t=i.create(o.slice(2,4)),o.splice(0,4),r.sigBytes-=16),y.create({ciphertext:r,salt:t})}},_=o.SerializableCipher=n.extend({cfg:n.extend({format:v}),encrypt:function(e,t,r,o){o=this.cfg.extend(o);var n=e.createEncryptor(r,o),i=n.finalize(t),a=n.cfg;return y.create({ciphertext:i,key:r,iv:a.iv,algorithm:e,mode:a.mode,padding:a.padding,blockSize:e.blockSize,formatter:o.format})},decrypt:function(e,t,r,o){return o=this.cfg.extend(o),t=this._parse(t,o.format),e.createDecryptor(r,o).finalize(t.ciphertext)},_parse:function(e,t){return"string"==typeof e?t.parse(e,this):e}}),g=(r.kdf={}).OpenSSL={execute:function(e,t,r,o,n){if(o||(o=i.random(8)),n)a=l.create({keySize:t+r,hasher:n}).compute(e,o);else var a=l.create({keySize:t+r}).compute(e,o);var s=i.create(a.words.slice(t),4*r);return a.sigBytes=4*t,y.create({key:a,iv:s,salt:o})}},b=o.PasswordBasedCipher=_.extend({cfg:_.cfg.extend({kdf:g}),encrypt:function(e,t,r,o){var n=(o=this.cfg.extend(o)).kdf.execute(r,e.keySize,e.ivSize,o.salt,o.hasher);o.iv=n.iv;var i=_.encrypt.call(this,e,t,n.key,o);return i.mixIn(n),i},decrypt:function(e,t,r,o){o=this.cfg.extend(o),t=this._parse(t,o.format);var n=o.kdf.execute(r,e.keySize,e.ivSize,t.salt,o.hasher);return o.iv=n.iv,_.decrypt.call(this,e,t,n.key,o)}})}()}(q(),Me())),Le.exports}var Fe,Te={exports:{}};function Ie(){return Fe||(Fe=1,Te.exports=function(e){return e.mode.CFB=function(){var t=e.lib.BlockCipherMode.extend();function r(e,t,r,o){var n,i=this._iv;i?(n=i.slice(0),this._iv=void 0):n=this._prevBlock,o.encryptBlock(n,0);for(var a=0;a<r;a++)e[t+a]^=n[a]}return t.Encryptor=t.extend({processBlock:function(e,t){var o=this._cipher,n=o.blockSize;r.call(this,e,t,n,o),this._prevBlock=e.slice(t,t+n)}}),t.Decryptor=t.extend({processBlock:function(e,t){var o=this._cipher,n=o.blockSize,i=e.slice(t,t+n);r.call(this,e,t,n,o),this._prevBlock=i}}),t}(),e.mode.CFB}(q(),Pe())),Te.exports}var Ue,Ne={exports:{}};function We(){return Ue||(Ue=1,Ne.exports=function(e){return e.mode.CTR=(t=e.lib.BlockCipherMode.extend(),r=t.Encryptor=t.extend({processBlock:function(e,t){var r=this._cipher,o=r.blockSize,n=this._iv,i=this._counter;n&&(i=this._counter=n.slice(0),this._iv=void 0);var a=i.slice(0);r.encryptBlock(a,0),i[o-1]=i[o-1]+1|0;for(var s=0;s<o;s++)e[t+s]^=a[s]}}),t.Decryptor=r,t),e.mode.CTR;var t,r}(q(),Pe())),Ne.exports}var qe,Xe={exports:{}};function Ke(){return qe||(qe=1,Xe.exports=function(e){

return e.mode.CTRGladman=function(){var t=e.lib.BlockCipherMode.extend();function r(e){if(255&~(e>>24))e+=1<<24;else{var t=e>>16&255,r=e>>8&255,o=255&e;255===t?(t=0,255===r?(r=0,255===o?o=0:++o):++r):++t,e=0,e+=t<<16,e+=r<<8,e+=o}return e}function o(e){return 0===(e[0]=r(e[0]))&&(e[1]=r(e[1])),e}var n=t.Encryptor=t.extend({processBlock:function(e,t){var r=this._cipher,n=r.blockSize,i=this._iv,a=this._counter;i&&(a=this._counter=i.slice(0),this._iv=void 0),o(a);var s=a.slice(0);r.encryptBlock(s,0);for(var c=0;c<n;c++)e[t+c]^=s[c]}});return t.Decryptor=n,t}(),e.mode.CTRGladman}(q(),Pe())),Xe.exports}var Je,Ve={exports:{}};function Qe(){return Je||(Je=1,Ve.exports=function(e){return e.mode.OFB=(t=e.lib.BlockCipherMode.extend(),r=t.Encryptor=t.extend({processBlock:function(e,t){var r=this._cipher,o=r.blockSize,n=this._iv,i=this._keystream;n&&(i=this._keystream=n.slice(0),this._iv=void 0),r.encryptBlock(i,0);for(var a=0;a<o;a++)e[t+a]^=i[a]}}),t.Decryptor=r,t),e.mode.OFB;var t,r}(q(),Pe())),Ve.exports}var Ge,Ze={exports:{}};var Ye,et={exports:{}};var tt,rt={exports:{}};var ot,nt={exports:{}};var it,at={exports:{}};var st,ct={exports:{}};var lt,dt={exports:{}};var ut,ft={exports:{}};var pt,ht={exports:{}};function yt(){return pt||(pt=1,ht.exports=function(e){return function(){var t=e,r=t.lib,o=r.WordArray,n=r.BlockCipher,i=t.algo,a=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],s=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],c=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],l=[{0:8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{0:1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{0:260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{0:2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{0:128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{0:268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{0:1048576,16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{0:134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],d=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],u=i.DES=n.extend({_doReset:function(){for(var e=this._key.words,t=[],r=0;r<56;r++){var o=a[r]-1;t[r]=e[o>>>5]>>>31-o%32&1}for(var n=this._subKeys=[],i=0;i<16;i++){var l=n[i]=[],d=c[i];for(r=0;r<24;r++)l[r/6|0]|=t[(s[r]-1+d)%28]<<31-r%6,l[4+(r/6|0)]|=t[28+(s[r+24]-1+d)%28]<<31-r%6;for(l[0]=l[0]<<1|l[0]>>>31,r=1;r<7;r++)l[r]=l[r]>>>4*(r-1)+3;l[7]=l[7]<<5|l[7]>>>27}var u=this._invSubKeys=[];for(r=0;r<16;r++)u[r]=n[15-r]},encryptBlock:function(e,t){this._doCryptBlock(e,t,this._subKeys)},decryptBlock:function(e,t){this._doCryptBlock(e,t,this._invSubKeys)},_doCryptBlock:function(e,t,r){this._lBlock=e[t],this._rBlock=e[t+1],f.call(this,4,252645135),f.call(this,16,65535),p.call(this,2,858993459),p.call(this,8,16711935),f.call(this,1,1431655765);for(var o=0;o<16;o++){for(var n=r[o],i=this._lBlock,a=this._rBlock,s=0,c=0;c<8;c++)s|=l[c][((a^n[c])&d[c])>>>0];this._lBlock=a,this._rBlock=i^s}var u=this._lBlock;this._lBlock=this._rBlock,this._rBlock=u,f.call(this,1,1431655765),p.call(this,8,16711935),p.call(this,2,858993459),f.call(this,16,65535),f.call(this,4,252645135),e[t]=this._lBlock,e[t+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});function f(e,t){var r=(this._lBlock>>>e^this._rBlock)&t;this._rBlock^=r,this._lBlock^=r<<e}function p(e,t){var r=(this._rBlock>>>e^this._lBlock)&t;this._lBlock^=r,this._rBlock^=r<<e}t.DES=n._createHelper(u);var h=i.TripleDES=n.extend({_doReset:function(){var e=this._key.words;if(2!==e.length&&4!==e.length&&e.length<6)throw new Error("Invalid key length - 3DES requires the key length to be 64, 128, 192 or >192.");var t=e.slice(0,2),r=e.length<4?e.slice(0,2):e.slice(2,4),n=e.length<6?e.slice(0,2):e.slice(4,6);this._des1=u.createEncryptor(o.create(t)),this._des2=u.createEncryptor(o.create(r)),this._des3=u.createEncryptor(o.create(n))},encryptBlock:function(e,t){this._des1.encryptBlock(e,t),this._des2.decryptBlock(e,t),this._des3.encryptBlock(e,t)},decryptBlock:function(e,t){this._des3.decryptBlock(e,t),this._des2.encryptBlock(e,t),this._des1.decryptBlock(e,t)},keySize:6,ivSize:2,blockSize:2});t.TripleDES=n._createHelper(h)}(),e.TripleDES}(q(),oe(),le(),Me(),Pe())),ht.exports}var vt,_t={exports:{}};var gt,bt={exports:{}};var mt,wt={exports:{}};var kt,xt={exports:{}};function Bt(){return kt||(kt=1,xt.exports=function(e){return function(){var t=e,r=t.lib.BlockCipher,o=t.algo;const n=16,i=[608135816,2242054355,320440878,57701188,2752067618,698298832,137296536,3964562569,1160258022,953160567,3193202383,887688300,3232508343,3380367581,1065670069,3041331479,2450970073,2306472731],a=[[3509652390,2564797868,805139163,3491422135,3101798381,1780907670,3128725573,4046225305,614570311,3012652279,134345442,2240740374,1667834072,1901547113,2757295779,4103290238,227898511,1921955416,1904987480,2182433518,2069144605,3260701109,2620446009,720527379,3318853667,677414384,3393288472,3101374703,2390351024,1614419982,1822297739,2954791486,3608508353,3174124327,2024746970,1432378464,3864339955,2857741204,1464375394,1676153920,1439316330,715854006,3033291828,289532110,2706671279,2087905683,3018724369,1668267050,732546397,1947742710,3462151702,2609353502,2950085171,1814351708,2050118529,680887927,999245976,1800124847,3300911131,1713906067,1641548236,4213287313,1216130144,1575780402,4018429277,3917837745,3693486850,3949271944,596196993,3549867205,258830323,2213823033,772490370,2760122372,1774776394,2652871518,566650946,4142492826,1728879713,2882767088,1783734482,3629395816,2517608232,2874225571,1861159788,326777828,3124490320,2130389656,2716951837,967770486,1724537150,2185432712,2364442137,1164943284,2105845187,998989502,3765401048,2244026483,1075463327,1455516326,1322494562,910128902,469688178,1117454909,936433444,3490320968,3675253459,1240580251,122909385,2157517691,634681816,4142456567,3825094682,3061402683,2540495037,79693498,3249098678,1084186820,1583128258,426386531,1761308591,1047286709,322548459,995290223,1845252383,2603652396,3431023940,2942221577,3202600964,3727903485,1712269319,422464435,3234572375,1170764815,3523960633,3117677531,1434042557,442511882,3600875718,1076654713,1738483198,4213154764,2393238008,3677496056,1014306527,4251020053,793779912,2902807211,842905082,4246964064,1395751752,1040244610,2656851899,3396308128,445077038,3742853595,3577915638,679411651,2892444358,2354009459,1767581616,3150600392,3791627101,3102740896,284835224,4246832056,1258075500,768725851,2589189241,3069724005,3532540348,1274779536,3789419226,2764799539,1660621633,3471099624,4011903706,913787905,3497959166,737222580,2514213453,2928710040,3937242737,1804850592,3499020752,2949064160,2386320175,2390070455,2415321851,4061277028,2290661394,2416832540,1336762016,1754252060,3520065937,3014181293,791618072,3188594551,3933548030,2332172193,3852520463,3043980520,413987798,3465142937,3030929376,4245938359,2093235073,3534596313,375366246,2157278981,2479649556,555357303,3870105701,2008414854,3344188149,4221384143,3956125452,2067696032,3594591187,2921233993,2428461,544322398,577241275,1471733935,610547355,4027169054,1432588573,1507829418,2025931657,3646575487,545086370,48609733,2200306550,1653985193,298326376,1316178497,3007786442,2064951626,458293330,2589141269,3591329599,3164325604,727753846,2179363840,146436021,1461446943,4069977195,705550613,3059967265,3887724982,4281599278,3313849956,1404054877,2845806497,146425753,1854211946],[1266315497,3048417604,3681880366,3289982499,290971e4,1235738493,2632868024,2414719590,3970600049,1771706367,1449415276,3266420449,422970021,1963543593,2690192192,3826793022,1062508698,1531092325,1804592342,2583117782,2714934279,4024971509,1294809318,4028980673,1289560198,2221992742,1669523910,35572830,157838143,1052438473,1016535060,1802137761,1753167236,1386275462,3080475397,2857371447,1040679964,2145300060,2390574316,1461121720,2956646967,4031777805,4028374788,33600511,2920084762,1018524850,629373528,3691585981,3515945977,2091462646,2486323059,586499841,988145025,935516892,3367335476,2599673255,2839830854,265290510,3972581182,2759138881,3795373465,1005194799,847297441,406762289,1314163512,1332590856,1866599683,4127851711,750260880,613907577,1450815602,3165620655,3734664991,3650291728,3012275730,3704569646,1427272223,778793252,1343938022,2676280711,2052605720,1946737175,3164576444,3914038668,3967478842,3682934266,1661551462,3294938066,4011595847,840292616,3712170807,616741398,312560963,711312465,1351876610,322626781,1910503582,271666773,2175563734,1594956187,70604529,3617834859,1007753275,1495573769,4069517037,2549218298,2663038764,504708206,2263041392,3941167025,2249088522,1514023603,1998579484,1312622330,694541497,2582060303,2151582166,1382467621,776784248,2618340202,3323268794,2497899128,2784771155,503983604,4076293799,907881277,423175695,432175456,1378068232,4145222326,3954048622,3938656102,3820766613,2793130115,2977904593,26017576,3274890735,3194772133,1700274565,1756076034,4006520079,3677328699,720338349,1533947780,354530856,688349552,3973924725,1637815568,332179504,3949051286,53804574,2852348879,3044236432,1282449977,3583942155,3416972820,4006381244,1617046695,2628476075,3002303598,1686838959,431878346,2686675385,1700445008,1080580658,1009431731,832498133,3223435511,2605976345,2271191193,2516031870,1648197032,4164389018,2548247927,300782431,375919233,238389289,3353747414,2531188641,2019080857,1475708069,455242339,2609103871,448939670,3451063019,1395535956,2413381860,1841049896,1491858159,885456874,4264095073,4001119347,1565136089,3898914787,1108368660,540939232,1173283510,2745871338,3681308437,4207628240,3343053890,4016749493,1699691293,1103962373,3625875870,2256883143,3830138730,1031889488,3479347698,1535977030,4236805024,3251091107,2132092099,1774941330,1199868427,1452454533,157007616,2904115357,342012276,595725824,1480756522,206960106,497939518,591360097,863170706,2375253569,3596610801,1814182875,2094937945,3421402208,1082520231,3463918190,2785509508,435703966,3908032597,1641649973,2842273706,3305899714,1510255612,2148256476,2655287854,3276092548,4258621189,236887753,3681803219,274041037,1734335097,3815195456,3317970021,1899903192,1026095262,4050517792,356393447,2410691914,3873677099,3682840055],[3913112168,2491498743,4132185628,2489919796,1091903735,1979897079,3170134830,3567386728,3557303409,857797738,1136121015,1342202287,507115054,2535736646,337727348,3213592640,1301675037,2528481711,1895095763,1721773893,3216771564,62756741,2142006736,835421444,2531993523,1442658625,3659876326,2882144922,676362277,1392781812,170690266,3921047035,1759253602,3611846912,1745797284,664899054,1329594018,3901205900,3045908486,2062866102,2865634940,3543621612,3464012697,1080764994,553557557,3656615353,3996768171,991055499,499776247,1265440854,648242737,3940784050,980351604,3713745714,1749149687,3396870395,4211799374,3640570775,1161844396,3125318951,1431517754,545492359,4268468663,3499529547,1437099964,2702547544,3433638243,2581715763,2787789398,1060185593,1593081372,2418618748,4260947970,69676912,2159744348,86519011,2512459080,3838209314,1220612927,3339683548,133810670,1090789135,1078426020,1569222167,845107691,3583754449,4072456591,1091646820,628848692,1613405280,3757631651,526609435,236106946,48312990,2942717905,3402727701,1797494240,859738849,992217954,4005476642,2243076622,3870952857,3732016268,765654824,3490871365,2511836413,1685915746,3888969200,1414112111,2273134842,3281911079,4080962846,172450625,2569994100,980381355,4109958455,2819808352,2716589560,2568741196,3681446669,3329971472,1835478071,660984891,3704678404,4045999559,3422617507,3040415634,1762651403,1719377915,3470491036,2693910283,3642056355,3138596744,1364962596,2073328063,1983633131,926494387,3423689081,2150032023,4096667949,1749200295,3328846651,309677260,2016342300,1779581495,3079819751,111262694,1274766160,443224088,298511866,1025883608,3806446537,1145181785,168956806,3641502830,3584813610,1689216846,3666258015,3200248200,1692713982,2646376535,4042768518,1618508792,1610833997,3523052358,4130873264,2001055236,3610705100,2202168115,4028541809,2961195399,1006657119,2006996926,3186142756,1430667929,3210227297,1314452623,4074634658,4101304120,2273951170,1399257539,3367210612,3027628629,1190975929,2062231137,2333990788,2221543033,2438960610,1181637006,548689776,2362791313,3372408396,3104550113,3145860560,296247880,1970579870,3078560182,3769228297,1714227617,3291629107,3898220290,166772364,1251581989,493813264,448347421,195405023,2709975567,677966185,3703036547,1463355134,2715995803,1338867538,1343315457,2802222074,2684532164,233230375,2599980071,2000651841,3277868038,1638401717,4028070440,3237316320,6314154,819756386,300326615,590932579,1405279636,3267499572,3150704214,2428286686,3959192993,3461946742,1862657033,1266418056,963775037,2089974820,2263052895,1917689273,448879540,3550394620,3981727096,150775221,3627908307,1303187396,508620638,2975983352,2726630617,1817252668,1876281319,1457606340,908771278,3720792119,3617206836,2455994898,1729034894,1080033504],[976866871,3556439503,2881648439,1522871579,1555064734,1336096578,3548522304,2579274686,3574697629,3205460757,3593280638,3338716283,3079412587,564236357,2993598910,1781952180,1464380207,3163844217,3332601554,1699332808,1393555694,1183702653,3581086237,1288719814,691649499,2847557200,2895455976,3193889540,2717570544,1781354906,1676643554,2592534050,3230253752,1126444790,2770207658,2633158820,2210423226,2615765581,2414155088,3127139286,673620729,2805611233,1269405062,4015350505,3341807571,4149409754,1057255273,2012875353,2162469141,2276492801,2601117357,993977747,3918593370,2654263191,753973209,36408145,2530585658,25011837,3520020182,2088578344,530523599,2918365339,1524020338,1518925132,3760827505,3759777254,1202760957,3985898139,3906192525,674977740,4174734889,2031300136,2019492241,3983892565,4153806404,3822280332,352677332,2297720250,60907813,90501309,3286998549,1016092578,2535922412,2839152426,457141659,509813237,4120667899,652014361,1966332200,2975202805,55981186,2327461051,676427537,3255491064,2882294119,3433927263,1307055953,942726286,933058658,2468411793,3933900994,4215176142,1361170020,2001714738,2830558078,3274259782,1222529897,1679025792,2729314320,3714953764,1770335741,151462246,3013232138,1682292957,1483529935,471910574,1539241949,458788160,3436315007,1807016891,3718408830,978976581,1043663428,3165965781,1927990952,4200891579,2372276910,3208408903,3533431907,1412390302,2931980059,4132332400,1947078029,3881505623,4168226417,2941484381,1077988104,1320477388,886195818,18198404,3786409e3,2509781533,112762804,3463356488,1866414978,891333506,18488651,661792760,1628790961,3885187036,3141171499,876946877,2693282273,1372485963,791857591,2686433993,3759982718,3167212022,3472953795,2716379847,445679433,3561995674,3504004811,3574258232,54117162,3331405415,2381918588,3769707343,4154350007,1140177722,4074052095,668550556,3214352940,367459370,261225585,2610173221,4209349473,3468074219,3265815641,314222801,3066103646,3808782860,282218597,3406013506,3773591054,379116347,1285071038,846784868,2669647154,3771962079,3550491691,2305946142,453669953,1268987020,3317592352,3279303384,3744833421,2610507566,3859509063,266596637,3847019092,517658769,3462560207,3443424879,370717030,4247526661,2224018117,4143653529,4112773975,2788324899,2477274417,1456262402,2901442914,1517677493,1846949527,2295493580,3734397586,2176403920,1280348187,1908823572,3871786941,846861322,1172426758,3287448474,3383383037,1655181056,3139813346,901632758,1897031941,2986607138,3066810236,3447102507,1393639104,373351379,950779232,625454576,3124240540,4148612726,2007998917,544563296,2244738638,2330496472,2058025392,1291430526,424198748,50039436,29584100,3605783033,2429876329,2791104160,1057563949,3255363231,3075367218,3463963227,1469046755,985887462]];var s={pbox:[],sbox:[]};function c(e,t){let r=t>>24&255,o=t>>16&255,n=t>>8&255,i=255&t,a=e.sbox[0][r]+e.sbox[1][o];return a^=e.sbox[2][n],a+=e.sbox[3][i],a}function l(e,t,r){let o,i=t,a=r;for(let t=0;t<n;++t)i^=e.pbox[t],a=c(e,i)^a,o=i,i=a,a=o;return o=i,i=a,a=o,a^=e.pbox[n],i^=e.pbox[n+1],{left:i,right:a}}function d(e,t,r){let o,i=t,a=r;for(let t=n+1;t>1;--t)i^=e.pbox[t],a=c(e,i)^a,o=i,i=a,a=o;return o=i,i=a,a=o,a^=e.pbox[1],i^=e.pbox[0],{left:i,right:a}}function u(e,t,r){for(let t=0;t<4;t++){e.sbox[t]=[];for(let r=0;r<256;r++)e.sbox[t][r]=a[t][r]}let o=0;for(let a=0;a<n+2;a++)e.pbox[a]=i[a]^t[o],o++,o>=r&&(o=0);let s=0,c=0,d=0;for(let t=0;t<n+2;t+=2)d=l(e,s,c),s=d.left,c=d.right,e.pbox[t]=s,e.pbox[t+1]=c;for(let t=0;t<4;t++)for(let r=0;r<256;r+=2)d=l(e,s,c),s=d.left,c=d.right,e.sbox[t][r]=s,e.sbox[t][r+1]=c;return!0}var f=o.Blowfish=r.extend({_doReset:function(){if(this._keyPriorReset!==this._key){var e=this._keyPriorReset=this._key,t=e.words,r=e.sigBytes/4;u(s,t,r)}},encryptBlock:function(e,t){var r=l(s,e[t],e[t+1]);e[t]=r.left,e[t+1]=r.right},decryptBlock:function(e,t){var r=d(s,e[t],e[t+1]);e[t]=r.left,e[t+1]=r.right},blockSize:2,keySize:4,ivSize:2});t.Blowfish=r._createHelper(f)}(),e.Blowfish}(q(),oe(),le(),Me(),Pe())),xt.exports}U.exports=function(e){return e}(q(),J(),G(),ee(),oe(),ae(),le(),fe(),ye(),ve||(ve=1,_e.exports=function(e){return r=(t=e).lib.WordArray,o=t.algo,n=o.SHA256,i=o.SHA224=n.extend({_doReset:function(){this._hash=new r.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var e=n._doFinalize.call(this);return e.sigBytes-=4,e}}),t.SHA224=n._createHelper(i),t.HmacSHA224=n._createHmacHelper(i),e.SHA224;var t,r,o,n,i}(q(),ye())),me(),we||(we=1,ke.exports=function(e){return r=(t=e).x64,o=r.Word,n=r.WordArray,i=t.algo,a=i.SHA512,s=i.SHA384=a.extend({_doReset:function(){this._hash=new n.init([new o.init(3418070365,3238371032),new o.init(1654270250,914150663),new o.init(2438529370,812702999),new o.init(355462360,4144912697),new o.init(1731405415,4290775857),new o.init(2394180231,1750603025),new o.init(3675008525,1694076839),new o.init(1203062813,3204075428)])},_doFinalize:function(){var e=a._doFinalize.call(this);return e.sigBytes-=16,e}}),t.SHA384=a._createHelper(s),t.HmacSHA384=a._createHmacHelper(s),e.SHA384;var t,r,o,n,i,a,s}(q(),J(),me())),Se(),Ae||(Ae=1,je.exports=function(e){

return function(){var t=e,r=t.lib,o=r.WordArray,n=r.Hasher,i=t.algo,a=o.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),s=o.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),c=o.create([11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),l=o.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),d=o.create([0,1518500249,1859775393,2400959708,2840853838]),u=o.create([1352829926,1548603684,1836072691,2053994217,0]),f=i.RIPEMD160=n.extend({_doReset:function(){this._hash=o.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,t){for(var r=0;r<16;r++){var o=t+r,n=e[o];e[o]=16711935&(n<<8|n>>>24)|4278255360&(n<<24|n>>>8)}var i,f,b,m,w,k,x,B,S,A,j,C=this._hash.words,R=d.words,$=u.words,E=a.words,H=s.words,z=c.words,O=l.words;for(k=i=C[0],x=f=C[1],B=b=C[2],S=m=C[3],A=w=C[4],r=0;r<80;r+=1)j=i+e[t+E[r]]|0,j+=r<16?p(f,b,m)+R[0]:r<32?h(f,b,m)+R[1]:r<48?y(f,b,m)+R[2]:r<64?v(f,b,m)+R[3]:_(f,b,m)+R[4],j=(j=g(j|=0,z[r]))+w|0,i=w,w=m,m=g(b,10),b=f,f=j,j=k+e[t+H[r]]|0,j+=r<16?_(x,B,S)+$[0]:r<32?v(x,B,S)+$[1]:r<48?y(x,B,S)+$[2]:r<64?h(x,B,S)+$[3]:p(x,B,S)+$[4],j=(j=g(j|=0,O[r]))+A|0,k=A,A=S,S=g(B,10),B=x,x=j;j=C[1]+b+S|0,C[1]=C[2]+m+A|0,C[2]=C[3]+w+k|0,C[3]=C[4]+i+x|0,C[4]=C[0]+f+B|0,C[0]=j},_doFinalize:function(){var e=this._data,t=e.words,r=8*this._nDataBytes,o=8*e.sigBytes;t[o>>>5]|=128<<24-o%32,t[14+(o+64>>>9<<4)]=16711935&(r<<8|r>>>24)|4278255360&(r<<24|r>>>8),e.sigBytes=4*(t.length+1),this._process();for(var n=this._hash,i=n.words,a=0;a<5;a++){var s=i[a];i[a]=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8)}return n},clone:function(){var e=n.clone.call(this);return e._hash=this._hash.clone(),e}});function p(e,t,r){return e^t^r}function h(e,t,r){return e&t|~e&r}function y(e,t,r){return(e|~t)^r}function v(e,t,r){return e&r|t&~r}function _(e,t,r){return e^(t|~r)}function g(e,t){return e<<t|e>>>32-t}t.RIPEMD160=n._createHelper(f),t.HmacRIPEMD160=n._createHmacHelper(f)}(),e.RIPEMD160}(q())),$e(),Ee||(Ee=1,He.exports=function(e){return o=(r=(t=e).lib).Base,n=r.WordArray,a=(i=t.algo).SHA256,s=i.HMAC,c=i.PBKDF2=o.extend({cfg:o.extend({keySize:4,hasher:a,iterations:25e4}),init:function(e){this.cfg=this.cfg.extend(e)},compute:function(e,t){for(var r=this.cfg,o=s.create(r.hasher,e),i=n.create(),a=n.create([1]),c=i.words,l=a.words,d=r.keySize,u=r.iterations;c.length<d;){var f=o.update(t).finalize(a);o.reset();for(var p=f.words,h=p.length,y=f,v=1;v<u;v++){y=o.finalize(y),o.reset();for(var _=y.words,g=0;g<h;g++)p[g]^=_[g]}i.concat(f),l[0]++}return i.sigBytes=4*d,i}}),t.PBKDF2=function(e,t,r){return c.create(r).compute(e,t)},e.PBKDF2;var t,r,o,n,i,a,s,c}(q(),ye(),$e())),Me(),Pe(),Ie(),We(),Ke(),Qe(),Ge||(Ge=1,Ze.exports=function(e){return e.mode.ECB=((t=e.lib.BlockCipherMode.extend()).Encryptor=t.extend({processBlock:function(e,t){this._cipher.encryptBlock(e,t)}}),t.Decryptor=t.extend({processBlock:function(e,t){this._cipher.decryptBlock(e,t)}}),t),e.mode.ECB;var t}(q(),Pe())),Ye||(Ye=1,et.exports=function(e){return e.pad.AnsiX923={pad:function(e,t){var r=e.sigBytes,o=4*t,n=o-r%o,i=r+n-1;e.clamp(),e.words[i>>>2]|=n<<24-i%4*8,e.sigBytes+=n},unpad:function(e){var t=255&e.words[e.sigBytes-1>>>2];e.sigBytes-=t}},e.pad.Ansix923}(q(),Pe())),tt||(tt=1,rt.exports=function(e){return e.pad.Iso10126={pad:function(t,r){var o=4*r,n=o-t.sigBytes%o;t.concat(e.lib.WordArray.random(n-1)).concat(e.lib.WordArray.create([n<<24],1))},unpad:function(e){var t=255&e.words[e.sigBytes-1>>>2];e.sigBytes-=t}},e.pad.Iso10126}(q(),Pe())),ot||(ot=1,nt.exports=function(e){return e.pad.Iso97971={pad:function(t,r){t.concat(e.lib.WordArray.create([2147483648],1)),e.pad.ZeroPadding.pad(t,r)},unpad:function(t){e.pad.ZeroPadding.unpad(t),t.sigBytes--}},e.pad.Iso97971}(q(),Pe())),it||(it=1,at.exports=function(e){return e.pad.ZeroPadding={pad:function(e,t){var r=4*t;e.clamp(),e.sigBytes+=r-(e.sigBytes%r||r)},unpad:function(e){var t=e.words,r=e.sigBytes-1;for(r=e.sigBytes-1;r>=0;r--)if(t[r>>>2]>>>24-r%4*8&255){e.sigBytes=r+1;break}}},e.pad.ZeroPadding}(q(),Pe())),st||(st=1,ct.exports=function(e){return e.pad.NoPadding={pad:function(){},unpad:function(){}},e.pad.NoPadding}(q(),Pe())),lt||(lt=1,dt.exports=function(e){return r=(t=e).lib.CipherParams,o=t.enc.Hex,t.format.Hex={stringify:function(e){return e.ciphertext.toString(o)},parse:function(e){var t=o.parse(e);return r.create({ciphertext:t})}},e.format.Hex;var t,r,o}(q(),Pe())),ut||(ut=1,ft.exports=function(e){return function(){var t=e,r=t.lib.BlockCipher,o=t.algo,n=[],i=[],a=[],s=[],c=[],l=[],d=[],u=[],f=[],p=[];!function(){for(var e=[],t=0;t<256;t++)e[t]=t<128?t<<1:t<<1^283;var r=0,o=0;for(t=0;t<256;t++){var h=o^o<<1^o<<2^o<<3^o<<4;h=h>>>8^255&h^99,n[r]=h,i[h]=r;var y=e[r],v=e[y],_=e[v],g=257*e[h]^16843008*h;a[r]=g<<24|g>>>8,s[r]=g<<16|g>>>16,c[r]=g<<8|g>>>24,l[r]=g,g=16843009*_^65537*v^257*y^16843008*r,d[h]=g<<24|g>>>8,u[h]=g<<16|g>>>16,f[h]=g<<8|g>>>24,p[h]=g,r?(r=y^e[e[e[_^y]]],o^=e[e[o]]):r=o=1}}();var h=[0,1,2,4,8,16,32,64,128,27,54],y=o.AES=r.extend({_doReset:function(){if(!this._nRounds||this._keyPriorReset!==this._key){for(var e=this._keyPriorReset=this._key,t=e.words,r=e.sigBytes/4,o=4*((this._nRounds=r+6)+1),i=this._keySchedule=[],a=0;a<o;a++)a<r?i[a]=t[a]:(l=i[a-1],a%r?r>6&&a%r==4&&(l=n[l>>>24]<<24|n[l>>>16&255]<<16|n[l>>>8&255]<<8|n[255&l]):(l=n[(l=l<<8|l>>>24)>>>24]<<24|n[l>>>16&255]<<16|n[l>>>8&255]<<8|n[255&l],l^=h[a/r|0]<<24),i[a]=i[a-r]^l);for(var s=this._invKeySchedule=[],c=0;c<o;c++){if(a=o-c,c%4)var l=i[a];else l=i[a-4];s[c]=c<4||a<=4?l:d[n[l>>>24]]^u[n[l>>>16&255]]^f[n[l>>>8&255]]^p[n[255&l]]}}},encryptBlock:function(e,t){this._doCryptBlock(e,t,this._keySchedule,a,s,c,l,n)},decryptBlock:function(e,t){var r=e[t+1];e[t+1]=e[t+3],e[t+3]=r,this._doCryptBlock(e,t,this._invKeySchedule,d,u,f,p,i),r=e[t+1],e[t+1]=e[t+3],e[t+3]=r},_doCryptBlock:function(e,t,r,o,n,i,a,s){for(var c=this._nRounds,l=e[t]^r[0],d=e[t+1]^r[1],u=e[t+2]^r[2],f=e[t+3]^r[3],p=4,h=1;h<c;h++){var y=o[l>>>24]^n[d>>>16&255]^i[u>>>8&255]^a[255&f]^r[p++],v=o[d>>>24]^n[u>>>16&255]^i[f>>>8&255]^a[255&l]^r[p++],_=o[u>>>24]^n[f>>>16&255]^i[l>>>8&255]^a[255&d]^r[p++],g=o[f>>>24]^n[l>>>16&255]^i[d>>>8&255]^a[255&u]^r[p++];l=y,d=v,u=_,f=g}y=(s[l>>>24]<<24|s[d>>>16&255]<<16|s[u>>>8&255]<<8|s[255&f])^r[p++],v=(s[d>>>24]<<24|s[u>>>16&255]<<16|s[f>>>8&255]<<8|s[255&l])^r[p++],_=(s[u>>>24]<<24|s[f>>>16&255]<<16|s[l>>>8&255]<<8|s[255&d])^r[p++],g=(s[f>>>24]<<24|s[l>>>16&255]<<16|s[d>>>8&255]<<8|s[255&u])^r[p++],e[t]=y,e[t+1]=v,e[t+2]=_,e[t+3]=g},keySize:8});t.AES=r._createHelper(y)}(),e.AES}(q(),oe(),le(),Me(),Pe())),yt(),vt||(vt=1,_t.exports=function(e){return function(){var t=e,r=t.lib.StreamCipher,o=t.algo,n=o.RC4=r.extend({_doReset:function(){for(var e=this._key,t=e.words,r=e.sigBytes,o=this._S=[],n=0;n<256;n++)o[n]=n;n=0;for(var i=0;n<256;n++){var a=n%r,s=t[a>>>2]>>>24-a%4*8&255;i=(i+o[n]+s)%256;var c=o[n];o[n]=o[i],o[i]=c}this._i=this._j=0},_doProcessBlock:function(e,t){e[t]^=i.call(this)},keySize:8,ivSize:0});function i(){for(var e=this._S,t=this._i,r=this._j,o=0,n=0;n<4;n++){r=(r+e[t=(t+1)%256])%256;var i=e[t];e[t]=e[r],e[r]=i,o|=e[(e[t]+e[r])%256]<<24-8*n}return this._i=t,this._j=r,o}t.RC4=r._createHelper(n);var a=o.RC4Drop=n.extend({cfg:n.cfg.extend({drop:192}),_doReset:function(){n._doReset.call(this);for(var e=this.cfg.drop;e>0;e--)i.call(this)}});t.RC4Drop=r._createHelper(a)}(),e.RC4}(q(),oe(),le(),Me(),Pe())),gt||(gt=1,bt.exports=function(e){return function(){var t=e,r=t.lib.StreamCipher,o=t.algo,n=[],i=[],a=[],s=o.Rabbit=r.extend({_doReset:function(){for(var e=this._key.words,t=this.cfg.iv,r=0;r<4;r++)e[r]=16711935&(e[r]<<8|e[r]>>>24)|4278255360&(e[r]<<24|e[r]>>>8);var o=this._X=[e[0],e[3]<<16|e[2]>>>16,e[1],e[0]<<16|e[3]>>>16,e[2],e[1]<<16|e[0]>>>16,e[3],e[2]<<16|e[1]>>>16],n=this._C=[e[2]<<16|e[2]>>>16,4294901760&e[0]|65535&e[1],e[3]<<16|e[3]>>>16,4294901760&e[1]|65535&e[2],e[0]<<16|e[0]>>>16,4294901760&e[2]|65535&e[3],e[1]<<16|e[1]>>>16,4294901760&e[3]|65535&e[0]];for(this._b=0,r=0;r<4;r++)c.call(this);for(r=0;r<8;r++)n[r]^=o[r+4&7];if(t){var i=t.words,a=i[0],s=i[1],l=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),d=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),u=l>>>16|4294901760&d,f=d<<16|65535&l;for(n[0]^=l,n[1]^=u,n[2]^=d,n[3]^=f,n[4]^=l,n[5]^=u,n[6]^=d,n[7]^=f,r=0;r<4;r++)c.call(this)}},_doProcessBlock:function(e,t){var r=this._X;c.call(this),n[0]=r[0]^r[5]>>>16^r[3]<<16,n[1]=r[2]^r[7]>>>16^r[5]<<16,n[2]=r[4]^r[1]>>>16^r[7]<<16,n[3]=r[6]^r[3]>>>16^r[1]<<16;for(var o=0;o<4;o++)n[o]=16711935&(n[o]<<8|n[o]>>>24)|4278255360&(n[o]<<24|n[o]>>>8),e[t+o]^=n[o]},blockSize:4,ivSize:2});function c(){for(var e=this._X,t=this._C,r=0;r<8;r++)i[r]=t[r];for(t[0]=t[0]+1295307597+this._b|0,t[1]=t[1]+3545052371+(t[0]>>>0<i[0]>>>0?1:0)|0,t[2]=t[2]+886263092+(t[1]>>>0<i[1]>>>0?1:0)|0,t[3]=t[3]+1295307597+(t[2]>>>0<i[2]>>>0?1:0)|0,t[4]=t[4]+3545052371+(t[3]>>>0<i[3]>>>0?1:0)|0,t[5]=t[5]+886263092+(t[4]>>>0<i[4]>>>0?1:0)|0,t[6]=t[6]+1295307597+(t[5]>>>0<i[5]>>>0?1:0)|0,t[7]=t[7]+3545052371+(t[6]>>>0<i[6]>>>0?1:0)|0,this._b=t[7]>>>0<i[7]>>>0?1:0,r=0;r<8;r++){var o=e[r]+t[r],n=65535&o,s=o>>>16,c=((n*n>>>17)+n*s>>>15)+s*s,l=((4294901760&o)*o|0)+((65535&o)*o|0);a[r]=c^l}e[0]=a[0]+(a[7]<<16|a[7]>>>16)+(a[6]<<16|a[6]>>>16)|0,e[1]=a[1]+(a[0]<<8|a[0]>>>24)+a[7]|0,e[2]=a[2]+(a[1]<<16|a[1]>>>16)+(a[0]<<16|a[0]>>>16)|0,e[3]=a[3]+(a[2]<<8|a[2]>>>24)+a[1]|0,e[4]=a[4]+(a[3]<<16|a[3]>>>16)+(a[2]<<16|a[2]>>>16)|0,e[5]=a[5]+(a[4]<<8|a[4]>>>24)+a[3]|0,e[6]=a[6]+(a[5]<<16|a[5]>>>16)+(a[4]<<16|a[4]>>>16)|0,e[7]=a[7]+(a[6]<<8|a[6]>>>24)+a[5]|0}t.Rabbit=r._createHelper(s)}(),e.Rabbit}(q(),oe(),le(),Me(),Pe())),mt||(mt=1,wt.exports=function(e){return function(){var t=e,r=t.lib.StreamCipher,o=t.algo,n=[],i=[],a=[],s=o.RabbitLegacy=r.extend({_doReset:function(){var e=this._key.words,t=this.cfg.iv,r=this._X=[e[0],e[3]<<16|e[2]>>>16,e[1],e[0]<<16|e[3]>>>16,e[2],e[1]<<16|e[0]>>>16,e[3],e[2]<<16|e[1]>>>16],o=this._C=[e[2]<<16|e[2]>>>16,4294901760&e[0]|65535&e[1],e[3]<<16|e[3]>>>16,4294901760&e[1]|65535&e[2],e[0]<<16|e[0]>>>16,4294901760&e[2]|65535&e[3],e[1]<<16|e[1]>>>16,4294901760&e[3]|65535&e[0]];this._b=0;for(var n=0;n<4;n++)c.call(this);for(n=0;n<8;n++)o[n]^=r[n+4&7];if(t){var i=t.words,a=i[0],s=i[1],l=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),d=16711935&(s<<8|s>>>24)|4278255360&(s<<24|s>>>8),u=l>>>16|4294901760&d,f=d<<16|65535&l;for(o[0]^=l,o[1]^=u,o[2]^=d,o[3]^=f,o[4]^=l,o[5]^=u,o[6]^=d,o[7]^=f,n=0;n<4;n++)c.call(this)}},_doProcessBlock:function(e,t){var r=this._X;c.call(this),n[0]=r[0]^r[5]>>>16^r[3]<<16,n[1]=r[2]^r[7]>>>16^r[5]<<16,n[2]=r[4]^r[1]>>>16^r[7]<<16,n[3]=r[6]^r[3]>>>16^r[1]<<16;for(var o=0;o<4;o++)n[o]=16711935&(n[o]<<8|n[o]>>>24)|4278255360&(n[o]<<24|n[o]>>>8),e[t+o]^=n[o]},blockSize:4,ivSize:2});function c(){for(var e=this._X,t=this._C,r=0;r<8;r++)i[r]=t[r];for(t[0]=t[0]+1295307597+this._b|0,t[1]=t[1]+3545052371+(t[0]>>>0<i[0]>>>0?1:0)|0,t[2]=t[2]+886263092+(t[1]>>>0<i[1]>>>0?1:0)|0,t[3]=t[3]+1295307597+(t[2]>>>0<i[2]>>>0?1:0)|0,t[4]=t[4]+3545052371+(t[3]>>>0<i[3]>>>0?1:0)|0,t[5]=t[5]+886263092+(t[4]>>>0<i[4]>>>0?1:0)|0,t[6]=t[6]+1295307597+(t[5]>>>0<i[5]>>>0?1:0)|0,t[7]=t[7]+3545052371+(t[6]>>>0<i[6]>>>0?1:0)|0,this._b=t[7]>>>0<i[7]>>>0?1:0,r=0;r<8;r++){var o=e[r]+t[r],n=65535&o,s=o>>>16,c=((n*n>>>17)+n*s>>>15)+s*s,l=((4294901760&o)*o|0)+((65535&o)*o|0);a[r]=c^l}e[0]=a[0]+(a[7]<<16|a[7]>>>16)+(a[6]<<16|a[6]>>>16)|0,e[1]=a[1]+(a[0]<<8|a[0]>>>24)+a[7]|0,e[2]=a[2]+(a[1]<<16|a[1]>>>16)+(a[0]<<16|a[0]>>>16)|0,e[3]=a[3]+(a[2]<<8|a[2]>>>24)+a[1]|0,e[4]=a[4]+(a[3]<<16|a[3]>>>16)+(a[2]<<16|a[2]>>>16)|0,e[5]=a[5]+(a[4]<<8|a[4]>>>24)+a[3]|0,e[6]=a[6]+(a[5]<<16|a[5]>>>16)+(a[4]<<16|a[4]>>>16)|0,e[7]=a[7]+(a[6]<<8|a[6]>>>24)+a[5]|0}t.RabbitLegacy=r._createHelper(s)}(),e.RabbitLegacy}(q(),oe(),le(),Me(),Pe())),Bt());var St=I(U.exports),At=Uint8Array,jt=Uint16Array,Ct=Int32Array,Rt=new At([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),$t=new At([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Et=new At([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ht=function(e,t){for(var r=new jt(31),o=0;o<31;++o)r[o]=t+=1<<e[o-1];var n=new Ct(r[30]);for(o=1;o<30;++o)for(var i=r[o];i<r[o+1];++i)n[i]=i-r[o]<<5|o;return{b:r,r:n}},zt=Ht(Rt,2),Ot=zt.b,Mt=zt.r;Ot[28]=258,Mt[258]=28;for(var Dt=Ht($t,0),Lt=Dt.b,Pt=Dt.r,Ft=new jt(32768),Tt=0;Tt<32768;++Tt){var It=(43690&Tt)>>1|(21845&Tt)<<1;It=(61680&(It=(52428&It)>>2|(13107&It)<<2))>>4|(3855&It)<<4,Ft[Tt]=((65280&It)>>8|(255&It)<<8)>>1}var Ut=function(e,t,r){for(var o=e.length,n=0,i=new jt(t);n<o;++n)e[n]&&++i[e[n]-1];var a,s=new jt(t);for(n=1;n<t;++n)s[n]=s[n-1]+i[n-1]<<1;if(r){a=new jt(1<<t);var c=15-t;for(n=0;n<o;++n)if(e[n])for(var l=n<<4|e[n],d=t-e[n],u=s[e[n]-1]++<<d,f=u|(1<<d)-1;u<=f;++u)a[Ft[u]>>c]=l}else for(a=new jt(o),n=0;n<o;++n)e[n]&&(a[n]=Ft[s[e[n]-1]++]>>15-e[n]);return a},Nt=new At(288);for(Tt=0;Tt<144;++Tt)Nt[Tt]=8;for(Tt=144;Tt<256;++Tt)Nt[Tt]=9;for(Tt=256;Tt<280;++Tt)Nt[Tt]=7;for(Tt=280;Tt<288;++Tt)Nt[Tt]=8;var Wt=new At(32);for(Tt=0;Tt<32;++Tt)Wt[Tt]=5;var qt=Ut(Nt,9,0),Xt=Ut(Nt,9,1),Kt=Ut(Wt,5,0),Jt=Ut(Wt,5,1),Vt=function(e){for(var t=e[0],r=1;r<e.length;++r)e[r]>t&&(t=e[r]);return t},Qt=function(e,t,r){var o=t/8|0;return(e[o]|e[o+1]<<8)>>(7&t)&r},Gt=function(e,t){var r=t/8|0;return(e[r]|e[r+1]<<8|e[r+2]<<16)>>(7&t)},Zt=function(e){return(e+7)/8|0},Yt=function(e,t,r){return(null==r||r>e.length)&&(r=e.length),new At(e.subarray(t,r))},er=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],tr=function(e,t,r){var o=new Error(t||er[e]);if(o.code=e,Error.captureStackTrace&&Error.captureStackTrace(o,tr),!r)throw o;return o},rr=function(e,t,r){r<<=7&t;var o=t/8|0;e[o]|=r,e[o+1]|=r>>8},or=function(e,t,r){r<<=7&t;var o=t/8|0;e[o]|=r,e[o+1]|=r>>8,e[o+2]|=r>>16},nr=function(e,t){for(var r=[],o=0;o<e.length;++o)e[o]&&r.push({s:o,f:e[o]});var n=r.length,i=r.slice();if(!n)return{t:ur,l:0};if(1==n){var a=new At(r[0].s+1);return a[r[0].s]=1,{t:a,l:1}}r.sort(function(e,t){return e.f-t.f}),r.push({s:-1,f:25001});var s=r[0],c=r[1],l=0,d=1,u=2;for(r[0]={s:-1,f:s.f+c.f,l:s,r:c};d!=n-1;)s=r[r[l].f<r[u].f?l++:u++],c=r[l!=d&&r[l].f<r[u].f?l++:u++],r[d++]={s:-1,f:s.f+c.f,l:s,r:c};var f=i[0].s;for(o=1;o<n;++o)i[o].s>f&&(f=i[o].s);var p=new jt(f+1),h=ir(r[d-1],p,0);if(h>t){o=0;var y=0,v=h-t,_=1<<v;for(i.sort(function(e,t){return p[t.s]-p[e.s]||e.f-t.f});o<n;++o){var g=i[o].s;if(!(p[g]>t))break;y+=_-(1<<h-p[g]),p[g]=t}for(y>>=v;y>0;){var b=i[o].s;p[b]<t?y-=1<<t-p[b]++-1:++o}for(;o>=0&&y;--o){var m=i[o].s;p[m]==t&&(--p[m],++y)}h=t}return{t:new At(p),l:h}},ir=function(e,t,r){return-1==e.s?Math.max(ir(e.l,t,r+1),ir(e.r,t,r+1)):t[e.s]=r},ar=function(e){for(var t=e.length;t&&!e[--t];);for(var r=new jt(++t),o=0,n=e[0],i=1,a=function(e){r[o++]=e},s=1;s<=t;++s)if(e[s]==n&&s!=t)++i;else{if(!n&&i>2){for(;i>138;i-=138)a(32754);i>2&&(a(i>10?i-11<<5|28690:i-3<<5|12305),i=0)}else if(i>3){for(a(n),--i;i>6;i-=6)a(8304);i>2&&(a(i-3<<5|8208),i=0)}for(;i--;)a(n);i=1,n=e[s]}return{c:r.subarray(0,o),n:t}},sr=function(e,t){for(var r=0,o=0;o<t.length;++o)r+=e[o]*t[o];return r},cr=function(e,t,r){var o=r.length,n=Zt(t+2);e[n]=255&o,e[n+1]=o>>8,e[n+2]=255^e[n],e[n+3]=255^e[n+1];for(var i=0;i<o;++i)e[n+i+4]=r[i];return 8*(n+4+o)},lr=function(e,t,r,o,n,i,a,s,c,l,d){rr(t,d++,r),++n[256];for(var u=nr(n,15),f=u.t,p=u.l,h=nr(i,15),y=h.t,v=h.l,_=ar(f),g=_.c,b=_.n,m=ar(y),w=m.c,k=m.n,x=new jt(19),B=0;B<g.length;++B)++x[31&g[B]];for(B=0;B<w.length;++B)++x[31&w[B]];for(var S=nr(x,7),A=S.t,j=S.l,C=19;C>4&&!A[Et[C-1]];--C);var R,$,E,H,z=l+5<<3,O=sr(n,Nt)+sr(i,Wt)+a,M=sr(n,f)+sr(i,y)+a+14+3*C+sr(x,A)+2*x[16]+3*x[17]+7*x[18];if(c>=0&&z<=O&&z<=M)return cr(t,d,e.subarray(c,c+l));if(rr(t,d,1+(M<O)),d+=2,M<O){R=Ut(f,p,0),$=f,E=Ut(y,v,0),H=y;var D=Ut(A,j,0);rr(t,d,b-257),rr(t,d+5,k-1),rr(t,d+10,C-4),d+=14;for(B=0;B<C;++B)rr(t,d+3*B,A[Et[B]]);d+=3*C;for(var L=[g,w],P=0;P<2;++P){var F=L[P];for(B=0;B<F.length;++B){var T=31&F[B];rr(t,d,D[T]),d+=A[T],T>15&&(rr(t,d,F[B]>>5&127),d+=F[B]>>12)}}}else R=qt,$=Nt,E=Kt,H=Wt;for(B=0;B<s;++B){var I=o[B];if(I>255){or(t,d,R[(T=I>>18&31)+257]),d+=$[T+257],T>7&&(rr(t,d,I>>23&31),d+=Rt[T]);var U=31&I;or(t,d,E[U]),d+=H[U],U>3&&(or(t,d,I>>5&8191),d+=$t[U])}else or(t,d,R[I]),d+=$[I]}return or(t,d,R[256]),d+$[256]},dr=new Ct([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),ur=new At(0),fr=function(){for(var e=new Int32Array(256),t=0;t<256;++t){for(var r=t,o=9;--o;)r=(1&r&&-306674912)^r>>>1;e[t]=r}return e}(),pr=function(e,t,r,o,n){if(!n&&(n={l:1},t.dictionary)){var i=t.dictionary.subarray(-32768),a=new At(i.length+e.length);a.set(i),a.set(e,i.length),e=a,n.w=i.length}return function(e,t,r,o,n,i){var a=i.z||e.length,s=new At(o+a+5*(1+Math.ceil(a/7e3))+n),c=s.subarray(o,s.length-n),l=i.l,d=7&(i.r||0);if(t){d&&(c[0]=i.r>>3);for(var u=dr[t-1],f=u>>13,p=8191&u,h=(1<<r)-1,y=i.p||new jt(32768),v=i.h||new jt(h+1),_=Math.ceil(r/3),g=2*_,b=function(t){return(e[t]^e[t+1]<<_^e[t+2]<<g)&h},m=new Ct(25e3),w=new jt(288),k=new jt(32),x=0,B=0,S=i.i||0,A=0,j=i.w||0,C=0;S+2<a;++S){var R=b(S),$=32767&S,E=v[R];if(y[$]=E,v[R]=$,j<=S){var H=a-S;if((x>7e3||A>24576)&&(H>423||!l)){d=lr(e,c,0,m,w,k,B,A,C,S-C,d),A=x=B=0,C=S;for(var z=0;z<286;++z)w[z]=0;for(z=0;z<30;++z)k[z]=0}var O=2,M=0,D=p,L=$-E&32767;if(H>2&&R==b(S-L))for(var P=Math.min(f,H)-1,F=Math.min(32767,S),T=Math.min(258,H);L<=F&&--D&&$!=E;){if(e[S+O]==e[S+O-L]){for(var I=0;I<T&&e[S+I]==e[S+I-L];++I);if(I>O){if(O=I,M=L,I>P)break;var U=Math.min(L,I-2),N=0;for(z=0;z<U;++z){var W=S-L+z&32767,q=W-y[W]&32767;q>N&&(N=q,E=W)}}}L+=($=E)-(E=y[$])&32767}if(M){m[A++]=268435456|Mt[O]<<18|Pt[M];var X=31&Mt[O],K=31&Pt[M];B+=Rt[X]+$t[K],++w[257+X],++k[K],j=S+O,++x}else m[A++]=e[S],++w[e[S]]}}for(S=Math.max(S,j);S<a;++S)m[A++]=e[S],++w[e[S]];d=lr(e,c,l,m,w,k,B,A,C,S-C,d),l||(i.r=7&d|c[d/8|0]<<3,d-=7,i.h=v,i.p=y,i.i=S,i.w=j)}else{for(S=i.w||0;S<a+l;S+=65535){var J=S+65535;J>=a&&(c[d/8|0]=l,J=a),d=cr(c,d+1,e.subarray(S,J))}i.i=a}return Yt(s,0,o+Zt(d)+n)}(e,null==t.level?6:t.level,null==t.mem?n.l?Math.ceil(1.5*Math.max(8,Math.min(13,Math.log(e.length)))):20:12+t.mem,r,o,n)},hr=function(e,t,r){for(;r;++t)e[t]=r,r>>>=8};function yr(e,t){t||(t={});var r=function(){var e=-1;return{p:function(t){for(var r=e,o=0;o<t.length;++o)r=fr[255&r^t[o]]^r>>>8;e=r},d:function(){return~e}}}(),o=e.length;r.p(e);var n,i=pr(e,t,10+((n=t).filename?n.filename.length+1:0),8),a=i.length;return function(e,t){var r=t.filename;if(e[0]=31,e[1]=139,e[2]=8,e[8]=t.level<2?4:9==t.level?2:0,e[9]=3,0!=t.mtime&&hr(e,4,Math.floor(new Date(t.mtime||Date.now())/1e3)),r){e[3]=8;for(var o=0;o<=r.length;++o)e[o+10]=r.charCodeAt(o)}}(i,t),hr(i,a-8,r.d()),hr(i,a-4,o),i}function vr(e,t){var r,o,n=function(e){31==e[0]&&139==e[1]&&8==e[2]||tr(6,"invalid gzip data");var t=e[3],r=10;4&t&&(r+=2+(e[10]|e[11]<<8));for(var o=(t>>3&1)+(t>>4&1);o>0;o-=!e[r++]);return r+(2&t)}(e);return n+8>e.length&&tr(6,"invalid gzip data"),function(e,t,r,o){var n=e.length;if(!n||t.f&&!t.l)return r||new At(0);var i=!r,a=i||2!=t.i,s=t.i;i&&(r=new At(3*n));var c=function(e){var t=r.length;if(e>t){var o=new At(Math.max(2*t,e));o.set(r),r=o}},l=t.f||0,d=t.p||0,u=t.b||0,f=t.l,p=t.d,h=t.m,y=t.n,v=8*n;do{if(!f){l=Qt(e,d,1);var _=Qt(e,d+1,3);if(d+=3,!_){var g=e[(R=Zt(d)+4)-4]|e[R-3]<<8,b=R+g;if(b>n){s&&tr(0);break}a&&c(u+g),r.set(e.subarray(R,b),u),t.b=u+=g,t.p=d=8*b,t.f=l;continue}if(1==_)f=Xt,p=Jt,h=9,y=5;else if(2==_){var m=Qt(e,d,31)+257,w=Qt(e,d+10,15)+4,k=m+Qt(e,d+5,31)+1;d+=14;for(var x=new At(k),B=new At(19),S=0;S<w;++S)B[Et[S]]=Qt(e,d+3*S,7);d+=3*w;var A=Vt(B),j=(1<<A)-1,C=Ut(B,A,1);for(S=0;S<k;){var R,$=C[Qt(e,d,j)];if(d+=15&$,(R=$>>4)<16)x[S++]=R;else{var E=0,H=0;for(16==R?(H=3+Qt(e,d,3),d+=2,E=x[S-1]):17==R?(H=3+Qt(e,d,7),d+=3):18==R&&(H=11+Qt(e,d,127),d+=7);H--;)x[S++]=E}}var z=x.subarray(0,m),O=x.subarray(m);h=Vt(z),y=Vt(O),f=Ut(z,h,1),p=Ut(O,y,1)}else tr(1);if(d>v){s&&tr(0);break}}a&&c(u+131072);for(var M=(1<<h)-1,D=(1<<y)-1,L=d;;L=d){var P=(E=f[Gt(e,d)&M])>>4;if((d+=15&E)>v){s&&tr(0);break}if(E||tr(2),P<256)r[u++]=P;else{if(256==P){L=d,f=null;break}var F=P-254;if(P>264){var T=Rt[S=P-257];F=Qt(e,d,(1<<T)-1)+Ot[S],d+=T}var I=p[Gt(e,d)&D],U=I>>4;if(I||tr(3),d+=15&I,O=Lt[U],U>3&&(T=$t[U],O+=Gt(e,d)&(1<<T)-1,d+=T),d>v){s&&tr(0);break}a&&c(u+131072);var N=u+F;if(u<O){var W=0-O,q=Math.min(O,N);for(W+u<0&&tr(3);u<q;++u)r[u]=o[W+u]}for(;u<N;++u)r[u]=r[u-O]}}t.l=f,t.p=L,t.b=u,t.f=l,f&&(l=1,t.m=h,t.d=p,t.n=y)}while(!l);return u!=r.length&&i?Yt(r,0,u):r.subarray(0,u)}(e.subarray(n,-8),{i:2},new At((o=(r=e).length,(r[o-4]|r[o-3]<<8|r[o-2]<<16|r[o-1]<<24)>>>0)),t)}var _r="undefined"!=typeof TextDecoder&&new TextDecoder;try{_r.decode(ur,{stream:!0})}catch(e){}function gr(e){try{return JSON.parse(e)}catch{return null}}function br(e){if(!e||"string"!=typeof e)return new Uint8Array(0);const t=e.length;if(t<=0)return new Uint8Array(0);const r=new Uint8Array(t);for(let o=0;o<t;o++)r[o]=255&e.charCodeAt(o);return r}function mr(e){const t=[];for(let r=0;r<e.length;r++)t[r>>>2]|=e[r]<<24-r%4*8;return St.lib.WordArray.create(t,e.length)}function wr(e){const t=e.words,r=e.sigBytes,o=new Uint8Array(r);for(let e=0;e<r;e++)o[e]=t[e>>>2]>>>24-e%4*8&255;return o}function kr(e,t=l.defaultDeviceType){const r=l.passwords[t]||l.passwords[l.defaultDeviceType],o=function(e){const t=e.replace(/-/g,""),r=new Uint8Array(t.length/2);for(let e=0;e<t.length;e+=2)r[e/2]=parseInt(t.substr(e,2),16);return r}(e),n=(new TextEncoder).encode(r);return wr(St.HmacSHA256(mr(o),mr(n)))}function xr(e,r,o){try{let n,i=null;if("string"==typeof e)i=e;else if(e instanceof Uint8Array)try{i=(new TextDecoder).decode(e)}catch{}else if(e instanceof ArrayBuffer)try{i=(new TextDecoder).decode(new Uint8Array(e))}catch{}if(i){const e=gr(i);if(e&&(void 0!==e.status||void 0!==e.code||void 0!==e.data))return t.debug("decryptResponse: body 已是明文 JSON，跳过解密"),{json:e,plain:i,decompressed:null}}if(null==e)return t.error("decryptResponse: body 为 null/undefined"),null;if("string"==typeof e)n=br(e);else if(e instanceof Uint8Array)n=e;else if(e instanceof ArrayBuffer)n=new Uint8Array(e);else if("object"==typeof e&&e.buffer instanceof ArrayBuffer)n=new Uint8Array(e.buffer,e.byteOffset||0,e.byteLength);else if("object"==typeof e&&void 0!==e.byteLength)n=new Uint8Array(e);else try{n=br(String(e))}catch{return t.error("decryptResponse: 不支持的 body 类型 "+typeof e),null}if(t.debug(`decryptResponse: bytes len=${n.length}, head=[${n.slice(0,16).join(",")}]`),t.debug(`decryptResponse: final bytes len=${n.length}`),n.length<l.ivLength+16){if(t.warn(`decryptResponse: body 太短 ${n.length}`),"string"!=typeof e)return null;try{if(n=wr(St.enc.Base64.parse(e)),t.debug(`decryptResponse: base64 解码后 bytes len=${n.length}, head=[${n.slice(0,16).join(",")}]`),n.length<l.ivLength+16)return t.warn(`decryptResponse: base64 解码后仍然太短 ${n.length}`),null}catch{return t.warn("decryptResponse: base64 解码失败"),null}}const a=n.slice(0,l.ivLength),s=n.slice(l.ivLength),c=kr(r,o);let d;t.debug(`decryptResponse: key=[${c.slice(0,8).join(",")}...] iv=[${a.slice(0,8).join(",")}...]`);try{d=St.AES.decrypt({ciphertext:mr(s)},mr(c),{iv:mr(a),mode:St.mode.CBC,padding:St.pad.Pkcs7})}catch(r){if("string"!=typeof e)throw r;{t.debug("decryptResponse: AES 解密失败，尝试 base64 解码 body");n=wr(St.enc.Base64.parse(e));const r=n.slice(0,l.ivLength),o=n.slice(l.ivLength);d=St.AES.decrypt({ciphertext:mr(o)},mr(c),{iv:mr(r),mode:St.mode.CBC,padding:St.pad.Pkcs7})}}const u=wr(d);let f;t.debug(`decryptResponse: AES 解密后 ptBytes len=${u.length}`);try{f=function(e){return vr(e)}(u)}catch{t.debug("decryptResponse: gunzip 失败，使用原始解密数据"),f=u}const p=(new TextDecoder).decode(f);t.debug(`decryptResponse: plain len=${p.length}, head=${p.slice(0,100)}`);const h=gr(p);return h?{json:h,plain:p,decompressed:f}:(t.warn("decryptResponse: JSON 解析失败"),null)}catch(e){t.error(`decryptResponse 异常: ${e}`);try{console.log(`[HD] decryptResponse stack: ${e?.stack}`)}catch{}return null}}function Br(e,t,r){const o=(new TextEncoder).encode(e),n=yr(o);const i=function(e){const t=new Uint8Array(e);for(let r=0;r<e;r++)t[r]=Math.floor(256*Math.random());return t}(l.ivLength),a=kr(t,r),s=wr(St.AES.encrypt(mr(n),mr(a),{iv:mr(i),mode:St.mode.CBC,padding:St.pad.Pkcs7}).ciphertext),c=new Uint8Array(l.ivLength+s.length);return c.set(i,0),c.set(s,l.ivLength),function(e){let t="";for(let r=0;r<e.length;r+=32768)t+=String.fromCharCode.apply(null,e.subarray(r,r+32768));return t}(c)}async function Sr(e,r,o){const n=e.url||"";t.group(`Response ${n}`),t.debug(`request headers keys: ${Object.keys(e.headers||{}).join(",")}`),t.debug(`response headers keys: ${Object.keys(r?.headers||{}).join(",")}`);const i=c(e.headers||{},"requestid")||c(e.headers||{},"requestId")||c(e.headers||{},"Request-Id")||c(r?.headers||{},"requestid")||c(r?.headers||{},"requestId")||c(r?.headers||{},"Requestid"),a=c(e.headers||{},"devicetype")||c(e.headers||{},"deviceType")||c(e.headers||{},"Device-Type")||"web";t.debug(`requestId=${i}, deviceType=${a}`);let s=r?.bodyBytes||r?.rawBody||r?.body;try{t.debug(`[HD] response body: type=${typeof s}, constructor=${s?.constructor?.name}, hasBodyBytes=${!!r?.bodyBytes}, hasRawBody=${!!r?.rawBody}, hasBody=${!!r?.body}`)}catch{}try{const o=function(e){return/\/api\/system\/info/.test(e)?g:/\/api\/ad\/policy/.test(e)?F:/\/api\/user\/info/.test(e)?m:/\/api\/drama\/play/.test(e)?j:/\/api\/drama\/doBuy/.test(e)?C:/\/api\/drama\/detail/.test(e)?A:/\/api\/up\/episodePreview/.test(e)?O:/\/api\/up\/bannerList/.test(e)?M:/\/api\/up\/episodeFeed/.test(e)?$:/\/api\/up\/recommend/.test(e)?E:/\/api\/up\/home/.test(e)?D:/\/api\/up\/content/.test(e)?L:/\/api\/up\/episodeList/.test(e)?P:/\/api\/up\/detail/.test(e)?z:/\/api\/drama\/navBlock/.test(e)||/\/api\/movie\/navBlock/.test(e)?x:/\/api\/movie\/detail/.test(e)?A:/\/api\/drama\/navFilter/.test(e)||/\/api\/movie\/navFilter/.test(e)||/\/api\/drama\/searchResult/.test(e)||/\/api\/search\/movie/.test(e)||/\/api\/drama\/more/.test(e)||/\/api\/drama\/rank/.test(e)?x:/\/api\/drama\/topicDetail/.test(e)?A:/\/api\/drama\/topicList/.test(e)||/\/api\/drama\/favorite/.test(e)||/\/api\/movie\/favorite/.test(e)||/\/api\/movie\/love/.test(e)||/\/api\/drama\/love/.test(e)||/\/api\/movie\/history/.test(e)||/\/api\/user\/favorite/.test(e)||/\/api\/drama\/wish/.test(e)?x:/\/api\/user\/home/.test(e)||/\/api\/user\/vip/.test(e)?m:null}(n);if(!o)return void t.debug("无匹配 handler，透传");t.debug(`匹配 handler: ${o.name}`);const c=function(e,r,o,n,i){if(!e)return t.warn("body 为空"),null;const a=xr(e,o,n);if(!a)return t.error("解密失败"),null;const{json:s,plain:c,decompressed:l}=a;if(null!==l&&!o)return t.warn("加密 body 但未找到 requestId，无法重加密"),null;if(t.debug(`解密成功: ${c.slice(0,200)}`),!r(s,i))return t.debug("handler 返回 false，无需改写"),null;t.debug("handler 返回 true，开始重加密");const d=JSON.stringify(s);if(null===l)return t.debug("原始为明文 JSON，返回明文"),{body:(function(e){let t="";for(let r=0;r<e.length;r+=32768)t+=String.fromCharCode.apply(null,e.subarray(r,r+32768));return t})(__hdUtf8Enc(d)),payload:s};const u=Br(d,o,n);return u?{body:u,payload:s}:(t.error("重加密失败"),null)}(s,o,i,a,e);if(!c?.body)return void t.debug("未变更或无需改写，透传");{const e=br(c.body);e.length>0&&(r.body=e,r.bodyBytes=e,r.rawBody=e,r.headers&&(delete r.headers["Content-Encoding"],delete r.headers["content-encoding"],delete r.headers["Transfer-Encoding"],delete r.headers["transfer-encoding"],r.headers["Content-Length"]=String(e.length)),r.status=200,r.statusCode=200),t.debug(`返回 Uint8Array, len=${e.length}`),t.info("已解密改写并重加密响应")}return r}finally{t.groupEnd()}}



try { if (typeof t !== "undefined" && t && typeof t.logLevel !== "undefined") t.logLevel = "warn"; } catch (e) {}

var HD_win        = window;
var HD_store      = a;
var HD_headerGet  = c;
var HD_parseBody  = xr;
var HD_runResp    = Sr;
var HD_KEY        = "huangdou_play_ctx";
var HD_CTX_BY_RID = {};

var HD_DOMAINS = ["cocoaview.cc","hdmgdj.com","sxqirtho.top","qicuknlj.top","ferncider.cc","hvthtcpa.top","onyxripple.cc","vivifable.top","kucvcxrv.cc","larkgarden.top","niniharbor.top","larksummit.icu","lzlukvca.cc","iwgsqufx.cc","nbsito.top","tideember.cc","momodrift.top","zuzuspot.top","zuzucast.top","glowcanvas.cc","eyeonneb.cc","cocoacider.cc","nbyuikk.top","reefbloom.icu","yoyoflow.cc","riripixel.cc","iriscider.cc","bobacast.icu","tamaripple.cc","pomrrsrm.cc","svlyibwt.cc","hddj01.com","hddj02.com","hddj03.com","voltwillow.cc","yuhterdss.cc","hddj08.com","hddj09.com","hddj22.com"];


var HD_PROC_PATH = /\/api\/(?:system\/info|ad\/policy|user\/info|user\/home|user\/vip|user\/favorite|drama\/play|drama\/doBuy|drama\/detail|drama\/navBlock|drama\/navFilter|drama\/searchResult|drama\/more|drama\/rank|drama\/topicDetail|drama\/topicList|drama\/favorite|drama\/love|drama\/wish|movie\/navBlock|movie\/detail|movie\/navFilter|movie\/favorite|movie\/love|movie\/history|search\/movie|up\/episodePreview|up\/bannerList|up\/episodeFeed|up\/recommend|up\/home|up\/content|up\/episodeList|up\/detail|up\/unlock|up\/access|up\/subscribe)/;

function hdIsTargetHost(host) {
  if (!host) return false;
  host = String(host).toLowerCase();
  for (var i = 0; i < HD_DOMAINS.length; i++) {
    var d = HD_DOMAINS[i];
    if (host === d) return true;
    if (host.length > d.length + 1 && host.slice(host.length - d.length - 1) === "." + d) return true;
  }
  return false;
}
function hdIsApi(url) {
  if (!url) return false;
  var u = null;
  try { u = new URL(String(url), location.href); } catch (e) { return false; }
  return hdIsTargetHost(u.hostname) && /\/api\//.test(u.pathname);
}
function hdShouldProcess(url) { return !!url && HD_PROC_PATH.test(String(url)); }


function hdHeadersObj(h) {
  var out = {};
  try {
    if (!h) return out;
    if (typeof Headers !== "undefined" && h instanceof Headers) { h.forEach(function (v, k) { out[k] = v; }); return out; }
    if (Array.isArray(h)) { for (var i = 0; i < h.length; i++) { var p = h[i]; if (p && p.length === 2) out[p[0]] = String(p[1]); } return out; }
    var ks = Object.keys(h);
    for (var j = 0; j < ks.length; j++) out[ks[j]] = String(h[ks[j]]);
  } catch (e) {}
  return out;
}
function hdGetHeader(h, name) {
  var ks = Object.keys(h || {});
  for (var i = 0; i < ks.length; i++) if (ks[i].toLowerCase() === String(name).toLowerCase()) return h[ks[i]];
  return "";
}
function hdReadBody(body) {
  if (body == null) return Promise.resolve(null);
  if (typeof body === "string") return Promise.resolve(body);
  if (typeof Blob !== "undefined" && body instanceof Blob) { try { return body.text(); } catch (e) { return Promise.resolve(null); } }
  if (body instanceof ArrayBuffer) return Promise.resolve(new Uint8Array(body));
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(body)) return Promise.resolve(new Uint8Array(body.buffer, body.byteOffset, body.byteLength));
  if (typeof body === "object" && typeof body.arrayBuffer === "function") { try { return body.arrayBuffer().then(function (ab) { return new Uint8Array(ab); }); } catch (e) { return Promise.resolve(null); } }
  return Promise.resolve(null);
}


function hdCachePlayRequest(reqUrl, reqHeaders, bodyVal) {
  if (!reqUrl) return;
  if (!/\/api\/(?:drama\/play|up\/episodePreview)/.test(String(reqUrl))) return;
  try {
    var rid = HD_headerGet(reqHeaders, "requestid") || HD_headerGet(reqHeaders, "requestId");
    var dt  = HD_headerGet(reqHeaders, "devicetype") || HD_headerGet(reqHeaders, "deviceType") || "web";
    if (!bodyVal || !rid) return;
    var parsed = HD_parseBody(bodyVal, rid, dt);
    if (!parsed || !parsed.json) return;
    var data = parsed.json.data || parsed.json;
    var ctx = { id: String(data.id || ""), seq: String(data.seq || ""), drama_id: String(data.drama_id || data.id || "") };
    HD_store.setItem(HD_KEY, ctx);
    try { HD_CTX_BY_RID[rid] = ctx; } catch (e) {}
  } catch (e) {}
}


function hdDropCoding(headers) {
  var out = {};
  var ks = Object.keys(headers || {});
  for (var i = 0; i < ks.length; i++) {
    var k = ks[i], lk = k.toLowerCase();
    if (lk === "content-encoding" || lk === "transfer-encoding" || lk === "content-length") continue;
    out[k] = headers[k];
  }
  return out;
}
async function hdProcess(method, url, reqHeadersObj, status, statusText, respHeadersObj, bytes) {
  var outHeaders = {};
  try { outHeaders = hdDropCoding(respHeadersObj || {}); } catch (e) { outHeaders = {}; }
  var request = { url: String(url || ""), method: String(method || "GET").toUpperCase(), headers: reqHeadersObj || {} };
  if (/\/api\/(?:drama\/play|up\/episodePreview)/.test(request.url)) {
    try {
      var _rid = HD_headerGet(request.headers, "requestid") || HD_headerGet(request.headers, "requestId");
      var cb = (_rid && HD_CTX_BY_RID[_rid]) || null;
      if (!(cb && typeof cb === "object" && cb.id)) cb = HD_store.getItem(HD_KEY, null);
      if (cb && typeof cb === "object" && cb.id) request.__cachedBody = cb;
    } catch (e) {}
  }
  var response = { url: request.url, method: request.method, headers: outHeaders, status: status, statusText: statusText || "", bodyBytes: bytes };
  var out = null;
  try { out = await HD_runResp(request, response); } catch (e) { try { console.log("[HD] Sr error: ", e); } catch (_) {} }
  if (out && out.body instanceof Uint8Array && out.body.length > 0) {
    var h = {};
    try { h = hdDropCoding(out.headers || outHeaders); } catch (e) { h = outHeaders; }
    h["Content-Length"] = String(out.body.length);
    return { bytes: out.body, headers: h };
  }
  return { bytes: bytes, headers: outHeaders };
}


var HD_origFetch = (typeof HD_win.fetch === "function") ? HD_win.fetch.bind(HD_win) : null;

async function hdFetchHandle(input, init, method, slf, arg) {
  var reqUrl = (typeof input === "string") ? input : ((input && input.url) ? input.url : "");
  var reqHeadersObj = {};
  try { reqHeadersObj = hdHeadersObj((init && init.headers) || (input && input.headers) || {}); } catch (e) {}
  try {
    var bodyVal = null;
    var cand = (init && Object.prototype.hasOwnProperty.call(init, "body")) ? init.body : null;
    if (cand == null && input && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "body")) cand = input.body;
    if (cand != null) bodyVal = await hdReadBody(cand);
    hdCachePlayRequest(reqUrl, reqHeadersObj, bodyVal);
  } catch (e) {}
  if (!hdShouldProcess(reqUrl)) return HD_origFetch.apply(slf, arg);
  var resp = await HD_origFetch.apply(slf, arg);
  try {
    var buf = await resp.arrayBuffer();
    var bytes = new Uint8Array(buf);
    var finalUrl = resp.url || reqUrl;
    var rh = hdHeadersObj(resp.headers);
    var pro = await hdProcess(method, finalUrl, reqHeadersObj, resp.status, resp.statusText, rh, bytes);
    if (pro.bytes !== bytes) HD_uiRewritten = (HD_uiRewritten || 0) + 1;
    return new Response(pro.bytes, { status: resp.status, statusText: resp.statusText || "", headers: new Headers(pro.headers) });
  } catch (e) {
    try { console.log("[HD] fetch rewrite fail: ", e); } catch (_) {}
    return resp;
  }
}

if (HD_origFetch) {
  HD_win.fetch = function (input, init) {
    var reqUrl = "", method = "GET";
    try {
      if (typeof input === "string") reqUrl = input;
      else if (input && typeof input === "object") { reqUrl = input.url || ""; if (input.method) method = String(input.method).toUpperCase(); }
      if (init && init.method) method = String(init.method).toUpperCase();
    } catch (e) {}
    if (reqUrl) {
      var hgBlock = false;
      try { hgBlock = !!hdAdBlockFetchUrl(reqUrl); } catch (e) {}
      if (hgBlock) {
        return Promise.resolve(new Response("{}", { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } }));
      }
      if (hdIsApi(reqUrl)) return hdFetchHandle(input, init, method, this, arguments);
    }
    return HD_origFetch.apply(this, arguments);
  };
}


var HD_OrigXHR = HD_win.XMLHttpRequest;

function HD_makeXHR() {
  var S = {
    mode: 0,            
    inner: null,
    url: "", method: "GET", async: true,
    headers: {},       
    events: {},         
    props: {},          
    rs: 0, st: 0, stText: "", rType: "", rText: "", rURL: "", rType_ok: true,
    respHeaders: {}, rbytes: null, time: 0, withC: false, aborted: false, sent: false,
    uploadObj: { addEventListener: function () {}, removeEventListener: function () {} }
  };
  var P = null;

  function on(type, fn) { if (typeof fn === "function") (S.events[type] = S.events[type] || []).push(fn); }
  function off(type, fn) { var a = S.events[type]; if (!a) return; for (var i = a.length - 1; i >= 0; i--) if (a[i] === fn) a.splice(i, 1); }
  function fire(type, extra) {
    var arr = ((S.events[type] || []).slice()).concat(S.props[type] ? [S.props[type]] : []);
    var ev = { type: type, target: P, currentTarget: P, lengthComputable: false, loaded: 0, total: 0 };
    for (var k in (extra || {})) ev[k] = extra[k];
    for (var i = 0; i < arr.length; i++) { try { arr[i].call(P, ev); } catch (e) { try { console.log("[HD] xhr ev", e); } catch (_) {} } }
  }
  function computeText() {
    if (S.rbytes == null) { S.rText = ""; return; }
    try { S.rText = new TextDecoder().decode(S.rbytes); } catch (e) { S.rText = ""; }
  }
  function finishOk(resp) {
    var buf = resp.arrayBuffer().then(function (ab) {
      return new Uint8Array(ab);
    });
    return buf.then(function (bytes) {
      var hobj = {};
      for (var k in S.headers) hobj[S.headers[k].n] = S.headers[k].v;
      var rh = hdHeadersObj(resp.headers);
      return hdProcess(S.method, resp.url || S.url, hobj, resp.status, resp.statusText, rh, bytes);
    }).then(function (pro) {
      S.st = 200; S.stText = "";
      try { S.st = pro.status != null ? pro.status : respStatus(pro) ; } catch (e) {}
      S.respHeaders = pro.headers; S.rbytes = pro.bytes; S.rURL = resp.url || S.url; computeText();
      S.rs = 4;
      fire("readystatechange"); fire("load"); fire("loadend");
    });
  }
  function respStatus(pro) { return 200; }

  function emuSend(body) {
    var method = S.method, url = S.url, hdrs = {};
    for (var k in S.headers) hdrs[S.headers[k].n] = S.headers[k].v;
    (async function () {
      try {
        var hobj = {};
        for (var k2 in S.headers) hobj[S.headers[k2].n] = S.headers[k2].v;
        var bval = await hdReadBody(body);
        hdCachePlayRequest(url, hobj, bval);
        S.rs = 2; fire("readystatechange");
        S.rs = 3; fire("readystatechange");
        var init = { method: method, headers: hdrs, credentials: "same-origin" };
        if (body != null && body !== "" && method !== "GET" && method !== "HEAD") init.body = body;
        var resp = await HD_origFetch(url, init);
        var buf = await resp.arrayBuffer();
        var bytes = new Uint8Array(buf);
        var rh = hdHeadersObj(resp.headers);
        var pro = await hdProcess(method, resp.url || url, hobj, resp.status, resp.statusText, rh, bytes);
        if (pro.bytes !== bytes) HD_uiRewritten = (HD_uiRewritten || 0) + 1;
        S.st = resp.status; S.stText = resp.statusText || "";
        S.respHeaders = pro.headers; S.rbytes = pro.bytes; S.rURL = resp.url || url; computeText();
        S.rs = 4;
        fire("readystatechange"); fire("load"); fire("loadend");
      } catch (e) {
        if (S.aborted) { S.rs = 0; fire("abort"); fire("loadend"); return; }
        S.rs = 4; S.st = 0;
        fire("readystatechange"); fire("error"); fire("loadend");
      }
    })();
  }


  function open(method, url, async) {
    S.method = String(method || "GET").toUpperCase();
    S.url = String(url || "");
    S.async = (async === undefined) ? true : !!async;
    var hgAd = false;
    try { hgAd = !!hdAdBlockXhrUrl(S.url); } catch (e) {}
    if (hgAd && HD_OrigXHR) {
      S.mode = 1;
      S.inner = new HD_OrigXHR();
      try { S.inner.open(method, "data:application/json,{}", S.async); } catch (e2) {}
      return;
    }
    var targetMode = (hdShouldProcess(S.url) && HD_OrigXHR) ? "emu" : "real";
    if (targetMode === "real") {
      if (!HD_OrigXHR) return; 
      S.mode = 1; S.inner = new HD_OrigXHR();
      S.inner.open(method, S.url, S.async);
    } else {
      S.mode = 2; S.rs = 1;
      setTimeout(function () { fire("readystatechange"); }, 0);
    }
  }
  function setRequestHeader(name, value) {
    if (S.mode === 1 && S.inner) { S.inner.setRequestHeader(name, value); return; }
    var lk = String(name).toLowerCase();
    S.headers[lk] = { n: String(name), v: String(value) };
  }
  function send(body) {
    if (S.mode === 1 && S.inner) { try { S.inner.send(body); } catch (e) {} return; }
    if (S.mode !== 2 || S.sent) return;
    S.sent = true;
    fire("loadstart");
    emuSend(body);
  }
  function abort() {
    if (S.mode === 1 && S.inner) { S.inner.abort(); return; }
    S.aborted = true; S.rs = 0;
    fire("abort"); fire("loadend");
  }
  function getAllResponseHeaders() {
    if (S.mode === 1 && S.inner) return S.inner.getAllResponseHeaders();
    var lines = [];
    for (var k in S.respHeaders) lines.push(k + ": " + S.respHeaders[k]);
    return lines.join("\r\n") + (lines.length ? "\r\n" : "");
  }
  function getResponseHeader(name) {
    if (S.mode === 1 && S.inner) return S.inner.getResponseHeader(name);
    var lk = String(name).toLowerCase();
    for (var k in S.respHeaders) if (k.toLowerCase() === lk) return S.respHeaders[k];
    return null;
  }
  function overrideMimeType(mime) { if (S.mode === 1 && S.inner) S.inner.overrideMimeType(mime); }
  function addEventListener(type, fn, opt) {
    if (S.mode === 1 && S.inner) { S.inner.addEventListener(type, fn, opt); return; }
    on(type, fn);
  }
  function removeEventListener(type, fn, opt) {
    if (S.mode === 1 && S.inner) { S.inner.removeEventListener(type, fn, opt); return; }
    off(type, fn);
  }
  function dispatchEvent(ev) { if (S.mode === 1 && S.inner) return S.inner.dispatchEvent(ev); return false; }

  var METHODS = { open: open, setRequestHeader: setRequestHeader, send: send, abort: abort, getAllResponseHeaders: getAllResponseHeaders, getResponseHeader: getResponseHeader, overrideMimeType: overrideMimeType, addEventListener: addEventListener, removeEventListener: removeEventListener, dispatchEvent: dispatchEvent };

  var ON_LIST = ["onreadystatechange","onload","onerror","onabort","ontimeout","onloadstart","onloadend","onprogress"];

  var handler = {
    get: function (tgt, prop) {
      if (typeof prop === "symbol") return undefined;
      if (METHODS[prop]) return METHODS[prop];
      if (S.mode === 1 && S.inner) {
        if (prop === "upload") return S.inner.upload;
        var rv = S.inner[prop];
        return (typeof rv === "function") ? rv.bind(S.inner) : rv;
      }
      switch (prop) {
        case "readyState": return S.rs;
        case "status": return S.st;
        case "statusText": return S.stText;
        case "responseURL": return S.rURL;
        case "responseType": return S.rType;
        case "timeout": return S.time;
        case "withCredentials": return S.withC;
        case "upload": return S.uploadObj;
        case "responseXML": return null;
        case "responseText": return (S.rType === "arraybuffer") ? "" : S.rText;
        case "response":
          if (S.rbytes == null) return (S.rType === "arraybuffer") ? null : "";
          if (S.rType === "arraybuffer") return S.rbytes.buffer.slice(S.rbytes.byteOffset, S.rbytes.byteOffset + S.rbytes.byteLength);
          if (S.rType === "blob") return new Blob([S.rbytes]);
          if (S.rType === "json") { try { return JSON.parse(S.rText); } catch (e) { return null; } }
          if (S.rType === "document") return null;
          return S.rText;
      }
      return undefined;
    },
    set: function (tgt, prop, val) {
      if (typeof prop === "symbol") return false;
      if (S.mode === 1 && S.inner) {
        if (prop === "timeout") { S.inner.timeout = val; return true; }
        if (prop === "withCredentials") { S.inner.withCredentials = val; return true; }
        if (prop === "responseType") { S.inner.responseType = val; return true; }
        S.inner[prop] = val;
        return true;
      }
      switch (prop) {
        case "responseType":
          if (["", "text", "json", "arraybuffer", "blob", "document"].indexOf(val) >= 0) S.rType = val;
          return true;
        case "timeout": S.time = val; return true;
        case "withCredentials": S.withC = val; return true;
      }
      if (ON_LIST.indexOf(prop) >= 0) { S.props[prop.slice(2)] = val; return true; }
      return true;
    },
    getPrototypeOf: function () { return (HD_OrigXHR && HD_OrigXHR.prototype) || Object.prototype; },
    has: function (tgt, prop) { return prop in METHODS || (typeof prop === "string" && prop.indexOf("on") === 0) || true; }
  };

  var target = { __hd: true };
  P = new Proxy(target, handler);
  return P;
}

function HD_xhrFactory() { return HD_makeXHR(); }
if (HD_OrigXHR && typeof HD_OrigXHR === "function") {
  try { HD_xhrFactory.prototype = HD_OrigXHR.prototype; } catch (e) {}
  HD_win.XMLHttpRequest = HD_xhrFactory;
}


var HD_LOGO = "data:image/jpeg;base64,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";

var HD_uiRewritten = 0;   
var HD_adRemoved   = 0;   
var HD_uiInjected  = false;


function hdCountHit() { HD_uiRewritten = (HD_uiRewritten || 0) + 1; }


function hdCountAd() { HD_adRemoved = (HD_adRemoved || 0) + 1; }

var HD_isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile/i.test(navigator.userAgent || "");

function hdInjectCss() {
  var target = document.head || document.documentElement || document.body;
  if (!target || !target.appendChild) { setTimeout(hdInjectCss, 60); return; }
  if (document.getElementById("hd-ui-style")) return;
  var css = [
    ".hd-fab{position:fixed;left:8px;width:48px;height:48px;bottom:96px;z-index:2147483000;user-select:none;-webkit-user-select:none;touch-action:manipulation;}",
    ".hd-fab-logo{width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid #ffd54a;box-shadow:0 4px 16px rgba(0,0,0,.55);cursor:pointer;background:#1a1214;display:block;pointer-events:auto;}",
    ".hd-fab-dot{position:absolute;top:-2px;right:-2px;width:12px;height:12px;border:1.5px solid #0d0608;border-radius:50%;background:#777;transition:background .3s,box-shadow .3s;pointer-events:none;}",
    ".hd-fab-dot.ok{background:#2ecc40;box-shadow:0 0 10px #2ecc40}",
    ".hd-fab-dot.err{background:#ff4136;box-shadow:0 0 10px #ff4136}",
    ".hd-fab-dot.wait{background:#f0ad4e;box-shadow:0 0 10px #f0ad4e}",
    ".hd-fab-panel{position:absolute;bottom:66px;left:0;width:224px;padding:10px 12px;background:rgba(22,15,17,.97);border:1px solid rgba(255,213,74,.35);border-radius:14px;color:#fff;font-size:12px;line-height:1.7;box-shadow:0 10px 34px rgba(0,0,0,.65);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);z-index:2147483001;display:none;pointer-events:auto;}",
    ".hd-fab-title{font-size:14px;font-weight:700;color:#ffd54a;margin-bottom:6px;text-align:center}",
    ".hd-fab-row{display:flex;align-items:center;gap:6px;font-size:12px}",
    ".hd-fab-row b{margin-left:auto;font-weight:600;color:#ffd54a}",
    ".hd-dot{width:8px;height:8px;border-radius:50%;flex:none}",
    ".hd-dot.ok{background:#2ecc40}.hd-dot.err{background:#ff4136}.hd-dot.wait{background:#f0ad4e}",
    ".hd-fab-divider{height:1px;background:rgba(255,255,255,.12);margin:8px 0}",
    ".hd-fab-note{text-align:center;color:#ffd54a;font-weight:600;margin-bottom:4px;font-size:11px}",
    ".hd-fab-credit{font-size:10px;color:#cfc4c6;line-height:1.6}",
    ".hd-fab-credit a{color:#ffd54a;text-decoration:none}",
    ".hd-fab-stat{font-size:10px;color:#8fe3a0;text-align:center;margin-top:5px}",
    ".hd-toast{position:fixed;top:16%;left:50%;transform:translateX(-50%);background:rgba(22,15,17,.96);color:#ffd54a;padding:11px 20px;border-radius:12px;font-size:13px;border:1px solid rgba(255,213,74,.45);box-shadow:0 8px 28px rgba(0,0,0,.55);z-index:2147483100;pointer-events:none;text-align:center;animation:hdToastIn .25s ease-out}",
    "@keyframes hdToastIn{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}",
    ".hd-toast.hd-hide{opacity:0;transition:opacity .45s}"
  ].join("");
  var st = document.createElement("style");
  st.id = "hd-ui-style";
  st.textContent = css;
  target.appendChild(st);
}

function hdToast(msg) {
  if (!document.body) return;
  var t = document.createElement("div");
  t.className = "hd-toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.classList.add("hd-hide"); setTimeout(function () { try { t.remove(); } catch (e) {} }, 500); }, 2600);
}

function hdCreateFab() {
  if (document.getElementById("hd-fab")) return;
  var wrap = document.createElement("div");
  wrap.id = "hd-fab";
  wrap.className = "hd-fab";
  wrap.innerHTML =
    '<img class="hd-fab-logo" src="' + HD_LOGO + '" alt="" referrerpolicy="no-referrer">' +
    '<span class="hd-fab-dot ok"></span>' +
    '<div class="hd-fab-panel" style="display:none">' +
    '<div class="hd-fab-title">ai短剧助手</div>' +
    '<div class="hd-fab-row"><span class="hd-dot ok"></span>脚本状态<b>已注入</b></div>' +
    '<div class="hd-fab-row"><span class="hd-dot ok"></span>VIP 解锁<b>已开启</b></div>' +
    '<div class="hd-fab-row"><span class="hd-dot ok"></span>去除广告<b>已开启</b></div>' +
    '<div class="hd-fab-divider"></div>' +
    '<div class="hd-fab-note">免费脚本，禁止贩卖</div>' +
    '<div class="hd-fab-credit">黄豆解锁思路来自：<a href="https://t.me/Jsforbaby" target="_blank" rel="noopener">baby（点我跳转）</a></div>' +
    '<div class="hd-fab-credit">黄果去广+油猴移植来自：<a href="https://t.me/ayase520" target="_blank" rel="noopener">新垣绫濑的荷包蛋（查看更多脚本点我）</a></div>' +
    '<div class="hd-fab-stat" id="hd-fab-stat">处理 0 次</div>' +
    '</div>';
  document.body.appendChild(wrap);
  hdMakeFabDraggable(wrap);
  hdRefreshFab();
  return wrap;
}

function hdRefreshFab() {
  var fab = document.getElementById("hd-fab");
  if (!fab) return;
  var dot = fab.querySelector(".hd-fab-dot");
  if (dot) dot.className = "hd-fab-dot " + (HD_uiInjected ? "ok" : "wait");
  var stat = document.getElementById("hd-fab-stat");
  if (stat) stat.textContent = "VIP 改写 " + HD_uiRewritten + " 次 \u00b7 去广告 " + (HD_adRemoved || 0) + " 次";
}

function hdMakeFabDraggable(el) {
  var dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0, last = 0, SIZE = 48;
  function moveTo(cx, cy) {
    if (!dragging) return;
    var now = Date.now();
    if (HD_isMobile && now - last < 50) return;
    last = now;
    var dx = cx - sx, dy = cy - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    var x = Math.min(HD_win.innerWidth - SIZE, Math.max(4, ox + dx));
    var y = Math.min(HD_win.innerHeight - SIZE - 50, Math.max(4, oy + dy));
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.bottom = "auto";
  }
  function down(e, cx, cy) {
    if (e.target && e.target.closest && e.target.closest(".hd-fab-panel")) return;
    dragging = true; moved = false; sx = cx; sy = cy;
    var r = el.getBoundingClientRect(); ox = r.left; oy = r.top;
    el.style.transition = "none";
  }
  function stop() { dragging = false; el.style.transition = ""; }
  el.addEventListener("mousedown", function (e) { down(e, e.clientX, e.clientY); });
  HD_win.addEventListener("mousemove", function (e) { moveTo(e.clientX, e.clientY); });
  HD_win.addEventListener("mouseup", stop);
  el.addEventListener("touchstart", function (e) { if (e.touches[0]) down(e, e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  HD_win.addEventListener("touchmove", function (e) { if (e.touches[0]) { moveTo(e.touches[0].clientX, e.touches[0].clientY); if (dragging && moved) e.preventDefault(); } }, { passive: false });
  HD_win.addEventListener("touchend", stop);
  el.addEventListener("click", function (e) {
    if (moved) { moved = false; return; }
    if (e.target && e.target.closest && e.target.closest(".hd-fab-panel")) return;
    var panel = el.querySelector(".hd-fab-panel");
    if (!panel) return;
    panel.style.display = panel.style.display !== "block" ? "block" : "none";
  });
}

function hdInitUi() {
  hdInjectCss();
  function ready() {
    if (!document.body) { setTimeout(ready, 120); return; }
    hdCreateFab();
    setInterval(hdRefreshFab, 1500);
    try { if (typeof hgStart === "function") hgStart(); } catch (e) {}
    try { console.log("[HD] ai短剧助手 已注入"); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(ready, 200); });
  else setTimeout(ready, 200);
}


var HD_HG_DOMAINS = ["fdxqupvz.cc", "huangguoai.com", "huangguoai.ai", "huangguo4.com", "zxzddtzt.cc", "ediayikma.cc"];
var HD_AD_NETS    = ["jcjoss.com", "fkm6sqh.cc", "hmw3nbp.cc", "qy4wb8k.cc", "xwd6gwp.cc"];

function hdHostMatch(host, list) {
  if (!host) return false;
  host = String(host).toLowerCase();
  for (var i = 0; i < list.length; i++) {
    var d = String(list[i]).toLowerCase();
    if (host === d) return true;
    if (host.length > d.length + 1 && host.slice(host.length - d.length - 1) === "." + d) return true;
  }
  return false;
}
function hdOnHG() {
  try { return hdHostMatch(location.hostname, HD_HG_DOMAINS); } catch (e) { return false; }
}
function hdIsAdHostname(host) { return hdHostMatch(host, HD_AD_NETS); }


function hdAdBlockFetchUrl(raw) {
  if (!hdOnHG() || !raw) return false;
  try { return hdIsAdHostname(new URL(String(raw), location.href).hostname); } catch (e) { return false; }
}
function hdAdBlockXhrUrl(raw) {
  if (!hdOnHG() || !raw) return false;
  try { return hdIsAdHostname(new URL(String(raw), location.href).hostname); } catch (e) { return false; }
}

function hgInjectCss() {
  var target = document.head || document.documentElement || document.body;
  if (!target || !target.appendChild) { setTimeout(hgInjectCss, 80); return; }
  if (document.getElementById("hd-hg-style")) return;
  var rules = [

    ".hg-ssp-slot,[data-ssp-slot-key],.hg-ssp-slot *{display:none!important;visibility:hidden!important;pointer-events:none!important}",
    ".hg-ssp-pause,[data-ssp-pause],.hg-ssp-pause *{display:none!important;visibility:hidden!important;pointer-events:none!important}",
    ".hg-ssp-pause__card{display:none!important}",
    "[data-ssp-render-root],[data-ssp-carousel],[data-ssp-label]{display:none!important;visibility:hidden!important}",
    ".hg-homeway-panel>[data-ssp-slot-key]{display:none!important}",

    "[data-hd-ad-link]{display:none!important}",

    ".hg-hero__thumb[data-hd-ad]{display:none!important}",
    ".hg-hero__bg-img[data-hd-ad]{display:none!important}",
    ".hg-hero__content[data-hd-ad]{display:none!important}",
    ".hg-hero__ad-badge{display:none!important}",
    ".hg-hero[data-hd-adshow] .hg-hero__bg-img.is-active,.hg-hero[data-hd-adshow] .hg-hero__content{visibility:hidden!important;opacity:0!important}"
  ];
  var st = document.createElement("style");
  st.id = "hd-hg-style";
  st.textContent = rules.join("");
  target.appendChild(st);
}


function hgElTitle(el) {
  if (!el) return "";
  var img = el.querySelector ? el.querySelector("img") : null;
  var alt = (img && (img.getAttribute("alt") || "").trim()) || "";
  if (alt) return alt;
  var t = el.querySelector ? el.querySelector("[data-hero-title]") : null;
  if (t) return (t.textContent || "").trim();
  var aria = el.getAttribute ? (el.getAttribute("aria-label") || "").trim() : "";
  return aria;
}


function hgActiveTitle(hero) {
  if (!hero || !hero.querySelector) return "";
  var act = hero.querySelector(".hg-hero__thumb.is-active");
  if (act) { var t = hgElTitle(act); if (t) return t; }
  var bg = hero.querySelector(".hg-hero__bg-img.is-active");
  if (bg) { var a = (bg.getAttribute("alt") || "").trim(); if (a) return a; }
  var ct = hero.querySelector("[data-hero-title]");
  if (ct) { var x = (ct.textContent || "").trim(); if (x) return x; }
  return "";
}


function hgHeroInfo() {
  var info = { ads: [], normals: [] };
  try {
    var sc = document.querySelector('script[type="application/json"][data-hero-slides]');
    if (!sc) return info;
    var arr = null;
    try { arr = JSON.parse(sc.textContent || ""); } catch (e) { return info; }
    if (!arr || !Array.isArray(arr)) return info;
    var kept = [], changed = false, i, s, t;
    for (i = 0; i < arr.length; i++) {
      s = arr[i];
      t = (s && s.title) ? String(s.title).trim() : "";
      if (s && s.isAd) {
        if (t) info.ads.push(t);
        changed = true;
        continue;
      }
      kept.push(s);
      if (t) info.normals.push(t);
    }
    if (changed) { try { sc.textContent = JSON.stringify(kept); } catch (e) {} }
  } catch (e) {}
  return info;
}


function hgIsAdTitle(t, info, domTotal) {
  if (!t) return false;
  if (info.ads.indexOf(t) >= 0) return true;
  if (info.normals.length > 0 && domTotal > info.normals.length && info.normals.indexOf(t) < 0) return true;
  return false;
}


function hgCleanHero() {
  var info = hgHeroInfo();
  var heroes = document.querySelectorAll(".hg-hero,[data-hero-carousel]");
  var h, hero, i, el;
  for (h = 0; h < heroes.length; h++) {
    hero = heroes[h];
    if (!hero || !hero.querySelectorAll) continue;

    var thumbs = hero.querySelectorAll(".hg-hero__thumb");
    var domTotal = thumbs.length;
    var adActive = false;

    for (i = 0; i < thumbs.length; i++) {
      el = thumbs[i];
      if (!el || !el.parentNode) continue;
      var t = hgElTitle(el);
      if (!t) continue;
      if (hgIsAdTitle(t, info, domTotal)) {
        try { el.setAttribute("data-hd-ad", "1"); el.remove(); if (typeof hdCountAd === "function") hdCountAd(); } catch (e) {}
      }
    }

    var bgs = hero.querySelectorAll(".hg-hero__bg-img");
    for (i = 0; i < bgs.length; i++) {
      el = bgs[i];
      var a = (el.getAttribute("alt") || "").trim();
      if (!a) continue;
      if (info.ads.indexOf(a) >= 0 || (info.normals.length > 0 && info.normals.indexOf(a) < 0)) {
        var hdBgNew = el.getAttribute ? el.getAttribute("data-hd-ad") !== "1" : true;
        try { el.setAttribute("data-hd-ad", "1"); el.style.display = "none"; } catch (e) {}
        if (hdBgNew && typeof hdCountAd === "function") hdCountAd();
      }
    }

    var actTitle = hgActiveTitle(hero);
    if (actTitle && hgIsAdTitle(actTitle, info, domTotal)) adActive = true;

    var firstGood = null;
    var rem = hero.querySelectorAll(".hg-hero__thumb:not([data-hd-ad])");
    for (i = 0; i < rem.length; i++) {
      if (hgElTitle(rem[i])) { firstGood = rem[i]; break; }
    }
    if (adActive) {
      try { hero.setAttribute("data-hd-adshow", "1"); } catch (e) {}
      if (firstGood) { try { firstGood.click(); } catch (e) {} }
    } else {
      try { hero.removeAttribute("data-hd-adshow"); } catch (e) {}
    }

    var badge = hero.querySelector(".hg-hero__ad-badge");
    if (badge) { try { badge.setAttribute("data-hd-ad", "1"); badge.style.display = "none"; } catch (e) {} }
  }
}

function hgIsAdNode(el) {
  if (!el || !el.querySelectorAll) return false;
  if (el.closest && el.closest(".hg-ssp-slot,[data-ssp-slot-key],[data-ssp-pause]")) return false;
  var a = (el.matches && el.matches("a")) ? el : el.querySelector("a[href]");
  var href = (a && a.getAttribute("href")) || "";
  if (href.indexOf("#ov-") === 0) return true;
  var host = "";
  try { host = new URL(href, location.href).hostname; } catch (e) {}
  if (host && hdIsAdHostname(host)) return true;
  return false;
}

function hgRemoveAdAnchor(a) {
  if (!a || !a.parentNode) return;
  var holder = null;
  try { holder = a.closest('[class*="thumb"],[class*="card"],[class*="item"],[class*="banner"],[class*="hero"]'); } catch (e) {}
  var node = (holder && holder !== a && holder !== document.body) ? holder : a;
  try { node.remove(); } catch (e) {}
}


function hgSspSweep() {
  if (!document.body) return;
  var i, el;
  var slots = document.querySelectorAll(".hg-ssp-slot,[data-ssp-slot-key]");
  for (i = 0; i < slots.length; i++) { el = slots[i]; try { el.remove(); if (typeof hdCountAd === "function") hdCountAd(); } catch (e) {} }

  var pboxes = document.querySelectorAll("[data-ssp-pause],.hg-ssp-pause");
  for (i = 0; i < pboxes.length; i++) { el = pboxes[i]; try { el.remove(); if (typeof hdCountAd === "function") hdCountAd(); } catch (e) {} }

  var marks = document.querySelectorAll("[data-ssp-render-root],[data-ssp-label]");
  for (i = 0; i < marks.length; i++) {
    el = marks[i];
    var host = null;
    try { host = el.closest(".hg-ssp-slot,[data-ssp-slot-key],[data-ssp-pause]"); } catch (e) {}
    var node = host || el;
    if (node && node !== document.body && node.parentNode) { try { node.remove(); if (typeof hdCountAd === "function") hdCountAd(); } catch (e) {} }
  }
}


function hgHgSweep() {
  hgCleanHero();
  var i, el;
  var ovs = document.querySelectorAll('[id^="ov-"]');
  for (i = 0; i < ovs.length; i++) { el = ovs[i]; if (el && el.parentNode && hgIsAdNode(el)) { try { el.remove(); if (typeof hdCountAd === "function") hdCountAd(); } catch (e) {} } }
  var links = document.querySelectorAll('a[href]');
  for (i = 0; i < links.length; i++) {
    var la = links[i];
    var lh = "";
    try { lh = new URL(la.getAttribute("href"), location.href).hostname; } catch (e) {}
    if (lh && hdIsAdHostname(lh)) {
      la.setAttribute("data-hd-ad-link", "1");
      hgRemoveAdAnchor(la);
      if (typeof hdCountAd === "function") hdCountAd();
    }
  }
}

function hgSweep() {
  hgSspSweep();
  if (hdOnHG()) hgHgSweep();
}

function hgBlockActions() {
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest("a[href]");
    if (!a) return;
    var host = "";
    try { host = new URL(a.getAttribute("href"), location.href).hostname; } catch (err) {}
    if (host && hdIsAdHostname(host)) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  try {
    var _wopen = window.open;
    window.open = function (u) {
      var host = "";
      try { host = new URL(String(u), location.href).hostname; } catch (e) {}
      if (host && hdIsAdHostname(host)) return null;
      return _wopen.apply(this, arguments);
    };
  } catch (e) {}
}

function hgWatchDom() {
  var sweep = function () { try { hgSweep(); } catch (e) {} };
  if (typeof MutationObserver !== "undefined") {
    var obs = new MutationObserver(function () {
      clearTimeout(obs._t);
      obs._t = setTimeout(sweep, 40);
    });
    var start = function () {
      if (!document.body) { setTimeout(start, 120); return; }
      obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["alt", "class", "hidden", "style"], characterData: false });
      sweep();
    };
    start();
  }
  setInterval(sweep, 1200);
}


function hgHeroFastPatch() {
  var ticks = 0;
  var iv = setInterval(function () {
    if (!hdOnHG()) { clearInterval(iv); return; }
    try { hgHeroInfo(); } catch (e) {}
    if (++ticks >= 100) clearInterval(iv); /* ~5s */
  }, 50);
}

function hgStart() {
  hgInjectCss();
  hgBlockActions();
  hgWatchDom();
  if (!hdOnHG()) {
    try { console.log("[HD] SSP 广告清理 已开启"); } catch (e) {}
    return;
  }
  hgHeroFastPatch();
  try { console.log("[HD] 黄果去广告 已开启"); } catch (e) {}
}

  HD_uiInjected = true;
  try { hdInitUi(); } catch (e) { try { console.log("[HD] ui err", e); } catch (_) {} }
  try { console.log("[HD] ai短剧助手 已就绪(fetch / XMLHttpRequest 已接管改写)"); } catch (e) {}



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

})();
