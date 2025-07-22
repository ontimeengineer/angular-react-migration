(function () {
    function ReportCtrl(Page, $rootScope, EmployeeDAO, PatientDAO, InsurerDAO, $http) {
        var ctrl = this;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.reportTypeList = angular.copy(ontime_data.reportTypes);
        if ($rootScope.currentUser.allowedFeature.indexOf('VIEW_EMPLOYEE_WAGES') > -1) {
            ctrl.reportTypeList.push({id: 'employeewages', label: "Employee Wages Report"});
        }
        ctrl.reportTypeList = _(ctrl.reportTypeList).chain()
                .sortBy('label')
                .value();
        ctrl.reportSubTypeList = ontime_data.reportSubTypes;
        ctrl.searchParams = {};
        ctrl.todayDate = angular.copy($rootScope.todayDate)
        ctrl.maxDate = angular.copy(ctrl.todayDate);
        Page.setTitle("Report");
        ctrl.yearList = [];
        for (var currentYear = new Date().getFullYear(); currentYear >= 2015; currentYear--) {
            ctrl.yearList.push(currentYear);
        }

        ctrl.downloadReport = function (format) {
            if ($('#report_form')[0].checkValidity() && ctrl.reportType) {
                var valid = true;
                ctrl.dateMessage = null;
                if (ctrl.reportType == 'employeeworkedhoursbycounty' || ctrl.reportType == 'workedhours'
                        || ctrl.reportType == 'employeetimesheet' || ctrl.reportType == 'patienttimesheet'
                        || ctrl.reportType == 'wppreport' || ctrl.reportType == 'employeeothours' || ctrl.reportType == 'weeklyotanalysis' || ctrl.reportType == 'evvauditreport') {
                    ctrl.verifyDates();
                }
                if (ctrl.reportType == 'employeedeactivatereport' || ctrl.reportType == 'lossofhoursreport'
                        || ctrl.reportType == 'totalworkedhours' || ctrl.reportType == 'eventactivityreport' || ctrl.reportType == 'missedpunchreport'
                        || ctrl.reportType == 'loginactivityreport' || ctrl.reportType == 'notesreport' || ctrl.reportType == 'applicationlistreport'
                        || ctrl.reportType == 'revenuereconciliationreport' || ctrl.reportType == 'revenuereconciliationbycounty' || ctrl.reportType == 'detailagingreport' || ctrl.reportType == 'claimhistoryandagingreport'
                        || ctrl.reportType == 'summaryagingreport' || ctrl.reportType == 'billingmonitorreport' || ctrl.reportType == 'claimrejectionreport'
                        || ctrl.reportType == 'evv-emedny-error-report'  || ctrl.reportType == 'complaints' || ctrl.reportType == 'satisfactionSurveyReport' || ctrl.reportType == 'employeeSupervisionHistory') {
                    ctrl.verifyDatesRequired();
                }
                if (ctrl.dateMessage != null) {
                    valid = false;
                    toastr.error(ctrl.dateMessage);
                }
                if (valid) {
                    $rootScope.maskLoading();
                    var path;
                    if ((ctrl.reportType == 'employeetimesheet' || ctrl.reportType == 'patienttimesheet'
                            || ctrl.reportType == 'totalworkedhours') || ctrl.reportType == 'missedpunchreport' || ctrl.reportType == 'evvauditreport') {
                        path = $rootScope.serverPath + 'reports/' + ctrl.reportType + '/email?format=' + format + "&companyCode=" + ontime_data.company_code;
                        if (ctrl.searchParams.id) {
                            path = path + "&id=" + ctrl.searchParams.id;
                        }
                    } else {
                        path = $rootScope.serverPath + 'reports/' + ctrl.reportType + '/download?format=' + format + "&companyCode=" + ontime_data.company_code;
                        if (ctrl.searchParams.id) {
                            path = path + "&id=" + ctrl.searchParams.id;
                        }
                    }
                    if (ctrl.searchParams.fromDate && ctrl.searchParams.toDate) {
                        path = path + "&fromDate=" + ctrl.searchParams.fromDate + "&toDate=" + ctrl.searchParams.toDate;
                    }
                    if (ctrl.searchParams.year) {
                        path = path + "&year=" + ctrl.searchParams.year;
                    }
                    if (ctrl.searchParams.date) {
                        path = path + "&date=" + ctrl.searchParams.date;
                    }
                    if ((ctrl.reportType == 'employeetimesheet' || ctrl.reportType == 'patienttimesheet'
                            || ctrl.reportType == 'totalworkedhours') || ctrl.reportType == 'missedpunchreport' || ctrl.reportType == 'evvauditreport') {
                        $http.get(path).success(function (data) {
//                            toastr.success('Generated report will be mailed to your email id');
                        }).error(function (data) {
                            toastr.error(data);
                        });
                        toastr.success('Generated report will be mailed to your email id');
                    } else {
                        fetch(path)
                            .then(res => {
                                const contentDisposition = res.headers.get('Content-Disposition') ?? '';
                                const filename = /filename\s*=\s*([^;]+)/.exec(contentDisposition)?.[1] ?? `file.${format}`;

                                return res.blob().then(blob => {
                                    const a = document.createElement('a');
                                    a.href = URL.createObjectURL(blob);
                                    a.download = filename;
                                    a.click();
                                    $rootScope.unmaskLoading();
                                });
                            })
                            .catch(err => {
                                console.error("Download failed:", err);
                                $rootScope.unmaskLoading();
                            });
                        // window.location.href = path;
                    }
                }
            }
        };
        ctrl.setMaxDate = function () {
            if (ctrl.searchParams.toDate) {
                ctrl.maxDate = angular.copy(ctrl.searchParams.toDate);
            } else {
                ctrl.maxDate = angular.copy(ctrl.todayDate);
            }
        };
        ctrl.typeChange = function () {
            ctrl.searchParams = {};

            if (ctrl.reportType === 'ptoreport') {
                ctrl.searchParams.year = ctrl.yearList[0];
            }
            if (ctrl.reportType === 'weeklyotanalysis') {
                ctrl.todayDate = null;
            } else {
                ctrl.todayDate = angular.copy($rootScope.todayDate);
            }
            ctrl.setMaxDate();
        };
        ctrl.resetFilters = function () {
            delete ctrl.reportType;
            ctrl.searchParams = {};
        };
        ctrl.verifyDates = function () {
            var newErrorMessage = null;
            if (ctrl.reportType == 'evvauditreport') {
                if (ctrl.reportType == 'evvauditreport' && moment(new Date(ctrl.searchParams.toDate)).diff(moment(new Date(ctrl.searchParams.fromDate)), 'days') > 30) {
                    newErrorMessage = "This report can not be generated for more than 1 month length.";
                }
            } else {
                if (new Date(ctrl.searchParams.fromDate).getDay() != 0 || new Date(ctrl.searchParams.toDate).getDay() != 6) {
                    newErrorMessage = "From date must be Sunday & To date must be Saturday.";
                } else if (ctrl.reportType == 'workedhours' && moment(new Date(ctrl.searchParams.toDate)).diff(moment(new Date(ctrl.searchParams.fromDate)), 'days') > 6) {
                    newErrorMessage = "Only one week should be selected.";
                }
            }
            ctrl.dateMessage = newErrorMessage;
        };
        ctrl.verifyDatesRequired = function () {
            if (ctrl.searchParams.fromDate == null || ctrl.searchParams.toDate == null) {
                ctrl.dateMessage = "Please select from date and to date.";
            } else {
                ctrl.dateMessage = null;
            }
        };
        ctrl.retrieveAllEmployees = function () {
            EmployeeDAO.retrieveAll({subAction: 'active', sortBy: 'lName', order: 'asc'}).then(function (res) {
                ctrl.employeeList = res;
            });
        };
        ctrl.retrieveAllPatients = function () {
            PatientDAO.retrieveAll({subAction: 'active', sortBy: 'lName', order: 'asc'}).then(function (res) {
                ctrl.patientList = res;
            });
        };
        ctrl.retrieveAllInsuranceProviders = function () {
            InsurerDAO.retrieveAll().then(function (res) {
                ctrl.insuranceProviderList = res;
            });
        }
        ctrl.retrieveAllInsuranceProviders();
        ctrl.retrieveAllEmployees();
        ctrl.retrieveAllPatients();
    }
    angular.module('xenon.controllers').controller('ReportCtrl', ["Page", "$rootScope", "EmployeeDAO", "PatientDAO", "InsurerDAO", "$http", ReportCtrl]);
})();
