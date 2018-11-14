Vue.component('option-form', {
    template: '<div>' +
        '<section><p>Server:<input class="input-box" v-model="server"></p></section>' +
        '<section><p>Show Image:<input type="checkbox" v-model="showimage"></p></section>' +
        '<section>' +
        '<select v-model="scType"><option v-for="st in scriptType" :value="st">{{st}}</option></select>' +
        '<input class="input-box"  v-model="matchValue" />' +
        '</section>' +
        '<section><div style="margin: 20px auto;"><textarea style="width: 100%;height: 300px;border-radius: 3px;resize: vertical;max-height: 400px;" v-model="content"></textarea></div></section>' +
        '<section><button @click="saveData($event)">Save</button></section>' +
        '</div>',
    data: function () {
        return {
            'server': '127.0.0.1:8088',
            showimage: true,
            scriptType: ['url', 'domain', 'regex'],
            scType: 'url',
            matchValue: null,
            content: null
        };
    }, watch: {
        server: function (v) {
            this.updateData('server', v);
        },
        showimage: function (v) {
            this.updateData('showImage', v);
        }
    }, methods: {
        updateData: function (path, data) {
            var bg = chrome.extension.getBackgroundPage();
            bg.autoMan.data.update(path, data);

            console.log(path, bg.autoMan.data.getData(path));
        },
        saveData: function (evt) {
            var bg = chrome.extension.getBackgroundPage();
            bg.autoMan.tabs.updateData(this.scType, this.matchValue, this.content);

            bg.autoMan.common.notify('Save Trigger','script content change.');
        }
    }
});

$(document).ready(() => {
    // 创建根实例
    new Vue({
        el: '#autoManAppOption',
        data: {}
    });
});