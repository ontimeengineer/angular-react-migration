/* global appHelper, state */

'use strict';
var app = angular.module('xenon-app', [
    'ngCookies',
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    'oc.lazyLoad',
    'xenon.controllers',
    'xenon.directives',
    'xenon.factory',
    'xenon.services',
    'xenon.filter',
    'mwl.calendar',
    // Added in v1.3
    'FBAngular',
    'flow',
    'ngIdle',
    'angularUtils.directives.dirPagination',
    'toggle-switch',
    'angular.chips',
    'ngCkeditor',
    'signature',
]);
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1);
        if (c.indexOf(name) == 0)
            return c.substring(name.length, c.length);
    }
    return "";
}
function delete_cookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

app.run(function ($rootScope, $modal, $state, Idle, $http)
{
// Page Loading Overlay
    public_vars.$pageLoadingOverlay = jQuery('.page-loading-overlay');
    jQuery(window).load(function ()
    {
        public_vars.$pageLoadingOverlay.addClass('loaded');
    })

    $rootScope.started = false;
    function closeModals() {
        if ($rootScope.warning) {
            $rootScope.warning.close();
            $rootScope.warning = null;
        }
    }

    $rootScope.$on('IdleStart', function () {
        closeModals();
        $rootScope.warning = $modal.open({
            templateUrl: 'warning-dialog.html',
            windowClass: 'modal-danger',
            keyboard: false
        });
    });
    $rootScope.$on('IdleTimeout', function () {
        closeModals();
        $rootScope.logout();
        Idle.unwatch();
    });
    $rootScope.startIdle = function () {
        closeModals();
        Idle.watch();
        $rootScope.started = true;
    };
    $rootScope.stopIdle = function () {
        closeModals();
        Idle.unwatch();
        $rootScope.started = false;
    };
    $rootScope.$on('IdleEnd', function () {
        closeModals();
    });
    $rootScope.logout = function () {
        $http.get(ontime_data.weburl + 'logout').success(function (response) {
            delete_cookie("cc");
            delete_cookie("token");
            delete_cookie("un");
            delete_cookie("company_country");
            $rootScope.stopIdle();
            window.location.hash = '#/app/login';
            $rootScope.isFormDirty = false
        });
    };

    //this will be called when any state change starts
    $rootScope.$on('$stateChangeStart',
            function (event, toState, toParams, fromState, fromParams) {
                //this is to close any open popup while moving to other page.
                $("[role=dialog]").each(function () {
                    if ($(this).css('display') === 'block') { // Current display
                        $(this).css('display', 'none');
                    }
                });
                if (toState.url.indexOf("login") < 0 && toState.url.indexOf("forgotpassword") < 0
                        && toState.name.indexOf("applications") < 0 && toState.name.indexOf(ontime_data.defaultState) < 0) {
                    var token = getCookie("token");
                    if (token == null || token == '') {
                        event.preventDefault();
                        $state.transitionTo(ontime_data.defaultState);
                    }
                }
                if (toParams.lastPage) {
                    if (toParams.lastPage !== "daily_attendance") {
                        localStorage.removeItem('dailyAttendanceSearchParams');
                    }
                    if (toParams.lastPage !== "worksite_time_sheet") {
                        localStorage.removeItem('worksiteSearchParams');
                    }
                    if (toParams.lastPage !== "employee_timesheet") {
                        localStorage.removeItem('employeeTimesheetSearchParams');
                    }
                    if (toParams.lastPage !== "patient_time_sheet") {
                        localStorage.removeItem('patientTimesheetSearchParams');
                    }
                    if (toParams.lastPage !== "patient_time_sheet") {
                        localStorage.removeItem('patientTimesheetSearchParams');
                    }
                } else {
                    if (toState.url.indexOf("daily_attendance") < 0) {
                        localStorage.removeItem('dailyAttendanceSearchParams');
                    }
                    if (toState.url.indexOf("worksite_time_sheet") < 0) {
                        localStorage.removeItem('worksiteSearchParams');
                    }
                    if (toState.url.indexOf("employee_timesheet") < 0) {
                        localStorage.removeItem('employeeTimesheetSearchParams');
                    }
                    if (toState.url.indexOf("patient_time_sheet") < 0) {
                        localStorage.removeItem('patientTimesheetSearchParams');
                    }
                }
                $rootScope.paginationLoading = false;
                //setting this jobNo to select the tab by default, changes done in form-wizard directive too.
                if (toState.data && toState.data.tabNo) {
                    $rootScope.tabNo = toState.data.tabNo;
                } else {
                    $rootScope.tabNo = undefined;
                }
            })
            ;

    $rootScope.$on('$locationChangeStart',
            function (event, newUrl, oldUrl) {
                var pattern = /(#\/app)\/([^\/]+)[$|\/]?/;
                if ((newUrl.indexOf('/login') === -1 && oldUrl.indexOf('/login') === -1)) {
                    var newSubUrl = (pattern.exec(newUrl) && pattern.exec(newUrl)[2]) ? pattern.exec(newUrl)[2] : undefined;
                    var oldSubUrl = (pattern.exec(oldUrl) && pattern.exec(oldUrl)[2]) ? pattern.exec(oldUrl)[2] : undefined;
                    //Check the sub url i.e. after app/
                    if (newSubUrl && oldSubUrl && newSubUrl !== oldSubUrl) {
                        if ($.fn.dirtyForms) {
                            if ($('form').dirtyForms('isDirty') || $rootScope.isFormDirty) {
                                if (!confirm("You've made changes on this page which aren't saved. If you leave you will lose these changes.\n\nAre you sure you want to leave this page?")) {
                                    event.preventDefault();
                                } else {
                                    $rootScope.isFormDirty = false;
                                }
                            }
                        }
                    }
                }
            });
    var includedStatesForDirtyCheck = ['app.patient.tab1', 'app.patient.tab2', 'app.patient.tab3', 'app.patient.tab4', 'app.patient.tab5',
        'app.employee.tab1', 'app.employee.tab2', 'app.employee.tab3', 'app.employee.tab4', 'admin.worksite.tab1', 'admin.worksite.tab2', 'app.add-complaint'];
    $rootScope.$on('$stateChangeSuccess',
            function (event, currentState) {
                if (currentState.data != null && currentState.data.feature != null && $rootScope.currentUser.allowedFeature != null) {
                    var features = currentState.data.feature.split(",");
                    var featureAllowed = 0;
                    for (var i = 0; i < features.length; i++) {
                        if ($rootScope.currentUser.allowedFeature.indexOf(features[i]) >= 0) {
                            featureAllowed++;
                        }
                    }
                    if (featureAllowed == 0) {
                        event.preventDefault();
                        $state.transitionTo(ontime_data.defaultState);
                    }
                }
                setTimeout(function () {
                    if ($.fn.dirtyForms) {
                        //https://github.com/snikch/jquery.dirtyforms
                        $('form:dirty').dirtyForms('setClean');
                        //Skip check in login page
                        if (includedStatesForDirtyCheck.indexOf(currentState.name) > -1) {
                            $('form').dirtyForms();
                        }
                    }
                }, 1000);
                if ($rootScope.currentUser != null && getCookie('changePassword') != null && getCookie('changePassword') == 'true') {
                    $rootScope.openResetPasswordModal("resetPasswordModal", 'md', "static", false);
                }

            });
});
app.config(function ($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, ASSETS, $httpProvider, KeepaliveProvider, IdleProvider) {
    IdleProvider.idle(900);
    IdleProvider.timeout(60);
    KeepaliveProvider.interval(10);
    //$urlRouterProvider.otherwise('/add_patient_tab_1');
    $urlRouterProvider.otherwise('/redirect');
    var verifyModuleAllocated = function (UserDAO, $rootScope, $q, $timeout) {
        var deferred = $q.defer();
        if ($rootScope.currentUser.allowedFeature != null) {
            deferred.resolve();
        } else {
            $timeout(function () {
                UserDAO.getUserFeatures().then(function (featureList) {
                    $rootScope.currentUser.allowedFeature = [];
                    if (featureList != null) {
                        for (var i = 0; i < featureList.length; i++) {
                            $rootScope.currentUser.allowedFeature.push(featureList[i].label)
                        }
                    }
                    deferred.resolve();
                });
            });
        }
        return deferred.promise;
    }

    var applicationResolve = {
        resources: function ($ocLazyLoad) {
            return $ocLazyLoad.load([
                ASSETS.forms.jQueryValidate,
                ASSETS.forms.formDirty,
                ASSETS.extra.toastr,
                ASSETS.forms.inputmask,
                ASSETS.forms.tagsinput,
                ASSETS.core.moment,
                ASSETS.forms.daterangepicker,
                ASSETS.forms.select2,
                ASSETS.tables.datatables
            ]);
        }
    };

    var applicationRootConfig = {
        abstract: true,
        url: '/applications-edit',
        templateUrl: appHelper.viewTemplatePath('application', 'add_application'),
        controller: 'AddApplicationCtrl as addEmployee',
        resolve: applicationResolve
    };

    var viewOnlyApplicationConfig = function () {
        var config = angular.copy(applicationRootConfig);
        config['url'] = '/applications';
        config['data'] = {'feature': 'VIEW_APPLICATION_LIST'};
        return config;
    }
    $stateProvider.
            // Main Layout Structure
            state('app', {
                abstract: true,
                url: '/app',
                templateUrl: appHelper.templatePath('layout/app-body'),
                controller: function ($rootScope) {
                    $rootScope.isLoginPage = false;
                    $rootScope.isLightLoginPage = false;
                    $rootScope.isLockscreenPage = false;
                    $rootScope.isMainPage = true;
                    $rootScope.isAdminPortal = false;
                },
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.jQueryValidate,
                            ASSETS.forms.formDirty,
                            ASSETS.extra.toastr,
                            ASSETS.forms.inputmask,
                            ASSETS.forms.tagsinput,
                            ASSETS.core.moment,
                            ASSETS.forms.daterangepicker,
                            ASSETS.forms.select2,
                            ASSETS.tables.datatables
                        ]);
                    },
                    moduleAllocated: function (UserDAO ,  $rootScope, $q, $timeout) {
                        return verifyModuleAllocated(UserDAO, $rootScope, $q, $timeout);
                    }
                }
            })
            .state('redirect', {
                url: '/redirect',
                controller: function ($state) {
                    if (ontime_data.redirectStateOrURL.indexOf("http") > -1) {
                        window.location.href = ontime_data.redirectStateOrURL;
                    } else {
                        $state.transitionTo(ontime_data.redirectStateOrURL);
                    }
                }
            })
            .state('application-redirect', {
                url: '/application-redirect',
                controller: function ($state, $location) {
                    var data = $location.search();
                    setCookie("token", data.refreshToken, 7);
                    setCookie("un", data.applicationId, 7);
                    setCookie("cc", data.orgCode, 7);
                    $state.go('applications-single-tab', {'id': data.applicationId});
                }
            })
            // Login
            .state('login', {
                url: '/login',
                templateUrl: appHelper.templatePath('login'),
                controller: 'LoginCtrl',
            })
            // Application
            .state('applications-home', {
                url: '/applications/home',
                templateUrl: appHelper.viewTemplatePath('application', 'start-applications'),
                controller: 'ApplicationHomeCtrl as application',
                resolve: applicationResolve
            })
            // application start
            .state('applications-new', {
                url: '/applications/:posting_identifier/:resource_identifier/start',
                controller: 'ApplicationCtrl as application',
                templateUrl: appHelper.viewTemplatePath('application', 'start-applications'),
                resolve: applicationResolve
            })
            // application retrieve
            .state('applications-existing', {
                url: '/applications/:posting_identifier/:resource_identifier/retrieve',
                controller: 'RetrieveApplicationCtrl as application',
                templateUrl: appHelper.viewTemplatePath('application', 'start-applications'),
                resolve: applicationResolve
            })
            // application edit
            .state('applications-edit', applicationRootConfig)
            // application retrieve
            .state('applications-single-tab', {
                url: '/:id/details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_single_tab'),
                controller: 'AddApplicationSinglePageCtrl as addEmployee',
                resolve: applicationResolve,
                data: {}
            })
            .state('applications-edit.tab1', {
                url: '/:id/details-legacy',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_1'),
                data: {
                    tabNo: 1
                }
            })
            .state('applications-edit.tab2', {
                url: '/:id/location-details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_2'),
                data: {
                    tabNo: 2
                }
            })
            .state('applications-edit.tab3', {
                url: '/:id/education-details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_3'),
                data: {
                    tabNo: 3
                }
            })
            .state('applications-edit.tab4', {
                url: '/:id/work-experience',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_4'),
                data: {
                    tabNo: 4
                }
            })
            .state('applications-edit.tab5', {
                url: '/:id/general-details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_5'),
                data: {
                    tabNo: 5
                }
            })
            // employee creation page
            .state('application-viewonly', viewOnlyApplicationConfig())
            // add_application_tab_1
            .state('application-viewonly.tab1', {
                url: '/:id/details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_1'),
                data: {
                    tabNo: 1
                }
            })
            // add_application_tab_2
            .state('application-viewonly.tab2', {
                url: '/:id/location-details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_2'),
                data: {
                    tabNo: 2
                }
            })
            .state('application-viewonly.tab3', {
                url: '/:id/education-details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_3'),
                data: {
                    tabNo: 3
                }
            })
            .state('application-viewonly.tab4', {
                url: '/:id/employment-details',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_4'),
                data: {
                    tabNo: 4
                }
            })
            .state('application-viewonly.tab5', {
                url: '/:id/certify',
                templateUrl: appHelper.viewTemplatePath('application', 'add_application_tab_5'),
                data: {
                    tabNo: 5
                }
            })
            .state('forgotpassword', {
                url: '/forgotpassword',
                templateUrl: appHelper.templatePath('forgot_password'),
                controller: 'ForgotPasswordCtrl as forgotPwd',
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.jQueryValidate,
                            ASSETS.extra.toastr,
                        ]);
                    },
                }
            }).
            // patient creation page
            state('app.patient', {
                abstract: true,
                url: '/patient',
                templateUrl: appHelper.viewTemplatePath('patient', 'add_patient'),
                controller: 'AddPatientCtrl as addPatient',
            }).
            // add_patient_tab_1
            state('app.patient.tab1', {
                url: '/tab1/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'add_patient_tab_1'),
                data: {
                    tabNo: 1,
                    feature: 'CREATE_PATIENT,EDIT_PATIENT'
                }
            }).
            // add_patient_tab_2
            state('app.patient.tab2', {
                url: '/tab2/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'add_patient_tab_2'),
                data: {
                    tabNo: 2,
                    feature: 'CREATE_PATIENT,EDIT_PATIENT'
                }
            }).
            // add_patient_tab_3
            state('app.patient.tab3', {
                url: '/tab3/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'add_patient_tab_3'),
                data: {
                    tabNo: 3,
                    feature: 'CREATE_PATIENT,EDIT_PATIENT'
                }
            }).
            // add_patient_tab_4
            state('app.patient.tab4', {
                url: '/tab4/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'add_patient_tab_4'),
                data: {
                    tabNo: 4,
                    feature: 'CREATE_PATIENT,EDIT_PATIENT'
                }
            }).
            // add_patient_tab_5
            state('app.patient.tab5', {
                url: '/tab5/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'add_patient_tab_5'),
                data: {
                    tabNo: 5,
                    feature: 'CREATE_PATIENT,EDIT_PATIENT'
                }
            }).
            // view patients single page
            state('app.patient-list', {
                url: '/patient-list/:status',
                templateUrl: appHelper.viewTemplatePath('patient', 'view_patient'),
                controller: 'ViewPatientsCtrl as viewPatient',
                data: {
                    feature: 'VIEW_PATIENT'
                }
            }).
            state('app.patient_records', {
                url: '/patient_records',
                templateUrl: appHelper.viewTemplatePath('patient', 'patient_records_list'),
                controller: 'PatientRecordsCtrl as patientRecordsCtrl',
                data: {
                    feature: 'CREATE_PATIENT,EDIT_PATIENT',
                    title: 'Search Patient'
                }
            }).
            state('app.patient_records_patient', {
                url: '/patient_records/:patientId/list',
                templateUrl: appHelper.viewTemplatePath('patient', 'patient_records_list'),
                controller: 'PatientRecordsCtrl as patientRecordsCtrl',
                data: {
                    feature: 'CREATE_PATIENT,EDIT_PATIENT',
                    title: 'Patient Record List'
                }
            }).
            state('app.patient_records_view', {
                url: '/patient_records/:patientId/list/:recordId/view',
                templateUrl: appHelper.viewTemplatePath('patient', 'patient_records_single_view'),
                data: {
                    feature: 'CREATE_PATIENT,EDIT_PATIENT',
                    title: 'Patient Record Edit'
                }
            }).
            // edit patient record page
            state('app.nursing_assessment', {
                url: '/nursing_assessment/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'nursing_assessment'),
                controller: 'NursingAssessmentCtrl as editPatient'
            }).
            // Medical Reconciliation Form
            state('app.medication_reconciliation', {
                url: '/medication_reconciliation/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'medication_reconciliation_form'),
                controller: 'MedicationReconciliationCtrl as medRecon'
            }).
            // Progress Note Form
            state('app.progress_note', {
                url: '/progress_note/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'progress_note_form'),
                controller: 'ProgressNotesCtrl as progressNote'
            }).
            // Medicla Orders Form
            state('app.medical_orders', {
                url: '/medical_orders/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'medical_orders_form'),
                controller: 'MedicalOrdersCtrl as medOrder'
            }).
            // Home Care Plan Form
            state('app.home_care_plan', {
                url: '/home_care_plan/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'home_care_plan'),
                controller: 'HomeCarePlanCtrl as homeCarePlan',
            }).
            // Patient Consents Form
            state('app.patient_consents', {
                url: '/patient_consents/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'patient_consents'),
                controller: 'PatientConsentsCtrl as patientConsents',
            }).
            // PDF Records Form
            state('app.patient_record_upload', {
                url: '/patient_record_upload/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'patient_record_upload'),
                controller: 'PatientRecUploadCtrl as patientRecUploadCtrl',
            }).
            // Employee Supervision
            state('app.employee_supervision', {
                url: '/employee_supervision/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'employee_supervision'),
                controller: 'EmpSupervisionCtrl as empSupervisionCtrl',
            }).            
            // Emergency & Disaster Form
            state('app.emergency_disaster', {
                url: '/emergency_disaster/:patientId/:recordType/:id',
                templateUrl: appHelper.viewTemplatePath('patient', 'emergency_disaster_form'),
                controller: 'EmergencyDisasterCtrl as emergencyDisasterCtrl',
            }).
            // employee creation page
            state('app.employee', {
                abstract: true,
                url: '/employee',
                templateUrl: appHelper.viewTemplatePath('employee', 'add_employee'),
                controller: 'AddEmployeeCtrl as addEmployee',
            }).
            // add_employee_tab_1
            state('app.employee.tab1', {
                url: '/tab1/:id',
                templateUrl: appHelper.viewTemplatePath('employee', 'add_employee_tab_1'),
                data: {
                    tabNo: 1,
                    feature: 'CREATE_EMPLOYEE,HR_EDIT_EMPLOYEE,EDIT_EMPLOYEE_DEMO'
                }
            }).
            // add_employee_tab_2
            state('app.employee.tab2', {
                url: '/tab2/:id',
                templateUrl: appHelper.viewTemplatePath('employee', 'add_employee_tab_2'),
                data: {
                    tabNo: 2,
                    feature: 'VIEW_EMPLOYEE_WAGES'
                }
            }).
            // add_employee_tab_3
            state('app.employee.tab3', {
                url: '/tab3/:id',
                templateUrl: appHelper.viewTemplatePath('employee', 'add_employee_tab_3'),
                data: {
                    tabNo: 3,
                    feature: 'CREATE_EMPLOYEE,HR_EDIT_EMPLOYEE'
                },
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.select2
                        ]);
                    }
                }
            }).
            // add_employee_tab_4
            state('app.employee.tab4', {
                url: '/tab4/:id',
                templateUrl: appHelper.viewTemplatePath('employee', 'add_employee_tab_4'),
                data: {
                    tabNo: 4,
                    feature: 'CREATE_EMPLOYEE,HR_EDIT_EMPLOYEE'
                }
            }).
            //view employees single page
            state('app.employee-list', {
                url: '/employee-list/:status',
                templateUrl: appHelper.viewTemplatePath('employee', 'view_employee'),
                controller: 'ViewEmployeesCtrl as viewEmployee',
                data: {
                    feature: 'VIEW_EMPLOYEE'
                }
            }).
            //view applications single page
            state('app.application-list', {
                url: '/application-list/:status',
                templateUrl: appHelper.viewTemplatePath('application', 'view_application'),
                controller: 'ViewApplicationsCtrl as viewApplication',
                data: {
                    feature: 'VIEW_APPLICATION_LIST'
                },
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.select2,
                        ]);
                    }
                }
            }).
            // edit_timesheet
            state('app.edit_timesheet', {
                url: '/edit_timesheet/:id?empId&patId&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
                data: {
                    feature: 'EDIT_EMPLOYEE_TIMESHEET,EDIT_PATIENT_TIMESHEET'
                }
            }).
            // edit_missed_punch
            state('app.edit_missed_punch', {
                url: '/edit_missed_punch/:id?empId&patId&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
            }).
            // timesheet
            state('app.employee_timesheet', {
                url: '/employee_timesheet?id&from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'employee_timesheet'),
                controller: 'EmployeeTimeSheetCtrl as empTimesheet',
                data: {
                    feature: 'VIEW_EMPLOYEE_TIMESHEET'
                }
            }).
            // manual_punch
            state('app.manual_punch', {
                url: '/manual_punch',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
                data: {
                    feature: 'CREATE_MANUAL_PUNCH'
                }
            }).
            // manual_punch
            state('app.manual_punch_employee', {
                url: '/manual_punch/employee/:id?from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
                data: {
                    feature: 'CREATE_MANUAL_PUNCH'
                }
            }).
            // manual_punch
            state('app.manual_punch_patient', {
                url: '/manual_punch/patient/:id',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
                data: {
                    feature: 'CREATE_MANUAL_PUNCH'
                }
            }).
            // manual_punch
            state('app.manual_punch_schedule', {
                url: '/manual_punch/schedule/:id?from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
            }).
            // manual_punch
            state('app.manual_punch_worksite', {
                url: '/manual_punch/worksite/:id?from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'manual_punch'),
                controller: 'ManualPunchCtrl as manualPunch',
                data: {
                    feature: 'CREATE_MANUAL_PUNCH'
                }
            }).
            // patient_time_sheet
            state('app.patient_time_sheet', {
                url: '/patient_time_sheet?id&from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'patient_time_sheet'),
                controller: 'PatientTimeSheetCtrl as patTimesheet',
                data: {
                    feature: 'VIEW_PATIENT_TIMESHEET'
                }
            }).
            // daily_attendance
            state('app.daily_attendance', {
                url: '/daily_attendance?id&from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'daily_attendance'),
                controller: 'DailyAttendanceCtrl as dAttendance',
                data: {
                    feature: 'VIEW_DAILY_ATTENDANCE'
                }
            }).
            // daily_attendance
            state('app.worksite_time_sheet', {
                url: '/worksite_time_sheet?id&from&to&lastPage',
                templateUrl: appHelper.viewTemplatePath('timesheet', 'daily_attendance'),
                controller: 'DailyAttendanceCtrl as dAttendance',
                data: {
                    feature: 'WORKSITE_TIMESHEET'
                }
            }).
            // add_inusrer
            state('app.insurer', {
                url: '/insurer/:id',
                controller: 'AddInsurerCtrl as addInsurer',
                templateUrl: appHelper.viewTemplatePath('insurer', 'add_inusrer'),
                data: {
                    feature: 'CREATE_INSURANCE_PROVIDER,EDIT_INSURANCE_PROVIDER'
                }
            }).
            // view_insurer
            state('app.insurer-list', {
                url: '/insurer-list',
                controller: 'ViewInsurersCtrl as viewInsurer',
                templateUrl: appHelper.viewTemplatePath('insurer', 'view_insurer'),
                data: {
                    feature: 'VIEW_INSURANCE_PROVIDER'
                }
            }).
            // pay_rates
            state('app.pay_rates', {
                url: '/pay_rates',
                templateUrl: appHelper.templatePath('pay_rates'),
            }).
            // payroll_history
            state('app.payroll_history', {
                url: '/payroll_history',
                controller: 'PayrollHistoryCtrl as payrollHist',
                templateUrl: appHelper.viewTemplatePath('payroll', 'payroll_history'),
                data: {
                    feature: 'VIEW_PAYROLL_HISTORY'
                }
            }).
            // payroll_review
            state('app.payroll_review', {
                url: '/payroll_review',
                templateUrl: appHelper.templatePath('payroll_review'),
            }).
            // payroll_session
            state('app.payroll_session', {
                url: '/payroll_session',
                controller: 'PayrollSessionCtrl as payrollSession',
                templateUrl: appHelper.viewTemplatePath('payroll', 'payroll_session'),
                data: {
                    feature: 'VIEW_PAYROLL_SESSION'
                }
            }).
            state('app.batch_session', {
                url: '/payroll_session/:id',
                controller: 'PayrollSessionCtrl as payrollSession',
                templateUrl: appHelper.viewTemplatePath('payroll', 'payroll_session'),
                data: {
                    feature: 'EDIT_PAYROLL_SESSION'
                }
            }).
            // payroll_settings
            state('app.payroll_settings', {
                url: '/payroll_settings',
                templateUrl: appHelper.viewTemplatePath('payroll', 'payroll_settings'),
                controller: 'PayrollSettingsCtrl as payrollSet',
                data: {
                    feature: 'VIEW_PAYROLL_SETTINGS'
                }
            }).
            // biling
