(function () {
    function BillingSettingsCtrl($rootScope, $scope, $http, $modal, $timeout, BillingDAO, $filter, Page) {
        var ctrl = this;
        Page.setTitle("Billing Settings");
        ctrl.billingObj = {orgCode: ontime_data.company_code};
        ctrl.billingClearanceHouse = [{id: 'MDONLINE', text: 'MDONLINE - Ability'}];
        ctrl.initSettings = function () {
            $rootScope.maskLoading();
            BillingDAO.getSettings().then(function (res) {
                if (res != null) {
                    ctrl.billingObj = res;
                    ctrl.billingObj.orgCode = ontime_data.company_code;
                }
            }).catch(function () {
                toastr.error("Billing settings cannot be retrieved.");
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        };
        ctrl.saveSettings = saveSettings;
        //function to save the billing settings
        function saveSettings() {
            if ($('#billing_settings_form')[0].checkValidity()) {
                $rootScope.maskLoading();
                BillingDAO.updateSettings(ctrl.billingObj).then(function (res) {
                    ctrl.billingObj = res;
                    console.log(res);
                    toastr.success("Billing settings saved.");
                }).catch(function () {
                    toastr.error("Billing settings cannot be saved.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }
        ctrl.initSettings();
    }
    ;
    angular.module('xenon.controllers').controller('BillingSettingsCtrl', ["$rootScope", "$scope", "$http", "$modal", "$timeout", "BillingDAO", "$filter", "Page", BillingSettingsCtrl]);
})();