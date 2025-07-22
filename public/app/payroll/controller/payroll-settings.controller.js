(function () {
    function PayrollSettingsCtrl($rootScope, $scope, $http, $modal, $timeout, PayrollDAO, $filter, Page) {
        var ctrl = this;
        Page.setTitle("Payroll Settings");
        ctrl.payrollObj = {companyCode: ontime_data.company_code};
        ctrl.holidays = [{name: 'Christmas'}, {name: 'Columbus Day'}, {name: 'Independence Day'}, {name: 'Labor'}, {name: 'Memorial Day'}, {name: 'MLK Birthday'}, {name: 'New Year\'s Day'}, {name: 'Thanks giving Day'}, {name: 'Veterans Day'}, {name: 'Washington\'s Birthday'}];
        ctrl.unselecteModalOpen = false;
        ctrl.retrievedHolidaysMap = {};
        ctrl.initSettings = function () {
            $rootScope.maskLoading();
            ctrl.displayHolidayModal = false;
            PayrollDAO.getSettings().then(function (res) {
                if (res != null) {
                    ctrl.payrollObj = res;
                    ctrl.payrollObj.companyCode = ontime_data.company_code;
                    angular.forEach(res.holidays, function (holiday) {
                        ctrl.retrievedHolidaysMap[holiday.name] = holiday;
                    });
                }
//                if (!ctrl.payrollObj.payrollFrequency || ctrl.payrollObj.payrollFrequency == null) {
//                    ctrl.payrollObj.payrollFrequency = '1W';
//                }
                $timeout(function () {
                    $('#multi-select').multiSelect('refresh');
                    ctrl.setHolidayManually();
                });
            }).catch(function () {
                toastr.error("Payroll settings cannot be retrieved.");
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        };
        function arr_diff(a1, a2)
        {
            var a = [], diff = [];
            var diffArray = [];
            if (a1 && a2) {
                for (var i = 0; i < a1.length; i++) {
                    var exists = false;
                    for (var j = 0; j < a2.length; j++) {
                        if (a1[i].name === a2[j].name) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        diffArray.push(a1[i]);
                    }
                }
            }
            return diffArray;
        }
        ;
        ctrl.saveSettings = saveSettings;
        function setFormDynamicValidityMessages(payrollGroup) {
            $("#companyCod"+payrollGroup+"-error").text('Please enter Payroll Company Code '+payrollGroup+'.');
        }
        $scope.$watch(function () {
            return ctrl.payrollObj.payrollProvider;
        }, function (newVal, oldValue) {
            setValidationsForCompanyCode(newVal);
        });
        $scope.$watch(function () {
            return ctrl.payrollObj.payrollCompanyCodeA;
        }, function (newVal, oldValue) {
            if ((newVal === '' || newVal === null)) {
                setFormDynamicValidityMessages('A');
            }
        });
        $scope.$watch(function () {
            return ctrl.payrollObj.payrollCompanyCodeB;
        }, function (newVal, oldValue) {
            if ((newVal === '' || newVal === null)) {
                setFormDynamicValidityMessages('B');
            }
        });
        $scope.$watch(function () {
            return ctrl.payrollObj.payrollCompanyCodeC;
        }, function (newVal, oldValue) {
            if ((newVal === '' || newVal === null)) {
                setFormDynamicValidityMessages('C');
            }
        });
        function setValidationsForCompanyCode(payrollProvider) {
            if (payrollProvider && payrollProvider !== '' && payrollProvider != null) {
                $("input[name='companyCodeA']").attr('required', true);
                $("input[name='companyCodeB']").attr('required', true);
                $("input[name='companyCodeC']").attr('required', true);
            } else {
                $("input[name='companyCodeA']").attr('required', false);
                $("input[name='companyCodeB']").attr('required', false);
                $("input[name='companyCodeC']").attr('required', false);
            }
        }
        //function to save the payroll settings
        function saveSettings() {
            setFormDynamicValidityMessages();
            if ($('#payroll_settings_form')[0].checkValidity() && ctrl.payrollObj.holidays != null && ctrl.payrollObj.holidays.length > 0) {
                $rootScope.maskLoading();
                ctrl.payrollObj.holidays = angular.copy(ctrl.payrollObj.holidays);
                var holidaysToSave = angular.copy(ctrl.payrollObj.holidays);
                angular.forEach(holidaysToSave, function (holiday, index) {
                    if (holiday.holidayDate == null) {
                        holidaysToSave[index] = ctrl.retrievedHolidaysMap[holiday.name];
                    }
                });
                ctrl.payrollObj.holidays = holidaysToSave;
                PayrollDAO.updateSettings(ctrl.payrollObj).then(function (res) {
                    ctrl.payrollObj = res;
                    angular.forEach(res.holidays, function (holiday) {
                        ctrl.retrievedHolidaysMap[holiday.name] = holiday;
                    })
                    console.log(res);
                    toastr.success("Payroll settings saved.");
                }).catch(function () {
                    toastr.error("Payroll settings cannot be saved.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }
        ;
        ctrl.setHolidayManually = function () {
            if (ctrl.payrollObj.holidays != null && ctrl.payrollObj.holidays.length > 0) {
                var holidaysToSave = angular.copy(ctrl.payrollObj.holidays);
                angular.forEach(holidaysToSave, function (holiday, index) {
                    if (holiday.holidayDate == null && ctrl.retrievedHolidaysMap[holiday.name]) {
                        holidaysToSave[index] = ctrl.retrievedHolidaysMap[holiday.name];
                    }
                });
                $(".ms-selection").find("span").css("color", "black");
                angular.forEach(holidaysToSave, function (holiday) {
                    if (holiday.isRepeatAnnually == false) {
                        $(".ms-selection").find("span:contains(" + holiday.name + ")").css("color", "red");
                    }
                });
            }
        };
// Open Simple Modal
        ctrl.openModal = function (modal_id, modal_size, modal_backdrop, selection)
        {
            //use the same pop up modal based on selection true/false
            $rootScope.holidayRateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                keyboard: false,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop
            });
            //to not open the popup for changes done in this modals
            if (selection) {
                ctrl.selecteModalOpen = true;
            } else {
                //for remove button in unselection
                $rootScope.holidayRateModal.showRemove = true;
                ctrl.unselecteModalOpen = true;
            }
            $timeout(function () {
                $('#holidayDate').datepicker()
                        .on('changeDate', function (ev) {
                            $rootScope.holidayRateModal.holiday.holidayDate = $filter('date')(ev.date, $rootScope.dateFormat);
                        });
            }, 150);
            //initialize or copy the careTypeObj
            if (selection) {
                if(ctrl.retrievedHolidaysMap[ctrl.newSelectedRate[0].name]){
                    $rootScope.holidayRateModal.holiday = ctrl.retrievedHolidaysMap[ctrl.newSelectedRate[0].name] ;
                }else{
                    $rootScope.holidayRateModal.holiday = ctrl.newSelectedRate[0];
                }
                $rootScope.holidayRateModal.holiday.isRepeatAnnually = true;
                $rootScope.holidayRateModal.holiday.holidayDate = $filter('date')(new Date(), $rootScope.dateFormat);
            } else {
                $rootScope.holidayRateModal.holiday = ctrl.retrievedHolidaysMap[ctrl.newDeselectedRate[0].name] ;
                $timeout(function () {
                    $("#holidayDate").datepicker("destroy");
                    $("#holidayDate").datepicker("refresh");
                }, 1000)
            }
            $rootScope.holidayRateModal.save = function () {
                $timeout(function () {
                    if ($('#holiday_rate_form')[0].checkValidity()) {
                        if (ctrl.payrollObj.holidays == null) {
                            ctrl.payrollObj.holidays = [];
                        }
                        if (!selection) {
                            ctrl.payrollObj.holidays.push($rootScope.holidayRateModal.holiday);
                        }
                        ctrl.retrievedHolidaysMap[$rootScope.holidayRateModal.holiday.name] = angular.copy($rootScope.holidayRateModal.holiday);
                        $rootScope.holidayRateModal.dismiss();
                        if (selection) {
                            //make this false when selection process should end casually.
                            ctrl.selecteModalOpen = false;
                        } else {
                            ctrl.unselecteModalOpen = false;
                            $timeout(function () {
                                $("#multi-select").multiSelect('refresh');
                                ctrl.setHolidayManually();
                            });
                        }
                    }
                });
            };

            $rootScope.holidayRateModal.remove = function () {
                $timeout(function () {
                    //make this false when unselection process should end casually.
                    ctrl.unselecteModalOpen = false;
                    $rootScope.holidayRateModal.dismiss();
                });
            };

            $rootScope.holidayRateModal.cancel = function () {
                if (selection) {
                    var holidaysToSave = [];
                    for (var i = 0; i < ctrl.payrollObj.holidays.length; i++) {
                        if (ctrl.payrollObj.holidays[i].name !== ctrl.newSelectedRate[0].name) {
                            holidaysToSave.push(ctrl.payrollObj.holidays[i]);
                        }
                    }
                    ctrl.payrollObj.holidays = holidaysToSave;
                } else {
                    ctrl.payrollObj.holidays.push(ctrl.newDeselectedRate[0]);
                    ctrl.unselecteModalOpen = false;
                }
                $timeout(function () {
                    $("#multi-select").multiSelect('refresh');
                    ctrl.setHolidayManually();
                }, 150);
                $rootScope.holidayRateModal.close();
            };

        };

        ctrl.resetPayroll = function () {
            delete ctrl.payrollObj.overtimeThreshhold;
            delete ctrl.payrollObj.vaccationRate;
            delete ctrl.payrollObj.sickRate;
            delete ctrl.payrollObj.personalRate;
            delete ctrl.payrollObj.holidays;
            $timeout(function () {
                $("#multi-select").multiSelect('refresh');
//                ctrl.setHolidayManually();
            });
        };

        $scope.$watch(function () {
            return ctrl.payrollObj.holidays;
        }, function (newValue, oldValue) {
            if (ctrl.displayHolidayModal && newValue != null && (oldValue == null || arr_diff(newValue, oldValue).length > 0)) {
                if (!ctrl.unselecteModalOpen) {
                    if (oldValue == null) {
                        ctrl.newSelectedRate = newValue;
                    } else {
                        ctrl.newSelectedRate = arr_diff(newValue, oldValue);
                    }
                    ctrl.openModal('modal-5', 'md', 'static', true);
//                    ctrl.setHolidayManually();
                } else {
                    ctrl.unselecteModalOpen = false;
                }
            } else if (oldValue !== null && newValue != null && arr_diff(oldValue, newValue).length > 0) {
                if (!ctrl.selecteModalOpen) {
                    ctrl.newDeselectedRate = arr_diff(oldValue, newValue);
                    ctrl.openModal('modal-5', 'md', 'static', false);
                } else {
                    ctrl.selecteModalOpen = false;
                }
            }
        });
        ctrl.initSettings();
    }
    ;
    angular.module('xenon.controllers').controller('PayrollSettingsCtrl', ["$rootScope", "$scope", "$http", "$modal", "$timeout", "PayrollDAO", "$filter", "Page", PayrollSettingsCtrl]);
})();