//            state('app.biling', {
//                url: '/biling',
//                templateUrl: appHelper.templatePath('biling'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.jQueryValidate,
//                            ASSETS.extra.toastr,
//                        ]);
//                    },
//                }
//            }).
            state('app.manual_claim', {
                url: '/manual_claim',
                templateUrl: appHelper.viewTemplatePath('billing', 'manual_claim_new'),
                controller: 'ManualClaimCtrl as manualClaim',
                data: {
                    feature: 'CREATE_MANUAL_CLAIM'
                }
            }).
            state('app.manual_claim_review', {
                url: '/manual_claim/:id',
                templateUrl: appHelper.viewTemplatePath('billing', 'manual_claim_new'),
                controller: 'ManualClaimCtrl as manualClaim'
            }).
            state('app.manual_claim_edit', {
                url: '/manual_claim/:id/edit',
                templateUrl: appHelper.viewTemplatePath('billing', 'manual_claim_new'),
                controller: 'ManualClaimCtrl as manualClaim'
            }).
            state('app.manual_claim_ub04', {
                url: '/manual_claim_ub04',
                templateUrl: appHelper.viewTemplatePath('billing', 'manual_claim_ub04'),
                controller: 'ManualClaimUB04Ctrl as manualClaim',
                data: {
                    feature: 'CREATE_MANUAL_CLAIM'
                }
            }).
            state('app.manual_claim_ub04_review', {
                url: '/manual_claim_ub04/:id',
                templateUrl: appHelper.viewTemplatePath('billing', 'manual_claim_ub04'),
                controller: 'ManualClaimUB04Ctrl as manualClaim'
            }).
            state('app.manual_claim_ub04_edit', {
                url: '/manual_claim_ub04/:id/edit',
                templateUrl: appHelper.viewTemplatePath('billing', 'manual_claim_ub04'),
                controller: 'ManualClaimUB04Ctrl as manualClaim'
            }).
