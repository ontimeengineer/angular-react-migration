(function () {
  function PatientConsentsCtrl(
    $rootScope,
    ConsentsDAO,
    PatientRecordDAO,
    $state,
    $stateParams,
    $timeout,
    $scope,
    Page,
    AutoSaveService,
    UtilService,
    PrintTitleService
  ) {
    "use strict";
    var ctrl = this;
    Page.setTitle("Patient Record - Patient Consents Form");
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordId = $stateParams.id

    ctrl.consentList = [];
    ctrl.consentsRetrieve = [];
    ctrl.retrieveConsents = retrieveConsentsData;
    ctrl.patientConsentsForm = {};
    ctrl.generateFormCall = generateForms;
    ctrl.clearPatientProxySignatureCall = clearPatientProxySignature;
    ctrl.clearNurseSignatureCall = clearNurseSignature;

    ctrl.pageInitCall = pageInit;

    ctrl.changesDetectedForAutoSave = false;

    /*================   FUNCTION CALLS   ===================*/
    $rootScope.maskLoading(); // Start loading

    Promise.all([ctrl.pageInitCall(), ctrl.retrieveConsents()])
      .then(ctrl.generateFormCall)
      .catch(function (error) {
        console.error("Error:", error);
      })
      .finally(function () {
        $rootScope.unmaskLoading();
      });

    /*================   FORM FUNCTIONS   ===================*/

    // Chaining the promises for function calls
    function retrieveConsentsData() {
      $rootScope.maskLoading();
      return ConsentsDAO.retrieveAllActive({ isActive: true })
        .then(function (res) {
          ctrl.consentList = res;
          delete ctrl.consentList["$promise"];
          delete ctrl.consentList["$resolved"];
          ctrl.consentsRetrieve = ctrl.consentList ? ctrl.consentList : [];
          ctrl.consentsRetrieve = angular.copy(ctrl.consentList).sort(function (a, b) {
            return a.order - b.order;
          });
        })
        .catch(function (data, status) {
          toastr.error("Failed to retrieve consents.");
          throw data;
        }).then(function () {
          $rootScope.unmaskLoading();
        })
    }

    function pageInit() {
        return PatientRecordDAO.getById(ctrl.patientId, ctrl.recordId)
        .then(function (res) {
          ctrl.record = res;
          ctrl.patient = res.patient;
          delete ctrl.record["$promise"];
          delete ctrl.record["$resolved"];

          var unwatch = $rootScope.$watch('currentUser.companyName', function(newValue) {
            if (newValue) {
                PrintTitleService.init(
                    "Patient Record - Patient Consents", 
                    ctrl.patient.lName + ', ' + ctrl.patient.fName + ', ' + ctrl.patient.middleInitial + 
                    ' DOB:' + ctrl.patient.dateOfBirth + ' MRN:' + ctrl.patient.mrnNumber + ' - ' + newValue, 
                    false
                );
                unwatch();
            }
          });

          try {
            if (typeof ctrl.record.responses !== 'undefined' && typeof ctrl.record.responses === 'string') {
              ctrl.record.responses = JSON.parse(ctrl.record.responses);
              ctrl.recordformFillData = angular.copy(ctrl.record.responses);
            }
            
            if (ctrl.recordformFillData.isDraft == null || ctrl.recordformFillData.isDraft == undefined) {
              ctrl.patientConsentsForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.patientConsentsForm.isDraft = ctrl.recordformFillData.isDraft;
              if (ctrl.patientConsentsForm.isDraft == false) {
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
          toastr.error("Failed to retrieve patient consents list");
          throw data;
        });
    }
    

    // Form initialization
    function initializeFormData() {
      ctrl.patientConsentsList = [];
      ctrl.patientConsentsForm = {
        consentsSet: [],
        patientProxySignature: null,
        nurseSignature: null,
        isDraft: true,
        value_input:''
      };
    }

    function clearPatientProxySignature() {
      ctrl.patientConsentsForm.patientProxySignature = null;
    }

    function clearNurseSignature() {
      ctrl.patientConsentsForm.nurseSignature = null;
    }

    function generateForms() {
      $rootScope.isFormDirty = false;
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;
        ctrl.patientConsentsForm = {
          consentsSet: res?.consentsSet || [], // Added array to store consent schedules
          patientProxySignature: res?.patientProxySignature || null,
          nurseSignature: res?.nurseSignature || null,
          isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false,
         
        };

        //this is for patientConsent only in patient record
        if (res?.isDraft) {
           ctrl.patientConsentsForm.consentsSet = ctrl.consentsRetrieve
            .filter(c => c.isActive)
            .map(c => {
              const r = res.consentsSet.find(x => x.id === c.id);
              return r ? { ...r, description: c.description } : c;
            });
          }else{
         ctrl.patientConsentsForm.consentsSet = res?.consentsSet ? res?.consentsSet : ctrl.consentsRetrieve;
        }
        // ctrl.patientConsentsForm.consentsSet = res?.consentsSet ? res?.consentsSet : ctrl.consentsRetrieve;
        ctrl.patientConsentsForm.patientProxySignature = res?.patientProxySignature
          ? `data:image/png;base64,${res.patientProxySignature}`
          : null;
        ctrl.patientConsentsForm.nurseSignature = res?.nurseSignature
          ? `data:image/png;base64,${res.nurseSignature}`
          : null;

        setupWatch();
      } else {
        // Initialize form data when not in edit mode
        initializeFormData();
      }
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    };

    ctrl.submitForm = function () {
      if (!$('#patient_consents_form')[0].checkValidity()) {
        return;
      } else {
        ctrl.saveForm(false);
      }
    };

    ctrl.saveForm = function (isDraftVal) {
      if (ctrl.patientConsentsForm.consentsSet.some(x => x.inputType === 'TEXT_INPUT' && x.value &&  !x.value_input)) {
        toastr.error("Please add some value.");
        return
      }
      ctrl.patientConsentsForm.consentsSet
        .filter(c => c.inputType === 'TEXT_INPUT' && !c.value)
        .forEach(c => c.value_input = "");

      var patientConsentsFormToSave = angular.copy(ctrl.patientConsentsForm);
      
      patientConsentsFormToSave.patientProxySignature = patientConsentsFormToSave.patientProxySignature
        ? patientConsentsFormToSave.patientProxySignature.substring(
          patientConsentsFormToSave.patientProxySignature.indexOf(",") + 1
        )
        : null;
      patientConsentsFormToSave.nurseSignature = patientConsentsFormToSave.nurseSignature
        ? patientConsentsFormToSave.nurseSignature.substring(
          patientConsentsFormToSave.nurseSignature.indexOf(",") + 1
        )
        : null;

      patientConsentsFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;
      var patientConsentsFormToSaveWithRecord = angular.copy(ctrl.record);
      patientConsentsFormToSaveWithRecord.responses = JSON.stringify(patientConsentsFormToSave);

      if (patientConsentsFormToSave.isDraft === false) {
        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(patientConsentsFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Patient Consents updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Patient Consents.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        PatientRecordDAO.update(patientConsentsFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }
    }

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    };

    function setupWatch() {
      $scope.$watch(
        function () {
          
          return ctrl.patientConsentsForm;
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

  }

  angular
    .module("xenon.controllers").controller("PatientConsentsCtrl", [
      "$rootScope",
      "ConsentsDAO",
      "PatientRecordDAO",
      "$state",
      "$stateParams",
      "$timeout",
      "$scope",
      "Page",
      "AutoSaveService",
      "UtilService",
      "PrintTitleService",
      PatientConsentsCtrl,
    ]);
})();
