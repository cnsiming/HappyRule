// 糖心Vlog解锁·网络重写版 的 Node 冒烟测试
// 用法: node tools/test_tangxin.js Rewrite/qx/tangxin-unlock.js
const fs = require("fs");
const crypto = require("crypto");
const SRC = process.argv[2];
const code = fs.readFileSync(SRC, "utf-8");
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// 与脚本内一致的 AES-128-ECB(PKCS7) + base64
const KEY = Buffer.from("fd14f9f8e38808fa", "utf8");
const encPayload = (obj) => {
  const c = crypto.createCipheriv("aes-128-ecb", KEY, null);
  return Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]).toString("base64");
};
const decPayload = (text) => {
  try {
    const d = crypto.createDecipheriv("aes-128-ecb", KEY, null);
    return JSON.parse(Buffer.concat([d.update(Buffer.from(String(text).trim(), "base64")), d.final()]).toString("utf8"));
  } catch (e) { return null; }
};

const __persist = {};
global.$persistentStore = {
  read: (k) => (k in __persist ? __persist[k] : null),
  write: (v, k) => { __persist[k] = String(v); return true; },
};

let PASS = 0, FAIL = 0;
async function runCase(name, request, response, opts, check) {
  global.$request = request;
  if (response) global.$response = response; else delete global.$response;
  if (opts && opts.httpClient) global.$httpClient = opts.httpClient; else delete global.$httpClient;
  let doneArg = undefined, doneCalled = false;
  global.$done = (o) => { doneCalled = true; doneArg = o; };
  try { (0, eval)(code); }
  catch (e) { console.log(`[${name}] SCRIPT THREW:`, e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e.message); FAIL++; return; }
  for (let i = 0; i < 80 && !doneCalled; i++) await sleep(50);
  if (!doneCalled) { console.log(`[${name}] FAIL: $done not called in 4s`); FAIL++; return; }
  try { check(doneArg); PASS++; }
  catch (e) { console.log(`[${name}] CHECK FAIL:`, e.message); FAIL++; }
}
const U = "https://txh55.com";

