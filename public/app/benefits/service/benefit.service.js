(function() {
    'use strict';
    var BenefitDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'employeebenefits/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'view'
                }
            },
            save: {
                method: "POST",
            },
            //this method will be used for insuranceProvider save or update based on the action passed
            update: {
                method: 'PUT'
            },
            //this method will be used for insuranceProvider delete
            delete: {
                method: 'GET'
            },
            changestatus: {
                method: 'GET'
            } 
            
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            get: function (params) {
                return api.get({action:params.id}).$promise;
            },
            save: function(data) {
                return api.save(data).$promise;
            },
            update: function (data) {
                return api.update({action:data.id}, data.data).$promise;
            },
            delete: function (data) {
                return api.delete({action:'delete', subAction:data.id}).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status}).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('BenefitDAO', ['$resource', BenefitDAO]);
})();
