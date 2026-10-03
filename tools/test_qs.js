// 妻社(QS)解锁·网络重写版 的 Node 冒烟测试
// 用法: node tools/test_qs.js Rewrite/qx/qs-unlock.js
const fs = require("fs");
const SRC = process.argv[2];
const code = fs.readFileSync(SRC, "utf-8");
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const __persist = {};
global.$persistentStore = {
  read: (k) => (k in __persist ? __persist[k] : null),
  write: (v, k) => { __persist[k] = String(v); return true; },
};

let PASS = 0, FAIL = 0;
async function runCase(name, request, response, check) {
  global.$request = request;
  if (response) global.$response = response; else delete global.$response;
  let doneArg = undefined, doneCalled = false;
  global.$done = (o) => { doneCalled = true; doneArg = o; };
  try { (0, eval)(code); }
  catch (e) { console.log(`[${name}] SCRIPT THREW:`, e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e.message); FAIL++; return; }
  for (let i = 0; i < 40 && !doneCalled; i++) await sleep(50);
  if (!doneCalled) { console.log(`[${name}] FAIL: $done not called`); FAIL++; return; }
  try { check(doneArg); PASS++; }
  catch (e) { console.log(`[${name}] CHECK FAIL:`, e.message); FAIL++; }
}
const HEX24 = /^[0-9a-f]{24}$/;

