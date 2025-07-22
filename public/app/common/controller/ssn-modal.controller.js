(function () {
    function SsnCtrl(employeeId, $scope, $rootScope, $modalInstance, EmployeeDAO) {
        var ctrl = this;

        ctrl.employee = {};
        ctrl.ssn = {};

        $rootScope.maskLoading();

        EmployeeDAO.getSSN({employeeId: employeeId}).then(function (res) {            
            ctrl.employee = angular.copy(res);
        }).catch(function (data, status) {
            toastr.error("SSN cannot be retrieved.");
        }).then(function () {
            $rootScope.unmaskLoading();
        });
        
        function format(value, pattern) {
            var i = 0,
                    v = value.toString();
            return pattern.replace(/#/g, _ => v[i++]);
        }


        ctrl.saveSSN = function () {
            //Check if ssn number is already present.
            if ($('#SSNData').valid() && ctrl.employee.ssn && ctrl.employee.ssn.trim().length > 0) {
                $rootScope.maskLoading();
                EmployeeDAO.checkIfSsnExists({Id: employeeId, ssn: ctrl.employee.ssn})
                        .then(function (res) {
                            if (res.data) {
                                ctrl.ssn.exists = true;
                            } else {
                                EmployeeDAO.updateSSN({employeeId: employeeId, ssn: ctrl.employee.ssn}).then(function (res) {
                                    var updatedSSN = ctrl.employee.ssn ? ctrl.employee.ssn.substring(ctrl.employee.ssn.length - 4):'';
                                    $modalInstance.close(format(updatedSSN, "xxxxx####"));
                                    toastr.success("SSN updated successfully.");
                                }).catch(function () {
                                    toastr.error("SSN cannot be updated.");
                                }).then(function () {
                                    $rootScope.unmaskLoading();
                                });
                            }
                        })
                        .catch(function () {
                            toastr.error("SSN cannot be checked.");
                        })
                        .then(function () {
                            $rootScope.unmaskLoading();
                        });
            } else {
                ctrl.ssn.exists = false;
            }
        };

        ctrl.close = function () {
            $modalInstance.dismiss();
        };
    }
    ;
    angular.module('xenon.controllers').controller('SsnCtrl', ["employeeId", "$scope", "$rootScope", "$modalInstance", "EmployeeDAO", SsnCtrl]);
})();