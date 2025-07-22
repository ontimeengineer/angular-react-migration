(function () {
    function PayrollSessionCtrl($rootScope, $filter, $modal, $timeout, PayrollDAO, EmployeeDAO, TimesheetDAO, $state, Page, UtilService, $formService) {
        var ctrl = this;
        ctrl.datatableObj = {};
        ctrl.viewRecords = 10;
        ctrl.searchParams = {payrollGroup: 'A'};
        ctrl.payrollSessions = [];
        ctrl.searchParams.processedOn = $filter('date')(new Date(), $rootScope.dateFormat)
        ctrl.criteriaSelected = false;
        var otHdConstant = 1;
        ctrl.pageInitCall = pageInit;
        ctrl.sessionRestricted = false;
        ctrl.payrollSessionData = {};
        ctrl.payrollSessionKey = getCookie('cc') + '-payroll';
        // PAGE INIT
        function pageInit () {
            ctrl.payrollSessionData = JSON.parse(localStorage.getItem(ctrl.payrollSessionKey)) || {};
            if (Object.keys(ctrl.payrollSessionData).length > 0 && ctrl.payrollSessionData.un == getCookie('un')) {
                if (ctrl.payrollSessionData.searchParams) {
                    ctrl.searchParams = {...ctrl.payrollSessionData.searchParams};
                    ctrl.searchParamsAtReview = ctrl.payrollSessionData.searchParams;
                }
                if (ctrl.payrollSessionData.payrollSessions) {
                    ctrl.payrollSessions = ctrl.payrollSessionData.payrollSessions; 
                    ctrl.dataRetrieved = true;
                    ctrl.criteriaSelected = true;
                    if (ctrl.payrollSessions.length) {
                        ctrl.unprocessedDataFlag = true;
                        /*================  ===================*/
                        angular.forEach(ctrl.payrollSessions, function (payrollObj) {
                            payrollObj.grossPay = ctrl.calculateGrossPay(payrollObj);
                            payrollObj.totalHours = ctrl.calculateTotalHours(payrollObj);
                            if (payrollObj.sickPayoutHours > 0 || payrollObj.vacationPayoutHours > 0 || payrollObj.personalPayoutHours > 0) {
                                payrollObj.hasPayout = true;
                            }
                        });                                       
                    }
                }
                if (ctrl.searchParams.fromDate != null && ctrl.searchParams.toDate != null) {
                    ctrl.criteriaSelected = true;
                }               
            } 
            if (Object.keys(ctrl.payrollSessionData).length > 0 && ctrl.payrollSessionData.un != getCookie('un')) {
                ctrl.sessionRestricted = true;
                toastr.error('Another user has already started a payroll session. New payroll sessions are currently restricted');
            }
        }

        ctrl.resetFilters = function () {
            ctrl.unprocessedDataFlag = false;
            ctrl.searchParams.fromDate = null;
            ctrl.searchParams.toDate = null;
            ctrl.searchParams.payrollGroup = 'A';
            $formService.resetRadios();
            ctrl.payrollSessions = [];
            ctrl.criteriaSelected = false;
            ctrl.rerenderDataTable();
            ctrl.processClicked = false;
        };
        ctrl.processSessions = function () {
            ctrl.processClicked = true;
            var adpRunProvider = false;
            if (ctrl.payrollSettings.payrollProvider && ctrl.payrollSettings.payrollProvider !== 'ADP - Work Force Now') {
                adpRunProvider = true;
            }
            if (ctrl.payrollSessions != null && ctrl.payrollSessions.length > 0) {
                if (adpRunProvider) {
                    ctrl.openModal('check-date', 'md', 'static');
                } else {
                    ctrl.processPayroll();
                }
            }
        };

        ctrl.processPayroll = function (checkDate) {
            if (checkDate) {
                ctrl.searchParamsAtReview.checkDate = checkDate;
            }
            $rootScope.maskLoading();
            angular.forEach(ctrl.payrollSessions, function (session) {
                session.totalHours = checkNull(session.hour1) + checkNull(session.hour2) + checkNull(session.hour3) + checkNull(session.hour4) + checkNull(session.hour5)
                        + checkNull(session.otHours) + checkNull(session.hdHours)
                        + checkNull(session.otHours2) + checkNull(session.hdHours2)
                        + checkNull(session.otHours3) + checkNull(session.hdHours3)
                        + checkNull(session.otHours4) + checkNull(session.hdHours4)
                        + checkNull(session.otHours5) + checkNull(session.hdHours5)
                        + checkNull(session.vacation) + checkNull(session.sick) + checkNull(session.personal);
            });
            PayrollDAO.processSessions(ctrl.searchParamsAtReview, ctrl.payrollSessions).then(function (res) {
                if (ctrl.payrollSettings.payrollProvider && ctrl.payrollSettings.payrollProvider !== null) {
                    window.location.href = $rootScope.serverPath + 'payrolls/sessions/' + res.id + '/download';
                }
                ctrl.searchParamsAtReview = {};
                UtilService.clearLocalStorageItems([ctrl.payrollSessionKey]);
                $state.go('app.batch_session', {id: res.id});
            }).catch(function (e) {
                toastr.error("Payroll sessions cannot be processed.");
            }).then(function () {
                ctrl.processClicked = false;
                $rootScope.unmaskLoading();
            });
        }

        ctrl.filterSessions = function () {
            ctrl.unprocessedDataFlag = false;
            if (!ctrl.searchParams.fromDate || ctrl.searchParams.fromDate == "") {
                ctrl.searchParams.fromDate = null;
            }
            if (!ctrl.searchParams.toDate || ctrl.searchParams.toDate == "") {
                ctrl.searchParams.toDate = null;
            }
            if (ctrl.searchParams.fromDate != null && ctrl.searchParams.toDate != null) {
                ctrl.criteriaSelected = true;
                ctrl.retrieveSessions();
            } else {
                ctrl.criteriaSelected = false;
                ctrl.payrollSessions = [];
                ctrl.rerenderDataTable();
            }
        };
        var getDateDiff = function (firstDate, secondDate) {
            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            return Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
        }
        ctrl.verifyDates = function () {
            if (new Date(ctrl.searchParams.fromDate).getDay() != 0 || new Date(ctrl.searchParams.toDate).getDay() != 6) {
                ctrl.dateMessage = "From date must be Sunday & To date must be Saturday.";
//            } else if (ctrl.payrollSettings.payrollFrequency == '1W' && getDateDiff(new Date(ctrl.searchParams.fromDate), new Date(ctrl.searchParams.toDate)) != 6) {
//                ctrl.dateMessage = "Date range must be weekly.";
//            } else if (ctrl.payrollSettings.payrollFrequency == '2W' && getDateDiff(new Date(ctrl.searchParams.fromDate), new Date(ctrl.searchParams.toDate)) != 13) {
//                ctrl.dateMessage = "Date range must be bi-weekly.";
            } else {
                ctrl.dateMessage = null;
            }
        };
        //        ctrl.payrollSessions = ontime_data.payrollSessions;
        ctrl.retrieveSessions = function () {
            ctrl.verifyDates();
            if (ctrl.criteriaSelected && ctrl.dateMessage == null) {
                $rootScope.maskLoading();
                ctrl.dataRetrieved = false;
                ctrl.searchParamsAtReview = angular.copy(ctrl.searchParams);
                PayrollDAO.reviewSessions(ctrl.searchParamsAtReview).then(function (res) {
                    ctrl.dataRetrieved = true;
                    ctrl.payrollSessions = res;

                    // SAVING TO LOCALSTORAGE
                    ctrl.payrollSessionData.payrollSessions = ctrl.payrollSessions;
                    ctrl.payrollSessionData.searchParams = {...ctrl.searchParams};
                    ctrl.payrollSessionData.un = getCookie('un');
                    ctrl.payrollSessionData.cc = getCookie('cc');
                    localStorage.setItem(ctrl.payrollSessionKey, JSON.stringify(ctrl.payrollSessionData));
                    /*================  ===================*/
                    angular.forEach(ctrl.payrollSessions, function (payrollObj) {
                        ctrl.setRates('vacation', 'vaccationRate', payrollObj);
                        ctrl.setRates('sick', 'sickRate', payrollObj);
                        ctrl.setRates('personal', 'personalRate', payrollObj);
                        payrollObj.grossPay = ctrl.calculateGrossPay(payrollObj);
                        payrollObj.totalHours = ctrl.calculateTotalHours(payrollObj);
                        if (payrollObj.sickPayoutHours > 0 || payrollObj.vacationPayoutHours > 0 || payrollObj.personalPayoutHours > 0) {
                            payrollObj.hasPayout = true;
                        }
                    });
                    ctrl.rerenderDataTable();
                }).catch(function (e) {
                    if (e.data != null) {
                        toastr.error(e.data);
                    } else {
                        toastr.error("Payroll sessions cannot be retrieved.");
                    }

                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };
        ctrl.changeViewRecords = function () {
            ctrl.datatableObj.page.len(ctrl.viewRecords).draw();
        };

        ctrl.rerenderDataTable = function () {
            var pageInfo;
            if (ctrl.datatableObj.page != null) {
                pageInfo = ctrl.datatableObj.page.info();
            }
            ctrl.datatableObj = {};
            var payrollSessions = angular.copy(ctrl.payrollSessions);
            ctrl.payrollSessions = [];
            $("#example-1_wrapper").remove();

            $timeout(function () {
                ctrl.payrollSessions = payrollSessions;
                $timeout(function () {
                    $("#example-1").wrap("<div class='table-responsive'></div>");
                    if (ctrl.processdMode) {
                        $(".dt-button").attr("class", "btn btn-info green_bt pull-right print-btn");
                    }
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
            });
        };
        ctrl.openPayrollModal = function (payroll, modal_id, modal_size, modal_backdrop) {
            $rootScope.payrollModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: false,
                keyboard: false
            });
            $rootScope.payrollModal.processdMode = ctrl.processdMode;
            var selectedPayroll = angular.copy(payroll);
            $rootScope.payrollModal.empMap = ctrl.empMap;
            $rootScope.payrollModal.payrollObj = payroll;
            var payroll_form_data;
            $timeout(function () {
                payroll_form_data = $('#payroll_form').serialize();
            });
            $rootScope.payrollModal.save = function () {
                $rootScope.payrollModal.payrollObj.grossPay = ctrl.calculateGrossPay($rootScope.payrollModal.payrollObj);
                $rootScope.payrollModal.payrollObj.totalHours = ctrl.calculateTotalHours($rootScope.payrollModal.payrollObj);
                $rootScope.payrollModal.close();
                ctrl.payrollSessionData.payrollSessions = ctrl.payrollSessions;
                localStorage.setItem(ctrl.payrollSessionKey, JSON.stringify(payrollSessionData))
            };
            $rootScope.payrollModal.cancel = function () {
                if (payroll_form_data != $('#payroll_form').serialize()) {
                    for (var i = 0; i < ctrl.payrollSessions.length; i++) {
                        if (ctrl.payrollSessions[i].employeeId == $rootScope.payrollModal.payrollObj.employeeId) {
                            ctrl.payrollSessions[i] = selectedPayroll;
                            ctrl.rerenderDataTable();
                            break;
                        }
                    }
                    ;
                }
                ;
                $rootScope.payrollModal.close();
            };
        };
        ctrl.editNotes = function (session) {
            ctrl.notes = angular.copy(session.notes);
            $('#modal-8').modal('show', {backdrop: 'static'});
            ctrl.selectedSession = session;
//            ctrl.notes = session.notes;
        };
        ctrl.closeNotes = function () {
            ctrl.selectedSession.notes = ctrl.notes;
            $('#modal-8').modal('hide');
        };
        ctrl.saveNotes = function () {
            $('#modal-8').modal('hide');
        };
        var checkNull = function (value) {
            if (value == null || value === undefined || isNaN(value)) {
                return 0;
            } else {
                return Number(value);
            }
        };
        ctrl.setRates = function (rateKey, rateType, payrollObj) {
            if (ctrl.payrollSettings[rateType] == 'R1') {
                payrollObj[rateKey + 'Rate'] = payrollObj.rate1;
            }
            if (ctrl.payrollSettings[rateType] == 'R2') {
                payrollObj[rateKey + 'Rate'] = payrollObj.rate2;
            }
        };
        ctrl.setGrossPay = function (payrollObj) {
            payrollObj.grossPay = ctrl.calculateGrossPay(payrollObj);
            payrollObj.totalHours = ctrl.calculateTotalHours(payrollObj);
        };
        ctrl.calculateGrossPay = function (payrollObj) {
            var grossPay = (checkNull(payrollObj.rate1) * checkNull(payrollObj.hour1)) + (checkNull(payrollObj.rate2) * checkNull(payrollObj.hour2))
                    + (checkNull(payrollObj.rate3) * checkNull(payrollObj.hour3)) + (checkNull(payrollObj.rate4) * checkNull(payrollObj.hour4)) + (checkNull(payrollObj.rate5) * checkNull(payrollObj.hour5))
                    + (checkNull(payrollObj.otRate) * checkNull(payrollObj.otHours) * otHdConstant) + (checkNull(payrollObj.hdRate) * checkNull(payrollObj.hdHours) * otHdConstant)
                    + (checkNull(payrollObj.otRate2) * checkNull(payrollObj.otHours2) * otHdConstant) + (checkNull(payrollObj.hdRate2) * checkNull(payrollObj.hdHours2) * otHdConstant)
                    + (checkNull(payrollObj.otRate3) * checkNull(payrollObj.otHours3) * otHdConstant) + (checkNull(payrollObj.hdRate3) * checkNull(payrollObj.hdHours3) * otHdConstant)
                    + (checkNull(payrollObj.otRate4) * checkNull(payrollObj.otHours4) * otHdConstant) + (checkNull(payrollObj.hdRate4) * checkNull(payrollObj.hdHours4) * otHdConstant)
                    + (checkNull(payrollObj.otRate5) * checkNull(payrollObj.otHours5) * otHdConstant) + (checkNull(payrollObj.hdRate5) * checkNull(payrollObj.hdHours5) * otHdConstant)
                    + checkNull(payrollObj.salary) + (checkNull(payrollObj.vacation) * checkNull(payrollObj.vacationRate))
                    + (checkNull(payrollObj.sick) * checkNull(payrollObj.sickRate)) + (checkNull(payrollObj.personal) * checkNull(payrollObj.personalRate))
                    + checkNull(payrollObj.bonusEarnings) + checkNull(payrollObj.miscEarnings) + (checkNull(payrollObj.sickPayoutHours) * checkNull(payrollObj.sickPayoutRate))
                    + (checkNull(payrollObj.personalPayoutHours) * checkNull(payrollObj.personalPayoutRate)) + (checkNull(payrollObj.vacationPayoutHours) * checkNull(payrollObj.vacationPayoutRate))
                    - checkNull(payrollObj.miscDeduction) - checkNull(payrollObj.loan) - checkNull(payrollObj.advanceDeduction) - checkNull(payrollObj.adp401kLoan) - checkNull(payrollObj.adp401kDeduction);
            return grossPay;
        };
        ctrl.calculateTotalHours = function (payrollObj) {
            var totalHours = checkNull(payrollObj.hour1) + checkNull(payrollObj.hour2) + checkNull(payrollObj.hour3) + checkNull(payrollObj.hour4) + checkNull(payrollObj.hour5)
                    + checkNull(payrollObj.otHours) + checkNull(payrollObj.hdHours)
                    + checkNull(payrollObj.otHours2) + checkNull(payrollObj.hdHours2)
                    + checkNull(payrollObj.otHours3) + checkNull(payrollObj.hdHours3)
                    + checkNull(payrollObj.otHours4) + checkNull(payrollObj.hdHours4)
                    + checkNull(payrollObj.otHours5) + checkNull(payrollObj.hdHours5)
                    + checkNull(payrollObj.vacation) + checkNull(payrollObj.sick) + checkNull(payrollObj.personal);
            if (payrollObj.vacation > 0 || payrollObj.personal > 0 || payrollObj.sick > 0) {
                payrollObj.ptoAdded = true;
            } else {
                payrollObj.ptoAdded = false;
            }
            return totalHours;
        };

        ctrl.showAddEmployeeModal = function (empObj, index) {
            if ((empObj == null || empObj.manuallyAdded) && ctrl.processdMode === false) {
                $('#modal-7').modal('show', {backdrop: 'static'});
                ctrl.addEmployeeList = [];
//            var empWithSessions = [];
                if (empObj == null) {
                    ctrl.employeeModalObj = {};
                    ctrl.editEmpSession = false;
                } else {
                    ctrl.editEmpSession = true;
//                    ctrl.selectedEmp = angular.copy(empObj);
                    ctrl.selectedEmpIndex = index;
                    $timeout(function () {
                        $("#sboxit-1").select2("val", empObj.employeeId);
                    });
                    ctrl.employeeModalObj = angular.copy(empObj);
                }
                ctrl.payrollFormSubmitted = false;
//            angular.forEach(ctrl.payrollSessions, function(payroll) {
//                empWithSessions.push(payroll.employeeId);
//            });
                ctrl.addEmployeeList = ctrl.employeeList;
//            angular.forEach(ctrl.employeeList, function(emp) {
//                if (empWithSessions.indexOf(emp.id) < 0) {
//                    ctrl.addEmployeeList.push(emp);
//                }
//            });
                setTimeout(function () {
                    $("#sboxit-1").select2({
                        placeholder: 'Select Employee...',
                    }).on('select2-open', function ()
                    {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                }, 200);
            }
        };
        ctrl.selectEmployee = function () {
            var empObj = angular.copy(ctrl.empMap[ctrl.employeeModalObj.employeeId]);
            ctrl.employeeModalObj.salary = null;
            if (empObj.wages == 'S') {
//                ctrl.employeeModalObj.salary = empObj.salary;
                ctrl.setGrossPay(ctrl.employeeModalObj);
            } else {

                EmployeeDAO.retrieveEmployeeCareRates({employee_id: empObj.id}).then(function (res) {
                    ctrl.employeeModalObj.rate1 = res.rate1.rate;
                    ctrl.employeeModalObj.rate2 = res.rate2.rate;
                    ctrl.employeeModalObj.rate3 = res.rate3.rate;
                    ctrl.employeeModalObj.rate4 = res.rate4.rate;
                    ctrl.employeeModalObj.rate5 = res.rate5.rate;
                    ctrl.employeeModalObj.otRate = res.rate1.rate * ctrl.payrollSettings.otRateFactor;
                    ctrl.employeeModalObj.hdRate = res.rate1.rate * ctrl.payrollSettings.hdRateFactor;
                    ctrl.employeeModalObj.otRate2 = res.rate2.rate * ctrl.payrollSettings.otRateFactor;
                    ctrl.employeeModalObj.hdRate2 = res.rate2.rate * ctrl.payrollSettings.hdRateFactor;
                    ctrl.employeeModalObj.otRate3 = res.rate3.rate * ctrl.payrollSettings.otRateFactor;
                    ctrl.employeeModalObj.hdRate3 = res.rate3.rate * ctrl.payrollSettings.hdRateFactor;
                    ctrl.employeeModalObj.otRate4 = res.rate4.rate * ctrl.payrollSettings.otRateFactor;
                    ctrl.employeeModalObj.hdRate4 = res.rate4.rate * ctrl.payrollSettings.hdRateFactor;
                    ctrl.employeeModalObj.otRate5 = res.rate5.rate * ctrl.payrollSettings.otRateFactor;
                    ctrl.employeeModalObj.hdRate5 = res.rate5.rate * ctrl.payrollSettings.hdRateFactor;
                    ctrl.setGrossPay(ctrl.employeeModalObj);
                });
            }
        };
        ctrl.addEmployee = function () {
            ctrl.payrollFormSubmitted = true;
            if ($("#addEmployeeForm")[0].checkValidity() && ctrl.employeeModalObj.employeeId != null) {
                ctrl.setRates('vacation', 'vaccationRate', ctrl.employeeModalObj);
                ctrl.setRates('sick', 'sickRate', ctrl.employeeModalObj);
                ctrl.setRates('personal', 'personalRate', ctrl.employeeModalObj);
                ctrl.employeeModalObj.grossPay = ctrl.calculateGrossPay(ctrl.employeeModalObj);
                ctrl.employeeModalObj.totalHours = ctrl.calculateTotalHours(ctrl.employeeModalObj);
                if (ctrl.payrollSessions == null) {
                    ctrl.payrollSessions = [];
                }
                ctrl.employeeModalObj.manuallyAdded = true;
                if (ctrl.editEmpSession) {
                    ctrl.payrollSessions[ctrl.selectedEmpIndex] = ctrl.employeeModalObj;
                } else {
                    ctrl.payrollSessions.push(ctrl.employeeModalObj);
                }
                ctrl.payrollSessionData.payrollSessions = ctrl.payrollSessions;                
                localStorage.setItem(ctrl.payrollSessionKey, JSON.stringify(ctrl.payrollSessionData));
                ctrl.rerenderDataTable();
                $('#modal-7').modal('hide');
            }
        };

        ctrl.initSessions = function () {
            if ($state.params.id && $state.params.id !== '') {
                ctrl.processdMode = true;
                Page.setTitle("View Payroll Session");
                ctrl.batchId = $state.params.id;

                PayrollDAO.getProcessedSessions({id: ctrl.batchId}).then(function (res) {
                    ctrl.processedSessionObj = res;
                    ctrl.payrollSessions = res.payrollList;
                    ctrl.totalGrossPay = 0;
                    angular.forEach(res.payrollList, function (payroll) {
//                        payroll.firstName=ctrl.empMap[payroll.employeeId].fName;
//                        payroll.lastName=ctrl.empMap[payroll.employeeId].lName;
                        ctrl.totalGrossPay += payroll.grossPay;
                        if (payroll.vacation > 0 || payroll.personal > 0 || payroll.sick > 0) {
                            payroll.ptoAdded = true;
                        } else {
                            payroll.ptoAdded = false;
                        }
                        if (payroll.sickPayoutHours > 0 || payroll.vacationPayoutHours > 0 || payroll.personalPayoutHours > 0) {
                            payroll.hasPayout = true;
                        }
                    });
                    ctrl.processedSessionObj.sessionStartDate = Date.parse(ctrl.processedSessionObj.sessionStartDate);
                    ctrl.processedSessionObj.sessionEndDate = Date.parse(ctrl.processedSessionObj.sessionEndDate);
                    ctrl.rerenderDataTable();
                }).catch(function (e) {
                    toastr.error("Payroll cannot be retrieved.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            } else {
                Page.setTitle("Payroll Session");
                ctrl.processdMode = false;
            }


            PayrollDAO.getSettings().then(function (res) {
                if (res != null) {
                    ctrl.payrollSettings = res;
                }
            }).catch(function () {
                console.log("Payroll settings cannot be retrieved.");
            }).then(function () {
                if (!$state.params.id || $state.params.id === '') {
                    $rootScope.unmaskLoading();
                }
            });
        };
        $rootScope.maskLoading();
        EmployeeDAO.retrieveAll({subAction: 'all'}).then(function (res) {
            ctrl.employeeList = res;
            ctrl.empMap = {};
            angular.forEach(res, function (emp) {
                ctrl.empMap[emp.id] = emp;
            });
            ctrl.initSessions();
            ctrl.rerenderDataTable();
        }).catch(function (data, status) {
            console.log('Error in retrieving data')
        }).then(function () {
//            $rootScope.unmaskLoading();
        });
        ctrl.openDeleteModal = function (employee, modal_id, index)
        {
            $rootScope.deleteEmployeeModel = $modal.open({
                templateUrl: modal_id,
                size: null,
                backdrop: true,
                keyboard: false
            });
            $rootScope.deleteEmployeeModel.employee = employee;
            $rootScope.deleteEmployeeModel.delete = function (employee) {
                ctrl.payrollSessions.splice(index, 1);
                ctrl.payrollSessionData.payrollSessions = ctrl.payrollSessions;
                localStorage.setItem(ctrl.payrollSessionKey, JSON.stringify(ctrl.payrollSessionData));
                ctrl.rerenderDataTable();
                $rootScope.deleteEmployeeModel.close();
            };

        };

        ctrl.openResetModal = function () {                     
            if (
                !ctrl.searchParams.fromDate &&
                !ctrl.searchParams.toDate &&
                ctrl.searchParams.payrollGroup === 'A' &&
                ctrl.payrollSessions.length === 0 &&
                !ctrl.criteriaSelected &&
                !ctrl.processClicked
            )
             {
                return toastr.info('No saved data found for payroll session')
            }
        
            $rootScope.resetPayrollDataModel = $modal.open({
                templateUrl: 'resetModal',
                size: null,
                backdrop: true,
                keyboard: false
            });
            $rootScope.resetPayrollDataModel.remove = function () {
                UtilService.clearLocalStorageItems([ctrl.payrollSessionKey]);
                ctrl.resetFilters();
                $rootScope.resetPayrollDataModel.close();
            }
        }

        ctrl.openRefreshDataModal = function () {   
            if (ctrl.payrollSessions.length) {                         
                $rootScope.refreshPayrollDataModel = $modal.open({
                    templateUrl: 'refreshDataModal',
                    size: null,
                    backdrop: true,
                    keyboard: false
                });
                $rootScope.refreshPayrollDataModel.refresh = function () {
                    $rootScope.refreshPayrollDataModel.close();
                    ctrl.filterSessions();
                }
            } else {
                ctrl.filterSessions();
            }
        }

        // Open Simple Modal
        ctrl.openModal = function (modal_id, modal_size, modal_backdrop)
        {
            //use the same pop up modal based on selection true/false
            $rootScope.checkDateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.checkDateModal.title = 'Enter Check Date'
            $timeout(function () {
                $('#checkDate').datepicker()
                        .on('changeDate', function (ev) {
                            $rootScope.checkDateModal.checkDate = $filter('date')(ev.date, $rootScope.dateFormat);
                        });
            }, 150);
            $rootScope.checkDateModal.checkDate = $filter('date')(new Date(), $rootScope.dateFormat);
            $rootScope.checkDateModal.save = function () {
                $timeout(function () {
                    if ($('#checkDateForm')[0].checkValidity()) {
                        ctrl.processPayroll($rootScope.checkDateModal.checkDate);
                        $rootScope.checkDateModal.dismiss();
                    }
                });
            };

            $rootScope.checkDateModal.remove = function () {
                ctrl.processClicked = false;
                $rootScope.checkDateModal.dismiss();
            };

            $rootScope.checkDateModal.cancel = function () {
                ctrl.processClicked = false;
                $rootScope.checkDateModal.dismiss();
            };
        }

        ctrl.showMissedPunchModal = function (empObj, index, event) {

            var searchParams = {};
            searchParams.fromDate = ctrl.searchParams.fromDate;
            searchParams.toDate = ctrl.searchParams.toDate;
            searchParams.employeeId = empObj.employeeId;
            ctrl.selectedEmployeeId = empObj.employeeId;

            $rootScope.maskLoading();
            TimesheetDAO.getEffectiveMissedPunchesByEmployeeWithinDate(searchParams).then(function (response) {
                ctrl.missedPunchList = response;
                angular.forEach(ctrl.missedPunchList, function (obj) {
                    obj.roundedPunchInTime = Date.parse(obj.roundedPunchInTime);
                    obj.roundedPunchOutTime = Date.parse(obj.roundedPunchOutTime);
                    if (obj.scheduleId && !obj.unauthorizedTime) {
                        obj.ut = $filter('ut')(obj.scheduleId.roundedStartTime, obj.scheduleId.roundedEndTime, obj.roundedPunchInTime, obj.roundedPunchOutTime);
                    }
                    if (obj.scheduleId) {
                        obj.scheduleId.roundedStartTime = Date.parse(obj.scheduleId.roundedStartTime);
                        obj.scheduleId.roundedEndTime = Date.parse(obj.scheduleId.roundedEndTime);
                    }
                });
                ctrl.openMissedPunchModal('payroll-session-missed-punch-modal', 'md', 'static');
            }).catch(function (e) {
                if (e.data != null) {
                    toastr.error(e.data);
                } else {
                    toastr.error("Missed Punches cannot be retrieved.");
                }
            }).then(function () {
                $rootScope.unmaskLoading();
            });
            event.preventDefault();
            event.stopPropagation();
        };



        ctrl.openMissedPunchModal = function (modal_id, modal_size, modal_backdrop) {

            ctrl.missedPunchModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                resolve: {
                    payrollSession: function () {
                        return ctrl;
                    },
                    root: function () {
                        return $rootScope;
                    }
                },
                controller: function (payrollSession, $scope, root, $modalInstance) {
                    $scope.payrollSession = payrollSession;
                    $scope.close = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }
            });
        };

        ctrl.pageInitCall();
    }
    angular.module('xenon.controllers').controller('PayrollSessionCtrl', ["$rootScope", "$filter", "$modal", "$timeout", "PayrollDAO", "EmployeeDAO", "TimesheetDAO", "$state", "Page", "UtilService", "$formService", PayrollSessionCtrl]);
})();
