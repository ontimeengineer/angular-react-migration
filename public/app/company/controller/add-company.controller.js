(function () {
    function AddCompanyCtrl($modal, $timeout, Page, $rootScope, CompanyDAO, ApplicationDAO, $formService) {
        var ctrl = this;
        ctrl.companyObj = {};
        ctrl.months = [
            {'id': 1, 'label': 'JAN'},
            {'id': 2, 'label': 'FEB'},
            {'id': 3, 'label': 'MAR'},
            {'id': 4, 'label': 'APR'},
            {'id': 5, 'label': 'MAY'},
            {'id': 6, 'label': 'JUN'},
            {'id': 7, 'label': 'JUL'},
            {'id': 8, 'label': 'AUG'},
            {'id': 9, 'label': 'SEP'},
            {'id': 10, 'label': 'OCT'},
            {'id': 11, 'label': 'NOV'},
            {'id': 12, 'label': 'DEC'}
        ]
        ctrl.profileFileObj = {};
        ctrl.saveCompany = saveCompanyData;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.bucketKey = 'c';
        ctrl.openCopyJobLinkModal = openCopyJobLinkModal;
        ctrl.openCopyJobLinkModalFun = openCopyJobLinkModalFun;
        ctrl.jobLink ="";
        Page.setTitle("Company Information");
        ctrl.initForm = function () {
            $("#company_information_form input:text, #company_information_form textarea").first().focus();
        };
        ctrl.retrieveCompany = function () {
            $rootScope.maskLoading();
            CompanyDAO.retrieveByCompanyCode({companyCode: ontime_data.company_code}).then(function (res) {
                ctrl.companyObj = res;
                if (ctrl.companyObj != null) {

                    if (ctrl.companyObj.federalIdType != null) {
                        $formService.setRadioValues('FederalTaxID', ctrl.companyObj.federalIdType);
                    }
                    ctrl.changeDays('expiration', res.ptoExpirationMonth, res.ptoExpirationDay);
                    ctrl.changeDays('utilization', res.ptoUtilizationMonth, res.ptoUtilizationDay);
                    ctrl.changeDays('apply', res.ptoApplyMonth, res.ptoApplyDay);
                }

            }).catch(function () {
                toastr.error("Failed to retrieve Company Information.");
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        };

        var days29 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            21, 22, 23, 24, 25, 26, 27, 28, 29];

        var days30 = days29.concat([30]);

        var days31 = days30.concat([31]);

        ctrl.changeDays = function (fieldDesc, month, dayOfMonth) {

            if (month) {
                if ([1, 3, 5, 7, 8, 10, 12].indexOf(month) > -1) {
                    if (fieldDesc === 'expiration') {
                        ctrl.expirationDays = days31;
                    } else if (fieldDesc === 'utilization') {
                        ctrl.utilizationDays = days31;
                    } else if (fieldDesc === 'apply') {
                        ctrl.applyDays = days31;
                    }
                } else {
                    if (fieldDesc === 'expiration') {
                        ctrl.expirationDays = (month == 2) ? days29 : days30;
                        if (dayOfMonth == 31 || (month == 2 && dayOfMonth == 30))
                            ctrl.companyObj.ptoExpirationDay = null;
                    } else if (fieldDesc === 'utilization') {
                        ctrl.utilizationDays = (month == 2) ? days29 : days30;
                        if (dayOfMonth == 31 || (month == 2 && dayOfMonth == 30))
                            ctrl.companyObj.ptoUtilizationDay = null;
                    } else if (fieldDesc === 'apply') {
                        ctrl.applyDays = (month == 2) ? days29 : days30;
                        if (dayOfMonth == 31 || (month == 2 && dayOfMonth == 30))
                            ctrl.companyObj.ptoApplyDay = null;
                    }
                }
            } else {
                if (fieldDesc === 'expiration') {
                    ctrl.expirationDays = [];
                    ctrl.companyObj.ptoExpirationDay = null;
                } else if (fieldDesc === 'utilization') {
                    ctrl.utilizationDays = [];
                    ctrl.companyObj.ptoUtilizationDay = null;
                } else if (fieldDesc === 'apply') {
                    ctrl.applyDays = [];
                    ctrl.companyObj.ptoApplyDay = null;
                }
            }
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
                    ctrl.companyObj.logoPath = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableUploadButton = false;
            ctrl.hideLoadingImage = false;
        };
        ctrl.profileFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableUploadButton = false;
            ctrl.companyObj.logoPath = null;
            ctrl.profileFileObj.errorMsg = "File cannot be uploaded";
        };
        //When file is added in file upload
        ctrl.profileFileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.profileUploadFile.headers.fileExt = file.getExtension();
            ctrl.companyObj.logoPath = null;
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
        ctrl.clearProfileImage = function () {
            if (ctrl.companyObj.logoPath != null) {
                ctrl.companyObj.logoPath = null;
            }
            if (ctrl.profileFileObj.flowObj != null) {
                ctrl.profileFileObj.flowObj.cancel();
            }
        }

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
            ctrl.disableUploadButton = true;
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

        function saveCompanyData() {
            if ($('#company_information_form')[0].checkValidity()) {
                var companyObjToSave = angular.copy(ctrl.companyObj);
                console.log('Company Object : ' + JSON.stringify(companyObjToSave));
                $rootScope.maskLoading();
                CompanyDAO.save(companyObjToSave).then(function () {
                    toastr.success("Company Information saved.");
                    ctrl.retrieveCompany();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }
        ;
        ctrl.retrieveCompany();

        function openCopyJobLinkModal(event) {            
            $rootScope.eventModel = $modal.open({
                templateUrl: 'eventModel',
                size: "md",
                backdrop: true,
                keyboard: false
            });
            $rootScope.eventModel.event = angular.copy({jobLink : event});

            $rootScope.eventModel.closePopup = function () {
                $rootScope.eventModel.close();
            };

            $rootScope.eventModel.getJobPostLink = function () {
                           // Get the text field
                            var copyText = document.getElementById("jobAppLink");
                            // Select the text field
                            copyText.select();
                            copyText.setSelectionRange(0, 99999); // For mobile devices
                            // Copy the text inside the text field
                            navigator.clipboard.writeText(copyText.value);
                            // toast the copied text
                            toastr.success("Link Copied.");
                            $rootScope.eventModel.closePopup();
            };
            setTimeout(function () {
                cbr_replace();
            }, 100);
        }

        function openCopyJobLinkModalFun(event) {
            event.preventDefault(); 
            $rootScope.maskLoading();
            ApplicationDAO.retrieveJobApplicationLink().then(function (res) {
                showLoadingBar({ delay: .5, pct: 100 }); 
                const characterArray = Object.values(res).filter(value => typeof value === 'string');
                var appPath = window.location.origin;
                ctrl.jobLink = angular.copy(appPath + '/#/' + characterArray.join(''));
            }).catch(function (error) {
                
                if(error.data && error.status === 400) {
                    ctrl.openCopyJobLinkModal("");
                    ctrl.jobError = error.data;
                } else {
                    toastr.error("Failed to retrieve events.");
                }
                showLoadingBar({ delay: .5, pct: 100 }); 
                $rootScope.unmaskLoading();
            }).then(function () {
                if(ctrl.jobLink) {
                    ctrl.openCopyJobLinkModal(ctrl.jobLink);
                }
                $rootScope.unmaskLoading();
            });
        }
        
        
    }
    ;
    angular.module('xenon.controllers').controller('AddCompanyCtrl', ["$modal", "$timeout", "Page", "$rootScope", "CompanyDAO", "ApplicationDAO", "$formService", AddCompanyCtrl]);
})();