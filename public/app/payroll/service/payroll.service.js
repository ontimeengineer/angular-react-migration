(function() {
    'use strict';
    var PayrollDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'payrolls/:action/:subAction/:subAction1', {}, {
            //this method will be used for employee save or update based on the action passed
            updateSettings: {
                method: 'POST',
                params: {
                    action: 'settings'
                }
            },
            getSettings: {
                method: 'GET',
                params: {
                    action: 'settings'
                }
            },
            getHistory: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'sessions'
                }
            },
            reviewSessions: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'review'
                }
            },
            processSessions: {
                method: 'POST',
                params: {
                    action: 'process'
                }
            },
            getProcessedSessions: {
                method: 'GET',
                params: {
                    action: 'sessions'
                }
            },
            deleteBatch:{
                method: 'DELETE',
                params: {
                    action: 'sessions'
                }             
            }
        });
        return {
            updateSettings: function(data) {
                return api.updateSettings(data).$promise;
            },
            getSettings: function() {
                return api.getSettings().$promise;
            },
            getHistory: function(data) {
                return api.getHistory(data).$promise;
            },
            reviewSessions: function(data) {
                return api.reviewSessions(data).$promise;
            },
            processSessions: function(params,data) {
                return api.processSessions(params,data).$promise;
            },
            getProcessedSessions: function(data) {
                return api.getProcessedSessions({subAction: data.id}).$promise;
            },
            deleteBatch: function(data) {
                return api.deleteBatch({subAction: data.paramId}).$promise;
            }

        };
    };
    angular.module("xenon.factory").factory('PayrollDAO', ['$resource', PayrollDAO]);
})();
