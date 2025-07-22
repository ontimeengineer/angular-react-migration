/* global appHelper */

(function () {
    function ClaimSearchCtrl($rootScope, $modal, PatientDAO, BillingDAO, $state, Page) {
        var ctrl = this;
        Page.setTitle("Billing Session");
        ctrl.datatableObj = {};
        ctrl.limit = 10;
        ctrl.viewRecords = 10;
        var defaultSearchParams = {limit: 10, pageNo: 1, sortBy: 'id', order: 'desc'};
        ctrl.searchParams = angular.copy(defaultSearchParams);
        ctrl.criteriaSelected = false;
        ctrl.errorMsg = {};
        retrievePatientsData();
        function retrievePatientsData() {
            PatientDAO.retrieveAll({subAction: 'all', sortBy: 'lName', order: 'asc'}).then(function (res) {
                ctrl.patientList = res;
            });
        }
        ;
        ctrl.reviewClaims = function (billingSessionId) {
            $state.go('app.billing_batch', {id: billingSessionId});
        };
        ctrl.pageChanged = function (pagenumber) {
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveSessions();
        };
        ctrl.resetFilters = function () {
            ctrl.claims = [];
            ctrl.criteriaSelected = false;
            ctrl.searchParams = angular.copy(defaultSearchParams);
            $("#patientId").select2("val", null);
        };
        ctrl.filterSessions = function () {
            ctrl.errorMsg = {};
            ctrl.searchParams.pageNo = 1;
            if (ctrl.searchParams.patientId != null || ctrl.searchParams.batchId != null || ctrl.searchParams.claimId != null || ctrl.searchParams.insurerClaimNumber != null) {
                ctrl.criteriaSelected = true;
                ctrl.retrieveSessions();
            }
        };
        ctrl.retrieveSessions = function () {
            if (ctrl.criteriaSelected) {
                $rootScope.paginationLoading = true;
                $rootScope.maskLoading();
                ctrl.dataRetrieved = false;
                BillingDAO.searchClaims(ctrl.searchParams).then(function (res) {
                    ctrl.dataRetrieved = true;
                    ctrl.claims = res;
                }).catch(function (e) {
                    if (e.data != null) {
                        toastr.error(e.data);
                    } else {
                        toastr.error("Claims cannot be retrieved.");
                    }
                }).then(function () {
                    $rootScope.paginationLoading = false;
                    $rootScope.unmaskLoading();
                });
            }
        };

        _setClaim1500InLocalStorage = function (claim) {
            if (!claim || !claim.claim1500Data)
                return;
            var claim1500 = {};
            claim1500[claim.uniqueId] = JSON.parse(claim.claim1500Data);
            if (claim.claimType === '1500')
                localStorage.setItem('claim1500', JSON.stringify(claim1500));
            else
                localStorage.setItem('claimUB04', JSON.stringify(claim1500));
        };
        ctrl.openClaim1500 = function (claim) {
            _setClaim1500InLocalStorage(claim);
            var url = $state.href('app.manual_claim_review', {id: claim.uniqueId ? claim.uniqueId : claim.id});
            if (claim.claimType === 'UB04')
                url = $state.href('app.manual_claim_ub04_review', {id: claim.uniqueId ? claim.uniqueId : claim.id});
            var params = [
                'height=' + screen.height,
                'width=' + screen.width,
                'location=0',
                'fullscreen=yes' // only works in IE, but here for completeness
            ].join(',');
            var newwindow = window.open(url, claim.uniqueId, params);
            if (window.focus) {
                newwindow.moveTo(0, 0);
                newwindow.focus();
            }
        };
        ctrl.openRejectModal = function (claim, e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'open-reject-claim-modal'),
                controller: 'OpenRejectModalController as openReject',
                size: 'md',
                resolve: {
                    mode: function () {
                        return claim.isRejected ? 'Open':'Reject';
                    },
                    claim: function () {
                        return claim;
                    }
                }
            });
            modalInstance.result.then(function (claimDetails) {
                console.log("claimDetails",claimDetails);                
                $rootScope.maskLoading();
                BillingDAO.setClaimStatus(claimDetails).then(function () {
                    toastr.success("Billing claim "+(claim.isRejected ? 'Opened.':'Rejected.'));
                    claim.isRejected = !claim.isRejected;
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };
    }
    angular.module('xenon.controllers').controller('ClaimSearchCtrl', ["$rootScope", "$modal", "PatientDAO", "BillingDAO", "$state", "Page", ClaimSearchCtrl]);
})();
