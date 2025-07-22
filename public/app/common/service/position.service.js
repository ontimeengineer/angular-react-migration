(function () {
    'use strict';
    var PositionDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'positions/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                params: {
                    action: 'getall'
                },
                isArray: true
            },
            view: {
                method: 'GET',
                params: {
                    action: 'view'
                },
                isArray: true
            },
            //this method will be used for user save or update based on the action passed
            update: {
                method: 'POST'
            },
            changestatus: {
                method: 'GET'
            }
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            view: function (filter) {
                return api.view(filter).$promise;
            },
            update: function (data) {
                var action = data.action;
                delete data.action;
                return api.update({action: action}, data).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status}).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('PositionDAO', ['$resource', PositionDAO]);
})();