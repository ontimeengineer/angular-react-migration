(function () {
    function DispatchInfoCaseModalCtrl($modalInstance, PatientDAO, dispatchInfo, EventTypeDAO, EmployeeDAO, $filter, $rootScope, $timeout, empId) {
        var ctrl = this;
        ctrl.close = function (saved) {
            $modalInstance.close(saved);
        };
        var careTypes;
        var careEmployeeMap;
        var patientObj = {};
        var scheduleData;
        var timeFormat = 'HH:mm';
        ctrl.carePatientMap = {};
        ctrl.careTypes = [];
        ctrl.scheduleRetrieved = function () {
            ctrl.todayDate = new Date();
            if (scheduleData != null && scheduleData.eventType == null) {
                ctrl.todayDate = scheduleData.startDate;
            }
            ctrl.employees = [];
            ctrl.eventTypes = ontime_data.eventTypes;
            ctrl.recurranceTypes = ontime_data.recurranceTypes;
            ctrl.patient = angular.copy(patientObj);
            if (scheduleData == null) {
                ctrl.isNew = true;
            } else {
                if (scheduleData.eventType == null) {
                    ctrl.isNew = true;
                } else {
                    ctrl.isNew = false;
                    var a = moment(new Date(scheduleData.startDate));
                    var diff = moment().diff(date, 'days');
                    if (diff > 0) { // past date
                        scheduleData.isEdited1 = true;
                    }
                    scheduleData.isEdited = true;
                    ctrl.data = scheduleData;
                    if (scheduleData.eventType != 'U')
                        ctrl.data.applyTo = "SINGLE";
                }
            }
            //to make the radio buttons selected, theme bug
            setTimeout(function () {
                cbr_replace();
            }, 100);

            ctrl.currentStartTime = $filter('date')(new Date().getTime(), timeFormat).toString();
            ctrl.currentEndTime = ctrl.currentStartTime;
            if (scheduleData && scheduleData.eventType == null) {
                var id;
                if (scheduleData.data) {
                    id = scheduleData.data.id;
                } else {
                    id = ctrl.viewPatient.id;
                }
                var date = $filter('date')(ctrl.todayDate, $rootScope.dateFormat);
                if (ctrl.openCaseMap[date] && ctrl.openCaseMap[date][id]) {
                    var get = ctrl.openCaseMap[date][id];
                    ctrl.currentStartTime = get.startTime;
                    ctrl.currentEndTime = get.endTime;
                }
            }
            if (!angular.isDefined(ctrl.data)) {
                ctrl.data = {patientId: dispatchInfo.patientId, eventType: "S", recurranceType: "N", forLiveIn: false,
                    doNotBill: false, startTime: ctrl.currentStartTime, endTime: ctrl.currentEndTime, startDate: $filter('date')(ctrl.todayDate, $rootScope.dateFormat), endDate: $filter('date')(ctrl.todayDate, $rootScope.dateFormat),
                    employeeId: empId, companyCareTypeId: dispatchInfo.careTypeId, dispatchId: dispatchInfo.id};
            }
            if (scheduleData && scheduleData.eventType == null) {
                var id;
                if (scheduleData.data) {
                    id = scheduleData.data.id;
                } else {
                    id = ctrl.viewPatient.id;
                }
                ctrl.data = {eventType: "S", recurranceType: "N", forLiveIn: false,
                    doNotBill: false, startTime: ctrl.currentStartTime, endTime: ctrl.currentEndTime, startDate: $filter('date')(scheduleData.startDate, $rootScope.dateFormat), endDate: $filter('date')(scheduleData.startDate, $rootScope.dateFormat),
                    patientId: id, employeeId: empId, companyCareTypeId: dispatchInfo.careTypeId, dispatchId: dispatchInfo.id};
            }
            ctrl.closePopup = function () {
                $rootScope.paginationLoading = false;
                ctrl.close();
            };
            ctrl.validateForm = function () {
                $timeout(function () {
                    var name = "#popuppatients";
                    if ($(name)[0].checkValidity()) {
                        var a = moment(new Date(ctrl.data.startDate));
                        var b = moment(new Date(ctrl.data.endDate));
                        var diff = b.diff(a, 'days');
                        if (diff > 6 && ctrl.data.eventType == 'S') {
                            toastr.error("Date range should be no more of 7 days.");
                        } else if (diff > 89 && ctrl.data.eventType == 'U') {
                            toastr.error("Date range should be no more of 90 days.");
                        } else {
                            ctrl.response = true;
                        }
                    } else {
                        console.log("invalid form")
                    }
                });
            };
            ctrl.save = function () {
                if ($("#employee").select2('data') != null) {
                    ctrl.validEmployee = true;
                    delete ctrl.response;
                    ctrl.validateForm();
                    $timeout(function () {
                        if (ctrl.response) {
                            ctrl.savePatientPopupChanges(ctrl.data);
                        }
                    });
                } else {
                    ctrl.validEmployee = false;
                }
            };
            ctrl.empChanged = function () {
                if ($("#employee").select2('data') != null) {
                    ctrl.validEmployee = true;
                }else{
                    ctrl.validEmployee = false;
                }
            }
            ctrl.repeatationChanged = function (event) {
                if (event != 'repeat') {
                    var old = ctrl.data.eventType;
                    ctrl.data = {eventType: old, recurranceType: "N", startDate: $filter('date')(ctrl.todayDate, $rootScope.dateFormat), endDate: $filter('date')(ctrl.todayDate, $rootScope.dateFormat)};
                    if (old == 'S') {
                        ctrl.data.forLiveIn = false;
                        ctrl.data.doNotBill = false;
                        ctrl.data.startTime = ctrl.currentStartTime;
                        ctrl.data.endTime = ctrl.currentEndTime;
                    }
                    if (old == 'U') {
                        ctrl.data.isPaid = false;
                    }
                    setTimeout(function () {
                        $("#eventPatientIds").select2({
                            placeholder: 'Select Patient...',
                        }).on('select2-open', function ()
                        {
                            // Adding Custom Scrollbar
                            $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                        });
                        $("#employee").select2({
                            placeholder: 'Select Employee...',
                        }).on('select2-open', function ()
                        {
                            // Adding Custom Scrollbar
                            $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                        });
                        cbr_replace();
                    }, 200);
                }
            };
            ctrl.retrieveEmployeeBasedOnCare = function () {
                delete ctrl.data.employeeId;
                setTimeout(function () {
                    $("#employee").select2('data', null);
                }, 100);
                ctrl.employees = ctrl.careEmployeeMap[ctrl.data.companyCareTypeId];
            };

        };

        function retrieveCareTypesAndEmployees() {

            // no need to retrieve patient object if you already have, just get all careTypes of patient's insuranceProviderId
            if (patientObj && patientObj.patientCareTypeCollection && patientObj.patientCareTypeCollection.length > 0) {
                var careTypesSelected = [];
                var length = patientObj.patientCareTypeCollection.length;
                var str = "";
                for (var i = 0; i < length; i++) {
                    careTypesSelected.push(patientObj.patientCareTypeCollection[i].insuranceCareTypeId.companyCaretypeId);
                    if (str.length > 0) {
                        str = str + ",";
                    }
                    str = str + patientObj.patientCareTypeCollection[i].insuranceCareTypeId.companyCaretypeId.id;
                }
                careTypes = careTypesSelected;
                EmployeeDAO.retrieveAll({companyCareTypes: str, subAction: "active", sortBy: 'lName', order: 'asc'}).then(function (res) {
                    careEmployeeMap = {};
                    angular.forEach(res, function (item) {
                        angular.forEach(item.employeeCareRatesList, function (item1) {
                            var temp = careEmployeeMap[item1.companyCaretypeId.id];
                            if (temp == null) {
                                temp = [];
                            }
                            temp.push(item);
                            careEmployeeMap[item1.companyCaretypeId.id] = temp;
                        });
                    });
                    ctrl.careEmployeeMap = careEmployeeMap;
                    ctrl.careTypes = careTypes;
                    $rootScope.paginationLoading = false;
                    ctrl.employees = ctrl.careEmployeeMap[ctrl.data.companyCareTypeId];
                    if (ctrl.data.employeeId) {
                        setTimeout(function () {
                            $("#employee").select2({val: ctrl.data.employeeId});
                        }, 100);
                    } else {
                        ctrl.data.employeeId = empId;
                        setTimeout(function () {
                            $("#employee").select2({val: Number(empId)});
                        }, 100);
                    }
                }).catch(function (data) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });

            } else if (patientObj && patientObj.patientCareTypeCollection && patientObj.patientCareTypeCollection.length === 0) {
                $rootScope.paginationLoading = false;
            }

        }

        ctrl.retrieveSchedule = function () {
            if (dispatchInfo.scheduleId != null) {
                var obj = {action: ontime_data.eventTypes['S'].toLowerCase(), subAction: dispatchInfo.scheduleId};
                EventTypeDAO.retrieveEventType(obj).then(function (res) {
                    scheduleData = res;
                    scheduleData.applyTo = "SINGLE";
                    var a = moment(new Date(scheduleData.startDate));
                    var diff = moment().diff(a, 'days');
                    if (diff > 0) { // past date
                        scheduleData.isEdited1 = true;
                    }
                    scheduleData.isEdited = true;
                    ctrl.data = angular.copy(scheduleData);
                    ctrl.scheduleRetrieved();
                }).catch(function (data) {
                    toastr.error("Failed to retrieve data");
                }).then(function () {
                    retrieveCareTypesAndEmployees();
                });
            } else {
                ctrl.scheduleRetrieved();
                retrieveCareTypesAndEmployees();

            }
        };


        ctrl.savePatientPopupChanges = function (data, isPast) {
            $rootScope.maskLoading();
            var data1 = angular.copy(data);
            data1.dispatchAssigned = true;
            delete data1.isEdited1;
            console.log("patient data :: " + JSON.stringify(data1));
            var obj = {action: data1.eventType, data: data1, isPast: false};
            if (isPast) {
                obj.isPast = true;
            }
            if (ctrl.isNew) {
                EventTypeDAO.saveEventType(obj).then(function (res) {
                    toastr.success("Saved successfully.");
                    ctrl.close(true);
                }).catch(function (data) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            } else {
                obj.action = ontime_data.eventTypes[obj.action].toLowerCase();
                if (obj.data.scheduleId)
                    obj.subAction = obj.data.scheduleId;
                if (obj.data.unavailabilityId)
                    obj.subAction = obj.data.unavailabilityId;
                EventTypeDAO.updateEventType(obj).then(function (res) {
                    toastr.success("Saved successfully.");
                    ctrl.close(true);
                }).catch(function (data) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };

        ctrl.initModal = function () {
            setTimeout(function () {
                $("#eventPatientIds").select2({
                    placeholder: 'Select Patient...',
                }).on('select2-open', function ()
                {
                    // Adding Custom Scrollbar
                    $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                });
                $("#employee").select2({
                    placeholder: 'Select Employee...',
                }).on('select2-open', function ()
                {
                    // Adding Custom Scrollbar
                    $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                });
            }, 200);
            PatientDAO.getPatientsForSchedule({patientIds: dispatchInfo.patientId, addressRequired: true}).then(function (res) {
                ctrl.patient = res[0];
                patientObj = angular.copy(ctrl.patient);
            }).catch(function (data, status) {
            }).then(function () {
                ctrl.retrieveSchedule();
            });

        };
        ctrl.initModal();
    }
    ;
    angular.module('xenon.controllers').controller('DispatchInfoCaseModalCtrl', ["$modalInstance", "PatientDAO", "dispatchInfo", "EventTypeDAO", "EmployeeDAO", "$filter", "$rootScope", "$timeout", "empId", DispatchInfoCaseModalCtrl]);
})();