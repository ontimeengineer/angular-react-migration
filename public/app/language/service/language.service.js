(function() {
    'use strict';
    var LanguageDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'admin/language/:action/:subAction/:subAction1', {}, {
            view: {
                method: 'GET',
                params: {
                    action: 'view'
                },
                isArray: true
            },

            changestatus: {
                method: 'GET'
            }
        });
        return {
            view: function (filter) {
                return api.view(filter).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status}).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('LanguageDAO', ['$resource', LanguageDAO]);
})();