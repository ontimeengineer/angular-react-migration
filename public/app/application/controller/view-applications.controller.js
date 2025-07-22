(function () {
    function ViewApplicationsCtrl(ApplicationDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, PositionDAO) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.datatableObj = {};
        ctrl.baseUrl = ontime_data.weburl;
        Page.setTitle("View Applications");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        $rootScope.positions = {};
        ctrl.positionList = [];
        PositionDAO.retrieveAll({}).then(function (res) {
            ctrl.positionList = res;
        });
        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'dateInserted', order: 'desc', name: '', positionId: null};
        ctrl.applicationList = [];

        if ($stateParams.status !== 'in-progress' && $stateParams.status !== 'need-more-info'
                && $stateParams.status !== 'ready-for-orientation') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        ctrl.retrieveApplications = retrieveApplicationsData;

        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveApplications();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrieveApplicationsData, 500);
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
            ctrl.retrieveApplications();
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

        function retrieveApplicationsData() {
            $rootScope.paginationLoading = true;
            ctrl.searchParams.subAction = ctrl.viewType;
            ApplicationDAO.retrieveAll(ctrl.searchParams).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.applicationList = res;
                if (res.length === 0) {
//                    $("#paginationButtons").remove();
//                    toastr.error("No data in the system.");
                }
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve applications.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.retrieveApplications();

        ctrl.openNotesModal = function (applicationId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'notes-modal'),
                size: "lg",
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'NotesCtrl as notes',
                resolve: {
                    userId: function () {
                        return applicationId;
                    },
                    type: function () {
                        return 'application';
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };

        ctrl.openDeleteModal = function (application, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteApplicationModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deleteApplicationModel.application = application;

            $rootScope.deleteApplicationModel.delete = function (application) {
                $rootScope.maskLoading();
                ApplicationDAO.delete({id: application.applicationId}).then(function (res) {
                    var length = ctrl.applicationList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.applicationList[i].applicationId === application.applicationId) {
                            ctrl.applicationList.splice(i, 1);
                            break;
                        }
                    }
                    ctrl.rerenderDataTable();
                    toastr.success("Application deleted.");
                    $rootScope.deleteApplicationModel.close();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                    $rootScope.deleteApplicationModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };

        };
        ctrl.rerenderDataTable = function () {
            if (ctrl.applicationList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
//                ctrl.retrieveApplications();
            } else {
                ctrl.retrieveApplications();
            }
        };
        ctrl.openDeactivateModal = function (employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deactivateEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deactivateEmployeeModel.employee = employee;

            ApplicationDAO.checkFutureSchedules({employeeId: employee.id}).then(function (res) {
                if (res.data === true) {
                    $rootScope.deactivateEmployeeModel.showWarningMessage = true;
                }
            });

            $rootScope.deactivateEmployeeModel.deactivate = function (employee) {

                if ($('#popup_dea_employees')[0].checkValidity()) {
                    $rootScope.maskLoading();
                    ApplicationDAO.changestatus({id: employee.id, status: 'inactive',
                        reason: $rootScope.deactivateEmployeeModel.reason,
                        note: $rootScope.deactivateEmployeeModel.note,
                        terminationDate: $rootScope.deactivateEmployeeModel.terminationDate}).then(function (res) {
                        var length = ctrl.applicationList.length;

                        for (var i = 0; i < length; i++) {
                            if (ctrl.applicationList[i].id === employee.id) {
                                if (ctrl.viewType !== 'all') {
                                    ctrl.applicationList.splice(i, 1);
                                } else {
                                    ctrl.applicationList[i].status = 'i';
                                }
                                break;
                            }
                        }
                        ctrl.rerenderDataTable();
                        toastr.success("Application deactivated.");
                        $rootScope.deactivateEmployeeModel.close();
                    }
                    ).catch(function (data, status) {
                        toastr.error("Application cannot be deactivated.");
                        $rootScope.deactivateEmployeeModel.close();
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });

                }

            };
        };
        ctrl.openActivateModal = function (employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.activateEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.activateEmployeeModel.employee = employee;

            $rootScope.activateEmployeeModel.activate = function (employee) {

                $rootScope.maskLoading();
                ApplicationDAO.changestatus({id: employee.id, status: 'active'}).then(function (res) {
                    var length = ctrl.applicationList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.applicationList[i].id === employee.id) {
                            if (ctrl.viewType !== 'all') {
                                ctrl.applicationList.splice(i, 1);
                            } else {
                                ctrl.applicationList[i].status = 'a';
                            }
                            break;
                        }
                    }
                    ctrl.rerenderDataTable();
                    toastr.success("Application activated.");
                    $rootScope.activateEmployeeModel.close();
                }).catch(function (data, status) {
                    toastr.error("Application cannot be activated.");
                    $rootScope.activateEmployeeModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };
        };

        ctrl.openApplicationViewOnly = function (applicationId) {
            var url = $state.href('applications-single-tab', {id: applicationId});
            var params = [
                'height=' + screen.height,
                'width=' + screen.width,
                'location=0',
                'fullscreen=yes' // only works in IE, but here for completeness
            ].join(',');
            var newwindow = window.open(url, applicationId, params);
            if (window.focus) {
                newwindow.moveTo(0, 0);
                newwindow.focus();
            }
            newwindow.onunload = function () {
                if (newwindow.location != "about:blank") {
                    $rootScope.maskLoading();
                    ctrl.rerenderDataTable();
                }
            };
        }

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

        ctrl.openApproveApplicationModal = function (application) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('application', 'application-approve'),
                size: "lg",
                backdrop: false,
                keyboard: false,
                controller: 'ApplicationApproveCtrl as applicationApprove',
                resolve: {
                    application: function () {
                        return application;
                    }
                }
            });
            modalInstance.result.then(function () {
                ctrl.rerenderDataTable();
            });
        };
        
        ctrl.openReviewApplicationModal = function (application, action) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('application', 'review-application'),
                size: "md",
                backdrop: false,
                keyboard: false,
                controller: 'ReviewApplicationCtrl as reviewApplication',
                resolve: {
                    application: function () {
                        return application;
                    },
                    action: function() {
                        return action;
                    }
                }
            });
            modalInstance.result.then(function () {
                ctrl.rerenderDataTable();
            });
        };
    }
    ;
    angular.module('xenon.controllers').controller('ViewApplicationsCtrl', ["ApplicationDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "PositionDAO", ViewApplicationsCtrl]);
})();