(function() {
    'use strict';
    var CompanyDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'companies/:action/:subAction/:subAction1/:companyCode', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'all'
                }
            },
            retrieveByCompanyCode: {
                method: 'GET'
            },
            save: {
                method: "POST",
                params: {
                    action: "updatecompany"
                }
            },
        });
        return {
            retrieveAll: function(filter) {
                return api.retrieveAll(filter).$promise;
            },
            save: function(data) {
                return api.save(data).$promise;
            },
            retrieveByCompanyCode: function(data) {
                return api.retrieveByCompanyCode(data).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('CompanyDAO', ['$resource', CompanyDAO]);
})();