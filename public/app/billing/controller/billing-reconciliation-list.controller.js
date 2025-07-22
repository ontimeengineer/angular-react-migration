/* global ontime_data, _, $modal, appHelper */

(function () {
    function BillingReconciliationListCtrl($state, $debounce, $rootScope, $modal, BillingDAO) {
        var ctrl = this;
        ctrl.show = 'filtered';
        ctrl.currentDate = new Date();
        ctrl.viewRecords = 10;
        ctrl.datatableObj = {};
        ctrl.navigateToTab = navigateToTab;
        function navigateToTab() {
            $state.go(ctrl.type);
        }
        ctrl.searchParams = {limit: 10, pageNo: 1};
        
        ctrl.pageChanged = function (pagenumber) {
            ctrl.searchParams.pageNo = pagenumber;
            rerenderDataTable();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(rerenderDataTable, 500);
        };

        ctrl.applySorting = function (sortBy) {
            if (ctrl.searchParams.sortBy !== sortBy) {
                ctrl.searchParams.sortBy = sortBy;
                ctrl.searchParams.order = "asc";
            } else {
                if (ctrl.searchParams.order === "desc") {
                    ctrl.searchParams.order = "asc";
                } else {
                    ctrl.searchParams.order = "desc";
                }
            }
            rerenderDataTable();
        };

        ctrl.applySortingClass = function (sortBy) {
            if (ctrl.searchParams.sortBy !== sortBy) {
                return 'sorting';
            } else {
                if (ctrl.searchParams.order === "desc") {
                    return 'sorting_desc';
                } else {
                    return 'sorting_asc';
                }
            }
        };
                
        var rerenderDataTable = function () {
            $rootScope.paginationLoading = true;
            $rootScope.maskLoading();
            BillingDAO.searchReconciliations(ctrl.searchParams).then(function (res) {
                ctrl.reconciliationCount = Number(res.headers.reconciliationcount);
                ctrl.reconciliations = res.data;                
            }).catch(function (e) {
                if (e.data !== null) {
                    toastr.error(e.data);
                } else {
                    toastr.error("Reconcilliation cannot be retrieved.");
                }                
            }).then(function () {
                $rootScope.paginationLoading = false;
                $rootScope.unmaskLoading();
            });    
        };
        
        ctrl.viewReconciliation = function(){
            
        };
        
        ctrl.openDeleteModal = function (billingReconcilliation)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to delete this Reconcilliation?";
                    },
                    title: function () {
                        return 'Billing Reconcilliation';
                    },
                    subtitle: function () {
                        return;
                    }
                }
            });

            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                BillingDAO.deleteReconciliations({id: billingReconcilliation.id}).then(function (res) {   
                    ctrl.searchParams.pageNo = 1;
                    rerenderDataTable();
                    toastr.success("Reconcilliation deleted.");
                }).catch(function (data, status) {
                    toastr.error(data.data);                    
                }).then(function () {
                    $rootScope.unmaskLoading();
                    modalInstance.close();
                });
            });

        };
        
        rerenderDataTable();
    }
    angular.module('xenon.controllers').controller('BillingReconciliationListCtrl', ["$state", "$debounce", "$rootScope", "$modal","BillingDAO", BillingReconciliationListCtrl]);
})();
