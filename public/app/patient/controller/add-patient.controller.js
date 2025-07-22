/* global _ */

(function () {
    function AddPatientCtrl($formService, $state, PatientDAO, $timeout, $scope, $rootScope, CareTypeDAO, EmployeeDAO, InsurerDAO, Page, UtilService, $modal) {
        var ctrl = this;
        ctrl.currentDate = new Date();
        ctrl.maxBirthDate = new Date().setYear((ctrl.currentDate.getYear() + 1900) - 10);
        ctrl.retrivalRunning = true;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.stateCountyList = geo_data.stateCountyList;
        ctrl.stateCountyList['NY'] = $rootScope.nyStateCountyList;
        ctrl.languagesKeyValue = [{key: "English"}, {key: "Creole"}, {key: "Spanish"}, {key: "Russian"}, {key: "French"}, {key: "Hindi"}, {key: "Bengali"}, {key: "Mandarin"}, {key: "Korean"}, {key: "Arabic"}, {key: "Farsi"}, {key: "Urdu"}];
        ctrl.usTimezones = angular.copy(ontime_data.usTimezones);
        ctrl.aideSkills = {};
        ctrl.nextTab;
        ctrl.patient = {};
        ctrl.careTypes = [];
        ctrl.patientCareTypeMap = {};
        ctrl.careTypeIdMap = {};
        ctrl.unselecteModalOpen = false;
        ctrl.refreshLanguages = function () {
            $timeout(function () {
                $('#languageOtherText').tagsinput("add", ctrl.patient.otherLanguages);
            });
        };
        ctrl.refreshReferredBy = function () {
            ctrl.patient.referredByOther = null;
        }
        ctrl.nursingCareList = [];
        ctrl.staffCoordinatorList = [];
        ctrl.insuranceProviderList = [];
        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id)) || $rootScope.currentUser.allowedFeature.indexOf('EDIT_PATIENT') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Update Patient");
            ctrl.editMode = true;
        } else if ($state.current.name.indexOf('tab1') > -1) {
            if ($rootScope.currentUser.allowedFeature.indexOf('CREATE_PATIENT') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Add Patient");
            ctrl.editMode = false;
        } else {
            $state.transitionTo(ontime_data.defaultState);
        }
        var form_data;
        EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.NURSING_CARE_COORDINATOR}).then(function (res) {
            ctrl.nursingCareList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve nursing care list.");
        });
        EmployeeDAO.retrieveByPosition({'position': ontime_data.positionGroups.STAFFING_COORDINATOR}).then(function (res) {
            ctrl.staffCoordinatorList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve staff coordinator list.");
        });
        PatientDAO.retrieveEnumType({'type': 'transportationAssistance'}).then(function (res) {
            ctrl.transportationAssistanceLevels = res;
        }).catch(function () {
            toastr.error("Failed to retrieve transportation assistance levels.");
        });
        PatientDAO.retrieveEnumType({'type': 'priorityCodes'}).then(function (res) {
            ctrl.priorityCodes = res;
        }).catch(function () {
            toastr.error("Failed to retrieve priority codes.");
        });
        PatientDAO.retrieveEnumType({'type': 'aideSkills'}).then(function (res) {
            ctrl.capacitiesKeyValue = res;
        }).catch(function () {
            toastr.error("Failed to retrieve aide skill capacities.");
        });
        PatientDAO.retrieveEnumType({'type': 'patientRefers'}).then(function (res) {
            ctrl.referredByOptions = UtilService.convertAndSortObject(res, ["$resolved", "$promise", "0"]);
            ctrl.referredByOptions.push({ id: 0, label: 'Other' })
        }).catch(function () {
            toastr.error("Failed to retrieve refferal options.");
        });
        InsurerDAO.retrieveAll({'payerType':'HomeCarePayer'}).then(function (res) {
            ctrl.insuranceProviderList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        //funcions
        ctrl.savePatient = savePatientData;
        ctrl.pageInitCall = pageInit;
        ctrl.tab1DataInit = tab1DataInit;
        ctrl.tab2DataInit = tab2DataInit;
        ctrl.tab3DataInit = tab3DataInit;
        ctrl.tab4DataInit = tab4DataInit;
        ctrl.tab5DataInit = tab5DataInit;
        ctrl.navigateToTab = navigateToTab;
        ctrl.setBillingAddress = setBillingAddress;
        ctrl.setBillingAddressRadioButton = setBillingAddressRadioButton;
        ctrl.resetPatient = function () {
            $rootScope.isFormDirty = false;
        };
        ctrl.setFromNext = function (tab) {
            ctrl.nextTab = tab;
        }

        //ceck if form has been changed or not
        //If changed then it should be valid
        //function to navigate to different tab by state
        function navigateToTab(event, state) {
// Don't propogate the event to the document
            if ($rootScope.isFormDirty === true) {
                if (!confirm("You've made changes on this page which aren't saved. If you leave you will lose these changes.\n\nAre you sure you want to leave this page?")) {
                    event.stopPropagation(); // W3C model
                    return;
                } else {
                    $rootScope.isFormDirty = false;
                }
            }
            if ($('#add_patient_form').serialize() !== form_data) {
                ctrl.formDirty = true;
            }
            if (($('#add_patient_form').valid()) || !ctrl.formDirty) {
                if (ctrl.editMode) {
                    $state.go('^.' + state, {id: $state.params.id});
                }
            }
            event.stopPropagation();   // W3C model
        }

        //function to save patient data.
        function savePatientData() {
            if ($('#add_patient_form')[0].checkValidity()) {
                $rootScope.isFormDirty = false;
                var patientToSave = angular.copy(ctrl.patient);
//                if (patientToSave.subscriberInfo && patientToSave.subscriberInfo[0] && patientToSave.subscriberInfo[0].dateOfBirth) {
//                    patientToSave.subscriberInfo[0].dateOfBirth = new Date(patientToSave.subscriberInfo[0].dateOfBirth);
//                }
//                if (patientToSave.dateOfBirth) {
//                    patientToSave.dateOfBirth = new Date(patientToSave.dateOfBirth);
//                }
//                if (patientToSave.authorizationStartDate) {
//                    patientToSave.authorizationStartDate = new Date(patientToSave.authorizationStartDate);
//                }
//                if (patientToSave.authorizationEndDate) {
//                    patientToSave.authorizationEndDate = new Date(patientToSave.authorizationEndDate);
//                }
                patientToSave.languagesSpoken = [];
                angular.forEach(ctrl.languagesKeyValue, function (obj) {
                    if (obj.value == true) {
                        patientToSave.languagesSpoken.push(obj.key);
                    }
                });
                patientToSave.languagesSpoken = patientToSave.languagesSpoken.toString();

                patientToSave.aideSkills = [];
                angular.forEach(ctrl.aideSkills, function (value, key) {
                    if (value === true) {
                        patientToSave.aideSkills.push(key);
                    }
                });
                patientToSave.aideSkills = patientToSave.aideSkills.toString();

                var reqParam;
                if (ctrl.patient.id && ctrl.patient.id !== null) {
                    reqParam = 'update';
                    if (ctrl.careTypes && ctrl.careTypes !== null) {
                        var finalCareTypeCollection = [];
                        if (!ctrl.patient.patientCareTypeCollection) {
                            ctrl.patient.patientCareTypeCollection = [];
                        }
                        patientToSave.patientCareTypeCollection = [];
                        for (var j = 0; j < ctrl.careTypes.length; j++) {
                            for (var i = ctrl.patient.patientCareTypeCollection.length; i > 0; i--) {
                                if (ctrl.careTypes[j] === ctrl.patient.patientCareTypeCollection[i - 1].insuranceCareTypeId.id) {
                                    finalCareTypeCollection.push(angular.copy(ctrl.patient.patientCareTypeCollection[i - 1]));
                                    break;
                                }
                            }
                        }
                        patientToSave.patientCareTypeCollection = finalCareTypeCollection;
                    }
                } else {
                    ctrl.patient.orgCode = ontime_data.company_code;
                    patientToSave.orgCode = ontime_data.company_code;
                    patientToSave.timezone = ontime_data.defaultTimezone;
                    reqParam = 'save';
                }
                var authDocIds = [];
                if (ctrl.authorizationDocuments && ctrl.authorizationDocuments.length > 0) {
                    patientToSave.patientAuthorizationDocuments = [];
                    angular.forEach(ctrl.authorizationDocuments, function (doc) {
                        if (doc.id) {
                            authDocIds.push(doc.id);
                        }
                        var docEntity = {
                            id: doc.id,
                            patientId: patientToSave.id,
                            companyCareTypeId: doc.companyCareTypeId,
                            authorizedHours: doc.authorizedHours,
                            filePath: doc.filePath,
                            name: doc.name,
                            expiryDate: doc.expiryDate,
                            previousExpiryDate: doc.previousExpiryDate,
                            changeSchedule: doc.changeSchedule,
                            dateInserted: doc.dateInserted,
                            authorizationNumber: doc.authorizationNumber,
                            startDate: doc.startDate
                        };
                        patientToSave.patientAuthorizationDocuments.push(docEntity);
                    });
                }
                $rootScope.maskLoading();
                PatientDAO.update({action: reqParam, data: patientToSave})
                        .then(function (res, status) {
                            if (!ctrl.patient.id || ctrl.patient.id === null) {
                                ctrl.editMode = true;
                                ctrl.patient.id = res.id;
                            }
                            if ($rootScope.tabNo === 5) {
                                $state.go('app.patient-list', {status: "active"});
                            } else {
                                $state.go('^.' + ctrl.nextTab, {id: res.id});
                            }
                            ctrl.patient = res;
                            ctrl.updateHourlyRate();
                            ctrl.updatePerVisitCharge();
                            if (res.patientCareTypeCollection) {
                                var length = res.patientCareTypeCollection.length;
                                for (var i = 0; i < length; i++) {
                                    ctrl.patientCareTypeMap[res.patientCareTypeCollection[i].insuranceCareTypeId.id] = res.patientCareTypeCollection[i];
                                }
                            }
                            if (res.patientAuthorizationDocuments) {
                                var length = res.patientAuthorizationDocuments.length;
                                for (var i = 0; i < length; i++) {
                                    if (authDocIds.indexOf(res.patientAuthorizationDocuments[i].id) === -1) {
                                        for (var j = 0; j < ctrl.authorizationDocuments.length; j++) {
                                            if (ctrl.authorizationDocuments[j].companyCareTypeId === res.patientAuthorizationDocuments[i].companyCareTypeId && !ctrl.authorizationDocuments[j].id) {
                                                ctrl.authorizationDocuments[j].id = res.patientAuthorizationDocuments[i].id;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            toastr.success("Patient saved.");
                            //Reset dirty status of form
                            if ($.fn.dirtyForms) {
                                $('form').dirtyForms('setClean');
                                $('.dirty').removeClass('dirty');
                            }
                        })
                        .catch(function (data) {
                            //exception logic
                            if (data && data.status === 417) {
                                toastr.error("Patient saved, but schedule creation failed due to less authorized hours.");
                            } else {
                                toastr.error("Patient cannot be saved.");
                            }
                        }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }

        //function called on page initialization.
        function pageInit() {
            if (ctrl.editMode) {
                $rootScope.maskLoading();
                PatientDAO.get({id: $state.params.id}).then(function (res) {
                    ctrl.patient = res;
                    ctrl.updateHourlyRate();
                    ctrl.updatePerVisitCharge();
                    ctrl.authorizationDocuments = res.patientAuthorizationDocuments;
                    if (ctrl.authorizationDocuments && ctrl.authorizationDocuments.length > 0) {
                        for (var j = 0; j < ctrl.authorizationDocuments.length; j++) {
                            ctrl.authorizationDocuments[j].careTypeTitle = ctrl.authorizationDocuments[j].companyCareType.careTypeTitle;
                            ctrl.authorizationDocuments[j].previousExpiryDate = ctrl.authorizationDocuments[j].expiryDate;
                        }
                        ctrl.authorizationDocuments.sort(function (a, b) {
                            return moment(new Date(b.expiryDate)) - moment(new Date(a.expiryDate));
                        });
                    }
                    ctrl.oldDate = ctrl.patient.authorizationEndDate;
                    ctrl.lastDate = ctrl.patient.authorizationEndDate;
                    if (res.languagesSpoken != null) {
                        var languages = res.languagesSpoken;
                        angular.forEach(ctrl.languagesKeyValue, function (obj) {
                            if (languages.indexOf(obj.key) >= 0) {
                                obj.value = true;
                            }
                        });
                    }

                    if (res.aideSkills != null) {
                        var aideSkills = res.aideSkills.split(',');
                        angular.forEach(aideSkills, function (skillId) {
                            ctrl.aideSkills[skillId] = true;
                        });
                    }


                    if (ctrl.patient.otherLanguages != null && ctrl.patient.otherLanguages != '') {
                        ctrl.otherLanguageCheckbox = true;
                        ctrl.refreshLanguages();
                    }
                    if (res.patientCareTypeCollection) {
                        var careTypesSelected = [];
                        var length = res.patientCareTypeCollection.length;
                        for (var i = 0; i < length; i++) {
                            ctrl.patientCareTypeMap[res.patientCareTypeCollection[i].insuranceCareTypeId.id] = res.patientCareTypeCollection[i];
                            careTypesSelected.push(res.patientCareTypeCollection[i].insuranceCareTypeId.id);
                            if (ctrl.authorizationDocuments && ctrl.authorizationDocuments.length > 0) {
                                for (var j = 0; j < ctrl.authorizationDocuments.length; j++) {
                                    if (ctrl.authorizationDocuments[j].companyCareTypeId === res.patientCareTypeCollection[i].insuranceCareTypeId.companyCaretypeId.id) {
                                        ctrl.authorizationDocuments[j].careType = res.patientCareTypeCollection[i].insuranceCareTypeId.id;//dateInserted
                                    }
                                }
                            }
                        }
                        ctrl.careTypes = careTypesSelected;
//                        delete ctrl.patient.patientCareTypeCollection;
                    }
                    ctrl.retrivalRunning = false;
                }).catch(function (data, status) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
//                    ctrl.patient = ontime_data.patients[($state.params.id - 1)];
                    ctrl.retrivalRunning = false;
//                    console.log(JSON.stringify(ctrl.patient));
                    toastr.error("Failed to retrieve patient");
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

        function tab1DataInit() {
            ctrl.formDirty = false;
            $("#add_patient_form input:text, #add_patient_form textarea, #add_patient_form select").first().focus();
            //to set edit mode in tab change
            if (!$state.params.id || $state.params.id === '') {
                ctrl.editMode = false;
                ctrl.patient = {};
            } else {
                ctrl.editMode = true;
            }
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    //to select gender radio by default in angular. It was having issue due to cbr theme.
                    if (!ctrl.patient.gender) {
                        ctrl.patient.gender = 'M';
                    }
                    if (!ctrl.patient.secondaryContactType) {
                        ctrl.patient.secondaryContactType = 'P';
                    }
                    $formService.resetRadios();
                    form_data = $('#add_patient_form').serialize();
                } else {
                    ctrl.tab1DataInit();
                }
            }, 100);
        }
        function tab2DataInit() {
            ctrl.formDirty = false;
            $("#add_patient_form input:text, #add_patient_form textarea, #add_patient_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    googleMapFunctions(ctrl.patient.locationLatitude, ctrl.patient.locationLongitude);
                    form_data = $('#add_patient_form').serialize();

                } else {
                    ctrl.tab2DataInit();
                }
            }, 100);
        }
        function tab3DataInit() {
            ctrl.formDirty = false;
            $("#add_patient_form input:text, #add_patient_form textarea, #add_patient_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    //to select gender radio by default in angular. It was having issue due to cbr theme.
                    if (!ctrl.patient.isSubscriber && ctrl.patient.isSubscriber !== false) {
                        ctrl.patient.isSubscriber = true;
                    }
                    if (!ctrl.patient.isPrivatePay && ctrl.patient.isPrivatePay !== true) {
                        ctrl.patient.isPrivatePay = false;
                    }
                    if (!ctrl.patient.hasCopayment && ctrl.patient.hasCopayment !== true) {
                        ctrl.patient.hasCopayment = false;
                    }
                    ctrl.unbindPatientCondition();
                    $formService.setRadioValues('IsSubscriber', ctrl.patient.isSubscriber);
                    $formService.setRadioValues('IsPrivatePay', ctrl.patient.isPrivatePay);
                    $formService.setRadioValues('HasCopayment', ctrl.patient.hasCopayment);
                    form_data = $('#add_patient_form').serialize();
                    $formService.resetRadios();
                } else {
                    ctrl.tab3DataInit();
                }
            }, 100);

        }
        function tab4DataInit() {
            $rootScope.isFormDirty = false;
            ctrl.formDirty = false;
            $("#add_patient_form input:text, #add_patient_form textarea, #add_patient_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    if (ctrl.patient.insuranceProviderId && ctrl.patient.insuranceProviderId !== null) {
                        CareTypeDAO.retrieveForInsurer({insurer_id: ctrl.patient.insuranceProviderId}).then(function (res) {
                            ctrl.careTypeList = res;
                            angular.forEach(ctrl.careTypeList, function (careType) {
                                ctrl.careTypeIdMap[careType.id] = careType;
                            })
                            $timeout(function () {
                                $('#CareTypes').multiSelect('refresh');
                                form_data = $('#add_patient_form').serialize();
                            }, 400);
                        }).catch(function () {
                            toastr.error("Failed to retrieve care types.");
                            form_data = $('#add_patient_form').serialize();
                        });
                    } else {
                        form_data = $('#add_patient_form').serialize();
                    }
                } else {
                    ctrl.tab4DataInit();
                }
            }, 100);

        }
        function tab5DataInit() {
            ctrl.formDirty = false;
            $("#add_patient_form input:text, #add_patient_form textarea, #add_patient_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    if (!ctrl.patient.subscriberInfo || ctrl.patient.subscriberInfo === null
                            || ctrl.patient.subscriberInfo.length === 0) {
                        ctrl.patient.subscriberInfo = [];
                        ctrl.patient.subscriberInfo[0] = {};
                    }
                    if (ctrl.patient.isSubscriber && ctrl.patient.isSubscriber === true) {
                        ctrl.patient.subscriberInfo[0].fName = ctrl.patient.fName;
                        ctrl.patient.subscriberInfo[0].lName = ctrl.patient.lName;
                        ctrl.patient.subscriberInfo[0].middleInitial = ctrl.patient.middleInitial;
                        ctrl.patient.subscriberInfo[0].nameSuffix = ctrl.patient.nameSuffix;
                        ctrl.patient.subscriberInfo[0].dateOfBirth = ctrl.patient.dateOfBirth;
                        ctrl.patient.subscriberInfo[0].gender = ctrl.patient.gender;
                        ctrl.patient.subscriberInfo[0].phone = ctrl.patient.phone;
                        ctrl.patient.subscriberInfo[0].relationshipWithPatient = 'I';

                    }
                    if (!ctrl.patient.subscriberInfo[0].subscriberAddressCollection) {
                        ctrl.patient.subscriberInfo[0].subscriberAddressCollection = [];
                        ctrl.patient.subscriberInfo[0].subscriberAddressCollection[0] = {};
                    }
                    if (!ctrl.patient.subscriberInfo[0].subscriberAddressCollection[0].address1
                            || ctrl.patient.subscriberInfo[0].subscriberAddressCollection[0].address1 === null) {
                        var address = {};
                        if (ctrl.patient.patientAddress) {
                            address.address1 = ctrl.patient.patientAddress.address1;
                            address.address2 = ctrl.patient.patientAddress.address2;
                            address.city = ctrl.patient.patientAddress.city;
                            address.state = ctrl.patient.patientAddress.state;
                            address.county = ctrl.patient.patientAddress.county;
                            address.zipcode = ctrl.patient.patientAddress.zipcode;
                            address.timezone = ctrl.patient.patientAddress.timezone;
                        }
                        ctrl.patient.subscriberInfo[0].subscriberAddressCollection = [];
                        ctrl.patient.subscriberInfo[0].subscriberAddressCollection.push(address);
                        $scope.$apply();
                        ctrl.isBillingAddressSameAsPatient = 'Yes';
                        $formService.setRadioValues('IsBillingAddressSameAsPatient', 'Yes');
                    } else {
                        setBillingAddressRadioButton();
                    }
                    //to select gender radio by default in angular. It was having issue due to cbr theme.
                    if (!ctrl.patient.subscriberInfo[0].gender) {
                        ctrl.patient.subscriberInfo[0].gender = 'M';
                    }
                    $formService.setRadioValues('Gender', ctrl.patient.subscriberInfo[0].gender);
                    form_data = $('#add_patient_form').serialize();
                    $formService.resetRadios();
                } else {
                    ctrl.tab5DataInit();
                }
            }, 100);
        }

        function setBillingAddress(sameAsPatientAddress) {
            var address = {};
            if (sameAsPatientAddress === true) {
                address.address1 = ctrl.patient.patientAddress.address1;
                address.address2 = ctrl.patient.patientAddress.address2;
                address.city = ctrl.patient.patientAddress.city;
                address.state = ctrl.patient.patientAddress.state;
                address.county = ctrl.patient.patientAddress.county;
                address.zipcode = ctrl.patient.patientAddress.zipcode;
                address.timezone = ctrl.patient.patientAddress.timezone;
                $("#Address1").blur();
                $("#Address2").blur();
                $("#City").blur();
                $("#State").blur();
                $("#County").blur();
                $("#ZipCode").blur();
                $("#TomeZone").blur();
            }
            ctrl.patient.subscriberInfo[0].subscriberAddressCollection[0] = address;
        }

        function setBillingAddressRadioButton() {
            var subscriberAddress = ctrl.patient.subscriberInfo[0].subscriberAddressCollection[0];
            var patientAddress = ctrl.patient.patientAddress;
            if (subscriberAddress.address1 === patientAddress.address1
                    && subscriberAddress.address2 === patientAddress.address2
                    && subscriberAddress.city === patientAddress.city
                    && subscriberAddress.state === patientAddress.state
                    && subscriberAddress.zipcode === patientAddress.zipcode
                    && subscriberAddress.timezone === patientAddress.timezone) {
                ctrl.isBillingAddressSameAsPatient = 'Yes';
                $formService.setRadioValues('IsBillingAddressSameAsPatient', 'Yes');
            } else {
                ctrl.isBillingAddressSameAsPatient = 'No';
                $formService.setRadioValues('IsBillingAddressSameAsPatient', 'No');
            }
        }

        ctrl.pageInitCall();

        function arr_diff(a1, a2)
        {
            var a = [], diff = [];
            for (var i = 0; i < a1.length; i++)
                a[a1[i]] = true;
            for (var i = 0; i < a2.length; i++)
                if (a[a2[i]])
                    delete a[a2[i]];
                else
                    a[a2[i]] = true;
            for (var k in a)
                diff.push(k);
            return diff;
        }

        // Open Simple Modal
        ctrl.openModal = function (modal_id, modal_size, modal_backdrop, selection)
        {
            //use the same pop up modal based on selection true/false
            $rootScope.careTypeModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            //to not open the popup for changes done in this modals
            if (selection) {
                ctrl.selecteModalOpen = true;
                $rootScope.careTypeModel.title = ctrl.careTypeIdMap[ctrl.newSelectedType].companyCaretypeId.careTypeTitle;
            } else {
                //for remove button in unselection
                $rootScope.careTypeModel.showRemove = true;
                ctrl.unselecteModalOpen = true;
                $rootScope.careTypeModel.title = ctrl.careTypeIdMap[ctrl.newDeselectedType[0]].companyCaretypeId.careTypeTitle;
            }
            //initialize or copy the careTypeObj
            if (selection) {
                $rootScope.careTypeModel.careTypeObj = {};
            } else {
                $rootScope.careTypeModel.careTypeObj = angular.copy(ctrl.patientCareTypeMap[ctrl.newDeselectedType[0]]);
            }
            $rootScope.careTypeModel.save = function () {
                $timeout(function () {
                    if ($('#care_type_form')[0].checkValidity()) {
                        if (selection) {
                            $rootScope.careTypeModel.careTypeObj.insuranceCareTypeId = ctrl.careTypeIdMap[ctrl.newSelectedType];
                            ctrl.patientCareTypeMap[ctrl.newSelectedType] = $rootScope.careTypeModel.careTypeObj;
                            var pushed = false;
                            //to not make a new entry if it is selected again(exists in a list.)
                            for (var i = 0; i < ctrl.patient.patientCareTypeCollection.length; i++) {
                                if (ctrl.patient.patientCareTypeCollection[i].insuranceCareTypeId.id === Number(ctrl.newSelectedType)) {
                                    pushed = true;
                                    ctrl.patient.patientCareTypeCollection[i].authorizedHours = $rootScope.careTypeModel.careTypeObj.authorizedHours;
                                }
                            }
                            if (!pushed) {
                                ctrl.patient.patientCareTypeCollection.push($rootScope.careTypeModel.careTypeObj);
                            }
                        } else {
                            //for edit part
                            ctrl.patientCareTypeMap[Number(ctrl.newDeselectedType[0])] = $rootScope.careTypeModel.careTypeObj;
                            for (var i = 0; i < ctrl.patient.patientCareTypeCollection.length; i++) {
                                if (ctrl.patient.patientCareTypeCollection[i].insuranceCareTypeId.id === Number(ctrl.newDeselectedType[0])) {
                                    ctrl.patient.patientCareTypeCollection[i].authorizedHours = $rootScope.careTypeModel.careTypeObj.authorizedHours;
                                }
                            }
                            ctrl.careTypes.push(Number(ctrl.newDeselectedType[0]));
                        }
                        $rootScope.careTypeModel.dismiss();
                        if (selection) {
                            //make this false when selection process should end casually.
                            ctrl.selecteModalOpen = false;
                        } else {
                            $timeout(function () {
                                $("#CareTypes").multiSelect('refresh');
                            });
                        }
                    }
                });
            };

            $rootScope.careTypeModel.remove = function () {
                //Remove Authorization Documents if any
                if (ctrl.authorizationDocuments && ctrl.authorizationDocuments.length > 0) {
                    for (var i = ctrl.authorizationDocuments.length - 1; i >= 0; i--) {
                        if (ctrl.authorizationDocuments[i].careType == Number(ctrl.newDeselectedType[0]) && (ctrl.authorizationDocuments[i].id === undefined || ctrl.authorizationDocuments[i].id === null)) {
                            ctrl.authorizationDocuments.splice(i, 1);
                        }
                    }
                }
                $timeout(function () {
                    //make this false when unselection process should end casually.
                    ctrl.unselecteModalOpen = false;
                    $rootScope.careTypeModel.dismiss();
                });
            };

            $rootScope.careTypeModel.cancel = function () {
                //reverse the action.
                if (selection) {
                    var careTypes = [];
                    for (var i = 0; i < ctrl.careTypes.length; i++) {
                        if (ctrl.careTypes[i].toString() !== ctrl.newSelectedType.toString()) {
                            careTypes.push(ctrl.careTypes[i]);
                        }
                    }
                    ctrl.careTypes = careTypes;
                } else {
                    ctrl.careTypes.push(Number(ctrl.newDeselectedType[0]));
                }
                $timeout(function () {
                    $("#CareTypes").multiSelect('refresh');
                    $rootScope.careTypeModel.close();
                });
            };

        };

        $scope.$watch(function () {
            return ctrl.authorizationDocuments;
        }, function (newValue, oldValue) {
            if (newValue && oldValue) {
                $rootScope.isFormDirty = true;
            }
        }, true);
        $scope.addCareType = function () {
            $rootScope.careTypeModel = {};
            $rootScope.careTypeModel.careTypeObj = {};
            $rootScope.careTypeModel.careTypeObj.insuranceCareTypeId = ctrl.careTypeIdMap[ctrl.newSelectedType];
            ctrl.patientCareTypeMap[ctrl.newSelectedType] = $rootScope.careTypeModel.careTypeObj;
            var pushed = false;
            //to not make a new entry if it is selected again(exists in a list.)
            for (var i = 0; i < ctrl.patient.patientCareTypeCollection.length; i++) {
                if (ctrl.patient.patientCareTypeCollection[i].insuranceCareTypeId.id === Number(ctrl.newSelectedType)) {
                    pushed = true;
                    ctrl.patient.patientCareTypeCollection[i].authorizedHours = $rootScope.careTypeModel.careTypeObj.authorizedHours;
                }
            }
            if (!pushed) {
                ctrl.patient.patientCareTypeCollection.push($rootScope.careTypeModel.careTypeObj);
            }
            //make this false when selection process should end casually.
            ctrl.selecteModalOpen = false;
        };

        $scope.$watch(function () {
            return ctrl.careTypes;
        }, function (newValue, oldValue) {
            $timeout(function () {
                $("#CareTypes").multiSelect('refresh');
            });
            if (ctrl.displayCareTypeModal && newValue != null && (oldValue == null || newValue.length > oldValue.length)) {
                if (!ctrl.unselecteModalOpen) {
                    if (oldValue == null) {
                        ctrl.newSelectedType = newValue;
                    } else {
                        ctrl.newSelectedType = arr_diff(newValue, oldValue);
                    }
                    $scope.addCareType();
//                    ctrl.openModal('modal-5', 'md', 'static', true);
                } else {
                    ctrl.unselecteModalOpen = false;
                }
            } else if (oldValue !== null && newValue.length < oldValue.length) {
                if (!ctrl.selecteModalOpen) {
                    ctrl.newDeselectedType = arr_diff(oldValue, newValue);
                    //Check if auth document is present.
                    var isAuthPresent = false, index;
                    if (ctrl.authorizationDocuments && ctrl.authorizationDocuments.length > 0) {
                        for (var i = ctrl.authorizationDocuments.length - 1; i >= 0; i--) {
                            if (ctrl.authorizationDocuments[i].careType == Number(ctrl.newDeselectedType[0]) && (ctrl.authorizationDocuments[i].id === undefined || ctrl.authorizationDocuments[i].id === null)) {
                                isAuthPresent = true;
                                index = i;
                                break;
                            }
                        }
                    }
                    if (isAuthPresent)
                        ctrl.openModal('modal-5', 'md', 'static', false);
                } else {
                    ctrl.selecteModalOpen = false;
                }
            }
            ctrl.getWarnings();
        }, true);

        // Open Authorization Document upload Modal
        ctrl.openAuthorizationDocumentModal = function (modal_id, modal_size, modal_backdrop)
        {
            //use the same pop up modal based on selection true/false
            ctrl.authorizationModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                resolve: {
                    addPatient: function () {
                        return ctrl;
                    }
                },
                controller: function (addPatient, $scope, $modalInstance) {
                    $scope.addPatient = addPatient;
                    $scope.careTypeList = [];
                    //Upload Related Code
                    $scope.fileObj = {};
                    $scope.careObj = {};

                    if (ctrl.currentAuthorizationDocument) {

                    } else {
                        for (var i = 0; i < ctrl.insuranceProviderList.length; i++) {
                            if (ctrl.insuranceProviderList[i].id === ctrl.patient.insuranceProviderId) {
                                $scope.careObj.insuranceProviderName = ctrl.insuranceProviderList[i].insuranceName;
                                break;
                            }
                        }
                    }
                    $scope.uploadFile = {
                        target: ontime_data.weburl + 'file/upload',
                        chunkSize: 1024 * 1024 * 1024,
                        testChunks: false,
                        fileParameterName: "fileUpload",
                        singleFile: true,
                        headers: {
                            type: "p",
                            company_code: ontime_data.company_code
                        }
                    };
                    //When file is selected from browser file picker
                    $scope.fileSelected = function (file, flow) {
                        $scope.fileObj.flowObj = flow;
                        $scope.fileObj.selectedFile = file;
//                        $scope.fileObj.flowObj.upload();
                    };
                    //When file is uploaded this method will be called.
                    $scope.fileUploaded = function (response, file, flow) {
                        if (response != null) {
                            response = JSON.parse(response);
                            if (response.fileName != null && response.status != null && response.status == 's') {
                                $scope.fileObj.filePath = response.fileName;
                                $scope.careObj.filePath = response.fileName;
                            }
                        }
                        $scope.disableSaveButton = false;
                        $scope.disableUploadButton = false;
                        $scope.showfileProgress = false;
                        console.log('file uploaded');
                        $rootScope.unmaskLoading();
                        $scope.prepareDataAndSave();
                    };
                    $scope.fileError = function ($file, $message, $flow) {
                        $flow.cancel();
                        $scope.disableSaveButton = false;
                        $scope.disableUploadButton = false;
                        $scope.showfileProgress = false;
                        $scope.fileName = undefined;
                        $scope.fileExt = undefined;
                        $scope.careObj.filePath = null;
                        $scope.fileObj.errorMsg = "File cannot be uploaded";
                        $rootScope.unmaskLoading();
                        console.log('file error');
                    };
                    //When file is added in file upload
                    $scope.fileAdded = function (file, flow) { //It will allow all types of attachments'
                        $scope.formDirty = true;
                        $scope.careObj.filePath = null;
                        if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                            $scope.fileObj.errorMsg = "Please upload a valid file.";
                            return false;
                        }


                        $scope.fileObj.errorMsg = null;
                        $scope.fileObj.flow = flow;
                        $scope.viewEditFileMode = true;
                        $scope.fileName = file.name.substring(0, file.name.lastIndexOf("."));
                        $scope.fileExt = file.getExtension();
                        return true;
                    };

                    $scope.isValidAutorization = function () {
                        var validAuthorization = true;
                        if (!$scope.viewEditFileMode) {
                            $scope.fileObj.errorMsg = "Please upload Authorization Document.";
                            validAuthorization = false;
                        } else if ($scope.fileObj.errorMsg && $scope.fileObj.errorMsg.length > 0) {
                            validAuthorization = false;
                        } else {
                            $scope.fileObj.errorMsg = null;
                        }
                        return validAuthorization;
                    };

                    $scope.authorizationEndDateChanged = function () {
                        if ($scope.careObj.careType && $scope.careObj.careType.companyCaretypeId
                                && $scope.careObj.careType.companyCaretypeId.id && $scope.addPatient.existingSchedule
                                && $scope.addPatient.existingSchedule[$scope.careObj.careType.companyCaretypeId.id] === true
                                && $scope.careObj.expiryDate !== $scope.careObj.previousExpiryDate) {

                            var a = moment(new Date($scope.careObj.expiryDate));
                            var b = moment(new Date($scope.careObj.previousExpiryDate));
                            var diff = b.diff(a, 'days');
                            var extend = true;
                            if (diff > 0) {
                                extend = false;
                            }
                            $scope.careObj.changeSchedule = false;
                            $scope.addPatient.openModalExisting('exist-schedule-modal', 'md', 'static', false, extend, $scope.careObj);
                        } else if ($scope.careObj.expiryDate == $scope.careObj.previousExpiryDate) {
                            $scope.careObj.changeSchedule = false;
                        }
                    };

//                    $scope.isValidCareType = function () {
//                        var valid = true;
//                        if ($scope.addPatient.authorizationDocuments && $scope.addPatient.authorizationDocuments.length > 0) {
//                            for (var i = 0; i < $scope.addPatient.authorizationDocuments.length; i++) {
//                                if ($scope.addPatient.currentAuthorizationDocument && $scope.addPatient.currentAuthorizationDocument.careType == $scope.careObj.careType.id) {
//                                }
//                                else {
//                                    if ($scope.careObj.careType.id == $scope.addPatient.authorizationDocuments[i].careType) {
//                                        valid = false;
//                                        $scope.careObj.errorMsg = 'Authorized document is already added for this care type.';
//                                        break;
//                                    }
//                                }
//                            }
//                        }
//                        return valid;
//                    };

                    $scope.removeFile = function () {
                        if ($scope.careObj.filePath != null) {
                            $scope.careObj.filePath = null;
                        }
                        if ($scope.fileObj.flowObj != null) {
                            $scope.fileObj.flowObj.cancel();
                        }
                        $scope.fileObj = {};
                        $scope.disableSaveButton = false;
                        $scope.disableUploadButton = false;
                        $scope.showfileProgress = false;
                        $scope.viewEditFileMode = false;
                        $scope.fileName = undefined;
                        $scope.fileExt = undefined;
                    };

                    $scope.prepareDataAndSave = function () {
                        if (!$scope.addPatient.authorizationDocuments) {
                            $scope.addPatient.authorizationDocuments = [];
                        }
                        var authObj = {
                            careType: $scope.careObj.careType.id,
                            careTypeTitle: $scope.careObj.careType.companyCaretypeId.careTypeTitle,
                            companyCareTypeId: $scope.careObj.careType.companyCaretypeId.id,
                            authorizedHours: $scope.careObj.authorizedHours,
                            filePath: $scope.careObj.filePath,
                            name: $scope.fileName,
                            insuranceProviderName: $scope.careObj.insuranceProviderName,
                            expiryDate: $scope.careObj.expiryDate,
                            previousExpiryDate: $scope.careObj.previousExpiryDate,
                            changeSchedule: $scope.careObj.changeSchedule,
                            startDate: $scope.careObj.startDate,
                            authorizationNumber: $scope.careObj.authorizationNumber,
                        };
                        if ($scope.addPatient.currentAuthorizationDocument) {
                            if ($scope.addPatient.currentAuthorizationDocument.id) {
                                authObj.id = $scope.addPatient.currentAuthorizationDocument.id;
                                authObj.dateInserted = $scope.addPatient.currentAuthorizationDocument.dateInserted;
                            }
                            $scope.addPatient.authorizationDocuments[$scope.addPatient.currentAuthorizationDocumentIndex] = authObj;
                        } else {
                            authObj['insuranceProviderId'] = ctrl.patient.insuranceProviderId;
                            $scope.addPatient.authorizationDocuments.push(authObj);
                        }
                        $scope.addPatient.authorizationDocuments.sort(function (a, b) {
                            return moment(new Date(b.expiryDate)) - moment(new Date(a.expiryDate));
                        });

                        $scope.close();
                    };

                    $scope.saveAuthorizationDocument = function () {
                        if ($scope.isValidAutorization() && $('#authorizationDoc')[0].checkValidity()) {
                            $scope.disableSaveButton = true;
                            $scope.disableUploadButton = true;
                            $scope.showfileProgress = true;
                            if ($scope.fileObj.flowObj) {
                                $rootScope.maskLoading();
                                $scope.fileObj.flowObj.upload();
                            } else
                                $scope.prepareDataAndSave();
                        } else {
                            console.log('invalid');
                        }
                    };


                    if (addPatient.careTypes && addPatient.careTypes.length > 0) {
                        angular.forEach(addPatient.careTypes, function (careTypeId) {
                            $scope.careTypeList.push(addPatient.careTypeIdMap[careTypeId]);
                        });
                    }
                    if ($scope.addPatient.currentAuthorizationDocument) {
                        $scope.viewEditFileMode = true;
                        $scope.careObj.careType = addPatient.careTypeIdMap[$scope.addPatient.currentAuthorizationDocument.careType];
                        $scope.careObj.insuranceProviderName = $scope.addPatient.currentAuthorizationDocument.insuranceProviderName;
                        $scope.careObj.authorizedHours = $scope.addPatient.currentAuthorizationDocument.authorizedHours;
                        $scope.careObj.expiryDate = $scope.addPatient.currentAuthorizationDocument.expiryDate;
                        $scope.careObj.startDate = $scope.addPatient.currentAuthorizationDocument.startDate;
                        $scope.careObj.authorizationNumber = $scope.addPatient.currentAuthorizationDocument.authorizationNumber;
                        $scope.careObj.previousExpiryDate = $scope.addPatient.currentAuthorizationDocument.previousExpiryDate;
                        $scope.careObj.filePath = $scope.addPatient.currentAuthorizationDocument.filePath;
                        $scope.fileName = $scope.addPatient.currentAuthorizationDocument.name;
                        $scope.fileExt = $scope.addPatient.currentAuthorizationDocument.filePath.substring($scope.addPatient.currentAuthorizationDocument.filePath.lastIndexOf(".") + 1);
                    }
                    $scope.close = function () {
                        $modalInstance.dismiss('cancel');
                    };
                }
            });
        };
        ctrl.createOrEditAuthorizationDocument = function (editMode) {
            if (editMode !== true) {
                ctrl.currentAuthorizationDocument = undefined;
                ctrl.currentAuthorizationDocumentIndex = undefined;
            }
            ctrl.openAuthorizationDocumentModal('authorization-doc-modal', 'md', 'static');
        };
        ctrl.removeAuthorizationDocument = function (index) {
            if (ctrl.authorizationDocuments && ctrl.authorizationDocuments[index])
                ctrl.authorizationDocuments.splice(index, 1);
        };
        ctrl.editAuthorizationDocument = function (index) {
            if (ctrl.authorizationDocuments && ctrl.authorizationDocuments[index]) {
                ctrl.currentAuthorizationDocument = ctrl.authorizationDocuments[index];
                ctrl.currentAuthorizationDocumentIndex = index;
                ctrl.createOrEditAuthorizationDocument(true);
            }
        };
        function googleMapFunctions(latitude, longitude) {

            loadGoogleMaps(3).done(function ()
            {

                var map;
                var geocoder = new google.maps.Geocoder();
                var infowindow = new google.maps.InfoWindow();


                var newyork;
                if (latitude && latitude !== null && longitude && longitude !== null) {
                    newyork = new google.maps.LatLng(latitude, longitude);
                } else {
                    newyork = new google.maps.LatLng(40.7127837, -74.00594);
                }

                var marker, secondaryMarker;

// Add a marker to the map and push to the array.
                function addMarker(location) {
                    marker.setPosition(location);
                }

                function addSecondaryMarker(location) {
                    if (secondaryMarker == null) {
                        secondaryMarker = new google.maps.Marker({
                            position: location,
                            map: map,
                            draggable: true
                        });
                        google.maps.event.addListener(secondaryMarker, 'drag', function (event) {
                            $('#GPSLocationSecondary').val(event.latLng);
                            $('#GPSLocationSecondary').blur();
                            ctrl.patient.secondLocationLatitude = event.latLng.lat();
                            ctrl.patient.secondLocationLongitude = event.latLng.lng();
                        });
                        google.maps.event.addListener(secondaryMarker, 'dragend', function (event) {
                            $('#GPSLocationSecondary').val(event.latLng);
                            $('#GPSLocationSecondary').blur();
                            ctrl.patient.secondLocationLatitude = event.latLng.lat();
                            ctrl.patient.secondLocationLongitude = event.latLng.lng();
                        });
                        secondaryMarker.addListener('click', function (e) {
                            showInfo(this.position, infowindow, "Secondary Location", this.content);
                            infowindow.open(map, this);
                        });
                    }
                    secondaryMarker.setPosition(location);
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
                    
                    const getComponent = (place, type, nameType) =>
                        place.address_components.find(c => c.types.includes(type))?.[nameType] || '';

                    const extractAddressParts = (addressComponents) => {
                        const getComponent = (type, nameType = 'long_name') =>
                            addressComponents.find(c => c.types.includes(type))?.[nameType] || '';

                        return {
                            neighborhood: getComponent('neighborhood'),
                            route: getComponent('route'),
                            streetNumber: getComponent('street_number'),
                            sublocality: getComponent('sublocality_level_1'),
                            county: getComponent('administrative_area_level_2'),
                            city: getComponent('locality') || getComponent('sublocality_level_1'),
                            state: getComponent('administrative_area_level_1', 'short_name'),
                            country: getComponent('country'),
                            postalCode: getComponent('postal_code')
                        };
                    }


                    // Adjust map height to fit the document contianer
                    el.style.height = doc_height + 'px';

                    map = new google.maps.Map(el, mapOptions);
                    marker = new google.maps.Marker({
                        position: newyork,
                        map: map,
                        draggable: true
                    });
                    if (ctrl.patient.secondLocationLatitude != null) {
                        var location = new google.maps.LatLng(ctrl.patient.secondLocationLatitude, ctrl.patient.secondLocationLongitude);
                        addSecondaryMarker(location);
                        $('#GPSLocationSecondary').val(location);
                    }

                    google.maps.event.addListener(marker, 'drag', function (event) {
                        $('#GPSLocation').val(event.latLng);
                        $('#GPSLocation').blur();
                        ctrl.patient.locationLatitude = event.latLng.lat();
                        ctrl.patient.locationLongitude = event.latLng.lng();
                    });

                    google.maps.event.addListener(marker, 'dragend', function (event) {
                        $('#GPSLocation').val(event.latLng);
                        $('#GPSLocation').blur();
                        const lat = event.latLng.lat();
                        const lng = event.latLng.lng();
                        ctrl.patient.locationLatitude = lat;
                        ctrl.patient.locationLongitude = lng;

                        const geocoder = new google.maps.Geocoder();

                        geocoder.geocode({ location: { lat, lng } }, function (results, status) {
                            if (status === google.maps.GeocoderStatus.OK && results[0]) {
                                const place = results[0];

                                console.log(place)

                                if (!ctrl.patient.patientAddress) {
                                    ctrl.patient.patientAddress = {};
                                }
                                const addressParts = extractAddressParts(place.address_components);
                                const addressSegments = [];

                                if (addressParts.streetNumber) addressSegments.push(addressParts.streetNumber);
                                if (addressParts.route) addressSegments.push(addressParts.route);
                                if (addressParts.neighborhood) addressSegments.push(addressParts.neighborhood);

                                ctrl.patient.patientAddress.address1 = addressSegments.join(', ');
                                ctrl.patient.patientAddress.city = addressParts.city || addressParts.sublocality || addressParts.county;
                                ctrl.patient.patientAddress.state = addressParts.state;
                                ctrl.patient.patientAddress.zipcode = addressParts.postalCode;

                            } else {
                                console.error('Geocoder failed due to: ' + status);
                            }
                        });
                    });
                    marker.addListener('click', function (e) {
                        var content = ctrl.patient.patientAddress.address1;
                        if (ctrl.patient.patientAddress.address2 != null) {
                            content += ctrl.patient.patientAddress.address2;
                        }
                        content += "<br/>" + ctrl.patient.patientAddress.city + ", ";
                        content += ctrl.patient.patientAddress.state + ", ";
                        content += ctrl.patient.patientAddress.zipcode;
                        content += ctrl.patient.patientAddress.timezone;
                        showInfo(this.position, infowindow, 'Primary Location', content);
                        infowindow.open(map, this);
                    });
                    // Adds a marker at the center of the map.
//                    addMarker(newyork);

                    $('#GPSLocation').val(newyork);
                    form_data = $('#add_patient_form').serialize();

                    var input = /** @type {!HTMLInputElement} */(
                        document.getElementById('Search'));
                    var inputSecondary = /** @type {!HTMLInputElement} */(
                        document.getElementById('SearchSecondary'));
                    var autocomplete = new google.maps.places.Autocomplete(input);
                    var autocompleteSecondary = new google.maps.places.Autocomplete(inputSecondary);
                    autocomplete.bindTo('bounds', map);
                    autocompleteSecondary.bindTo('bounds', map);

                    autocomplete.addListener('place_changed', function () {
                        var place = autocomplete.getPlace();
                        console.log(input.value);

                        if (place.geometry && place.geometry.location) {
                            console.log("Latitude:", place.geometry.location.lat());
                            console.log("Longitude:", place.geometry.location.lng());
                        }

                        if (!place.geometry) {
                            try {
                                if (place.name != null && place.name.indexOf(",") >= 0) {
                                    var locationArray = place.name.split(",");
                                    var LatLong = new google.maps.LatLng(Number(locationArray[0]), Number(locationArray[1]));
                                    map.setCenter(LatLong);
                                    place.geometry = { location: LatLong };
                                }
                            } catch (e) {
                                console.error("Error parsing fallback coordinates", e);
                                return;
                            }
                        }

                        if (place.geometry != null) {
                            if (place.geometry.viewport) {
                                map.fitBounds(place.geometry.viewport);
                            } else {
                                map.setCenter(place.geometry.location);
                            }

                            $('#GPSLocation').val(place.geometry.location);
                            console.log(place)
                            console.log(place.geometry.location.lat())
                            console.log(place.geometry.location.lng())

                            var location = place.geometry.location;
                            ctrl.patient.locationLatitude = location.lat();
                            ctrl.patient.locationLongitude = location.lng();

                            if (!ctrl.patient.patientAddress) {
                                ctrl.patient.patientAddress = {};
                            }
                            const addressParts = extractAddressParts(place.address_components);
                            const addressSegments = [];

                            if (addressParts.streetNumber) addressSegments.push(addressParts.streetNumber);
                            if (addressParts.route) addressSegments.push(addressParts.route);
                            if (addressParts.neighborhood) addressSegments.push(addressParts.neighborhood);

                            ctrl.patient.patientAddress.address1 = addressSegments.join(', ');
                            ctrl.patient.patientAddress.city = addressParts.city || addressParts.sublocality || addressParts.county;
                            ctrl.patient.patientAddress.state = addressParts.state;
                            ctrl.patient.patientAddress.zipcode = addressParts.postalCode;
                            
                            map.setCenter(location);
                            addMarker(location);
                            map.setZoom(12);
                        }
                    });
                    autocompleteSecondary.addListener('place_changed', function () {
                        var place = autocompleteSecondary.getPlace();

                        if (!place.geometry) {
                            try {
                                if (place.name != null && place.name.indexOf(",") >= 0) {
                                    var locationArray = place.name.split(",");
                                    var LatLong = new google.maps.LatLng(Number(locationArray[0]), Number(locationArray[1]));
                                    map.setCenter(LatLong);
                                    place.geometry = { location: LatLong };
                                }
                            } catch (e) {
                                console.error("Error parsing fallback coordinates", e);
                                return;
                            }
                        }

                        if (place.geometry != null) {
                            if (place.geometry.viewport) {
                                map.fitBounds(place.geometry.viewport);
                            } else {
                                map.setCenter(place.geometry.location);
                            }

                            $('#GPSLocationSecondary').val(place.geometry.location);
                            $('#GPSLocationSecondary').blur();
                            ctrl.patient.secondLocationLatitude = place.geometry.location.lat();
                            ctrl.patient.secondLocationLongitude = place.geometry.location.lng()
                            map.setCenter(place.geometry.location);
                            addSecondaryMarker(place.geometry.location);
                            map.setZoom(12);
                        }
                    });

                }

                


                initialize();
//                 $("#address-search").click(function (ev)
//                 {
//                     ev.preventDefault();

//                     // var $inp = $(this).find('.form-control'),
//                     var address = $('#Search').val().trim();

//                     // $inp.prev().find('i').addClass('fa-spinner fa-spin');

//                     if (address.length != 0)
//                     {
//                         geocoder.geocode({'address': address}, function (results, status)
//                         {
//                             // $inp.prev().find('i').removeClass('fa-spinner fa-spin');

//                             if (status == google.maps.GeocoderStatus.OK)
//                             {
//                                 $('#GPSLocation').val(results[0].geometry.location);
//                                 $('#GPSLocation').blur();
//                                 ctrl.patient.locationLatitude = results[0].geometry.location.lat();
//                                 ctrl.patient.locationLongitude = results[0].geometry.location.lng()
//                                 map.setCenter(results[0].geometry.location);
//                                 addMarker(results[0].geometry.location);
// //                                var marker = new google.maps.Marker({
// //                                    map: map,
// //                                    position: results[0].geometry.location,
// //                                    draggable: false
// //                                });

//                             } else {
//                                 alert('Geocode was not successful for the following reason: ' + status);
//                             }
//                         });
//                     }
//                 });
                $("#address-search-secondary").click(function (ev)
                {
                    ev.preventDefault();
                    var address = $('#SearchSecondary').val().trim();
                    if (address.length != 0)
                    {
                        geocoder.geocode({'address': address}, function (results, status)
                        {
                            if (status == google.maps.GeocoderStatus.OK)
                            {
                                $('#GPSLocationSecondary').val(results[0].geometry.location);
                                $('#GPSLocationSecondary').blur();
                                ctrl.patient.secondLocationLatitude = results[0].geometry.location.lat();
                                ctrl.patient.secondLocationLongitude = results[0].geometry.location.lng()
                                map.setCenter(results[0].geometry.location);
                                addSecondaryMarker(results[0].geometry.location);
                            } else {
                                alert('Geocode was not successful for the following reason: ' + status);
                            }
                        });
                    }
                });

                function showInfo(latlng, infowindow, title, content) {
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({
                        'latLng': latlng
                    }, function (results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (content == null) {
                                content = results[1].formatted_address;
                            }
                            if (results[1]) {
                                // here assign the data to asp lables
                                infowindow.setContent('<div id="content">' +
                                        '<div id="firstHeading" class="firstHeading">' + title + '</div>' +
                                        '<div id="bodyContent">' + content +
                                        '</div>' +
                                        '</div>');
                            } else {
                                alert('No results found');
                            }
                        } else {
                            alert('Geocoder failed due to: ' + status);
                        }
                    });
                }
            });
        }
