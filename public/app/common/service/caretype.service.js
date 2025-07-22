(function() {
    'use strict';
    var CareTypeDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'caretypes/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'getall'
                }
            },
            retrieveForInsurer: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'getinsurance'
                }
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
            retrieveForInsurer: function (data) {
                return api.retrieveForInsurer({'subAction':data.insurer_id}).$promise;
            },
            view: function (filter) {
                return api.view(filter).$promise;
            },
            update: function (data) {
                return api.update({action: data.action}, data).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status}).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('CareTypeDAO', ['$resource', CareTypeDAO]);
})();