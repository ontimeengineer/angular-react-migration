/* global ontime_data, _, appHelper, parseFloat */

(function () {
    function ManageBillingReconciliationCtrl($formService, $state, $timeout, $modal, $rootScope, InsurerDAO, PatientDAO, BillingDAO) {
        var ctrl = this;
        ctrl.title = $state.current.data.title;
        ctrl.isViewOnly = $state.current.data.title === 'View' ? true : false;
        ctrl.isEdiRead = $state.current.data.title === 'EdiRead' ? true : false;
        ctrl.selectedClaims = {};
        ctrl.currentDate = new Date();
        ctrl.viewRecords = 10;
        ctrl.filteredDatatableObj = {};
        ctrl.bill = {creditUsages: []};
        ctrl.claimsNotMapped = [];
        ctrl.claimList = {allSelected: false, setAmountDue: false};
        ctrl.navigateToTab = navigateToTab;
        function navigateToTab() {
            $state.go(ctrl.type);
        }
        ctrl.totals = {AmountDue: 0, Applied: 0, Credits: 0};
        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'patientName', order: 'asc', 'billingReconciliation': true};
        ctrl.selectedClaimsShow = [];
        ctrl.getlength = function (selectedClaims) {
            var totalSelected = 0;
            _.each(selectedClaims, function (selected) {
                if (selected === true) {
                    totalSelected++;
                }
            });
            return totalSelected;
        };

        ctrl.resetDataAndFilters = function () {
            ctrl.totals = {AmountDue: 0, Applied: 0, Credits: 0};
            ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'patientName', order: 'asc', 'billingReconciliation': true};
            ctrl.selectedClaimsShow = [];
            ctrl.claims = [];
            ctrl.selectedClaims = {};
            ctrl.bill.reconciliationDetails = [];
        };

        ctrl.resetFilters = function () {
            delete ctrl.searchParams;
            ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'patientName', order: 'asc', 'billingReconciliation': true};
        };

        InsurerDAO.retrieveAll().then(function (res) {
            ctrl.insuranceProviderList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });


        ctrl.renderPatientList = function () {
            var search = {};
            if (ctrl.bill.receivedBy) {
                search['insuranceProviderId'] = ctrl.bill.receivedBy;
            }
            search['populateInsuranceId'] = true;
            search['status'] = 'all';
            PatientDAO.retrieveForSelect(search).then(function (res) {
                ctrl.patientList = res;
            }).catch(function () {
                toastr.error("Failed to retrieve patient list.");
            });
        };

        ctrl.renderPatientList();

        if (ctrl.isViewOnly) {
            BillingDAO.getReconciliation({id: $state.params.id}).then(function (bill) {
                ctrl.reconciliationDetails = [];
                if (bill.reconciliationDetails) {
                    _.each(bill.reconciliationDetails, function (reconciliation) {
                        var claim = angular.copy(reconciliation.claim);
                        claim.paidAmount = reconciliation.paidAmount;
                        claim.creditUsed = reconciliation.creditUsed;
                        ctrl.reconciliationDetails.push(claim);
                    });
                }
                ctrl.bill = angular.copy(bill);
                ctrl.bill.receivedBy = bill.receivedFrom;
            });
        }

        ctrl.changeViewRecords = function () {
            ctrl.filteredDatatableObj.page.len(ctrl.viewRecords).draw();
        };

        ctrl.pageChanged = function (pagenumber) {
            ctrl.claimList = {allSelected: false, setAmountDue: false};
            ctrl.searchParams.pageNo = pagenumber;
            if (ctrl.claims && ctrl.claims.length > 0)
                ctrl.filterClaims();
        };

        ctrl.removeCreditUsage = function (credit) {
            _.remove(ctrl.bill.creditUsages, credit);
            var selectedClaim = _.find(ctrl.selectedClaimsShow, {id: credit.toClaimId});
            if (selectedClaim) {
                selectedClaim.creditUsed = selectedClaim.creditUsed - credit.usedAmount;
            }
            if (selectedClaim.creditUsed === 0 && !selectedClaim.AmountPaid) {
                ctrl.selectedClaims[selectedClaim.id] = false;
            }
            ctrl.updateSelection();
        };

        ctrl.updateSelection = function () {
            _.remove(ctrl.bill.creditUsages, function (credit) {
                return ctrl.selectedClaims[credit.toClaimId] !== true;
            });
            _.each(ctrl.selectedClaimsShow, function (claim) {
                if (ctrl.selectedClaims[claim.id] !== true)
                    claim.creditUsed = 0;
            });
            _.each(ctrl.selectedClaims, function (selected, selectedClaimId) {
                var claim = _.find(ctrl.claims, {id: parseInt(selectedClaimId)});
                if (claim && !_.find(ctrl.selectedClaimsShow, {id: parseInt(selectedClaimId)}) && (selected === true)) {
                    if (ctrl.claimList.setAmountDue)
                        claim.AmountPaid = (claim.totalCosts - claim.paidAmount) > 0 ? parseFloat(claim.totalCosts - claim.paidAmount).toFixed(2) : 0;
                    ctrl.selectedClaimsShow.push(claim);
                } else if (claim && _.find(ctrl.selectedClaimsShow, {id: parseInt(selectedClaimId)}) && (selected === false)) {
                    delete claim.AmountPaid;
                    _.remove(ctrl.selectedClaimsShow, {id: parseInt(selectedClaimId)});
                }
            });
            ctrl.getTotals();
            _.reverse(ctrl.selectedClaimsShow);
        };

        ctrl.updateAllSelection = function () {
            ctrl.claims.forEach(function (claim) {
                ctrl.selectedClaims[claim.id] = ctrl.claimList.isSelected;
            });
            ctrl.updateSelection();
        };

        ctrl.updateAmountDue = function () {
            if (ctrl.claimList.setAmountDue) {
                ctrl.claims.forEach(function (claim) {
                    if (ctrl.selectedClaims[claim.id]) {
                        claim.AmountPaid = (claim.totalCosts - claim.paidAmount) > 0 ? parseFloat(claim.totalCosts - claim.paidAmount).toFixed(2) : 0;
                    }
                });
                ctrl.updateAllClaims();
            }
        };

        ctrl.updateAmountPaid = function (claimId, AmountPaid) {
            var selectedClaim = _.find(ctrl.selectedClaimsShow, {id: claimId});
            if (selectedClaim) {
                selectedClaim.AmountPaid = AmountPaid;
            }
            ctrl.getTotals();
        };

        ctrl.removedSelection = function (claimId) {
            var selectedClaim = _.find(ctrl.selectedClaimsShow, {id: claimId});
            if (selectedClaim) {
                delete selectedClaim.AmountPaid;
                _.remove(ctrl.bill.creditUsages, {toClaimId: claimId});
                selectedClaim.creditUsed = 0;
            }
            ctrl.getTotals();
        };

        ctrl.updateAllClaims = function () {
            if (ctrl.claims && ctrl.claims.length > 0) {
                ctrl.claims.forEach(function (claim) {
                    var selectedClaim = _.find(ctrl.selectedClaimsShow, {id: claim.id});
                    if (selectedClaim) {
                        claim.AmountPaid = selectedClaim.AmountPaid;
                        claim.creditUsed = selectedClaim.creditUsed;
                    } else {
                        claim.creditUsed = 0;
                    }
                });
            }
        };

        ctrl.updateSelectedClaimsShow = function () {
            if (ctrl.claims && ctrl.claims.length > 0) {
                ctrl.claims.forEach(function (claim) {
                    if (claim && ctrl.selectedClaims[claim.id]) {
                        if (ctrl.claimList.setAmountDue === true) {
                            claim.AmountPaid = (claim.totalCosts - claim.paidAmount) > 0 ? parseFloat(claim.totalCosts - claim.paidAmount).toFixed(2) : 0;
                        } else {
                            delete claim.AmountPaid;
                        }
                    }
                });
                ctrl.getTotals();
            }
        };

        ctrl.filterClaims = function () {
            ctrl.updateSelection();
            if (ctrl.bill.receivedBy) {
                $rootScope.maskLoading();
                var searchParams = angular.copy(ctrl.searchParams);
                searchParams.insuranceProviderId = ctrl.bill.receivedBy;
                BillingDAO.searchClaims(searchParams).then(function (claims) {
                    ctrl.claims = angular.copy(claims);
                    ctrl.updateAllClaims();
                }).catch(function (err) {
                    console.log("No claim found", err);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            } else {
                toastr.warning('Please select Payer');
            }
        };

        ctrl.openAdjustments = function (claimId) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('billing', 'claim_adjustment_modal'),
                controller: 'ClaimAdjustmentCtrl as claimAdjustment',
                size: 'md',
                resolve: {
                    ClaimNumber: function () {
                        return claimId ? claimId : null;
                    }
                }
            });
            modalInstance.result.then(function (claim) {
                if (_.findIndex(ctrl.claims, {id: claim.id}) > -1) {
                    ctrl.claims[_.findIndex(ctrl.claims, {id: claim.id})].totalCosts = claim.totalCosts;
                    ctrl.updateSelection();
                }
            }, function () {
                console.log("cancelled");
            });
        };

        ctrl.openCredits = function (claimId) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('billing', 'claim_credit_modal'),
                controller: 'ClaimCreditCtrl as claimCredit',
                size: 'lg',
                resolve: {
                    creditUsages: function () {
                        return ctrl.bill.creditUsages ? angular.copy(ctrl.bill.creditUsages) : [];
                    },
                    creditsAvailable: function () {
                        return BillingDAO.getCreditsAvailable({insuranceProviderId: ctrl.bill.receivedBy}).then(function (credits) {
                            if (credits.length === 0) {
                                toastr.error('No credits available');
                            } else {
                                return angular.copy(credits);
                            }
                        }, function () {
                            console.log("Error retrieveing available credits");
                            toastr.error("Error retrieveing available credits");
                        });
                    },
                    ClaimNumber: function () {
                        return claimId ? claimId : null;
                    }
                }
            });
            modalInstance.result.then(function (creditUsages) {
                var creditUsage = 0;
                _.each(_.filter(creditUsages, {toClaimId: claimId}), function (credit) {
                    creditUsage += credit.usedAmount;
                });
                var cliam = _.find(ctrl.claims, {id: claimId});
                cliam.creditUsed = creditUsage;
                ctrl.bill.creditUsages = angular.copy(creditUsages);
                ctrl.getTotals();
                toastr.success("Credits updated successfully.");
            }, function () {
            });
        };

        ctrl.openNonMatchedClaims = function () {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('billing', 'non_matched_claims_modal'),
                controller: 'NonMatchedClaimCtrl as nonMatchedClaimCtrl',
                size: 'lg',
                resolve: {
                    claimsNotMapped: function () {
                        return ctrl.claimsNotMapped;
                    }
                }
            });
        };

        ctrl.save = function () {
            ctrl.formSubmitted = true;
            var isValid = true;
            ctrl.selectedClaimsShow.forEach(function (claim) {
                if (ctrl.selectedClaims[claim.id] && (_.isUndefined(claim.AmountPaid) && (claim.creditUsed === 0))) {
                    isValid = false;
                }
            });
            if ($('#billing_reconciliation_form')[0].checkValidity() && isValid) {
                ctrl.getTotals();
                if (!(ctrl.totals['Applied'] && (parseFloat(ctrl.totals['Applied']).toFixed(2)
                        === (parseFloat((ctrl.bill.paymentAmount ? parseFloat(ctrl.bill.paymentAmount) : 0)).toFixed(2))))) {
                    toastr.error("Applied amount does not match payment amount.");
                    return;
                }
                var billToSave = angular.copy(ctrl.bill);
                billToSave.orgCode = ontime_data.company_code;

                billToSave.reconciliationDetails = [];

                if (ctrl.selectedClaimsShow && ctrl.selectedClaimsShow.length > 0) {
                    _.each(ctrl.selectedClaimsShow, function (claim) {
                        if (claim.AmountPaid)
                            billToSave.reconciliationDetails.push({claimId: claim.id, paidAmount: claim.AmountPaid, creditUsed: claim.creditUsed});
                    });
                }
                if (!billToSave.creditUsages) {
                    billToSave.creditUsages = [];
                }
//                delete billToSave.ediDataGuid;
                if (billToSave.reconciliationDetails.length === 0 && (billToSave.creditUsages.length === 0)) {
                    toastr.warning("Please add valid claims to save.");
                    return;
                }
                $rootScope.maskLoading();
                BillingDAO.saveReconciliations(billToSave).then(function () {
                    toastr.success("Reconciliation saved successfully.");
                    $state.go('app.billing_reconciliation_list');
                }).catch(function (data, status) {
                    toastr.error("Reconciliation cannot be saved.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };

        ctrl.update = function () {
            ctrl.formSubmitted = true;
            if ($('#billing_reconciliation_form')[0].checkValidity()) {
                var billToSave = {
                    'id': ctrl.bill.id,
                    'eftDate': ctrl.bill.eftDate,
                    'orgCode': ctrl.bill.orgCode,
                    'paymentMethod': ctrl.bill.paymentMethod,
                    'receivedDate': ctrl.bill.receivedDate,
                    'referenceNumber': ctrl.bill.referenceNumber,
                    'receivedFrom': ctrl.bill.receivedFrom
                };

                $rootScope.maskLoading();
                BillingDAO.updateReconciliations(billToSave).then(function () {
                    toastr.success("Reconciliation updated successfully.");
                    $state.go('app.billing_reconciliation_list');
                }).catch(function (data, status) {
                    toastr.error("Reconciliation cannot be updated.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };

        ctrl.getTotals = function () {
            ctrl.totals = {AmountDue: 0, Applied: 0, Credits: 0};
            _.each(ctrl.selectedClaimsShow, function (claim) {
                if (ctrl.selectedClaims[claim.id]) {
                    ctrl.totals.AmountDue = ctrl.totals.AmountDue + ((claim.totalCosts ? parseFloat(claim.totalCosts) : 0) - (claim.paidAmount ? parseFloat(claim.paidAmount) : 0));
                    ctrl.totals.Applied = ctrl.totals.Applied + (claim.AmountPaid ? parseFloat(claim.AmountPaid) : 0);
                }
            });
            _.each(ctrl.bill.creditUsages, function (credit) {
                ctrl.totals.Credits = ctrl.totals.Credits + (credit.usedAmount ? parseFloat(credit.usedAmount) : 0);
            });
        };

        if (ctrl.isEdiRead) {
            BillingDAO.getReconciliationByGuid({guid: $state.params.dataId}).then(function (bill) {
                ctrl.selectedClaimsShow = [];
                ctrl.claims = [];
                if (bill.reconciliationDetails) {
                    _.each(bill.reconciliationDetails, function (reconciliation) {
                        var claim = angular.copy(reconciliation.claim);
                        claim.AmountPaid = reconciliation.paidAmount;
                        ctrl.selectedClaimsShow.push(claim);
                        ctrl.selectedClaims[claim.id] = true;
                    });
                }
                $timeout(function () {
                    ctrl.show = 'selected';
                    $formService.setRadioValues('show', 'selected');
                }, 500);
                ctrl.bill = {};
                ctrl.bill.ediDataGuid = bill.ediDataGuid;
                ctrl.bill.eftDate = bill.eftDate;
                ctrl.bill.orgCode = bill.orgCode;
                ctrl.bill.receivedBy = bill.receivedFrom;
                ctrl.bill.paymentAmount = bill.paymentAmount;
                ctrl.bill.paymentMethod = bill.paymentMethod;
                ctrl.bill.receivedDate = bill.receivedDate;
                ctrl.bill.referenceNumber = bill.referenceNumber;
                if (bill.ediClaimData) {
                    ctrl.claimsNotMapped = bill.ediClaimData;
                }
                ctrl.updateSelection();
            });
        } else {
            ctrl.show = 'filtered';
        }

    }
    angular.module('xenon.controllers')
            .controller('ManageBillingReconciliationCtrl', ["$formService", "$state", "$timeout", "$modal", "$rootScope", "InsurerDAO", "PatientDAO", "BillingDAO", ManageBillingReconciliationCtrl])
            .config(['$provide', function ($provide) {
                    $provide.decorator('$locale', ['$delegate', function ($delegate) {
                            if ($delegate.id == 'en-us') {
                                $delegate.NUMBER_FORMATS.PATTERNS[1].negPre = '-\u00A4';
                                $delegate.NUMBER_FORMATS.PATTERNS[1].negSuf = '';
                            }
                            return $delegate;
                        }]);
                }])
})();
