(function() {
    'use strict';
    var DocumentDao = function(resource) {
        var api = resource(ontime_data.weburl + 'company-documents/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true
            },
            //this method will be used for user save or update based on the action passed
            update: {
                method: 'PUT'
            },
            delete: {
                method: 'DELETE'
            },
            save: {
                method: 'POST'
            }
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            save: function(data) {
                return api.save(data).$promise;
            },
            delete: function (data) {
                return api.delete({action: data.id}).$promise;
            },
            update: function (data) {
                return api.update({action: data.id}, data).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('DocumentDao', ['$resource', DocumentDao]);
})();