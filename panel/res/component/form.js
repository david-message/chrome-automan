Vue.component('log-list', {
    template: '<div>' +
        '<div v-for="log in list">{{JSON.stringify(log)}}<hr/></div>' +
        '</div>'
    , props: ['list'],
    data: function () {
        return {wid: 0};
    },
    methods: {}
});