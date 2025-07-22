/* global _ */

(function () {
    function AddUserCtrl($scope, $state, $modal, $filter, EmployeeDAO, $timeout, $formService, $rootScope, Page, PositionDAO, UserDAO, RoleDAO) {
        var ctrl = this;
        ctrl.staticPosition;
        ctrl.retrivalRunning = true;
        ctrl.currentDate = new Date();
        ctrl.maxBirthDate = new Date().setYear((ctrl.currentDate.getYear() + 1900) - 10);
        ctrl.user = {};
        ctrl.profileImage = "";
        ctrl.user.employee = {employeeAttachments: []};
        ctrl.unauthorisedRoleIds = [];
        ctrl.refreshLanguages = function () {
            $timeout(function () {
                $('#languageOtherText').tagsinput("add", ctrl.user.employee.otherLanguages);
            });
        };
        ctrl.getAllRoles = function (callback) {
            RoleDAO.retrieveAll({}).then(function (res) {
                ctrl.roleList = res;
                callback();
            });
        };
        ctrl.bindToExistingChange = function () {
            var email = ctrl.user.employee.email;
            if (ctrl.user.bindToExisting == 'e') {
                ctrl.user.employee = null;
            } else {
                ctrl.user.employee = {email: email};
                if (!ctrl.user.employee.gender) {
                    ctrl.user.employee.gender = 'M';
                }
                if (ctrl.positionList && ctrl.positionList.length > 0) {
                    if (!ctrl.user.employee.companyPositionId || ctrl.user.employee.companyPositionId === null) {
                        ctrl.user.employee.companyPositionId = ctrl.positionList[0].id;
                    }
                }
            }
            $formService.resetRadios();
        };
        $scope.$watch(function () {
            return ctrl.user.bindToExisting;
        }, function (value) {
            $formService.resetRadios();
        });
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.nextTab;
        ctrl.languagesKeyValue = [{key: "English"}, {key: "Creole"}, {key: "Spanish"}, {key: "Russian"}, {key: "French"}, {key: "Hindi"}, {key: "Bengali"}, {key: "Mandarin"}, {key: "Korean"}, {key: "Arabic"}, {key: "Farsi"}, {key: "Urdu"}];
        ctrl.setFromNext = function (tab) {
            ctrl.nextTab = tab;
        }
        ctrl.positionList = [];
        PositionDAO.retrieveAll({}).then(function (res) {
            ctrl.positionList = res;
            if (ctrl.positionList && ctrl.positionList.length > 0) {
                for (var i = 0; i < ctrl.positionList.length; i++) {
                    if (ctrl.positionList[i].position === "Personal Care") {
                        ctrl.staticPosition = ctrl.positionList[i].id;
                        break;
                    }
                }
            }
            $formService.resetRadios();
        });
        ctrl.applicationFileObj = {};
        ctrl.w4FileObj = {};
        ctrl.ssn = {};
        ctrl.referencesFileObj = {};
        ctrl.profileFileObj = {};
        ctrl.resetEmployeeTab1 = function () {
            ctrl.profileFileObj.errorMsg = null;
            if (ctrl.user.employee.profileImage !== null) {
                ctrl.user.employee.profileImage = null;
            }
            if (ctrl.profileFileObj.flowObj && ctrl.profileFileObj.flowObj !== null) {
                ctrl.profileFileObj.flowObj.cancel();
            }
            $("#sboxit-2").select2("val", "");
            $scope.resetForm = true;
            ctrl.bindToExistingChange();
        };
        ctrl.clearRefereces = function () {
            if (ctrl.user.employee != null && ctrl.user.employee.references != null) {
                ctrl.user.employee.references = null;
            }
            if (ctrl.referencesFileObj.flowObj != null) {
                ctrl.referencesFileObj.flowObj.cancel();
            }
        };
        ctrl.clearProfileImage = function () {
            if (ctrl.user.employee.profileImage != null) {
                ctrl.user.employee.profileImage = null;
            }
            if (ctrl.profileFileObj.flowObj != null) {
                ctrl.profileFileObj.flowObj.cancel();
            }
        }

        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id)) || $rootScope.currentUser.allowedFeature.indexOf('EDIT_USER') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            ctrl.editMode = true;
            Page.setTitle("Update User");
        } else {
            if($rootScope.currentUser.allowedFeature.indexOf('CREATE_USER') === -1){
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Add User");
        }


        ctrl.saveEmployee = saveEmployeeData;
        ctrl.pageInitCall = pageInit;
        var form_data;

        //Check if ssn number is already present.
        $scope.checkSsnNumber = function () {
            if (ctrl.user.employee.ssn && ctrl.user.employee.ssn.trim().length > 0) {
                EmployeeDAO.checkIfSsnExists({Id: ctrl.user.employee.id, ssn: ctrl.user.employee.ssn})
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
        ctrl.changeEmp = function (emp) {
            ctrl.user.employee = ctrl.empIdObjMap[emp];
        };
        //function to save the employee data
        function saveEmployeeData() {
            $scope.resetForm = false;
            ctrl.formSubmitted = true;
            var employeeToSave = angular.copy(ctrl.user.employee);
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
            delete employeeToSave.careRatesList;
            delete employeeToSave.employeeCareRatesList;
            if ($('#add_employee_form')[0].checkValidity()) {
                //Check if ssn number is already present
                EmployeeDAO.checkIfSsnExists({Id: ctrl.user.employee.id, ssn: ctrl.user.employee.ssn})
                        .then(function (res) {
                            if (res.data) {
                                ctrl.ssn.exists = true;
                                $('#SocialSecurity').focus();
                            } else {
                                ctrl.ssn.exists = false;
                                var reqParam;
                                if (ctrl.user.id && ctrl.user.id !== null) {
                                    reqParam = 'updateuser';
                                    updateUser(reqParam, employeeToSave);
                                } else {
                                    employeeToSave.orgCode = ontime_data.company_code;
                                    ctrl.user.employee.orgCode = ontime_data.company_code;
                                    reqParam = 'saveuser';
                                    updateUser(reqParam, employeeToSave);
                                }
                            }
                        })
                        .catch(function () {
                        });
            }

        }

        function updateUser(reqParam, employeeToSave) {
            $rootScope.maskLoading();
            if (!ctrl.user.employee.id || ctrl.user.employee.id === null) {
                if (ctrl.staticPosition && ctrl.user.employee.companyPositionId === ctrl.staticPosition) {
                    employeeToSave.wages = 'H';
                    employeeToSave.taxStatus = 'W';
                    employeeToSave.otRate = 13.12;
                    employeeToSave.hdRate = 13.12;
                }
            }
            var userToSave = angular.copy(ctrl.user);
            userToSave.employee = employeeToSave;
            userToSave.orgCode = ontime_data.company_code;
            delete userToSave.bindToExisting;
            if (ctrl.user.bindToExisting == 'w') {
                userToSave.withoutEmployee = 'y';
            }
            userToSave.roleIds = _.uniq(_.concat(ctrl.unauthorisedRoleIds, userToSave.roleIds));
            UserDAO.update({action: reqParam, data: userToSave})
                    .then(function (employeeRes) {
                        toastr.success("User saved.");
                        $state.go('admin.user-list', {status: 'active'});
                        //Reset dirty status of form
                        if ($.fn.dirtyForms) {
                            $('form').dirtyForms('setClean');
                            $('.dirty').removeClass('dirty');
                        }
                    })
                    .catch(function (error) {
                        if (error.data != null) {
                            toastr.error(error.data);
                        } else {
                            toastr.error("User cannot be saved.");
                        }
                    }).then(function () {
                ctrl.formSubmitted = false;
                $rootScope.unmaskLoading();
            });
        }
        //function called on page initialization.
        function pageInit() {

            ctrl.getAllRoles(function () {
                if (ctrl.editMode) {
//                $rootScope.maskLoading();
                    UserDAO.get({id: $state.params.id}).then(function (res) {
                        retrieveEmployeesData();
                        showLoadingBar({
                            delay: .5,
                            pct: 100,
                            finish: function () {
                            }
                        }); // showLoadingBar

                        $timeout(function () {
                            $('#RoleIds').trigger('change.select2');
                        }, 100);
                        ctrl.user = res;
                        if (ctrl.user && ctrl.user.roleIds && ctrl.roleList)
                            ctrl.unauthorisedRoleIds = _.difference(ctrl.user.roleIds, _.map(ctrl.roleList,'id'));
                        if (ctrl.user.employee.profileImage != null && ctrl.user.employee.profileImage != '') {
                            ctrl.hideLoadingImage = false;
                            UserDAO.downloadProfilePic({fileName: ctrl.user.employee.profileImage, fileType: 'c'}).then(function (res) {
                                ctrl.profileImage = res.signedUrl;
                            }).catch(function () {});
                        } else {
                            ctrl.hideLoadingImage = true;
                        }
                        $timeout(function () {
                            $("#sboxit-2").select2("val", ctrl.user.employee.id);
                        });
                        if (ctrl.user.employee.languageSpoken != null) {
                            var languages = ctrl.user.employee.languageSpoken;
                            angular.forEach(ctrl.languagesKeyValue, function (obj) {
                                if (languages.indexOf(obj.key) >= 0) {
                                    obj.value = true;
                                }
                            });
                        }
                        if (ctrl.user.employee.otherLanguages != null && ctrl.user.employee.otherLanguages != '') {
                            ctrl.otherLanguageCheckbox = true;
                            ctrl.refreshLanguages();
                        }
                        ctrl.retrivalRunning = false;
                    }).catch(function (data, status) {
                        toastr.error("Failed to retrieve user.");
                        ctrl.retrivalRunning = false;
                        console.log(JSON.stringify(ctrl.user.employee))
                    }).then(function () {
                        setTimeout(function () {
                            //Reset dirty status of form
                            if ($.fn.dirtyForms) {
                                $('form').dirtyForms('setClean');
                                $('.dirty').removeClass('dirty');
                            }
                        }, 100);
                    });
                } else {
                    retrieveEmployeesData();
                    ctrl.retrivalRunning = false;
                    ctrl.hideLoadingImage = true;
                }
            });
        }
        ;

        ctrl.tab1DataInit = function () {
            ctrl.formDirty = false;
            $("#add_employee_form input:text, #add_employee_form textarea #add_employee_form select").first().focus();
            //to set edit mode in tab change
            if (!$state.params.id || $state.params.id === '') {
                ctrl.editMode = false;
                ctrl.user.employee = {};
            } else {

                ctrl.editMode = true;
            }
            //to set radio buttons on tab init..
            $timeout(function () {
                if (!ctrl.retrivalRunning) {


                    if (!ctrl.editMode && ctrl.user.bindToExisting == null) {
                        ctrl.user.bindToExisting = "e";
                    }

//                    $formService.setRadioValues('Position', ctrl.user.employee.position);
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
        //When file is selected from browser file picker
        ctrl.profileFileSelected = function (file, flow) {
            ctrl.profileFileObj.flowObj = flow;

        };
        //When file is uploaded this method will be called.
        ctrl.profileFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.user.employee.profileImage = response.fileName;
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
            ctrl.user.employee.profileImage = null;
            ctrl.profileFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.profileFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.profileUploadFile.headers.fileExt = file.getExtension();
            ctrl.user.employee.profileImage = null;
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

        ctrl.deleteAttachment = function (i) {
            ctrl.user.employee.employeeAttachments = $filter('orderBy')(ctrl.user.employee.employeeAttachments, '-expiryDate');
            ctrl.user.employee.employeeAttachments.splice(i, 1);
        };
        function retrieveEmployeesData() {
            if (ctrl.editMode) {
                $rootScope.maskLoading();
            }
            EmployeeDAO.getEmployeeExceptUser().then(function (res) {
                ctrl.employeeList = res;
                if (ctrl.user.employee != null) {
                    ctrl.employeeList = ctrl.employeeList.concat(ctrl.user.employee);
                }
                ctrl.empIdObjMap = {};
                angular.forEach(res, function (obj) {
                    ctrl.empIdObjMap[obj.id] = obj;
                });
                $timeout(function () {
                    if (ctrl.user.employee.id != null) {
                        $("#sboxit-2").select2("val", ctrl.user.employee.id);
                    }
                }, 500);
                $rootScope.unmaskLoading();
            }).catch(function (data, status) {
                $rootScope.unmaskLoading();
            });
        }
        ;

    }
    ;
    angular.module('xenon.controllers').controller('AddUserCtrl', ["$scope", "$state", "$modal", "$filter", "EmployeeDAO", "$timeout", "$formService", "$rootScope", "Page", "PositionDAO", "UserDAO", "RoleDAO", AddUserCtrl]);
})();