//            state('app.billing_tab_1', {
//                url: '/billing_tab_1',
//                templateUrl: appHelper.viewTemplatePath('billing', 'billing_tab_1'),
//                controller: 'BillingTab1Ctrl as billing1',
//            }).
//            state('app.billing_tab_2', {
//                url: '/billing_tab_2',
//                templateUrl: appHelper.viewTemplatePath('billing', 'billing_tab_2'),
//            }).
            // biling_history
            state('app.biling_history', {
                url: '/biling_history',
                templateUrl: appHelper.viewTemplatePath('billing', 'biling_history'),
                controller: 'BillingHistoryCtrl as billingHistory',
                data: {
                    feature: 'VIEW_BILLING_HISTORY'
                }
            }).
            // biling_history
            state('app.biling_setting', {
                url: '/biling_setting',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_settings'),
                controller: 'BillingSettingsCtrl as billingSetting',
                data: {
                    feature: 'CREATE_BILLING_SETTING'
                }
            }).
            // billing_session
            state('app.billing_session', {
                url: '/billing_session',
                controller: 'BillingSessionCtrl as billingSession',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_session'),
                data: {
                    feature: 'VIEW_BILLING_SESSION'
                }
            }).
            // existing billing batch
            state('app.billing_batch', {
                url: '/billing_session/:id',
                controller: 'BillingSessionCtrl as billingSession',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_session'),
            }).
            state('app.claim_search', {
                url: '/claim_search',
                controller: 'ClaimSearchCtrl as claimSearch',
                templateUrl: appHelper.viewTemplatePath('billing', 'claim_search'),
                data: {
                    feature: 'VIEW_BILLING_HISTORY'
                }
            }).state('app.bill_reader', {
        url: '/bill_reader',
        controller: 'EdiReaderCtrl as ediReader',
        templateUrl: appHelper.viewTemplatePath('billing', 'edi_reader'),
        data: {
            feature: 'EDI_DATA_READER'
        }
    }).
            state('app.billing_reconciliation', {
                url: '/billing_reconciliation',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_reconciliation'),
                data: {
                    feature: 'MANAGE_BILLING_RECONCILIATION'
                }
            }).
            state('app.billing_reconciliation_list', {
                url: '/billing_reconciliation/list',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_reconciliation_list'),
                data: {
                    feature: 'MANAGE_BILLING_RECONCILIATION',
                    title: 'View'
                }
            }).
            state('app.billing_reconciliation_new', {
                url: '/billing_reconciliation/new',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_reconciliation_manage'),
                data: {
                    feature: 'MANAGE_BILLING_RECONCILIATION',
                    title: 'New'
                }
            }).
            state('app.billing_reconciliation_view', {
                url: '/billing_reconciliation/view/:id',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_reconciliation_manage'),
                data: {
                    feature: 'MANAGE_BILLING_RECONCILIATION',
                    title: 'View'
                }
            }).
            state('app.billing_reconciliation_edi_read', {
                url: '/billing_reconciliation/edi_read/:dataId',
                templateUrl: appHelper.viewTemplatePath('billing', 'billing_reconciliation_manage'),
                data: {
                    feature: 'MANAGE_BILLING_RECONCILIATION',
                    title: 'EdiRead'
                }
            }).
            state('app.location_lookup', {
                url: '/location_lookup',
                controller: 'LocationLookupCtrl as locationLookup',
                templateUrl: appHelper.viewTemplatePath('billing', 'location_lookup')
            }).
            state('app.resubmission_lookup', {
                url: '/resubmission_lookup',
                controller: 'ResubmissionLookupCtrl as resubmissionLookup',
                templateUrl: appHelper.viewTemplatePath('billing', 'resubmission_code_lookup'),
            }).
            // Dashboards
            state('app.dashboard', {
                url: '/dashboard',
                templateUrl: appHelper.viewTemplatePath('dashboard', 'dashboard'),
                controller: 'DashboardCtrl as dashboard',
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.charts.dxGlobalize,
                            ASSETS.extra.toastr,
                        ]);
                    },
                    dxCharts: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.charts.dxCharts,
                        ]);
                    },
                }
            }).
            // company_information
            state('admin.company_information', {
                url: '/company_information',
                templateUrl: appHelper.viewTemplatePath('company', 'company_information'),
                controller: 'AddCompanyCtrl as addCompany',
                data: {
                    feature: 'CREATE_COMPANY_INFORMATION'
                }

            }).
            // Employee Calendar
            state('app.employee-calendar', {
                url: '/employee-calendar/:id',
                templateUrl: appHelper.viewTemplatePath('calendar', 'employee_calendar'),
                controller: 'CalendarCtrl as calendar',
                data: {
                    feature: 'VIEW_EMPLOYEE_SCHEDULE'
                }
            }).
            // Patient Calendar
            state('app.patient-calendar', {
                url: '/patient-calendar/:id?lastPage',
                templateUrl: appHelper.viewTemplatePath('calendar', 'patient_calendar'),
                controller: 'PatientCalendarCtrl as patientcalendar',
                data: {
                    feature: 'VIEW_PATIENT_SCHEDULE'
                }
            }).
            // coordinator calendar
            state('app.coordinator-calendar', {
                url: '/coordinator-calendar/:id?lastPage',
                templateUrl: appHelper.viewTemplatePath('calendar', 'coordinator_calendar'),
                controller: 'CoordinatorCalendarCtrl as coordinatorcalendar',
                data: {
                    feature: 'VIEW_COORDINATOR_SCHEDULE'
                }
            }).
            //Complaints
            state('app.complaints', {
                url: '/complaints/:status',
                templateUrl: appHelper.viewTemplatePath('forms', 'complaints_list'),
                controller: 'ComplaintsController as compCtrl'
            }).
            // Add complaint
            state('app.add-complaint', {
                url: '/add-complaint?id&print',
                templateUrl: appHelper.viewTemplatePath('forms', 'add_complaint'),
                controller: 'AddComplaintController as addCompCtrl'
            }).
            // Add satisfaction survey
            state('app.satisfaction-survey', {
                url: '/satisfaction-survey',
                templateUrl: appHelper.viewTemplatePath('forms', 'satisfaction_survey'),
                controller: 'SatisfactionSurveyController as satisfactionSurveyCtrl',
                data: {
                    feature: 'CREATE_SURVEY'
                }
            }).
            // Forms Setting
            state('app.forms-setting', {
                url: '/forms-setting',
                templateUrl: appHelper.viewTemplatePath('forms', 'forms_setting'),
                controller: 'FormSettingController as formCtrl'
            }).
            // Report
            state('app.report', {
                url: '/report',
                templateUrl: appHelper.viewTemplatePath('report', 'report'),
                controller: 'ReportCtrl as report',
                data: {
                    feature: 'VIEW_REPORTS'
                }
            }).
            state('admin', {
                abstract: true,
                url: '/admin',
                templateUrl: appHelper.templatePath('layout/app-body'),
                controller: function ($rootScope) {
                    $rootScope.isLoginPage = false;
                    $rootScope.isLightLoginPage = false;
                    $rootScope.isLockscreenPage = false;
                    $rootScope.isMainPage = true;
                    $rootScope.isAdminPortal = true;
                },
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.jQueryValidate,
                            ASSETS.forms.formDirty,
                            ASSETS.extra.toastr,
                            ASSETS.forms.inputmask,
                            ASSETS.forms.tagsinput,
                            ASSETS.core.moment,
                            ASSETS.forms.daterangepicker,
                            ASSETS.forms.select2,
                            ASSETS.tables.datatables
                        ]);
                    },
                    moduleAllocated: function (UserDAO, $rootScope, $q, $timeout) {
                        return verifyModuleAllocated(UserDAO, $rootScope, $q, $timeout);
                    }
                }
            }).
            state('admin.dashboard', {
                url: '/dashboard',
                templateUrl: appHelper.viewTemplatePath('dashboard', 'dashboard'),
                controller: 'DashboardCtrl as dashboard',
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.charts.dxGlobalize,
                            ASSETS.extra.toastr,
                        ]);
                    },
                    dxCharts: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.charts.dxCharts,
                        ]);
                    },
                }
            }).
            state('admin.position-list', {
                url: '/position-list',
                templateUrl: appHelper.viewTemplatePath('position', 'view_position'),
                controller: 'ViewPositionsCtrl as viewPosition',
                data: {
                    feature: 'VIEW_POSITION'
                }
            }).
            state('admin.role-list', {
                url: '/role-list',
                templateUrl: appHelper.viewTemplatePath('roles', 'view_roles'),
                controller: 'ViewRolesCtrl as viewRole',
                data: {
                    feature: 'VIEW_ROLE'
                },
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.select2,
                        ]);
                    }
                }
            }).
            state('admin.document-list', {
                url: '/document-library',
                templateUrl: appHelper.viewTemplatePath('documentlibrary', 'view_document'),
                controller: 'ViewDocumentsCtrl as viewDocuments',
                data: {
                    feature: 'MANAGE_DOCUMENTS'
                }
            }).
            state('admin.event-notifications', {
                url: '/event-notifications',
                templateUrl: appHelper.viewTemplatePath('eventNotifications', 'view_event_notifications'),
                controller: 'EventNotificationsCtrl as eventNotifications',
                data: {
                    feature: 'EVENT_NOTIFICATIONS'
                }
            }).
            state('admin.consents-list', {
                url: '/consents-list',
                templateUrl: appHelper.viewTemplatePath('consents', 'consents-list'),
                controller: 'ConsentsListCtrl as consentsList',
                data: {
                    feature: 'VIEW_CONSENTS_TYPES'
                },
                resolve: {
                    bootstrap: function($ocLazyLoad){
                        return $ocLazyLoad.load([
                            ASSETS.core.bootstrap,
                        ]);
                    },
                    resources: function($ocLazyLoad){
                        return $ocLazyLoad.load([
                            ASSETS.uikit.base,
                            ASSETS.uikit.nestable,
                        ]);
                    },
                }                
            }).
            state('admin.caretype-list', {
                url: '/caretype-list',
                templateUrl: appHelper.viewTemplatePath('caretype', 'view_caretype'),
                controller: 'ViewCareTypesCtrl as viewCareType',
                data: {
                    feature: 'VIEW_CARETYPE'
                }
            }).
            state('admin.language-list', {
                url: '/language-list',
                templateUrl: appHelper.viewTemplatePath('language', 'view_language'),
                controller: 'ViewLanguagesCtrl as viewLanguage',
                data: {
                    feature: 'VIEW_LANGUAGE'
                }
            }).
            state('admin.task-list', {
                url: '/task-list',
                templateUrl: appHelper.viewTemplatePath('task', 'view_task'),
                controller: 'ViewTasksCtrl as viewTask',
                data: {
                    feature: 'VIEW_TASK'
                }
            }).
            state('admin.user', {
                url: '/user/:id',
                templateUrl: appHelper.viewTemplatePath('user', 'add_user'),
                controller: 'AddUserCtrl as addUser',
                data: {
                    feature: 'CREATE_USER,EDIT_USER'
                },
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.select2,
                        ]);
                    }
                }
            }).
            state('admin.user-list', {
                url: '/user-list/:status',
                templateUrl: appHelper.viewTemplatePath('user', 'view_user'),
                controller: 'ViewUsersCtrl as viewUser',
                data: {
                    feature: 'VIEW_USER'
                }
            }).
            // worksite creation page
            state('admin.worksite', {
                abstract: true,
                url: '/worksite',
                templateUrl: appHelper.viewTemplatePath('worksite', 'add_worksite'),
                controller: 'AddWorksiteCtrl as addWorksite'
            }).
            // add_worksite_tab_1
            state('admin.worksite.tab1', {
                url: '/tab1/:id',
                templateUrl: appHelper.viewTemplatePath('worksite', 'add_worksite_tab_1'),
                data: {
                    tabNo: 1,
                    feature: 'CREATE_WORKSITE,EDIT_WORKSITE'
                }
            }).
            // add_worksite_tab_2
            state('admin.worksite.tab2', {
                url: '/tab2/:id',
                templateUrl: appHelper.viewTemplatePath('worksite', 'add_worksite_tab_2'),
                data: {
                    tabNo: 2,
                    feature: 'CREATE_WORKSITE,EDIT_WORKSITE'
                }
            }).
            // view worksites page
            state('admin.worksite-list', {
                url: '/worksite-list/:status',
                templateUrl: appHelper.viewTemplatePath('worksite', 'view_worksite'),
                controller: 'ViewWorksitesCtrl as viewWorksite',
                data: {
                    tabNo: 1,
                    feature: 'VIEW_WORKSITE'
                }
            }).
            state('admin.manage_role', {
                url: '/manage_role',
                templateUrl: appHelper.viewTemplatePath('security', 'manage_role'),
                controller: 'ManageRoleCtrl as manageRole'
            }).
            state('admin.manage_access', {
                url: '/manage_access',
                templateUrl: appHelper.viewTemplatePath('security', 'manage_access'),
                controller: 'ManageAccessCtrl as manageAccess',
            }).
            //view dispatch page
            state('app.dispatch-list', {
                url: '/dispatch-list/:status',
                templateUrl: appHelper.viewTemplatePath('calendar', 'view_dispatch'),
                controller: 'ViewDispatchCtrl as viewDispatch',
                data: {
                    feature: 'VIEW_DISPATCH'
                }
            }).
            // Dispatch Calendar
            state('app.search-employee-calendar', {
                url: '/search-employee-calendar/:id',
                templateUrl: appHelper.viewTemplatePath('calendar', 'employee_calendar'),
                controller: 'CalendarCtrl as calendar',
                data: {
                    feature: 'SEARCH_EMPLOYEE'
                }
            }).
            state('app.worksite-schedule', {
                url: '/worksite-schedule/:id',
                templateUrl: appHelper.viewTemplatePath('calendar', 'employee_calendar'),
                controller: 'CalendarCtrl as calendar',
                data: {
                    feature: 'WORKSITE_SCHEDULE'
                }
            }).
            state('app.dispatch-info', {
                url: '/dispatch-info/:id',
                templateUrl: appHelper.viewTemplatePath('calendar', 'view_dispatch_info'),
                controller: 'ViewDispatchInfoCtrl as viewDispatchInfo',
                data: {
                    feature: 'EDIT_DISPATCH'
                }
            }).
            state('admin.benefits', {
                url: '/benefits',
                templateUrl: appHelper.viewTemplatePath('benefits', 'view_benefit'),
                controller: 'ViewBenefitsCtrl as benefit',
                data: {
                    feature: 'VIEW_BENEFIT'
                }
            }).
            state('admin.managebenefits', {
                url: '/benefits/:id',
                templateUrl: appHelper.viewTemplatePath('benefits', 'add_benefit'),
                controller: 'ManageBenefitCtrl as manageBenefit',
                data: {
                    feature: 'CREATE_BENEFIT,EDIT_BENEFIT'
                }
            }).state('admin.employee-adjustments', {
        url: '/employee-adjustments/:status',
        templateUrl: appHelper.viewTemplatePath('benefits', 'benefit-adjistments'),
        controller: 'BenefitAdjistmentsCtrl as empBenefitCtrl',
        data: {
            feature: 'EMPLOYEE_BENEFIT_ADJUSTMENT'
        }
    }).state('admin.benifit-payouts', {
        url: '/benifit-payouts/:status',
        templateUrl: appHelper.viewTemplatePath('benefits', 'benifit-payouts'),
        controller: 'BenefitPayoutCtrl as benefitPayoutCtrl',
        data: {
            feature: 'EMPLOYEE_BENEFIT_PAYOUT'
        }
    }).
