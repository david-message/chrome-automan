(function ($w) {
    'use strict';
    var __name__ = 'sdc';
    if (typeof $w[__name__] != 'undefined') {
        logger.log(__name__ + ' has been already exist.');
        return;
    }

    var sdc = function (serverName) {
        this.serv = new sdc.serv(serverName);
    }

    sdc.serv = function (serverName) {
        this.onError = null;
        this.onDone = null;
        this.sequenceId = 0;
        this._cbQueue = {};
        this.servHost = "ws://" + serverName + "/ws";

        this.timeOutSeconds = 3000;//3 secends
        //timer:scan request timeout
        var self = this;
        var timerHandler = null;
        var tFun = function () {
            if (timerHandler != null) {
                clearTimeout(timerHandler);
            }
            var curTime = new Date().getTime();
            for (var _sid in self._cbQueue) {
                if (_sid.charAt(0) == 's') {
                    var o = self._cbQueue[_sid];
                    var ts = o['time'];
                    if (curTime - ts > self.timeOutSeconds) {//timeout
                        var sid = o['sid'];
                        self.onError && self.onError(sid, self._cbQueue[_sid], self._cbQueue[sid]);
                        delete self._cbQueue[_sid];
                        delete self._cbQueue[sid];
                    }
                }
            }
            timerHandler = setTimeout(tFun, self.timeOutSeconds);
        };
        timerHandler = setTimeout(tFun, this.timeOutSeconds);

        this.init();
    };

    sdc.serv.prototype = {
        init: function () {
            var self = this;
            this.webSocket = ws.newWS(this.servHost, function (event) {
                self._remoteCallback.call(this, event, self);
            });
        },
        _addQueue: function (arg) {//save request
            var _sid = arg['data']['_sid'];
            this._cbQueue[_sid] = {'data': arg, 'time': new Date().getTime()};
        },
        _remoteCallback: function (evt, self) {
            var json = JSON.parse(evt['data']);
            if ("type" in json) {//save response
                if (json['type'] == 'HeartBeat') {//ignore HeartBeat
                    return;
                }
                if (!json['_async'] || typeof json['wsCli'] === "string") {
                    self.onDone && self.onDone(json);
                    return;
                }
            }

            if ("data" in json) {//save response
                var _sid = json['data']['_sid'];
                var sid = json['data']['sid'];
                self._cbQueue[_sid]['sid'] = sid;
                self._cbQueue[sid] = json;
            } else if ("args" in json) {//remove request & response
                var sid = json['id'];
                var _sid = self._cbQueue[sid]['data']['_sid'];

                self.onDone && self.onDone(_sid, self._cbQueue[_sid], self._cbQueue[sid], json);
                delete self._cbQueue[_sid];
                delete self._cbQueue[sid];
            }
        },
        send: function (data) {
            var m = {
                'type': 'lightApp',
                'data': {
                    '_sid': 's' + this.sequenceId++
                }
            };

            //copy
            for (var k in data) {
                m.data[k] = data[k];
            }

            data['_async'] && this._addQueue(m);
            this.webSocket.sendMessage(JSON.stringify(m));
        }
    }

    // export jsmind
    if (typeof  $w[__name__] == 'undefined') {
        $w[__name__] = sdc;
    }
})(window);