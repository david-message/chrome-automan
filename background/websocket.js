(function ($w) {
    'use strict';

    //TODO log
    var _noop = function () {
    };
    var logger = (typeof console === 'undefined') ? {
        log: _noop, debug: _noop, error: _noop, warn: _noop, info: _noop
    } : console;

    var socket = function (url, cbFun) {
        this.wsUrl = url;
        this.lockReconnect = false;//避免重复连接
        this.ws = null;
        this.receiveCallbackFun = cbFun;
        this.heartCheck = new socket.heartCheck(this);

        // this.connect();
    }

    socket.prototype = {
        connect: function () {
            try {
                this.ws = new WebSocket(this.wsUrl);
                // logger.log(this.ws);
                this._initEventHandle();
            } catch (e) {
                this.reconnect();
            }
        },
        _initEventHandle: function () {
            var socketObj = this;
            this.ws.onclose = function (e) {
                // logger.log("close", e);
                // this.reconnect();
            };
            this.ws.onerror = function (e) {
                logger.error("error", e);
                socketObj.reconnect();
            };
            this.ws.onopen = function () {
                // logger.log("open");
                //心跳检测重置
                socketObj.heartCheck.reset().start();
            };
            this.ws.onmessage = function (event) {
                //如果获取到消息，心跳检测重置
                //拿到任何消息都说明当前连接是正常的
                socketObj.heartCheck.reset().start();
                socketObj.receiveCallbackFun && socketObj.receiveCallbackFun(event);
            }
        },
        send: function (data, reTry) {
            //OPEN:1
            if (this.ws && this.ws.readyState == 1) {
                this.ws.send(data);
                // } else if (this.ws.readyState == 2) {//CLOSING:2
                // } else if (this.ws.readyState == 3) {//CLOSED:3
            } else if (reTry) {
                this.connect();
                this.ws.send(data);
            }
        },
        close: function (code, reason) {
            this.ws && this.ws.close(code, reason);
            this.lockReconnect = true;
            this.ws = null;
        },
        reconnect: function () {
            if (this.lockReconnect) return;
            this.lockReconnect = true;
            //没连接上会一直重连，设置延迟避免请求过多
            setTimeout(function () {
                this.connect();
                this.lockReconnect = false;
            }, 2000);
        }
    };

    //心跳检测
    socket.heartCheck = function (webSocket) {
        this.timeout = 60000;//60秒
        this.timeoutObj = null;
        this.serverTimeoutObj = null;
        this.ws = webSocket;
        this.sid = 0;
    };
    socket.heartCheck.prototype = {
        reset: function () {//收到服务器端数据后会重置
            clearTimeout(this.timeoutObj);
            clearTimeout(this.serverTimeoutObj);
            return this;
        },
        start: function () {
            var self = this;
            this.timeoutObj = setTimeout(function () {
                //这里发送一个心跳，后端收到后，返回一个心跳消息，onmessage拿到返回的心跳就说明连接正常
                var hb = {'type': 'HeartBeat'};
                hb.data = {'sid': self.sid++};
                self.ws.send(JSON.stringify(hb));
                self.serverTimeoutObj = setTimeout(function () {//如果超过一定时间还没重置，说明后端主动断开了
                    self.ws.close(3001, 'bye');//如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
                }, self.timeout)
            }, this.timeout)
        }
    }

    var server = {
        ws: null,
        retryCount: 0,
        newWS: function (url, recFun) {
            this.ws = new socket(url, recFun);
            this.ws.connect();
            return this;
        },
        sendMessage: function (message) {
            if (this.ws == null) {
                return false;
            }
            //TODO check data size
            try {
                this.ws.send(message, true);
                // logger.log("send success");
                this.retryCount = 0;
                return true;
            } catch (error) {
                logger.warn("send retry for "+error.toString());
                if (this.retryCount < 5) {
                    this.retryCount++;
                    this.sendMessage(message);//retry
                }
            }
        }
    };

    if (typeof $w['ws'] === "undefined") {
        $w['ws'] = server;
    }
    return server;
})(window);