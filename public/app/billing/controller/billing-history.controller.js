(function () {
    function BillingHistoryCtrl($rootScope, $filter, $modal, $timeout, PayrollDAO, BillingDAO, InsurerDAO, $state, Page) {
        var ctrl = this;
        var billingSessionsCopy;
        Page.setTitle("Billing History");
        ctrl.datatableObj = {};
        ctrl.viewRecords = 10;
        ctrl.searchParams = {};
        ctrl.criteriaSelected = false;
        ctrl.errorMsg = {};
        ctrl.insuranceProviderList = [];
        InsurerDAO.retrieveAll().then(function (res) {
            ctrl.insuranceProviderList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        var otHdConstant = 1;
        ctrl.resetFilters = function () {
            ctrl.searchParams.fromDate = null;
            ctrl.searchParams.toDate = null;
            ctrl.searchParams.insuranceProviderId = undefined;
            ctrl.billingSessions = [];
            ctrl.criteriaSelected = false;
            ctrl.rerenderDataTable();
        };

        ctrl.filterSessions = function () {
            ctrl.errorMsg = {};
            if (!ctrl.searchParams.fromDate || ctrl.searchParams.fromDate == "") {
                ctrl.searchParams.fromDate = null;
                ctrl.errorMsg.fromDate = true;
            }
            if (!ctrl.searchParams.toDate || ctrl.searchParams.toDate == "") {
                ctrl.searchParams.toDate = null;
                ctrl.errorMsg.toDate = true;
            }
            if (ctrl.searchParams.fromDate != null && ctrl.searchParams.toDate != null) {
                ctrl.criteriaSelected = true;
                ctrl.retrieveSessions();
            } else {
                ctrl.criteriaSelected = false;
                ctrl.billingSessions = [];
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
                BillingDAO.searchSessions(ctrl.searchParams).then(function (res) {
                    ctrl.dataRetrieved = true;
                    ctrl.billingSessions = res;
                    angular.forEach(ctrl.billingSessions, function (billingObj) {
                        billingObj.processedOn = Date.parse(billingObj.processedOn);
                        billingObj.sessionStartDate = Date.parse(billingObj.sessionStartDate);
                        billingObj.sessionEndDate = Date.parse(billingObj.sessionEndDate);
                    });
                    billingSessionsCopy = ctrl.billingSessions;
                    if (ctrl.onlyManualClaims) {
                        ctrl.filterManualClaims();
                    } else {
                        ctrl.rerenderDataTable();
                    }
                }, function (e) {
                    toastr.error("Billing sessions cannot be retrieved.");

                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };

        ctrl.filterManualClaims = function () {
            if (ctrl.onlyManualClaims) {
                ctrl.billingSessions = $filter("filter")(billingSessionsCopy, {manuallyProcessed: true});
            } else {
                ctrl.billingSessions = angular.copy(billingSessionsCopy);
            }
            ctrl.rerenderDataTable();
        };

        ctrl.changeViewRecords = function () {
            ctrl.datatableObj.page.len(ctrl.viewRecords).draw();
        };
        ctrl.reviewClaims = function (billingSessionId) {
            $state.go('app.billing_batch', {id: billingSessionId});
        };
        ctrl.rerenderDataTable = function () {
            var pageInfo;
            if (ctrl.datatableObj.page != null) {
                pageInfo = ctrl.datatableObj.page.info();
            }
            ctrl.datatableObj = {};
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
                if (pageInfo != null && ctrl.datatableObj != null && ctrl.datatableObj.page != null) {
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

        ctrl.openDeleteModal = function (session,e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to delete this Billing Batch?";
                    },
                    title: function () {
                        return "Delete Billing Batch";
                    },
                    subtitle: function () {
                        return "";
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                BillingDAO.deleteBatch({paramId: session.id}).then(function () {
                    toastr.success("Billing batch deleted.");
                    ctrl.filterSessions();                    
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };
    }
    angular.module('xenon.controllers').controller('BillingHistoryCtrl', ["$rootScope", "$filter", "$modal", "$timeout", "PayrollDAO", "BillingDAO", "InsurerDAO", "$state", "Page", BillingHistoryCtrl]);
})();