// Update Highlights
//            state('app.update-highlights', {
//                url: '/update-highlights',
//                templateUrl: appHelper.templatePath('update-highlights'),
//            }).
//            // Layouts
//            state('app.layout-and-skins', {
//                url: '/layout-and-skins',
//                templateUrl: appHelper.templatePath('layout-and-skins'),
//            }).
//            // UI Elements
//            state('app.ui-panels', {
//                url: '/ui-panels',
//                templateUrl: appHelper.templatePath('ui/panels'),
//            }).
//            state('app.ui-buttons', {
//                url: '/ui-buttons',
//                templateUrl: appHelper.templatePath('ui/buttons')
//            }).
//            state('app.ui-tabs-accordions', {
//                url: '/ui-tabs-accordions',
//                templateUrl: appHelper.templatePath('ui/tabs-accordions')
//            }).
//            state('app.ui-modals', {
//                url: '/ui-modals',
//                templateUrl: appHelper.templatePath('ui/modals'),
//                controller: 'UIModalsCtrl'
//            }).
//            state('app.ui-breadcrumbs', {
//                url: '/ui-breadcrumbs',
//                templateUrl: appHelper.templatePath('ui/breadcrumbs')
//            }).
//            state('app.ui-blockquotes', {
//                url: '/ui-blockquotes',
//                templateUrl: appHelper.templatePath('ui/blockquotes')
//            }).
//            state('app.ui-progress-bars', {
//                url: '/ui-progress-bars',
//                templateUrl: appHelper.templatePath('ui/progress-bars')
//            }).
//            state('app.ui-navbars', {
//                url: '/ui-navbars',
//                templateUrl: appHelper.templatePath('ui/navbars')
//            }).
//            state('app.ui-alerts', {
//                url: '/ui-alerts',
//                templateUrl: appHelper.templatePath('ui/alerts')
//            }).
//            state('app.ui-pagination', {
//                url: '/ui-pagination',
//                templateUrl: appHelper.templatePath('ui/pagination')
//            }).
//            state('app.ui-typography', {
//                url: '/ui-typography',
//                templateUrl: appHelper.templatePath('ui/typography')
//            }).
//            state('app.ui-other-elements', {
//                url: '/ui-other-elements',
//                templateUrl: appHelper.templatePath('ui/other-elements')
//            }).
//            // Widgets
//            state('app.widgets', {
//                url: '/widgets',
//                templateUrl: appHelper.templatePath('widgets'),
//                resolve: {
//                    deps: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.maps.vectorMaps,
//                            ASSETS.icons.meteocons
//                        ]);
//                    }
//                }
//            }).
//            // Mailbox
//            state('app.mailbox-inbox', {
//                url: '/mailbox-inbox',
//                templateUrl: appHelper.templatePath('mailbox/inbox'),
//            }).
//            state('app.mailbox-compose', {
//                url: '/mailbox-compose',
//                templateUrl: appHelper.templatePath('mailbox/compose'),
//                resolve: {
//                    bootstrap: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.bootstrap,
//                        ]);
//                    },
//                    bootstrapWysihtml5: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.bootstrapWysihtml5,
//                        ]);
//                    },
//                }
//            }).
//            state('app.mailbox-message', {
//                url: '/mailbox-message',
//                templateUrl: appHelper.templatePath('mailbox/message'),
//            }).
//            // Tables
//            state('app.tables-basic', {
//                url: '/tables-basic',
//                templateUrl: appHelper.templatePath('tables/basic'),
//            }).
//            state('app.tables-responsive', {
//                url: '/tables-responsive',
//                templateUrl: appHelper.templatePath('tables/responsive'),
//                resolve: {
//                    deps: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.tables.rwd,
//                        ]);
//                    }
//                }
//            }).
//            state('app.tables-datatables', {
//                url: '/tables-datatables',
//                templateUrl: appHelper.templatePath('tables/datatables'),
//                resolve: {
//                    deps: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.tables.datatables,
//                        ]);
//                    },
//                }
//            }).
//            // Forms
//            state('app.forms-native', {
//                url: '/forms-native',
//                templateUrl: appHelper.templatePath('forms/native-elements'),
//            }).
//            state('app.forms-advanced', {
//                url: '/forms-advanced',
//                templateUrl: appHelper.templatePath('forms/advanced-plugins'),
//                resolve: {
//                    jqui: function($ocLazyLoad) {
//                        return $ocLazyLoad.load({
//                            files: ASSETS.core.jQueryUI
//                        });
//                    },
//                    select2: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.select2,
//                        ]);
//                    },
//                    selectboxit: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.selectboxit,
//                        ]);
//                    },
//                    tagsinput: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.tagsinput,
//                        ]);
//                    },
//                    multiSelect: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.multiSelect,
//                        ]);
//                    },
//                    typeahead: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.typeahead,
//                        ]);
//                    },
//                    datepicker: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.datepicker,
//                        ]);
//                    },
//                    timepicker: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.timepicker,
//                        ]);
//                    },
//                    daterangepicker: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.moment,
//                            ASSETS.forms.daterangepicker,
//                        ]);
//                    },
//                    colorpicker: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.colorpicker,
//                        ]);
//                    },
//                }
//            }).
//            state('app.forms-wizard', {
//                url: '/forms-wizard',
//                templateUrl: appHelper.templatePath('forms/form-wizard'),
//                resolve: {
//                    fwDependencies: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.bootstrap,
//                            ASSETS.core.jQueryUI,
//                            ASSETS.forms.jQueryValidate,
//                            ASSETS.forms.inputmask,
//                            ASSETS.forms.multiSelect,
//                            ASSETS.forms.datepicker,
//                            ASSETS.forms.selectboxit,
//                            ASSETS.forms.formWizard,
//                        ]);
//                    },
//                    formWizard: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                        ]);
//                    },
//                },
//            }).
//            state('app.forms-validation', {
//                url: '/forms-validation',
//                templateUrl: appHelper.templatePath('forms/form-validation'),
//                resolve: {
//                    jQueryValidate: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.jQueryValidate,
//                        ]);
//                    },
//                },
//            }).
//            state('app.forms-input-masks', {
//                url: '/forms-input-masks',
//                templateUrl: appHelper.templatePath('forms/input-masks'),
//                resolve: {
//                    inputmask: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.inputmask,
//                        ]);
//                    },
//                },
//            }).
//            state('app.forms-file-upload', {
//                url: '/forms-file-upload',
//                templateUrl: appHelper.templatePath('forms/file-upload'),
//                resolve: {
//                    dropzone: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.dropzone,
//                        ]);
//                    },
//                }
//            }).
//            state('app.forms-wysiwyg', {
//                url: '/forms-wysiwyg',
//                templateUrl: appHelper.templatePath('forms/wysiwyg'),
//                resolve: {
//                    bootstrap: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.bootstrap,
//                        ]);
//                    },
//                    bootstrapWysihtml5: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.bootstrapWysihtml5,
//                        ]);
//                    },
//                    uikit: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.uikit.base,
//                            ASSETS.uikit.codemirror,
//                            ASSETS.uikit.marked,
//                        ]);
//                    },
//                    uikitHtmlEditor: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.uikit.htmleditor,
//                        ]);
//                    },
//                }
//            }).
//            state('app.forms-sliders', {
//                url: '/forms-sliders',
//                templateUrl: appHelper.templatePath('forms/sliders'),
//                resolve: {
//                    sliders: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                        ]);
//                    },
//                },
//            }).
//            state('app.forms-icheck', {
//                url: '/forms-icheck',
//                templateUrl: appHelper.templatePath('forms/icheck'),
//                resolve: {
//                    iCheck: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.icheck,
//                        ]);
//                    },
//                }
//            }).
//            // Extra
//            state('app.extra-icons-font-awesome', {
//                url: '/extra-icons-font-awesome',
//                templateUrl: appHelper.templatePath('extra/icons-font-awesome'),
//                resolve: {
//                    fontAwesome: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                            ASSETS.extra.tocify,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-icons-linecons', {
//                url: '/extra-icons-linecons',
//                templateUrl: appHelper.templatePath('extra/icons-linecons'),
//                resolve: {
//                    linecons: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                            ASSETS.extra.tocify,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-icons-elusive', {
//                url: '/extra-icons-elusive',
//                templateUrl: appHelper.templatePath('extra/icons-elusive'),
//                resolve: {
//                    elusive: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                            ASSETS.extra.tocify,
//                            ASSETS.icons.elusive,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-icons-meteocons', {
//                url: '/extra-icons-meteocons',
//                templateUrl: appHelper.templatePath('extra/icons-meteocons'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                            ASSETS.extra.tocify,
//                            ASSETS.icons.meteocons,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-profile', {
//                url: '/extra-profile',
//                templateUrl: appHelper.templatePath('extra/profile'),
//                resolve: {
//                    profile: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.googleMapsLoader,
//                            ASSETS.icons.elusive,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-timeline', {
//                url: '/extra-timeline',
//                templateUrl: appHelper.templatePath('extra/timeline'),
//                resolve: {
//                    timeline: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.googleMapsLoader,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-timeline-centered', {
//                url: '/extra-timeline-centered',
//                templateUrl: appHelper.templatePath('extra/timeline-centered'),
//                resolve: {
//                    elusive: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.googleMapsLoader,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-calendar', {
//                url: '/extra-calendar',
//                templateUrl: appHelper.templatePath('extra/calendar'),
//                resolve: {
//                    fullCalendar: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                            ASSETS.core.moment,
//                            ASSETS.extra.fullCalendar,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-gallery', {
//                url: '/extra-gallery',
//                templateUrl: appHelper.templatePath('extra/gallery'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-notes', {
//                url: '/extra-notes',
//                templateUrl: appHelper.templatePath('extra/notes'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.xenonLib.notes,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-image-crop', {
//                url: '/extra-image-crop',
//                templateUrl: appHelper.templatePath('extra/image-cropper'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.extra.cropper,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-portlets', {
//                url: '/extra-portlets',
//                templateUrl: appHelper.templatePath('extra/portlets'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-search', {
//                url: '/extra-search',
//                templateUrl: appHelper.templatePath('extra/search')
//            }).
//            state('app.extra-invoice', {
//                url: '/extra-invoice',
//                templateUrl: appHelper.templatePath('extra/invoice')
//            }).
//            state('app.extra-page-404', {
//                url: '/extra-page-404',
//                templateUrl: appHelper.templatePath('extra/page-404')
//            }).
//            state('app.extra-tocify', {
//                url: '/extra-tocify',
//                templateUrl: appHelper.templatePath('extra/tocify'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.jQueryUI,
//                            ASSETS.extra.tocify,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-loading-progress', {
//                url: '/extra-loading-progress',
//                templateUrl: appHelper.templatePath('extra/loading-progress')
//            }).
//            state('app.extra-notifications', {
//                url: '/extra-notifications',
//                templateUrl: appHelper.templatePath('extra/notifications'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.extra.toastr,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-nestable-lists', {
//                url: '/extra-nestable-lists',
//                templateUrl: appHelper.templatePath('extra/nestable-lists'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.uikit.base,
//                            ASSETS.uikit.nestable,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-scrollable', {
//                url: '/extra-scrollable',
//                templateUrl: appHelper.templatePath('extra/scrollable')
//            }).
//            state('app.extra-blank-page', {
//                url: '/extra-blank-page',
//                templateUrl: appHelper.templatePath('extra/blank-page')
//            }).
//            state('app.extra-maps-google', {
//                url: '/extra-maps-google',
//                templateUrl: appHelper.templatePath('extra/maps-google'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.googleMapsLoader,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-maps-advanced', {
//                url: '/extra-maps-advanced',
//                templateUrl: appHelper.templatePath('extra/maps-advanced'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.core.googleMapsLoader,
//                        ]);
//                    },
//                }
//            }).
//            state('app.extra-maps-vector', {
//                url: '/extra-maps-vector',
//                templateUrl: appHelper.templatePath('extra/maps-vector'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.maps.vectorMaps,
//                        ]);
//                    },
//                }
//            }).
//            // Members
//            state('app.extra-members-list', {
//                url: '/extra-members-list',
//                templateUrl: appHelper.templatePath('extra/members-list')
//            }).
//            state('app.extra-members-add', {
//                url: '/extra-members-add',
//                templateUrl: appHelper.templatePath('extra/members-add'),
//                resolve: {
//                    datepicker: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.forms.datepicker,
//                            ASSETS.forms.multiSelect,
//                            ASSETS.forms.select2,
//                        ]);
//                    },
//                    //sssss
//                }
//            }).
//            // Charts
//            state('app.charts-variants', {
//                url: '/charts-variants',
//                templateUrl: appHelper.templatePath('charts/bars'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                        ]);
//                    },
//                }
//            }).
//            state('app.charts-range-selector', {
//                url: '/charts-range-selector',
//                templateUrl: appHelper.templatePath('charts/range'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                        ]);
//                    },
//                }
//            }).
//            state('app.charts-sparklines', {
//                url: '/charts-sparklines',
//                templateUrl: appHelper.templatePath('charts/sparklines'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                        ]);
//                    },
//                }
//            }).
//            state('app.charts-gauges', {
//                url: '/charts-gauges',
//                templateUrl: appHelper.templatePath('charts/gauges'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                        ]);
//                    },
//                }
//            }).
//            state('app.charts-bar-gauges', {
//                url: '/charts-bar-gauges',
//                templateUrl: appHelper.templatePath('charts/bar-gauges'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                        ]);
//                    },
//                }
//            }).
//            state('app.charts-linear-gauges', {
//                url: '/charts-linear-gauges',
//                templateUrl: appHelper.templatePath('charts/gauges-linear'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                        ]);
//                    },
//                }
//            }).
//            state('app.charts-map-charts', {
//                url: '/charts-map-charts',
//                templateUrl: appHelper.templatePath('charts/map'),
//                resolve: {
//                    resources: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxGlobalize,
//                        ]);
//                    },
//                    dxCharts: function($ocLazyLoad) {
//                        return $ocLazyLoad.load([
//                            ASSETS.charts.dxCharts,
//                            ASSETS.charts.dxVMWorld,
//                        ]);
//                    },
//                }
//            }).
            state('lockscreen', {
                url: '/lockscreen',
                templateUrl: appHelper.templatePath('lockscreen'),
                controller: 'LockscreenCtrl',
                resolve: {
                    resources: function ($ocLazyLoad) {
                        return $ocLazyLoad.load([
                            ASSETS.forms.jQueryValidate,
                            ASSETS.extra.toastr,
                        ]);
                    },
                }
            });
    $httpProvider.interceptors.push(['$q', '$rootScope', function ($q, $rootScope) {
            return {
                request: function (config) {
                    config.headers = config.headers || {};
                    if ((config.url.indexOf("app/") >= 0 || config.url.indexOf("templates/") >= 0) && config.url.indexOf(".html") >= 0) {
                        if (!config.params) {
                            config.params = {};
                        }
                        config.params['version'] = '@BUILD_VERSION@';
                    }
                    ontime_data.company_code = getCookie("cc");
                    if (ontime_data.company_code != null) {
                        $httpProvider.defaults.headers.common['company_code'] = ontime_data.company_code;
                        config.headers.company_code = ontime_data.company_code;
                    }
                    var token = getCookie("token");
                    if (token != null) {
                        $httpProvider.defaults.headers.common['requestToken'] = token;
                    }
                    var userName = getCookie("un");
                    if (userName != null) {
                        $httpProvider.defaults.headers.common['userName'] = userName;
                    }
                    return config;
                }, // optional method
                'response': function (response) {
                    if (response.headers().count) {
                        $rootScope.totalRecords = response.headers().count;
                    }
                    return response;
                },
                'responseError': function (response) {
                    if (response.headers().count) {
                        $rootScope.totalRecords = response.headers().count;
                    }
                    var deferred = $q.defer();
                    if (response.status == 401) {
                        if (response.config.url.indexOf("app/") >= 0 || response.config.url.indexOf("admin/") >= 0) {
                            delete_cookie("cc");
                            delete_cookie("token");
                            delete_cookie("un");
                            window.location.hash = '#/app/login';
                            toastr.clear();
                        } else {
                            delete_cookie("cc");
                            delete_cookie("token");
                            delete_cookie("un");
                            window.location.hash = '#/redirect';
                            toastr.clear();
                        }

                        return deferred.promise;
//                        return $q.when(response);
                    }
// do something on success
                    return $q.reject(response);
                }

            };
        }]);
});