//        ctrl.uploadFile = {
//            target: ontime_data.weburl + 'file/upload',
//            chunkSize: 1024 * 1024 * 1024,
//            testChunks: false,
//            fileParameterName: "fileUpload",
//            singleFile: true,
//            headers: {
//                type: "p",
//                company_code: ontime_data.company_code
//            }
//        };
//        //When file is selected from browser file picker
//        ctrl.fileSelected = function (file, flow) {
//            ctrl.fileObj.flowObj = flow;
//            ctrl.fileObj.selectedFile = file;
//            ctrl.fileObj.flowObj.upload();
//        };
//        //When file is uploaded this method will be called.
//        ctrl.fileUploaded = function (response, file, flow) {
//            if (response != null) {
//                response = JSON.parse(response);
//                if (response.fileName != null && response.status != null && response.status == 's') {
//                    ctrl.patient.authorization = response.fileName;
//                }
//            }
//            ctrl.disableSaveButton = false;
//            ctrl.disableUploadButton = false;
//        };
//        ctrl.fileError = function ($file, $message, $flow) {
//            $flow.cancel();
//            ctrl.disableSaveButton = false;
//            ctrl.disableUploadButton = false;
//            ctrl.fileName = "";
//            ctrl.fileExt = "";
//            ctrl.patient.authorization = null;
//            ctrl.fileObj.errorMsg = "File cannot be uploaded";
//        };
//        //When file is added in file upload
//        ctrl.fileAdded = function (file, flow) { //It will allow all types of attachments'
//            ctrl.formDirty = true;
//            ctrl.patient.authorization = null;
//            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
//                ctrl.fileObj.errorMsg = "Please upload a valid file.";
//                return false;
//            }
//            ctrl.disableSaveButton = true;
//            ctrl.disableUploadButton = true;
//            ctrl.showfileProgress = true;
//
//            ctrl.fileObj.errorMsg = null;
//            ctrl.fileObj.flow = flow;
//            ctrl.fileName = file.name;
//            ctrl.fileExt = "";
//            ctrl.fileExt = file.getExtension();
//            return true;
//        };


        ctrl.openModalExisting = function (modal_id, modal_size, modal_backdrop, selection, extend, careObj)
        {
            //use the same pop up modal based on selection true/false
            $rootScope.existingModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.existingModel.extend = extend;
            $rootScope.existingModel.extendSequence = function () {
                $timeout(function () {
                    careObj.changeSchedule = true;
                    $rootScope.existingModel.dismiss();
                });
            };

            $rootScope.existingModel.updateOnly = function () {
                $timeout(function () {
                    $rootScope.existingModel.dismiss();
                });
            };

            $rootScope.existingModel.cancel = function () {
                $timeout(function () {
                    careObj.expiryDate = careObj.previousExpiryDate;
                    $rootScope.existingModel.close();
                });
            };

        };

        ctrl.existingSchedule = undefined;
        if ($state.params.id != '') {
            PatientDAO.checkSchedule({patientId: $state.params.id})
                    .then(function (res) {
                        if (res && res.data) {
                            var checkSchedule = JSON.parse(res.data);
                            ctrl.existingSchedule = checkSchedule.careTypeScheduleCheckMap;
                            ctrl.scheduleAssociation = checkSchedule.careTypeScheduleAssociationMap;
                        }
                    });
        }

        ctrl.getWarnings = function () {
            if (ctrl.scheduleAssociation && _.isObject(ctrl.scheduleAssociation) && (_.keys(ctrl.scheduleAssociation).length > 0) && ctrl.careTypeList && (ctrl.careTypeList.length > 0)) {
                ctrl.warningList = [];
                _.each(ctrl.scheduleAssociation, function (value, key) {
                    if (value === true && ctrl.careTypeList[key] && ctrl.careTypes && (ctrl.careTypes.indexOf(ctrl.careTypeList[key].id) === -1)) {
                        ctrl.warningList.push(ctrl.careTypeList[key].companyCaretypeId.careTypeTitle);
                    }
                });
//                console.log("warningList--", ctrl.warningList);
            }
        };

        ctrl.unbindPatientCondition = function () {
            if (ctrl.patient.patientConditionRelatedTo) {
                if (ctrl.patient.patientConditionRelatedTo === 'EM') {
                    ctrl.patient.patientConditionRelatedEM = 'true';
                    ctrl.patient.patientConditionRelatedAA = 'false';
                    ctrl.patient.patientConditionRelatedOA = 'false';
                } else if (ctrl.patient.patientConditionRelatedTo === 'OA') {
                    ctrl.patient.patientConditionRelatedOA = 'true';
                    ctrl.patient.patientConditionRelatedEM = 'false';
                    ctrl.patient.patientConditionRelatedAA = 'false';
                } else if (ctrl.patient.patientConditionRelatedTo.indexOf('AA:') > -1) {
                    ctrl.patient.patientConditionRelatedAA = 'true';
                    ctrl.patient.patientConditionRelatedEM = 'false';
                    ctrl.patient.patientConditionRelatedOA = 'false';
                    ctrl.patient.patientConditionRelatedAAState = ctrl.patient.patientConditionRelatedTo.split(':')[1];
                }
            } else {
                ctrl.patient.patientConditionRelatedEM = 'false';
                ctrl.patient.patientConditionRelatedAA = 'false';
                ctrl.patient.patientConditionRelatedOA = 'false';
            }
            $formService.setRadioValues('patientConditionRelatedEM', ctrl.patient.patientConditionRelatedEM);
            $formService.setRadioValues('patientConditionRelatedAA', ctrl.patient.patientConditionRelatedAA);
            $formService.setRadioValues('patientConditionRelatedOA', ctrl.patient.patientConditionRelatedOA);
//            $formService.resetRadios();
        };

        ctrl.bindPatientCondition = function (type) {
            switch (type) {
                case 'EM':
                    if (ctrl.patient.patientConditionRelatedEM === 'true') {
                        if (ctrl.patient.patientConditionRelatedAA === 'true')
                            ctrl.patient.patientConditionRelatedAA = 'false';
                        if (ctrl.patient.patientConditionRelatedOA === 'true')
                            ctrl.patient.patientConditionRelatedOA = 'false';
                        ctrl.patient.patientConditionRelatedTo = 'EM';
                    } else {
                        ctrl.patient.patientConditionRelatedTo = null;
                    }
                    break;
                case 'AA':
                    if (ctrl.patient.patientConditionRelatedAA === 'true') {
                        if (ctrl.patient.patientConditionRelatedEM === 'true')
                            ctrl.patient.patientConditionRelatedEM = 'false';
                        if (ctrl.patient.patientConditionRelatedOA === 'true')
                            ctrl.patient.patientConditionRelatedOA = 'false';
                        ctrl.patient.patientConditionRelatedTo = 'AA' + ctrl.patient.patientConditionRelatedAAState ? ':' + ctrl.patient.patientConditionRelatedAAState : '';
                    } else {
                        ctrl.patient.patientConditionRelatedTo = null;
                    }
                    break;
                case 'OA':
                    if (ctrl.patient.patientConditionRelatedOA === 'true') {
                        if (ctrl.patient.patientConditionRelatedEM === 'true')
                            ctrl.patient.patientConditionRelatedEM = 'false';
                        if (ctrl.patient.patientConditionRelatedAA === 'true')
                            ctrl.patient.patientConditionRelatedAA = 'false';
                        ctrl.patient.patientConditionRelatedTo = 'OA';
                    } else {
                        ctrl.patient.patientConditionRelatedTo = null;
                    }
                    break;
                case 'STATE':
                    ctrl.patient.patientConditionRelatedTo = 'AA:' + ctrl.patient.patientConditionRelatedAAState;
            }
            $formService.setRadioValues('patientConditionRelatedEM', ctrl.patient.patientConditionRelatedEM);
            $formService.setRadioValues('patientConditionRelatedAA', ctrl.patient.patientConditionRelatedAA);
            $formService.setRadioValues('patientConditionRelatedOA', ctrl.patient.patientConditionRelatedOA);
            $formService.resetRadios();
        };
        
        // add patient plan of care
        ctrl.carePlanFileObj={};
        ctrl.carePlanUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: 'p',
                fileNamePrefix: 'plan-of-care',
                company_code: ontime_data.company_code
            }
        };
        ctrl.carePlanFileAdded = function (file, flow) {
            ctrl.formDirty = true;
            ctrl.patient.planOfCare = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.carePlanFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableCarePlanUploadButton = true;
            ctrl.carePlanShowfileProgress = true;
            ctrl.carePlanFileObj.errorMsg = null;
            ctrl.carePlanFileObj.flow = flow;
            return true;
        };
        ctrl.carePlanFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.patient.planOfCare = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.carePlanShowfileProgress = false;
            ctrl.disableCarePlanUploadButton = false;
        };
        ctrl.carePlanFileSelected = function (file, flow) {
            ctrl.carePlanFileObj.flowObj = flow;
            ctrl.carePlanFileObj.flowObj.upload();
        };
        ctrl.carePlanFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableCarePlanUploadButton = false;
            ctrl.patient.planOfCare = null;
            ctrl.carePlanFileObj.errorMsg = "File cannot be uploaded";
        };
        ctrl.clearCarePlan = function () {
            if (ctrl.patient != null && ctrl.patient.planOfCare != null) {
                ctrl.patient.planOfCare = null;
            }
            if (ctrl.carePlanFileObj.flowObj != null) {
                ctrl.carePlanFileObj.flowObj.cancel();
            }
        };

        // Private Pay handling
        ctrl.paymentMethodChanged = function () {
            ctrl.patient.planName = null;
            ctrl.patient.policyNumber = null;
            ctrl.patient.insuranceId = null;
            ctrl.patient.medicaidNumber = null;
            ctrl.patient.isSubscriber = null;
            ctrl.patient.patientConditionRelatedEM = null;
            ctrl.patient.patientConditionRelatedAA = null;
            ctrl.patient.patientConditionRelatedOA = null;
            ctrl.patient.patientConditionRelatedAAState = null;
            ctrl.patient.hasCopayment = false;
            ctrl.patient.hourlyAmount = null;
            ctrl.patient.perVisitAmount = null;

            if (!ctrl.patient.isPrivatePay) {
                ctrl.tab3DataInit();
            }
        }

        ctrl.coPaymentOptionChanged = function () {
            if (ctrl.patient.hasCopayment) {
                ctrl.patient.hourlyAmount = '0.00';
                ctrl.patient.perVisitAmount = '0.00';
            } else {
                ctrl.patient.hourlyAmount = null;
                ctrl.patient.perVisitAmount = null;
            }
        }

        ctrl.formatCurrencyAmount = function (amount) {
            if (amount === undefined || amount === null) {
                return '0.00';
            }
            const num = parseFloat(amount);
            if (isNaN(num)) {
                return '0.00';
            }
            return num.toFixed(2);
        }

        ctrl.updateHourlyRate = function () {
            if (ctrl.patient && ctrl.patient.hourlyAmount !== undefined) {
                ctrl.patient.hourlyAmount = ctrl.formatCurrencyAmount(ctrl.patient.hourlyAmount);
            }
        }

        ctrl.updatePerVisitCharge = function () {
            if (ctrl.patient && ctrl.patient.perVisitAmount !== undefined) {
                ctrl.patient.perVisitAmount = ctrl.formatCurrencyAmount(ctrl.patient.perVisitAmount);
            }
        }

    }
    angular.module('xenon.controllers').controller('AddPatientCtrl', ["$formService", "$state", "PatientDAO", "$timeout", "$scope", "$rootScope", "CareTypeDAO", "EmployeeDAO", "InsurerDAO", "Page", "UtilService", "$modal", AddPatientCtrl]);
})();
