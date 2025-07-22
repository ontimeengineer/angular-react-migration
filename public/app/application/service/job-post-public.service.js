(function() {
    'use strict';
    var JobPostPublicDAO = function(resource) {
        var api = resource(ontime_data.weburl + 'public/job-posts/:action/:subAction', {}, {
            retrieveJobPost: {
                method: 'GET'
            }
        });
        return {
            retrieveJobPost: function(data) {
                return api.retrieveJobPost(data).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('JobPostPublicDAO', ['$resource', JobPostPublicDAO]);
})();