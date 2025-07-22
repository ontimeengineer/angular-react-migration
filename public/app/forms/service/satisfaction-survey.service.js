(function () {
    'use strict';
    var SatisfactionSurveyDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'satisfactionSurvey/:action/:subAction/:subAction1', {}, {
            getClientServices: {
                method: 'GET',
                params: {
                    action: 'enum',
                    subAction: 'clientServices',
                },
                isArray: true
            },
            submitSurvey: {
                method: 'POST',
            }
        });

        return {
            getClientServices: function () {
                return api.getClientServices().$promise;
            },
            submitSurvey: function (data) {
                return api.submitSurvey(data).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('SatisfactionSurveyDAO', ['$resource', SatisfactionSurveyDAO]);
})();