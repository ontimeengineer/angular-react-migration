/* global ontime_data, _, appHelper */

(function () {
    function ClaimCreditCtrl(claimNumber, creditUsages, creditsAvailable, $modal, $modalInstance, $rootScope, BillingDAO) {
        var ctrl = this;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.creditUsages = angular.copy(creditUsages);
        ctrl.creditsAvailable = angular.copy(creditsAvailable);
        ctrl.selectedCreditList = [];
        ctrl.selectedCredits = {};
        ctrl.creditsAvailable.forEach(function (claim) {
            _.each(_.filter(creditUsages, {claimId: claim.claimId}), function (credit) {
                if(claimNumber === credit.toClaimId){
                    ctrl.selectedCredits[claim.claimId] = true;
                    claim.usedAmount = credit.usedAmount;
                } else{
                    claim.availableCredit = claim.availableCredit - credit.usedAmount;
                }                 
            });
        });     
        
        ctrl.updateCreditSelection = function () {
            _.each(ctrl.selectedCredits, function (selected, selectedClaimId) {
                var claim = _.find(ctrl.creditsAvailable, {claimId: parseInt(selectedClaimId)});
                if (claim && !_.find(ctrl.selectedCreditList, {claimId: parseInt(selectedClaimId)}) && (selected === true)) {
                    ctrl.selectedCreditList.push(claim);
                } else if (claim && _.find(ctrl.selectedCreditList, {claimId: parseInt(selectedClaimId)}) && (selected === false)) {
                    delete claim.usedAmount;
                    _.remove(ctrl.selectedCreditList, {claimId: parseInt(selectedClaimId)});
                }
            });
        };

        ctrl.save = function () {            
            console.log("claimCredit.creditsAvailable", ctrl.creditsAvailable);                
            for(var cntr=0;cntr < ctrl.selectedCreditList.length;cntr++){
                if (!(ctrl.selectedCreditList[cntr].claimId && ctrl.selectedCreditList[cntr].usedAmount 
                        && (parseFloat(ctrl.selectedCreditList[cntr].usedAmount) <= ctrl.selectedCreditList[cntr].availableCredit))) {
                    toastr.error("Invalid Credit Amount in Cliam "+ctrl.selectedCreditList[cntr].claimId);
                    return;
                } 
            };
            
            _.each(ctrl.selectedCreditList, function (credit) {
                credit.usedAmount = parseFloat(credit.usedAmount);
                var newCredit = _.find(ctrl.creditUsages, {claimId: credit.claimId, toClaimId: claimNumber});
                if (newCredit) {
                    newCredit.usedAmount = credit.usedAmount;
                } else {
                    ctrl.creditUsages.push({claimId: credit.claimId, toClaimId: claimNumber, usedAmount: credit.usedAmount});
                }
            });            
            $modalInstance.close(ctrl.creditUsages);
        };
        ctrl.updateCreditSelection();
        ctrl.close = function () {
            $modalInstance.dismiss();
        };
    }
    ;
    angular.module('xenon.controllers').controller('ClaimCreditCtrl', ["ClaimNumber", "creditUsages", "creditsAvailable", "$modal", "$modalInstance", "$rootScope", "BillingDAO", ClaimCreditCtrl]);
})();