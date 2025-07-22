/* global ontime_data */

(function () {
    function ClaimAdjustmentCtrl($modalInstance, $rootScope, ClaimNumber, BillingDAO) {
        var ctrl = this;
        ctrl.hasClaimNumber = ClaimNumber !== null ? true : false;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.calledOnce = false;
        ctrl.update = {};
        ctrl.reasons = [{key: 'Reason', value: 'Reason to Update'}];        
        ctrl.getClaim = function () {
            if (ctrl.claimNumber) {
                ctrl.update = {};
                $rootScope.maskLoading();
                BillingDAO.getClaimById({paramId: ctrl.claimNumber}).then(function (claim) {                    
                    console.log("claim", claim);
                    ctrl.update = {claimId: claim.id, totalCosts: claim.totalCosts};
                    ctrl.claim = angular.copy(claim);
                }).catch(function (err) {
                    console.log("No claim found",err);
                }).then(function(){
                    $rootScope.unmaskLoading();
                });
            } else {
                toastr.error("Claim number is required.");
            }            
        };
        
        if(ctrl.hasClaimNumber){
            ctrl.claimNumber = ClaimNumber;
            ctrl.getClaim();
        }
            

        ctrl.save = function () {
            if (ctrl.update.claimId && ctrl.update.totalCosts && ctrl.update.reason) {
                $rootScope.maskLoading();
                BillingDAO.saveClaimAdjustment(ctrl.update).then(function (claim) {                    
                    toastr.success("Adjustment saved successfully.");
                    $modalInstance.close(angular.copy(claim));
                }).catch(function (data, status) {
                    toastr.error("Claim cannot be updated.");                    
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            } else {
                toastr.error("Total costs and reason is required.");
            }            
        };
        
        ctrl.close = function () {
            $modalInstance.dismiss();
        };
    }
    ;
    angular.module('xenon.controllers').controller('ClaimAdjustmentCtrl', ["$modalInstance", "$rootScope", "ClaimNumber", "BillingDAO", ClaimAdjustmentCtrl]);
})();