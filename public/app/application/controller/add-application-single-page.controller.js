/* global appHelper, ontime_data, _ */

(function () {
    function AddApplicationSinglePageCtrl($scope, CareTypeDAO, $stateParams, $state, $modal, $filter, EmployeeDAO, ApplicationPublicDAO, $timeout, $formService, $rootScope, Page, PositionDAO, EventTypeDAO, PatientDAO, moment) {
        var ctrl = this;
        ctrl.staticPosition;
        $rootScope.isLoginPage = false;
        ctrl.adminLogin = false;
        ctrl.educations = [];
        ctrl.workExperiences = [];
        ctrl.professionalReferences = [];
        ctrl.retrivalRunning = true;
        ctrl.currentDate = new Date();
        ctrl.maxBirthDate = new Date().setYear((ctrl.currentDate.getYear() + 1900) - 10);
        ctrl.employee = {employeeAttachments: []};
        ctrl.todayDate = angular.copy($rootScope.todayDate)
        ctrl.employmentMaxDate = angular.copy(ctrl.todayDate);
        ctrl.refreshLanguages = function () {
            $timeout(function () {
                $('#languageOtherText').tagsinput("add", ctrl.employee.otherLanguages);
            });
        };
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.languagesKeyValue = [{key: "English"}, {key: "Creole"}, {key: "Spanish"}, {key: "Russian"}, {key: "French"}, {key: "Hindi"}, {key: "Bengali"}, {key: "Mandarin"}, {key: "Korean"}, {key: "Arabic"}, {key: "Farsi"}, {key: "Urdu"}];
        ctrl.submitForm = function (action) {
            ctrl.saveEmployee(action);
        };

        var closeWindow = function () {
            window.close();
        }

        var openSubmitApplicationModal = function (application, professionalReferences) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('application', 'application-submit'),
                size: "lg",
                backdrop: false,
                keyboard: false,
                controller: 'ApplicationSubmitCtrl as applicationSubmit',
                resolve: {
                    application: function () {
                        return application;
                    },
                    professionalReferences: function () {
                        return professionalReferences;
                    }
                }
            });
            modalInstance.result.then(function (status) {
                if (status) {
                    ctrl.employee.status = status;
                }
            });
        };

        ctrl.careTypeList = [];
        ctrl.ssn = {};
        ctrl.profileFileObj = {};
        ctrl.resumeFileObj = {};
        ctrl.clearResume = function () {
            if (ctrl.employee != null && ctrl.employee.resume != null) {
                ctrl.employee.resume = null;
            }
            if (ctrl.resumeFileObj.flowObj != null) {
                ctrl.resumeFileObj.flowObj.cancel();
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

        ctrl.pageInitCall = pageInit;
        var form_data;

        ctrl.nonEmployeeFormTab = function () {
            return $rootScope.tabNo === 3 || $rootScope.tabNo === 4;
        }

        //ceck if form has been changed or not
        //If changed then it should be valid
        ctrl.navigateToTab = function (event, state) {
            $scope.resetForm = false;
            if (ctrl.nonEmployeeFormTab()) {
                $state.go('^.' + state, {id: $state.params.id});
            } else {
                if ($('#add_employee_form').serialize() !== form_data) {
                    ctrl.formDirty = true;
                }
                if (($('#add_employee_form').valid()) || !ctrl.formDirty) {
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
        ctrl.saveEmployee = function (action) {
            $scope.resetForm = false;
            ctrl.formSubmitted = true;

            setFormDynamicValidityMessages();
            if ($('#add_employee_form').valid()) {
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

                delete employeeToSave.employeeAttachments;
                delete employeeToSave.educations;
                delete employeeToSave.professionalReferences;
                delete employeeToSave.workExperiences;
                if (ctrl.nonEmployeeFormTab() || ($('#add_employee_form')[0].checkValidity())) {
                    //Check if ssn number is already present
                    ctrl.ssn.exists = false;
                    var action;
                    updateEmployee(action, employeeToSave);
                }
            }

        }

        function updateEmployee(action, employeeToSave) {
            $rootScope.maskLoading();
            ApplicationPublicDAO.updateApplication(employeeToSave)
                    .then(function (employeeRes) {
                        var positionTitle = ctrl.employee.positionTitle;
                        ctrl.employee = employeeRes;
                        ctrl.employee.positionTitle = positionTitle;
                        if (action === 'close') {
                            toastr.success("Application saved.");
                            setTimeout(function () {
                                closeWindow();
                                $state.go('applications');
                            }, 300);
                        } else if (action === 'submit') {
                            openSubmitApplicationModal(employeeRes, ctrl.professionalReferences);
                        } else {
                            toastr.success("Application saved.");
                        }
                        //Reset dirty status of form
                        if ($.fn.dirtyForms) {
                            $('form').dirtyForms('setClean');
                            $('.dirty').removeClass('dirty');
                        }
                    })
                    .catch(function () {
                        toastr.error("Employee cannot be saved.");
                        //exception logic
                    }).then(function () {
                ctrl.formSubmitted = false;
                $rootScope.unmaskLoading();
            });
        }

        ctrl.addEducationLinePopup = function () {
            $rootScope.educationModel = $modal.open({
                templateUrl: 'educationModel',
                size: "md"

            });

            $rootScope.educationModel.educationLine = {'result': 'Completed'};

            $rootScope.educationModel.closePopup = function () {
                $rootScope.educationModel.close();
            }


            $rootScope.educationModel.save = function () {
                if ($rootScope.educationModel.education_form.$valid) {
                    $rootScope.maskLoading();
                    $rootScope.educationModel.educationLine['applicationId'] = ctrl.employee.id;
                    var request = {applicationId: ctrl.employee.applicationId, data: $rootScope.educationModel.educationLine};
                    ApplicationPublicDAO.updateApplicationEducation(request)
                            .then(function (employeeRes) {
                                ctrl.educations.push(employeeRes);
                            })
                            .catch(function () {
                                toastr.error("Education cannot be saved.");
                            }).then(function () {
                        $rootScope.unmaskLoading();
                        $rootScope.educationModel.close();
                    });
                }
            }
        };

        ctrl.addWorkExperienceLinePopup = function () {
            $rootScope.workExperienceModel = $modal.open({
                templateUrl: 'workExperienceModel',
                size: "md"

            });

            $rootScope.workExperienceModel.workExperienceLine = {};
            $rootScope.workExperienceModel.todayDate = angular.copy($rootScope.todayDate)
            $rootScope.workExperienceModel.employmentMaxDate = angular.copy($rootScope.workExperienceModel.todayDate);

            $rootScope.workExperienceModel.closePopup = function () {
                $rootScope.workExperienceModel.close();
            }


            $rootScope.workExperienceModel.save = function () {
                if ($rootScope.workExperienceModel.work_experience_form.$valid) {
                    $rootScope.maskLoading();
                    $rootScope.workExperienceModel.workExperienceLine['applicationId'] = ctrl.employee.id;
                    var request = {applicationId: ctrl.employee.applicationId, data: $rootScope.workExperienceModel.workExperienceLine};
                    ApplicationPublicDAO.updateApplicationWorkExperience(request)
                            .then(function (employeeRes) {
                                ctrl.workExperiences.push(employeeRes);
                                ctrl.workExperienceLine = {};
                            })
                            .catch(function () {
                                toastr.error("Work Experience cannot be saved.");
                            }).then(function () {
                        $rootScope.unmaskLoading();
                        $rootScope.workExperienceModel.close();
                    });
                }
            }

            $rootScope.workExperienceModel.setEmploymentMaxDate = function () {
                if ($rootScope.workExperienceModel.workExperienceLine.endDate) {
                    $rootScope.workExperienceModel.employmentMaxDate = angular.copy($rootScope.workExperienceModel.workExperienceLine.endDate);
                } else {
                    $rootScope.workExperienceModel.employmentMaxDate = angular.copy($rootScope.workExperienceModel.todayDate);
                }
            };
        };

        ctrl.addProfessionalReferenceLinePopup = function () {
            $rootScope.professionalReferenceModel = $modal.open({
                templateUrl: 'professionalReferenceModel',
                size: "md"

            });

            $rootScope.professionalReferenceModel.professionalReferenceLine = {};

            $rootScope.professionalReferenceModel.closePopup = function () {
                $rootScope.professionalReferenceModel.close();
            }


            $rootScope.professionalReferenceModel.save = function () {
                if ($rootScope.professionalReferenceModel.professional_reference_form.$valid) {
                    $rootScope.maskLoading();
                    $rootScope.professionalReferenceModel.professionalReferenceLine['applicationId'] = ctrl.employee.id;
                    var request = {applicationId: ctrl.employee.applicationId, data: $rootScope.professionalReferenceModel.professionalReferenceLine};
                    ApplicationPublicDAO.updateApplicationProfessionalReference(request)
                            .then(function (employeeRes) {
                                ctrl.professionalReferences.push(employeeRes);
                                ctrl.professionalReferenceLine = {};
                            })
                            .catch(function () {
                                toastr.error("Professional Reference cannot be saved.");
                            }).then(function () {
                        $rootScope.unmaskLoading();
                        $rootScope.professionalReferenceModel.close();
                    });
                }
            }
        };

        ctrl.removeEducationLine = function (educationLine) {
            var request = {applicationId: ctrl.employee.applicationId, educationId: educationLine.id};
            $rootScope.maskLoading();
            ApplicationPublicDAO.deleteApplicationEducation(request)
                    .then(function () {
                        for (var i = 0; i < ctrl.educations.length; i++) {
                            if (ctrl.educations[i].id === educationLine.id) {
                                ctrl.educations.splice(i, 1);
                                break;
                            }
                        }
                    })
                    .catch(function () {
                        toastr.error("Education cannot be saved.");
                    }).then(function () {
                $rootScope.unmaskLoading();
            });

        }

        ctrl.removeWorkExperienceLine = function (workExperienceLine) {
            var request = {applicationId: ctrl.employee.applicationId, workExperienceId: workExperienceLine.id};
            $rootScope.maskLoading();
            ApplicationPublicDAO.deleteApplicationWorkExperience(request)
                    .then(function () {
                        for (var i = 0; i < ctrl.workExperiences.length; i++) {
                            if (ctrl.workExperiences[i].id === workExperienceLine.id) {
                                ctrl.workExperiences.splice(i, 1);
                                break;
                            }
                        }
                    })
                    .catch(function () {
                        toastr.error("Work Experience cannot be removed.");
                    }).then(function () {
                $rootScope.unmaskLoading();
            });

        }

        ctrl.removeProfessionalReferenceLine = function (professionalReferenceLine) {
            var request = {applicationId: ctrl.employee.applicationId, referenceId: professionalReferenceLine.id};
            $rootScope.maskLoading();
            ApplicationPublicDAO.deleteApplicationProfessionalReference(request)
                    .then(function () {
                        for (var i = 0; i < ctrl.professionalReferences.length; i++) {
                            if (ctrl.professionalReferences[i].id === professionalReferenceLine.id) {
                                ctrl.professionalReferences.splice(i, 1);
                                break;
                            }
                        }
                    })
                    .catch(function () {
                        toastr.error("Professional Reference cannot be saved.");
                    }).then(function () {
                $rootScope.unmaskLoading();
            });

        }

        //function called on page initialization.
        function pageInit() {
            $rootScope.maskLoading();
            ApplicationPublicDAO.retrieveByApplicationId({id: $state.params.id, includeAttachment: true}).then(function (res) {
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
                ctrl.educations = res['educations'];
                ctrl.workExperiences = res['workExperiences'];
                ctrl.professionalReferences = res['professionalReferences'];

                if (res.languageSpoken != null) {
                    var languages = res.languageSpoken;
                    angular.forEach(ctrl.languagesKeyValue, function (obj) {
                        if (languages.indexOf(obj.key) >= 0) {
                            obj.value = true;
                        }
                    });
                }
                var userName = getCookie("un");
                ctrl.adminLogin = userName !== ctrl.employee.applicationId;

                ctrl.retrivalRunning = false;
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve employee.");
                ctrl.retrivalRunning = false;
                console.log(JSON.stringify(ctrl.employee))
            }).then(function () {
                ctrl.singlePageDataInit();
                setTimeout(function () {
                    //Reset dirty status of form
                    if ($.fn.dirtyForms) {
                        $('form').dirtyForms('setClean');
                        $('.dirty').removeClass('dirty');
                    }
                }, 100);
                $rootScope.unmaskLoading();
            });
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

        ctrl.singlePageDataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea, #add_employee_form select").first().focus();
            $timeout(function () {
                // tab3
                ctrl.educationLine = {'result': 'Completed'};
                // tab4
                ctrl.workExperienceLine = {};
                ctrl.professionalReferenceLine = {};
                ctrl.setEmploymentMaxDate();
                if (!ctrl.retrivalRunning) {
                    // tab2
                    googleMapFunctions(ctrl.employee.locationLatitude, ctrl.employee.locationLongitude);
                    if (ctrl.employee.preferredCounties != null) {
                        ctrl.employee.preferredCounties = ctrl.employee.preferredCounties.split(",");
                    } else {
                        ctrl.employee.preferredCounties = [];
                    }
                    $timeout(function () {
                        $('#PreferredCounties').trigger('change.select2');
                    }, 100);
                    // tab1
                    if (!ctrl.employee.gender) {
                        ctrl.employee.gender = 'M';
                    }
                    if (ctrl.employee.otherLanguages != null && ctrl.employee.otherLanguages != '') {
                        ctrl.otherLanguageCheckbox = true;
                        ctrl.refreshLanguages();
                    }
                    // tab3
                    // overall
                    form_data = $('#add_employee_form').serialize();
                    $formService.resetRadios();

                } else {
                    ctrl.singlePageDataInit();
                }
            }, 100);
        }

        ctrl.tab2DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea, #add_employee_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    googleMapFunctions(ctrl.employee.locationLatitude, ctrl.employee.locationLongitude);
                    form_data = $('#add_employee_form').serialize();
                    if (ctrl.employee.preferredCounties != null) {
                        ctrl.employee.preferredCounties = ctrl.employee.preferredCounties.split(",");
                    } else {
                        ctrl.employee.preferredCounties = [];
                    }
                    $timeout(function () {
                        $('#PreferredCounties').trigger('change.select2');
                    }, 100);
                } else {
                    ctrl.tab2DataInit();
                }
            }, 100);
        }

        ctrl.tab3DataInit = function () {
            ctrl.formDirty = false;
            $timeout(function () {
                ctrl.educationLine = {'result': 'Completed'};
                if (!ctrl.retrivalRunning) {
                    $formService.resetRadios();
                } else {
                    ctrl.tab3DataInit();
                }
            }, 100);

        };

        ctrl.setEmploymentMaxDate = function () {
            if (ctrl.workExperienceLine.endDate) {
                ctrl.employmentMaxDate = angular.copy(ctrl.workExperienceLine.endDate);
            } else {
                ctrl.employmentMaxDate = angular.copy(ctrl.todayDate);
            }
        };

        ctrl.tab4DataInit = function () {
            ctrl.formDirty = false;
            $timeout(function () {
                ctrl.workExperienceLine = {};
                ctrl.professionalReferenceLine = {};
                ctrl.setEmploymentMaxDate();
                if (!ctrl.retrivalRunning) {
                    $formService.resetRadios();
                } else {
                    ctrl.tab4DataInit();
                }
            }, 100);

        };

        ctrl.tab5DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea #add_employee_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    form_data = $('#add_employee_form').serialize();
                    $formService.resetRadios();
                } else {
                    ctrl.tab5DataInit();
                }
            }, 100);

        };

        ctrl.tab1DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea #add_employee_form select").first().focus();
            //to set radio buttons on tab init..
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    $("input[name='SocialSecurity']").attr('required', true);
                    if (!ctrl.employee.gender) {
                        ctrl.employee.gender = 'M';
                    }
                    if (ctrl.employee.otherLanguages != null && ctrl.employee.otherLanguages != '') {
                        ctrl.otherLanguageCheckbox = true;
                        ctrl.refreshLanguages();
                    }
