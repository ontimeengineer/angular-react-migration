/* global ontime_data */
/* global _ */

(function () {
    function ApplicationCtrl(ApplicationDataService, $rootScope, $stateParams, $state, Page, ApplicationPublicDAO, JobPostPublicDAO) {

        var ctrl = this;

        ctrl.companyName;
        ctrl.applicationSubmitted = false;
        ApplicationDataService.setBaseValues();

        $rootScope.stopIdle();
        ctrl.applicationData = {},
                ctrl.firstTime = true;

        ctrl.existingApplication = function () {
            $state.go('applications-existing', {'posting_identifier': ctrl.applicationData.postingIdentifier, 'resource_identifier': ctrl.applicationData.sourceIdentifier});
            $("form#login").trigger('reset');
        };

        ctrl.submitApplicationRetrieve = function () {
            if ($("form#login").valid()) {
                showLoadingBar(70); // Fill progress bar to 70% (just a given value)
                $rootScope.maskLoading();
                ApplicationPublicDAO.startApplication(ctrl.applicationData).then(function (data, status, headers, config) {
                    ctrl.applicationSubmitted = true;
                }).catch(function (data, status) {
                    if (data.status || data.status === 409) {
                        toastr.error(data.data);
                    } else {
                        toastr.error("Application cannot be initiated.");
                    }
                }).then(function () {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                            $rootScope.unmaskLoading();
                        }
                    });
                });
            }
        }

        if ($state.params.posting_identifier == null || $state.params.resource_identifier == null) {
        } else {
            $rootScope.maskLoading();
            var requestBody = {'action': $state.params.posting_identifier, 'subAction': $state.params.resource_identifier};
            JobPostPublicDAO.retrieveJobPost(requestBody)
                    .then(function (data) {
                        ctrl.companyName = data.companyName;
                        ctrl.applicationData.orgCode = data.orgCode;
                        ctrl.postTitle = data.postTitle;
                        ctrl.applicationData.postingIdentifier = data.postingIdentifier;
                        ctrl.applicationData.sourceIdentifier = $state.params.resource_identifier;
                    })
                    .catch(function (data, status) {
                        if (data.status && data.status === 400) {
                            toastr.error(data.data);
                        } else {
                            $state.transitionTo(ontime_data.defaultState);
                        }
                    })
                    .then(function () {
                        $rootScope.unmaskLoading();
                    });
        }
    }

    angular.module('xenon.controllers').controller('ApplicationCtrl', ["ApplicationDataService", "$rootScope", "$stateParams", "$state", "Page", "ApplicationPublicDAO", "JobPostPublicDAO", ApplicationCtrl]);
})();
