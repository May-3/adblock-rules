const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "..", "scripts", "bilibili-splash.js"), "utf8");
const marker = "PRIVATE_FIXTURE_VALUE";
let cases = 0;
function run(url, body) {
    let calls = 0, result;
    const logs = [];
    const request = { url, headers: { Authorization: marker } };
    const response = { body, status: 200 };
    const before = JSON.stringify({ request, response });
    vm.runInNewContext(source, {
        $request: request, $response: response,
        $done(value) { calls++; result = value; },
        console: { log(value) { logs.push(String(value)); } }
    }, { timeout: 1000 });
    assert.equal(calls, 1);
    assert.equal(JSON.stringify({ request, response }), before);
    assert(!logs.join("\n").includes(marker));
    cases++;
    return { result: JSON.parse(JSON.stringify(result)), logs };
}
const base = "https://app.bilibili.com/x/v2/";
const endpoints = ["splash/list", "splash/show", "splash/event/list2", "splash/brand/list", "index/splash"];
const fixture = { code: 0, message: marker, ttl: 1, data: {
    show: [marker], event_list: [], preload: {}, account: {}, max_time: 5, min_interval: 60, pull_interval: 60,
    list: [{ id: marker, title: marker, duration: 5, begin_time: 1, end_time: 2, enable_pre_download: true },
        { id: "keep-id-only" }, null, "keep-unknown-entry"], extra: { token: marker }
} };
const expected = { code: 0, message: marker, ttl: 1, data: {
    max_time: 0, min_interval: 31536000, pull_interval: 31536000,
    list: [{ id: marker, title: marker, duration: 0, begin_time: 2524579200, end_time: 2524665599, enable_pre_download: false },
        { id: "keep-id-only" }, null, "keep-unknown-entry"], extra: { token: marker }
} };
for (const endpoint of endpoints) {
    const output = run(base + endpoint + "?token=" + marker, JSON.stringify(fixture));
    assert.deepEqual(JSON.parse(output.result.body), expected);
    assert(output.logs[0].includes("list_items=4 item_fields=4"));
    assert.deepEqual(run(base + endpoint, JSON.stringify(expected)).result, {});
}
for (const size of [21, 76]) {
    const list = Array.from({ length: size }, (_, id) => ({ id, duration: 5, begin_time: 1, end_time: 2, enable_pre_download: true }));
    const output = run(base + "splash/list", JSON.stringify({ code: 0, data: { list } }));
    const rewritten = JSON.parse(output.result.body).data.list;
    assert.deepEqual(rewritten.map(item => item.id), list.map(item => item.id));
    assert(output.logs[0].includes(`list_items=${size} item_fields=${4 * size}`));
}
for (const body of [undefined, "", "invalid json", "null", "[]", '{"code":-101,"data":{"show":[1]}}',
    '{"code":0,"data":[]}', '{"code":0}', '{"code":0,"data":{"list":[]}}', '{"code":0,"data":{"list":[{"id":1}]}}']) {
    assert.deepEqual(run(base + "splash/list", body).result, {});
}
for (const url of [base + "splash/list/other", base + "splash/listing", base + "feed/index",
    "https://app.bilibili.com.evil.invalid/x/v2/splash/list", "https://example.invalid/x/v2/splash/list"]) {
    assert.deepEqual(run(url, JSON.stringify(fixture)).result, {});
}
assert(!/\$(?:httpClient|task)\b|\b(?:fetch|XMLHttpRequest)\s*\(/.test(source));
const moduleText = fs.readFileSync(path.join(__dirname, "..", "merged-skip-ads.module"), "utf8");
const scriptLine = moduleText.split(/\r?\n/).find(line => line.startsWith("BiliSplashSchedule ="));
assert(scriptLine);
const pattern = new RegExp(scriptLine.match(/pattern=(.*?), script-path=/)[1]);
for (const endpoint of endpoints) assert(pattern.test(base + endpoint + "?test=1"));
assert(!pattern.test(base + "feed/index"));
assert(moduleText.split(/\r?\n/).some(line => line.startsWith("hostname =") && line.split("=", 2)[1].split(",").map(host => host.trim()).includes("app.bilibili.com")));
assert(scriptLine.includes("https://raw.githubusercontent.com/May-3/adblock-rules/main/scripts/bilibili-splash.js?v=20261031.4"));
console.log(`PASS: ${cases} response cases; retained IDs and list lengths; module scope and version verified.`);

// No legacy handler may reject or rewrite the verified splash responses first.
let section = "";
for (const raw of moduleText.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^\[.*\]$/.test(line)) { section = line; continue; }
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    if (!["[URL Rewrite]", "[Body Rewrite]", "[Map Local]"].includes(section)) continue;
    if (!line.replace(/\\/g, "").includes("app.bilibili.com")) continue;
    const parts = line.split(/\s+/);
    const legacy = new RegExp(parts[section === "[Body Rewrite]" ? 1 : 0]);
    for (const endpoint of endpoints) {
        assert(!legacy.test(base + endpoint + "?test=1"), `Conflicting ${section}: ${line}`);
        assert(!legacy.test(base + endpoint), `Conflicting ${section}: ${line}`);
    }
}
assert.equal(moduleText.split(/\r?\n/).filter(line => line.startsWith("BiliSplashSchedule =")).length, 1);
console.log("PASS: integrated module has one public script entry and no legacy splash rewrite conflicts.");
