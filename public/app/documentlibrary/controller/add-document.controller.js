(function () {
    function AddDocumentController(document, $rootScope, $modalInstance, DocumentDao) {
        var ctrl = this;
//        console.log("employee.hireDate",employee.hireDate)
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.formSubmitted = false;
        var documentCopy = angular.copy(document);
        var daoFunction;

        if (documentCopy == undefined) {
            ctrl.title = 'Add New Document';
            ctrl.document = {'type': 'Application'};
            daoFunction = DocumentDao.save;
        } else {
            ctrl.title = 'Edit Document';
            ctrl.document = documentCopy;
            daoFunction = DocumentDao.update;
        }

        ctrl.closePopup = function () {
            $modalInstance.close();
        }

        ctrl.save = function () {
            ctrl.formSubmitted = true;
            if ($('#documentForm').valid() && ctrl.document.filePath) {
                //position.positionGroup = position.positionGroup.join(',');
                daoFunction(ctrl.document).then(function (res) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
                    toastr.success("Company Document saved.");
                    $modalInstance.close(true);
                    //Reset dirty status of form
                    if ($.fn.dirtyForms) {
                        $('form').dirtyForms('setClean');
                        $('.dirty').removeClass('dirty');
                    }
                }).catch(function (data, status) {
                    toastr.error(data.data);
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {

                        }
                    }); // showLoadingBar
                    console.log('Error in retrieving data')
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }

        // add patient plan of care
        ctrl.documentFileObj = {};
        ctrl.documentUploadFile = {
            target: ontime_data.weburl + 'file/upload',
            chunkSize: 1024 * 1024 * 1024,
            testChunks: false,
            fileParameterName: "fileUpload",
            singleFile: true,
            headers: {
                type: 'aed',
                fileNamePrefix: 'company-document',
                company_code: ontime_data.company_code
            }
        };
        ctrl.documentFileAdded = function (file, flow) {
            ctrl.formDirty = true;
            ctrl.document.filePath = null;
            if ($rootScope.validFileTypes.indexOf(file.getExtension()) < 0) {
                ctrl.documentFileObj.errorMsg = "Please upload a valid file.";
                return false;
            }
            ctrl.disableSaveButton = true;
            ctrl.disableDocumentUploadButton = true;
            ctrl.documentShowfileProgress = true;
            ctrl.documentFileObj.errorMsg = null;
            ctrl.documentFileObj.flow = flow;
            return true;
        };
        ctrl.documentFileUploaded = function (response, file, flow) {
            if (response != null) {
                response = JSON.parse(response);
                if (response.fileName != null && response.status != null && response.status == 's') {
                    ctrl.document.filePath = response.fileName;
                }
            }
            ctrl.disableSaveButton = false;
            ctrl.documentShowfileProgress = false;
            ctrl.disableDocumentUploadButton = false;
        };
        ctrl.documentFileSelected = function (file, flow) {
            ctrl.documentFileObj.flowObj = flow;
            ctrl.documentFileObj.flowObj.upload();
        };
        ctrl.documentFileError = function ($file, $message, $flow) {
            $flow.cancel();
            ctrl.disableSaveButton = false;
            ctrl.disableDocumentUploadButton = false;
            ctrl.document.filePath = null;
            ctrl.documentFileObj.errorMsg = "File cannot be uploaded";
        };
        ctrl.clearDocument = function () {
            if (ctrl.document != null && ctrl.document.filePath != null) {
                ctrl.document.filePath = null;
            }
            if (ctrl.documentFileObj.flowObj != null) {
                ctrl.documentFileObj.flowObj.cancel();
            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('AddDocumentController', ["document", "$rootScope", "$modalInstance", "DocumentDao", AddDocumentController]);
})();