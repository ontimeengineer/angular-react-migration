(function () {
    'use strict';
    var EventNotificationsDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'eventnotifications/:action', {}, {
            retrieve: {
                method: 'GET',
                isArray: true
            },
            update: {
                method: 'PUT'
            }
        });
        return {
            retrieve: function () {
                return api.retrieve().$promise;
            },
            update: function (data) {
                return api.update({action:data.id},data).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('EventNotificationsDAO', ['$resource', EventNotificationsDAO]);
})();