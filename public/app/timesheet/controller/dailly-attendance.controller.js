(function () {
    function DailyAttendanceCtrl($timeout, $rootScope, TimesheetDAO, EmployeeDAO, $modal, $location, Page, $filter, EventTypeDAO, PositionDAO, PatientDAO, InsurerDAO, $state, WorksiteDAO) {
        var ctrl = this;
        ctrl.signatureFile = [];
        ctrl.retrieveWorkSites = function () {
            WorksiteDAO.retreveWorksiteNames().then(function (res) {
                ctrl.workSiteList = res;
                var params;
                if (ctrl.isWorksiteTimesheet) {
                    params = localStorage.getItem('worksiteSearchParams');
                }
                if (params !== null) {
                    ctrl.searchParams = JSON.parse(params);
                }
                setTimeout(function () {
                    $("#worksiteDropdown").select2({
                        placeholder: 'Select Worksite...',
                    }).on('select2-open', function ()
                    {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                }, 200);
            });
        };
        if ($state.current.name.indexOf("worksite_time_sheet") >= 0) {
            ctrl.isWorksiteTimesheet = true;
            ctrl.lastPage = 'worksite_time_sheet';
            Page.setTitle("Worksite Timesheet");
            ctrl.retrieveWorkSites();
        } else {
            ctrl.lastPage = 'daily_attendance';
            Page.setTitle("Daily Attendance");
            ctrl.isWorksiteTimesheet = false;
        }
        ctrl.criteriaSelected = false;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.nursingCareMap = {};
        ctrl.staffCoordinatorMap = {};
        ctrl.insuranceProviderMap = {};
        $rootScope.positions = {};
        PositionDAO.retrieveAll({}).then(function (res) {
            if (res && res.length > 0) {
                angular.forEach(res, function (position) {
                    $rootScope.positions[position.id] = position.position;
                });
            }
        });
        EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.NURSING_CARE_COORDINATOR}).then(function (res) {
            if (res.length !== 0) {
                for (var i = 0; i < res.length; i++) {
                    ctrl.nursingCareMap[res[i].id] = res[i].label;
                }
            }
        }).catch(function () {
            toastr.error("Failed to retrieve nursing care list.");
        });
        EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.STAFFING_COORDINATOR}).then(function (res) {
            if (res.length !== 0) {
                for (var i = 0; i < res.length; i++) {
                    ctrl.staffCoordinatorMap[res[i].id] = res[i].label;
                }
            }
        }).catch(function () {
            toastr.error("Failed to retrieve staff coordinator list.");
        });
        InsurerDAO.retrieveAll().then(function (res) {
            if (res.length !== 0) {
                for (var i = 0; i < res.length; i++) {
                    ctrl.insuranceProviderMap[res[i].id] = res[i].insuranceName;
                }
            }
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        //method is called when page is changed
        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.commonRetrieve();
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
            ctrl.commonRetrieve();
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
            ctrl.searchParams = {limit: 10, pageNo: 1, isSchedule: false};
            ctrl.searchParams.startDate = null;
            ctrl.searchParams.endDate = null;
            $('#sboxit-2').select2('val', null);
            $('#worksiteDropdown').select2('val', null);
            ctrl.searchParams.staffingCordinatorId = null;
            if (ctrl.isWorksiteTimesheet) {
                localStorage.removeItem('worksiteSearchParams');
            } else {
                localStorage.removeItem('dailyAttendanceSearchParams');
                localStorage.removeItem('dailyAttendanceNoPunch');
            }
            ctrl.attendanceList = [];
            ctrl.signatureFile = [];
            ctrl.criteriaSelected = false;
        };

        ctrl.rerenderDataTable = function () {
            if (ctrl.attendanceList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
            } else {
                ctrl.commonRetrieve();
            }
        };

        //this is called on review button click. As It is checking for mandatory fields and reinitialize the pageNo
        ctrl.filterTimesheet = function () {
            ctrl.searchParams.pageNo = 1;
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
                ctrl.attendanceList = [];
                ctrl.signatureFile = [];
                ctrl.dataRetrieved = false;
            }
        }
        retrieveEmployeesData();
        function retrieveEmployeesData() {
            $rootScope.maskLoading();
            EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.NURSING_CARE_COORDINATOR + "," + ontime_data.positionGroups.STAFFING_COORDINATOR}).then(function (res) {
                ctrl.employeeList = res;
                var params;
                if (ctrl.isWorksiteTimesheet) {
                    params = localStorage.getItem('worksiteSearchParams');
                } else {
                    params = localStorage.getItem('dailyAttendanceSearchParams');
                }
                if (params !== null) {
                    ctrl.searchParams = JSON.parse(params);
                    $timeout(function () {
                        $("#sboxit-2").select2("val", ctrl.searchParams.staffingCordinatorId);
                    }, 300);
                    ctrl.commonFilter();
                } else {
                    ctrl.resetFilters();
                    $rootScope.unmaskLoading();
                }
            }).catch(function (data, status) {
                toastr.error("Could not load Coordinators");
                $rootScope.unmaskLoading();
//                ctrl.employeeList = ontime_data.employees;
            });
        }

        ctrl.retrieveTimesheet = function () {
            ctrl.searchParams.excludeWorksitePunch = !ctrl.isWorksiteTimesheet;
            $rootScope.paginationLoading = true;
            TimesheetDAO.retrieveAllDailyAttendance(ctrl.searchParams).then(function (res) {
                ctrl.attendanceList = JSON.parse(res.data);
                ctrl.totalRecords = Number(res.headers.count);
                if (ctrl.isWorksiteTimesheet) {
                    localStorage.setItem('worksiteSearchParams', JSON.stringify(ctrl.searchParams));
                } else {
                    localStorage.setItem('dailyAttendanceSearchParams', JSON.stringify(ctrl.searchParams));
                }
                angular.forEach(ctrl.attendanceList, function (obj) {
                    obj.roundedPunchInTime = Date.parse(obj.roundedPunchInTime);
                    obj.roundedPunchOutTime = Date.parse(obj.roundedPunchOutTime);
                    obj.punchInTimeInDate = Date.parse(obj.punchInTime);
                    obj.punchOutTimeInDate = Date.parse(obj.punchOutTime);
                    if (obj.scheduleId) {
                        obj.scheduleId.roundedStartTime = Date.parse(obj.scheduleId.roundedStartTime);
                        obj.scheduleId.roundedEndTime = Date.parse(obj.scheduleId.roundedEndTime);
                    }
                    if (obj.scheduleId && !obj.unauthorizedTime) {
                        obj.ut = $filter('ut')(obj.scheduleId.roundedStartTime, obj.scheduleId.roundedEndTime, obj.roundedPunchInTime, obj.roundedPunchOutTime);
                    }

                    if (obj.signature != null && obj.signature != '') {
                        TimesheetDAO.downloadSignature({fileName: obj.signature, fileType: 's'}).then(function (res) {
                            ctrl.signatureFile[obj.signature] = res.signedUrl;
                        }).catch(function () {});
                    }
                });
                ctrl.dataRetrieved = true;
            }).catch(function () {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                toastr.error("Could not load Daily Attendance");
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });

        };
        ctrl.openTaskListModal = function (modal_id, modal_size, modal_backdrop, tasks)
        {
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
                        var length = ctrl.attendanceList.length;

                        for (var i = 0; i < length; i++) {
                            if (ctrl.attendanceList[i].id === punchObj.id) {
                                ctrl.attendanceList.splice(i, 1);
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
                        var length = ctrl.attendanceList.length;

                        for (var i = 0; i < length; i++) {
                            if (ctrl.attendanceList[i].id === punchObj.id) {
                                ctrl.attendanceList.splice(i, 1);
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
                }
            };
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
                    $rootScope.utModal.docFileObj.errorMsg = "Please upload a valid file.";
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
        ctrl.openEmployeeModal = function (employeeId, modal_id, modal_size, modal_backdrop)
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

        ctrl.openPatientModal = function (patient, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'patient-info'),
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'PatientInfoCtrl as Patientinfo',
                resolve: {
                    patientId: function () {
                        return patient.id;
                    },
                    insuranceProviderMap: function () {
                        return ctrl.insuranceProviderMap;
                    },
                    nursingCareMap: function () {
                        return ctrl.nursingCareMap;
                    },
                    staffCoordinatorMap: function () {
                        return ctrl.staffCoordinatorMap;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };
        ctrl.filterSchedule = function () {
            ctrl.searchParams.pageNo = 1;
            if (!ctrl.searchParams.startDate || ctrl.searchParams.startDate == "") {
                ctrl.searchParams.startDate = null;
            }
            if (!ctrl.searchParams.endDate || ctrl.searchParams.endDate == "") {
                ctrl.searchParams.endDate = null;
            }
            if (ctrl.searchParams.startDate !== null) {
                ctrl.criteriaSelected = true;
                ctrl.retrieveSchedule();
            } else {
                ctrl.criteriaSelected = false;
                ctrl.attendanceList = [];
                ctrl.signatureFile = [];
                ctrl.dataRetrieved = false;
            }
        }
        ctrl.retrieveSchedule = function () {
            ctrl.searchParams.excludeWorksitePunch = !ctrl.isWorksiteTimesheet;
            $rootScope.paginationLoading = true;
            var params = angular.copy(ctrl.searchParams);
            params.fromDate = ctrl.searchParams.startDate;
            params.toDate = ctrl.searchParams.endDate;
            delete params.startDate;
            delete params.endDate;
//            delete params.staffingCordinatorId;
            params.dailyAttendance = true;
            EventTypeDAO.retrieveSchedules(params).then(function (res) {
                ctrl.attendanceList = JSON.parse(res.data);
                if (ctrl.isWorksiteTimesheet) {
                    localStorage.setItem('worksiteSearchParams', JSON.stringify(ctrl.searchParams));
                } else {
                    localStorage.setItem('dailyAttendanceSearchParams', JSON.stringify(ctrl.searchParams));
                }

                angular.forEach(ctrl.attendanceList, function (obj) {
                    delete obj.color;
                    if (!obj.timeSheet) {
                        //No Show - Red
                        var temp = $filter('duration')(obj.roundedStartTime, new Date());
                        if (temp) {
                            var t = temp.split(":");
                            var h = Number(t[0]);
                            var m = Number(t[1]);
                            if (h > 0 || (h === 0 && m > 30)) {
                                obj.color = "#F52226"; // red color
                            }
                        }
                    } else {
                        var temp = $filter('duration')(obj.roundedStartTime, obj.timeSheet.roundedPunchInTime);
                        obj.timeSheet.punchInTime = Date.parse(obj.timeSheet.punchInTime);
                        obj.timeSheet.punchOutTime = Date.parse(obj.timeSheet.punchOutTime);
                        obj.timeSheet.roundedPunchInTime = Date.parse(obj.timeSheet.roundedPunchInTime);
                        obj.timeSheet.roundedPunchOutTime = Date.parse(obj.timeSheet.roundedPunchOutTime);
                        obj.timeSheet.punchInTimeInDate = Date.parse(obj.timeSheet.punchInTime);
                        obj.timeSheet.punchOutTimeInDate = Date.parse(obj.timeSheet.punchOutTime);
                        var timesheetDuration;
                        var scheduleDuration;
                        obj.color = null;
                        if (obj.timeSheet.roundedPunchInTime && obj.timeSheet.roundedPunchOutTime) {
                            timesheetDuration = $filter('duration')(obj.timeSheet.roundedPunchInTime, obj.timeSheet.roundedPunchOutTime);
                        }
                        if (obj.roundedStartTime && obj.roundedEndTime) {
                            scheduleDuration = $filter('duration')(obj.roundedStartTime, obj.roundedEndTime);
                        }
                        //Insufficient hours worked - Pink
                        if (timesheetDuration != null && scheduleDuration != null) {
                            var t = timesheetDuration.split(":");
                            var timeSheetHours = Number(t[0]);
                            var timeSheetMins = Number(t[1]);
                            var s = scheduleDuration.split(":");
                            var scheduleHours = Number(s[0]);
                            var scheduleMins = Number(s[1]);
                            if (timeSheetHours < scheduleHours) {
                                obj.color = "#FACAE4"; // pink color
                            } else if (timeSheetHours === scheduleHours && timeSheetMins < scheduleMins) {
                                obj.color = "#FACAE4"; // pink color
                            }
                        }
                        //Purple- Forgot to punch out – no punch out
                        if (obj.color === null && !obj.timeSheet.punchOutTime) {
                            var temp1 = $filter('duration')(obj.roundedEndTime, new Date());
                            if (temp1) {
                                var t = temp1.split(":");
                                var h = Number(t[0]);
                                var m = Number(t[1]);
                                if (h > 0 || (h === 0 && m > 30)) {
                                    obj.color = "#b4a7d6"; // purple color
                                }
                            }
                        }
                        //Red(change To Bright Yellow)- Excessive lateness – 31 min and above 
                        if (obj.color === null && temp) {
                            var t = temp.split(":");
                            var h = Number(t[0]);
                            var m = Number(t[1]);
                            if (h > 0 || (h === 0 && m > 30)) {
                                obj.color = "#FAF334"; // Bright Yellow color
                            }
                        }
                        //Yellow(light yellow)- moderate lateness 8-30 min
                        if (obj.color === null && temp) {
                            var t = temp.split(":");
                            var h = Number(t[0]);
                            var m = Number(t[1]);
                            if (h === 0 && m > 8) {
                                obj.color = "#FAF9C0"; // yellow color
                            }
                        }
                        //Green- UT time greater than 60minutes, when approved it goes back to
                        if (timesheetDuration != null && scheduleDuration != null) {
                            var t = timesheetDuration.split(":");
                            var timeSheetInTime = (Number(t[0]) * 60) + Number(t[1]);
                            var s = scheduleDuration.split(":");
                            var scheduleInTime = (Number(s[0]) * 60) + Number(s[1]);

                            if (!obj.timeSheet.unauthorizedTime || obj.timeSheet.unauthorizedTime == null) {
                                if (timeSheetInTime - scheduleInTime > 60) {
                                    obj.color = "#AEEBAF"; // Green color
                                }
                            }
                        }
                        //Blue- Manual punch - highlights all punches that were made manually.
                        if (obj.color === null && !!obj.timeSheet.isManualPunch) {
                            obj.color = "#ABDBEB"; // blue color
                        }
                    }
                    obj.roundedStartTime = Date.parse(obj.roundedStartTime);
                    obj.roundedEndTime = Date.parse(obj.roundedEndTime);
                });
                ctrl.totalRecords = Number(res.headers.event_count);
                if (ctrl.isWorksiteTimesheet) {
                    localStorage.setItem('worksiteSearchParams', JSON.stringify(ctrl.searchParams));
                } else {
                    localStorage.setItem('dailyAttendanceSearchParams', JSON.stringify(ctrl.searchParams));
                }
                ctrl.dataRetrieved = true;
            }).catch(function () {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.error("Could not load Schedule");
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });

        };
        ctrl.resetCheckbox = function () {
            ctrl.searchParams.pageNo = 1;
            ctrl.searchParams.sortBy = 'date';
            ctrl.searchParams.order = 'desc';
            ctrl.commonFilter();
            ctrl.formSubmitted = true;
        };
        ctrl.commonFilter = function () {
            if(ctrl.isWorksiteTimesheet && ctrl.searchParams.workSiteId==null){
                $rootScope.unmaskLoading();
                return;
            }
            
            if (ctrl.searchParams.isSchedule) {
                ctrl.searchParams.order = 'asc';
                ctrl.filterSchedule();
            } else {
                ctrl.filterTimesheet();
            }
        };
        ctrl.commonRetrieve = function () {
            if (ctrl.searchParams.isSchedule) {
                ctrl.retrieveSchedule();
            } else {
                ctrl.retrieveTimesheet();
            }
        };
        ctrl.navigateToManualPunch = function (timesheet) {
            localStorage.setItem('dailyAttendanceNoPunch', JSON.stringify(timesheet));
        };
    }
    ;
    angular.module('xenon.controllers').controller('DailyAttendanceCtrl', ["$timeout", "$rootScope", "TimesheetDAO", "EmployeeDAO", "$modal", "$location", "Page", "$filter", "EventTypeDAO", "PositionDAO", "PatientDAO", "InsurerDAO", "$state", "WorksiteDAO", DailyAttendanceCtrl]);
})();