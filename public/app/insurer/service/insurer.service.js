(function() {
    'use strict';
    var InsurerDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'insurance/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'view'
                }
            },
            //this method will be used for insuranceProvider save or update based on the action passed
            update: {
                method: 'POST'
            },
            //this method will be used for insuranceProvider delete
            delete: {
                method: 'GET'
            },
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            get: function (params) {
                return api.get({action:params.id}).$promise;
            },
            update: function (data) {
                return api.update({action:data.action}, data.data).$promise;
            },
            delete: function (data) {
                return api.delete({action:'delete', subAction:data.id}).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('InsurerDAO', ['$resource', InsurerDAO]);
})();
