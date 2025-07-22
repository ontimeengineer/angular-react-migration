(function () {
    var RejectEmployeeModalController = function ($modalInstance, $rootScope, patientId, employees, PatientDAO, $timeout) {
        var ctrl = this;
        ctrl.details = { patientId: patientId, employeeIds: [] };
        ctrl.employeeList = employees;

        $rootScope.maskLoading();
        PatientDAO.rejectedCareGivers({ patientId: patientId }).then(function (res) {
            ctrl.details.employeeIds = res;
            $timeout(function () {
                            $('#employeeIds').trigger('change.select2');
                        }, 100);
        }).catch(function (data) {
            console.log('Error retrieving current rejections');
        }).then(function () {
            $rootScope.unmaskLoading();
        });

        ctrl.ok = function () {
            ctrl.submitted = true;
            if (ctrl.RejectEmployeeModal.$valid) {
                $rootScope.maskLoading();
                PatientDAO.rejectCareGivers(ctrl.details).then(function (res) {
                    toastr.success("Rejected Caregiver(s) saved successfully.");
                    $modalInstance.close(ctrl.details);
                }).catch(function (data) {
                    toastr.success("Could not save Rejected Caregiver(s).");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };
        ctrl.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
    angular.module('xenon.controllers').controller('RejectEmployeeModalController', ['$modalInstance', '$rootScope', 'patientId', 'employees', 'PatientDAO', '$timeout', RejectEmployeeModalController]);
})();