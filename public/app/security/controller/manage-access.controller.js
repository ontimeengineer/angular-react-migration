(function () {
    function ManageAccessCtrl($timeout, Page) {
        var ctrl = this;
        Page.setTitle("Manage Role");
        ctrl.roleObj = {companyCode: ontime_data.company_code};
        ctrl.accessList = [{name: 'Employee'}, {name: 'Patient'}, {name: 'Timesheet'}, {name: 'Billing'}, {name: 'Payroll'}];
        ctrl.saveSettings = saveSettings;
        $timeout(function () {
            $('#multi-select').multiSelect('refresh');
        });

        //function to save the payroll settings
        function saveSettings() {
            if ($('#manage_access_form')[0].checkValidity() && ctrl.roleObj.accessList != null && ctrl.roleObj.accessList.length > 0) {
//                $rootScope.maskLoading();
//                $rootScope.unmaskLoading();
            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('ManageAccessCtrl', ["$timeout", "Page", ManageAccessCtrl]);
})();