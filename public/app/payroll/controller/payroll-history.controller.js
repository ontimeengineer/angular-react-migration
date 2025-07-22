(function () {
    function PayrollHistoryCtrl($rootScope, $location, $modal, PayrollDAO, $timeout, $state, Page) {
        var ctrl = this;
//        ctrl.companyCode = ontime_data.company_code;
//        ctrl.baseUrl = ontime_data.weburl;
        ctrl.datatableObj = {};
        ctrl.viewRecords = 10;
        Page.setTitle("Payroll History");
        ctrl.searchParams = {};
        ctrl.criteriaSelected = false;
        ctrl.historyList = [];
        ctrl.changeViewRecords = function () {
            ctrl.datatableObj.page.len(ctrl.viewRecords).draw();
        };
        ctrl.navigateToProcessedPage = function (id) {
            $state.go('app.batch_session', {id: id});
        };

        ctrl.resetFilters = function () {
            ctrl.searchParams.fromDate = null;
            ctrl.searchParams.toDate = null;
            ctrl.historyList = [];
            ctrl.criteriaSelected = false;
            ctrl.rerenderDataTable();
        };

        ctrl.rerenderDataTable = function () {
            var pageInfo;
            if (ctrl.datatableObj.page != null) {
                pageInfo = ctrl.datatableObj.page.info();
            }
            ctrl.datatableObj = {};
            var historyList = angular.copy(ctrl.historyList);
            ctrl.historyList = [];
//            $("#example-1_wrapper").remove();
            $timeout(function () {
                ctrl.historyList = historyList;
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

        ctrl.showPayrolls = function () {
            if (!ctrl.searchParams.fromDate || ctrl.searchParams.fromDate == "") {
                ctrl.searchParams.fromDate = null;
            }
            if (!ctrl.searchParams.toDate || ctrl.searchParams.toDate == "") {
                ctrl.searchParams.toDate = null;
            }
            if (ctrl.searchParams.fromDate !== null && ctrl.searchParams.toDate !== null) {
                ctrl.criteriaSelected = true;
                ctrl.retrievePayrollHistory();
            } else {
                ctrl.criteriaSelected = false;
                ctrl.historyList = [];
                ctrl.rerenderDataTable();
            }
        };

        ctrl.retrievePayrollHistory = function () {
            $rootScope.maskLoading();
            ctrl.dataRetrieved = false;
            $location.search({from: ctrl.searchParams.fromDate, to: ctrl.searchParams.toDate});
            PayrollDAO.getHistory(ctrl.searchParams).then(function (res) {
                ctrl.dataRetrieved = true;
                ctrl.historyList = res;
//		ctrl.historyList = [{batchNo: "13025", dateProcessed: "2008/11/28", grossPay: "10", totalEmployees: 2, totalHours: 20, payPeriod: "2008/11/28 To 2008/ 11/ 29"}];
                angular.forEach(ctrl.historyList, function (obj) {
                    obj.processedOn = Date.parse(obj.processedOn);
                    obj.sessionStartDate = Date.parse(obj.sessionStartDate);
                    obj.sessionEndDate = Date.parse(obj.sessionEndDate);
                });
                ctrl.rerenderDataTable();
            }).catch(function () {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                });
                toastr.error("Could not load data.");
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        };

        function initPage() {
            var params = $location.search();
            if (params != null) {
                if (params.from != null) {
                    ctrl.searchParams.fromDate = params.from;
                }
                if (params.to != null) {
                    ctrl.searchParams.toDate = params.to;
                }
                ctrl.showPayrolls();
            }
        }
        ctrl.openDeleteModal = function (session,e) {
            e.stopPropagation();
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to delete this Payroll Batch?";
                    },
                    title: function () {
                        return "Delete Payroll Batch";
                    },
                    subtitle: function () {
                        return "";
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                PayrollDAO.deleteBatch({paramId: session.id}).then(function () {
                    toastr.success("Payroll batch deleted.");
                    ctrl.retrievePayrollHistory();                    
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };
        initPage();
    }
    ;
    angular.module('xenon.controllers').controller('PayrollHistoryCtrl', ["$rootScope", "$location", "$modal", "PayrollDAO", "$timeout", "$state", "Page", PayrollHistoryCtrl]);
})();