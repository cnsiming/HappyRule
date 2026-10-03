// 海角视频解锁·网络重写版 的 Node 冒烟测试
// 用法: node tools/test_haijiao.js Rewrite/qx/haijiao-unlock.js
// 覆盖：QX 同步子集（Tier1 全分支）+ Surge 异步路径（真实地址解析 / key XOR 还原）+ 透传安全
const fs = require("fs");

const SRC = process.argv[2];
const code = fs.readFileSync(SRC, "utf-8");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// 与脚本内 encode3/decode3 对应：三重 base64（UTF-8）
const enc3 = (s) => {
  let x = Buffer.from(s, "utf8").toString("base64");
  x = Buffer.from(x, "utf8").toString("base64");
  return Buffer.from(x, "utf8").toString("base64");
};
const dec3 = (s) => {
  let x = Buffer.from(s, "base64").toString("utf8");
  x = Buffer.from(x, "base64").toString("utf8");
  return Buffer.from(x, "base64").toString("utf8");
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
  try {
    (0, eval)(code);
  } catch (e) {
    console.log(`[${name}] SCRIPT THREW:`, e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e.message);
    FAIL++; return;
  }
  for (let i = 0; i < 80 && !doneCalled; i++) await sleep(50);
  if (!doneCalled) { console.log(`[${name}] FAIL: $done not called in 4s`); FAIL++; return; }
  try {
    check(doneArg);
    PASS++;
  } catch (e) {
    console.log(`[${name}] CHECK FAIL:`, e.message);
    FAIL++;
  }
}

function bodyOf(done) {
  if (done.bodyBytes) return Buffer.from(done.bodyBytes).toString("utf8");
  return done.body;
}
function patchedData(done) {
  const raw = bodyOf(done);
  if (!raw) throw new Error("no body returned, keys=" + Object.keys(done));
  const j = JSON.parse(raw);
  return JSON.parse(dec3(j.data));
}

