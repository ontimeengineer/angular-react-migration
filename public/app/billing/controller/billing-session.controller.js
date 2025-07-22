/* global appHelper */

(function () {
    function BillingSessionCtrl($rootScope, $filter, $modal, $timeout, PayrollDAO, BillingDAO, InsurerDAO, $state, Page) {
        var ctrl = this;
        Page.setTitle("Billing Session");
        ctrl.datatableObj = {};
        ctrl.viewRecords = 10;
        ctrl.searchParams = {};
        ctrl.searchParams.processedOn = $filter('date')(new Date(), $rootScope.dateFormat)
        ctrl.criteriaSelected = false;
        ctrl.errorMsg = {};
        ctrl.insuranceProviderList = [];
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.workSiteBilling = false;
        InsurerDAO.retrieveAll().then(function (res) {
            ctrl.insuranceProviderList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        ctrl.calculateEditedClaim = function () {
            ctrl.anyClaimResubmitted = false;
            angular.forEach(ctrl.billingSessions, function (billingObj) {
                if (billingObj.isEdited === true && billingObj.isRejected !== true) {
                    ctrl.anyClaimResubmitted = true;
                }
            });
        };
        ctrl.fetchBillingBatch = function () {
            BillingDAO.getSessionById({paramId: $state.params.id}).then(function (res) {
                $rootScope.unmaskLoading();
                if (res && res.billingClaims) {
                    ctrl.billingSessions = res.billingClaims;
                    for (var i = 0; i < ctrl.billingSessions.length; i++) {
                        if (ctrl.billingSessions[i].claimType === 'WORKSITE') {
                            ctrl.workSiteBilling = true;
                            break;
                        }
                    }
                    ctrl.calculateEditedClaim();
                    ctrl.sessionId = res.id;
                    ctrl.insuranceProvider = res.insuranceProvider;
                    ctrl.totalCharges = res.totalCharges;
                    ctrl.totalClaims = res.totalClaims;
                    if (res.sessionStartDate)
                        ctrl.sessionStartDate = Date.parse(res.sessionStartDate);
                    if (res.sessionEndDate)
                        ctrl.sessionEndDate = Date.parse(res.sessionEndDate);
                    ctrl.rerenderDataTable();
                }
            }).catch(function (err) {
                $rootScope.unmaskLoading();
                toastr.error("Some arror occurred while retrieving existing session.");
            });
        }

        if ($state.params.id && $state.params.id !== '') {
            ctrl.processdMode = true;
            $rootScope.maskLoading();
            ctrl.fetchBillingBatch();
        } else {
            ctrl.processdMode = false;
        }
        var otHdConstant = 1;
        ctrl.resetFilters = function () {
            ctrl.searchParams.fromDate = null;
            ctrl.searchParams.toDate = null;
            ctrl.searchParams.insuranceProviderId = undefined;
            ctrl.billingSessions = [];
            ctrl.billingSessionToProcess = [];
            ctrl.criteriaSelected = false;
            ctrl.workSiteBilling = false;
            ctrl.rerenderDataTable();
            ctrl.processClicked = false;
        };
        ctrl.filterSessions = function () {
            ctrl.errorMsg = {};
            if (!ctrl.searchParams.insuranceProviderId || ctrl.searchParams.insuranceProviderId == "") {
                ctrl.searchParams.insuranceProviderId = null;
                ctrl.errorMsg.insuranceProvider = true;
            }
            if (!ctrl.searchParams.fromDate || ctrl.searchParams.fromDate == "") {
                ctrl.searchParams.fromDate = null;
                ctrl.errorMsg.fromDate = true;
            }
            if (!ctrl.searchParams.toDate || ctrl.searchParams.toDate == "") {
                ctrl.searchParams.toDate = null;
                ctrl.errorMsg.toDate = true;
            }
            if (ctrl.searchParams.fromDate != null && ctrl.searchParams.toDate != null && ctrl.searchParams.insuranceProviderId != null) {
                ctrl.criteriaSelected = true;
                ctrl.retrieveSessions();
            } else {
                ctrl.criteriaSelected = false;
                ctrl.billingSessions = [];
                ctrl.billingSessionToProcess = [];
                ctrl.rerenderDataTable();
            }
        };
        var getDateDiff = function (firstDate, secondDate) {
            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
        }
        ctrl.retrieveSessions = function () {
            if (ctrl.criteriaSelected) {
                $rootScope.maskLoading();
                ctrl.dataRetrieved = false;
                ctrl.reviewedFilters = angular.copy(ctrl.searchParams);
                ctrl.workSiteBilling = false;
                BillingDAO.reviewSessions(ctrl.searchParams).then(function (res) {
                    ctrl.dataRetrieved = true;
                    ctrl.billingSessions = res;
                    ctrl.billingSessionToProcess = angular.copy(res);
                    ctrl.totalClaims = ctrl.billingSessions.length;
                    ctrl.totalCharges = 0;
                    angular.forEach(ctrl.billingSessions, function (billingObj) {
                        if (billingObj.claimType === 'WORKSITE') {
                            ctrl.workSiteBilling = true;
                        }
                        if (billingObj.patientBirthDate != null) {
                            billingObj.patientBirthDate = Date.parse(billingObj.patientBirthDate);
                        }
//                        billingObj.claim1500Data = JSON.parse(billingObj.claim1500Data);
                        billingObj.uniqueId = randomString();
                        ctrl.totalCharges = ctrl.totalCharges + billingObj.totalCosts;
                    });
                    ctrl.rerenderDataTable();
                }, function (e) {
                    if (e.data != null) {
                        toastr.error(e.data);
                    } else {
                        toastr.error("Payroll sessions cannot be retrieved.");
                    }

                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };
        ctrl.processSession = function () {
            ctrl.processClicked = true;
            var payload = angular.copy(ctrl.billingSessions);
            angular.forEach(payload, function (billingObj) {
                billingObj.patientBirthDate = $filter('date')(billingObj.patientBirthDate, $rootScope.dateFormat);
                billingObj.isRejected = false
                delete billingObj.uniqueId;
            });
            ctrl.reviewedFilters.processedOn = $filter('date')(new Date(), $rootScope.dateFormat);
            $rootScope.maskLoading();
            BillingDAO.processSessions(ctrl.reviewedFilters, payload).then(function (res) {
                if (ctrl.workSiteBilling != true) {
                    if (ctrl.billingSessions != null && ctrl.billingSessions.length > 0 && ctrl.billingSessions[0].claimType != 'UB04') {
                        window.location.href = $rootScope.serverPath + 'billing/session/' + res.id + '/edi/download';
                    } else {
                        window.location.href = $rootScope.serverPath + 'billing/session/' + res.id + '/edi/download';
                    }
                }
                $state.go('app.billing_batch', {id: res.id});
            }).catch(function (e) {
                toastr.error("Billing sessions cannot be processed.");
            }).then(function () {
                ctrl.processClicked = false;
                $rootScope.unmaskLoading();
            });
        };
        ctrl.changeViewRecords = function () {
            ctrl.datatableObj.page.len(ctrl.viewRecords).draw();
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
        ctrl.openWorkSiteClaimServiceLines = function (claim) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('billing', 'worksite_claim_detail_modal'),
                controller: 'WorkSiteClaimLinesCtrl as workSiteClaimLinesCtrl',
                size: 'lg',
                resolve: {
                    workSiteName: function () {
                        return claim.workSiteName;
                    },
                    workSiteClaimLines: function () {
                        return claim.workSiteClaimServiceLines;
                    }
                }
            });
            modalInstance.result.then(function (res) {
            }, function () {
            });
        }
        ctrl.openClaim1500 = function (claim, e) {
            if (claim.claimType === 'WORKSITE') {
                e.stopPropagation();
                ctrl.openWorkSiteClaimServiceLines(claim);
                return;
            }
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
        ctrl.openClaim1500ForEdit = function (claim) {
            _setClaim1500InLocalStorage(claim);
            var url = $state.href('app.manual_claim_edit', {id: claim.uniqueId ? claim.uniqueId : claim.id});
            if (claim.claimType === 'UB04')
                url = $state.href('app.manual_claim_ub04_edit', {id: claim.uniqueId ? claim.uniqueId : claim.id});
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
            newwindow.onunload = function () {
                if (newwindow.location != "about:blank") {
                    $rootScope.maskLoading();
                    ctrl.fetchBillingBatch();
                }
            };
        };
        ctrl.rerenderDataTable = function () {
            var pageInfo;
            if (ctrl.datatableObj.page != null) {
                pageInfo = ctrl.datatableObj.page.info();
            }
            var billingSessions = angular.copy(ctrl.billingSessions);
            ctrl.billingSessions = [];
            $("#example-1_wrapper").remove();
            $timeout(function () {
                ctrl.billingSessions = billingSessions;
                $timeout(function () {
                    $("#example-1").wrap("<div class='table-responsive'></div>");
                    if (ctrl.processdMode) {
                        $(".dt-button").attr("class", "btn btn-info green_bt pull-right print-btn");
                    }
                }, 50);
                if (pageInfo != null) {
                    $timeout(function () {
                        var pageNo = Number(pageInfo.page);
                        if (ctrl.datatableObj.page.info().pages <= pageInfo.page) {
                            pageNo--;
                        }
                        ctrl.datatableObj.page(pageNo).draw(false);
                    }, 20);
                }
            });
        };
        function randomString() {
            var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', length = 32;
            var result = '';
            for (var i = length; i > 0; --i)
                result += chars[Math.round(Math.random() * (chars.length - 1))];
            return result;
        }
        ctrl.openDeleteModal = function (claim, e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to delete this Billing Claim?";
                    },
                    title: function () {
                        return "Delete Billing Claim";
                    },
                    subtitle: function () {
                        return "";
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                BillingDAO.deleteClaim({paramId: claim.id}).then(function () {
                    toastr.success("Billing claim deleted.");
                    ctrl.fetchBillingBatch();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });
        };
        ctrl.openRejectModal = function (claim, e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'open-reject-claim-modal'),
                controller: 'OpenRejectModalController as openReject',
                size: 'md',
                resolve: {
                    mode: function () {
                        return claim.isRejected ? 'Open' : 'Reject';
                    },
                    claim: function () {
                        return claim;
                    }
                }
            });
            modalInstance.result.then(function (claimDetails) {
                $rootScope.maskLoading();
                BillingDAO.setClaimStatus(claimDetails).then(function () {
                    toastr.success("Billing claim " + (claim.isRejected ? 'Opened.' : 'Rejected.'));
                    claim.isRejected = !claim.isRejected;
                    ctrl.calculateEditedClaim();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });
        };

        ctrl.openResetModal = function (e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to reset this Billing Batch?";
                    },
                    title: function () {
                        return "Reset Billing Batch";
                    },
                    subtitle: function () {
                        return "";
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                BillingDAO.resetBatch({paramId: ctrl.sessionId}).then(function () {
                    toastr.success("Billing batch reset.");
                    ctrl.anyClaimResubmitted = false;
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };
    }
    angular.module('xenon.controllers').controller('BillingSessionCtrl', ["$rootScope", "$filter", "$modal", "$timeout", "PayrollDAO", "BillingDAO", "InsurerDAO", "$state", "Page", BillingSessionCtrl]);
})();
