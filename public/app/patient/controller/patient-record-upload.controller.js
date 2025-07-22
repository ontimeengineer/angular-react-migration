(function () {
  function PatientRecUploadCtrl(
    $rootScope,
    PatientRecordDAO,
    $state,
    $stateParams,
    $filter,
    $timeout,
    $scope,
    Page,
    AutoSaveService,
    UtilService
  ) {
    'use strict';
    var ctrl = this;
    Page.setTitle("Patient Record - Upload Record");
    ctrl.patientName;
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType
    ctrl.recordId = $stateParams.id
    ctrl.recordNameError = false;
    ctrl.companyCode = ontime_data.company_code;
    ctrl.baseUrl = ontime_data.weburl;
    ctrl.pdfRecordForm = {}
    ctrl.recordFileObj = {};

    ctrl.generateFormCall = generateForms;
    ctrl.pageInitCall = pageInit;
    ctrl.checkValidation = checkValidation;

    ctrl.changesDetectedForAutoSave = false;

    /*================   FUNCTION CALLS   ===================*/
    $rootScope.maskLoading();

    Promise.all([ctrl.pageInitCall(),])
      .then(ctrl.generateFormCall)
      .catch(function (error) {
        console.error("Error:", error);
      })
      .finally(function () {
        $rootScope.unmaskLoading();
      });


    /*================   FORM FUNCTIONS   ===================*/

    // Function for page initialization
    function pageInit() {
      return PatientRecordDAO.getById(ctrl.patientId, ctrl.recordId)
        .then(function (res) {
          ctrl.record = res;
          ctrl.patient = res.patient;
          ctrl.recordName = res.recordName;
          ctrl.patientName = res.patient.fName;
          delete ctrl.record["$promise"];
          delete ctrl.record["$resolved"];

          try {
            if (typeof ctrl.record.responses !== 'undefined' && typeof ctrl.record.responses === 'string') {
              ctrl.record.responses = JSON.parse(ctrl.record.responses);
              ctrl.recordformFillData = angular.copy(ctrl.record.responses);
            } else {
              console.error('Invalid JSON data or undefined or new record created.');
            }

            if (ctrl.recordformFillData.isDraft == null || ctrl.recordformFillData.isDraft == undefined) {
              ctrl.pdfRecordForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.pdfRecordForm.isDraft = ctrl.recordformFillData.isDraft;
              if (ctrl.pdfRecordForm.isDraft == false) {
                AutoSaveService.stop();
              } else {
                AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
              }
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            ctrl.record.responses = {};
          }
        })
        .catch(function (data, status) {
          showLoadingBar({
            delay: 0.5,
            pct: 100,
            finish: function () { },
          });
          toastr.error("Failed to retrieve pdf record");
          throw data;
        })
        .then(function () {
        });
    }

    function generateForms() {
      $rootScope.isFormDirty = false;
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;
        ctrl.pdfRecordForm = {
          fileName: res?.fileName,
          fileSize: res?.fileSize,
          file: res?.file,
          isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false
        }

        setupWatch();
        setTimeout(function () {
          if ($.fn.dirtyForms) {
            $('form').dirtyForms('setClean');
            $('.dirty').removeClass('dirty');
          }
        }, 100);
      } else {
        ctrl.pdfRecordForm = {

        };

        setupWatch();
      }
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      if (!ctrl.pdfRecordForm.file || !ctrl.recordName) {
        ctrl.recordNameError = ctrl.recordName == undefined;
        if (!ctrl.pdfRecordForm.file) {
          ctrl.recordFileObj.errorMsg = 'Please select a file'
        }
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {

      var pdfRecordFormToSave = angular.copy(ctrl.pdfRecordForm);

      pdfRecordFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;

      var pdfRecordFormToSaveWithRecord = angular.copy(ctrl.record);
      pdfRecordFormToSaveWithRecord.recordName = ctrl.recordName;
      pdfRecordFormToSaveWithRecord.responses = JSON.stringify(pdfRecordFormToSave);

      if (pdfRecordFormToSave.isDraft === false) {
        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(pdfRecordFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Patient Record updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Patient Record.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        // autosave on draft
        PatientRecordDAO.update(pdfRecordFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }
    }

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    }

    
    ctrl.patientRecordUpload = {
      target: ontime_data.weburl + 'file/upload',
      chunkSize: 1024 * 1024 * 1024,
      testChunks: false,
      fileParameterName: "fileUpload",
      singleFile: true,
      headers: {
        type: "p",
        fileNamePrefix: 'patient-record',
        company_code: ontime_data.company_code
      }
    };
    //When file is added in file upload
    ctrl.fileAdded = function (file, flow) { //It will allow all types of attahcments'
      ctrl.formDirty = true;
      ctrl.patientRecordUpload.headers.fileExt = file.getExtension();
      ctrl.pdfRecordForm.file = null;
      if (file.getExtension() != 'pdf') {
        ctrl.recordFileObj.errorMsg = "Please upload a valid file.";
        return false;
      }
      AutoSaveService.stop();
      ctrl.disableSaveButton = true;
      ctrl.disableUploadFileButton = true;
      ctrl.showfileProgress = true;
      ctrl.recordFileObj.errorMsg = null;
      ctrl.recordFileObj.flow = flow;
      return true;
    };
    //When file is uploaded this method will be called.
    ctrl.fileUploaded = function (response, file, flow) {
      if (response != null) {
        response = JSON.parse(response);
        if (response.fileName != null && response.status != null && response.status == 's') {
          ctrl.pdfRecordForm.file = response.fileName;
          ctrl.pdfRecordForm.type = 'p';
          ctrl.pdfRecordForm.fileNamePrefix = 'patient-record';
        }
      }
      AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
      ctrl.disableSaveButton = false;
      ctrl.disableUploadFileButton = false;
      ctrl.hideLoadingImage = false;
    };
    //When file is selected from browser file picker
    ctrl.fileSelected = function (file, flow) {
      ctrl.recordFileObj.flowObj = flow;
      ctrl.recordFileObj.selectedFile = file;
      ctrl.recordFileObj.flowObj.upload();
    };
    ctrl.fileError = function ($file, $message, $flow) {
      $flow.cancel();
      AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
      ctrl.disableSaveButton = false;
      ctrl.disableUploadFileButton = false;
      ctrl.pdfRecordForm.file = null;
      ctrl.recordFileObj.errorMsg = "File cannot be uploaded";
    };

    ctrl.clearRecordFile = function () {
      if (ctrl.pdfRecordForm.file != null) {
        ctrl.pdfRecordForm.file = null;
      }
      if (ctrl.profileFileObj.flowObj != null) {
        ctrl.profileFileObj.flowObj.cancel();
      }
    }

    function checkValidation() {
      ctrl.recordNameError = ctrl.recordName === undefined;
    }

    function setupWatch() {
      $scope.$watch(
        function () {
          return {
            pdfRecordForm: ctrl.pdfRecordForm,
            recordName: ctrl.recordName
          }
        },
        function (newVal, oldVal) {
          if (newVal !== oldVal) {
            $rootScope.isFormDirty = true;
            //for auto save in draft if any changes detected
            ctrl.changesDetectedForAutoSave = true;
            AutoSaveService.setDirty(true);
          } else {
            ctrl.changesDetectedForAutoSave = false;
            AutoSaveService.setDirty(false);
          }
        },
        true
      );
    }

  }; 
  angular.module('xenon.controllers').controller('PatientRecUploadCtrl', [
    "$rootScope",
    "PatientRecordDAO",
    "$state",
    "$stateParams",
    "$filter",
    "$timeout",
    "$scope",
    "Page",
    "AutoSaveService",
    "UtilService",
    PatientRecUploadCtrl
  ]);
})();
