(function () {
    function ManualPunchCtrl($scope, $rootScope, TimesheetDAO, EmployeeDAO, PatientDAO, $filter, $state,
            $location, $timeout, $modal, Page, WorksiteDAO, CareTypeDAO) {
        var ctrl = this;
        Page.setTitle("Manual Punch");
        ctrl.taskList = [];
        ctrl.taskOptionsMap = {};
        var searchParams = $location.search();
        ctrl.todaysDate = new Date();
        var timeFormat = 'HH:mm';
        ctrl.editTimesheet = null;
        ctrl.patientMandatory = true;
        ctrl.tasksErrorMsg = null;
        ctrl.officeStaffIds = [];
        ctrl.resetManualPunch = function () {
            ctrl.currentTime = $filter('date')(new Date().getTime(), timeFormat).toString();
            if (ctrl.editTimesheet) {
                ctrl.attendanceObj.isMissedPunch = false;
                ctrl.attendanceObj.punchInTime = ctrl.currentTime;
                ctrl.attendanceObj.punchOutTime = ctrl.currentTime;
                ctrl.attendanceObj.punchInDate = null;
                ctrl.attendanceObj.punchOutDate = null;
                ctrl.attendanceObj.companyTaskIds = [];
                ctrl.attendanceObj.taskIdValues = {};
            } else {
                ctrl.attendanceObj = {
                    punchInTime: ctrl.currentTime,
                    punchOutTime: ctrl.currentTime,
                    isMissedPunch: false,
                    isManualPunch: true,
                    companyTaskIds: [],
                    taskIdValues: {}
                };
                ctrl.taskList = [];

                $("#sboxit-2").select2("val", null);
                $("#sboxit-1").select2("val", null);
            }
            $timeout(function () {
                $('#tasks').multiSelect('refresh');
            }, 100);
        };
        ctrl.resetManualPunch();
        ctrl.retrieveEmployees = retrieveEmployeesData;

        //once you retrieve data for edit
        function setAttendanceForEdit() {
            ctrl.attendanceObj.taskIdValues = {};
            ctrl.empObj = angular.copy(ctrl.attendanceObj.employeeId);
            ctrl.patientObj = angular.copy(ctrl.attendanceObj.patientId);
            if (ctrl.attendanceObj.employeeId != null) {
                ctrl.attendanceObj.employeeId = ctrl.attendanceObj.employeeId.id;
                ctrl.retrieveEmployee();
                $timeout(function () {
                    $("#sboxit-2").select2("val", ctrl.attendanceObj.employeeId);
                });
            }
            if (ctrl.attendanceObj.patientId != null) {
                ctrl.attendanceObj.patientId = ctrl.attendanceObj.patientId.id;
                ctrl.retrievePatient();
                $timeout(function () {
                    $("#sboxit-1").select2("val", ctrl.attendanceObj.patientId);
                });

            }
            if (ctrl.attendanceObj.workSiteId != null) {
                ctrl.attendanceObj.isWorksitePunch = true;
                ctrl.retrieveWorkSite();
                $timeout(function () {
                    $("#worksiteDropdown").select2("val", ctrl.attendanceObj.patientId);
                });
            }
            ctrl.attendanceObj.punchInDate = angular.copy(ctrl.attendanceObj.punchInTime);
            if (!ctrl.attendanceObj.punchOutTime || ctrl.attendanceObj.punchOutTime === null) {
                ctrl.attendanceObj.punchOutDate = angular.copy(ctrl.attendanceObj.punchInTime);
            } else {
                ctrl.attendanceObj.punchOutDate = angular.copy(ctrl.attendanceObj.punchOutTime);
            }
            if (ctrl.attendanceObj.punchInTime != null) {
                ctrl.attendanceObj.punchInTime = $filter('date')(new Date(ctrl.attendanceObj.punchInTime).getTime(), timeFormat).toString();
            }
            if (ctrl.attendanceObj.punchOutTime != null) {
                ctrl.attendanceObj.punchOutTime = $filter('date')(new Date(ctrl.attendanceObj.punchOutTime).getTime(), timeFormat).toString();
            }
        }
        var dailyAttendanceNoPunch = localStorage.getItem('dailyAttendanceNoPunch');

        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id))) {
                $state.transitionTo(ontime_data.defaultState);
            }
            if ($state.current.name.indexOf('patient') > 0 || $state.current.name.indexOf('employee') > 0 || $state.current.name.indexOf('schedule') > 0 || $state.current.name.indexOf('worksite') > 0) {
                //nothing to do
            } else {
                ctrl.editTimesheet = true;
                if ($state.current.name.indexOf('edit_missed_punch') > 0) {
                    ctrl.attendanceObj.isMissedPunch = true;
                } else if ($state.current.name.indexOf('edit_timesheet') > 0) {
                    ctrl.attendanceObj.isMissedPunch = false;
                }
            }
        } else {
            ctrl.editTimesheet = false;
            ctrl.attendanceObj.isManualPunch = true;
        }

        var initPage = function () {
            if ($state.params.id && $state.params.id !== '') {
                var id = $state.params.id;
                if ($state.current.name.indexOf('schedule') > 0) {
                    var param = JSON.parse(dailyAttendanceNoPunch);
                    if (param.patientId) {
                        ctrl.attendanceObj.patientId = Number(param.patientId);
                        ctrl.retrievePatient();
                        $timeout(function () {
                            $("#sboxit-1").select2("val", ctrl.attendanceObj.patientId);
                        });
                    }
                    if (param.employeeId) {
                        ctrl.attendanceObj.employeeId = Number(param.employeeId);
                        ctrl.retrieveEmployee();
                        $timeout(function () {
                            $("#sboxit-2").select2("val", ctrl.attendanceObj.employeeId);
                        });
                    }
                    if (param.companyCareTypeId) {
                        ctrl.attendanceObj.careTypeId = Number(param.companyCareTypeId);
                    }
                    if (param.workSiteId) {
                        ctrl.attendanceObj.isWorksitePunch = true;
                        ctrl.attendanceObj.workSiteId = Number(param.workSiteId);
                        ctrl.retrieveWorkSite();
                        $timeout(function () {
                            $("#worksiteDropdown").select2("val", ctrl.attendanceObj.patientId);
                        });
                    }
                    if (param.startTime) {
                        ctrl.attendanceObj.punchInTime = param.startTime;
                    }
                    if (param.endTime) {
                        ctrl.attendanceObj.punchOutTime = param.endTime;
                    }
                    if (param.startDate) {
                        ctrl.attendanceObj.punchInDate = param.startDate;
                    }
                    if (param.endDate) {
                        ctrl.attendanceObj.punchOutDate = param.endDate;
                    }
                } else if ($state.current.name.indexOf('patient') > 0) {
                    ctrl.attendanceObj.patientId = Number(id);
                    ctrl.retrievePatient();
                    $timeout(function () {
                        $("#sboxit-1").select2("val", ctrl.attendanceObj.patientId);
                    });
                } else if ($state.current.name.indexOf('employee') > 0) {
                    ctrl.attendanceObj.employeeId = Number(id);
                    ctrl.retrieveEmployee();
                    $timeout(function () {
                        $("#sboxit-2").select2("val", ctrl.attendanceObj.employeeId);
                    });
                } else if ($state.current.name.indexOf('worksite') > 0) {
                    ctrl.attendanceObj.isWorksitePunch = true;
                    ctrl.attendanceObj.workSiteId = Number(id);
                    ctrl.retrieveWorkSite();
                } else {
                    ctrl.editTimesheet = true;
                    if ($state.current.name.indexOf('edit_missed_punch') > 0) {
                        $rootScope.maskLoading();
                        TimesheetDAO.getMissedPunch({id: id}).then(function (res) {
                            ctrl.attendanceObj = res;
                            $timeout(function () {
                                $('#tasks').multiSelect('refresh');
                            }, 100);
                            ctrl.attendanceObj.isMissedPunch = true;
                            setAttendanceForEdit();
                            $rootScope.unmaskLoading();
                        });
                    } else if ($state.current.name.indexOf('edit_timesheet') > 0) {
                        $rootScope.maskLoading();
                        TimesheetDAO.get({id: id}).then(function (res) {
                            ctrl.attendanceObj = res;
                            $timeout(function () {
                                $('#tasks').multiSelect('refresh');
                            }, 100);
                            ctrl.attendanceObj.isMissedPunch = false;
                            setAttendanceForEdit();
                            $rootScope.unmaskLoading();
                        });
                    }
                }
            } else {
                ctrl.editTimesheet = false;
                ctrl.attendanceObj.isManualPunch = true;
            }
        };

        ctrl.retrieveEmployee = function (reset) {
            ctrl.patientMandatory = true;
            EmployeeDAO.get({id: ctrl.attendanceObj.employeeId, includeTasks: true}).then(function (res) {
                ctrl.taskList = res.companyTasks;
                ctrl.taskOptionsMap = {};
                angular.forEach(ctrl.taskList, function (obj) {
                    if (obj.options && obj.options !== null) {
                        ctrl.taskOptionsMap[obj.id] = obj.options.split("|");
                    }
                })
                if (reset) {
                    ctrl.attendanceObj.companyTaskIds = [];
                }
                ctrl.attendanceObj.taskIdValues = {};
                $timeout(function () {
                    $('#tasks').multiSelect('refresh');
                }, 100);
            });
        }

        ctrl.retrievePatient = function (reset) {
            if (reset) {
                $rootScope.paginationLoading = true;
                delete ctrl.attendanceObj.careTypeId;
            }

            PatientDAO.getPatientsForSchedule({patientIds: ctrl.attendanceObj.patientId}).then(function (res) {
                var patientObj = res[0];
                if (patientObj && patientObj.patientCareTypeCollection && patientObj.patientCareTypeCollection.length > 0) {
                    ctrl.careTypes = [];
                    var length = patientObj.patientCareTypeCollection.length;
                    for (var i = 0; i < length; i++) {
                        ctrl.careTypes.push(patientObj.patientCareTypeCollection[i].insuranceCareTypeId.companyCaretypeId);
                    }
                }
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve patient.");
            }).then(function () {
                $rootScope.paginationLoading = false;
            });
        }

        retrieveEmployeesData();
        function retrieveEmployeesData() {
            ctrl.employeeListLoaded = false;
            $rootScope.maskLoading();
            var param = {};
            if (ctrl.attendanceObj.isWorksitePunch) {
                param = {workSiteId: ctrl.attendanceObj.workSiteId};
            }
            EmployeeDAO.retrieveByPosition(param).then(function (res) {
                if (ctrl.attendanceObj.isWorksitePunch && ctrl.attendanceObj.workSiteId == null) {
                    ctrl.employeeList = [];
                } else {
                    ctrl.employeeList = res;
                }
            }).catch(function (data, status) {
//                ctrl.employeeList = ontime_data.employees;
            }).then(function () {
                ctrl.employeeListLoaded = true;
                if (ctrl.patientListLoaded && ctrl.workSiteListLoaded) {
                    $rootScope.unmaskLoading();
                    initPage();
                }
            });
        }
        retrievePatientsData();
        function retrievePatientsData() {
            ctrl.patientListLoaded = false;
            $rootScope.maskLoading();
            PatientDAO.retrieveForSelect({}).then(function (res) {
                ctrl.patientList = res;
            }).catch(function (data, status) {
//                ctrl.patientList = ontime_data.patients;
            }).then(function () {
                ctrl.patientListLoaded = true;
                if (ctrl.employeeListLoaded && ctrl.workSiteListLoaded) {
                    $rootScope.unmaskLoading();
                    initPage();
                }
            });
        }
        ;

        var mergeDateAndTime = function (date, time) {
            date = new Date(date);
            if (time) {
                var hours = Number(time.match(/^(\d+)/)[1]);
                var minutes = Number(time.match(/:(\d+)/)[1]);
                var seconds = 0;
//            var AMPM = time.match(/\s(.*)$/)[1];
//            if ((AMPM == "PM" || AMPM == "Pm") && hours < 12)
//                hours = hours + 12;
//            if ((AMPM == "AM" || AMPM == "Am") && hours == 12)
//                hours = hours - 12;
                date.setHours(hours, minutes, seconds);
            }
            return $filter('date')(date, ontime_data.date_time_format);
        };

        ctrl.navigateToState = function () {
            var params = angular.copy(searchParams);
            if (searchParams !== null && searchParams.lastPage != null) {
                if (searchParams.lastPage.indexOf("employee_timesheet") >= 0) {
                    $state.go('app.employee_timesheet');
                } else if (searchParams.lastPage.indexOf("patient_time_sheet") >= 0) {
                    $state.go('app.patient_time_sheet');
                } else if (searchParams.lastPage.indexOf("daily_attendance") >= 0) {
                    $state.go('app.daily_attendance');
                } else if (searchParams.lastPage.indexOf("worksite_time_sheet") >= 0) {
                    $state.go('app.worksite_time_sheet');
                }
            }

        };
        ctrl.saveManualAttendance = function () {
            ctrl.formSubmitted = true;
            if (ctrl.attendanceObj.employeeId && ctrl.attendanceObj.employeeId !== null
                    && ctrl.attendanceObj.punchOutTime && ctrl.attendanceObj.punchOutTime !== null
                    && ctrl.attendanceObj.punchOutDate && ctrl.attendanceObj.punchOutDate !== null) {
                if (ctrl.attendanceObj.employeeId.position === 'pc') {
                    if (ctrl.attendanceObj.companyTaskIds.length < 5 && ctrl.attendanceObj.companyTaskIds.length !== ctrl.taskList.length) {
                        ctrl.tasksErrorMsg = 'Please select atleast 5 tasks.';
                    } else {
                        ctrl.tasksErrorMsg = null;
                    }
                } else {
                    if (ctrl.attendanceObj.companyTaskIds.length < 1 && ctrl.attendanceObj.companyTaskIds.length !== ctrl.taskList.length) {
                        ctrl.tasksErrorMsg = 'Please select atleast one task.';
                    } else {
                        ctrl.tasksErrorMsg = null;
                    }
                }
            } else {
                ctrl.tasksErrorMsg = null;
            }
            if ($("#manual_punch_form")[0].checkValidity() &&
                    ((ctrl.attendanceObj.patientId != null && ctrl.attendanceObj.careTypeId != null) || !ctrl.patientMandatory || ctrl.attendanceObj.isWorksitePunch) &&
                    ctrl.attendanceObj.employeeId != null && ctrl.tasksErrorMsg == null) {
                $rootScope.maskLoading();
                var attendanceObjToSave = angular.copy(ctrl.attendanceObj);
                if (attendanceObjToSave.isMissedPunch === false) {
                    delete attendanceObjToSave.isMissedPunch;
                    if (attendanceObjToSave.id == null) {
                        //to add new record we have to send this json as string
                        attendanceObjToSave.taskIdValues = JSON.stringify(attendanceObjToSave.taskIdValues);
                        TimesheetDAO.addPunchRecord(attendanceObjToSave).then(function () {
                            toastr.success("Manual punch saved.");
                            ctrl.navigateToState();
//                            ctrl.resetManualPunch();
                            ctrl.formSubmitted = false;
                        }).catch(function (e) {
                            if (e.data != null) {
                                toastr.error(e.data);
                            } else {
                                toastr.error("Manual punch cannot be saved.");
                            }
                        }).then(function () {
                            $rootScope.unmaskLoading();
                        });
                    } else {
                        delete attendanceObjToSave.isMissedPunch;
                        attendanceObjToSave.punchInTime = mergeDateAndTime(ctrl.attendanceObj.punchInDate, ctrl.attendanceObj.punchInTime);
                        if (ctrl.attendanceObj.punchOutTime && ctrl.attendanceObj.punchOutTime !== '') {
                            attendanceObjToSave.punchOutTime = mergeDateAndTime(ctrl.attendanceObj.punchOutDate, ctrl.attendanceObj.punchOutTime);
                        }
                        if (attendanceObjToSave.employeeId != null) {
                            attendanceObjToSave.employeeId = {id: ctrl.attendanceObj.employeeId};
                        }
                        if (attendanceObjToSave.patientId != null) {
                            attendanceObjToSave.patientId = {id: ctrl.attendanceObj.patientId};
                        }
                        //to update we have to send this in tasks list of timesheet/missed_punch object
                        attendanceObjToSave.tasks = [];
                        for (var key in attendanceObjToSave.taskIdValues) {
                            var newTask = {};
                            newTask.companyTasksId = {id: key};
                            newTask.value = attendanceObjToSave.taskIdValues[key];
                            attendanceObjToSave.tasks.push(newTask);
                        }
                        TimesheetDAO.update(attendanceObjToSave).then(function () {
                            toastr.success("Timesheet saved.");
                            ctrl.navigateToState();
                            ctrl.formSubmitted = false;
//                        ctrl.resetManualPunch();
                        }).catch(function (e) {
                            if (e.data != null) {
                                toastr.error(e.data);
                            } else {
                                toastr.error("Timesheet cannot be saved.");
                            }
                        }).then(function () {
                            $rootScope.unmaskLoading();
                        });
                    }
                } else {
                    if (attendanceObjToSave.id == null) {
                        delete attendanceObjToSave.isMissedPunch;
                        //to add new record we have to send this json as string
                        attendanceObjToSave.taskIdValues = JSON.stringify(attendanceObjToSave.taskIdValues);
                        TimesheetDAO.addMissedPunchRecord(attendanceObjToSave).then(function () {
                            toastr.success("Manual punch saved.");
                            ctrl.navigateToState();
//                            ctrl.resetManualPunch();
                            ctrl.formSubmitted = false;
                        }).catch(function (e) {
                            if (e.data != null) {
                                toastr.error(e.data);
                            } else {
                                toastr.error("Manual punch cannot be saved.");
                            }
                        }).then(function () {
                            $rootScope.unmaskLoading();
                        });
                    } else {
                        delete attendanceObjToSave.isMissedPunch;
                        attendanceObjToSave.punchInTime = mergeDateAndTime(ctrl.attendanceObj.punchInDate, ctrl.attendanceObj.punchInTime);
                        if (ctrl.attendanceObj.punchOutTime && ctrl.attendanceObj.punchOutTime !== '') {
                            attendanceObjToSave.punchOutTime = mergeDateAndTime(ctrl.attendanceObj.punchOutDate, ctrl.attendanceObj.punchOutTime);
                        }
                        if (attendanceObjToSave.employeeId != null) {
                            attendanceObjToSave.employeeId = {id: ctrl.attendanceObj.employeeId};
                        }
                        if (attendanceObjToSave.patientId != null) {
                            attendanceObjToSave.patientId = {id: ctrl.attendanceObj.patientId};
                        }
                        //to update we have to send this in tasks list of timesheet/missed_punch object
                        attendanceObjToSave.tasks = [];
                        for (var key in attendanceObjToSave.taskIdValues) {
                            var newTask = {};
                            newTask.companyTasksId = {id: key};
                            newTask.value = attendanceObjToSave.taskIdValues[key];
                            attendanceObjToSave.tasks.push(newTask);
                        }
                        TimesheetDAO.updateMissedPunch(attendanceObjToSave).then(function () {
                            toastr.success("Timesheet saved.");
                            ctrl.navigateToState();
                            ctrl.formSubmitted = false;
//                        ctrl.resetManualPunch();
                        }).catch(function (e) {
                            if (e.data != null) {
                                toastr.error(e.data);
                            } else {
                                toastr.error("Timesheet cannot be saved.");
                            }
                        }).then(function () {
                            $rootScope.unmaskLoading();
                        });
                    }
                }
            }
        };


