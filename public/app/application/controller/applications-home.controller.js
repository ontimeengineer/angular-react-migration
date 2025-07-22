/* global ontime_data */
/* global _ */

(function () {
    function ApplicationHomeCtrl(ApplicationDataService, $rootScope, $stateParams, $state, Page, ApplicationPublicDAO, JobPostPublicDAO) {

        var ctrl = this;
        ApplicationDataService.setBaseValues();

        $rootScope.stopIdle();
    }

    angular.module('xenon.controllers').controller('ApplicationHomeCtrl', ["ApplicationDataService", "$rootScope", "$stateParams", "$state", "Page", "ApplicationPublicDAO", "JobPostPublicDAO", ApplicationHomeCtrl]);
})();
