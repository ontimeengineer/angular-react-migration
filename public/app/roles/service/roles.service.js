(function () {
    'use strict';
    var RoleDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'admin/roles/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                params: {
                    action: 'all'
                },
                isArray: true
            },
            retrieveById: {
                method: 'GET',
                isArray: true
            },
            create: {
                method: 'POST'
            },
            update: {
                method: 'PUT'
            },
            changestatus: {
                method: 'PUT'
            }
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            retrieveById: function (filter) {
                return api.retrieveById({action:filter.id},filter).$promise;
            },
            create: function (data) {
                return api.create(data).$promise;
            },
            update: function (data) {
                return api.update({action:data.id},data).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, roleStatus: data.status},{}).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('RoleDAO', ['$resource', RoleDAO]);
})();