/* global ontime_data, _ */

(function () {
    function BenefitAdjistmentsCtrl(EmployeeDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, BenefitDAO) {
        var ctrl = this;
        ctrl.datatableObj = {};        
        Page.setTitle("Employee Benefit Adjustments");
        ctrl.showCount = 0;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;     
        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'lName', order: 'asc', name: ''};
        ctrl.employeeList = [];
        ctrl.offsets = {};
        ctrl.yearList = [];
        for (var currentYear = new Date().getFullYear(); currentYear >= 2015; currentYear--) {
            ctrl.yearList.push(currentYear);
        }
        
        ctrl.calculateHours = function (timeEarned, timeUsed, offsetTime) {
            var hours = 0;
            var hours = (timeEarned ? parseFloat(timeEarned) : 0) - (timeUsed ? parseFloat(timeUsed) : 0);
            if (!isNaN(offsetTime)) {
                hours = hours + (offsetTime ? parseFloat(offsetTime) : 0);
            }
            return hours.toFixed(2);
        };
        
        function setObjects() {
            _.each(ctrl.offsets, function (value, key) {
                if (!value.object) {
                    value.object = _.find(ctrl.employeeList, function (employee) {
                        return employee.employeeId == key;
                    });
                }
            });
        };

        if ($stateParams.status !== 'active' && $stateParams.status !== 'inactive' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        
        BenefitDAO.retrieveAll({subAction: "all",linesRequired: true}).then(function (res) {
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
                ctrl.offsets = {};
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
            EmployeeDAO.retrieveSettings(ctrl.searchParams).then(function (settings) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                _.each(settings,function(setting){
                    if(!ctrl.offsets[setting.employeeId] && (setting.sickTimeOffset !== null || setting.vacationTimeOffset !== null || setting.personalTimeOffset !== null)){
                        ctrl.offsets[setting.employeeId] = {};
                        if(setting.sickTimeOffset !== null)
                            ctrl.offsets[setting.employeeId].sickTimeOffset = setting.sickTimeOffset;
                        if(setting.vacationTimeOffset !== null)
                        ctrl.offsets[setting.employeeId].vacationTimeOffset = setting.vacationTimeOffset;
                        if(setting.personalTimeOffset !== null)
                        ctrl.offsets[setting.employeeId].personalTimeOffset = setting.personalTimeOffset;
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
        
        ctrl.saveAdjustments = function(){
            setObjects();
            var listToSave = [];
            
            _.each(ctrl.offsets, function (value, key) {
                if (value.object) {
                    var isEdited = false;
                    if (value.object.sickTimeOffset !== value.sickTimeOffset){
                        isEdited = true;
                        value.object.sickTimeOffset = value.sickTimeOffset;
                    }                  
                    if (value.object.vacationTimeOffset !== value.vacationTimeOffset){
                        isEdited = true;
                        value.object.vacationTimeOffset = value.vacationTimeOffset;
                    }                  
                    if (value.object.personalTimeOffset !== value.personalTimeOffset){
                        isEdited = true;
                        value.object.personalTimeOffset = value.personalTimeOffset;
                    }                  
                    
                    if(isEdited)
                        listToSave.push(value.object);
                }
            });
            if (listToSave.length > 0) {
                EmployeeDAO.saveSettings(listToSave).then(function (settings) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
                    toastr.success("saved employees adjustments.");
                }).catch(function (data, status) {
                    toastr.error("Failed to save employees adjustments.");
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
                toastr.warning("update some employee adjustments.");
            }
            
            console.log("listToSave", listToSave);
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
        
        ctrl.onBlur = function () {
            var showCount = 0;
            setObjects();
            var copiedOffsets = angular.copy(ctrl.offsets);
            _.each(copiedOffsets, function (value) {
                if (value.object) {
                    var isEdited = false;
                    if (value.object.sickTimeOffset !== value.sickTimeOffset) {
                        isEdited = true;
                        value.object.sickTimeOffset = value.sickTimeOffset;
                    }
                    if (value.object.vacationTimeOffset !== value.vacationTimeOffset) {
                        isEdited = true;
                        value.object.vacationTimeOffset = value.vacationTimeOffset;
                    }
                    if (value.object.personalTimeOffset !== value.personalTimeOffset) {
                        isEdited = true;
                        value.object.personalTimeOffset = value.personalTimeOffset;
                    }

                    if (isEdited)
                        showCount++;
                }
            });            
            ctrl.showCount = showCount;
            if(showCount){
                $rootScope.isFormDirty = true;
            }else{
                $rootScope.isFormDirty = false;
            }
        };
        
    };
    angular.module('xenon.controllers').controller('BenefitAdjistmentsCtrl', ["EmployeeDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "BenefitDAO", BenefitAdjistmentsCtrl]);
})();