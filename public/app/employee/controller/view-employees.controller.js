(function () {
    function ViewEmployeesCtrl(EmployeeDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, PositionDAO) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.datatableObj = {};
        $rootScope.selectEmployeeModel = {};
        Page.setTitle("View Employees");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        $rootScope.positions = {};
        ctrl.positionList = [];
        PositionDAO.retrieveAll({}).then(function (res) {
        ctrl.positionList = res;
            if (res && res.length > 0) {
                angular.forEach(res, function (position) {
                    $rootScope.positions[position.id] = position.position;
                });
            }
        });
        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'lName', order: 'asc', name: ''};
        ctrl.employeeList = [];
        ctrl.profileImage = {};

        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive'
                && $stateParams.status !== 'all' && $stateParams.status !== 'terminated') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        ctrl.retrieveEmployees = retrieveEmployeesData;

        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveEmployees();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrieveEmployeesData, 500);
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
            ctrl.retrieveEmployees();
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

        function retrieveEmployeesData() {
            $rootScope.paginationLoading = true;
            ctrl.searchParams.subAction = ctrl.viewType;
            if (ctrl.viewType === 'inactive') {
                ctrl.searchParams.terminated = false;
            } else if (ctrl.viewType === 'terminated') {
                ctrl.searchParams.terminated = true;
                ctrl.searchParams.subAction = 'inactive';
            }
            EmployeeDAO.retrieveAll(ctrl.searchParams).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.employeeList = res;
                if (res.length === 0) {
//                    $("#paginationButtons").remove();
//                    toastr.error("No data in the system.");
                }
                
        
                for (const employee of res) {
                    if (employee.profileImage != null && employee.profileImage != '') {
                        EmployeeDAO.downloadProfilePic({fileName: employee.profileImage, fileType: 'c'}).then(function (res) {
                            ctrl.profileImage[employee.profileImage] = res.signedUrl;
                        }).catch(function () {});
                    }
                    ctrl.profileImage[employee.profileImage] = "assets/images/user-5.png"
                }
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve employees.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
//                ctrl.employeeList = ontime_data.employees;
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.retrieveEmployees();
        ctrl.openEditModal = function (employee, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'employee-info'),
                size: "lg",
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'EmployeeInfoCtrl as employeeinfo',
                resolve: {
                    employeeId: function () {
                        return employee.id;
                    },
                    profileImage: function() {
                        return ctrl.profileImage[employee.profileImage]
                    }
                }
            });
            modalInstance.result.then(function (calledOnce) {
                if (calledOnce)
                    employee.newNotification = false;
                console.log("popup closed", calledOnce);
            });
        };

        ctrl.openNotesModal = function (employeeId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'notes-modal'),
                size: "lg",
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'NotesCtrl as notes',
                resolve: {
                    userId: function () {
                        return employeeId;
                    },
                    type: function () {
                        return 'employee';
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };

        ctrl.openSettingsModal = function (employeeId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'employee-settings-modal'),
                size: 'lg',
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'EmployeeSettingsCtrl as employeeSettings',
                resolve: {
                    employeeId: function () {
                        return employeeId;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };

        ctrl.openDeleteModal = function (employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deleteEmployeeModel.employee = employee;

            $rootScope.deleteEmployeeModel.delete = function (employee) {
                $rootScope.maskLoading();
                EmployeeDAO.delete({id: employee.id}).then(function (res) {
                    var length = ctrl.employeeList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.employeeList[i].id === employee.id) {
                            ctrl.employeeList.splice(i, 1);
                            break;
                        }
                    }
                    ctrl.rerenderDataTable();
                    toastr.success("Employee deleted.");
                    $rootScope.deleteEmployeeModel.close();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                    $rootScope.deleteEmployeeModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };

        };
        ctrl.rerenderDataTable = function () {
            if (ctrl.employeeList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
//                ctrl.retrieveEmployees();
            } else {
                ctrl.retrieveEmployees();
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

            EmployeeDAO.checkFutureSchedules({employeeId: employee.id}).then(function (res) {
                if (res.data === true) {
                    $rootScope.deactivateEmployeeModel.showWarningMessage = true;
                }
            });

            $rootScope.deactivateEmployeeModel.deactivate = function (employee) {

                if ($('#popup_dea_employees')[0].checkValidity()) {
                    $rootScope.maskLoading();
                    EmployeeDAO.changestatus({id: employee.id, status: 'inactive',
                        reason: $rootScope.deactivateEmployeeModel.reason,
                        note: $rootScope.deactivateEmployeeModel.note,
                        terminationDate: $rootScope.deactivateEmployeeModel.terminationDate}).then(function (res) {
                        var length = ctrl.employeeList.length;

                        for (var i = 0; i < length; i++) {
                            if (ctrl.employeeList[i].id === employee.id) {
                                if (ctrl.viewType !== 'all') {
                                    ctrl.employeeList.splice(i, 1);
                                } else {
                                    ctrl.employeeList[i].status = 'i';
                                }
                                break;
                            }
                        }
                        ctrl.rerenderDataTable();
                        toastr.success("Employee deactivated.");
                        $rootScope.deactivateEmployeeModel.close();
                    }
                    ).catch(function (data, status) {
                        toastr.error("Employee cannot be deactivated.");
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
                EmployeeDAO.changestatus({id: employee.id, status: 'active'}).then(function (res) {
                    var length = ctrl.employeeList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.employeeList[i].id === employee.id) {
                            if (ctrl.viewType !== 'all') {
                                ctrl.employeeList.splice(i, 1);
                            } else {
                                ctrl.employeeList[i].status = 'a';
                            }
                            break;
                        }
                    }
                    ctrl.rerenderDataTable();
                    toastr.success("Employee activated.");
                    $rootScope.activateEmployeeModel.close();
                }).catch(function (data, status) {
                    toastr.error("Employee cannot be activated.");
                    $rootScope.activateEmployeeModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };
        };

        ctrl.openNotes = function (employee, modal_id, modal_size, modal_backdrop) {

            $rootScope.employeeNotesModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.employeeNotesModel.addNote = function () {

                if ($('#NotesData')[0].checkValidity()) {
                    $rootScope.maskLoading();
                    EmployeeDAO.addNotes(
                            {employeeId: employee.id,
                                note: {note: $rootScope.employeeNotesModel.note}}).then(function (res) {
                        ctrl.rerenderDataTable();
                        toastr.success("Note added.");
                        $rootScope.employeeNotesModel.close();
                    }
                    ).catch(function (data, status) {
                        toastr.error("Note cannot be added.");
                        $rootScope.employeeNotesModel.close();
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });

                }
            };

            $rootScope.employeeNotesModel.dismiss = function () {
                $rootScope.employeeNotesModel.close();
            };
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

//        
//        $scope.$watch(function() {
//            return ctrl.viewType;
//        }, function(newVal, oldValue) {
//            ctrl.employeeList = [];
//            ctrl.retrieveEmployees();
        //        });
    };
    angular.module('xenon.controllers').controller('ViewEmployeesCtrl', ["EmployeeDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "PositionDAO", ViewEmployeesCtrl]);
})();