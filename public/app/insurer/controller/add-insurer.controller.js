(function () {
    function AddInsurerCtrl($scope, $rootScope, $state, $modal, $timeout, InsurerDAO, CareTypeDAO, Page) {
        var ctrl = this;
        ctrl.insurerObj = {insuranceCareTypeCollection: []};
        ctrl.selectedCareTypes = [];
        ctrl.deactivatedCareTypesToRetain = [];
        ctrl.fileObj = {};
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.unselecteModalOpen = false;
        ctrl.insuranceCareTypeMap = {};
        ctrl.planTypes = [{label: "Medicaid", value: "mcd"}, {label: "Medicare", value: "mcr"}, {label: "Tricare Champus", value: "tc"}, {label: "ChampVA", value: "cva"}, {label: "Group Healthplan", value: "gh"}, {label: "Feca Black Lung", value: "fbl"}, {label: "Blue Cross", value: "bc"}, {label: "Blue Shield", value: "bs"}, {label: "Blue Cross/Blue Sheild (BCBS)", value: "bcb"}, {label: "Other", value: "oth"}];
        ctrl.initForm = function () {
            $("#add_inusrer_form input:text, #add_inusrer_form textarea").first().focus();
        };
        ctrl.resetInsurer = function () {
            if (ctrl.insurerObj.contractFile != null) {
                ctrl.insurerObj.contractFile = null;
            }
            if (ctrl.fileObj.flowObj != null) {
                ctrl.fileObj.flowObj.cancel();
            }
        };

        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id)) || $rootScope.currentUser.allowedFeature.indexOf('EDIT_INSURANCE_PROVIDER') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            ctrl.editMode = true;
            ctrl.displayCareTypeModal = false;
            Page.setTitle("Update Payer");
        } else {
            if ($rootScope.currentUser.allowedFeature.indexOf('CREATE_INSURANCE_PROVIDER') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            ctrl.editMode = false;
            Page.setTitle("Add Payer");
        }

        //funcions
        ctrl.saveInsurer = saveInsurerData;
        ctrl.pageInitCall = pageInit;


        ctrl.newSelectedType;
        ctrl.newDeselectedType;
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
        $("#add_inusrer_form").submit(function (event) {
            $('#add_inusrer_form').trigger('resetValidation');
            event.preventDefault();
        });
        //function to save insurer data.
        function saveInsurerData() {
//            if (ctrl.insurerObj.contractFile == null) {
//                ctrl.fileObj.errorMsg = "Please upload Contract File.";
//            }
            if ($('#add_inusrer_form')[0].checkValidity()) {
                if (ctrl.insurerObj.mdol !== 'MD Online') {
                    delete ctrl.insurerObj.mdolAccountNumber;
                }

                var insurerToSave = angular.copy(ctrl.insurerObj);
                var reqParam;
                if (ctrl.insurerObj.id && ctrl.insurerObj.id !== null) {
                    reqParam = 'update';
                    var length = ctrl.insurerObj.insuranceCareTypeCollection.length;
                    var finalCareTypeCollection = [];
                    for (var j = 0; j < ctrl.selectedCareTypes.length; j++) {
                        //to get the latest one
                        for (var i = length; i > 0; i--) {
                            if (ctrl.selectedCareTypes[j] === ctrl.insurerObj.insuranceCareTypeCollection[i - 1].companyCaretypeId.id) {
                                var careType = angular.copy(ctrl.insurerObj.insuranceCareTypeCollection[i - 1]);
                                if (insurerToSave.claimFormType === 'UB04' && (!careType.serviceDescription || careType.serviceDescription === '')) {
                                    careType.serviceDescription = careType.companyCaretypeId.careTypeTitle;
                                }
                                finalCareTypeCollection.push(careType);
                                break;
                            }
                        }
                    }
                    for (var j = 0; j < ctrl.deactivatedCareTypesToRetain.length; j++) {
                        //to get the latest one
                        for (var i = length; i > 0; i--) {
                            if (ctrl.deactivatedCareTypesToRetain[j] === ctrl.insurerObj.insuranceCareTypeCollection[i - 1].companyCaretypeId.id) {
                                var careType = angular.copy(ctrl.insurerObj.insuranceCareTypeCollection[i - 1]);
                                finalCareTypeCollection.push(careType);
                                break;
                            }
                        }
                    }
//                    ctrl.insurerObj.insuranceCareTypeCollection = finalCareTypeCollection;
                    insurerToSave.insuranceCareTypeCollection = finalCareTypeCollection;
                } else {
                    reqParam = 'save';
                }
//                if (insurerToSave.insuranceCareTypeCollection != null) {
//                    angular.forEach(insurerToSave.insuranceCareTypeCollection, function(obj) {
//                        delete obj.id;
//                    })
//                }
                insurerToSave.orgCode = ctrl.companyCode;
//                if (insurerToSave.contractStartDate) {
//                    insurerToSave.contractStartDate = new Date(insurerToSave.contractStartDate);
//                }
//                if (insurerToSave.contractEndDate) {
//                    insurerToSave.contractEndDate = new Date(insurerToSave.contractEndDate);
//                }
                $rootScope.maskLoading();
                InsurerDAO.update({action: reqParam, data: insurerToSave})
                        .then(function (res) {
//                            if (!ctrl.insurerObj.id || ctrl.insurerObj.id === null) {
//                                $state.go('^.insurer', {id: res.id});
//                                ctrl.editMode = true;
//                            }
                            $state.go('app.insurer-list');
                            ctrl.insurerObj = res;
                            toastr.success("Payer saved.");
                        }).catch(function () {
                    //exception logic
                    toastr.error("Payer cannot be saved.");

                }).then(function () {
                    $rootScope.unmaskLoading();
                });

            }
        }

        //function called on page initialization.
        function pageInit() {
            CareTypeDAO.retrieveAll().then(function (res) {
                ctrl.careTypeList = res;
                ctrl.careTypeIdMap = {};
                angular.forEach(ctrl.careTypeList, function (obj) {
                    ctrl.careTypeIdMap[obj.id] = obj;
                });
                $timeout(function () {
                    $('#multi-select').multiSelect('refresh');
                });
                if (ctrl.editMode) {
                    ctrl.retrivalRunning = true;
                    $rootScope.maskLoading();
                    InsurerDAO.get({id: $state.params.id}).then(function (res) {
                        ctrl.insurerObj = res;
                        if (ctrl.insurerObj.payerType == null) {
                            ctrl.insurerObj.payerType = 'HomeCarePayer';
                        }

                        if (ctrl.insurerObj.insuranceCareTypeCollection == null) {
                            ctrl.insurerObj.insuranceCareTypeCollection = [];
                        } else {
                            angular.forEach(ctrl.insurerObj.insuranceCareTypeCollection, function (obj) {
                                if(!ctrl.careTypeIdMap[Number(obj.companyCaretypeId.id)]) {
                                    ctrl.deactivatedCareTypesToRetain.push(Number(obj.companyCaretypeId.id));
                                } else if (ctrl.selectedCareTypes.indexOf(Number(obj.companyCaretypeId.id))) {
                                    ctrl.selectedCareTypes.push(Number(obj.companyCaretypeId.id));
                                }
                                ctrl.insuranceCareTypeMap[obj.companyCaretypeId.id] = obj;
                            });
                        }
                        ctrl.retrivalRunning = false;
                    }).catch(function (data, status) {
                        toastr.error("Failed to retrieve Payer.");
                        showLoadingBar({
                            delay: .5,
                            pct: 100,
                            finish: function () {

                            }
                        }); // showLoadingBar
                        console.log(JSON.stringify(ctrl.insurerObj));
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                } else {
                    ctrl.insurerObj.payerType = 'HomeCarePayer';
                }
            }).catch(function () {
                toastr.error("Failed to retrieve care type.");
                form_data = $('#add_patient_form').serialize();
            });

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
            $rootScope.careTypeModel.unitValues = ontime_data.unitValues;
            $rootScope.careTypeModel.claimFormType = ctrl.insurerObj.claimFormType;
            $rootScope.careTypeModel.payerType = ctrl.insurerObj.payerType;
            //to not open the popup for changes done in this modals
            if (selection) {
                ctrl.selecteModalOpen = true;
                $rootScope.careTypeModel.title = ctrl.careTypeIdMap[ctrl.newSelectedType].careTypeTitle;
            } else {
                //for remove button in unselection
                $rootScope.careTypeModel.showRemove = true;
                ctrl.unselecteModalOpen = true;
                $rootScope.careTypeModel.title = ctrl.careTypeIdMap[ctrl.newDeselectedType[0]].careTypeTitle;
            }
            //initialize or copy the careTypeObj
            if (selection) {
                $rootScope.careTypeModel.careTypeObj = {};
                $rootScope.careTypeModel.careTypeObj.unit = "unit";
                $rootScope.careTypeModel.careTypeObj.unitValue = 0.25;
            } else {
                $rootScope.careTypeModel.careTypeObj = angular.copy(ctrl.insuranceCareTypeMap[ctrl.newDeselectedType[0]]);
                if ($rootScope.careTypeModel.careTypeObj.modifiers != null) {
                    $rootScope.careTypeModel.careTypeObj.modifiers = JSON.parse($rootScope.careTypeModel.careTypeObj.modifiers);
                }
            }
            //to make the radio buttons selected, theme bug
            setTimeout(function () {
                cbr_replace();
            }, 100);
            $rootScope.careTypeModel.save = function () {
                $timeout(function () {
                    if ($('#care_type_form')[0].checkValidity()) {
                        if ($rootScope.careTypeModel.careTypeObj.modifiers != null) {
                            $rootScope.careTypeModel.careTypeObj.modifiers = JSON.stringify($rootScope.careTypeModel.careTypeObj.modifiers);
                        }
                        if (selection) {
                            $rootScope.careTypeModel.careTypeObj.companyCaretypeId = ctrl.careTypeIdMap[ctrl.newSelectedType];
                            ctrl.insuranceCareTypeMap[ctrl.newSelectedType] = $rootScope.careTypeModel.careTypeObj;
                            var pushed = false;
                            //to not make a new entry if it is selected again(exists in a list.)
                            for (var i = 0; i < ctrl.insurerObj.insuranceCareTypeCollection.length; i++) {
                                if (ctrl.insurerObj.insuranceCareTypeCollection[i].companyCaretypeId.id === Number(ctrl.newSelectedType)) {
                                    pushed = true;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].rate = $rootScope.careTypeModel.careTypeObj.rate;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].unit = $rootScope.careTypeModel.careTypeObj.unit;
                                    if ($rootScope.careTypeModel.careTypeObj.unit == 'unit') {
                                        ctrl.insurerObj.insuranceCareTypeCollection[i].unitValue = $rootScope.careTypeModel.careTypeObj.unitValue;
                                    }
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].modifiers = $rootScope.careTypeModel.careTypeObj.modifiers;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].billingCode = $rootScope.careTypeModel.careTypeObj.billingCode;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].revenueCode = $rootScope.careTypeModel.careTypeObj.revenueCode;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].serviceDescription = $rootScope.careTypeModel.careTypeObj.serviceDescription;
                                }
                            }
                            if (!pushed) {
                                ctrl.insurerObj.insuranceCareTypeCollection.push($rootScope.careTypeModel.careTypeObj);
                            }
                        } else {
                            //for edit part
                            ctrl.insuranceCareTypeMap[Number(ctrl.newDeselectedType[0])] = $rootScope.careTypeModel.careTypeObj;
                            for (var i = 0; i < ctrl.insurerObj.insuranceCareTypeCollection.length; i++) {
                                if (ctrl.insurerObj.insuranceCareTypeCollection[i].companyCaretypeId.id === Number(ctrl.newDeselectedType[0])) {
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].rate = $rootScope.careTypeModel.careTypeObj.rate;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].unit = $rootScope.careTypeModel.careTypeObj.unit;
                                    if ($rootScope.careTypeModel.careTypeObj.unit == 'unit') {
                                        ctrl.insurerObj.insuranceCareTypeCollection[i].unitValue = $rootScope.careTypeModel.careTypeObj.unitValue;
                                    }
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].modifiers = $rootScope.careTypeModel.careTypeObj.modifiers;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].billingCode = $rootScope.careTypeModel.careTypeObj.billingCode;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].revenueCode = $rootScope.careTypeModel.careTypeObj.revenueCode;
                                    ctrl.insurerObj.insuranceCareTypeCollection[i].serviceDescription = $rootScope.careTypeModel.careTypeObj.serviceDescription;
                                }
                            }
                            ctrl.selectedCareTypes.push(Number(ctrl.newDeselectedType[0]));
                        }
                        $rootScope.careTypeModel.dismiss();
                        if (selection) {
                            //make this false when selection process should end casually.
                            ctrl.selecteModalOpen = false;
                        } else {
                            $timeout(function () {
                                $("#multi-select").multiSelect('refresh');
                            });
                        }
                    }
                });
            };

            $rootScope.careTypeModel.remove = function () {
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
                    for (var i = 0; i < ctrl.selectedCareTypes.length; i++) {
                        if (ctrl.selectedCareTypes[i].toString() !== ctrl.newSelectedType.toString()) {
                            careTypes.push(ctrl.selectedCareTypes[i]);
                        }
                    }
                    ctrl.selectedCareTypes = careTypes;
                } else {
                    if ($rootScope.careTypeModel.careTypeObj.modifiers != null) {
                        $rootScope.careTypeModel.careTypeObj.modifiers = JSON.stringify($rootScope.careTypeModel.careTypeObj.modifiers);
                    }
                    ctrl.selectedCareTypes.push(Number(ctrl.newDeselectedType[0]));
                }
                $timeout(function () {
                    $("#multi-select").multiSelect('refresh');
                    $rootScope.careTypeModel.close();
                });
            };

        };

        ctrl.pageInitCall();

        $scope.$watch(function () {
            return ctrl.selectedCareTypes;
        }, function (newValue, oldValue) {
            $timeout(function () {
                $("#multi-select").multiSelect('refresh');
            });
            if (ctrl.displayCareTypeModal && newValue != null && (oldValue == null || newValue.length > oldValue.length)) {
                if (!ctrl.unselecteModalOpen) {
                    if (oldValue == null) {
                        ctrl.newSelectedType = newValue;
                    } else {
                        ctrl.newSelectedType = arr_diff(newValue, oldValue);
                    }
                    ctrl.openModal('modal-5', 'md', 'static', true);
                } else {
                    ctrl.unselecteModalOpen = false;
                }
            } else if (oldValue !== null && newValue.length < oldValue.length) {
                if (!ctrl.selecteModalOpen) {
                    ctrl.newDeselectedType = arr_diff(oldValue, newValue);
                    ctrl.openModal('modal-5', 'md', 'static', false);
                } else {
                    ctrl.selecteModalOpen = false;
                }
            }
        }, true);
        ctrl.uploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: "i",
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.fileSelected = function (file, flow) {
            ctrl.fileObj.flowObj = flow;
            ctrl.fileObj.selectedFile = file;
            ctrl.fileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.fileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.insurerObj.contractFile = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableUploadButton = false;
        };
        ctrl.fileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableUploadButton = false;
            ctrl.fileName = "";
            ctrl.fileExt = "";
            ctrl.insurerObj.contractFile = null;
            ctrl.fileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.fileAdded = function (file, flow) { //It will allow all types of attachments'
            ctrl.insurerObj.contractFile = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.fileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableUploadButton = true;
            ctrl.showfileProgress = true;
            ctrl.fileObj.errorMsg = null;
            ctrl.fileObj.flow = flow;
            ctrl.fileName = file.name;
            ctrl.fileExt = "";
            ctrl.fileExt = file.getExtension();
            return true;
        };

        ctrl.ediProcessorUpdated = function () {
            if (ctrl.insurerObj.mdol === 'Availity') {
                if (ctrl.insurerObj.claimFormType === '1500') {
                    delete ctrl.insurerObj.claimFormType;
                }
            }
        }
    }
    ;
    angular.module('xenon.controllers').controller('AddInsurerCtrl', ["$scope", "$rootScope", "$state", "$modal", "$timeout", "InsurerDAO", "CareTypeDAO", "Page", AddInsurerCtrl]);
})();