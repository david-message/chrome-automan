(function ($w) {
    //TODO log
    var _noop = () => {
    };
    var logger = (typeof console === 'undefined') ? {
        log: _noop, debug: _noop, error: _noop, warn: _noop, info: _noop
    } : console;

    var notificationCount = 0;
    var fn = {
        notify: function (title, content) {
            var tempCount = String(notificationCount);
            notificationCount++;
            chrome.notifications.create(tempCount, {
                "type": "basic",
                "iconUrl": "/logo/icon_64.png",
                "title": title,
                "message": content
            });
            var t = setTimeout(function () {
                chrome.notifications.clear(tempCount);
                clearTimeout(t);
                t = null;
            }, 5000);
        },
        sendToContent: function (tabSelecter, message, callback) {
            chrome.tabs.query(tabSelecter || {active: true, currentWindow: true}, function (tabs) {
                // logger.log(tabs)
                tabs.forEach(function (tab) {
                    tab && tab.id != -1 && chrome.tabs.sendMessage(tab.id, message, function (response) {
                        callback && callback(response);
                    });
                })
            });
            // chrome.tabs.getSelected(function (tab) {});
        },
        extend: function (parentStruct, extStruct) {
            for (var prepo in parentStruct) {
                if (parentStruct.hasOwnProperty(prepo)) {
                    if (Object.getOwnPropertyDescriptor(parentStruct, prepo).get)
                        extStruct.__defineGetter__(prepo, parentStruct.__lookupGetter__(prepo));
                    else {
                        var pValue = parentStruct[prepo], pType = typeof pValue;
                        "undefined" != pType && (null === pValue ? extStruct[prepo] = pValue : "object" == pType ? (extStruct[prepo] = extStruct[prepo] || {},
                            this.extend(pValue, extStruct[prepo])) : "array" == pType ? (extStruct[prepo] = extStruct[prepo] || [],
                            this.extend(pValue, extStruct[prepo])) : extStruct[prepo] = pValue)
                    }
                }
            }
        }
    }

    // 监听来自content-script的消息(chrome.runtime.sendMessage)
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // console.log('from cs@BG:', request , sender, sendResponse);
        autoMan.tab.log(sender.tab.id, {wid: sender.tab.windowId, request: request});
        sendResponse && sendResponse('@BG:' + JSON.stringify(request));
    });


    if (typeof $w['autoMan'] === "undefined") {
        $w['autoMan'] = {}
    }

    var eid = chrome.extension.getURL("/");
    var exportData = {'common': fn, 'logger': logger, 'eid': eid};
    fn.extend(exportData, $w['autoMan']);
})(window);

//data
(function ($w) {
    var appData = (function () {
        var d = localStorage.getItem('appData');
        if (d == null) {
            return {
                server: '127.0.0.1:8088',
                showImage: true
            };
        } else {
            return JSON.parse(d);
        }
    })();

    var exportData = {
        'getData': function (path) {
            var keys = path.split(/\s*\.|>\s*/);
            var v = appData;
            for (var k = 0; k < keys.length; k++) {
                var key = keys[k];
                if (v[key] == null) {
                    return null;
                }
                v = v[key];
            }
            return v;
        }, 'update': function (path, data) {
            var keys = path.split(/\s*\.|>\s*/);
            var v = appData;
            for (var k = 0; k < keys.length - 1; k++) {
                var key = keys[k];
                if (v[key] == null) {
                    v[key] = {};
                }
                v = v[key];
            }
            if (data == null) {
                // delete v[keys[keys.length - 1]]
                v[keys[keys.length - 1]] = null;
            } else {
                v[keys[keys.length - 1]] = data;
            }
            localStorage.setItem('appData', JSON.stringify(appData));
        }
    };

    if (typeof $w['autoMan']['data'] === "undefined") {
        $w['autoMan']['data'] = {};
    }

    autoMan.common.extend(exportData, $w['autoMan']['data']);
})(window);

//tab data
(function ($w) {
    var tabData = {'winId': -1};
    var exportData = {
        log: function (tabId, data) {
            if (typeof tabData[tabId] === "undefined") {
                tabData[tabId] = [];
            }
            tabData[tabId].push(data);
            if (tabData[tabId].length > 1000) {//max size over clear
                tabData[tabId] = tabData[tabId].slice(tabData[tabId].length - 200);
            }
        },
        getLog: function (tabId) {
            var arr = tabData[tabId];
            return arr == null ? [] : arr;
        },
        remove: function (tabId) {
            delete tabData[tabId];
        },
        getActiveWinId: function () {
            return tabData['winId'];
        }
    };

    //windows
    chrome.windows.onCreated.addListener(function (win) {
        // console.log('windows.onCreated', arguments);
    });
    chrome.windows.onFocusChanged.addListener(function (winId) {
        // console.log('windows.onFocusChanged', arguments);
        tabData['winId'] = winId;
    });
    chrome.windows.onRemoved.addListener(function (winId) {
        // console.log('windows.onRemoved', arguments);
    });

    // chrome.tabs.create({} , function (){});
    //tabs
    chrome.tabs.onCreated.addListener(function (tab) {
        // console.log('tabs.onCreated', arguments);
        exportData.log(tab.id, {wid: tab.windowId, status: "create"});
    });
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        // console.log('tabs.onUpdated', arguments);
        exportData.log(tabId, {wid: tab.windowId, status: changeInfo.status});
        chrome.browserAction.setBadgeText({text: exportData.getLog(tab.id).length.toString(), tabId: tab.id});
        if ('complete' == changeInfo.status) {
            autoMan.tabs.matchTab(tab);
        }
    });
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        // console.log('tabs.onRemoved', arguments);
        // exportData.log(tabId,{wid:removeInfo.windowId});
        exportData.remove(tabId);
    });

    if (typeof $w['autoMan']['tab'] === "undefined") {
        $w['autoMan']['tab'] = {};
    }

    autoMan.common.extend(exportData, $w['autoMan']['tab']);
})(window);