//                    $formService.setRadioValues('Position', ctrl.employee.position);
                    form_data = $('#add_employee_form').serialize();
                    $formService.resetRadios();
                } else {
                    ctrl.tab1DataInit();
                }
            }, 100);
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
        ctrl.resumeUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: 'aed',
                fileNamePrefix: 'resume',
                company_code: ontime_data.company_code
            }
        };
        //When file is selected from browser file picker
        ctrl.profileFileSelected = function (file, flow) {
            ctrl.profileFileObj.flowObj = flow;

        };
        ctrl.resumeFileSelected = function (file, flow) {
            ctrl.resumeFileObj.flowObj = flow;
            ctrl.resumeFileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.profileFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.profileImage = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableProfileUploadButton = false;
            ctrl.hideLoadingImage = false;
        };
        ctrl.resumeFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.employee.resume = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.resumeShowfileProgress = false;
            ctrl.disableResumeUploadButton = false;
        };
        ctrl.profileFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableProfileUploadButton = false;
            ctrl.employee.profileImage = null;
            ctrl.profileFileObj.errorMsg = "File cannot be uploaded";
        };
        ctrl.resumeFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableResumeUploadButton = false;
            ctrl.employee.resume = null;
            ctrl.resumeFileObj.errorMsg = "File cannot be uploaded";
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
        ctrl.resumeFileAdded = function (file, flow) {
            ctrl.formDirty = true;
            ctrl.employee.resume = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.resumeFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableResumeUploadButton = true;
            ctrl.resumeShowfileProgress = true;
            ctrl.resumeFileObj.errorMsg = null;
            ctrl.resumeFileObj.flow = flow;
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

        function googleMapFunctions(latitude, longitude) {
            loadGoogleMaps(3).done(function ()
            {
                var map;
                var autocomplete;
                var geocoder = new google.maps.Geocoder();
                var newyork;
                if (latitude && latitude !== null && longitude && longitude !== null) {
                    newyork = new google.maps.LatLng(latitude, longitude);
                    $('#GPSLocation').val(newyork);
                } else {
                    newyork = new google.maps.LatLng(40.7127837, -74.00594);
                }
                var marker;
// Add a marker to the map and push to the array.
                function addMarker(location) {
                    if (ctrl.adminLogin == true) {
                        map.setCenter(location)
                        marker.setPosition(location);
                    }
                }

                function  fillInAddress() {
                    // Get the place details from the autocomplete object.
                    var street, route, city, state, zipcode = '';
                    var place = autocomplete.getPlace();
                    for (var i = 0; i < place.address_components.length; i++) {
                        var addressType = place.address_components[i].types;
                        if (addressType.includes('street_number')) {
                            street = place.address_components[i]['long_name'];
                        } else if (addressType.includes('route')) {
                            route = place.address_components[i]['long_name'];
                        } else if (addressType.includes('locality')) {
                            city = place.address_components[i]['long_name'];
                        } else if (addressType.includes('sublocality_level_1')) {
                            city = place.address_components[i]['long_name'];
                        } else if (addressType.includes('administrative_area_level_1')) {
                            state = place.address_components[i]['short_name'];
                        } else if (addressType.includes('postal_code')) {
                            zipcode = place.address_components[i]['long_name'];
                        }
                    }
                    ctrl.employee.address1 = (street != null) ? street + ' ' + route : route;
                    ctrl.employee.address2 = null;
                    ctrl.employee.city = city;
                    ctrl.employee.state = state;
                    ctrl.employee.zipcode = zipcode;

                    var address = $('#autocomplete').val().trim();
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
                                addMarker(results[0].geometry.location);
                            } else {
                                alert('Geocode was not successful for the following reason: ' + status);
                            }
                        });
                    }
                }
                function initializeMap()
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
                        ctrl.employee.locationLatitude = event.latLng.lat();
                        ctrl.employee.locationLongitude = event.latLng.lng();
                    });

                    form_data = $('#add_patient_form').serialize();
                }

                function initializeAutoComplete() {
                    autocomplete = new google.maps.places.Autocomplete(
                            document.getElementById('autocomplete'), {types: ['geocode'], componentRestrictions: {
                            'country': 'usa'
                        }});

                    // Avoid paying for data that you don't need by restricting the set of
                    // place fields that are returned to just the address components.
                    autocomplete.setFields(['address_component']);

                    // When the user selects an address from the drop-down, populate the
                    // address fields in the form.
                    autocomplete.addListener('place_changed', fillInAddress);
                }

                if (ctrl.adminLogin == true) {
                    initializeMap();
                }
                initializeAutoComplete();
            });
        }
    }
    angular.module('xenon.controllers').controller('AddApplicationSinglePageCtrl', ["$scope", "CareTypeDAO", "$stateParams", "$state", "$modal", "$filter", "EmployeeDAO", "ApplicationPublicDAO", "$timeout", "$formService", "$rootScope", "Page", "PositionDAO", "EventTypeDAO", "PatientDAO", "moment", AddApplicationSinglePageCtrl]);
})();
