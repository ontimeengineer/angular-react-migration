/* global ontime_data, _, appHelper */

(function () {
    function NonMatchedClaimCtrl(claimsNotMapped, $modalInstance) {
        var ctrl = this;
        ctrl.claimsNotMapped = claimsNotMapped;
        ctrl.close = function () {
            $modalInstance.dismiss();
        };
    }
    ;
    angular.module('xenon.controllers').controller('NonMatchedClaimCtrl', ["claimsNotMapped", "$modalInstance", NonMatchedClaimCtrl]);
})();