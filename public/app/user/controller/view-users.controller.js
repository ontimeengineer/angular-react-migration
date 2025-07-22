(function () {
    function ViewUsersCtrl(UserDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, PositionDAO, $timeout, $formService) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.datatableObj = {};
        $rootScope.selectUserModel = {};
        Page.setTitle("View Users");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        $rootScope.positions = {};
        PositionDAO.retrieveAll({}).then(function (res) {
            if (res && res.length > 0) {
                angular.forEach(res, function (position) {
                    $rootScope.positions[position.id] = position.position;
                });
            }
        });
        ctrl.searchParams = {limit: 10, pageNo: 1, name: ''};
        ctrl.employeeList = [];
        ctrl.profileImage = {};

        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        ctrl.retrieveUsers = retrieveUsersData;

        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveUsers();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrieveUsersData, 500);
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
            ctrl.retrieveUsers();
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

        function retrieveUsersData() {
            $rootScope.paginationLoading = true;
            ctrl.searchParams.subAction = ctrl.viewType;
            UserDAO.retrieveAll(ctrl.searchParams).then(function (res) {
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

                for (const user of res) {
                    if (user.employee.profileImage != null && user.employee.profileImage != '') {
                        UserDAO.downloadProfilePic({fileName: user.employee.profileImage, fileType: 'c'}).then(function (res) {
                            ctrl.profileImage[user.employee.profileImage] = res.signedUrl;
                        }).catch(function () {});
                    }
                    ctrl.profileImage[user.employee.profileImage] = "assets/images/user-5.png"
                }
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve users.");
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

        ctrl.retrieveUsers();
        ctrl.openEditModal = function (employeeId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'employee-info'),
                size: 'lg',
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'EmployeeInfoCtrl as employeeinfo',
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

        ctrl.openDeleteModal = function (user, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteUserModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deleteUserModel.user = user;

            $rootScope.deleteUserModel.delete = function (user) {
                $rootScope.maskLoading();
                UserDAO.delete({id: user.id}).then(function (res) {
                    var length = ctrl.employeeList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.employeeList[i].id === user.id) {
                            ctrl.employeeList.splice(i, 1);
                            break;
                        }
                    }
                    ctrl.rerenderDataTable();
                    toastr.success("User deleted.");
                    $rootScope.deleteUserModel.close();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                    $rootScope.deleteUserModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };

        };
        ctrl.openActivateDeactivateModal = function (user, modal_id, action, modal_size, modal_backdrop)
        {
            $rootScope.activateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            
            $formService.resetRadios();
            $rootScope.activateModal.action = action;
            $rootScope.activateModal.user = user;
            
            if(user.employee.status == 'a')
                $rootScope.activateModal.activateEmployee = true;
            else if(user.employee.status == 'i')
                $rootScope.activateModal.activateEmployee = false;
            
            $rootScope.activateModal.confirm = function (user) {
                if (action == 'activate') {
                    ctrl.activateUser(user);
                } else {
                    ctrl.deactivateUser(user);
                }
            };

        };
        ctrl.rerenderDataTable = function () {
            if (ctrl.employeeList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
//                ctrl.retrieveUsers();
            } else {
                ctrl.retrieveUsers();
            }
        };

        ctrl.deactivateUser = function (employee, status)
        {
            $rootScope.maskLoading();
            var empStatus;
            if (employee.employee != null) {
                if ($rootScope.activateModal.activateEmployee == true) {
                    empStatus = 'activate';
                } else {
                    empStatus = 'deactivate';
                }
            }
            UserDAO.changestatus({id: employee.id, status: 'deactivate', employeeStatus: empStatus}).then(function (res) {
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
                toastr.success("User deactivated.");
            }
            ).catch(function (data, status) {
                toastr.error("User cannot be deactivated.");
            }).then(function () {
                $rootScope.activateModal.close();
                $rootScope.unmaskLoading();
            });
        };

        ctrl.activateUser = function (employee) {
            $rootScope.maskLoading();
            var empStatus;
            if (employee.employee != null) {
                if ($rootScope.activateModal.activateEmployee == true) {
                    empStatus = 'activate';
                } else {
                    empStatus = 'deactivate';
                }
            }
            UserDAO.changestatus({id: employee.id, status: 'activate', employeeStatus: empStatus}).then(function (res) {
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
                toastr.success("User activated.");
            }).catch(function (data, status) {
                toastr.error("User cannot be activated.");
            }).then(function () {
                $rootScope.activateModal.close();
                $rootScope.unmaskLoading();
            });
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

        ctrl.navigateToCalendar = function (employee) {
            $state.go('app.employee-calendar', {id: employee.id});
        };
        ctrl.openUserResetPasswordModal = function (user, modal_size, modal_backdrop)
        {
            $rootScope.resetUserPasswordModal = $modal.open({
                templateUrl: 'resetUserPasswordModal',
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.resetUserPasswordModal.user = user;
            $rootScope.resetUserPasswordModal.save = function () {
                $rootScope.maskLoading();
                UserDAO.resetUserPassword({userName: user.username, passwordType: "r"}).then(function (res) {
                    toastr.success("Instruction to reset password has been sent to " + user.employee.fName + " " + user.employee.lName);
                    setCookie("changePassword", false, 7);
                    $rootScope.resetUserPasswordModal.close();
                }).catch(function (data) {
                    if (data.data != null) {
                        toastr.error(data.data);
                    } else {
                        toastr.error("Password cannot be reset.");
                    }
                }).then(function () {
                    $rootScope.resetUserPasswordModal.close();
                    $rootScope.unmaskLoading();
                });
            };
        };
    }
    ;
    angular.module('xenon.controllers').controller('ViewUsersCtrl', ["UserDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "PositionDAO", "$timeout", "$formService", ViewUsersCtrl]);
})();