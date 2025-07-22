(function () {
    function DispatchResponseCtrl(responseObj, $rootScope, $modalInstance, DispatchDAO) {
        var ctrl = this;
        ctrl.employeeDispatchResponses = ontime_data.employee_dispatch_responses;
        ctrl.employeeDispatchResponse = responseObj;
        ctrl.save = function () {
            ctrl.DispatchResponseForm.$submitted = true;
            if (ctrl.DispatchResponseForm.$valid) {
                $rootScope.maskLoading();
                DispatchDAO.saveResponse({id: responseObj.id},ctrl.employeeDispatchResponse).then(function (res) {
                    toastr.success("Response saved successfully.");
                    $modalInstance.close(res);
                }).catch(function (data, status) {
                    toastr.error("Response not saved.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };

        ctrl.close = function () {
            $modalInstance.close();
        };
    }
    ;
    angular.module('xenon.controllers').controller('DispatchResponseCtrl', ["responseObj", "$rootScope", "$modalInstance", "DispatchDAO", DispatchResponseCtrl]);
})();