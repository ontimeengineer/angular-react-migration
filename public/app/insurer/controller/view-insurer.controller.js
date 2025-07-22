(function() {
    function ViewInsurersCtrl(InsurerDAO, $rootScope, $debounce, $state, $modal, Page) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.retrieveInsurers = retrieveInsurersData;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        Page.setTitle("View Insurance Providers");

        ctrl.insurerList = [];

        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'insuranceName', order: 'asc', insuranceName: ''};
        
        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveInsurers();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrieveInsurersData, 500);
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
            ctrl.retrieveInsurers();
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
        
        function retrieveInsurersData() {
            $rootScope.paginationLoading = true;
            InsurerDAO.retrieveAll(ctrl.searchParams).then(function(res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function() {
                        if (res) {
                        }
                    }
                }); // showLoadingBar
                ctrl.insurerList = res;
                if (res.length === 0) {
//                    $("#paginationButtons").remove();
//                    toastr.error("No data in the system.");
                }
            }).catch(function(data, status) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function() {

                    }
                }); // showLoadingBar
                toastr.error("Failed to retrieve Payer.");
//                ctrl.insurerList = ontime_data.insuranceProviders;
            }).then(function() {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }
        
        ctrl.openModal = function(insurer, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteInsurerModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deleteInsurerModel.insurer = insurer;

            $rootScope.deleteInsurerModel.delete = function(insurer) {
                $rootScope.maskLoading();
                InsurerDAO.delete({id: insurer.id}).then(function(res) {
                    var length = ctrl.insurerList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.insurerList[i].id === insurer.id) {
                            ctrl.insurerList.splice(i, 1);
                            break;
                        }
                    }
                    ctrl.rerenderDataTable();
                    toastr.success("Payer deleted.");
                    $rootScope.deleteInsurerModel.close();
                }).catch(function(data, status) {
                    toastr.error(data.data);
                    $rootScope.deleteInsurerModel.close();
                }).then(function() {
                    $rootScope.unmaskLoading();
                });
            };

        };
        ctrl.rerenderDataTable = function() {
            if (ctrl.insurerList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
            } else {
                ctrl.retrievePatients();
            }
        };
        ctrl.openEditModal = function(insurer, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.selectInsurerModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.selectInsurerModel.planTypeMap = {"mcd": "Medicaid", "mcr": "Medicare", "tc": "Tricare Champus", "cva": "ChampVA", "gh": "Group Healthplan", "fbl": "Feca Black Lung", "bc": "Blue Cross", "bs": "Blue Shield", "bcb": "Blue Cross/Blue Sheild (BCBS)", "oth": "Other"};
            $rootScope.selectInsurerModel.insurer = insurer;

        };
        ctrl.retrieveInsurers();
    }
    ;
    angular.module('xenon.controllers').controller('ViewInsurersCtrl', ["InsurerDAO", "$rootScope", "$debounce", "$state", "$modal", "Page", ViewInsurersCtrl]);
})();