(function () {
    function ViewDispatchInfoCtrl(EmployeeDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, PositionDAO, DispatchDAO, InsurerDAO, $timeout) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.datatableObj = {};
        Page.setTitle("Dispatch Details");
        ctrl.employeeDispatchResponses = ontime_data.employee_dispatch_responses;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        $rootScope.positions = {};

        var insuranceProviderMap = [];
        var nursingCareMap = [];
        var staffCoordinatorMap = [];

        PositionDAO.retrieveAll({}).then(function (res) {
            if (res && res.length > 0) {
                angular.forEach(res, function (position) {
                    $rootScope.positions[position.id] = position.position;
                });
            }
        });

        ctrl.searchParams = {};
        ctrl.viewRecords = 10;

        ctrl.employeeList = [];

        ctrl.retrieveDispatch = function(){
            DispatchDAO.get({id: $state.params.id}).then(function (res) {
                ctrl.dispatchInfo = angular.copy(res);
                var employeeList = [];

                var noResponseEmployeeList = [];
                var interestedEmployeeList = [];
                var notInterestedEmployeeList = [];
                for (var i = 0; i < res.employeeDispatchResponses.length; i++) {
                    if (ctrl.employeeDispatchResponses[res.employeeDispatchResponses[i].responseStatus] == 'Interested') {
                        interestedEmployeeList.push(res.employeeDispatchResponses[i]);
                    } else if (ctrl.employeeDispatchResponses[res.employeeDispatchResponses[i].responseStatus] == 'Not Interested') {
                        notInterestedEmployeeList.push(res.employeeDispatchResponses[i]);
                    } else {
                        noResponseEmployeeList.push(res.employeeDispatchResponses[i]);
                    }
                }
                var sortedNoResponseEmployeeList = _(noResponseEmployeeList).chain()
                        .sortBy('employeeName')
                        .value();
                var sortedInterestedEmployeeList = _(interestedEmployeeList).chain()
                        .sortBy('dateUpdated')
                        .value();
                var sortedNotInterestedEmployeeList = _(notInterestedEmployeeList).chain()
                        .sortBy('dateUpdated')
                        .value();
                employeeList = employeeList.concat(sortedInterestedEmployeeList);
                employeeList= employeeList.concat(sortedNotInterestedEmployeeList);
                employeeList=employeeList.concat(sortedNoResponseEmployeeList);
                console.log(employeeList.length)
                ctrl.employees = employeeList;
//                $rootScope.unmaskLoading();
                ctrl.rerenderDataTable();
            });
        };
        if ($state.params.id && $state.params.id !== '') {
            ctrl.processdMode = true;
            ctrl.retrieveDispatch();
        } else {
            ctrl.processdMode = false;
        }

        ctrl.changeViewRecords = function () {
            ctrl.datatableObj.page.len(ctrl.viewRecords).draw();
        };

        ctrl.rerenderDataTable = function () {
            var pageInfo;
            if (ctrl.datatableObj.page != null) {
                pageInfo = ctrl.datatableObj.page.info();
            }
            var employees = angular.copy(ctrl.employees);
            ctrl.employees = [];
            $("#example-1_wrapper").remove();

            $timeout(function () {
                ctrl.employees = employees;
                $timeout(function () {
                    $("#example-1").wrap("<div class='table-responsive scroll'></div>");
                }, 50);
                if (pageInfo != null) {
                    $timeout(function () {
                        var pageNo = Number(pageInfo.page);
                        if (ctrl.datatableObj.page.info().pages <= pageInfo.page) {
                            pageNo--;
                        }
                        ctrl.datatableObj.page(pageNo).draw(false);
                    }, 20);
                }
                $rootScope.unmaskLoading();
            });
        };

//        ctrl.retrieveEmployees();
        ctrl.openEditModal = function (employeeId, modal_size, modal_backdrop)
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

        EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.NURSING_CARE_COORDINATOR}).then(function (res) {
            if (res.length !== 0) {
                for (var i = 0; i < res.length; i++) {
                    nursingCareMap[res[i].id] = res[i].label;
                }
            }
        }).catch(function () {
            toastr.error("Failed to retrieve nursing care list.");
        });

        EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.STAFFING_COORDINATOR}).then(function (res) {
            if (res.length !== 0) {
                for (var i = 0; i < res.length; i++) {
                    staffCoordinatorMap[res[i].id] = res[i].label;
                }
            }
        }).catch(function () {
            toastr.error("Failed to retrieve staff coordinator list.");
        });

        InsurerDAO.retrieveAll().then(function (res) {
            if (res.length !== 0) {
                for (var i = 0; i < res.length; i++) {
                    insuranceProviderMap[res[i].id] = res[i].insuranceName;
                }
            }
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });

        ctrl.openPatientInfoModal = function (patientId, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'patient-info'),
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'PatientInfoCtrl as Patientinfo',
                resolve: {
                    patientId: function () {
                        return patientId;
                    },
                    insuranceProviderMap: function () {
                        return insuranceProviderMap;
                    },
                    nursingCareMap: function () {
                        return nursingCareMap;
                    },
                    staffCoordinatorMap: function () {
                        return staffCoordinatorMap;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };

        ctrl.openDispatchInfoModal = function (modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('calendar', 'dispatch_info_modal'),
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'DispatchInfoModalCtrl as DispatchInfoModal',
                resolve: {
                    dispatch: function () {
                        return ctrl.dispatchInfo;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };

        ctrl.openDispatchResponseModel = function (index, responseObj, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('calendar', 'response_model'),
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'DispatchResponseCtrl as dispatchResponse',
                resolve: {
                    responseObj: function () {
                        return angular.copy(responseObj);
                    }
                }
            });
            modalInstance.result.then(function (employeeResponseUpdated) {
                if (employeeResponseUpdated) {
                    for (var i = 0; i < ctrl.employees.length; i++) {
                        if (ctrl.employees[i].id === employeeResponseUpdated.id) {
                            ctrl.employees[i] = employeeResponseUpdated;
                            ctrl.rerenderDataTable();
                            break;
                        }
                    }
                }
            });
        };

        ctrl.assignCase = function (emp) {
            var patientObj = {};
            function open() {
                $rootScope.unmaskLoading();
                ctrl.patientPopup = $modal.open({
                    templateUrl: 'app/calendar/views/dispatch_info_case_modal.html',
                    controller: 'DispatchInfoCaseModalCtrl as caseModal',
                    size: 'lg',
                    backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                    keyboard: false,
                    resolve: {
                        dispatchInfo: function () {
                            return ctrl.dispatchInfo;
                        },
                        empId: function () {
                            return emp.employeeId;
                        }
                    }
                });

                ctrl.patientPopup.result.then(function (saved) {
                    if (saved) {
                        ctrl.retrieveDispatch();
                    }
                });
            }
            ;
            $rootScope.maskLoading();
            open();

        };
    }
    ;
    angular.module('xenon.controllers').controller('ViewDispatchInfoCtrl', ["EmployeeDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "PositionDAO", "DispatchDAO", "InsurerDAO", "$timeout", ViewDispatchInfoCtrl]);
})();
