(function () {
    'use strict';
    var DispatchDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'dispatch/:action/:subAction', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true
            },
            save: {
                method: 'POST'
            },
            saveResponse: {
                method: 'POST'
            },
            delete: {
                method: 'DELETE'
            },
            getEmployeeCountForDispatch: {
                method: 'POST',
                params: {
                    action: 'employeecount'
                },
                transformResponse: function (res) {
                    return {count: res};
                }
            },
            changestatus: {
                method: 'GET'
            }            
        });
        return {
            retrieveAll: function (params) {
                return api.retrieveAll(params).$promise;
            },
            get: function (params) {
                return api.get({action: params.id}).$promise;
            },
            save: function (data) {
                return api.save(data).$promise;
            },
            saveResponse: function (params, data) {
                return api.saveResponse({action: params.id, subAction: "response"}, data).$promise;
            },
            delete: function (data) {
                return api.delete({action: data.id}).$promise;
            },
            getEmployeeCountForDispatch: function (data) {
                return api.getEmployeeCountForDispatch(data).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status}).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('DispatchDAO', ['$resource', DispatchDAO]);
})();