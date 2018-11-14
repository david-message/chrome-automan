(function (p) {
    (function () {
        var isWanted = false;
        var domain = location.protocol + '//' + location.host;

        // window.addEventListener("message", function (event) {
        //     if (event.source == window && event.data && event.data.direction == "from-content-runscript") {
        //         isWanted = true;
        //         var doc = window.document;
        //         var scriptTag = doc.createElement("script");
        //         scriptTag.type = "text/javascript"
        //         scriptTag.text = event.data.script;
        //         doc.body.appendChild(scriptTag);
        //     }
        // }, false);

        window.onerror = function (msg) {
            if (isWanted) {
                window.postMessage({
                    direction: "from-inject",
                    result: msg.toString()
                }, domain);
                isWanted = false;
            }
        };

        //send to panel
        var data = {
            "msg": 'hello world @inject',
            'title': document.title,
            'url': location.protocol + '//' + location.host
        };
        window.postMessage({
            direction: "from-inject",
            value: data
        }, domain);// *
    })();
})(window);