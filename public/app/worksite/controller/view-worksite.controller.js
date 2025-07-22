(function () {
    function ViewWorksitesCtrl(WorksiteDAO, $rootScope, $stateParams, $state, $modal, $debounce, EmployeeDAO, InsurerDAO, Page, CareTypeDAO, PositionDAO) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        Page.setTitle("View Worksites");
        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        ctrl.worksiteList = [];
        var positionMap = {};

        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'name', order: 'asc', searchString: ''};
        ctrl.retrieveWorksites = retrieveWorksitesData;

        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveWorksites();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrieveWorksitesData, 500);
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
            ctrl.retrieveWorksites();
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

        function retrieveWorksitesData() {
            $rootScope.paginationLoading = true;
            ctrl.searchParams.subAction = ctrl.viewType;
            WorksiteDAO.retrieveAll(ctrl.searchParams).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }

                }); // showLoadingBar                
                if (res) {
                    ctrl.worksiteList = res;
                    if (res.length === 0) {
//                        $("#paginationButtons").remove();
//                        toastr.error("No data in the system.");
                    }
                    if (angular.equals({}, positionMap))
                        retrieveActivePositions();
                }

            }).catch(function (data, status) {
                toastr.error("Failed to retrieve worksites.");
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }
        
        ctrl.retrieveWorksites();

        ctrl.openEditModal = function (worksiteId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'worksite-info'),
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'WorksiteInfoCtrl as worksiteInfo',
                resolve: {
                    worksiteId: function () {
                        return worksiteId;
                    },
                    positionMap: function () {
                        return positionMap;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };

        ctrl.openStatusChangeModal = function (worksite, status) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to " + (status === "active" ? "enable" : "disable") + " this worksite?";
                    },
                    title: function () {
                        return worksite.name;
                    },
                    subtitle: function () {
                        return worksite.phone;
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                WorksiteDAO.changestatus({id: worksite.id, status: status}).then(function () {
                    var length = ctrl.worksiteList.length;
                    for (var i = 0; i < length; i++) {
                        if (ctrl.worksiteList[i].id === worksite.id) {
                            if (ctrl.viewType !== 'all') {
                                ctrl.worksiteList.splice(i, 1);
                            } else {
                                ctrl.worksiteList[i].status = status === "active" ? "a" : "i";
                            }
                            break;
                        }
                    }
                    toastr.success("Worksite " + (status === "active" ? "enabled." : "disabled."));
                    ctrl.rerenderDataTable();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });

        };

        var retrieveActivePositions = function () {
            PositionDAO.retrieveAll({status: 'active'}).then(function (res) {
                var positions = angular.copy(res);
                angular.forEach(positions, function (position) {
                    positionMap[position.id] = position.position;
                });
            });
        };

        ctrl.rerenderDataTable = function () {
            if (ctrl.worksiteList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
            } else {
                ctrl.retrieveWorksites();
            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('ViewWorksitesCtrl', ["WorksiteDAO", "$rootScope", "$stateParams", "$state", "$modal", "$debounce", "EmployeeDAO", "InsurerDAO", "Page", "CareTypeDAO", "PositionDAO", ViewWorksitesCtrl]);
})();
