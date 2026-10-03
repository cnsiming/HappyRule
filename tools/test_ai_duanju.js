// 网络重写版脚本的 Node 冒烟测试：模拟 QX 沙箱（串行执行，避免异步 $done 串扰）
const fs = require("fs");
const crypto = require("crypto");

const SRC = process.argv[2];
const code = fs.readFileSync(SRC, "utf-8");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// 模拟 QX 持久化存储（跨 eval 保持，验证 drama/play 的 ctx 缓存链路）
const __persist = {};
global.$persistentStore = {
  read: (k) => (k in __persist ? __persist[k] : null),
  write: (v, k) => { __persist[k] = String(v); return true; },
};

async function runCase(name, request, response, check) {
  global.$request = request;
  if (response) global.$response = response; else delete global.$response;
  let doneArg = undefined, doneCalled = false;
  global.$done = (o) => { doneCalled = true; doneArg = o; };
  delete global.window; delete global.Cloudflare;
  try {
    (0, eval)(code);
  } catch (e) {
    console.log(`[${name}] SCRIPT THREW:`, e.message);
    process.exitCode = 1;
    return;
  }
  // Sr 异步返回 Promise，轮询等待 $done（上限 3 秒）
  for (let i = 0; i < 60 && !doneCalled; i++) await sleep(50);
  if (!doneCalled) { console.log(`[${name}] FAIL: $done not called in 3s`); process.exitCode = 1; return; }
  try {
    check(doneArg);
  } catch (e) {
    console.log(`[${name}] CHECK FAIL:`, e.message);
    process.exitCode = 1;
  }
}

function bodyOf(done) {
  if (done.bodyBytes) return Buffer.from(done.bodyBytes).toString("utf8");
  return done.body;
}

(async () => {
  // ---------- 用例 1：明文 JSON，/api/user/info ----------
  await runCase("user/info 明文VIP",
    { url: "https://cocoaview.cc/api/user/info", method: "GET", headers: { requestid: "r1", devicetype: "web" } },
    { status: 200, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "y", data: { is_vip: "n", is_up: "n", balance: "0", level: "1", play_num: "0/10", nickname: "abc", group_name: "", group_end_time: "" } }) },
    (done) => {
      const raw = bodyOf(done);
      if (!raw) throw new Error("no body returned, keys=" + Object.keys(done));
      const j = JSON.parse(raw);
      console.log("[user/info 明文VIP] body =", raw.slice(0, 160));
      if (j.data.is_vip !== "y") throw new Error("is_vip not patched");
      if (j.data.balance !== "999999") throw new Error("balance not patched");
      if (j.data.group_end_time !== "2099-12-31") throw new Error("group_end_time not patched");
      console.log("[user/info 明文VIP] PASS");
    });

  // ---------- 用例 2：AES 加密，/api/ad/policy ----------
  const PASSWORDS = { web: "7961beb44246e3012ce228d6b5ced05a" };
  function deriveKey(rid) {
    const hex = rid.replace(/-/g, "");
    return crypto.createHmac("sha256", Buffer.from(PASSWORDS.web, "utf8")).update(Buffer.from(hex, "hex")).digest();
  }
  const rid = "abcd-1234-dead-beef";
  const key = deriveKey(rid);
  const iv = crypto.randomBytes(16);
  const plain = JSON.stringify({ status: "y", data: { no_ad: false, pre_roll_ok: true, popup_ok: true, pause_ok: true, insert_every: 6, pre_roll_every_vip: 3 } });
  // 真实格式：IV || AES-CBC( gzip(JSON) )
  const payload = require("zlib").gzipSync(Buffer.from(plain, "utf8"));
  const ct = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encBody = new Uint8Array(Buffer.concat([iv, ct.update(payload), ct.final()]));

  await runCase("ad/policy 加密去广告",
    { url: "https://www.huangguoai.com/api/ad/policy", method: "GET", headers: { requestId: rid, deviceType: "web" } },
    { status: 200, headers: { "Content-Type": "application/octet-stream" }, bodyBytes: encBody },
    (done) => {
      if (!done.bodyBytes) throw new Error("no bodyBytes returned: " + JSON.stringify(Object.keys(done)));
      const raw = Buffer.from(done.bodyBytes);
      const outIv = raw.slice(0, 16), outCt = raw.slice(16);
      const d = crypto.createDecipheriv("aes-256-cbc", key, outIv);
      const pt = JSON.parse(require("zlib").gunzipSync(Buffer.concat([d.update(outCt), d.final()])).toString("utf8"));
      console.log("[ad/policy 加密去广告] decrypted =", JSON.stringify(pt).slice(0, 200));
      if (pt.data.no_ad !== true) throw new Error("no_ad not patched");
      if (pt.data.insert_every !== 0) throw new Error("insert_every not patched");
      if (pt.data.pre_roll_every_vip !== 0) throw new Error("pre_roll_every_vip not patched");
      console.log("[ad/policy 加密去广告] PASS");
    });

  // ---------- 用例 3：非目标接口透传 ----------
  await runCase("非目标接口透传",
    { url: "https://cocoaview.cc/api/other/thing", method: "GET", headers: {} },
    { status: 200, headers: {}, body: "{\"a\":1}" },
    (done) => {
      if (done.body !== undefined || done.bodyBytes !== undefined) throw new Error("should pass through unchanged");
      console.log("[非目标接口透传] PASS");
    });

  // ---------- 用例 4：请求阶段（播放请求体缓存，不崩溃即可） ----------
  await runCase("drama/play 请求阶段",
    { url: "https://cocoaview.cc/api/drama/play", method: "POST", headers: { requestid: rid, devicetype: "web" },
      body: JSON.stringify({ id: 88, seq: 3, drama_id: 88 }) },
    null,
    (done) => {
      console.log("[drama/play 请求阶段] done =", JSON.stringify(done));
      console.log("[drama/play 请求阶段] PASS");
    });

  // ---------- 用例 5：伪造未购买错误响应（813004 免费线路构造） ----------
  // 请求阶段先缓存 ctx（带 status 字段的明文请求体可被解析）
  await runCase("drama/play 请求阶段(带status)",
    { url: "https://cocoaview.cc/api/drama/play", method: "POST", headers: { requestid: rid, devicetype: "web" },
      body: JSON.stringify({ status: "y", code: 0, data: { id: 88, seq: 3, drama_id: 88 } }) },
    null,
    () => { console.log("[drama/play 请求阶段(带status)] PASS"); });

  await runCase("drama/play 813004 伪造免费线路",
    { url: "https://cocoaview.cc/api/drama/play", method: "POST", headers: { requestid: rid, devicetype: "web" } },
    { status: 200, headers: {}, body: JSON.stringify({ status: "n", errorCode: 813004, msg: "未购买" }) },
    (done) => {
      const raw = bodyOf(done);
      console.log("[drama/play 813004] body =", raw && raw.slice(0, 200));
      const j = JSON.parse(raw);
      if (j.status !== "y") throw new Error("status not forged");
      if (!j.data || !/hls\/88\/3\/play\.m3u8/.test(j.data.m3u8 || "")) throw new Error("free m3u8 not forged: " + JSON.stringify(j.data));
      console.log("[drama/play 813004 伪造免费线路] PASS");
    });

  console.log("ALL DONE");
})();
