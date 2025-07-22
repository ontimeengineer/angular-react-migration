/* global appHelper */

(function () {
    function ViewPatientsCtrl(PatientDAO, $rootScope, $stateParams, $state, $modal, $debounce, EmployeeDAO, InsurerDAO, Page, CareTypeDAO, UtilService) {
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        Page.setTitle("View Patients");
        if ($stateParams.status !== 'active' && $stateParams.status !== 'discharged'
                 && $stateParams.status !== 'onhold' && $stateParams.status !== 'all') {
            $state.transitionTo(ontime_data.defaultState);
        } else {
            ctrl.viewType = $stateParams.status;
        }
        ctrl.patientList = [];

        ctrl.searchParams = {limit: 10, pageNo: 1, sortBy: 'lName', order: 'asc', name: ''};
        ctrl.retrievePatients = retrievePatientsData;
        ctrl.nursingCareMap = {};
        ctrl.staffCoordinatorMap = {};
        ctrl.insuranceProviderMap = {};
        
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

        ctrl.pageChanged = function (pagenumber) {
            console.log("pagenumber", pagenumber);
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrievePatients();
        };

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(retrievePatientsData, 500);
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
            ctrl.retrievePatients();
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

        ctrl.validAuthorizationDate = function (date1) {
            if (date1) {
                return new Date(date1) > new Date();
            } else {
                return false;
            }
        }


        function retrievePatientsData() {
            $rootScope.paginationLoading = true;
            ctrl.searchParams.subAction = ctrl.viewType;
            if (ctrl.viewType === 'active') {
                ctrl.searchParams.onHold = false;
            } else if (ctrl.viewType === 'onhold') {
                ctrl.searchParams.onHold = true;
                ctrl.searchParams.subAction = 'active';
            }
            PatientDAO.retrieveAll(ctrl.searchParams).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }

                }); // showLoadingBar
                if (res) {
                    ctrl.patientList = res;
                    if (res.length === 0) {
//                        $("#paginationButtons").remove();
//                        toastr.error("No data in the system.");
                    }
                }

            }).catch(function (data, status) {
                toastr.error("Failed to retrieve patients.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
//                ctrl.patientList = ontime_data.patients;
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.retrievePatients();
        ctrl.openEditModal = function (patient, modal_id, modal_size, modal_backdrop)
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

        ctrl.openDeleteModal = function (patient, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deletePatientModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deletePatientModel.patient = patient;

            $rootScope.deletePatientModel.delete = function (patient) {
                $rootScope.maskLoading();
                PatientDAO.delete({id: patient.id}).then(function (res) {
                    var length = ctrl.patientList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.patientList[i].id === patient.id) {
                            ctrl.patientList.splice(i, 1);
                            break;
                        }
                    }
                    toastr.success("Patient deleted.");
                    ctrl.rerenderDataTable();
                    $rootScope.deletePatientModel.close();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                    $rootScope.deletePatientModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };
        };

        ctrl.openDischargeModal = function (patient, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.dischargePatientModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false    
            });
            $rootScope.dischargePatientModel.currentDate = new Date();
            $rootScope.dischargePatientModel.patient = patient;
            $rootScope.dischargePatientModel.patientDischargedToOptions = [];

            PatientDAO.retrieveEnumType({'type': 'dischargedToOptions'}).then(function (res) {
                $rootScope.dischargePatientModel.patientDischargedToOptions = UtilService.convertAndSortObject(res, ["$resolved", "$promise", "0"]);
                $rootScope.dischargePatientModel.patientDischargedToOptions.push({ id: 0, label: 'Other' })
            }).catch(function () {
                toastr.error("Failed to retrieve dicharged options.");
            });

            $rootScope.dischargePatientModel.discharge = function (patient) {
                
				if ($('#popup_dis_patient')[0].checkValidity()) {
				$rootScope.maskLoading();
                PatientDAO.changestatus({id: patient.id, status: 'discharged', reason:$rootScope.dischargePatientModel.reason, dischargeDate:$rootScope.dischargePatientModel.dischargeDate, dischargedTo: $rootScope.dischargePatientModel.dischargedTo}).then(function (res) {
                    var length = ctrl.patientList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.patientList[i].id === patient.id) {
                            if (ctrl.viewType !== 'all') {
                                ctrl.patientList.splice(i, 1);
                            } else {
                                ctrl.patientList[i].status = 'd';
                            }
                            break;
                        }
                    }
                    toastr.success("Patient discharged.");
                    ctrl.rerenderDataTable();
                    $rootScope.dischargePatientModel.close();
                }).catch(function (data, status) {
                    toastr.error("Patient cannot be discharged.");
                    $rootScope.dischargePatientModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
				}
            };
        };

        ctrl.openReadmitModal = function (patient, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.readmitPatientModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.readmitPatientModal.patient = patient;

            $rootScope.readmitPatientModal.readmit = function (patient) {
                PatientDAO.changestatus({id: patient.id, status: 'active'}).then(function (res) {
                    var length = ctrl.patientList.length;

                    for (var i = 0; i < length; i++) {
                        if (ctrl.patientList[i].id === patient.id) {
                            if (ctrl.viewType !== 'all') {
                                ctrl.patientList.splice(i, 1);
                            } else {
                                ctrl.patientList[i].status = 'a';
                            }
                            break;
                        }
                    }
                    toastr.success("Patient readmitted.");
                    ctrl.rerenderDataTable();
                    $rootScope.readmitPatientModal.close();
                }).catch(function (data, status) {
                    toastr.error("Patient cannot be readmitted.");
                    $rootScope.readmitPatientModal.close();
                });
            };
        };

        ctrl.rerenderDataTable = function () {
            if (ctrl.patientList.length === 0) {
                if (ctrl.searchParams.pageNo > 1) {
                    ctrl.pageChanged(ctrl.searchParams.pageNo - 1);
                }
            } else {
                ctrl.retrievePatients();
            }
        };
        
        ctrl.openNotesModal = function (patientId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'notes-modal'),
                size: "lg",
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'NotesCtrl as notes',
                resolve: {
                    userId: function () {
                        return patientId;
                    },
                    type: function () {
                        return 'patient';
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };
        EmployeeDAO.retrieveByPosition().then(function (res) {
            ctrl.employee_list = res;
        }).catch(function (data) {
            console.log();
        });
        ctrl.openRejectEmployeesModal = function (patientId, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'reject-employee-modal'),
                size: "lg",
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'RejectEmployeeModalController as RejectEmployee',
                resolve: {
                    patientId: function () {
                        return patientId;
                    },
                    employees: function () {
                        return ctrl.employee_list;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };        

        ctrl.getLanguagesFromCode = function (languageCodes) {
            if (languageCodes != null && languageCodes.length > 0) {
                languageCodes = languageCodes.split(",");
                var languageToDisplay = "";
                angular.forEach(languageCodes, function (code, index) {
                    languageToDisplay += $rootScope.languages[code];
                    if (index < languageCodes.length - 1) {
                        languageToDisplay += ", ";
                    }
                });
                return languageToDisplay;
            } else {
                return "N/A";
            }
        };
        
    }
    ;
    angular.module('xenon.controllers').controller('ViewPatientsCtrl', ["PatientDAO", "$rootScope", "$stateParams", "$state", "$modal", "$debounce", "EmployeeDAO", "InsurerDAO", "Page", "CareTypeDAO", "UtilService", ViewPatientsCtrl]);
})();