app.constant('ASSETS', {
    'core': {
        'bootstrap': appHelper.assetPath('js/bootstrap.min.js'), // Some plugins which do not support angular needs this

        'jQueryUI': [
            appHelper.assetPath('js/jquery-ui/jquery-ui.min.js'),
            appHelper.assetPath('js/jquery-ui/jquery-ui.structure.min.css'),
        ],
        'moment': appHelper.assetPath('js/moment.min.js'),
        'googleMapsLoader': appHelper.assetPath('app/js/angular-google-maps/load-google-maps.js')
    },
    'charts': {
        'dxGlobalize': appHelper.assetPath('js/devexpress-web-14.1/js/globalize.min.js'),
        'dxCharts': appHelper.assetPath('js/devexpress-web-14.1/js/dx.chartjs.js'),
        'dxVMWorld': appHelper.assetPath('js/devexpress-web-14.1/js/vectormap-data/world.js'),
    },
    'xenonLib': {
        notes: appHelper.assetPath('js/xenon-notes.js'),
    },
    'maps': {
        'vectorMaps': [
            appHelper.assetPath('js/jvectormap/jquery-jvectormap-1.2.2.min.js'),
            appHelper.assetPath('js/jvectormap/regions/jquery-jvectormap-world-mill-en.js'),
            appHelper.assetPath('js/jvectormap/regions/jquery-jvectormap-it-mill-en.js'),
        ],
    },
    'icons': {
        'meteocons': appHelper.assetPath('css/fonts/meteocons/css/meteocons.css'),
        'elusive': appHelper.assetPath('css/fonts/elusive/css/elusive.css'),
    },
    'tables': {
        'rwd': appHelper.assetPath('js/rwd-table/js/rwd-table.min.js'),
        'datatables': [
            appHelper.assetPath('js/datatables/dataTables.bootstrap.css'),
            appHelper.assetPath('js/datatables/datatables-angular.js'),
        ],
    },
    'forms': {
        'select2': [
            appHelper.assetPath('js/select2/select2.css'),
            appHelper.assetPath('js/select2/select2-bootstrap.css'),
            appHelper.assetPath('js/select2/select2.min.js'),
        ],
        'daterangepicker': [
            appHelper.assetPath('js/daterangepicker/daterangepicker-bs3.css'),
            appHelper.assetPath('js/daterangepicker/daterangepicker.js'),
        ],
        'colorpicker': appHelper.assetPath('js/colorpicker/bootstrap-colorpicker.min.js'),
        'selectboxit': appHelper.assetPath('js/selectboxit/jquery.selectBoxIt.js'),
        'tagsinput': appHelper.assetPath('js/tagsinput/bootstrap-tagsinput.min.js'),
        'datepicker': appHelper.assetPath('js/datepicker/bootstrap-datepicker.js'),
        'timepicker': appHelper.assetPath('js/timepicker/bootstrap-timepicker.min.js'),
        'inputmask': appHelper.assetPath('js/inputmask/jquery.inputmask.bundle.js'),
        'formWizard': appHelper.assetPath('js/formwizard/jquery.bootstrap.wizard.min.js'),
        'jQueryValidate': appHelper.assetPath('js/jquery-validate/jquery.validate.min.js'),
        'formDirty': appHelper.assetPath('js/jquery.dirtyforms.js'),
        'dropzone': [
            appHelper.assetPath('js/dropzone/css/dropzone.css'),
            appHelper.assetPath('js/dropzone/dropzone.min.js'),
        ],
        'typeahead': [
            appHelper.assetPath('js/typeahead.bundle.js'),
            appHelper.assetPath('js/handlebars.min.js'),
        ],
        'multiSelect': [
            appHelper.assetPath('js/multiselect/css/multi-select.css'),
            appHelper.assetPath('js/multiselect/js/jquery.multi-select.js'),
        ],
        'icheck': [
            appHelper.assetPath('js/icheck/skins/all.css'),
            appHelper.assetPath('js/icheck/icheck.min.js'),
        ],
        'bootstrapWysihtml5': [
            appHelper.assetPath('js/wysihtml5/src/bootstrap-wysihtml5.css'),
            appHelper.assetPath('js/wysihtml5/wysihtml5-angular.js')
        ],
    },
    'uikit': {
        'base': [
            appHelper.assetPath('js/uikit/uikit.css'),
            appHelper.assetPath('js/uikit/css/addons/uikit.almost-flat.addons.min.css'),
            appHelper.assetPath('js/uikit/js/uikit.min.js'),
        ],
        'codemirror': [
            appHelper.assetPath('js/uikit/vendor/codemirror/codemirror.js'),
            appHelper.assetPath('js/uikit/vendor/codemirror/codemirror.css'),
        ],
        'marked': appHelper.assetPath('js/uikit/vendor/marked.js'),
        'htmleditor': appHelper.assetPath('js/uikit/js/addons/htmleditor.min.js'),
        'nestable': appHelper.assetPath('js/uikit/js/addons/nestable.min.js'),
    },
    'extra': {
        'tocify': appHelper.assetPath('js/tocify/jquery.tocify.min.js'),
        'toastr': appHelper.assetPath('js/toastr/toastr.min.js'),
        'fullCalendar': [
            appHelper.assetPath('js/fullcalendar/fullcalendar.min.css'),
            appHelper.assetPath('js/fullcalendar/fullcalendar.min.js'),
        ],
        'cropper': [
            appHelper.assetPath('js/cropper/cropper.min.js'),
            appHelper.assetPath('js/cropper/cropper.min.css'),
        ]
    }
});
