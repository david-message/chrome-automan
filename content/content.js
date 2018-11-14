(function (p) {
    // 向页面注入JS
    function injectJs(jsPath) {
        var temp = document.createElement('script');
        temp.onload = function () {
            // 放在页面不好看，执行完后移除掉
            this.parentNode.removeChild(temp);
        };
        // 获得的地址类似：chrome-extension://edhipabdmodnbejacmmlaggpanjopico/inject.js
        temp.setAttribute('type', 'text/javascript');
        temp.src = chrome.runtime.getURL(jsPath);

        document.head.appendChild(temp);
    }

    // 向页面注入JS
    function injectJsContent(id, content) {
        var e = document.getElementById(id);
        if (e != null) {
            e.remove();
        }
        var temp = document.createElement('script');
        temp.onload = function () {
            // 放在页面不好看，执行完后移除掉
            this.parentNode.removeChild(temp);
            console.log('inject>' + id);
        };
        // 获得的地址类似：chrome-extension://edhipabdmodnbejacmmlaggpanjopico/inject.js
        temp.setAttribute('type', 'text/javascript');
        temp.id = id;
        temp.text = content;

        document.head.appendChild(temp);
    }

    var lf = (t) => {
        return function () {
            chrome.runtime.sendMessage({
                'type': 'csLog:' + t,
                'data': Array.prototype.slice.call(arguments)
                //JSON.stringify(Array.prototype.slice.call(arguments).slice(1))
            });
        }
    };

    var logger = {//(typeof console === 'undefined') ?
        'log': lf('log'), 'debug': lf('debug'), 'error': lf('error'), 'warn': lf('warn'), 'info': lf('info')
    };//: console
    for (var k in logger) {
        console[k] = logger[k];
    }

    function domOnReady(cbFun) {
        var delayedFun = () => {//延时执行
            var t = setTimeout(() => {
                clearTimeout(t);
                if (cbFun) {
                    if (typeof cbFun == 'function') {
                        cbFun();
                    } else {
                        cbFun.forEach((f) => {
                            f && f();
                        });
                    }
                }
            }, 1);
        };

        var d = function () {
            "prerender" !== document.webkitVisibilityState &&
            (document.removeEventListener("webkitvisibilitychange", d, !1), delayedFun())
        };
        "prerender" !== document.webkitVisibilityState ? delayedFun() : document.addEventListener("webkitvisibilitychange", d, !1)
    }

    (function () {
        domOnReady([() => {
            // var origin = location.protocol + '//' + location.host;
            // var eid = chrome.extension.getURL("/");
            // var eDomain = eid.substr(0, eid.length - 1);

            injectJs('inject/inject.js');
        }]);
    })();

    if (window == window.top) {// Not a top window
        //receive from injected-script(window.postMessage) ,and send to bg
        window.addEventListener("message", function (e) {
            //转发给bg
            chrome.runtime.sendMessage({'type': 'RD to bg', 'data': e.data});
        }, false);
    }

    //receive from bg or popups
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        console.log(sender.tab ? "from a panel script:" + sender.tab.url : "from the extension", arguments);

        // request.cmd &&
        if (request.cmd == 'js') {
            //
            // eval(request.value);
            injectJsContent('injectjs-123', request.value);
        } else {
            alert(JSON.stringify(request));
        }
        sendResponse && sendResponse('Response@Content');
    });

    if (typeof p['content'] === "undefined") {
        p['content'] = {};
        // p.onerror = lf('sysErr');
        console.log('content inject done.');
    }
})(window);