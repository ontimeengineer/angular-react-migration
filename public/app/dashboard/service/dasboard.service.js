(function () {
    'use strict';
    var DashboardDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'dashboard/:action/:subAction', {}, {
            getActivePatientCount: {
                method: 'GET',
                params: {
                    action: 'activepatients',
                    subAction: 'count'
                },
                transformResponse: function (res) {
                    return {count: res};
                }
            },
            getOpenCasesCount: {
                method: 'GET',
                params: {
                    action: 'opencases',
                    subAction: 'count'
                },
                transformResponse: function (res) {
                    return {count: res};
                }
            },
            getDischargedPatientsCount: {
                method: 'GET',
                params: {
                    action: 'dischargedpatients',
                    subAction: 'count'
                },
                transformResponse: function (res) {
                    return {count: res};
                }
            },
            getCompianceTrackerCount: {
                method: 'GET',
                params: {
                    action: 'compliancetracker',
                    subAction: 'count'
                },
                transformResponse: function (res) {
                    return {count: res};
                }
            },
            getWeather: {
                method: 'GET',
                params: {
                    action: 'weather'
                }
            }
        });
        return {
            getActivePatientCount: function () {
                return api.getActivePatientCount().$promise;
            },
            getOpenCasesCount: function (data) {
                return api.getOpenCasesCount(data).$promise;
            },
            getDischargedPatientsCount: function (data) {
                return api.getDischargedPatientsCount(data).$promise;
            },
            getCompianceTrackerCount: function (data) {
                return api.getCompianceTrackerCount(data).$promise;
            },
            getWeather: function () {
                return api.getWeather().$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('DashboardDAO', ['$resource', DashboardDAO]);
})();