/* global appHelper, ontime_data, _ */

(function () {
    function AddEmployeeCtrl($scope, CareTypeDAO, BenefitDAO, $state, $modal, $filter, EmployeeDAO, $timeout, $formService, $rootScope, Page, PositionDAO, EventTypeDAO, PatientDAO, $location, $anchorScroll, moment) {
        var ctrl = this;
        ctrl.staticPosition;
        ctrl.retrivalRunning = true;
        ctrl.currentDate = new Date();
        ctrl.maxBirthDate = new Date().setYear((ctrl.currentDate.getYear() + 1900) - 10);
        ctrl.employee = {employeeAttachments: []};
        ctrl.profileImage = "assets/images/user-5.png";
        ctrl.refreshLanguages = function () {
            $timeout(function () {
                $('#languageOtherText').tagsinput("add", ctrl.employee.otherLanguages);
            });
        };
        ctrl.employeeList = [];
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.stateCountyList = geo_data.stateCountyList;
        ctrl.referredByOptions = [];
        ctrl.stateCountyList['NY'] = $rootScope.nyStateCountyList;
        ctrl.nextTab;
        ctrl.languagesKeyValue = [{key: "English"}, {key: "Creole"}, {key: "Spanish"}, {key: "Russian"}, {key: "French"}, {key: "Hindi"}, {key: "Bengali"}, {key: "Mandarin"}, {key: "Korean"}, {key: "Arabic"}, {key: "Farsi"}, {key: "Urdu"}];
        ctrl.setFromNext = function (tab) {
            ctrl.nextTab = tab;
        };

        var buildEmptyRateLists = function () {
            return {rate1: {careTypes: []}, rate2: {careTypes: []}, rate3: {careTypes: []},
                rate4: {careTypes: []}, rate5: {careTypes: []}};
        }

        var refreshRates = function () {
            $("#rate5").multiSelect('refresh');
            $("#rate4").multiSelect('refresh');
            $("#rate3").multiSelect('refresh');
            $("#rate2").multiSelect('refresh');
            $("#rate1").multiSelect('refresh');
        }

        var employeeAttachmentTypes = {
            'CHRC': 'CHRC Forms',
            'HCR': 'HCR',
            'References': 'References',
            'CompetencyExam': 'Competency Exam',
            'W4': 'W-4',
            'Certificate': 'Certificate/License',
            'OrientationPacket': 'Orientation Packet',
            'InfectionControl': 'Infection Control',
            'OPSearch': 'OP Search',
            'License': 'License',
            'Exclusions': 'Exclusions'
        };

        ctrl.subTypes = ['Pre – Employment Medical Documents',
            'Physical', 'TB Testing',
            'Chest X-Ray', 'TB Questionnaire',
            'Habituation', 'Flu Shot', 'Covid Vaccine'];


        var MappingForDownload = {
            'Initial Application Packet': 'InitialApplicationPacket',
            'Initial Application Packet Nursing': 'InitialApplicationPacketNursing',
            'Employment Eligibility (I-9)': 'EmploymentEligibility',
            'CHRC Forms': 'CHRC',
            'Evaluation': 'Evaluation',
            'HCR': 'HCR',
            'References': 'References',
            'Competency Exam': 'CompetencyExam',
            'W-4': 'W4',
            'Certificate/License': 'Certificate',
            'Orientation Packet': 'OrientationPacket',
            'Infection Control': 'InfectionControl',
            'OP Search': 'OPSearch',
            'License': 'License',
            'Pre – Employment Medical Documents': 'PreEmploymentMedicalDocuments',
            'Physical': 'Physical',
            'TB Testing': 'TBTesting',
            'Chest X-Ray': 'ChestXRay',
            'TB Questionnaire': 'TBQuestionnaire',
            'Habituation': 'Habituation',
            'Flu Shot': 'FluShot',
            'Covid Vaccine': 'CovidVaccine',
            'Drug Test': 'DrugTest'
        };


        ctrl.positionList = [];
        PositionDAO.retrieveAll({}).then(function (res) {
            ctrl.positionList = res;
            if (ctrl.positionList && ctrl.positionList.length > 0) {
                if (!ctrl.employee.companyPositionId || ctrl.employee.companyPositionId === null) {
                    ctrl.employee.companyPositionId = ctrl.positionList[0].id;
                }
                for (var i = 0; i < ctrl.positionList.length; i++) {
                    if (ctrl.positionList[i].position === "Personal Care") {
                        ctrl.staticPosition = ctrl.positionList[i].id;
                        break;
                    }
                }
            }
            $formService.resetRadios();
        });
        EmployeeDAO.getEmployeeRefers().then(function (res) {
            ctrl.referredByOptions = res;
        })
        ctrl.careTypeList = [];
        ctrl.employee.careRatesList = buildEmptyRateLists();
        ctrl.applicationFileObj = {};
        ctrl.w4FileObj = {};
        ctrl.ssn = {};
        ctrl.referencesFileObj = {};
        ctrl.profileFileObj = {};
        ctrl.resetEmployeeTab4 = function () {
            ctrl.applicationFileObj.errorMsg = null;
            ctrl.w4FileObj.errorMsg = null;
            if (ctrl.employee.application != null) {
                ctrl.employee.application = null;
            }
            if (ctrl.employee.backgroundCheck != null) {
                ctrl.employee.backgroundCheck = null;
            }
            if (ctrl.employee.licence != null) {
                ctrl.employee.licence = null;
            }
            if (ctrl.employee.i9 != null) {
                ctrl.employee.i9 = null;
            }
            if (ctrl.employee.w4 != null) {
                ctrl.employee.w4 = null;
            }
            if (ctrl.employee.references != null) {
                ctrl.employee.references = null;
            }
            if (ctrl.employee.physical != null) {
                ctrl.employee.physical = null;
            }
            ctrl.employee.employeeAttachments = [];
            if (ctrl.applicationFileObj.flowObj != null) {
                ctrl.applicationFileObj.flowObj.cancel();
            }
            if (ctrl.w4FileObj.flowObj != null) {
                ctrl.w4FileObj.flowObj.cancel();
            }
            if (ctrl.referencesFileObj.flowObj != null) {
                ctrl.referencesFileObj.flowObj.cancel();
            }
            $scope.resetForm = true;
        };

        ctrl.resetEmployeeTab1 = function () {
            ctrl.profileFileObj.errorMsg = null;
            if (ctrl.employee.profileImage !== null) {
                ctrl.employee.profileImage = null;
            }
            if (ctrl.profileFileObj.flowObj && ctrl.profileFileObj.flowObj !== null) {
                ctrl.profileFileObj.flowObj.cancel();
            }
            $scope.resetForm = true;
        };
        ctrl.clearRefereces = function () {
            if (ctrl.employee != null && ctrl.employee.references != null) {
                ctrl.employee.references = null;
            }
            if (ctrl.referencesFileObj.flowObj != null) {
                ctrl.referencesFileObj.flowObj.cancel();
            }
        };
        ctrl.clearProfileImage = function () {
            if (ctrl.employee.profileImage != null) {
                ctrl.employee.profileImage = null;
            }
            if (ctrl.profileFileObj.flowObj != null) {
                ctrl.profileFileObj.flowObj.cancel();
            }
        }
        ctrl.resetEmployeeTab2 = function () {
            $formService.uncheckRadioValue('TaxStatus', ctrl.employee.taxStatus);
            $formService.uncheckRadioValue('Wages', ctrl.employee.wages);
            ctrl.employee.taxStatus = 'W';
            ctrl.employee.wages = 'H';
            ctrl.employee.payrollGroup = 'A';
            ctrl.employee.careRatesList = buildEmptyRateLists();
            $timeout(function () {
                $formService.setRadioValues('TaxStatus', ctrl.employee.taxStatus);
                $formService.setRadioValues('Wages', ctrl.employee.wages);
                refreshRates();
//                $formService.resetRadios();
            }, 100);
            $scope.resetForm = true;
        };

        ctrl.saveEmployee = saveEmployeeData;
        ctrl.pageInitCall = pageInit;
        var form_data;

        ctrl.checkFileUploadValidity = function () {
            var validApplication = true;
            var validW4 = true;
            if ($rootScope.tabNo != 4) {
                ctrl.applicationFileObj.errorMsg = null;
                ctrl.w4FileObj.errorMsg = null;
            } else {
                //this return is added because it needs to mute validation for a timebeing
                return true;
                if (ctrl.displayDocumentsByPositionMap) {
                    if (ctrl.displayDocumentsByPositionMap['a']) {
                        if ($rootScope.tabNo == 4 && ctrl.employee.application == null && (ctrl.formDirty || ctrl.formSubmitted)) {
                            ctrl.applicationFileObj.errorMsg = "Please upload Application.";
                            validApplication = false;
                        }
                    }
                    if (ctrl.displayDocumentsByPositionMap['w']) {
                        if ($rootScope.tabNo == 4 && ctrl.employee.w4 == null && (ctrl.formDirty || ctrl.formSubmitted)) {
                            ctrl.w4FileObj.errorMsg = "Please upload W-4 or W-9.";
                            validW4 = false;
                        }
                    }
                }
            }
            return (validApplication && validW4);
        };

        //ceck if form has been changed or not
        //If changed then it should be valid
        ctrl.navigateToTab = function (event, state) {
            $scope.resetForm = false;
            if ($('#add_employee_form').serialize() !== form_data) {
                ctrl.formDirty = true;
            }
            var fileUploadValid = ctrl.checkFileUploadValidity();
            if (($('#add_employee_form').valid() && fileUploadValid) || !ctrl.formDirty) {
                if (ctrl.editMode && ($rootScope.hasAccess('HR_EDIT_EMPLOYEE') || $rootScope.hasAccess('CREATE_EMPLOYEE'))) {
                    $state.go('^.' + state, {id: $state.params.id});
                }
            }
            event.stopPropagation();
        };

        //Check if ssn number is already present.
        $scope.checkSsnNumber = function (cmp) {
            if (ctrl.employee.ssn && ctrl.employee.ssn.trim().length > 0) {
//                setValidationMessage(cmp);
                EmployeeDAO.checkIfSsnExists({Id: ctrl.employee.id, ssn: ctrl.employee.ssn})
                        .then(function (res) {
                            if (res.data)
                                ctrl.ssn.exists = true;
                            else
                                ctrl.ssn.exists = false;
                        })
                        .catch(function () {
                        });
            } else {
                ctrl.ssn.exists = false;
            }
        };

        //function to save the employee data
        function saveEmployeeData() {
            $scope.resetForm = false;
            ctrl.formSubmitted = true;
            setFormDynamicValidityMessages();
            var fileUploadValid = ctrl.checkFileUploadValidity();
            var employeeToSave = angular.copy(ctrl.employee);
            if (employeeToSave.phone) {
                employeeToSave.phone = employeeToSave.phone.toString();
            }
            if (employeeToSave.phone2) {
                employeeToSave.phone2 = employeeToSave.phone2.toString();
            }
            employeeToSave.languageSpoken = [];
            angular.forEach(ctrl.languagesKeyValue, function (obj) {
                if (obj.value == true) {
                    employeeToSave.languageSpoken.push(obj.key);
                }
            });
            employeeToSave.languageSpoken = employeeToSave.languageSpoken.toString();
            if (employeeToSave.preferredCounties) {
                employeeToSave.preferredCounties = employeeToSave.preferredCounties.toString();
            }

            if (ctrl.benefitPackages && (ctrl.benefitPackages.length > 0) && employeeToSave.employeeBenefitDetails) {
                if (employeeToSave.employeeBenefitDetails.benefitPackageId) {
                    var lineTypes = ctrl.benefitPackageWiseLineTypes[employeeToSave.employeeBenefitDetails.benefitPackageId];
                    if (lineTypes.indexOf('HEC') === -1) {
                        employeeToSave.employeeBenefitDetails.employeeContributionHealthcare = null;
                    }
                    if (lineTypes.indexOf('401') === -1) {
                        employeeToSave.employeeBenefitDetails.employeeContribution401k = null;
                    }
                    if (lineTypes.indexOf('WFC') === -1) {
                        employeeToSave.employeeBenefitDetails.employeeContributionWpp = null;
                    }
                } else {
                    employeeToSave.employeeBenefitDetails.employeeContributionHealthcare = null;
                    employeeToSave.employeeBenefitDetails.employeeContribution401k = null;
                    employeeToSave.employeeBenefitDetails.employeeContributionWpp = null;
                }
            }
//            if (!ctrl.employee.application || ctrl.employee.application === null) {
//                delete employeeToSave.employeeDocumentId;
//            } else {
//            }

            delete employeeToSave.careRatesList;
            delete employeeToSave.employeeCareRatesList;
            delete employeeToSave.employeeAttachments;
            if ($('#add_employee_form')[0].checkValidity() && fileUploadValid && (ctrl.employee.referredByType == 1 ? ctrl.employee.referredByEmployeeId : true)) {
                //Check if ssn number is already present
                $rootScope.maskLoading();
                EmployeeDAO.checkIfSsnExists({Id: ctrl.employee.id, ssn: ctrl.employee.ssn})
                        .then(function (res) {
                            if (res.data) {
                                ctrl.ssn.exists = true;
                                $('#SocialSecurity').focus();
                            } else {
                                ctrl.ssn.exists = false;
                                var reqParam;
                                if (ctrl.employee.id && ctrl.employee.id !== null) {
                                    reqParam = 'updateemployee';
                                    if (ctrl.employee.careRatesList && ctrl.employee.careRatesList !== null) {
                                        var careRateList = angular.copy(ctrl.employee.careRatesList);
                                        careRateList.employeeId = ctrl.employee.id;
                                        EmployeeDAO.updateCareRates(careRateList)
                                                .then(function () {
                                                    updateEmployee(reqParam, employeeToSave);
                                                })
                                                .catch(function () {
                                                    console.log(JSON.stringify(careRateList));
                                                }).then(function () {
                                                    $rootScope.unmaskLoading();
                                                })
                                    } else {
                                        updateEmployee(reqParam, employeeToSave);
                                    }
                                } else {
                                    employeeToSave.orgCode = ontime_data.company_code;
                                    ctrl.employee.orgCode = ontime_data.company_code;
                                    reqParam = 'saveemployee';
                                    updateEmployee(reqParam, employeeToSave);
                                }
                            }
                        })
                        .catch(function () {
                        });
            } else if (ctrl.employee.referredByEmployeeId == null || ctrl.employee.referredByEmployeeId == undefined) {
                ctrl.formSubmitted = true;
                $location.hash('employeeDropdownSeparator');
                $anchorScroll();
                return;
              }
        }

        function updateEmployee(reqParam, employeeToSave) {
            $rootScope.maskLoading();
            if (!ctrl.employee.id || ctrl.employee.id === null) {
                if (ctrl.staticPosition && ctrl.employee.companyPositionId === ctrl.staticPosition) {
                    employeeToSave.wages = 'H';
                    employeeToSave.payrollGroup = 'A';
                    employeeToSave.taxStatus = 'W';
                    employeeToSave.otRate = 13.12;
                    employeeToSave.hdRate = 13.12;
                }
            }
            if (employeeToSave.authorizedHours == null) {
                employeeToSave.authorizedHoursReason = null;
                employeeToSave.authorizedHoursExpiryDate = null;
            }
            EmployeeDAO.update({action: reqParam, data: employeeToSave})
                    .then(function (employeeRes) {
                        if (!ctrl.employee.id || ctrl.employee.id === null) {
                            ctrl.editMode = true;
                            ctrl.employee.id = employeeRes.id;
                            ctrl.employee.status = employeeRes.status;
                            ctrl.employee.employeeBenefitDetails = employeeRes.employeeBenefitDetails;
                            //to set the default data in employee with position 'pc'
                            if (ctrl.staticPosition && ctrl.employee.companyPositionId === ctrl.staticPosition) {
                                var rate1CareTypes = ['Personal Care HHA Hourly', 'Personal Care HHA Live In', 'PCA/HHA - One Client', 'PCA/HHA - Live In One Client', "CDPAP - One Client", "CDPAP - Live In One Client"];
                                var rate2CareTypes = ['Personal Care HHA Mutual', 'Personal Care HHA Live In-Mutual', "PCA/HHA - Mutual Care", "PCA/HHA - Live In Mutual Care", "CDPAP - Mutual Care", "CDPAP - Live In Mutual Care"];
                                CareTypeDAO.retrieveAll({positionId: ctrl.employee.companyPositionId}).then(function (careTypes) {
                                    var careRateList = {employeeId: employeeRes.id};
                                    careRateList.rate1 = {rate: 10, careTypes: []};
                                    careRateList.rate2 = {rate: 10.7, careTypes: []};
                                    angular.forEach(careTypes, function (obj) {
                                        if (rate1CareTypes.indexOf(obj.careTypeTitle) >= 0) {
                                            careRateList.rate1.careTypes.push(obj.id);
                                        }
                                        if (rate2CareTypes.indexOf(obj.careTypeTitle) >= 0) {
                                            careRateList.rate2.careTypes.push(obj.id);
                                        }
                                    });
                                    EmployeeDAO.updateCareRates(careRateList)
                                            .then(function () {
                                                retrieveEmployeeCareTypeAfterSave(employeeRes);
                                            })
                                            .catch(function () {
                                                console.log(JSON.stringify(careRateList));
                                            });
                                });
                            }
                        } else {
                            retrieveEmployeeCareTypeAfterSave(employeeRes);
                        }
                        if ($rootScope.tabNo == 4) {
                            $state.go('app.employee-list', {status: "active"});
                        } else {
                            $state.go('^.' + ctrl.nextTab, {id: employeeRes.id});
                        }
                        toastr.success("Employee saved.");
                        //Reset dirty status of form
                        if ($.fn.dirtyForms) {
                            $('form').dirtyForms('setClean');
                            $('.dirty').removeClass('dirty');
                        }
                    })
                    .catch(function () {
                        toastr.error("Employee cannot be saved.");
                        //exception logic
                        console.log('Employee2 Object : ' + JSON.stringify(ctrl.employee));
                    }).then(function () {
                ctrl.formSubmitted = false;
                $rootScope.unmaskLoading();
            });
        }

        ctrl.changeReferredBy = function () {
            ctrl.formSubmitted = false;
            if (ctrl.employee.referredByType === 1 && ctrl.employeeList.length == 0) {
                getEmployeesList();
            }
        }

        function getEmployeesList() {
            $rootScope.maskLoading();
            return EmployeeDAO.retrieveByPosition().then(function (res) {
                ctrl.employeeList = res;
                if (ctrl.employee.referredByEmployeeId != null && ctrl.employee.referredByEmployeeId != undefined) {
                  $timeout(function () {
                    $("#employeeDropdown").select2("val", ctrl.employee.referredByEmployeeId);
                  });
                }
              })
              .catch(function (data, status) {
                        toastr.error("Failed to retrieve employees.");
                    })
              .then(function () {
                        $rootScope.unmaskLoading();
                    });
        }

        function retrieveEmployeeCareTypeAfterSave(employeeRes) {
            EmployeeDAO.retrieveEmployeeCareRates({employee_id: employeeRes.id}).then(function (res) {
                ctrl.employee = employeeRes;
                ctrl.displayDocumentsByPosition();
                ctrl.employee.careRatesList = res;
                $timeout(function () {
                    refreshRates();
                }, 100);
            });
        }

        var getUnique = function (attachment) {
            return attachment.attachmentType;
        };

        var getAttachmentsByType = function (attachments, type) {
            var result = {count: 0, data: []};
            var filteredAttachments = attachments.filter(function (attachment) {
                return attachment.type === type;
            });

            result.data = angular.copy(_.uniqBy(filteredAttachments, getUnique));
            result.count = result.data.length;

            result.data = result.data.concat(_.filter(filteredAttachments, function (applicationEmployeeAttachment) {
                return _.findIndex(result.data, {id: applicationEmployeeAttachment.id,
                    attachmentType: applicationEmployeeAttachment.attachmentType}) === -1;
            }));
            return result;
        };

        var getFilteredAttachments = function () {
            var aedResults = {'data': []}
            if (ctrl.actualAttachments) {
                var employeeEligibilities = [];
                _.each(_.filter(ctrl.actualAttachments, function (attachment) {
                    return attachment.type === 'med' && (['Pre – Employment Medical Documents', 'Physical'].indexOf(attachment.attachmentType) > -1)
                }), function (medicalDocument) {
                    var extrafield = JSON.parse(medicalDocument.extraFields);
                    var rowToPush = {
                        modified: true,
                        dateInserted: medicalDocument.dateInserted,
                        dateUpdated: medicalDocument.dateUpdated,
                        employeeId: medicalDocument.employeeId,
                        filePath: medicalDocument.filePath,
                        id: medicalDocument.id,
                        name: medicalDocument.name,
                        type: medicalDocument.type
                    };
                    if (medicalDocument.attachmentType === 'Pre – Employment Medical Documents') {
                        if (extrafield.physicalExpirationDate) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'Physical',
                                expiryDate: extrafield.physicalExpirationDate,
                                extraFields: JSON.stringify({})
                            }));
                        }
                        if (extrafield.tbTesting) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'TB Testing',
                                expiryDate: extrafield.physicalExpirationDate,
                                extraFields: JSON.stringify({
                                    tbTesting: extrafield.tbTesting,
                                    isPositive: extrafield.isPositive,
                                    chestXRayExpiration: extrafield.chestXRayExpiration,
                                    tbQuestionnaire: extrafield.tbQuestionnaire,
                                    TBtestingExpirationDate: extrafield.tbTestingExpirationDate
                                })
                            }));
                        }
                        if (extrafield.chestXRayExpiration) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'Chest X-Ray',
                                expiryDate: extrafield.chestXRayExpiration,
                                extraFields: JSON.stringify({})
                            }));
                        }
                        if (extrafield.tbQuestionnaire) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'TB Questionnaire',
                                expiryDate: extrafield.tbQuestionnaire,
                                extraFields: JSON.stringify({})
                            }));
                        }
                        if (extrafield.habituation) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'Habituation',
                                expiryDate: extrafield.habituation,
                                extraFields: JSON.stringify({})
                            }));
                        }
                        if (extrafield.fluShotDate) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'Flu Shot',
                                expiryDate: extrafield.fluShotDate,
                                extraFields: JSON.stringify({})
                            }));
                        }
                        if (extrafield.drugTestDate) {
                            employeeEligibilities.push(_.extend({}, rowToPush, {
                                attachmentType: 'Drug Test',
                                expiryDate: extrafield.drugTestDate,
                                extraFields: JSON.stringify({})
                            }));
                        }
                    } else if (medicalDocument.attachmentType === 'Physical') {
                        employeeEligibilities.push(_.extend({}, rowToPush, {
                            attachmentType: 'Habituation',
                            expiryDate: medicalDocument.expiryDate,
                            extraFields: JSON.stringify({})
                        }));
                    }
                });


                _.each(_.filter(ctrl.actualAttachments, function (attachment) {
                    return attachment.type === 'aed' && (['Initial Application Packet', 'Initial Application Packet Nursing'].indexOf(attachment.attachmentType) > -1);
                }), function (intialApplicationPacket) {
                    var extrafield = JSON.parse(intialApplicationPacket.extraFields);
                    if (extrafield.subtypes) {
                        _.each(extrafield.subtypes, function (exists, type) {
                            if (exists === true && employeeAttachmentTypes[type]) {
                                var rowToPush = {
                                    modified: true,
                                    attachmentType: employeeAttachmentTypes[type],
                                    dateInserted: intialApplicationPacket.dateInserted,
                                    dateUpdated: intialApplicationPacket.dateUpdated,
                                    employeeId: intialApplicationPacket.employeeId,
                                    filePath: intialApplicationPacket.filePath,
                                    id: intialApplicationPacket.id,
                                    name: intialApplicationPacket.name,
                                    type: intialApplicationPacket.type,
                                    extraFields: {}
                                };

                                if (['HCR', 'References', 'CompetencyExam',
                                    'Certificate', 'OPSearch', 'InfectionControl'].indexOf(type) > -1) {
                                    rowToPush['expiryDate'] = extrafield.eligibilityExpDate;
                                } else if (['OrientationPacket'].indexOf(type) > -1) {
                                    rowToPush['extraFields']['orientationDate'] = extrafield.eligibilityExpDate;
                                } else if (['W4', 'CHRC'].indexOf(type) > -1) {
                                    rowToPush['extraFields']['DateCompleted'] = extrafield.eligibilityExpDate;
                                } else if (['License'].indexOf(type) > -1) {
                                    rowToPush['expiryDate'] = extrafield.licenseExpDate;
                                } else if (['Exclusions'].indexOf(type) > -1) {
                                    rowToPush['expiryDate'] = extrafield.exclusionsExpDate;
                                }
                                rowToPush['extraFields'] = JSON.stringify(rowToPush['extraFields']);
                                employeeEligibilities.push(rowToPush);
                            }
                        });
                    }
                    employeeEligibilities.push({
                        modified: true,
                        attachmentType: 'Employment Eligibility (I-9)',
                        dateInserted: intialApplicationPacket.dateInserted,
                        dateUpdated: intialApplicationPacket.dateUpdated,
                        employeeId: intialApplicationPacket.employeeId,
                        filePath: intialApplicationPacket.filePath,
                        id: intialApplicationPacket.id,
                        name: intialApplicationPacket.name,
                        type: intialApplicationPacket.type,
                        expiryDate: extrafield.eligibilityExpDate
                    });
                });
                ctrl.employee.employeeAttachments = ctrl.actualAttachments.concat(employeeEligibilities);
                ctrl.employee.employeeAttachments = _.orderBy(ctrl.employee.employeeAttachments, function (attachment) {
                    if (attachment.type === 'aed' && attachment.attachmentType === 'Disciplinary Action') {
//                        if(attachment.extraFields.warnigLevel === '1st warning - verbal'){
//                            return 1;
//                        } else if(attachment.extraFields.warnigLevel === '2nd warning - written'){
//                            return 2;
//                        } else if(attachment.extraFields.warnigLevel === '3rd warning - written'){
//                            return 3;
//                        } else if(attachment.extraFields.warnigLevel === 'Suspension'){
//                            return 4;
//                        } else if(attachment.extraFields.warnigLevel === 'Termination'){
//                            return 5;
//                        }
                        var extraFields = JSON.parse(attachment.extraFields);
                        return extraFields.dateOfDa ? new Date(extraFields.dateOfDa) : new Date(1970, 1, 1);
                    }
                    return attachment.expiryDate ? new Date(attachment.expiryDate) : new Date(1970, 1, 1);
                }, ['desc']);
                ctrl.attachmentCount = {};

                aedResults = getAttachmentsByType(ctrl.employee.employeeAttachments, 'aed');
                var medResults = getAttachmentsByType(ctrl.employee.employeeAttachments, 'med');

                ctrl.attachmentCount.MED = medResults.count;
                ctrl.medicalEmployeeAttachments = angular.copy(medResults.data);
            }

            if (ctrl.employee.applicationId && ctrl.employee.applicationId !== null) {
                aedResults['data'].push({
                    modified: true,
                    attachmentType: 'Ontime Application Form',
                    dateInserted: ctrl.employee.dateInserted,
                    dateUpdated: ctrl.employee.dateUpdated,
                    employeeId: ctrl.employee.id,
                    name: "Ontime Application Form",
                    type: "aed"
                });
                ctrl.attachmentCount.AED = aedResults.count + 1;
            } else {
                ctrl.attachmentCount.AED = aedResults.count;
            }

            ctrl.applicationEmployeeAttachments = angular.copy(aedResults.data);


        };

        ctrl.getAttachmentName = function (attachment) {
            var fileName = attachment.filePath;
            return ctrl.employee.lName
                    + ' ' +
                    ctrl.employee.fName
                    + '-' +
                    (MappingForDownload[attachment.attachmentType] ? MappingForDownload[attachment.attachmentType] : attachment.attachmentType)
                    + '-' +
                    moment(attachment.dateInserted).format("MMDDYYYYHHmm")
                    + '.' +
                    fileName.substring(fileName.lastIndexOf('.') + 1);
        };

        //function called on page initialization.
        function pageInit() {
            if (ctrl.editMode) {
                $rootScope.maskLoading();
                EmployeeDAO.get({id: $state.params.id, includeAttachment: true}).then(function (res) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
                    if (res.profileImage != null && res.profileImage != '') {
                        ctrl.hideLoadingImage = false;
                    } else {
                        ctrl.hideLoadingImage = true;
                    }
                    ctrl.employee = res;
                    ctrl.actualAttachments = angular.copy(ctrl.employee.employeeAttachments);
                    if (ctrl.employee.referredByEmployeeId != undefined && ctrl.employee.referredByEmployeeId != null) {
                        getEmployeesList();
                    }
                    getFilteredAttachments();

                    ctrl.displayDocumentsByPosition();
                    if (res.languageSpoken != null) {
                        var languages = res.languageSpoken;
                        angular.forEach(ctrl.languagesKeyValue, function (obj) {
                            if (languages.indexOf(obj.key) >= 0) {
                                obj.value = true;
                            }
                        });
                    }
                    if (res.preferredCounties != null) {
                        res.preferredCounties = res.preferredCounties.split(",");
                    } else {
                        res.preferredCounties = [];
                    }
                    if (ctrl.employee.otherLanguages != null && ctrl.employee.otherLanguages != '') {
                        ctrl.otherLanguageCheckbox = true;
                        ctrl.refreshLanguages();
                    }
                    ctrl.retrivalRunning = false;
                    EmployeeDAO.retrieveEmployeeCareRates({employee_id: ctrl.employee.id}).then(function (res) {
                        ctrl.employee.careRatesList = res;
                        $timeout(function () {
                            refreshRates();
                        }, 200);
                        ctrl.retrivalRunning = false;
                        if (ctrl.employee.careRatesList.rate1 != null && ctrl.employee.careRatesList.rate1.rate != null) {
                            ctrl.employee.careRatesList.rate1.rate = ctrl.employee.careRatesList.rate1.rate.toFixed(2);
                        }
                        if (ctrl.employee.careRatesList.rate2 != null && ctrl.employee.careRatesList.rate2.rate != null) {
                            ctrl.employee.careRatesList.rate2.rate = ctrl.employee.careRatesList.rate2.rate.toFixed(2);
                        }
                        if (ctrl.employee.careRatesList.rate3 != null && ctrl.employee.careRatesList.rate3.rate != null) {
                            ctrl.employee.careRatesList.rate3.rate = ctrl.employee.careRatesList.rate3.rate.toFixed(2);
                        }
                        if (ctrl.employee.careRatesList.rate4 != null && ctrl.employee.careRatesList.rate4.rate != null) {
                            ctrl.employee.careRatesList.rate4.rate = ctrl.employee.careRatesList.rate4.rate.toFixed(2);
                        }
                        if (ctrl.employee.careRatesList.rate5 != null && ctrl.employee.careRatesList.rate5.rate != null) {
                            ctrl.employee.careRatesList.rate5.rate = ctrl.employee.careRatesList.rate5.rate.toFixed(2);
                        }
                    }).catch(function () {
                        toastr.error("Failed to retrieve employee care rates.");
                    });
                    
                    if (ctrl.employee.profileImage != null && ctrl.employee.profileImage != '') {
                        EmployeeDAO.downloadProfilePic({fileName: ctrl.employee.profileImage, fileType: 'c'}).then(function (resImage) {
                            ctrl.profileImage = resImage.signedUrl;
                        }).catch(function () {});
                    }
                }).catch(function (data, status) {
                    toastr.error("Failed to retrieve employee.");
                    ctrl.retrivalRunning = false;
                }).then(function () {
                    setTimeout(function () {
                        //Reset dirty status of form
                        if ($.fn.dirtyForms) {
                            $('form').dirtyForms('setClean');
                            $('.dirty').removeClass('dirty');
                        }
                    }, 100);
                    $rootScope.unmaskLoading();
                });
            } else {
                ctrl.retrivalRunning = false;
            }
        }
        ;

        ctrl.openSSNModal = function (employeeId)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'ssn-modal'),
                size: "md",
                backdrop: false,
                keyboard: false,
                controller: 'SsnCtrl as managessn',
                resolve: {
                    employeeId: function () {
                        return employeeId;
                    }
                }
            });
            modalInstance.result.then(function (value) {
                ctrl.employee.ssn = value;
            }).catch(function () {
                console.log("popup dismissed");
            });
        };

        //        These needs to be done for dynamic validations. It creates issue because of data-validate directive which applies to static form only
        function setFormDynamicValidityMessages() {
            $("#Salary-error").text('Please enter Salary.');
            $("#SocialSecurity-error").text('Please enter value.');
            $("#rate1-error").text('Please select Care Types.');
            $("#Rate1-error").text('Please enter Rate 1.');
            $("#OTRate-error").text('Please enter OT Rate.');
            $("#HDRate-error").text('Please enter HD Rate.');
            $("#WHRate-error").text('Please enter Worksite Hours Rate.');
            $("#TBTestingExpirationDate-error").text('Please enter TB Testing Expiration Date.');
            $("#PhysicalExpirationDate-error").text('Please enter Physical Expiration Date.');
        }

        $scope.$watch(function () {
            return ctrl.employee.physical;
        }, function (newVal, oldValue) {
            if (newVal && newVal !== '') {
                $("input[name='PhysicalExpirationDate']").attr('required', true);
            } else {
                $("input[name='PhysicalExpirationDate']").attr('required', false);
            }
        });

        $scope.$watch(function () {
            return ctrl.employee.tbTesting;
        }, function (newVal, oldValue) {
            if (newVal && newVal !== '') {
                $("input[name='TBTestingExpirationDate']").attr('required', true);
            } else {
                $("input[name='TBTestingExpirationDate']").attr('required', false);
            }
        });

        $scope.$watch(function () {
            return ctrl.employee.wages;
        }, function (newVal, oldValue) {
            setValidationsForTab2(newVal);
        });

        $scope.$watch(function () {
            return ctrl.employee.wages;
        }, function (newVal, oldValue) {
            setValidationsForTab2(newVal);
        });

        ctrl.buildCareTypesList = function () {

            var selectedCareTypesAll = [];
            angular.forEach(ctrl.employee.careRatesList.rate1.careTypes, function (obj) {
                selectedCareTypesAll.push(obj);
            });
            angular.forEach(ctrl.employee.careRatesList.rate2.careTypes, function (obj) {
                selectedCareTypesAll.push(obj);
            });
            angular.forEach(ctrl.employee.careRatesList.rate3.careTypes, function (obj) {
                selectedCareTypesAll.push(obj);
            });
            angular.forEach(ctrl.employee.careRatesList.rate4.careTypes, function (obj) {
                selectedCareTypesAll.push(obj);
            });
            angular.forEach(ctrl.employee.careRatesList.rate5.careTypes, function (obj) {
                selectedCareTypesAll.push(obj);
            });
            ctrl.careTypeList5 = [];
            ctrl.careTypeList4 = [];
            ctrl.careTypeList3 = [];
            ctrl.careTypeList2 = [];
            ctrl.careTypeList1 = [];

            angular.forEach(ctrl.careTypeList, function (obj) {
                if (selectedCareTypesAll.indexOf(obj.id) < 0 || ctrl.employee.careRatesList.rate1.careTypes.indexOf(obj.id) >= 0) {
                    ctrl.careTypeList1.push(obj);
                }
                if (selectedCareTypesAll.indexOf(obj.id) < 0 || ctrl.employee.careRatesList.rate2.careTypes.indexOf(obj.id) >= 0) {
                    ctrl.careTypeList2.push(obj);
                }
                if (selectedCareTypesAll.indexOf(obj.id) < 0 || ctrl.employee.careRatesList.rate3.careTypes.indexOf(obj.id) >= 0) {
                    ctrl.careTypeList3.push(obj);
                }
                if (selectedCareTypesAll.indexOf(obj.id) < 0 || ctrl.employee.careRatesList.rate4.careTypes.indexOf(obj.id) >= 0) {
                    ctrl.careTypeList4.push(obj);
                }
                if (selectedCareTypesAll.indexOf(obj.id) < 0 || ctrl.employee.careRatesList.rate5.careTypes.indexOf(obj.id) >= 0) {
                    ctrl.careTypeList5.push(obj);
                }
            });
            $timeout(function () {
                refreshRates();
            }, 200);
        }

        var buildCareTypesExceptGiven = function (newCareTypeList) {
            var newCareTypes2 = [];
            angular.forEach(ctrl.careTypeList, function (obj) {
                if (newCareTypeList.indexOf(obj.id) < 0) {
                    newCareTypes2.push(obj);
                }
            });
        }
        var rebuildCareTypeList = function (otherCareTypeList, newList, idName) {
            if (otherCareTypeList) {
                otherCareTypeList = buildCareTypesExceptGiven(newList);
                $timeout(function () {
                    $(idName).multiSelect('refresh');
                }, 100);
            }
            return otherCareTypeList;
        }

        function setValidationsForTab2(wages) {
            if (wages && wages === 'S') {
                $("input[name='Salary']").attr('required', true);
                $("select[name='rate1']").attr('required', false);
                $("input[name='Rate1']").attr('required', false);
                $("input[name='OTRate']").attr('required', false);
                $("input[name='HDRate']").attr('required', false);
                $("input[name='WHRate']").attr('required', false);
            } else {
                $("input[name='Salary']").attr('required', false);
                $("select[name='rate1']").attr('required', true);
                $("input[name='Rate1']").attr('required', true);
                $("input[name='OTRate']").attr('required', true);
                $("input[name='HDRate']").attr('required', true);
                $("input[name='WHRate']").attr('required', true);
            }
        }
        
        ctrl.refreshCountyDropDown = function() {
            $timeout(function () {
                        $('#PreferredCounties').trigger('change.select2');
                    }, 100);
        }

        ctrl.tab3DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea, #add_employee_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    googleMapFunctions(ctrl.employee.locationLatitude, ctrl.employee.locationLongitude);
                    form_data = $('#add_employee_form').serialize();
                    ctrl.refreshCountyDropDown();
                } else {
                    ctrl.tab3DataInit();
                }
            }, 100);
        }

        ctrl.tab4DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea #add_employee_form select").first().focus();
            $timeout(function () {
                if (!ctrl.employee.employeeAttachments) {
                    ctrl.employee.employeeAttachments = [];
                }
                if (!ctrl.retrivalRunning) {
                    form_data = $('#add_employee_form').serialize();
                    $formService.resetRadios();
                } else {
                    ctrl.tab4DataInit();
                }
            }, 100);

        };

        ctrl.tab2DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea #add_employee_form select").first().focus();
            //to set radio buttons on tab init..
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    CareTypeDAO.retrieveAll({positionId: ctrl.employee.companyPositionId}).then(function (res) {
                        ctrl.careTypeList = res;
                        ctrl.buildCareTypesList();

                        $timeout(function () {
                            refreshRates();
                            form_data = $('#add_employee_form').serialize();
                        }, 200);
                    }).catch(function () {
                        toastr.error("Failed to retrieve care types.");
                        form_data = $('#add_employee_form').serialize();
                    });

                    BenefitDAO.retrieveAll({subAction: "active", linesRequired: true}).then(function (benefitPackages) {
                        ctrl.benefitPackages = [];
                        ctrl.benefitPackageWiseLineTypes = {};
                        _.each(benefitPackages, function (benefitPackage) {
                            ctrl.benefitPackages.push({id: benefitPackage.id, packageName: benefitPackage.packageName});
                            ctrl.benefitPackageWiseLineTypes[benefitPackage.id] = _.map(benefitPackage.benefitPackageLineSet, "lineType");
                        });
                    }).catch(function () {
                        toastr.error("Failed to benefits packages.");
                    });

                    if (!ctrl.employee.taxStatus || ctrl.employee.taxStatus === null) {
                        ctrl.employee.taxStatus = 'W';
                    }
                    if (!ctrl.employee.wages || ctrl.employee.wages === null) {
                        ctrl.employee.wages = 'H';
                    }
                    if (!ctrl.employee.payrollGroup || ctrl.employee.payrollGroup === null) {
                        ctrl.employee.payrollGroup = 'A';
                    }
                    $formService.resetRadios();
