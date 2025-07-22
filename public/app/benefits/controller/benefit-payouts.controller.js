/* global ontime_data, _ */

(function () {
    function BenefitPayoutCtrl(EmployeeDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, BenefitDAO) {
        var ctrl = this;
        ctrl.datatableObj = {};
        Page.setTitle("Employee Benefit Payouts");
        ctrl.showCount = 0;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'lName', order: 'asc', name: ''};
        ctrl.employeeList = [];
        ctrl.payouts = {};
        ctrl.rates = {};
        ctrl.yearList = [];
        for (var currentYear = new Date().getFullYear(); currentYear >= 2015; currentYear--) {
            ctrl.yearList.push(currentYear);
        }

        function setObjects() {
            _.each(ctrl.payouts, function (value, key) {
                if (!value.object) {
                    value.object = _.find(ctrl.employeeList, function (employee) {
                        return employee.employeeId == key;
                    });
                }
            });
        }
        ;

        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }

        BenefitDAO.retrieveAll({subAction: "all", linesRequired: true}).then(function (res) {
            ctrl.benefitList = res;
        }).catch(function (data, status) {
            toastr.error("Failed to retrieve Benefits.");
        });

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

        function retrieveEmployeesData(changedFilters) {
            $rootScope.paginationLoading = true;

            if (changedFilters) {
                ctrl.payouts = {};
                var selectedPackage = _.find(ctrl.benefitList, {id: ctrl.searchParams.benefitPackageId});

                if (selectedPackage.benefitPackageLineSet) {
                    ctrl.lineTypes = _.map(selectedPackage.benefitPackageLineSet, 'lineType');
                }
                ctrl.year = ctrl.searchParams.year;
                $rootScope.isFormDirty = false;
                ctrl.showCount = 0;
            }
            setObjects();
            ctrl.searchParams.subAction = ctrl.viewType;
            EmployeeDAO.retrievePayouts(ctrl.searchParams).then(function (settings) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                _.each(settings, function (setting) {
                    if (!ctrl.payouts[setting.employeeId] && (setting.sickTimePayout !== null || setting.vacationTimePayout !== null || setting.personalTimePayout !== null)) {
                        ctrl.payouts[setting.employeeId] = {};
                        if (setting.sickTimePayout !== null)
                            ctrl.payouts[setting.employeeId].sickTimePayout = setting.sickTimePayout;
                        if (setting.vacationTimePayout !== null)
                            ctrl.payouts[setting.employeeId].vacationTimePayout = setting.vacationTimePayout;
                        if (setting.personalTimePayout !== null)
                            ctrl.payouts[setting.employeeId].personalTimePayout = setting.personalTimePayout;
                        if (setting.sickTimeRate !== null)
                            ctrl.payouts[setting.employeeId].sickTimeRate = setting.sickTimeRate;
                        if (setting.vacationTimeRate !== null)
                            ctrl.payouts[setting.employeeId].vacationTimeRate = setting.vacationTimeRate;
                        if (setting.personalTimeRate !== null)
                            ctrl.payouts[setting.employeeId].personalTimeRate = setting.personalTimeRate;
                    }
                });
                ctrl.employeeList = angular.copy(settings);
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve employees.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data');
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.savePayouts = function () {
            setObjects();
            var listToSave = [];

            _.each(ctrl.payouts, function (value, key) {
                if (value.object) {
                    var isEdited = false;
                    if (value.object.sickTimePayout !== value.sickTimePayout || value.object.sickTimeRate !== value.sickTimeRate) {
                        isEdited = true;
                        value.object.sickTimePayout = value.sickTimePayout;
                        value.object.sickTimeRate = value.sickTimeRate;
                    }
                    if (value.object.vacationTimePayout !== value.vacationTimePayout || value.object.vacationTimeRate !== value.vacationTimeRate) {
                        isEdited = true;
                        value.object.vacationTimePayout = value.vacationTimePayout;
                        value.object.vacationTimeRate = value.vacationTimeRate;
                    }
                    if (value.object.personalTimePayout !== value.personalTimePayout || value.object.personalTimeRate !== value.personalTimeRate) {
                        isEdited = true;
                        value.object.personalTimePayout = value.personalTimePayout;
                        value.object.personalTimeRate = value.personalTimeRate;
                    }

                    if (isEdited)
                        listToSave.push(value.object);
                }
            });
            if (listToSave.length > 0) {
                EmployeeDAO.savePayouts(listToSave).then(function (settings) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
                    toastr.success("saved employees benefit payouts.");
                }).catch(function (data, status) {
                    toastr.error("Failed to save employees benefit payouts.");
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {

                        }
                    }); // showLoadingBar
                }).then(function () {
                    $rootScope.unmaskLoading();
                    retrieveEmployeesData(true);
                });
            } else {
                toastr.warning("update some employee benefit payouts.");
            }
        };

        ctrl.rerenderDataTable = function () {
            if (ctrl.employeeList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
            } else {
                ctrl.retrieveEmployees();
            }
        };

        ctrl.onBlur = function (employee, type) {
            if (employee[type + 'Available']
                    && ctrl.payouts[employee.employeeId][type + 'Payout']
                    && (employee[type + 'Available'] < ctrl.payouts[employee.employeeId][type + 'Payout'])) {
                ctrl.payouts[employee.employeeId][type + 'Payout'] = employee[type + 'Payout'];
                toastr.warning("Payout can not be more then available amount");
            }
            var showCount = 0;
            setObjects();
            var copiedPayouts = angular.copy(ctrl.payouts);
            _.each(copiedPayouts, function (value) {
                if (value.object) {
                    var isEdited = false;
                    if (value.object.sickTimePayout !== value.sickTimePayout || value.object.sickTimeRate !== value.sickTimeRate) {
                        isEdited = true;
                        value.object.sickTimePayout = value.sickTimePayout;
                        value.object.sickTimeRate = value.sickTimeRate;
                    }
                    if (value.object.vacationTimePayout !== value.vacationTimePayout || value.object.vacationTimeRate !== value.vacationTimeRate) {
                        isEdited = true;
                        value.object.vacationTimePayout = value.vacationTimePayout;
                        value.object.vacationTimeRate = value.vacationTimeRate;
                    }
                    if (value.object.personalTimePayout !== value.personalTimePayout || value.object.personalTimeRate !== value.personalTimeRate) {
                        isEdited = true;
                        value.object.personalTimePayout = value.personalTimePayout;
                        value.object.personalTimeRate = value.personalTimeRate;
                    }

                    if (isEdited)
                        showCount++;
                }
            });
            ctrl.showCount = showCount;
            if (showCount) {
                $rootScope.isFormDirty = true;
            } else {
                $rootScope.isFormDirty = false;
            }
        };

    }
    ;
    angular.module('xenon.controllers').controller('BenefitPayoutCtrl', ["EmployeeDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "BenefitDAO", BenefitPayoutCtrl]);
})();