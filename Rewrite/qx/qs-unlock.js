/******************************************
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
 *   https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/qs-unlock.js
 *
 * 注意：
 *   1. 站点为动态域名族（qishe/qs/7she/qsgg 前缀家族，随时换后缀），无法枚举进
 *      hostname；使用前必须把你在浏览器里实际访问的域名加入 MITM hostname
 *      （conf 里有说明和示例），否则规则不会生效。
 *   2. 接口路径特征为 /source/plugin/qsts_app/index.php/* 与 /mserver/*，
 *      规则按路径匹配，任何域名加上 MITM 后即生效。
 *   3. 与浏览器 userscript 不冲突；DOM 悬浮球属页面层，网关版没有（属预期差异）。
 ******************************************/
(function () {
    "use strict";

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


    var W = window;

    /* ===================== 0. 常量 ===================== */
    var NAME = "妻社VIP";
    var VIP_GROUP_ID = "32";
    var VIP_GROUP_TITLE = " 妻社 终身VIP";
    var VIP_GROUP_STARS = "Lv.8";
    var VIP_GROUP_COLOR = "#FF6600";

    /* 接口路径判定：/source/plugin/qsts_app/index.php/* 与 /mserver/* */
    var QS_API_RE = /\/(?:source\/plugin\/qsts_app\/index\.php|mserver)(?:\/|$|\?)/i;
    function isApiUrl(u) { return typeof u === "string" && QS_API_RE.test(u); }

    /* 站点判定：抗线路改名/换数字后缀（qishegg56 到 qishegg57 这类）。
       脚本用宽泛的全站 @match 载入，真正跑不跑由这里收敛：
         1) 妻社线路域族（7she…/qishe…/qiqshe…/qs…/qsgg…/qsiosxz… 等）
         2) 任意主机上的 H5 应用路径 /h5/ 或 /ih5/（域名换了也认路径）
         3) 任意主机上的接口路径（/source/plugin/qsts_app/index.php 或 /mserver） */
    var QS_HOST_RE = /(?:^|\.)(?:7she|qishe[a-z0-9-]*|qiqshe\d*|qsgg[a-z0-9]+|qsiosxz[a-z0-9]*|qs[a-z0-9-]*\d+[a-z0-9-]*|hakfyvf|gzxxxy|yajufang|xuanyipai|qhsyxx|newfangchan|youshangjiaotyym\d+|smzf[a-z0-9-]*|shenmazhifu)\.(?:[a-z0-9-]+\.)*[a-z]{2,}$/i;
    function shouldRun() {
        try {
            if (isApiUrl(location.href)) return true;
            if (QS_HOST_RE.test(location.hostname)) return true;
            if (/^\/i?h5(?:\/|$)/i.test(location.pathname)) return true;
        } catch (e) {}
        return false;
    }
    if (!shouldRun()) return;


    function extractApiMethod(url) {
        url = url || "";
        var m = url.match(/index\.php\/([^?&#]+)/);
        if (m) return m[1];
        var m2 = url.match(/\/mserver\/(.+?)(?:\?|$)/);
        if (m2) return m2[1];
        return url;
    }

    var crackOk = false;


    function upgradeUser(user) {
        if (!user || typeof user !== "object") return;
        if ("username" in user) user.username = "免费脚本禁止贩卖";
        if ("groupid" in user) user.groupid = VIP_GROUP_ID;
        if ("groupexpiry" in user) user.groupexpiry = 4102444800;
        if ("grouptitle" in user) user.grouptitle = VIP_GROUP_TITLE;
        if ("groupstars" in user) user.groupstars = VIP_GROUP_STARS;
        if ("groupcolor" in user) user.groupcolor = VIP_GROUP_COLOR;
        if ("adminid" in user) user.adminid = -1;
        if ("credits" in user) user.credits = 999999;
        if ("freeze" in user) user.freeze = 0;
        if ("memberstatus" in user) user.memberstatus = 0;
    }

    function upgradeGroup(g) {
        if (!g || typeof g !== "object") return;
        g.groupid = VIP_GROUP_ID;
        g.grouptitle = VIP_GROUP_TITLE;
        g.color = VIP_GROUP_COLOR;
        if ("stars" in g) g.stars = "8";
        if ("readaccess" in g) g.readaccess = "200";
        if ("allowvisit" in g) g.allowvisit = "1";
        if ("allowreply" in g) g.allowreply = "1";
        if ("allowpost" in g) g.allowpost = "1";
        if ("allowgetattach" in g) g.allowgetattach = "1";
        if ("allowgetimage" in g) g.allowgetimage = "1";
        if ("allowpostattach" in g) g.allowpostattach = "1";
        if ("allowpostimage" in g) g.allowpostimage = "1";
        if ("allowsendpm" in g) g.allowsendpm = "1";
        if ("allowfollow" in g) g.allowfollow = "1";
        if ("allowinvite" in g) g.allowinvite = "1";
        if ("allowcomment" in g) g.allowcomment = "1";
        if ("allowcommentpost" in g) g.allowcommentpost = "1";
        if ("allowcommentreply" in g) g.allowcommentreply = "1";
        if ("maxprice" in g) g.maxprice = "99999";
        if ("allowpostreply" in g) g.allowpostreply = true;
        if ("allowpostpoll" in g) g.allowpostpoll = "1";
        if ("allowpostreward" in g) g.allowpostreward = "1";
        if ("allowposttrade" in g) g.allowposttrade = "1";
    }

    function unlockPost(post) {
        if (!post || typeof post !== "object") return;

        if ("showVerifyThreadPremMsg" in post) post.showVerifyThreadPremMsg = false;
        if ("price" in post) post.price = "0";
        if ("readperm" in post) post.readperm = "0";
        if ("payed" in post) post.payed = 1;
        if ("special" in post && post.special === "1") post.special = "0";

        /* 有的线路列表接口不带 payed 字段，这里补上，免得前端还显示「需购买」 */
        if (!("payed" in post) && ("price" in post || "readperm" in post)) post.payed = 1;

        /* 解锁附件 */
        if (post.attachData) {
            var items = post.attachData.data || post.attachData;
            if (Object.prototype.toString.call(items) === "[object Array]") {
                for (var i = 0; i < items.length; i++) {
                    var a = items[i];
                    if (!a || typeof a !== "object") continue;
                    if ("readperm" in a) a.readperm = "0";
                    if ("price" in a) a.price = "0";
                    if ("isreadperm" in a) a.isreadperm = 0;
                    a.payed = 1;
                    if (a.url && !a.defurl) a.defurl = a.url;
                }
            }
        }

        /* 解锁内嵌付费附件：{{apptag=video}}{...}{{/apptag}} */
        if (post.message && typeof post.message === "string" && post.message.indexOf("apptag") !== -1) {
            post.message = post.message.replace(
                /\{\{apptag=(video|showimg)\}\}(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})\{\{\/apptag\}\}/g,
                function (match, type, jsonStr) {
                    try {
                        var obj = JSON.parse(jsonStr);
                        if ("price" in obj) obj.price = "0";
                        if ("readperm" in obj) obj.readperm = "0";
                        obj.payed = 1;
                        if (obj.url && !obj.defurl) obj.defurl = obj.url;
                        return "{{apptag=" + type + "}}" + JSON.stringify(obj) + "{{/apptag}}";
                    } catch (e) {
                        return match;
                    }
                }
            );
        }
    }

    function findLists(obj) {
        var result = [];
        if (!obj || typeof obj !== "object") return result;
        if (Object.prototype.toString.call(obj) === "[object Array]") {
            if (obj.length > 0 && obj[0] && typeof obj[0] === "object" && "tid" in obj[0]) {
                result.push(obj);
            } else {
                for (var i = 0; i < obj.length; i++) {
                    var sub = findLists(obj[i]);
                    for (var j = 0; j < sub.length; j++) result.push(sub[j]);
                }
            }
            return result;
        }
        var keys = Object.keys(obj);
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            if (key === "list" || key === "stickList" || key === "data") {
                var val = obj[key];
                if (Object.prototype.toString.call(val) === "[object Array]" && val.length > 0 &&
                    val[0] && typeof val[0] === "object" && "tid" in val[0]) {
                    result.push(val);
                } else if (val && typeof val === "object") {
                    var sub2 = findLists(val);
                    for (var n = 0; n < sub2.length; n++) result.push(sub2[n]);
                }
            }
        }
        return result;
    }

    function clearForumPerm(f) {
        if (!f || typeof f !== "object") return;
        if ("viewperm" in f) f.viewperm = "";
        if ("postperm" in f) f.postperm = "";
        if ("replyperm" in f) f.replyperm = "";
        if ("getattachperm" in f) f.getattachperm = "";
        if ("gviewperm" in f) f.gviewperm = "0";
        if ("password" in f) f.password = "";
    }

    function modifyConfig(data) {
        var c = data.config || data;
        var p = c.pluginSet || c;

        if ("openVideoVip" in p) p.openVideoVip = "0";
        if ("videoTime" in p) p.videoTime = "99999";
        if ("videoFreeCons" in p) p.videoFreeCons = "";

        if ("forum_tip_groupids" in p) p.forum_tip_groupids = [];
        if ("forum_tip_forumids" in p) p.forum_tip_forumids = "";
        if ("forum_tip_text" in p) p.forum_tip_text = "";
        if ("forum_tip_url" in p) p.forum_tip_url = "";
        if ("forum_tip_bg" in p) p.forum_tip_bg = "";
        if ("post_tip_groupids" in p) p.post_tip_groupids = [];
        if ("post_tip_text" in p) p.post_tip_text = "";
        if ("post_tip_url" in p) p.post_tip_url = "";
        if ("post_tip_bg" in p) p.post_tip_bg = "";

        if ("gads_show_type" in p) p.gads_show_type = "0";
        if ("gads_req_url" in p) p.gads_req_url = "";
        if ("gads_ios_appid" in p) p.gads_ios_appid = "";
        if ("gads_ios_appkey" in p) p.gads_ios_appkey = "";
        if ("gads_az_appid" in p) p.gads_az_appid = "";
        if ("gads_az_appkey" in p) p.gads_az_appkey = "";
        if ("afficheImg" in p) p.afficheImg = "";
        if ("afficheImgStyle" in p) p.afficheImgStyle = "";
        if ("news_ext_bnt" in p) p.news_ext_bnt = "";
        if ("app_show_adset" in p) p.app_show_adset = "0";
        if ("app_show_tjset" in p) p.app_show_tjset = "0";

        if ("add_group_perm" in p) p.add_group_perm = "0";
        if ("add_group_perm_tip" in p) p.add_group_perm_tip = "";
        if ("groupInjonGroupids" in p) p.groupInjonGroupids = [];
        if ("follow_groupids" in p) p.follow_groupids = [];

        if ("open_clipboard" in p) p.open_clipboard = "0";
        if ("guide_open" in p) p.guide_open = "0";

        if ("replace_h5url_fid" in p) p.replace_h5url_fid = "";
        if ("replace_h5url_tid" in p) p.replace_h5url_tid = "";
        if ("replace_h5url_uid" in p) p.replace_h5url_uid = "";
        if ("allToh5Url" in p) p.allToh5Url = "";

        if ("space_hone_astricts" in p) p.space_hone_astricts = [];

        if ("view_custom_cmp_top" in p) p.view_custom_cmp_top = "";
        if ("view_custom_cmp_bottom" in p) p.view_custom_cmp_bottom = "";
        if ("view_list_cmp" in p) p.view_list_cmp = "";
        if ("view_list_cmp_idx" in p) p.view_list_cmp_idx = "";
        if ("view_custom_ad_top" in p) p.view_custom_ad_top = "";
        if ("view_custom_ad_bottom" in p) p.view_custom_ad_bottom = "";
        if ("forum_custom_cmp" in p) p.forum_custom_cmp = [];
        if ("group_list_cmp" in p) p.group_list_cmp = "";
        if ("group_list_cmp_idx" in p) p.group_list_cmp_idx = "";
        if ("group_all_list_cmp" in p) p.group_all_list_cmp = "";
        if ("group_all_list_cmp_idx" in p) p.group_all_list_cmp_idx = "";
        if ("group_custom_cmp" in p) p.group_custom_cmp = [];

        if (Object.prototype.toString.call(c.component) === "[object Array]") {
            for (var i = 0; i < c.component.length; i++) {
                var comp = c.component[i];
                if (!comp || typeof comp !== "object") continue;
                if (comp.values && Object.prototype.toString.call(comp.values) === "[object Array]") {
                    for (var j = 0; j < comp.values.length; j++) {
                        var tab = comp.values[j];
                        if (!tab || typeof tab !== "object") continue;
                        if ("component" in tab) tab.component = [];
                        if ("tabs_ad_cmp" in tab) tab.tabs_ad_cmp = "";
                        if ("tabs_ad_idx" in tab) tab.tabs_ad_idx = "";
                    }
                }
            }
        }

        if (data.member) upgradeCurrentUser(data.member);
    }

    function upgradeCurrentUser(memberData) {
        if (memberData.member) upgradeUser(memberData.member);
        if (memberData.group) upgradeGroup(memberData.group);
    }

    function modifyUserInit(data) {
        if (data.member) upgradeCurrentUser(data.member);
    }

    function modifyPostList(data) {
        var lists = findLists(data);
        for (var i = 0; i < lists.length; i++) {
            for (var j = 0; j < lists[i].length; j++) unlockPost(lists[i][j]);
        }
    }

    function modifyThreadDetail(data) {
        if (Object.prototype.toString.call(data.list) === "[object Array]") {
            for (var i = 0; i < data.list.length; i++) unlockPost(data.list[i]);
        }
        if (data.thread) unlockPost(data.thread);
        if (Object.prototype.toString.call(data.postlist) === "[object Array]") {
            for (var j = 0; j < data.postlist.length; j++) unlockPost(data.postlist[j]);
        }
        clearForumPerm(data.forum);
        if (data.userGroup) upgradeGroup(data.userGroup);
        modifyPostList(data);
    }

    function modifyForum(data) {
        clearForumPerm(data.forum);
        modifyPostList(data);
    }

    function modifyUser(data) {
        upgradeUser(data.member || data.user || data);
    }

    function deepModify(obj) {
        if (!obj || typeof obj !== "object") return;
        if (Object.prototype.toString.call(obj) === "[object Array]") {
            for (var i = 0; i < obj.length; i++) deepModify(obj[i]);
            return;
        }
        if ("tid" in obj && "fid" in obj) unlockPost(obj);
        if ("viewperm" in obj && "fid" in obj) {
            obj.viewperm = "";
            obj.postperm = obj.postperm ? "" : undefined;
            obj.replyperm = obj.replyperm ? "" : undefined;
            obj.getattachperm = obj.getattachperm ? "" : undefined;
        }
        var keys = Object.keys(obj);
        for (var k = 0; k < keys.length; k++) {
            var val = obj[keys[k]];
            if (val && typeof val === "object") deepModify(val);
        }
    }

    /* 按接口路径分发，返回是否发生了改写 */
    function applyUnlock(json, url) {
        if (!json || typeof json !== "object") return false;
        if (Object.prototype.toString.call(json) === "[object Array]") return false;
        if (!json.data) return false;

        var path = extractApiMethod(url);

        if (/config\.init$/i.test(path)) modifyConfig(json.data);
        else if (/config\.userInit/i.test(path)) modifyUserInit(json.data);
        else if (/post\.getIndexList|postlist\.getThreadList/i.test(path)) modifyPostList(json.data);
        else if (/postlist\.getThreadView|post\.getThread/i.test(path)) modifyThreadDetail(json.data);
        else if (/forum\.getForumByType|forum\.getForumDetail/i.test(path)) modifyForum(json.data);
        else if (/user\.getInfo|user\.getMyinfo|member\.getInfo/i.test(path)) modifyUser(json.data);
        else if (/invites/i.test(path)) return false;
        else deepModify(json.data);

        return true;
    }

    /* 把响应体（字符串或已解析对象）过一遍改写 */
    function transformBody(body, url) {
        if (body == null) return body;
        try {
            if (typeof body === "object") {
                if (applyUnlock(body, url) && !crackOk) { crackOk = true; onCracked(); }
                return body;
            }
            if (typeof body !== "string") return body;
            var head = body.charCodeAt(0);
            /* 只处理 JSON 对象，跳过数组/HTML/空响应 */
            if (head !== 123 && head !== 91) return body;
            var json = JSON.parse(body);
            if (applyUnlock(json, url)) {
                if (!crackOk) { crackOk = true; onCracked(); }
                return JSON.stringify(json);
            }
        } catch (e) {}
        return body;
    }

    /* ===================== 1.5 搜索次数限制解除 =====================
       实测（安卓 X 浏览器 + CDP 抓包）：
         · 搜索接口是 /source/plugin/qsts_app/index.php/cearch.search
         · 服务端按请求头 deviceid 计数：「每个 deviceid 每天 2 次免费搜索」，
           用满后返回 {"code":20011,"msg":"您今日免费搜索次数已经用完，成为终身vip…"}
         · sign 与 deviceid 无关：换掉 deviceid、沿用 App 自己算的 sign，服务端
           依然返回 code:200 + 真实结果（sign 改成乱值才会 10003 api-error）
       所以只要发搜索请求时把 deviceid 换成新的随机值，就不会再触发限流。
    ================================================================= */
    var SEARCH_URL_RE = /cearch\.search(?:\?|$)/i;
    var MAX_SEARCH_PER_DEVICE = 2;      /* 一个 deviceid 用满 2 次就换新的 */
    var LS_DEV_KEY = "qs_ul_dev_id";
    var LS_DEV_USED = "qs_ul_dev_used";

    function isSearchUrl(u) { return typeof u === "string" && SEARCH_URL_RE.test(u); }

    function randDeviceId() {
        var s = "";
        for (var i = 0; i < 24; i++) s += "0123456789abcdef"[Math.floor(Math.random() * 16)];
        return s;
    }

    function readDevState() {
        var id = "", used = 0;
        try {
            id = localStorage.getItem(LS_DEV_KEY) || "";
            used = parseInt(localStorage.getItem(LS_DEV_USED) || "0", 10) || 0;
        } catch (e) {}
        return { id: id, used: used };
    }

    function writeDevState(id, used) {
        try {
            localStorage.setItem(LS_DEV_KEY, id);
            localStorage.setItem(LS_DEV_USED, String(used));
        } catch (e) {}
    }

    /* 取一个还有额度的 deviceid，用满就换新的 */
    function pickDeviceId() {
        var st = readDevState();
        if (!st.id || st.used >= MAX_SEARCH_PER_DEVICE) {
            st.id = randDeviceId();
            st.used = 0;
        }
        st.used++;
        writeDevState(st.id, st.used);
        return st.id;
    }

    /* 服务端仍说用完了：把当前 deviceid 直接标满，下次搜索立刻换 */
    function markSearchExhausted() {
        var st = readDevState();
        writeDevState(st.id || randDeviceId(), MAX_SEARCH_PER_DEVICE);
    }

    function isSearchLimitBody(raw, url) {
        if (!isSearchUrl(url) || typeof raw !== "string") return false;
        if (raw.indexOf("20011") === -1) return false;
        return /您今日免费搜索次数/.test(raw) || /"code"\s*:\s*20011/.test(raw);
    }

    /* fetch 场景：把 deviceid 换成新值 */
    function searchHeadersWithDeviceId(input, init) {
        try {
            var h = new Headers((init && init.headers) || (input && input.headers) || undefined);
            var has = false;
            h.forEach(function (v, k) { if (String(k).toLowerCase() === "deviceid") has = true; });
            if (!has) return null;
            h.set("deviceid", pickDeviceId());
            return h;
        } catch (e) { return null; }
    }

    /* ===================== 2. 响应劫持（XHR + fetch） ===================== */

    var xhrProto = XMLHttpRequest.prototype;
    var rawOpen = xhrProto.open;

    xhrProto.open = function (method, url) {
        try {
            this.__qs_url = url;
            this.__qs_ready = false;
            this.__qs_out = null;
            this.__qs_search = isSearchUrl(url);
        } catch (e) {}
        return rawOpen.apply(this, arguments);
    };

    /* 搜索请求发出去之前，把 deviceid 换成还有额度的那一个 */
    var rawSetHeader = xhrProto.setRequestHeader;
    xhrProto.setRequestHeader = function (name, value) {
        try {
            if (this.__qs_search && String(name).toLowerCase() === "deviceid") {
                value = pickDeviceId();
            }
        } catch (e) {}
        return rawSetHeader.call(this, name, value);
    };

    function patchXhrGetter(prop) {
        var desc = Object.getOwnPropertyDescriptor(xhrProto, prop);
        if (!desc || !desc.get) return;
        Object.defineProperty(xhrProto, prop, {
            configurable: true,
            enumerable: desc.enumerable,
            get: function () {
                var v = desc.get.call(this);
                try {
                    if (!isApiUrl(this.__qs_url)) return v;
                    if (isSearchLimitBody(v, this.__qs_url)) markSearchExhausted();
                    if (this.__qs_ready) return this.__qs_out;
                    this.__qs_out = transformBody(v, this.__qs_url);
                    this.__qs_ready = true;
                    return this.__qs_out;
                } catch (e) {
                    return v;
                }
            },
            set: desc.set
        });
    }
    patchXhrGetter("responseText");
    patchXhrGetter("response");

    var rawFetch = W.fetch;
    if (typeof rawFetch === "function") {
        W.fetch = function (input, init) {
            var url = typeof input === "string" ? input : (input && input.url ? input.url : "");
            var callInput = input, callInit = init;
            if (isSearchUrl(url)) {
                var nh = searchHeadersWithDeviceId(input, init);
                if (nh) {
                    if (typeof input === "string") callInit = Object.assign({}, init || {}, { headers: nh });
                    else if (typeof Request === "function") callInput = new Request(input, { headers: nh });
                }
            }
            var p = rawFetch.call(this, callInput, callInit);
            if (!isApiUrl(url)) return p;
            return p.then(function (res) {
                try {
                    return res.clone().text().then(function (text) {
                        var out = transformBody(text, url);
                        if (out === text) return res;
                        return new Response(out, {
                            status: res.status,
                            statusText: res.statusText,
                            headers: res.headers
                        });
                    }, function () { return res; });
                } catch (e) {
                    return res;
                }
            });
        };
    }


    var LOGO = "data:image/jpeg;base64,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";

    var isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile/i.test(navigator.userAgent || "");

    function injectUiCss() {
        if (document.getElementById("gc-ui-style")) return;
        var css = [
            ".gc-fab{position:fixed;left:8px;width:48px;height:48px;",
            "bottom:96px;z-index:2147483000;user-select:none;-webkit-user-select:none;",
            "touch-action:manipulation;}",
            ".gc-fab-logo{width:100%;height:100%;border-radius:50%;object-fit:cover;",
            "border:2px solid #ffd54a;box-shadow:0 4px 16px rgba(0,0,0,.55);cursor:pointer;",
            "background:#1a1214;display:block;",
            "pointer-events:auto;}",
            ".gc-fab-dot{position:absolute;top:-2px;right:-2px;width:12px;height:12px;",
            "border:1.5px solid #0d0608;border-radius:50%;background:#777;",
            "transition:background .3s,box-shadow .3s;pointer-events:none;}",
            ".gc-fab-dot.ok{background:#2ecc40;box-shadow:0 0 10px #2ecc40}",
            ".gc-fab-dot.err{background:#ff4136;box-shadow:0 0 10px #ff4136}",
            ".gc-fab-dot.wait{background:#f0ad4e;box-shadow:0 0 10px #f0ad4e}",
            ".gc-fab-panel{position:absolute;bottom:66px;left:0;width:212px;padding:10px 12px;",
            "background:rgba(22,15,17,.97);border:1px solid rgba(255,213,74,.35);",
            "border-radius:14px;color:#fff;font-size:12px;line-height:1.7;",
            "box-shadow:0 10px 34px rgba(0,0,0,.65);",
            "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);",
            "z-index:2147483001;display:none;pointer-events:auto;}",
            ".gc-fab-title{font-size:13px;font-weight:600;color:#ffd54a;margin-bottom:6px;text-align:center}",
            ".gc-fab-row{display:flex;align-items:center;gap:6px;font-size:12px}",
            ".gc-fab-row b{margin-left:auto;font-weight:600;color:#ffd54a}",
            ".gc-dot{width:8px;height:8px;border-radius:50%;flex:none}",
            ".gc-dot.ok{background:#2ecc40}.gc-dot.err{background:#ff4136}.gc-dot.wait{background:#f0ad4e}",
            ".gc-fab-divider{height:1px;background:rgba(255,255,255,.12);margin:8px 0}",
            ".gc-fab-note{text-align:center;color:#ffd54a;font-weight:600;margin-bottom:4px;font-size:11px}",
            ".gc-fab-credit{font-size:10px;color:#cfc4c6}",
            ".gc-fab-credit a{color:#ffd54a;text-decoration:none}",
            ".gc-toast{position:fixed;top:16%;left:50%;transform:translateX(-50%);",
            "background:rgba(22,15,17,.96);color:#ffd54a;padding:11px 20px;border-radius:12px;",
            "font-size:13px;border:1px solid rgba(255,213,74,.45);box-shadow:0 8px 28px rgba(0,0,0,.55);",
            "z-index:2147483100;pointer-events:none;text-align:center;animation:gcToastIn .25s ease-out}",
            "@keyframes gcToastIn{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}",
            ".gc-toast.gc-toast-hide{opacity:0;transition:opacity .45s}"
        ].join("");
        var style = document.createElement("style");
        style.id = "gc-ui-style";
        style.textContent = css;
        (document.head || document.documentElement || document.body).appendChild(style);
    }

    function showToast(msg) {
        if (!document.body) return;
        var t = document.createElement("div");
        t.className = "gc-toast";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () {
            t.classList.add("gc-toast-hide");
            setTimeout(function () { t.remove(); }, 500);
        }, 2600);
    }

    function onCracked() {
        refreshFabStatus();
        showToast("妻社VIP 已解锁");
    }

    function createFab() {
        if (document.getElementById("gc-fab")) return;
        var wrap = document.createElement("div");
        wrap.id = "gc-fab";
        wrap.className = "gc-fab";
        wrap.innerHTML =
            '<img class="gc-fab-logo" src="' + LOGO + '" alt="" referrerpolicy="no-referrer">' +
            '<span class="gc-fab-dot wait"></span>' +
            '<div class="gc-fab-panel" style="display:none">' +
                '<div class="gc-fab-title">妻社 解锁助手</div>' +
                '<div class="gc-fab-row"><span class="gc-dot ok"></span>脚本状态<b>已注入</b></div>' +
                '<div class="gc-fab-row"><span class="gc-dot ok"></span>VIP 解锁<b>已开启</b></div>' +
                '<div class="gc-fab-row"><span class="gc-dot ok"></span>去广告<b>已开启</b></div>' +
                '<div class="gc-fab-row"><span class="gc-dot ok"></span>搜索限制<b>已解除</b></div>' +
                '<div class="gc-fab-divider"></div>' +
                '<div class="gc-fab-note">免费脚本，禁止贩卖</div>' +
                '<div class="gc-fab-credit">解锁思路来自: <a href="https://t.me/py996" target="_blank" rel="noopener">彭于晏（点我联系大大）</a></div>' +
                '<div class="gc-fab-credit">油猴移植来自: <a href="https://t.me/ayase520" target="_blank" rel="noopener">新垣绫濑的荷包蛋（点我跳转查看更多插件和反馈问题）</a></div>' +
            '</div>';
        document.body.appendChild(wrap);
        makeDraggable(wrap);
        return wrap;
    }

    function refreshFabStatus() {
        var fab = document.getElementById("gc-fab");
        if (!fab) return;
        var dot = fab.querySelector(".gc-fab-dot");
        if (dot) dot.className = "gc-fab-dot " + (crackOk ? "ok" : "wait");
    }

    function makeDraggable(el) {
        var dragging = false, moved = false, startX = 0, startY = 0;
        var origLeft = 0, origTop = 0;
        var lastMoveTime = 0;
        var SIZE = 48;

        function moveTo(cx, cy) {
            if (!dragging) return;
            var now = Date.now();
            if (isMobileDevice && now - lastMoveTime < 50) return;
            lastMoveTime = now;
            var dx = cx - startX, dy = cy - startY;
            if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
            var x = Math.min(window.innerWidth - SIZE, Math.max(4, origLeft + dx));
            var y = Math.min(window.innerHeight - SIZE - 50, Math.max(4, origTop + dy));
            el.style.left = x + "px";
            el.style.top = y + "px";
            el.style.bottom = "auto";
        }

        function onDown(e, cx, cy) {
            if (e.target && e.target.closest && e.target.closest(".gc-fab-panel")) return;
            dragging = true; moved = false;
            startX = cx; startY = cy;
            var r = el.getBoundingClientRect();
            origLeft = r.left; origTop = r.top;
            el.style.transition = "none";
        }

        function stop() { dragging = false; el.style.transition = ""; }

        el.addEventListener("mousedown", function (e) { onDown(e, e.clientX, e.clientY); });
        window.addEventListener("mousemove", function (e) { moveTo(e.clientX, e.clientY); });
        window.addEventListener("mouseup", stop);

        el.addEventListener("touchstart", function (e) {
            if (e.touches[0]) onDown(e, e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        window.addEventListener("touchmove", function (e) {
            if (e.touches[0]) {
                moveTo(e.touches[0].clientX, e.touches[0].clientY);
                if (dragging && moved) e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener("touchend", stop);

        el.addEventListener("click", function (e) {
            if (moved) { moved = false; return; }
            if (e.target && e.target.closest && e.target.closest(".gc-fab-panel")) return;
            var panel = el.querySelector(".gc-fab-panel");
            if (!panel) return;
            var show = panel.style.display !== "block";
            panel.style.display = show ? "block" : "none";
        });
    }

    /* ===================== 4. 启动 ===================== */

    function initUi() {
        /* 子框架里只保留接口 hook，不画 UI */
        if (W.top !== W.self) return;
        injectUiCss();

        function ready() {
            createFab();
            refreshFabStatus();
            setInterval(refreshFabStatus, 1500);
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function () { setTimeout(ready, 200); });
        } else {
            setTimeout(ready, 200);
        }
    }

    if (document.body) {
        initUi();
    } else {
        document.addEventListener("DOMContentLoaded", initUi);
    }

    


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

})();