//                    if (!ctrl.employee.salaryFrequency || ctrl.employee.salaryFrequency === null) {
//                        ctrl.employee.salaryFrequency = '1W';
//                    }
                    setValidationsForTab2(ctrl.employee.wages);
//                    $formService.setRadioValues('TaxStatus', ctrl.employee.taxStatus);
//                    $formService.setRadioValues('Wages', ctrl.employee.wages);
                    form_data = $('#add_employee_form').serialize();
                } else {
                    ctrl.tab2DataInit();
                }
            }, 300);

        };
        ctrl.tab1DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea #add_employee_form select").first().focus();
            //to set edit mode in tab change
            if (!$state.params.id || $state.params.id === '') {
                ctrl.editMode = false;
                ctrl.employee = {};
            } else {
                ctrl.editMode = true;

            }
            //to set radio buttons on tab init..
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    $("input[name='SocialSecurity']").attr('required', true);
                    if (!ctrl.employee.gender) {
                        ctrl.employee.gender = 'M';
                    }
                    if (ctrl.positionList && ctrl.positionList.length > 0) {
                        if (!ctrl.employee.companyPositionId || ctrl.employee.companyPositionId === null) {
                            ctrl.employee.companyPositionId = ctrl.positionList[0].id;
                        }
                    }
