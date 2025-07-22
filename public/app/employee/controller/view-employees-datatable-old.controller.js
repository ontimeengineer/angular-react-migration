(function() {
    function ViewEmployeesCtrl(EmployeeDAO, $rootScope, $stateParams, $state, $modal, Page, $compile, $timeout) {
        var ctrl = this;
        ctrl.datatableObj = {};
        $rootScope.selectEmployeeModel = {};
        Page.setTitle("View Employees");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;

        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        ctrl.retrieveEmployees = retrieveEmployeesData;
        ctrl.edit = edit;

        function retrieveEmployeesData() {
            $rootScope.maskLoading();
            EmployeeDAO.retrieveAll({subAction: ctrl.viewType}).then(function(res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function() {
                    }
                }); // showLoadingBar
                ctrl.employeeList = res;
                if (res.length === 0) {
                    toastr.error("No data in the system.");
                }
            }).catch(function(data, status) {
                toastr.error("Failed to retrieve employees.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function() {

                    }
                }); // showLoadingBar
//                ctrl.employeeList = ontime_data.employees;
                console.log('Error in retrieving data')
            }).then(function() {
                $rootScope.unmaskLoading();
            });
        }

        function edit(employee) {
            $state.go('app.employee.tab1', {id: employee.id});
        }

        ctrl.retrieveEmployees();
        ctrl.openEditModal = function(employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.selectEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.selectEmployeeModel.baseUrl = ctrl.baseUrl;
            $rootScope.selectEmployeeModel.companyCode = ctrl.companyCode;
            $rootScope.selectEmployeeModel.employee = angular.copy(employee);
            if (employee.languageSpoken != null && employee.languageSpoken.length > 0) {
                $rootScope.selectEmployeeModel.employee.languageSpoken = employee.languageSpoken.split(",");
            }

        };

        ctrl.openDeleteModal = function(employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deleteEmployeeModel.employee = employee;

            $rootScope.deleteEmployeeModel.delete = function(employee) {
                $rootScope.maskLoading();
                EmployeeDAO.delete({id: employee.id}).then(function(res) {
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
                }).catch(function(data, status) {
                    toastr.error(data.data);
                    $rootScope.deleteEmployeeModel.close();
                }).then(function() {
                    $rootScope.unmaskLoading();
                });
            };

        };
        ctrl.rerenderDataTable = function() {
            var pageInfo = ctrl.datatableObj.page.info();
            var employeeList = angular.copy(ctrl.employeeList);
            ctrl.employeeList = [];
            $("#example-1_wrapper").remove();
            $timeout(function() {
                ctrl.employeeList = employeeList;
                $timeout(function() {
                    var pageNo = Number(pageInfo.page);
                    if (ctrl.datatableObj.page.info().pages <= pageInfo.page) {
                        pageNo--;
                    }
                    ctrl.datatableObj.page(pageNo).draw(false);
                }, 20);
            });
        };
        ctrl.openDeactivateModal = function(employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deactivateEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deactivateEmployeeModel.employee = employee;

            $rootScope.deactivateEmployeeModel.deactivate = function(employee) {
                $rootScope.maskLoading();
                EmployeeDAO.changestatus({id: employee.id, status: 'inactive'}).then(function(res) {
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
                ).catch(function(data, status) {
                    toastr.error("Employee cannot be deactivated.");
                    $rootScope.deactivateEmployeeModel.close();
                }).then(function() {
                    $rootScope.unmaskLoading();
                });
            };
        };
        ctrl.openActivateModal = function(employee, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.activateEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.activateEmployeeModel.employee = employee;

            $rootScope.activateEmployeeModel.activate = function(employee) {
                $rootScope.maskLoading();
                EmployeeDAO.changestatus({id: employee.id, status: 'active'}).then(function(res) {
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
                }).catch(function(data, status) {
                    toastr.error("Employee cannot be activated.");
                    $rootScope.activateEmployeeModel.close();
                }).then(function() {
                    $rootScope.unmaskLoading();
                });
            };
        };
        ctrl.getLanguagesFromCode = function(languageCodes) {
            if (languageCodes != null && languageCodes.length > 0) {
                languageCodes = languageCodes.split(",");
                var languageToDisplay = "";
                angular.forEach(languageCodes, function(code, index) {
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
    }
    ;
    angular.module('xenon.controllers').controller('ViewEmployeesCtrl', ["EmployeeDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$compile", "$timeout", ViewEmployeesCtrl]);
})();
