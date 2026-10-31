// Bilibili splash schedule test v20261031.4. No file deletion or outbound requests.
// Existing-field changes reference kokoryh/Sparkle src/script/bilibili/json/handler.ts.
(function () {
    var result = {};
    try {
        var pattern = /^https?:\/\/app\.bilibili\.com\/x\/v2\/(?:splash\/(?:list|show|event\/list2|brand\/list)|index\/splash)(?:\?|$)/;
        if (pattern.test($request.url)) {
            var path = $request.url.split("?")[0].replace(/^https?:\/\/app\.bilibili\.com/, "");
            if (typeof $response.body === "string") {
                var response = JSON.parse($response.body);
                var data = response && response.data;
                if (data && typeof data === "object" && !Array.isArray(data) &&
                    (response.code == null || String(response.code) === "0")) {
                    var changed = 0;
                    ["account", "event_list", "preload", "show"].forEach(function (key) {
                        if (Object.prototype.hasOwnProperty.call(data, key)) {
                            delete data[key];
                            changed++;
                        }
                    });
                    var timing = { max_time: 0, min_interval: 31536000, pull_interval: 31536000 };
                    Object.keys(timing).forEach(function (key) {
                        if (typeof data[key] === "number" && data[key] !== timing[key]) {
                            data[key] = timing[key];
                            changed++;
                        }
                    });
                    var itemFields = 0;
                    var listCount = Array.isArray(data.list) ? data.list.length : null;
                    var itemPatch = { duration: 0, begin_time: 2524579200, end_time: 2524665599, enable_pre_download: false };
                    if (Array.isArray(data.list)) data.list.forEach(function (item) {
                        if (!item || typeof item !== "object" || Array.isArray(item)) return;
                        Object.keys(itemPatch).forEach(function (key) {
                            if (Object.prototype.hasOwnProperty.call(item, key) && item[key] !== itemPatch[key]) {
                                item[key] = itemPatch[key];
                                itemFields++;
                            }
                        });
                    });
                    changed += itemFields;
                    if (changed) result.body = JSON.stringify(response);
                    console.log("[BiliSplashScheduleTest] v20261031.4 path=" + path + " changed=" + changed + " list_items=" + listCount + " item_fields=" + itemFields);
                } else {
                    console.log("[BiliSplashScheduleTest] v20261031.4 response-not-rewritten");
                }
            } else {
                console.log("[BiliSplashScheduleTest] v20261031.4 body-unavailable");
            }
        }
    } catch (error) {
        console.log("[BiliSplashScheduleTest] v20261031.4 parse-or-runtime-error");
    }
    $done(result);
})();
