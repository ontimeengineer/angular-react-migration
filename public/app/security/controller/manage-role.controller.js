(function () {
    function ManageRoleCtrl($timeout, Page, PositionDAO) {
        var ctrl = this;
        Page.setTitle("Manage Role");
        ctrl.roleObj = {companyCode: ontime_data.company_code};
        ctrl.accessList = [{name: 'Employee'}, {name: 'Patient'}, {name: 'Timesheet'}, {name: 'Billing'}, {name: 'Payroll'}];
        ctrl.saveSettings = saveSettings;
        $timeout(function () {
            $('#multi-select').multiSelect('refresh');
        });
        ctrl.positionList = [];
        PositionDAO.retrieveAll({}).then(function (res) {
            ctrl.positionList = res;
        });

        //function to save the payroll settings
        function saveSettings() {
            if ($('#manage_role_form')[0].checkValidity() && ctrl.roleObj.accessList != null && ctrl.roleObj.accessList.length > 0) {
//                $rootScope.maskLoading();
                //                $rootScope.unmaskLoading();
            }
        }
        ;
    }
    ;
    angular.module('xenon.controllers').controller('ManageRoleCtrl', ["$timeout", "Page", "PositionDAO", ManageRoleCtrl]);
})();