//                    $formService.setRadioValues('Position', ctrl.employee.position);
                    form_data = $('#add_employee_form').serialize();
                    $formService.resetRadios();
                } else {
                    ctrl.tab1DataInit();
                }
            }, 100);
        };

        ctrl.applicationUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "a",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.applicationFileSelected = function (file, flow) {
            ctrl.applicationFileObj.flowObj = flow;
            ctrl.applicationFileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.applicationFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.application = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableApplicationUploadButton = false;
        };
        ctrl.applicationFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableApplicationUploadButton = false;
            ctrl.employee.application = null;
            ctrl.applicationFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.applicationFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.employee.application = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.applicationFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableApplicationUploadButton = true;
            ctrl.applicationShowfileProgress = true;
            ctrl.applicationFileObj.errorMsg = null;
            ctrl.applicationFileObj.flow = flow;
            return true;
        };

        ctrl.licenceUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "l",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.licenceFileSelected = function (file, flow) {
            ctrl.licenceFileObj.flowObj = flow;
            ctrl.licenceFileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.licenceFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.licence = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableLicenceUploadButton = false;
        };
        ctrl.licenceFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableLicenceUploadButton = false;
            ctrl.employee.licence = null;
            ctrl.licenceFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.licenceFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.employee.licence = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.licenceFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableLicenceUploadButton = true;
            ctrl.licenceShowfileProgress = true;
            ctrl.licenceFileObj.errorMsg = null;
            ctrl.licenceFileObj.flow = flow;
            return true;
        };

        ctrl.i9eligibilityUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "9",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.i9eligibilityFileSelected = function (file, flow) {
            ctrl.i9eligibilityFileObj.flowObj = flow;
            ctrl.i9eligibilityFileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.i9eligibilityFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.i9 = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableW4UploadButton = false;
        };
        ctrl.i9eligibilityFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableW4UploadButton = false;
            ctrl.employee.i9 = null;
            ctrl.i9eligibilityFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.i9eligibilityFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.employee.i9 = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.i9eligibilityFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableW4UploadButton = true;
            ctrl.i9eligibilityShowfileProgress = true;
            ctrl.i9eligibilityFileObj.errorMsg = null;
            ctrl.i9eligibilityFileObj.flow = flow;
            return true;
        };

        ctrl.w4UploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "w",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.w4FileSelected = function (file, flow) {
            ctrl.w4FileObj.flowObj = flow;
            ctrl.w4FileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.w4FileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.w4 = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableW4UploadButton = false;
        };
        ctrl.w4FileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableW4UploadButton = false;
            ctrl.employee.w4 = null;
            ctrl.w4FileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.w4FileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.employee.w4 = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.w4FileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableW4UploadButton = true;
            ctrl.w4ShowfileProgress = true;
            ctrl.w4FileObj.errorMsg = null;
            ctrl.w4FileObj.flow = flow;
            return true;
        };

        ctrl.referencesUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "r",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.referencesFileSelected = function (file, flow) {
            ctrl.referencesFileObj.flowObj = flow;
            ctrl.referencesFileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.referencesFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.references = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableReferencesUploadButton = false;
        };
        ctrl.referencesFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableReferencesUploadButton = false;
            ctrl.employee.references = null;
            ctrl.referencesFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.referencesFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.employee.references = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.referencesFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableReferencesUploadButton = true;
            ctrl.referencesShowfileProgress = true;
            ctrl.referencesFileObj.errorMsg = null;
            ctrl.referencesFileObj.flow = flow;
            return true;
        };

        ctrl.physicalUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "z",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.physicalFileSelected = function (file, flow) {
            ctrl.physicalFileObj.flowObj = flow;
            ctrl.physicalFileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.physicalFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.physical = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disablePhysicalUploadButton = false;
        };
        ctrl.physicalFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disablePhysicalUploadButton = false;
            ctrl.employee.physical = null;
            ctrl.physicalFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.physicalFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.employee.physical = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.physicalFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disablePhysicalUploadButton = true;
            ctrl.physicalShowfileProgress = true;
            ctrl.physicalFileObj.errorMsg = null;
            ctrl.physicalFileObj.flow = flow;
            return true;
        };

        ctrl.profileUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "c",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.profileFileSelected = function (file, flow) {
            ctrl.profileFileObj.flowObj = flow;

        };
        //When file is uploaded this method will be called.
        ctrl.profileFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.profileImage = response.fileName;
                    EmployeeDAO.downloadProfilePic({fileName: ctrl.employee.profileImage, fileType: 'c'}).then(function (resImage) {
                        ctrl.profileImage = resImage.signedUrl;
                    }).catch(function () {});
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableProfileUploadButton = false;
            ctrl.hideLoadingImage = false;
        };
        ctrl.profileFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableProfileUploadButton = false;
            ctrl.employee.profileImage = null;
            ctrl.profileFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.profileFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.profileUploadFile.headers.fileExt = file.getExtension();
            ctrl.employee.profileImage = null;
            if ($rootScope.validImageFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.profileFileObj.errorMsg = "Please upload a valid file.";
                return false;
            } else {
                $("#cropper-example-2-modal").modal('show');
            }

            ctrl.profileFileObj.errorMsg = null;
            ctrl.profileFileObj.flow = flow;
            return true;
        };

        ctrl.crop = function () {
            ctrl.profileUploadFile.query = $image.cropper("getData");
            var cropObj = $image.cropper("getData");
            ctrl.profileUploadFile.headers.x = parseInt(cropObj.x);
            ctrl.profileUploadFile.headers.y = parseInt(cropObj.y);
            ctrl.profileUploadFile.headers.height = parseInt(cropObj.height);
            ctrl.profileUploadFile.headers.width = parseInt(cropObj.width);
            console.log($image.cropper("getData"));
            ctrl.profileFileObj.flowObj.upload();
            $("#cropper-example-2-modal").modal('hide');
            ctrl.disableSaveButton = true;
            ctrl.disableProfileUploadButton = true;
            ctrl.profileShowfileProgress = true;
        }
        ctrl.closeCropModal = function () {
            $("#cropper-example-2-modal").modal('hide');
            ctrl.profileFileObj.flowObj.cancel();
        };
        var $image = $('#cropper-example-2 > img'),
                cropBoxData,
                canvasData;
        $('body').on('shown.bs.modal', "#cropper-example-2-modal", function () {
            $image = $('#cropper-example-2 > img'),
                    cropBoxData,
                    canvasData;
            $image.cropper("destroy");
            if (cropBoxData != null) {
                canvasData = null;
                cropBoxData = null;
            }

            $image = $('#cropper-example-2 > img'),
                    cropBoxData,
                    canvasData;
            $image.cropper({
                autoCropArea: 0.5,
                aspectRatio: 1 / 1,
                preview: ".img-preview",
                built: function () {
                    // Strict mode: set crop box data first
                    $image.cropper('setCropBoxData', cropBoxData);
                    $image.cropper('setCanvasData', canvasData);
                }
            });
        }).on('hidden.bs.modal', function () {
            cropBoxData = $image.cropper('getCropBoxData');
            canvasData = $image.cropper('getCanvasData');
            $image.cropper('destroy');
        });
        ctrl.zoomIn = function () {
            $image.cropper('zoom', 0.1);
        };
        ctrl.zoomOut = function () {
            $image.cropper('zoom', -0.1);
        };
        ctrl.reset = function () {
            $image.cropper('reset');
        };