// Open Simple Modal
        ctrl.openModal = function (modal_id, modal_size, modal_backdrop, optionArr)
        {
            ctrl.selecteModalOpen = true;
            $rootScope.taskModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.taskModal.answerOptions = optionArr;
            $rootScope.taskModal.taskValue = optionArr[0];
            $rootScope.taskModal.save = function () {
                $timeout(function () {
                    if ($('#taskForm')[0].checkValidity()) {
                        ctrl.attendanceObj.taskIdValues[ctrl.newSelectedTaskId] = $rootScope.taskModal.taskValue;
                        $rootScope.taskModal.dismiss();
                    }
                    ctrl.selecteModalOpen = false;
                });
            };

            $rootScope.taskModal.cancel = function () {
                ctrl.attendanceObj.companyTaskIds.splice(ctrl.attendanceObj.companyTaskIds.indexOf(ctrl.newSelectedTaskId), 1);
                $timeout(function () {
                    $("#tasks").multiSelect('refresh');
                });
                $rootScope.taskModal.close();
            };

        };

        $scope.$watch(function () {
            return ctrl.attendanceObj.companyTaskIds;
        }, function (newValue, oldValue) {
            $timeout(function () {
                $("#tasks").multiSelect('refresh');
            });
            if (newValue !== null && (oldValue === null || newValue.length > oldValue.length)) {
                if (oldValue === null) {
                    ctrl.newSelectedTaskId = newValue;
                } else {
                    ctrl.newSelectedTaskId = arr_diff(newValue, oldValue);
                }
                if (ctrl.taskOptionsMap[ctrl.newSelectedTaskId]) {
                    ctrl.openModal('modal-5', 'sm', 'static', ctrl.taskOptionsMap[ctrl.newSelectedTaskId]);
                }

            }
        }, true);
        ctrl.worksiteSelected = function () {
            ctrl.workSiteHasPayer = false;
            if (ctrl.attendanceObj.isWorksitePunch) {
                ctrl.attendanceObj.careTypeId = null;
                ctrl.attendanceObj.patientId = null;
            } else {
                ctrl.attendanceObj.workSiteId = null;
            }
        };
        ctrl.retrieveWorkSite = function (reset) {
            $rootScope.paginationLoading = true;
            if (reset) {
                delete ctrl.attendanceObj.careTypeId;
            }
            for (var i = 0; i < ctrl.workSiteList.length; i++) {
                var ws = ctrl.workSiteList[i];
                ctrl.employeeList = [];
                if (ws.id === ctrl.attendanceObj.workSiteId) {
                    if (ws.insuranceProviderId != null) {
                        ctrl.workSiteHasPayer = true;
                        CareTypeDAO.retrieveAll({insuranceProviderId: ws.insuranceProviderId}).then(function (res) {
                            ctrl.careTypes = res;
                            if (ctrl.attendanceObj.careTypeId != null) {
                                ctrl.onCareTypeChange();
                            } else {
                                ctrl.attendanceObj.employeeId = null;
                                $("#sboxit-2").select2("val", null);
                            }

                        }).catch(function () {
                            toastr.error("Failed to retrieve care types.");
                        }).then(function () {
                            $rootScope.paginationLoading = false;
                        });
                    } else {
                        ctrl.workSiteHasPayer = false;
                        var param = {workSiteId: ctrl.attendanceObj.workSiteId};
                        EmployeeDAO.retrieveByPosition(param).then(function (res) {
                            ctrl.employeeList = res;
                            ctrl.resetEmployeeDropDown();
                        }).catch(function (data, status) {
                            toastr.error("Failed to retrieve employees.");
                        }).then(function () {
                            $rootScope.paginationLoading = false;
                        });
                    }
                }
            }
        };

        ctrl.resetEmployeeDropDown = function () {
            var employeeExists = false;
            for (var i = 0; i < ctrl.employeeList.length; i++) {
                if (ctrl.employeeList[i].id === ctrl.attendanceObj.employeeId) {
                    employeeExists = true;
                }
            }
            if (!employeeExists) {
                ctrl.attendanceObj.employeeId = null;
                $("#sboxit-2").select2("val", null);
                ctrl.taskList = [];
                $timeout(function () {
                    $('#tasks').multiSelect('refresh');
                }, 100);
            } else {
                $timeout(function () {
                    $("#sboxit-2").select2("val", ctrl.attendanceObj.employeeId);
                });
            }
        }

        ctrl.onCareTypeChange = function () {
            if (ctrl.attendanceObj.careTypeId && ctrl.attendanceObj.isManualPunch) {
                $rootScope.maskLoading();
                EmployeeDAO.retrieveByPosition({careTypeId: ctrl.attendanceObj.careTypeId}).then(function (res) {
                    ctrl.employeeList = res;
                    ctrl.resetEmployeeDropDown();
                }).catch(function (data, status) {
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }

        ctrl.retrieveWorkSites = function () {
            ctrl.workSiteListLoaded = false;
            $rootScope.maskLoading();
            WorksiteDAO.retreveWorksiteNames().then(function (res) {
                ctrl.workSiteList = res;
            }).then(function () {
                ctrl.workSiteListLoaded = true;
                if (ctrl.employeeListLoaded && ctrl.patientListLoaded) {
                    $rootScope.unmaskLoading();
                    initPage();
                }
            });
        };
        ctrl.retrieveWorkSites();
    }
    angular.module('xenon.controllers').controller('ManualPunchCtrl', ["$scope", "$rootScope", "TimesheetDAO", "EmployeeDAO", "PatientDAO", "$filter", "$state",
        "$location", "$timeout", "$modal", "Page", "WorksiteDAO", "CareTypeDAO", ManualPunchCtrl]);
})();