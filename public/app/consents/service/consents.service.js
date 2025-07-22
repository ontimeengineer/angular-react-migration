(function() {
    'use strict';
    var ConsentsDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'consentTypes/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'getall'
                }
            },
            retrieveAllActive: {
                method: 'GET',
                isArray: true,
            },
            view: {
                method: 'GET',
                isArray: true
            },
            save: {
                method: 'POST'
            },
            update: {
                method: 'PUT'
            },
            changestatus: {
                method: 'PUT'
            },
            order: {
                method: 'POST',
                params: {
                    action: 'updateOrder'
                },
            },
            delete: {
                method: 'DELETE'
            }
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            retrieveAllActive: function (filter) {
                return api.retrieveAllActive(filter).$promise;
            },
            view: function (filter) {
                return api.view(filter).$promise;
            },
            save: function (data) {
                return api.save(data).$promise;
            },
            update: function (data) {
                return api.update({action: data.id}, data).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: data.id, subAction: data.isActive},data).$promise;
            },
            order: function (data) {
                return api.order(data).$promise;
            },
            delete: function (data) {
                return api.delete({action: data.id}).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('ConsentsDAO', ['$resource', ConsentsDAO]);
})();