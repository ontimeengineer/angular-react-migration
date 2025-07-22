(function () {
    function PasswordModalCtrl($modalInstance, password) {
        var ctrl = this;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.save = function () {
            if ($('#popuppassword')[0].checkValidity()) {
                if (ctrl.password != password) {
                    toastr.error('Authorization Failed');
                } else {
                    $modalInstance.close({password: 'correct'});
                }
            }
        };
        ctrl.close = function () {
            $modalInstance.close();
        };
    }
    ;
    angular.module('xenon.controllers').controller('PasswordModalCtrl', ["$modalInstance", "password", PasswordModalCtrl]);
})();