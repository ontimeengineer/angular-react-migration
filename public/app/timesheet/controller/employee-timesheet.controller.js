(function () {
    function EmployeeTimeSheetCtrl($scope, $rootScope, TimesheetDAO, EmployeeDAO, $modal, $timeout, PositionDAO, Page, $filter) {
        var ctrl = this;
        Page.setTitle("Employee Timesheet");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.criteriaSelected = false;
        ctrl.employeeIdMap = {};
        ctrl.employeeList = [];

        $rootScope.positions = {};
        PositionDAO.retrieveAll({}).then(function (res) {
            if (res && res.length > 0) {
                angular.forEach(res, function (position) {
                    $rootScope.positions[position.id] = position.position;
                });
            }
        });
        //method is called when page is changed
        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveTimesheet();
        };

        //to apply sorting and manage variables
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
            ctrl.retrieveTimesheet();
        };

        //to maintain sorting class dynamically
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

        ctrl.resetFilters = function () {
            ctrl.searchParams = {limit: 10, pageNo: 1};
            ctrl.searchParams.startDate = null;
            ctrl.searchParams.endDate = null;
            $('#sboxit-2').select2('val', null);
            ctrl.selectedEmployee = null;
            ctrl.searchParams.employeeId = null;
            localStorage.removeItem('employeeTimesheetSearchParams');
            ctrl.timesheetList = [];
            ctrl.criteriaSelected = false;
            ctrl.formSubmitted = false;
        };

        ctrl.rerenderDataTable = function () {
            if (ctrl.timesheetList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
            } else {
                ctrl.retrieveTimesheet();
            }
        };

        ctrl.filterTimesheet = function () {
            if (ctrl.searchParams.employeeId && ctrl.searchParams.employeeId !== null) {
                if (!ctrl.searchParams.startDate || ctrl.searchParams.startDate == "") {
                    ctrl.searchParams.startDate = null;
                }
                if (!ctrl.searchParams.endDate || ctrl.searchParams.endDate == "") {
                    ctrl.searchParams.endDate = null;
                }
                if (ctrl.searchParams.startDate !== null) {
                    ctrl.criteriaSelected = true;
                    ctrl.retrieveTimesheet();
                } else {
                    ctrl.criteriaSelected = false;
                    ctrl.timesheetList = [];
                    ctrl.dataRetrieved = false;
                }
            } else {
                ctrl.timesheetList = [];
                ctrl.criteriaSelected = false;
                ctrl.dataRetrieved = false;
            }
        };
        ctrl.retrieveTimesheet = function () {
            $scope.hideDefaultImage = false;
            $rootScope.paginationLoading = true;
            if (ctrl.searchParams.employeeId !== null) {
                ctrl.selectedEmployee = ctrl.employeeIdMap[ctrl.searchParams.employeeId];
            }
            TimesheetDAO.retrieveEmployeeTimeSheet(ctrl.searchParams).then(function (res) {
                ctrl.dataRetrieved = true;
                ctrl.timesheetList = JSON.parse(res.data);
                ctrl.totalRecords = Number(res.headers.count);
                localStorage.setItem('employeeTimesheetSearchParams', JSON.stringify(ctrl.searchParams));
                angular.forEach(ctrl.timesheetList, function (obj) {
                    obj.roundedPunchInTime = Date.parse(obj.roundedPunchInTime);
                    obj.roundedPunchOutTime = Date.parse(obj.roundedPunchOutTime);
                    if (obj.scheduleId && !obj.unauthorizedTime) {
                        obj.ut = $filter('ut')(obj.scheduleId.roundedStartTime, obj.scheduleId.roundedEndTime, obj.roundedPunchInTime, obj.roundedPunchOutTime);
                    }
                    if(obj.scheduleId){
                        obj.scheduleId.roundedStartTime = Date.parse(obj.scheduleId.roundedStartTime);
                        obj.scheduleId.roundedEndTime = Date.parse(obj.scheduleId.roundedEndTime);
                    }
                });
            }).catch(function () {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                //                ctrl.timesheetList = ontime_data.employeeTimesheet;
            }).then(function () {
                if (ctrl.searchParams.employeeId !== null) {
                    $scope.hideDefaultImage = true;
                }
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        };

        retrieveEmployeesData();
        function retrieveEmployeesData() {
            $rootScope.maskLoading();
            EmployeeDAO.retrieveAll({subAction: 'all'}).then(function (res) {
                ctrl.employeeList = res;
                ctrl.employeeIdMap = {};
                for (var i = 0; i < res.length; i++) {
                    ctrl.employeeIdMap[res[i].id] = res[i];
                }
                var params = localStorage.getItem('employeeTimesheetSearchParams');
                if (params !== null) {
                    ctrl.searchParams = JSON.parse(params);
                    $timeout(function () {
                        $("#sboxit-2").select2("val", ctrl.searchParams.employeeId);
                    }, 300);
                    ctrl.filterTimesheet();
                } else {
                    ctrl.resetFilters();
                    $rootScope.unmaskLoading();
                }
            }).catch(function (data, status) {
                $rootScope.unmaskLoading();
                //                ctrl.employeeList = ontime_data.employees;
            });
        }
        ;
        ctrl.openTaskListModal = function (modal_id, modal_size, modal_backdrop, tasks) {
            ctrl.taskListModalOpen = true;
            $rootScope.taskListModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            //            $rootScope.taskListModal.taskList = [{label: "Slicing", value: false}, {label: "WooCommerce", value: true}, {label: "Programming", value: false}, {label: "SEO Optimize", value: true}];
            $rootScope.taskListModal.taskList = tasks;

        };


        ctrl.openDeleteModal = function (punchObj, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deletePunchModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deletePunchModal.punchObj = punchObj;

            $rootScope.deletePunchModal.delete = function (punchObj) {
                $rootScope.maskLoading();
                if (punchObj.isMissedPunch) {
                    TimesheetDAO.deleteMissedPunch({id: punchObj.id}).then(function (res) {
                        var length = ctrl.timesheetList.length;

                        for (var i = 0; i < length; i++) {
                            if (ctrl.timesheetList[i].id === punchObj.id) {
                                ctrl.timesheetList.splice(i, 1);
                                break;
                            }
                        }
                        ctrl.rerenderDataTable();
                        toastr.success("Punch record deleted.");
                        $rootScope.deletePunchModal.close();
                    }).catch(function (data, status) {
                        toastr.error("Failed to delete punch record.");
                        $rootScope.deletePunchModal.close();
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                } else {
                    TimesheetDAO.delete({id: punchObj.id}).then(function (res) {
                        var length = ctrl.timesheetList.length;

                        for (var i = 0; i < length; i++) {
                            if (ctrl.timesheetList[i].id === punchObj.id) {
                                ctrl.timesheetList.splice(i, 1);
                                break;
                            }
                        }
                        ctrl.rerenderDataTable();
                        toastr.success("Timesheet record deleted.");
                        $rootScope.deletePunchModal.close();
                    }).catch(function (data, status) {
                        toastr.error("Failed to delete punch record.");
                        $rootScope.deletePunchModal.close();
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                }
            };

        };
        
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

        ctrl.openUTModal = function (timesheet, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.utModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.utModal.companyCode = ontime_data.company_code;
            $rootScope.utModal.baseUrl = ontime_data.weburl;
            $rootScope.utModal.docFileObj = {};
            $rootScope.utModal.cancel = function () {
                $rootScope.utModal.close();
            };
            $rootScope.utModal.approve = function () {
                $rootScope.maskLoading();
                TimesheetDAO.approveUT($rootScope.utModal.obj).then(function (res) {
                    ctrl.rerenderDataTable();
                    toastr.success("Unauthorized Time approved.");
                    $rootScope.utModal.close();
                }).catch(function (data, status) {
                    toastr.error("Failed to approve Unsauthorized time.");
                    $rootScope.unmaskLoading();
                    $rootScope.utModal.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };
            $rootScope.utModal.documentUploadFile = {
                target: ontime_data.weburl + 'file/upload',
                chunkSize: 1024 * 1024 * 1024,
                testChunks: false,
                fileParameterName: "fileUpload",
                singleFile: true,
                headers: {
                    type: "u",
                    company_code: ontime_data.company_code
                }
            };
            //When file is selected from browser file picker
            $rootScope.utModal.documentFileSelected = function (file, flow) {
                $rootScope.utModal.docFileObj.flowObj = flow;
                $rootScope.utModal.docFileObj.flowObj.upload();
            };
            //When file is uploaded this method will be called.
            $rootScope.utModal.documentFileUploaded = function (response, file, flow) {
                if (response != null) {
                    response = JSON.parse(response);
                    if (response.fileName != null && response.status != null && response.status == 's') {
                        $rootScope.utModal.obj.unauthorizedDocument = response.fileName;
                    }
                }
                $rootScope.utModal.disableDocumentUploadButton = false;
            };
            $rootScope.utModal.documentFileError = function ($file, $message, $flow) {
                $flow.cancel();
                $rootScope.utModal.obj.unauthorizedDocument = null;
                $rootScope.utModal.disableDocumentUploadButton = false;
                $rootScope.utModal.docFileObj.errorMsg = "File cannot be uploaded";
            };
            //When file is added in file upload
            $rootScope.utModal.documentFileAdded = function (file, flow) { //It will allow all types of attahcments'
                $rootScope.utModal.formDirty = true;
                $rootScope.utModal.documentUploadFile.headers.fileExt = file.getExtension();
                if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                    $rootScope.utModal.obj.errorMsg = "Please upload a valid file.";
                    return false;
                } else {
                    $("#cropper-example-2-modal").modal('show');
                }

                $rootScope.utModal.docFileObj.errorMsg = null;
                $rootScope.utModal.docFileObj.flow = flow;
                return true;
            };
            $rootScope.utModal.clearDocument = function () {
                if ($rootScope.utModal.obj.unauthorizedDocument != null) {
                    $rootScope.utModal.obj.unauthorizedDocument = null;
                }
                if ($rootScope.utModal.docFileObj.flowObj != null) {
                    $rootScope.utModal.docFileObj.flowObj.cancel();
                }
            };
            $rootScope.utModal.obj = {id: timesheet.id, unauthorizedTime: timesheet.ut, forPayroll: false, forBilling: false, isMissedPunch: timesheet.isMissedPunch};
        };
    }
    ;
    angular.module('xenon.controllers').controller('EmployeeTimeSheetCtrl', ["$scope", "$rootScope", "TimesheetDAO", "EmployeeDAO", "$modal", "$timeout", "PositionDAO", "Page", "$filter", EmployeeTimeSheetCtrl]);
})();