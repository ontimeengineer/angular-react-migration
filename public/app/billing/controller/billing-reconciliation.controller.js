/* global ontime_data, _, appHelper */

(function () {
    function BillingReconciliationCtrl($state) {
        console.log("$state", $state);
        var ctrl = this;
        ctrl.search = {};
        ctrl.search.title = $state.current.data && $state.current.data.title ? $state.current.data.title : null;
        ctrl.navigateToTab = navigateToTab;
        function navigateToTab() {
            $state.go(ctrl.search.type);
        }
    }
    angular.module('xenon.controllers').controller('BillingReconciliationCtrl', ["$state", BillingReconciliationCtrl]);
})();