(async () => {
  const BASE = "https://qishe1.com/source/plugin/qsts_app/index.php";

  // 1. user.getInfo -> VIP 用户组伪造
  await runCase("用户VIP伪造",
    { url: BASE + "/user.getInfo", method: "GET", headers: {} },
    { status: 200, headers: {}, body: JSON.stringify({ code: 0, data: { member: { username: "abc", groupid: "1", groupexpiry: "0", grouptitle: "普通", credits: "5", freeze: 1 } } }) },
    (done) => {
      const d = JSON.parse(done.body).data.member;
      if (d.groupid !== "32") throw new Error("groupid != 32: " + d.groupid);
      if (d.grouptitle.indexOf("终身VIP") === -1) throw new Error("grouptitle not forged");
      if (d.credits !== 999999) throw new Error("credits not forged");
      if (d.freeze !== 0) throw new Error("freeze not cleared");
      console.log("[1.用户VIP伪造] PASS");
    });

  // 2. postlist.getThreadView -> 帖子/附件/apptag 解锁 + 板块权限清除
  const threadPlain = {
    thread: { tid: 1, fid: 2, price: "9", readperm: "100", payed: 0, attachData: { data: [{ price: "3", readperm: "5", isreadperm: 1, url: "u1" }] },
      message: '前{{apptag=video}}{"price":"4","readperm":"8","url":"v1"}{{/apptag}}后' },
    forum: { viewperm: "1", postperm: "2", replyperm: "3", getattachperm: "4" },
    userGroup: { groupid: "1", readaccess: "10" },
  };
  await runCase("帖子付费解锁",
    { url: BASE + "/postlist.getThreadView", method: "GET", headers: {} },
    { status: 200, headers: {}, body: JSON.stringify({ code: 0, data: threadPlain }) },
    (done) => {
      const d = JSON.parse(done.body).data;
      if (d.thread.price !== "0" || d.thread.readperm !== "0" || d.thread.payed !== 1) throw new Error("thread not unlocked: " + JSON.stringify(d.thread));
      const at = d.thread.attachData.data[0];
      if (at.price !== "0" || at.payed !== 1 || at.isreadperm !== 0 || !at.defurl) throw new Error("attach not unlocked");
      if (d.thread.message.indexOf('"price":"0"') === -1) throw new Error("apptag not unlocked: " + d.thread.message);
      if (d.forum.viewperm !== "" || d.forum.postperm !== "") throw new Error("forum perm not cleared");
      if (d.userGroup.groupid !== "32") throw new Error("userGroup not upgraded");
      console.log("[2.帖子付费解锁] PASS");
    });

  // 3. config.init -> 广告配置清除
  await runCase("广告配置清除",
    { url: BASE + "/config.init", method: "GET", headers: {} },
    { status: 200, headers: {}, body: JSON.stringify({ code: 0, data: { config: { pluginSet: { openVideoVip: "1", videoTime: "30", gads_show_type: "1", gads_req_url: "http://ad.x", app_show_adset: "1" } } } }) },
    (done) => {
      const p = JSON.parse(done.body).data.config.pluginSet;
      if (p.openVideoVip !== "0") throw new Error("openVideoVip not cleared");
      if (p.gads_req_url !== "") throw new Error("gads_req_url not cleared");
      if (p.app_show_adset !== "0") throw new Error("app_show_adset not cleared");
      console.log("[3.广告配置清除] PASS");
    });

  // 4. 未知接口（deepModify 通用分支）
  await runCase("deepModify通用",
    { url: "https://qishe1.com/mserver/other.thing", method: "GET", headers: {} },
    { status: 200, headers: {}, body: JSON.stringify({ code: 0, data: { list: [{ tid: 9, fid: 3, price: "5", readperm: "1" }], plate: { fid: 3, viewperm: "9", postperm: "8" } } }) },
    (done) => {
      const d = JSON.parse(done.body).data;
      if (d.list[0].price !== "0" || d.list[0].payed !== 1) throw new Error("post not unlocked");
      if (d.plate.viewperm !== "") throw new Error("viewperm not cleared");
      console.log("[4.deepModify通用] PASS");
    });

  // 5. 搜索请求 deviceid 轮换（2 次额度，跨 eval 持久化）
  const SEARCH = BASE + "/cearch.search";
  const mkSearchReq = () => ({ url: SEARCH, method: "POST", headers: { "Content-Type": "application/json", deviceid: "originid00000000000001" } });
  let ids = [];
  for (let n = 0; n < 3; n++) {
    await runCase("搜索deviceid轮换#" + (n + 1), mkSearchReq(), null, (done) => {
      if (!done.headers) throw new Error("no headers returned");
      const id = done.headers.deviceid;
      if (!HEX24.test(id)) throw new Error("bad deviceid: " + id);
      ids.push(id);
      if (done.headers["Content-Type"] !== "application/json") throw new Error("other header lost");
    });
  }
  try {
    if (ids[0] !== ids[1]) throw new Error("1st/2nd should share id");
    if (ids[1] === ids[2]) throw new Error("3rd should rotate to new id");
    console.log("[5.搜索deviceid轮换] PASS");
    PASS++;
  } catch (e) { console.log("[5.搜索deviceid轮换] CHECK FAIL:", e.message); FAIL++; }

  // 6. 搜索限流响应 -> 标记耗尽（下一个请求换新 id），响应透传
  const before = ids[2];
  await runCase("搜索限流标记",
    { url: SEARCH, method: "POST", headers: {} },
    { status: 200, headers: {}, body: JSON.stringify({ code: 20011, msg: "您今日免费搜索次数已经用完，成为终身vip" }) },
    (done) => {
      if (done.body) throw new Error("limit response should pass through unchanged");
    });
  await runCase("耗尽后轮换",
    mkSearchReq(), null,
    (done) => {
      if (done.headers.deviceid === before) throw new Error("deviceid should rotate after exhausted");
      console.log("[6.搜索限流标记+耗尽后轮换] PASS");
    });

  // 7. 非 API 地址透传
  await runCase("非API透传",
    { url: "https://qishe1.com/forum.php", method: "GET", headers: {} },
    { status: 200, headers: {}, body: "{}" },
    (done) => { if (done.body) throw new Error("should pass through"); console.log("[7.非API透传] PASS"); });

  // 8. HTML/数组响应透传
  await runCase("HTML透传",
    { url: "https://qishe1.com/mserver/x.y", method: "GET", headers: {} },
    { status: 200, headers: {}, body: "<html>hi</html>" },
    (done) => { if (done.body) throw new Error("html should pass through"); console.log("[8.HTML透传] PASS"); });

  console.log(`\n========== ${PASS} PASS / ${FAIL} FAIL ==========`);
  process.exit(FAIL ? 1 : 0);
})();
