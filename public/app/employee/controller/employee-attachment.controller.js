/* global _, ontime_data */

(function () {
    function EmployeeAttachmentCtrl(attachmentInfo, employee, filename, $rootScope, $modalInstance, EmployeeDAO) {
        var ctrl = this;
//        console.log("employee.hireDate",employee.hireDate)
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;

        $rootScope.maskLoading();

        if (attachmentInfo && attachmentInfo.type === 'med') {            
            ctrl.subTypes = ['Pre – Employment Medical Documents', 'Physical', 'TB Testing', 'Chest X-Ray', 'TB Questionnaire',
                'Habituation', 'Flu Shot', 'Drug Test', 'Covid Vaccine'];
        } else {
            ctrl.subTypes = ['Initial Application Packet', 'Initial Application Packet Nursing', 'W-4', 'Employment Eligibility (I-9)', 'CHRC Forms', 'Evaluation', 
                'Orientation Packet', 'Competency Exam', 'Certificate/License', 'References', 'HCR', 
                'OP Search', 'License', 'Malpractice Insurance', 'Disciplinary Action', 'Exclusions', "CPR", "In-service"];
        }

        if (attachmentInfo && attachmentInfo.extraFields) {
            attachmentInfo.extraFields = JSON.parse(attachmentInfo.extraFields);
        } else {
            attachmentInfo.extraFields = {};
        }

        ctrl.Reasons = ['Medical Contraindication', 'Fear of Needles', 'Fear of Illness', 'Fear of Side Effects', 'Religious Objection', 'Other'];

        ctrl.attachment = angular.copy(attachmentInfo);

        setTimeout(function () {
            cbr_replace();
        }, 100);
        $rootScope.unmaskLoading();
        
        ctrl.warningForDrugTestDate = function () {
            if (ctrl.attachment.extraFields.drugTestDate) {
                var drugTestDate = moment(ctrl.attachment.extraFields.drugTestDate, "MM/DD/YYYY");
                var hireDate = moment(employee.hireDate ? employee.hireDate : new Date());

                return hireDate.diff(drugTestDate, 'days') > 180;
            } else {
                return false;
            }
        };
        
        ctrl.checkTBQuestionnaireRequired = function () {
            if (ctrl.attachment.extraFields.chestXRayExpiration) {
                var chestXRayExpirationDate = moment(ctrl.attachment.extraFields.chestXRayExpiration, "MM/DD/YYYY");
                var insertionDate = moment(ctrl.attachment.dateInserted ? ctrl.attachment.dateInserted : new Date());

                return chestXRayExpirationDate.diff(insertionDate, 'days') > 365;
            } else {
                return false;
            }
        };

        ctrl.remove = function (keys) {
            ctrl.attachment.extraFields = _.omit(ctrl.attachment.extraFields, keys);
            setTimeout(function () {
                cbr_replace();
            }, 100);
        };

        ctrl.save = function () {
            ctrl.submitted = true;
            if ($('#upload_popup')[0].checkValidity() && ctrl.attachment.filePath) {
                $rootScope.maskLoading();
                var attachmentToSave = angular.copy(ctrl.attachment);
                attachmentToSave.extraFields = JSON.stringify(ctrl.attachment.extraFields);

                var query;
                if (attachmentToSave.id) {
                    query = EmployeeDAO.updateAttachment(attachmentToSave);
                } else {
                    query = EmployeeDAO.addAttachment(attachmentToSave);
                }

                query.then(function (attachment) {
                    if (attachmentToSave.id) {
                        toastr.success("Document updated.");
                        $modalInstance.close(angular.copy(attachmentToSave));
                    } else {
                        toastr.success("Document added.");
                        $modalInstance.close(angular.copy(attachment));
                    }
                }).catch(function () {
                    toastr.error("Document cannot be " + attachmentToSave.id ? 'updated' : 'added');
                    $rootScope.employeeNotesModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };



        ctrl.setUploadFile = function (resetUploads) {
            ctrl.showUpload = false;
            ctrl.disableUploadButton = false;
            if (ctrl.fileObj && ctrl.fileObj.flowObj != null) {
                ctrl.fileObj.flowObj.cancel();
            }
            delete ctrl.errorMsg;
            ctrl.fileObj = {};
            ctrl.uploadFile = {
                target: ontime_data.weburl + 'file/upload',
                chunkSize: 1024 * 1024 * 1024,
                testChunks: false,
                fileParameterName: "fileUpload",
                singleFile: true,
                headers: {
                    type: ctrl.attachment.type,
                    fileNamePrefix: ctrl.attachment.attachmentType.replace(/–|-| /g, ''),
                    company_code: ontime_data.company_code
                }
            };

            setTimeout(function () {
                ctrl.showUpload = true;
            });

            if (resetUploads) {
                delete ctrl.attachment.filePath;
            }
        };

        //When file is selected from browser file picker
        ctrl.fileSelected = function (file, flow) {
            ctrl.fileObj.flowObj = flow;
            ctrl.fileObj.flowObj.upload();
        };
        //When file is uploaded this method will be called.
        ctrl.fileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.attachment.filePath = response.fileName;
                    ctrl.fileName = file.name.substring(0, file.name.lastIndexOf('.'));
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.disableUploadButton = false;
            $rootScope.unmaskLoading();
        };
        ctrl.fileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableUploadButton = false;
            ctrl.attachment.filePath = null;
            ctrl.fileObj.errorMsg = "File cannot be uploaded";
            $rootScope.unmaskLoading();
        };
        //When file is added in file upload
        ctrl.fileAdded = function (file, flow) { //It will allow all types of attahcments'
            ctrl.formDirty = true;
            ctrl.attachment.filePath = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.fileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableUploadButton = true;
            ctrl.showfileProgress = true;
            ctrl.fileObj.errorMsg = null;
            ctrl.fileObj.flow = flow;
            return true;
        };


        ctrl.close = function () {
            $modalInstance.close();
        };

        if (ctrl.attachment.id) {
            ctrl.setUploadFile(false);
            ctrl.fileName = filename;
        }
    }
    ;
    angular.module('xenon.controllers').controller('EmployeeAttachmentCtrl', ["attachmentInfo", "employee", "filename", "$rootScope", "$modalInstance", "EmployeeDAO", EmployeeAttachmentCtrl]);
})();