/* global ontime_data */

(function () {
    function EmployeeSettingsCtrl(employeeId, $rootScope, $modal, $modalInstance, EmployeeDAO) {
        var ctrl = this;

        $rootScope.maskLoading();
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.employeeId = employeeId;
        ctrl.calculateHours = function (timeEarned, timeUsed, offsetTime) {
            var hours = 0;
            var hours = (timeEarned ? parseFloat(timeEarned) : 0) - (timeUsed ? parseFloat(timeUsed) : 0);
            if (!isNaN(offsetTime)) {
                hours = hours + (offsetTime ? parseFloat(offsetTime) : 0);
            }
            return hours.toFixed(2);
        };

        EmployeeDAO.getOffset({id: employeeId}).then(function (res) {
            ctrl.settings = angular.copy(res);
            ctrl.settings.employeeId = employeeId;
            $rootScope.unmaskLoading();
        });

        ctrl.close = function () {
            $modalInstance.close();
        };

        ctrl.save = function () {
            $rootScope.maskLoading();
            var offsets = angular.copy(ctrl.settings);
            if (ctrl.settings.sickTimeOffset && !isNaN(ctrl.settings.sickTimeOffset)) {
                offsets.sickTimeOffset = parseFloat(ctrl.settings.sickTimeOffset);
            }
            if (ctrl.settings.personalTimeOffset && !isNaN(ctrl.settings.personalTimeOffset)) {
                offsets.personalTimeOffset = parseFloat(ctrl.settings.personalTimeOffset);
            }
            if (ctrl.settings.vacationTimeOffset && !isNaN(ctrl.settings.vacationTimeOffset)) {
                offsets.vacationTimeOffset = parseFloat(ctrl.settings.vacationTimeOffset);
            }

            EmployeeDAO.setOffset({id: employeeId, offsets: offsets}).then(function (res) {
                $rootScope.unmaskLoading();
                toastr.success('Offsets saved successfully');
                $modalInstance.close();
            }, function (res) {
                toastr.error('Error while saving offsets from employee');
                $rootScope.unmaskLoading();
            });
        };
    }
    ;
    angular.module('xenon.controllers').controller('EmployeeSettingsCtrl', ["employeeId", "$rootScope", "$modal", "$modalInstance", "EmployeeDAO", EmployeeSettingsCtrl]);
})();