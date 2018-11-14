var tabData = {wid: -1, id: 0, log: []};
var bg = chrome.extension.getBackgroundPage();

// function sendToContent(data) {
//     bg.sendContent(data || {cmd: 'test', value: '你好，我是popup！'}, function () {
//         // $('#action').append($('<div>' + JSON.stringify(arguments) + '</div>'));
//         console.log('sendToContent done.', JSON.stringify(arguments));
//     });
// }

$(document).ready(() => {
    // window.sendMessage = function (a, d) {
    //     console.log('action.sendMessage', arguments)
    //     a.origin = "action";
    //     rea.extension.sendMessage(a, d)
    // };

    // var bg = chrome.extension.getBackgroundPage();
    // $('#action').append($('<h5>' + bg.getCount() + '</h5>'));
    //
    // bg.sendContent({cmd: 'test', value: '你好，我是popup！'}, function () {
    //     $('#action').append($('<div>' + JSON.stringify(arguments) + '</div>'));
    // })

    function initWin(wid) {
        tabData.wid = wid;
        chrome.tabs.getSelected(wid, function (tab) {
            tabData.id = tab.id;
            tabData.log = bg.autoMan.tab.getLog(tab.id);

            chrome.browserAction.setBadgeText({text: tabData.log.length.toString(), tabId: tab.id});
        });
    }

    function initTabData() {
        var wid = bg.autoMan.tab.getActiveWinId();
        if (wid < 0) {
            chrome.windows.getCurrent((win) => {
                initWin(win.id);
            });
        } else {
            initWin(wid);
        }
    }

    initTabData();

    var eBus = new Vue();
    window.eBus = eBus;
    // eBus.$on('updataAppData', updataAppData);

    // 创建根实例
    var app = new Vue({
        el: '#autoManApp',
        data: {tab: tabData}
    });

    // var unWatch = app.$watch('tab', {
    //     handler: function (newName, oldName) {
    //         console.log(newName, oldName);
    //         chrome.browserAction.setBadgeText({text: tabData.log.length.toString(), tabId: tabData.id});
    //     },
    //     immediate: true,
    //     deep: true
    // });
    // window.onbeforeunload = function () {
    //     unWatch(); // 注销监控
    //
    //     var bg = chrome.extension.getBackgroundPage();
    //     bg.autoMan.common.notify('ExitPage', '>>>');
    // };

    //var unWatch = app.$watch('tab', (newVal, oldVal) => {
    //     console.log(`${newVal} : ${oldVal}`);
    // })

    // unWatch(); // 注销监控
});