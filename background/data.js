(function ($w) {
        var actData = {domain: {}, url: {}, regex: {}};

        var dataServer;

        function connectServer() {
            dataServer = new sdc(autoMan.data.getData('server'));
            dataServer.serv.onDone = function (data, req, resp, rt) {
                console.log(arguments);
            };

            dataServer.serv.onError = function (id, req, resp) {
                console.error(arguments);
            };
        }

        connectServer();

        // web请求监听，最后一个参数表示阻塞式，需单独声明权限：webRequestBlocking
        chrome.webRequest.onBeforeRequest.addListener(function (details) {
            // cancel 表示取消本次请求
            if (!autoMan.data.getData('showImage') && details.type == 'image') {
                return {cancel: true};
            }
            if (details.type == 'media') {
                autoMan.common.notify('Media', 'mediaUrl:' + details.url)
            }
        }, {urls: ["<all_urls>"]}, ["blocking"]);

        var exportData = {
            reConnectServer: function () {
                connectServer();
            },
            matchTab: function (tab) {
                var arr = new RegExp('(http(s)?)://([^/]+)(/)?.*').exec(tab.url);
                if (arr != null) {
                    var data = {domain: arr[3].toLocaleLowerCase(), protocol: arr[1], url: tab.url, title: tab.title};
                    var rt = autoMan.tabs.getMatch(actData, data);
                    if (rt != null) {
                        var queryTab = {windowId: tab.windowId, index: tab.index};
                        for (var i = 0; i < rt.length; i++) {
                            autoMan.common.sendToContent(queryTab, {
                                cmd: 'js',
                                value: rt[i]
                            }, function () {
                                autoMan.logger.log('sendContent(js) to:' + JSON.stringify(queryTab), arguments);
                            });
                        }
                    }
                }
            },
            updateData: function (type, target, content) {
                if (content != null) {
                    actData[type][target] = content;
                } else {
                    delete actData[type][target];
                }
            }
        };

        if (typeof $w['autoMan']['tabs'] === "undefined") {
            $w['autoMan']['tabs'] = {};
        }

        autoMan.common.extend(exportData, $w['autoMan']['tabs']);

        //TODO init
        window.onload = function () {
            var th = setTimeout(function () {
                clearTimeout(th);

                dataServer.serv.send({'_act': 0, 'sName': 'b.script', 'sArgs': {i: 123}});
            }, 10);
        };
    }
)(window);

//match logic
(function ($w) {
    var exportData = {
        getMatchDomain: function (data, target) {
            if (data.domain.hasOwnProperty(target.domain)) {
                return data.domain[target.domain];
            }
            return null;
        },
        getMatchUrl: function (data, target) {
            var u;
            var q = target.url.indexOf('?');
            if (q > 0) {
                u = target.url.substr(0, q);
            } else {
                q = target.url.indexOf('#');
                u = q > 0 ? target.url.substr(0, q) : target.url;
            }
            if (data.url.hasOwnProperty(u)) {
                return data.url[u];
            }
            return null;
        },
        getMatchRegex: function (data, target) {
            var rt = [];
            for (var r in data.regex) {
                if (target.url.match(r) != null) {
                    rt.push(data.regex[r]);
                }
            }
            return rt.length == 0 ? null : rt;
        },
        getMatch: function (data, target) {
            var rt = [];
            var d = exportData.getMatchDomain(data, target);
            if (d != null) {
                rt.push(d);
            }

            var u = exportData.getMatchUrl(data, target);
            if (u != null) {
                rt.push(u);
            }

            var r = exportData.getMatchRegex(data, target);
            if (r != null) {
                rt.concat(r);
            }
            return rt.length == 0 ? null : rt;
        }
    };

    if (typeof $w['autoMan']['tabs'] === "undefined") {
        $w['autoMan']['tabs'] = {};
    }

    autoMan.common.extend(exportData, $w['autoMan']['tabs']);
})(window);