(async () => {
  const H = { "Content-Type": "application/json", "x-user-token": "tk123", "x-user-id": "88", pcver: "2" };

  // ---------- 1. banner/banner_list -> data 置 ENC_NULL ----------
  await runCase("banner置空",
    { url: "https://haijiao.com/api/banner/banner_list", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify([{ ad: 1 }])) }) },
    null,
    (done) => {
      const j = JSON.parse(bodyOf(done));
      if (j.data !== "WW01V2MySkJQVDA9") throw new Error("data != ENC_NULL, got " + j.data);
      console.log("[1.banner置空] PASS");
    });

  // ---------- 2. checkVideoCanPlay type>=2 -> 1 ----------
  await runCase("短视频试看解除",
    { url: "https://www.haijiao.com/api/video/checkVideoCanPlay?id=9", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify({ type: 3, message: "仅限VIP观看" })) }) },
    null,
    (done) => {
      const d = patchedData(done);
      if (d.type !== 1 || d.message !== "") throw new Error("type/message not patched: " + JSON.stringify(d));
      console.log("[2.短视频试看解除] PASS");
    });

  // ---------- 3. video-center detail 解锁（递归） ----------
  await runCase("视频中心解锁",
    { url: "https://haijiao.com/api/video-center/video/detail", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify({
        id: 1, access_type: 2, can_play: false, is_unlocked: false,
        rel: [{ id: 2, access_type: 3, can_play: false }] })) }) },
    null,
    (done) => {
      const d = patchedData(done);
      if (d.access_type !== 1 || d.can_play !== true || d.is_unlocked !== true) throw new Error("root not patched");
      if (d.rel[0].can_play !== true || d.rel[0].access_type !== 1) throw new Error("nested not patched");
      console.log("[3.视频中心解锁] PASS");
    });

  // ---------- 4. QX 模式 topic：VIP/付费伪造 + 图片还原 + sell-btn 清理 ----------
  const topicPlain = {
    node: { vipLimit: 1 },
    sale: { is_buy: false, buy_index: 0, amount: 100, money_type: 1 },
    currentUserPurchased: false,
    title: "测试帖",
    content: '<p><span class="sell-btn"><span>购买查看</span></span></p><p>免费段落</p>',
    attachments: [{ category: "images", id: 111 }, { category: "images", id: 222 }],
  };
  await runCase("QX·topic解锁",
    { url: "https://haijiao.com/api/topic/9527", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify(topicPlain)) }) },
    null,
    (done) => {
      const d = patchedData(done);
      if (d.node.vipLimit !== 0) throw new Error("vipLimit not scrubbed");
      if (d.sale.is_buy !== true || d.sale.buy_index !== 9999) throw new Error("sale not forged");
      if (d.currentUserPurchased !== true) throw new Error("currentUserPurchased not forged");
      if (d.content.indexOf('data-id="111"') === -1 || d.content.indexOf('data-id="222"') === -1) throw new Error("images not injected");
      if (d.content.indexOf("sell-btn") !== -1) throw new Error("sell-btn not removed");
      if (d.content.indexOf("此贴正文已被服务端隐藏") === -1) throw new Error("hidden notice missing");
      console.log("[4.QX·topic解锁] PASS");
    });

  // ---------- 5. user/current VIP 伪造 ----------
  await runCase("用户VIP伪造",
    { url: "https://haijiao.com/api/user/current", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify({ vip: 0, name: "x" })) }) },
    null,
    (done) => {
      const d = patchedData(done);
      if (d.vip !== 4) throw new Error("vip != 4, got " + d.vip);
      console.log("[5.用户VIP伪造] PASS");
    });

  // ---------- 6. 通用 vipLimit 清理（/api/video/123） ----------
  await runCase("通用vipLimit清理",
    { url: "https://haijiao.com/api/video/123", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify({ a: { vipLimit: 2 }, b: [{ vipLimit: 9 }] })) }) },
    null,
    (done) => {
      const d = patchedData(done);
      if (d.a.vipLimit !== 0 || d.b[0].vipLimit !== 0) throw new Error("vipLimit not scrubbed");
      console.log("[6.通用vipLimit清理] PASS");
    });

  // ---------- 7. 请求阶段：attachment POST 体改写（video_center -> 免费 topic） ----------
  await runCase("附件请求体改写",
    { url: "https://haijiao.com/api/attachment", method: "POST", headers: H,
      body: JSON.stringify({ id: 5, resource_type: "video_center", resource_id: 999 }) },
    null, null,
    (done) => {
      if (!done.body) throw new Error("no rewritten body");
      const j = JSON.parse(done.body);
      if (j.resource_type !== "topic" || j.resource_id !== 2174028) throw new Error("body not rewritten: " + done.body);
      console.log("[7.附件请求体改写] PASS");
    });

  // ---------- 8. 未登录 topic 透传 ----------
  await runCase("未登录透传",
    { url: "https://haijiao.com/api/topic/9527", method: "GET", headers: { "Content-Type": "application/json" } },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify(topicPlain)) }) },
    null,
    (done) => {
      if (done.body) throw new Error("should pass through without body");
      console.log("[8.未登录透传] PASS");
    });

  // ---------- 9. QX 模式：付费视频附件无法解析真实地址 -> 安全透传（不破坏） ----------
  await runCase("QX·附件预览透传",
    { url: "https://haijiao.com/api/attachment", method: "POST", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify({ id: 9, remoteUrl: "https://cdn.x/preview.mp4" })) }) },
    null,
    (done) => {
      if (done.body) throw new Error("QX mode should not patch preview attachment, got " + done.body);
      console.log("[9.QX·附件预览透传] PASS");
    });

  // ---------- 10. Surge 模式：视频帖真实地址解析 + 播放按钮注入 ----------
  const REAL_URL = "https://ts9.a1b2c3d4b5d6e7f8.top/v/real.m3u8";
  const surgeHC = {
    post: (req, cb) => {
      if (/\/api\/attachment/.test(req.url)) {
        const payload = JSON.stringify({ code: 1, data: enc3(JSON.stringify({ remoteUrl: REAL_URL, id: 77 })) });
        cb(null, { status: 200 }, Buffer.from(payload, "utf8"));
      } else cb(new Error("unexpected POST " + req.url), null, null);
    },
    get: (req, cb) => cb(new Error("unexpected GET " + req.url), null, null),
  };
  const topicVideoPlain = {
    title: "视频帖", currentUserPurchased: false,
    content: "<p>预览段落</p>",
    attachments: [{ category: "video", id: 77, remoteUrl: "preview", coverUrl: "cov.png", original_pic: "op.png" }],
  };
  await runCase("Surge·视频真实地址",
    { url: "https://haijiao.com/api/topic/666", method: "GET", headers: H },
    { status: 200, headers: {}, body: JSON.stringify({ code: 1, data: enc3(JSON.stringify(topicVideoPlain)) }) },
    { httpClient: surgeHC },
    (done) => {
      const d = patchedData(done);
      if (d.attachments[0].remoteUrl !== REAL_URL) throw new Error("remoteUrl not replaced: " + d.attachments[0].remoteUrl);
      if (d.content.indexOf("data-hj-play") === -1) throw new Error("play button not injected");
      if (d.content.indexOf(encodeURIComponent ? REAL_URL : REAL_URL) === -1 && d.content.indexOf(REAL_URL) === -1) throw new Error("real url not in content");
      console.log("[10.Surge·视频真实地址] PASS");
    });

  // ---------- 11. Surge 模式：key XOR 还原 ----------
  const KEY_URL = "https://ts9.a1b2c3d4b5d6e7f8.top/v/abc.key";
  const SEC_URL = "https://ts9.a1b2c3d4b5d6e7f8.top/v/abc.jpg";
  const fakeKey = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const secret = Buffer.from([0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00, 0xaa]);
  __persist["hj_keymap"] = JSON.stringify({ [KEY_URL]: SEC_URL });
  const xorHC = {
    get: (req, cb) => {
      if (req.url === SEC_URL) cb(null, { status: 200 }, secret);
      else cb(new Error("unexpected GET " + req.url), null, null);
    },
    post: (req, cb) => cb(new Error("unexpected POST"), null, null),
  };
  await runCase("Surge·key异或还原",
    { url: KEY_URL, method: "GET", headers: {} },
    { status: 200, headers: {}, bodyBytes: new Uint8Array(fakeKey) },
    { httpClient: xorHC },
    (done) => {
      if (!done.bodyBytes) throw new Error("no bodyBytes, keys=" + Object.keys(done));
      const out = Buffer.from(done.bodyBytes);
      if (out.length !== 16) throw new Error("bad key length " + out.length);
      for (let i = 0; i < 16; i++) if (out[i] !== (fakeKey[i] ^ secret[i])) throw new Error(`xor mismatch at ${i}`);
      console.log("[11.Surge·key异或还原] PASS");
    });

  // ---------- 12. 不匹配 URL 透传 ----------
  await runCase("不匹配透传",
    { url: "https://haijiao.com/api/other/thing", method: "GET", headers: H },
    { status: 200, headers: {}, body: "{}" },
    null,
    (done) => {
      if (done.body || done.bodyBytes) throw new Error("should pass through");
      console.log("[12.不匹配透传] PASS");
    });

  console.log(`\n========== ${PASS} PASS / ${FAIL} FAIL ==========`);
  process.exit(FAIL ? 1 : 0);
})();
