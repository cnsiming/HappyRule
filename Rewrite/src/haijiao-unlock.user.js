// ==UserScript==
// @name         海角视频 会员视频解锁小助手 (优化版)
// @namespace    hj.unlock
// @version      1.4.5
// @description  免费脚本，禁止贩卖 解锁海角视频付费视频的完整播放、付费图片贴的完整图片与付费音频贴的完整播放（支持 haijiao 官方站与国内可用直连域名） 帖子视频解析思路来自 baby佬 t.me/jsforbaby 帖子图片解析+V视频解锁+音频帖子解锁+修复bug和油猴脚本移植来自 新垣绫濑的荷包蛋 t.me/ayase520
// @author       ayase+baby
// @match        *://haijiao.com/*
// @match        *://www.haijiao.com/*
// @match        *://*.haijiao.com/*
// @match        *://*.top/*
// @include      /^(?:https?:\/\/)?(?:[\w-]+\.)*(?:(?:[0-9a-fA-F]{8,32}|hj\d+)\.top|haijiao\.com)\//
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    if (window.__hjUnlockInjected) return;
    window.__hjUnlockInjected = true;

    const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile/i.test(navigator.userAgent || "");

    const HJ_MIRROR_HOST = '(?:[\\w-]+\\.)*(?:[0-9a-fA-F]{8,32}|hj\\d+)\\.top';
    const HJ_SITE_HOST = '(?:(?:[\\w-]+\\.)*haijiao\\.com|' + HJ_MIRROR_HOST + ')';
    const RX_SITE = new RegExp('^' + HJ_SITE_HOST + '$', 'i');
    if (!RX_SITE.test(location.hostname)) return;
    const RX_API = new RegExp('^https?://' + HJ_SITE_HOST + '/api/(banner/banner_list|attachment|topic/\\d+|video-center/video/(detail|list|related-list)|video/(checkVideoCanPlay|user_list|list|\\d+))');
    const RX_API_ALL = new RegExp('^https?://' + HJ_SITE_HOST + '/api/');
    const RX_M3U8 = new RegExp('^https?://' + HJ_MIRROR_HOST + '/.*\\.m3u8(\\?|$)');
    const ENC_NULL = 'WW01V2MySkJQVDA9';

    const debugOn = (() => { try { return /hjdebug=1/.test(location.search); } catch (e) { return false; } })();
    function log() { if (debugOn && !isMobileDevice) console.log('[海角]', ...arguments); }

    const HJ_LOGO = 'data:image/jpeg;base64,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';

    const counts = { topic: 0, attachment: 0, m3u8: 0, key: 0, image: 0, shortvideo: 0 };
    let loginState = null;


    const SCHEME_KEY = 'hj_scheme';
    let hjScheme = (function () {
        try { const v = localStorage.getItem(SCHEME_KEY); return (v === 'a' || v === 'b' || v === 'race') ? v : 'race'; } catch (e) { return 'race'; }
    })();
    function saveScheme() { try { localStorage.setItem(SCHEME_KEY, hjScheme); } catch (e) {} }
    function schemeLabel(m) { return m === 'a' ? '0tsX直解' : m === 'b' ? 'key异或还原' : '并行竞速'; }

    const b64d = s => decodeURIComponent(escape(atob(s)));
    const b64e = s => btoa(unescape(encodeURIComponent(s)));
    const decode3 = s => JSON.parse(b64d(b64d(b64d(s))));
    const encode3 = s => b64e(b64e(b64e(s)));
    function tryDecode3(s) { try { return decode3(s); } catch (e) { return null; } }
    const safeJson = t => { try { return JSON.parse(String(t).replace(/^\uFEFF/, '').trim()); } catch (e) { return null; } };

    const VC_FREE_RID = 2174028;
    function forgeVideoCenterPlayable(o) {
        if (Array.isArray(o)) { o.forEach(forgeVideoCenterPlayable); return; }
        if (!o || typeof o !== 'object') return;
        if ('id' in o && ('access_type' in o || 'can_play' in o || 'is_unlocked' in o)) {
            o.access_type = 1; o.can_play = true; o.is_unlocked = true;
        }
        for (const k in o) if (o[k] && typeof o[k] === 'object') forgeVideoCenterPlayable(o[k]);
    }
    function rewriteVcAttachmentBody(bodyText) {
        try {
            const j = safeJson(bodyText);
            if (j && typeof j === 'object' && j.resource_type === 'video_center' && j.id) {
                j.resource_type = 'topic';
                j.resource_id = VC_FREE_RID;
                return JSON.stringify(j);
            }
        } catch (e) {}
        return bodyText;
    }

    function forgePurchased(o) {
        if (o && typeof o === 'object') {
            if ('is_buy' in o) o.is_buy = true;
            if ('buy_index' in o) o.buy_index = 9999;
            if ('currentUserPurchased' in o) o.currentUserPurchased = true;
            if (Array.isArray(o)) { o.forEach(forgePurchased); return; }
            for (const k of Object.keys(o)) if (o[k] && typeof o[k] === 'object') forgePurchased(o[k]);
        }
    }

    const VIP_FAKE = 4;
    function scrubVipLimit(o) {
        let changed = 0;
        const walk = function (v) {
            if (Array.isArray(v)) { for (const x of v) walk(x); return; }
            if (!v || typeof v !== 'object') return;
            if ('vipLimit' in v && v.vipLimit !== 0) { v.vipLimit = 0; changed++; }
            for (const k of Object.keys(v)) { const c = v[k]; if (c && typeof c === 'object') walk(c); }
        };
        walk(o);
        return changed;
    }
    function forgeUserVip(u) {
        if (!u || typeof u !== 'object') return false;
        if (typeof u.vip !== 'number' || u.vip >= VIP_FAKE) return false;
        u.vip = VIP_FAKE;
        return true;
    }

    function noteLogin(headers) {
        if (loginState !== true && getHeader(headers, 'x-user-token')) { loginState = true; updateFab(); }
    }
    function getHeader(headers, name) {
        const n = name.toLowerCase();
        for (const k in headers) if (String(k).toLowerCase() === n) return headers[k];
        return null;
    }
    function headersToObj(h) {
        if (!h) return {};
        if (h instanceof Headers) { const o = {}; h.forEach((v, k) => { o[k] = v; }); return o; }
        if (typeof h === 'object') return Object.assign({}, h);
        return {};
    }
    function pickAuth(headers) {
        const token = getHeader(headers, 'x-user-token');
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            pcver: getHeader(headers, 'pcver') || '2',
            'x-user-token': token,
            'x-user-id': getHeader(headers, 'x-user-id') || '',
            'X-HJ-Internal': '1'
        };
    }

    function withTimeout(promise, ms, fallback) {
        return new Promise(function (resolve) {
            let done = false;
            const timer = setTimeout(function () { if (!done) { done = true; resolve(fallback); } }, ms);
            Promise.resolve(promise).then(
                function (v) { if (!done) { done = true; clearTimeout(timer); resolve(v); } },
                function () { if (!done) { done = true; clearTimeout(timer); resolve(fallback); } }
            );
        });
    }
    const rawFetch = W.fetch ? W.fetch.bind(W) : null;
    async function downloadBinary(url) {
        if (rawFetch) {
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), 10000);
            try {
                const res = await rawFetch(url, { signal: ac.signal });
                if (res.ok) return new Uint8Array(await res.arrayBuffer());
            } catch (e) { log('fetch 失败，尝试 GM_xmlhttpRequest:', e.message); }
            finally { clearTimeout(timer); }
        }
        if (typeof GM_xmlhttpRequest !== 'undefined') {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    url, method: 'GET', responseType: 'arraybuffer', timeout: 15000,
                    onload: r => { if (r.status >= 200 && r.status < 300 && r.response) resolve(new Uint8Array(r.response)); else reject(new Error('GM HTTP ' + r.status)); },
                    onerror: () => reject(new Error('GM 网络错误')),
                    ontimeout: () => reject(new Error('GM 超时'))
                });
            });
        }
        throw new Error('无可用下载通道');
    }

    async function fetchRealAttachment(id, headers, fromUrl) {
        const auth = pickAuth(headers);
        if (!auth) { log('[attachment] 未检测到登录信息'); return null; }
        try {
            const origin = new URL(fromUrl).origin;
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), 8000);
            let res;
            try {
                res = await rawFetch(origin + '/api/attachment', {
                    method: 'POST',
                    headers: auth,
                    credentials: 'same-origin',
                    signal: ac.signal,
                    body: JSON.stringify({ id, resource_id: 2174028, resource_type: 'topic', line: 'normal1' })
                });
            } finally { clearTimeout(timer); }
            if (!res || !res.ok) return null;
            const j = safeJson(await res.text());
            if (!j || !j.data) return null;
            const obj = tryDecode3(j.data);
            const url = (obj && /^https?:/.test(obj.remoteUrl || '')) ? obj.remoteUrl : null;
            if (!url) return null;
            const w = await runScheme(url);
            log('[attachment] 竞速结果', w.mode, w.url);
            return { url: w.url, mode: w.mode };
        } catch (e) { log('[attachment] 获取失败', e); return null; }
    }

    const modeMap = new Map();
    function isZeroHost(u) {
        try { return new URL(u).hostname.indexOf('0ts') === 0; } catch (e) { return false; }
    }
    function addZeroPrefix(u) {
        try {
            const p = new URL(u);
            if (/^ts\d+\./.test(p.hostname)) p.hostname = '0' + p.hostname;
            return p.href;
        } catch (e) { return u; }
    }

    const zeroReg = new Map(); 
    const ZERO16_B64 = 'AAAAAAAAAAAAAAAAAAAAAA==';
    function zeroInterceptFor(url) {
        try {
            const u = new URL(url);
            if (u.hostname.indexOf('0ts') !== 0) return null;
            const base = url.slice(0, url.lastIndexOf('/') + 1);
            const reg = zeroReg.get(base);
            if (!reg) return null;
            if (/\.(keyv\d*|key\d+)$/i.test(u.pathname)) return { type: 'key', data: reg.realKey };
            if (/\.jpg$/i.test(u.pathname)) return { type: 'secret', data: ZERO16_B64 };
            return null;
        } catch (e) { return null; }
    }
    function parsePlaylist(text) {
        if (typeof text !== 'string' || !text || text.indexOf('#EXT-X-STREAM-INF') !== -1) return null;
        const infs = [];
        const reInf = /#EXTINF:([\d.]+)/g;
        let m;
        while ((m = reInf.exec(text))) infs.push(parseFloat(m[1]));
        const segs = text.split(/\r?\n/).filter(function (l) { return l && l.charAt(0) !== '#'; });
        if (!infs.length || !segs.length) return null;
        const keyUri = (text.match(/#EXT-X-KEY:METHOD=AES-128,URI="([^"]+)"/) || [])[1] || null;
        const ivHex = (text.match(/#EXT-X-KEY:[^\n]*IV=0x([0-9a-fA-F]+)/) || [])[1] || null;
        const duration = infs.reduce(function (a, b) { return a + b; }, 0);
        return { count: segs.length, duration: duration, keyUri: keyUri, ivHex: ivHex, seg0: segs[0] };
    }
    async function fetchText(url) {
        const bytes = await downloadBinary(url);
        return new TextDecoder('utf-8').decode(bytes);
    }
    async function aesCheck(keyBytes, data, ivHex) {
        try {
            if (!keyBytes || keyBytes.length !== 16 || !ivHex || ivHex.length !== 32 || !data || !data.length) return false;
            const iv = new Uint8Array(16);
            for (let i = 0; i < 16; i++) iv[i] = parseInt(ivHex.slice(i * 2, i * 2 + 2), 16);
            const ck = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
            const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, ck, data));
            let sync = 0;
            for (let i = 0; i < Math.min(pt.length, 1880); i += 188) if (pt[i] === 0x47) sync++;
            return sync >= 8;
        } catch (e) { return false; }
    }
    async function probePlaylist(url) {
        try { return parsePlaylist(await fetchText(url)); } catch (e) { return null; }
    }
    async function probePlanA(url) {
        const info = await probePlaylist(url);
        if (!info || !info.keyUri) return null;
        const base = url.slice(0, url.lastIndexOf('/') + 1);
        const segB = await downloadBinary(base + info.seg0);
        if (!segB) return null;
        const keyB = await downloadBinary(base + info.keyUri);
        if (!keyB || keyB.length !== 16) return null;
        if (!(await aesCheck(keyB, segB, info.ivHex))) return null;
        zeroReg.set(base, { realKey: keyB });
        log('[竞速] A 已验证：0tsX 直接下发真实 key，可完整播放 ' + info.count + ' 分片');
        return { mode: 'a', url: url, count: info.count, duration: info.duration };
    }
    async function probePlanB(url) {
        const info = await probePlaylist(url);
        if (!info || !info.keyUri) return null;
        const base = url.slice(0, url.lastIndexOf('/') + 1);
        const secretCandidates = [url.replace(/\.m3u8(\?.*)?$/, '.jpg'), base + info.keyUri.replace(/\.key$/i, '.jpg')];
        const keyB = await downloadBinary(base + info.keyUri);
        const segB = await downloadBinary(base + info.seg0);
        if (!keyB || keyB.length !== 16 || !segB) return null;
        for (let si = 0; si < secretCandidates.length; si++) {
            try {
                const secretB = await downloadBinary(secretCandidates[si]);
                if (!secretB || !secretB.length) continue;
                const secretText = new TextDecoder('utf-8').decode(secretB).trim();
                let sec = null;
                try { sec = Uint8Array.from(atob(secretText), c => c.charCodeAt(0)); } catch (e) { sec = null; }
                if (!sec || sec.length < 16) continue;
                const real = new Uint8Array(16);
                for (let i = 0; i < 16; i++) real[i] = keyB[i] ^ sec[i];
                if (await aesCheck(real, segB, info.ivHex)) {
                    return { mode: 'b', url: url, count: info.count, duration: info.duration };
                }
            } catch (e) {}
        }
        return null;
    }
    async function racePlans(origUrl) {
        try {
            const u0 = addZeroPrefix(origUrl);
            const plans = [];
            if (u0 !== origUrl) plans.push(probePlanA(u0));
            plans.push(probePlanB(origUrl));
            if (!plans.length) return { mode: 'b', url: origUrl };
            let winner = null;
            let left = plans.length;
            const done = new Promise(function (resolve) {
                plans.forEach(function (p) {
                    p.then(function (r) {
                        if (r && !winner) { winner = r; resolve(r); }
                    }).catch(function () {}).finally(function () {
                        if (--left <= 0) resolve(null);
                    });
                });
            });
            const w = await withTimeout(done, 6000, null);
            if (w) {
                log('[竞速] 方案 ' + w.mode + ' 胜出 ' + w.count + ' 分片 ' + Math.round(w.duration) + 's', w.url);
                return w;
            }
        } catch (e) { log('[竞速] 失败', e); }
        return { mode: 'b', url: origUrl };
    }


    async function runScheme(origUrl) {
        const u0 = addZeroPrefix(origUrl);
        if (hjScheme === 'a') {
            const r = (u0 !== origUrl) ? await probePlanA(u0) : null;
            if (r) {
                log('[解析] 固定方案 A（0tsX 直解）胜出 ' + r.count + ' 分片 ' + Math.round(r.duration) + 's', r.url);
                return r;
            }
            log('[解析] 0tsX 直解失败，回退原始地址');
            return { mode: 'b', url: origUrl };
        }
        if (hjScheme === 'b') {
            log('[解析] 固定方案 B（key 异或还原）', origUrl);
            return { mode: 'b', url: origUrl };
        }
        return racePlans(origUrl);
    }


    const realUrlMap = new Map();
    function escapeAttr(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const TG_BABY = '<a href="https://t.me/jsforbaby" target="_blank" rel="noopener" style="color:#3d7eff;text-decoration:none;">baby佬</a>';
    const TG_AYASE = '<a href="https://t.me/ayase520" target="_blank" rel="noopener" style="color:#3d7eff;text-decoration:none;">新垣绫濑的荷包蛋</a>';
    function creditHtml(mid) {
        return '<div style="color:#888;font-size:13px;margin:12px 0;">免费脚本，禁止贩卖 · ' + mid +
            ' · 图文帖子解析+V视频解析+音频贴解锁+修复bug和油猴脚本移植来自 ' + TG_AYASE + '</div>';
    }
    function prependHtml(a, html) {
        if (!html || typeof a.content !== 'string') return;
        if (a.content.indexOf('<body>') !== -1) a.content = a.content.replace('<body>', '<body>' + html);
        else if (a.content.indexOf('<p>') !== -1) a.content = a.content.replace(/(<p>.*?<\/p>)/, '$1' + html);
        else a.content = html + a.content;
    }
    function playBtnHtml(realUrl, videoId, coverUrl, name) {
        return '<a data-hj-play data-hj-url="' + escapeAttr(realUrl) + '" data-hj-id="' + escapeAttr(videoId) + '" data-hj-img="' + escapeAttr(coverUrl) + '" data-hj-name="' + escapeAttr(name) + '" style="display:inline-block;background:#3d7eff;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:14px;cursor:pointer;user-select:none;">立即观看完整视频</a>';
    }
    function injectPlayerHtml(a, realUrl, videoId, coverUrl, title) {
        if (typeof a.content !== 'string') return;
        const ad = '<div style="margin:12px 0;">' + creditHtml('视频帖子解锁思路来自 ' + TG_BABY) +
            playBtnHtml(realUrl, videoId, coverUrl, title) + '</div>';
        prependHtml(a, ad);
        a.content = a.content.replace(/<span class="sell-btn"[^>]*>.*?<\/span><\/span>/gs,
            playBtnHtml(realUrl, videoId, coverUrl, title));
    }
    function unlockImageContent(a, forceInject) {
        if (!a || typeof a.content !== 'string') return 0;
        if (a.content.indexOf('<video') !== -1) return 0;
        if (!forceInject && a.content.indexOf('class="sell-btn"') === -1) return 0;
        const imgs = Array.isArray(a.attachments) ? a.attachments.filter(x => x.category === 'images' && x.id) : [];
        if (!imgs.length) return 0;
        const have = new Set();
        const idRe = /data-id="(\d+)"/g;
        let m;
        while ((m = idRe.exec(a.content))) have.add(m[1]);
        const missing = imgs.filter(x => !have.has(String(x.id)));
        if (!missing.length) return 0;
        const tip = a.content.indexOf('免费脚本，禁止贩卖') !== -1 ? '' : creditHtml('已解锁 ' + missing.length + ' 张图片 · 视频帖子解锁思路来自 ' + TG_BABY);
        const imgsHtml = missing.map(x =>
            '<img data-id="' + x.id + '" src="/images/common/project/loading.gif" style="max-width:100%;display:block;margin:8px 0;border-radius:4px;"/>'
        ).join('');
        const block = '<div class="hj-unlock-images">' + tip + imgsHtml + '</div>';
        if (forceInject) a.content += block;
        else a.content = a.content.replace(/<p>\s*<span class="sell-btn"[^>]*>.*?<\/span><\/span>\s*<\/p>|<span class="sell-btn"[^>]*>.*?<\/span><\/span>/gs, block);
        counts.image += missing.length;
        log('[图片] 已解锁图片 x' + missing.length);
        return missing.length;
    }


    async function transformApiBody(url, headers, text) {
        const body = safeJson(text);
        if (!body) return null;
        if (url.includes('/api/banner/banner_list')) {
            body.data = ENC_NULL;
            return JSON.stringify(body);
        }
        if (url.includes('/api/attachment')) {
            if (!body.data) return null;
            const a = tryDecode3(body.data);
            if (!a) return null;
            const s = a.remoteUrl || '';
            if (a.id && (!/^https?:/.test(s) || /preview/i.test(s))) {
                const real = await fetchRealAttachment(a.id, headers, url);
                if (real) a.remoteUrl = real.url;
            }
            body.data = encode3(JSON.stringify(a));
            counts.attachment++;
            updateFab();
            return JSON.stringify(body);
        }
        if (/\/api\/video-center\//.test(url)) {
            if (!body.data) return null;
            const vc = tryDecode3(body.data);
            if (!vc) return null;
            forgeVideoCenterPlayable(vc);
            body.data = encode3(JSON.stringify(vc));
            counts.attachment++;
            updateFab();
            return JSON.stringify(body);
        }
        if (/\/api\/video\/checkVideoCanPlay/.test(url)) {
            if (!body.data) return null;
            const sv = tryDecode3(body.data);
            if (!sv || typeof sv !== 'object') return null;
            if (Number(sv.type) >= 2) {
                log('[短视频] 前端试看限制已解除，type', sv.type, '-> 1');
                sv.type = 1;
                sv.message = '';
                counts.shortvideo++;
                updateFab();
            }
            body.data = encode3(JSON.stringify(sv));
            return JSON.stringify(body);
        }
        if (/\/api\/topic\/\d+/.test(url)) {
            const token = getHeader(headers, 'x-user-token');
            if (!token) { log('[topic] 未登录，跳过'); return null; }
            loginState = true; updateFab();
            if (!body.data) return null;
            const a = tryDecode3(body.data);
            if (!a) return null;
            const vipNode = !!(a.node && Number(a.node.vipLimit) > 0);
            forgePurchased(a);
            scrubVipLimit(a);
            if (a.sale) { a.sale.is_buy = true; a.sale.buy_index = 9999; }
            a.currentUserPurchased = true;
            let video = null, audio = null;
            if (Array.isArray(a.attachments)) {
                video = a.attachments.find(x => x.category === 'video' && x.id) || null;
                audio = a.attachments.find(x => x.category === 'audio' && x.id) || null;
            }
            const gatedContent = vipNode || (typeof a.content === 'string' && a.content.indexOf('class="sell-btn"') !== -1);
            const inlineVideo = !!(video && gatedContent && typeof a.content === 'string' && a.content.indexOf('<video') === -1);
            if (video) {
                const got = await fetchRealAttachment(video.id, headers, url);
                if (got) {
                    const real = got.url;
                    if (video.remoteUrl !== real) video.remoteUrl = real;
                    realUrlMap.set(String(video.id), real);
                    if (got.mode === 'a') modeMap.set(String(video.id), 'a');
                    if (a.content) injectPlayerHtml(a, real, video.id, video.coverUrl || video.original_pic || '', a.title || a.name || '');
                }
            }
            unlockImageContent(a, vipNode);
            if (inlineVideo) {
                a.content += '<video src="" data-id="' + video.id + '"></video>';
                log('[视频] 正文缺少 <video>，已回填 <video> 占位（VIP / 付费帖通用）');
            }
            if (audio && typeof a.content === 'string') {
                let audioUrl = audio.remoteUrl || '';
                if (!/^https?:.*\.(mp3|m4a|aac|ogg|wav|flac)(\?|$)/i.test(audioUrl)) {
                    const gotAudio = await fetchRealAttachment(audio.id, headers, url);
                    if (gotAudio) audioUrl = gotAudio.url;
                }
                const audioHtml = '<audio src="' + escapeAttr(audioUrl) + '" controls="controls" controlslist="nodownload" id="showaudio" data-id="' + audio.id + '"></audio>';
                if (a.content.indexOf('<audio') !== -1) {
                    a.content = a.content.replace(/(<audio\b[^>]*?)src="[^"]*"/i, '$1src="' + escapeAttr(audioUrl) + '"');
                    log('[音频] 已修正正文 <audio> 地址', audioUrl);
                } else {
                    if (a.content.indexOf('class="sell-btn"') === -1) a.content += audioHtml;
                    else a.content = a.content.replace(/<p>\s*<span class="sell-btn"[^>]*>.*?<\/span><\/span>\s*<\/p>|<span class="sell-btn"[^>]*>.*?<\/span><\/span>/gs, audioHtml);
                    if (a.content.indexOf('<audio') === -1) a.content += audioHtml;
                    log('[音频] 正文缺少 <audio>，已回填音频直链', audioUrl);
                }
                if (a.content.indexOf('免费脚本，禁止贩卖') === -1) prependHtml(a, creditHtml('音频帖子解锁来自 ' + TG_BABY));
            }
            const SELL_RE = /<p>\s*<span class="sell-btn"[^>]*>.*?<\/span><\/span>\s*<\/p>|<span class="sell-btn"[^>]*>.*?<\/span><\/span>/gs;
            if (typeof a.content === 'string' && a.content.indexOf('class="sell-btn"') !== -1) {
                let price = '';
                if (a.sale && Number(a.sale.amount) > 0) {
                    price = '，售价 ' + (Number(a.sale.money_type) === 2 ? (Number(a.sale.amount) / 100).toFixed(2) + ' 钻石' : Number(a.sale.amount) + ' 金币');
                }
                a.content = a.content.replace(SELL_RE, '');
                a.content += '<div style="color:#888;font-size:13px;margin:12px 0;">此贴正文已被服务端隐藏' + price + '，客户端无法还原，需购买后才能查看完整内容</div>';
                log('[正文] 出售内容为服务端隐藏文本，无附件可还原，已替换出售提示');
            }
            body.data = encode3(JSON.stringify(a));
            counts.topic++;
            updateFab();
            showToast('✅ 免费脚本，禁止贩卖，正在解析');
            return JSON.stringify(body);
        }
        if (/\/api\/user\/current/.test(url)) {
            if (!body.data) return null;
            const u = tryDecode3(body.data);
            if (!forgeUserVip(u)) return null;
            body.data = encode3(JSON.stringify(u));
            return JSON.stringify(body);
        }
        if (body.data) {
            const g = tryDecode3(body.data);
            if (g && scrubVipLimit(g) > 0) {
                body.data = encode3(JSON.stringify(g));
                return JSON.stringify(body);
            }
        }
        return null;
    }

    const keyMap = new Map();
    const keyCache = new Map();
    const resolveUrl = (ref, base) => { try { return new URL(ref, base).href; } catch (e) { return ref; } };

    function observePlaylist(url, text) {
        if (typeof text !== 'string' || !text) return;
        if (isZeroHost(url)) { log('[m3u8] 0tsX 免授权模式，跳过 key 还原'); return; }
        if (text.includes('#EXT-X-STREAM-INF')) { log('[m3u8] master playlist，跳过'); return; }
        let found = 0;
        for (const line of text.split('\n')) {
            if (!line.startsWith('#EXT-X-KEY')) continue;
            const m = line.match(/URI="([^"]+)"/);
            if (!m) continue;
            const keyUrl = resolveUrl(m[1], url);
            const secretUrl = url.replace(/\.m3u8(\?.*)?$/, '.jpg');
            keyMap.set(keyUrl, { keyUrl, secretUrl });
            found++;
        }
        if (found) { counts.m3u8++; log('[m3u8] 发现加密 key x' + found, url); updateFab(); }
    }

    async function computeRealKey(keyUrl) {
        if (keyCache.has(keyUrl)) return keyCache.get(keyUrl);
        const info = keyMap.get(keyUrl);
        if (!info) return null;
        try {
            const [secret, keyBytes] = await Promise.all([
                downloadBinary(info.secretUrl),
                downloadBinary(info.keyUrl)
            ]);
            if (!secret || !keyBytes || keyBytes.length !== 16) return null;
            const secretText = new TextDecoder('utf-8').decode(secret).trim();
            let sec = null;
            try { sec = Uint8Array.from(atob(secretText), c => c.charCodeAt(0)); } catch (e) { sec = null; }
            if (!sec || sec.length < 16) return null;
            const real = new Uint8Array(16);
            for (let i = 0; i < 16; i++) real[i] = keyBytes[i] ^ sec[i];
            keyCache.set(keyUrl, real);
            counts.key++;
            log('[key] 已还原', keyUrl, Array.from(real).map(b => b.toString(16).padStart(2, '0')).join(''));
            updateFab();
            showToast('🔓 已还原视频加密 key');
            return real;
        } catch (e) { log('[key] 还原失败', e); return null; }
    }

    function keyResponse(keyUrl) {
        return computeRealKey(keyUrl).then(bytes => {
            if (!bytes) return new Response('', { status: 500 });
            return new Response(bytes, { status: 200, headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(bytes.length) } });
        });
    }

    const nativeFetch = W.fetch ? W.fetch.bind(W) : null;
    function parseFetchArgs(input, init) {
        let url = '', method = 'GET', headers = {};
        if (typeof input === 'string') {
            url = input;
            if (init) { method = init.method || method; headers = headersToObj(init.headers); }
        } else if (input instanceof Request) {
            url = input.url;
            method = input.method || method;
            headers = headersToObj(input.headers);
        }
        let abs; try { abs = new URL(url, location.href).href; } catch (e) { abs = url; }
        return { url: abs, method, headers };
    }
    function cleanRespHeaders(h) {
        const out = new Headers();
        if (h) h.forEach((v, k) => {
            const lk = k.toLowerCase();
            if (lk === 'content-encoding' || lk === 'content-length' || lk === 'transfer-encoding') return;
            out.set(k, v);
        });
        return out;
    }
    function patchFetch() {
        if (!nativeFetch) return;
        W.fetch = function (input, init) {
            const { url, method, headers } = parseFetchArgs(input, init); noteLogin(headers); log('[fetch]', method, url);
            let fetchInit = init;
            if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && /\/api\/attachment(\?|$)/.test(url)) {
                const rawBody = init ? init.body : null;
                if (typeof rawBody === 'string') {
                    const rewritten = rewriteVcAttachmentBody(rawBody);
                    if (rewritten !== rawBody) { fetchInit = Object.assign({}, init, { body: rewritten }); log('[fetch] 观影券附件请求改写', url); }
                }
            }
            const zi = zeroInterceptFor(url);
            if (zi) {
                log('[fetch] 0tsX 拦截', method, url);
                if (zi.type === 'key') return Promise.resolve(new Response(zi.data, { status: 200, headers: { 'Content-Type': 'application/octet-stream' } }));
                return Promise.resolve(new Response(zi.data, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
            }
            if (keyMap.has(url)) {
                log('[fetch] 拦截 key 请求', url);
                return keyResponse(url);
            }
            if (RX_API.test(url)) {
                return nativeFetch(input, fetchInit).then(async res => {
                    try {
                        const text = await withTimeout(res.clone().text(), 6000, null);
                        const out = await withTimeout(transformApiBody(url, headers, text), 6000, null);
                        if (out == null) return res;
                        const h = cleanRespHeaders(res.headers);
                        if (!h.has('content-type')) h.set('content-type', 'application/json; charset=utf-8');
                        log('[fetch] 改写', method, url);
                        return new Response(out, { status: res.status, statusText: res.statusText, headers: h });
                    } catch (e) { log('[fetch] 改写失败', e); return res; }
                });
            }
            if (RX_M3U8.test(url)) {
                return nativeFetch(input, fetchInit).then(async res => {
                    try { observePlaylist(url, await res.clone().text()); } catch (e) {}
                    return res;
                });
            }
            return nativeFetch(input, fetchInit);
        };
        W.fetch.__hjPatched = true;
    }

    function cleanReqHeaders(h) {
        const out = {};
        for (const k in h) {
            const lk = k.toLowerCase();
            if (lk === 'host' || lk === 'content-length' || lk === 'access-control-allow-credentials' || lk === 'accept-encoding') continue;
            out[k] = h[k];
        }
        return out;
    }

    function fireXhrHandlers(xhr, ctx) {
        const mkEv = type => { try { return { target: xhr, currentTarget: xhr, type: type, eventPhase: 2, bubbles: false, cancelable: false }; } catch (e) { return {}; } };
        for (const p of ['onreadystatechange', 'onload', 'onloadend']) {
            const fn = (ctx.handlers || {})[p];
            if (typeof fn === 'function') { try { fn.call(xhr, mkEv(p.slice(2))); } catch (e) {} }
        }
        if (ctx.listeners) {
            for (const type of ['readystatechange', 'load', 'loadend']) {
                const fns = ctx.listeners[type] || [];
                for (const fn of fns) { try { fn.call(xhr, mkEv(type)); } catch (e) {} }
            }
        }
    }

    function patchXHR() {
        const NativeXHR = W.XMLHttpRequest;
        if (!NativeXHR) return;
        function HJXHR() {
            const xhr = new NativeXHR();
            const realOpen = xhr.open.bind(xhr);
            const realSend = xhr.send.bind(xhr);
            const realSetH = xhr.setRequestHeader.bind(xhr);
            const realAdd = xhr.addEventListener.bind(xhr);
            const realRemove = xhr.removeEventListener.bind(xhr);
            const realGetAll = xhr.getAllResponseHeaders.bind(xhr);
            const realGetOne = xhr.getResponseHeader.bind(xhr);
            const ctx = { method: 'GET', url: '', headers: {}, listeners: {}, handlers: {}, override: null, takeover: false };
            let doneLogged = false;
            const logDone = function (tag) { if (!doneLogged) { doneLogged = true; log('[xhr.done]', ctx.method, ctx.url, tag); } };
            realAdd('loadend', function () { logDone('native'); });

            const own = {};
            own.open = function (m, u, a1, a2, a3) {
                ctx.method = String(m || 'GET'); ctx.url = String(u);
                log('[xhr.open]', ctx.method, ctx.url);
                try { return realOpen(m, u, a1, a2, a3); } catch (e) { return realOpen(m, u, true); }
            };
            own.setRequestHeader = function (k, v) { ctx.headers[k] = v; try { return realSetH(k, v); } catch (e) {} };
            own.addEventListener = function (type, fn, opts) {
                if (type === 'readystatechange' || type === 'load' || type === 'loadend') {
                    (ctx.listeners[type] = ctx.listeners[type] || []).push(fn);
                }
                try { return realAdd(type, fn, opts); } catch (e) {}
            };
            own.removeEventListener = function (type, fn, opts) {
                const arr = ctx.listeners[type];
                if (arr) { const i = arr.indexOf(fn); if (i >= 0) arr.splice(i, 1); }
                try { return realRemove(type, fn, opts); } catch (e) {}
            };
            own.send = function (body) {
                let abs; try { abs = new URL(ctx.url, location.href).href; } catch (e) { abs = ctx.url; }
                ctx.url = abs;
                noteLogin(ctx.headers);
                if (typeof body === 'string' && /\/api\/attachment(\?|$)/.test(abs)) {
                    const rewritten = rewriteVcAttachmentBody(body);
                    if (rewritten !== body) { body = rewritten; log('[xhr] 观影券附件请求改写', ctx.method, abs); }
                }
                const zi = zeroInterceptFor(abs);
                if (zi) {
                    doneLogged = false;
                    log('[xhr] 0tsX 拦截', ctx.method, abs);
                    const ov = ctx.override = {};
                    ov.readyState = 4;
                    ov.status = 200;
                    ov.statusText = 'OK';
                    if (zi.type === 'key') { ov.response = zi.data.buffer; ov.responseText = ''; }
                    else { ov.response = zi.data; ov.responseText = zi.data; }
                    ov.responseType = xhr.responseType || (zi.type === 'key' ? 'arraybuffer' : 'text');
                    ov.responseURL = abs;
                    ov.getAllResponseHeaders = function () { return 'Content-Type: application/octet-stream\r\n'; };
                    ov.getResponseHeader = function (name) { try { if (String(name).toLowerCase() === 'content-type') return 'application/octet-stream'; } catch (e) {} return null; };
                    logDone('0tsX');
                    fireXhrHandlers(proxy, ctx);
                    return undefined;
                }
                const isText = xhr.responseType === '' || xhr.responseType === 'text';
                ctx.takeover = isText && RX_API_ALL.test(abs);
                ctx.override = null;
                doneLogged = false;
                log('[xhr.send]', ctx.method, abs, 'takeover=' + ctx.takeover, 'respType=' + xhr.responseType);
                if (!ctx.takeover) { try { return realSend(body); } catch (e) { log('[xhr] 原生 send 失败', e); } return undefined; }

                (async function () {
                    try {
                        if (!rawFetch) throw new Error('无 fetch 可用');
                        const res = await withTimeout(rawFetch(abs, {
                            method: ctx.method,
                            headers: cleanReqHeaders(ctx.headers),
                            credentials: 'same-origin',
                            body: (ctx.method === 'GET' || ctx.method === 'HEAD') ? undefined : (body || undefined)
                        }), 8000, null);
                        if (!res) throw new Error('代理超时');
                        const text = await withTimeout(res.text(), 8000, null);
                        const out = await withTimeout(transformApiBody(abs, ctx.headers, text), 6000, null);
                        const finalText = out != null ? out : (text || '');
                        const ov = ctx.override = {};
                        ov.readyState = 4;
                        ov.status = res.status;
                        ov.statusText = res.statusText || '';
                        ov.responseText = finalText;
                        if (isText) ov.response = finalText;
                        ov.responseURL = abs;
                        ov.getAllResponseHeaders = function () {
                            let s = '';
                            res.headers.forEach(function (v, k) { s += k + ': ' + v + '\r\n'; });
                            return s;
                        };
                        ov.getResponseHeader = function (name) {
                            try { return res.headers.get(name); } catch (e) { return null; }
                        };
                        logDone('takeover transformed=' + (out != null));
                        fireXhrHandlers(proxy, ctx);
                    } catch (e) {
                        log('[xhr] 接管失败，回退原生', e);
                        ctx.takeover = false;
                        try { realSend(body); } catch (e2) { log('[xhr] 回退失败', e2); }
                    }
                })();
                return undefined;
            };
            own.getResponseHeader = function (name) {
                if (ctx.override && Object.prototype.hasOwnProperty.call(ctx.override, 'getResponseHeader')) return ctx.override.getResponseHeader(name);
                return realGetOne(name);
            };
            own.getAllResponseHeaders = function () {
                if (ctx.override && Object.prototype.hasOwnProperty.call(ctx.override, 'getAllResponseHeaders')) return ctx.override.getAllResponseHeaders();
                return realGetAll();
            };

            const proxy = new Proxy(xhr, {
                get: function (t, k) {
                    if (typeof k === 'symbol') return Reflect.get(t, k);
                    if (ctx.override && Object.prototype.hasOwnProperty.call(ctx.override, k)) return ctx.override[k];
                    if (Object.prototype.hasOwnProperty.call(own, k)) return own[k];
                    const v = Reflect.get(t, k);
                    return (typeof v === 'function') ? v.bind(t) : v;
                },
                set: function (t, k, v) {
                    if (k === 'onreadystatechange' || k === 'onload' || k === 'onloadend') {
                        ctx.handlers[k] = v;
                        try { Reflect.set(t, k, v); } catch (e) {}
                        return true;
                    }
                    return Reflect.set(t, k, v);
                }
            });
            return proxy;
        }
        try { HJXHR.prototype = NativeXHR.prototype; } catch (e) {}
        HJXHR.__hjPatched = true;
        try { Object.defineProperty(W, 'XMLHttpRequest', { writable: true, configurable: true, value: HJXHR }); } catch (e) {}
    }


    const UI_CSS = [
        '.hj-fab{position:fixed;',
        isMobileDevice ? 'left:8px;width:48px;height:48px;' : 'left:16px;width:56px;height:56px;',
        'bottom:96px;z-index:2147483000;user-select:none;-webkit-user-select:none;touch-action:manipulation;}',
        '.hj-fab-logo{width:100%;height:100%;border-radius:50%;object-fit:cover;',
        'border:2px solid #ffd54a;box-shadow:0 4px 16px rgba(0,0,0,.55);cursor:pointer;',
        'background:#1a1214;display:block;pointer-events:auto;}',
        '.hj-fab-dot{position:absolute;top:-2px;right:-2px;',
        isMobileDevice ? 'width:12px;height:12px;border:1.5px solid #0d0608;' : 'width:15px;height:15px;border:2px solid #1a1214;',
        'border-radius:50%;background:#777;transition:background .3s,box-shadow .3s;pointer-events:none;}',
        '.hj-fab-dot.ok{background:#2ecc40;box-shadow:0 0 10px #2ecc40}',
        '.hj-fab-dot.err{background:#ff4136;box-shadow:0 0 10px #ff4136}',
        '.hj-fab-dot.wait{background:#f0ad4e;box-shadow:0 0 10px #f0ad4e}',
        '.hj-fab-panel{position:absolute;bottom:66px;left:0;',
        isMobileDevice ? 'width:200px;padding:10px 12px;' : 'width:236px;padding:12px 14px;',
        'background:rgba(24,18,22,.97);border:1px solid rgba(255,213,74,.35);',
        'border-radius:14px;color:#fff;font-size:12px;line-height:1.7;',
        'box-shadow:0 10px 34px rgba(0,0,0,.65);',
        'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
        'z-index:2147483001;display:none;pointer-events:auto;}',
        '.hj-fab-title{font-size:13px;font-weight:600;color:#ffd54a;margin-bottom:6px;text-align:center}',
        '.hj-fab-row{display:flex;align-items:center;gap:6px;font-size:12px}',
        '.hj-fab-row b{margin-left:auto;font-weight:600;color:#ffd54a}',
        '.hj-dot{width:8px;height:8px;border-radius:50%;flex:none}',
        '.hj-dot.ok{background:#2ecc40}.hj-dot.err{background:#ff4136}.hj-dot.wait{background:#f0ad4e}',
        '.hj-fab-divider{height:1px;background:rgba(255,255,255,.12);margin:8px 0}',
        '.hj-fab-note{text-align:center;color:#ffd54a;font-weight:600;margin-bottom:4px;font-size:11px}',
        '.hj-fab-credit{font-size:10px;color:#cfc4c6}',
        '.hj-fab-credit a{color:#ffd54a;text-decoration:none}',
        '.hj-scheme-btns{display:flex;gap:6px;margin:2px 0 8px}',
        '.hj-scheme-btn{flex:1;border:1px solid rgba(255,213,74,.35);background:rgba(255,255,255,.06);color:#fff;font-size:11px;padding:5px 0;border-radius:8px;cursor:pointer;line-height:1.3;text-align:center;user-select:none}',
        '.hj-scheme-btn.active{background:#ffd54a;color:#1a1214;border-color:#ffd54a;font-weight:600}',
        '.hj-toast{position:fixed;top:16%;left:50%;transform:translateX(-50%);',
        'background:rgba(24,18,22,.96);color:#ffd54a;padding:11px 20px;border-radius:12px;',
        'font-size:13px;border:1px solid rgba(255,213,74,.45);box-shadow:0 8px 28px rgba(0,0,0,.55);',
        'z-index:2147483100;pointer-events:none;text-align:center;animation:hjToastIn .25s ease-out}',
        '@keyframes hjToastIn{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}',
        '.hj-toast.hj-toast-hide{opacity:0;transition:opacity .45s}'
    ].join('\n');

    function injectCss() {
        if (document.getElementById('hj-ui-style')) return;
        const s = document.createElement('style');
        s.id = 'hj-ui-style';
        s.textContent = UI_CSS;
        (document.head || document.documentElement).appendChild(s);
    }

    let fab = null;
    let lastToast = 0;
    let refreshTimeout = null;

    function showToast(msg) {
        if (!document.body) return;
        const now = Date.now();
        if (now - lastToast < 2500) return;
        lastToast = now;
        const t = document.createElement('div');
        t.className = 'hj-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.classList.add('hj-toast-hide'); setTimeout(function () { t.remove(); }, 500); }, 2600);
    }

    function scanLogin() {
        try {
            const get = function (k, store) { try { return store.getItem(k) || ''; } catch (e) { return ''; } };
            if (get('token', sessionStorage) && get('uid', sessionStorage)) { loginState = true; return; }
            if (get('token', localStorage) && get('uid', localStorage)) { loginState = true; return; }
            const ck = document.cookie || '';
            if (/(^|;\\s*)token=[^;]+/.test(ck) && /(^|;\\s*)uid=[^;]+/.test(ck)) { loginState = true; return; }
            loginState = false;
        } catch (e) { loginState = null; }
    }

    function refreshFab() {
        if (!fab) return;
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
        }
        
        const setRow = (sel, text, ok) => {
            const b = fab.querySelector(sel);
            if (!b) return;
            b.textContent = text;
            const row = b.closest('.hj-fab-row');
            if (row) {
                const d = row.querySelector('.hj-dot');
                if (d) d.className = 'hj-dot ' + (ok ? 'ok' : 'err');
            }
        };
        setRow('#hj-st-inj', '已注入', true);
        setRow('#hj-st-login', loginState === true ? '已登录' : loginState === false ? '未登录' : '检测中', loginState === true);
        setRow('#hj-st-cnt', 'topic:' + counts.topic + ' · img:' + counts.image + ' · key:' + counts.key + ' · 短视频:' + counts.shortvideo, true);
        setRow('#hj-st-scheme', schemeLabel(hjScheme), true);
        const sbtns = fab.querySelectorAll('.hj-scheme-btn');
        for (let i = 0; i < sbtns.length; i++) {
            const b = sbtns[i];
            if (b.getAttribute('data-scheme') === hjScheme) b.classList.add('active');
            else b.classList.remove('active');
        }
        const dot = fab.querySelector('.hj-fab-dot');
        if (dot) dot.className = 'hj-fab-dot ' + (loginState === true ? 'ok' : 'wait');
    }
    function updateFab() { if (fab) refreshFab(); }


    function makeDraggable(el) {
        let dragging = false, moved = false, startX = 0, startY = 0;
        let origLeft = 0, origTop = 0;
        let lastMoveTime = 0;

        const moveTo = function (cx, cy) {
            if (!dragging) return;
            const now = Date.now();
            if (isMobileDevice && now - lastMoveTime < 50) return;
            lastMoveTime = now;

            const dx = cx - startX, dy = cy - startY;
            if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
            const size = isMobileDevice ? 48 : 56;
            const x = Math.min(window.innerWidth - size, Math.max(4, origLeft + dx));
            const y = Math.min(window.innerHeight - size - 50, Math.max(4, origTop + dy));
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.bottom = 'auto';
        };

        const onDown = function (e, cx, cy) {
            if (e.target && e.target.closest && e.target.closest('.hj-fab-panel')) return;
            if (e.type === 'click') return;
            
            dragging = true; 
            moved = false;
            startX = cx; 
            startY = cy;
            const r = el.getBoundingClientRect();
            origLeft = r.left; 
            origTop = r.top;
            el.style.transition = 'none';
        };

        const stop = function () { 
            dragging = false; 
            el.style.transition = ''; 
        };

        el.addEventListener('mousedown', function (e) { 
            onDown(e, e.clientX, e.clientY); 
        });
        window.addEventListener('mousemove', function (e) { 
            moveTo(e.clientX, e.clientY); 
        });
        window.addEventListener('mouseup', stop);

        el.addEventListener('touchstart', function (e) { 
            if (e.touches[0]) {
                onDown(e, e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', function (e) { 
            if (e.touches[0]) {
                moveTo(e.touches[0].clientX, e.touches[0].clientY);
                if (dragging && moved) {
                    e.preventDefault();
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', stop);

        el.addEventListener('click', function (e) {
            if (moved) { 
                moved = false; 
                return; 
            }
            if (e.target && e.target.closest && e.target.closest('.hj-fab-panel')) {
                return;
            }
            
            const panel = el.querySelector('.hj-fab-panel');
            if (!panel) return;
            const show = panel.style.display !== 'block';
            panel.style.display = show ? 'block' : 'none';
            if (show) refreshFab();
        });
    }

    function createFab() {
        const wrap = document.createElement('div');
        wrap.className = 'hj-fab';
        const isPc = !isMobileDevice;
        

        wrap.innerHTML = [
            '<img class="hj-fab-logo" src="' + HJ_LOGO + '" alt="" referrerpolicy="no-referrer">',
            '<span class="hj-fab-dot wait"></span>',
            '<div class="hj-fab-panel" style="display:none">',
            '  <div class="hj-fab-title">海角视频 解锁助手</div>',
            '  <div class="hj-fab-row"><span class="hj-dot wait"></span>油猴脚本<b id="hj-st-inj">检测中</b></div>',
            '  <div class="hj-fab-row"><span class="hj-dot wait"></span>登录状态<b id="hj-st-login">检测中</b></div>',
            '  <div class="hj-fab-row"><span class="hj-dot wait"></span>解锁统计<b id="hj-st-cnt">-</b></div>',
            '  <div class="hj-fab-row"><span class="hj-dot ok"></span>解析方案<b id="hj-st-scheme">并行竞速</b></div>',
            '  <div class="hj-scheme-btns">',
            '    <span class="hj-scheme-btn" data-scheme="a">0tsX直解</span>',
            '    <span class="hj-scheme-btn" data-scheme="b">key异或</span>',
            '    <span class="hj-scheme-btn" data-scheme="race">并行竞速</span>',
            '  </div>',
            '  <div class="hj-fab-divider"></div>',
            '  <div class="hj-fab-note">免费脚本，禁止贩卖</div>',
            '  <div class="hj-fab-credit">视频帖子解锁思路来自 <a href="https://t.me/jsforbaby" target="_blank" rel="noopener">baby佬（点我联系baby大大）</a></div>',
            '  <div class="hj-fab-credit">图文帖子解析+V视频解析+油猴移植来自 <a href="https://t.me/ayase520" target="_blank" rel="noopener">新垣绫濑的荷包蛋（点我跳转查看更多插件和反馈问题）</a></div>',
            '</div>'
        ].join('');

        document.body.appendChild(wrap);
        fab = wrap;
        makeDraggable(wrap);
        refreshFab();
        return wrap;
    }

    function initUi() {
        injectCss();
        if (!fab) createFab();
        document.addEventListener('click', function (e) {
            if (fab && e.target && !e.target.closest('.hj-fab')) {
                const panel = fab.querySelector('.hj-fab-panel');
                if (panel && panel.style.display === 'block') panel.style.display = 'none';
            }
        });
        document.addEventListener('click', function (e) {
            const t = e.target;
            if (!t || !t.closest) return;
            const btn = t.closest('.hj-scheme-btn');
            if (!btn) return;
            hjScheme = btn.getAttribute('data-scheme') || 'race';
            saveScheme();
            refreshFab();
            showToast('解析方案：' + schemeLabel(hjScheme));
        });
    }

    function openSitePlayer(url, img, id, name) {
        if (!url) { showToast('未获取到播放地址'); return; }
        try {
            const app = document.querySelector('#app');
            const store = app && app.__vue__ && app.__vue__.$store;
            if (store && typeof store.commit === 'function') {
                const st = store.state || {};
                const live = !!st.videoData;
                const mut = live ? 'updateVideoData' : 'updateVideo';
                const payload = function (show) {
                    if (live) return { show: show, url: show ? url : '', id: id || '', name: name || '海角视频', image: img || '' };
                    return { videoShow: show, videoUrl: show ? url : '', videoImg: img || '', videoId: id || null, videoPreview: false };
                };
                if (live ? st.videoData.show : st.videoShow) store.commit(mut, payload(false));
                setTimeout(function () {
                    store.commit(mut, payload(true));
                    log('[play] 已交给站点播放器', url);
                    showToast('免费脚本，禁止贩卖');
                }, 80);
                return;
            }
            log('[play] 未找到站点 store');
        } catch (e) { log('[play] 触发站点播放器失败', e); }
        try { window.open(url, '_blank'); } catch (e) {}
    }

    function bindPlayClicks() {
        document.addEventListener('click', function (e) {
            const t = e.target;
            if (!t || !t.closest) return;
            const playEl = t.closest('[data-hj-play]') || t.closest('.preview-btn[data-url]') || t.closest('.show-video-box[data-url]');
            if (!playEl) return;
            let url = playEl.getAttribute('data-hj-url') || playEl.getAttribute('data-url') || '';
            const id = playEl.getAttribute('data-hj-id') || playEl.getAttribute('data-id') || '';
            if (realUrlMap.has(String(id))) url = realUrlMap.get(String(id)) || url;
            if (!url) return;
            e.preventDefault();
            e.stopPropagation();
            openSitePlayer(url, playEl.getAttribute('data-hj-img') || playEl.getAttribute('data-img') || '', id, playEl.getAttribute('data-hj-name') || '');
        });
    }


    scanLogin();
    patchFetch();
    patchXHR();
    
    if (document.body) { 
        initUi(); 
        bindPlayClicks(); 
    } else {
        document.addEventListener('DOMContentLoaded', function () { 
            initUi(); 
            bindPlayClicks(); 
        });
    }
    
    if (!isMobileDevice) {
        console.log('[海角] 海角视频解锁油猴脚本已加载');
    }
})();
