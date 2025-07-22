/* global _, ontime_data */

(function () {
    function ApplicationSubmitCtrl($rootScope, application, professionalReferences, $modalInstance, ApplicationPublicDAO) {
        var ctrl = this;
        ctrl.resumePending = false;
        ctrl.professionalReferencesPending = false;
        ctrl.canSubmitApplication = false;
        ctrl.alreadySubmitted = false;
        if ((application.resume === null || application === '') && application.resumeMandatory !== false) {
            ctrl.resumePending = true;
        }
        if (professionalReferences.length < 2) {
            ctrl.professionalReferencesPending = true;
        }
        if (!ctrl.resumePending && !ctrl.professionalReferencesPending) {
            ctrl.canSubmitApplication = true;
        }

        ctrl.close = function () {
            if (ctrl.alreadySubmitted) {
                $modalInstance.close('submitted');
            } else {
                $modalInstance.close();
            }
        };

        if (application.signature != null) {
            ctrl.dataUrl = "data:image/png;base64," + application.signature;
        }

        ctrl.submitApplication = function () {
            var data = {};
            if (ctrl.dataUrl !== null) {
                data.signature = ctrl.dataUrl.substring(ctrl.dataUrl.indexOf(",") + 1);
            }
            $rootScope.maskLoading();

            ApplicationPublicDAO.submitApplication({'applicationId': application.applicationId, data: data})
                    .then(function (res) {
                        ctrl.alreadySubmitted = true;
                    })
                    .catch(function (res) {
                        toastr.error('Something went wrong');
                    }).then(function () {
                $rootScope.unmaskLoading();
            });
        };
    }
    ;
    angular.module('xenon.controllers').controller('ApplicationSubmitCtrl', ["$rootScope", "application", "professionalReferences", "$modalInstance", "ApplicationPublicDAO", ApplicationSubmitCtrl]);
})();