//        $scope.$watch(function() {
//            return ctrl.employee.position;
//        }, function(newVal, oldValue) {
//            $formService.setRadioValues('Position', newVal);
//        });
//        $scope.$watch(function() {
//            return ctrl.employee.Wages;
//        }, function(newVal, oldValue) {
//            $formService.setRadioValues('Wages', newVal);
//        });
//        $scope.$watch(function() {
//            return ctrl.employee.TaxStatus;
//        }, function(newVal, oldValue) {
//            $formService.setRadioValues('TaxStatus', newVal);
//        });

//        ctrl.pageInitCall();
        ctrl.deleteAttachment = function (attachment) {
            $rootScope.maskLoading();
            EmployeeDAO.deleteAttachment(attachment).then(function () {
                ctrl.actualAttachments = ctrl.actualAttachments.filter(function (attachmentValid) {
                    return attachmentValid.id !== attachment.id;
                });
                getFilteredAttachments();
                toastr.success("Document deleted successfully.");
            }).catch(function () {
                toastr.error("Document cannot be deleted.");
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        };

        ctrl.openAttachmentModal = function (attachment, mode) {
//            console.log("attachment", attachment);
            var attachmentToEdit = attachment;
            if (attachment.modified === true) {
                attachmentToEdit = _.find(ctrl.actualAttachments, {id: attachment.id});
            }
//            console.log("attachmentToEdit", attachmentToEdit)
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('employee', 'employee-attachment'),
                size: "lg",
                backdrop: false,
                keyboard: false,
                controller: 'EmployeeAttachmentCtrl as employeeAttachment',
                resolve: {
                    attachmentInfo: function () {
                        return mode === 'Edit' ? angular.copy(attachmentToEdit) : {employeeId: ctrl.employee.id, type: attachmentToEdit};
                    },
                    employee: function () {
                        return ctrl.employee;
                    },
                    filename: function () {
                        return mode === 'Edit' ? ctrl.getAttachmentName(attachmentToEdit) : null;
                    }
                }
            });
            modalInstance.result.then(function (updatedAttachment) {
                if (updatedAttachment) {
                    if (updatedAttachment.type === 'aed' && updatedAttachment.attachmentType === 'Disciplinary Action') {
                        var extraFields = JSON.parse(updatedAttachment.extraFields);
                        if (extraFields.warnigLevel === 'Termination' && extraFields.terminationDate !== null) {
                            ctrl.employee.terminationDate = extraFields.terminationDate;
                        }
                    }

                    if (mode === 'Create') {
                        ctrl.actualAttachments.push(updatedAttachment);
                    } else {
                        for (var index = 0; index < ctrl.actualAttachments.length; index++) {
                            if (ctrl.actualAttachments[index].id === attachmentToEdit.id) {
                                ctrl.actualAttachments[index] = angular.copy(updatedAttachment);
                                break;
                            }
                        }
                    }
                    getFilteredAttachments();
                }
                console.log("popup closed");
            });
        };

        ctrl.officeStaffIds = [];
        PositionDAO.retrieveAll({positionGroup: ontime_data.positionGroups.OFFICE_STAFF}).then(function (res) {
            if (res && res.length > 0) {
                angular.forEach(res, function (position) {
                    ctrl.officeStaffIds.push(position.id);
                });
            }
        });
        ctrl.displayDocumentsByPosition = function () {
            ctrl.displayDocumentsByPositionMap = {};
            if (ctrl.employee.companyPositionId && ctrl.officeStaffIds.indexOf(ctrl.employee.companyPositionId) > -1) {
                ctrl.position = "staff";
                ctrl.displayDocumentsByPositionMap = {a: true, 9: true, w: true, r: true, l: false};
                ctrl.typeMap = {'l': "License", '9': "I-9 Eligibility", 'z': "Physical", 't': "Tb Testing"};
            } else {
                ctrl.position = "other";
                ctrl.displayDocumentsByPositionMap = {a: true, 9: true, w: true, r: true, z: true, t: true, b: true, l: true};
                ctrl.typeMap = {'l': "License or Certificate", '9': "I-9 Eligibility", 'z': "Physical", 't': "Tb Testing", 'b': "Background Check"};
            }
        };

        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id))
                    || ($rootScope.currentUser.allowedFeature.indexOf('HR_EDIT_EMPLOYEE') === -1
                            && $rootScope.currentUser.allowedFeature.indexOf('EDIT_EMPLOYEE_DEMO') === -1)) {
                $state.transitionTo(ontime_data.defaultState);
            } else if ($state.current.name.indexOf('tab2') > -1) {
                if ($rootScope.currentUser.allowedFeature.indexOf('VIEW_EMPLOYEE_WAGES') === -1) {
                    $state.transitionTo(ontime_data.defaultState);
                }
            }
            ctrl.editMode = true;
            Page.setTitle("Update Employee");
        } else if ($state.current.name.indexOf('tab1') > -1) {
            if ($rootScope.currentUser.allowedFeature.indexOf('CREATE_EMPLOYEE') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            ctrl.employee = {}
            ctrl.editMode = false;
            Page.setTitle("Add Employee");

        } else {
            $state.transitionTo(ontime_data.defaultState);
        }
        function googleMapFunctions(latitude, longitude) {
            loadGoogleMaps(3).done(function ()
            {
                var map;
                var geocoder = new google.maps.Geocoder();
                var newyork;
                if (latitude && latitude !== null && longitude && longitude !== null) {
                    newyork = new google.maps.LatLng(latitude, longitude);
                } else {
                    newyork = new google.maps.LatLng(40.7127837, -74.00594);
                }
                var marker;
// Add a marker to the map and push to the array.
                function addMarker(location) {
                    marker.setPosition(location);
                }
                function initialize()
                {
                    var mapOptions = {
                        zoom: 12,
                        center: newyork
                    };
                    // Calculate Height
                    var el = document.getElementById('map-1'),
                            doc_height = $('#map-1').height();

                    // Adjust map height to fit the document contianer
                    el.style.height = doc_height + 'px';

                    map = new google.maps.Map(el, mapOptions);
                    marker = new google.maps.Marker({
                        position: newyork,
                        map: map,
                        draggable: true,
//                        animation: google.maps.Animation.DROP
                    });

                    google.maps.event.addListener(marker, 'drag', function (event) {
                        $('#GPSLocation').val(event.latLng);
                        $('#GPSLocation').blur();
                        ctrl.employee.locationLatitude = event.latLng.lat();
                        ctrl.employee.locationLongitude = event.latLng.lng();
                    });

                    google.maps.event.addListener(marker, 'dragend', function (event) {
                        $('#GPSLocation').val(event.latLng);
                        $('#GPSLocation').blur();
                        console.log(event)
                        ctrl.employee.locationLatitude = event.latLng.lat();
                        ctrl.employee.locationLongitude = event.latLng.lng();
                    });
                    $('#GPSLocation').val(newyork);
                    form_data = $('#add_patient_form').serialize();
                }

                initialize();
                $("#address-search").click(function (ev)
                {
                    ev.preventDefault();
                    var address = $('#Search').val().trim();
                    if (address.length != 0)
                    {
                        geocoder.geocode({'address': address}, function (results, status)
                        {
                            if (status == google.maps.GeocoderStatus.OK)
                            {
                                $('#GPSLocation').val(results[0].geometry.location);
                                $('#GPSLocation').blur();
                                ctrl.employee.locationLatitude = results[0].geometry.location.lat();
                                ctrl.employee.locationLongitude = results[0].geometry.location.lng()
                                map.setCenter(results[0].geometry.location);
                                addMarker(results[0].geometry.location);
                            } else {
                                alert('Geocode was not successful for the following reason: ' + status);
                            }
                        });
                    }
                });
            });
        }
    }
    angular.module('xenon.controllers').controller('AddEmployeeCtrl', ["$scope", "CareTypeDAO", "BenefitDAO", "$state", "$modal", "$filter", "EmployeeDAO", "$timeout", "$formService", "$rootScope", "Page", "PositionDAO", "EventTypeDAO", "PatientDAO", "$location", "$anchorScroll", "moment", AddEmployeeCtrl]);
})();
