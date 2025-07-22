/* global _, ontime_data */

(function () {
    function ApplicationApproveCtrl($rootScope, application, $modalInstance, $formService, ApplicationDAO, EmployeeDAO, PositionDAO, $filter) {
        var ctrl = this;
        ctrl.position = "";
        PositionDAO.retrieveAll({}).then(function (res) {
            for (var i = 0; i < res.length; i++) {
                if (res[i].id === application.positionId) {
                    ctrl.position = res[i].position;
                    break;
                }
            }
        });
        ctrl.email = application.email;
        ctrl.ssn = {'exists': false};
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.applicationAdditionalDetail = {"orientationPacketExtraFields":"",
            "hireDate": $filter('date')(new Date(), $rootScope.dateFormat)
        };

        ctrl.close = function () {
            $modalInstance.close();
        };
        
        ctrl.orientationFileObj = {};

        ctrl.orientationFileUpload = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: 'aed',
                fileNamePrefix: 'OrientationPacket',
                company_code: ontime_data.company_code
            }
        };

        ctrl.orientationFileSelected = function (file, flow) {
            ctrl.orientationFileObj.flowObj = flow;
            ctrl.orientationFileObj.flowObj.upload();
        };

        ctrl.orientationFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.applicationAdditionalDetail.orientationPacketFilePath = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.showfileProgress = false;
            ctrl.disableFileUploadButton = false;
        };
        
        ctrl.orientationFileAdded = function (file, flow) {
            ctrl.formDirty = true;
            ctrl.applicationAdditionalDetail.orientationPacketFilePath = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.orientationFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableFileUploadButton = true;
            ctrl.showfileProgress = true;
            ctrl.orientationFileObj.errorMsg = null;
            ctrl.orientationFileObj.flow = flow;
            return true;
        };
        
        ctrl.orientationFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableFileUploadButton = false;
            ctrl.applicationAdditionalDetail.orientationPacketFilePath = null;
            ctrl.orientationFileObj.errorMsg = "File cannot be uploaded";
        };

        ctrl.approveApplication = function () {
            ctrl.ssn.exists = false;
            if ($('#approve_employee_popup')[0].checkValidity()) {
                $rootScope.maskLoading();
                EmployeeDAO.checkIfSsnExists({ssn: application.ssn})
                        .then(function (res) {
                            if (res.data) {
                                toastr.error('Employee with same SSN exists, please validate application');
                                $rootScope.unmaskLoading();
                            } else {
                                ctrl.applicationAdditionalDetail.orientationPacketExtraFields = '{"orientationDate":"'+ctrl.applicationAdditionalDetail.hireDate+'"}';
                                ctrl.ssn.exists = false;
                                ApplicationDAO.approveApplication({'applicationId': application.applicationId, 'additionalDetails': ctrl.applicationAdditionalDetail})
                                        .then(function (res) {
                                            $modalInstance.close();
                                            toastr.success('Application is approved and employee record is created');
                                        })
                                        .catch(function (res) {
                                            toastr.error('Something went wrong');
                                        }).then(function () {
                                    $rootScope.unmaskLoading();
                                });
                            }
                        })
                        .catch(function () {
                            $rootScope.unmaskLoading();
                        });


            } else {
                ctrl.ssn.exists = false;
            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('ApplicationApproveCtrl', ["$rootScope", "application", "$modalInstance", "$formService", "ApplicationDAO", "EmployeeDAO", "PositionDAO", "$filter", ApplicationApproveCtrl]);
})();