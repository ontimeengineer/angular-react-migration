(function () {
    function ViewDispatchCtrl(DispatchDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, PositionDAO) {
        console.log("ViewDispatchCtrl");
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.datatableObj = {};
        Page.setTitle("View Dispatch");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'dispatchCreatedOn', order: 'desc'};

        ctrl.navigateToDispatchDetails = function(id){
            $state.go('app.dispatch-info', {'id': id})
        }
        
        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
            if (ctrl.viewType == 'inactive') {
                ctrl.searchParams.status = 'inactive';
            }else if (ctrl.viewType == 'all') {
                ctrl.searchParams.status = "";
            }
        }


        ctrl.dispatchList = [];

        ctrl.retrieveDispatchList = retrieveDispatchListData;

        ctrl.pageChanged = function (pagenumber) {
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveDispatchList();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrieveDispatchListData, 500);
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
            ctrl.retrieveDispatchList();
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

        function retrieveDispatchListData() {
            $rootScope.paginationLoading = true;
            if (ctrl.viewType == 'active') {
                ctrl.searchParams.status = 'active';
            }
            DispatchDAO.retrieveAll(ctrl.searchParams).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.dispatchList = res;
                if (res.length === 0) {
//                    $("#paginationButtons").remove();
//                    toastr.error("No data in the system.");
                }
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve employees.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
//                ctrl.dispatchList = ontime_data.employees;
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.retrieveDispatchList();

        ctrl.rerenderDataTable = function () {
            if (ctrl.dispatchList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
//                ctrl.retrieveDispatchList();
            } else {
                ctrl.retrieveDispatchList();
            }
        };

        ctrl.getLanguagesFromCode = function (languageCodes) {
            if (languageCodes != null && languageCodes.length > 0) {
                languageCodes = languageCodes.split(",");
                var languageToDisplay = "";
                angular.forEach(languageCodes, function (code, index) {
                    languageToDisplay += $rootScope.languages[code];
                    if (index < languageCodes.length - 1) {
                        languageToDisplay += ", ";
                    }
                });
                return languageToDisplay;
            } else {
                return "N/A";
            }
        };

        ctrl.openDeleteModal = function (dispatch)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to delete this Dispatch?";
                    },
                    title: function () {
                        return dispatch.patientName;
                    },
                    subtitle: function () {
                        return dispatch.careType;
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                DispatchDAO.delete({id: dispatch.id}).then(function () {
                    var length = ctrl.dispatchList.length;
                    for (var i = 0; i < length; i++) {
                        if (ctrl.dispatchList[i].id === dispatch.id) {
                            ctrl.dispatchList.splice(i, 1);
                            break;
                        }
                    }
                    toastr.success("Dispatch deleted.");
                    ctrl.rerenderDataTable();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };

        ctrl.openStatusModal = function (dispatch, status)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to " + (status === "active" ? "activate" : "deactivate") + " this Dispatch?";
                    },
                    title: function () {
                        return dispatch.patientName;
                    },
                    subtitle: function () {
                        return dispatch.careType;
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                DispatchDAO.changestatus({id: dispatch.id, status: status}).then(function () {
                    var length = ctrl.dispatchList.length;
                    for (var i = 0; i < length; i++) {
                        if (ctrl.dispatchList[i].id === dispatch.id) {
                            ctrl.dispatchList[i].status = status;
                            break;
                        }
                    }
                    toastr.success("Dispatch " + (status === "active" ? "activated." : "deactivated."));
                    ctrl.rerenderDataTable();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };


    }
    ;
    angular.module('xenon.controllers').controller('ViewDispatchCtrl', ["DispatchDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "PositionDAO", ViewDispatchCtrl]);
})();