(async () => {
  // 1. user/info：VIP 伪造 + 广告键清除（wrapped 形态）
  const userInner = { data: { id: 7, name: "x", is_vip: "n", balance: "10", ad_banner: ["a"], ads: ["b"], layer_ad: { x: 1 } } };
  await runCase("userInfo伪造",
    { url: U + "/h5/user/info", method: "GET", headers: {} },
    { status: 200, headers: {}, body: JSON.stringify({ data: encPayload(userInner), errcode: 0, timestamp: 1 }) },
    null,
    (done) => {
      const outer = JSON.parse(done.body);
      const d = decPayload(outer.data);
      if (!d) throw new Error("decrypt failed");
      if (!d.data) throw new Error("no data layer");
      if (d.data.is_vip !== "y" || d.data.balance !== "999999") throw new Error("vip not forged: " + JSON.stringify(d).slice(0, 120));
      if (!Array.isArray(d.data.ad_banner) || d.data.ad_banner.length !== 0) throw new Error("ad_banner not emptied");
      if ("ads" in d.data || "layer_ad" in d.data) throw new Error("ad flag/object keys not deleted");
      if (outer.errcode !== 0) throw new Error("outer wrapper broken");
      console.log("[1.userInfo伪造] PASS");
    });

  // 2. system/info：公告清除（bare 形态）
  await runCase("systemInfo清公告",
    { url: U + "/h5/system/info", method: "GET", headers: {} },
    { status: 200, headers: {}, body: encPayload({ data: { notice: "开屏广告", version: "2" } }) },
    null,
    (done) => {
      const d = decPayload(done.body);
      if (!d) throw new Error("decrypt failed");
      if (d.data.notice !== "") throw new Error("notice not cleared");
      if (d.data.version !== "2") throw new Error("non-ad field touched");
      console.log("[2.systemInfo清公告] PASS");
    });

  // 3. movie/search：广告条目清除
  const searchInner = { data: { items: [
    { id: 1, title: "正常视频", type: "video" },
    { id: 2, type: "ad", title: "广告" },
    { id: "3_ad_x", title: "伪装" },
    { id: 4, is_ad: "y", title: "广告2" },
  ], ad_box: ["x"], bottom_ad: ["y"] } };
  await runCase("search去广告",
    { url: U + "/h5/movie/search", method: "GET", headers: {} },
    { status: 200, headers: {}, body: encPayload(searchInner) },
    null,
    (done) => {
      const d = decPayload(done.body);
      if (!d) throw new Error("decrypt failed");
      if (!d.data) throw new Error("no data layer");
      if (d.data.items.length !== 1 || d.data.items[0].id !== 1) throw new Error("ad items not removed: " + JSON.stringify(d.items));
      if (!Array.isArray(d.data.ad_box) || d.data.ad_box.length !== 0) throw new Error("ad_box not emptied");
      if (!Array.isArray(d.data.bottom_ad) || d.data.bottom_ad.length !== 0) throw new Error("bottom_ad not emptied");
      console.log("[3.search去广告] PASS");
    });

  // 4. QX 模式：movie/detail POST 降级为本地广告清除 + 原响应
  const detailInner = { data: { id: 42, title: "影片", play_url: "", ad_videos: ["ad1"], play_ads: ["ad2"] } };
  await runCase("QX·detail本地降级",
    { url: U + "/h5/movie/detail", method: "POST", headers: {}, body: encPayload({ data: { id: 42 } }) },
    { status: 200, headers: {}, body: encPayload(detailInner) },
    null,
    (done) => {
      if (!done.body) throw new Error("should return locally-stripped body");
      const d = decPayload(done.body);
      if (!d) throw new Error("decrypt failed");
      if (!d.data) throw new Error("no data layer");
      if (!Array.isArray(d.data.ad_videos) || d.data.ad_videos.length !== 0)
        throw new Error("ad_videos not emptied");
      if (!Array.isArray(d.data.play_ads) || d.data.play_ads.length !== 0) throw new Error("ad keys not stripped");
      if (d.data.play_url !== "") throw new Error("original response should pass through (no service on QX)");
      console.log("[4.QX·detail本地降级] PASS");
    });

  // 5. Surge 模式：movie/detail POST 走解析服务替换
  const SERVICE_BODY = encPayload({ data: { id: 42, play_url: "https://v.cdn.x/42.m3u8", is_vip: "y", title: "影片" } });
  const surgeHC = {
    post: (req, cb) => {
      if (/tx-unlock\.6ayase\.workers\.dev\/v1\/unlock$/.test(req.url)) {
        const j = JSON.parse(req.body);
        if (!Array.isArray(j.ids) || j.ids[0] !== "42") { cb(null, { status: 200 }, JSON.stringify({ ok: false, error: "bad ids" })); return; }
        cb(null, { status: 200 }, JSON.stringify({ ok: true, items: { "42": SERVICE_BODY }, server: {} }));
      } else cb(new Error("unexpected POST " + req.url), null, null);
    },
    get: (req, cb) => cb(new Error("unexpected GET " + req.url), null, null),
  };
  // 5a. 请求阶段：stash POST 体
  await runCase("Surge·请求体缓存",
    { url: U + "/h5/movie/detail", method: "POST", headers: {}, body: encPayload({ data: { id: 42 } }) },
    null, { httpClient: surgeHC },
    (done) => { console.log("[5a.请求体缓存] PASS"); });
  // 5b. 响应阶段：服务替换语义
  await runCase("Surge·服务解锁替换",
    { url: U + "/h5/movie/detail", method: "POST", headers: {}, body: encPayload({ data: { id: 42 } }) },
    { status: 200, headers: {}, body: encPayload(detailInner) },
    { httpClient: surgeHC },
    (done) => {
      if (done.body !== SERVICE_BODY) throw new Error("body not replaced by service result");
      const d = decPayload(done.body);
      if (!d || d.data.play_url !== "https://v.cdn.x/42.m3u8") throw new Error("service body invalid");
      console.log("[5b.服务解锁替换] PASS");
    });

  // 6. Surge 模式：服务失败 -> benignDetail 占位（可解密为 status:n）
  const badHC = {
    post: (req, cb) => cb(new Error("network down"), null, null),
    get: (req, cb) => cb(new Error("no"), null, null),
  };
  await runCase("Surge·服务失败占位",
    { url: U + "/h5/movie/detail", method: "POST", headers: {}, body: encPayload({ data: { id: 43 } }) },
    { status: 200, headers: {}, body: encPayload(detailInner) },
    { httpClient: badHC },
    (done) => {
      if (!done.body) throw new Error("benign placeholder expected");
      const d = decPayload(done.body);
      if (!d || d.status !== "n" || d.errorCode !== 9001) throw new Error("not a benign placeholder: " + JSON.stringify(d));
      console.log("[6.服务失败占位] PASS");
    });

  // 7. 不匹配 URL 透传
  await runCase("不匹配透传",
    { url: U + "/h5/movie/other", method: "GET", headers: {} },
    { status: 200, headers: {}, body: "{}" },
    null,
    (done) => { if (done.body) throw new Error("should pass through"); console.log("[7.不匹配透传] PASS"); });

  // 8. 非 txh 域名透传
  await runCase("非糖心域名透传",
    { url: "https://example.com/h5/user/info", method: "GET", headers: {} },
    { status: 200, headers: {}, body: "{}" },
    null,
    (done) => { if (done.body) throw new Error("should pass through"); console.log("[8.非糖心域名透传] PASS"); });

  console.log(`\n========== ${PASS} PASS / ${FAIL} FAIL ==========`);
  process.exit(FAIL ? 1 : 0);
})();
