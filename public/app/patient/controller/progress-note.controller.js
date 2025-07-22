
(function () {
  function ProgressNotesCtrl(
    $rootScope,
    $formService, 
    PatientRecordDAO, 
    $state, 
    $stateParams, 
    $filter, 
    $timeout, 
    $scope, 
    Page, 
    AutoSaveService,
    UtilService,
    title
    ) {
    'use strict';
    var ctrl = this;
    Page.setTitle("Patient Record - Progress Note");
    ctrl.title = title;
    ctrl.patientName;
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType
    ctrl.recordId = $stateParams.id
    ctrl.currentDate = new Date();
    ctrl.currentDateWithFormat = $filter("date")(
      ctrl.currentDate,
      "MM/dd/yyyy"
    );
    var timeFormat = 'HH:mm';
    ctrl.currentTime = $filter('date')(new Date().getTime(), timeFormat).toString();
    ctrl.progressNoteTypes = [
      { title: "Caregiver Observation", value: "caregiver_observation" },
      { title: "Change In Patient Condition", value: "change_in_patient_condition" },
      { title: "Initial Assessment", value: "initial_assessment" },
      { title: "Patient/Proxy Request", value: "patient_Proxy_request" },
      { title: "Post Hospitalization Visit", value: "post_hospitalization_visit" },
      { title: "Re-Assessment", value: "reassessment" }
    ]
    ctrl.progressNoteForm = {}

    ctrl.generateFormCall = generateForms;
    ctrl.pageInitCall = pageInit;

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
              ctrl.progressNoteForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.progressNoteForm.isDraft = ctrl.recordformFillData.isDraft;
              if (ctrl.progressNoteForm.isDraft == false) {
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
          toastr.error("Failed to retrieve progress note record");
          throw data;
        })
        .then(function () {
        });
    }

    function generateForms() {
      $rootScope.isFormDirty = false;
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;
        ctrl.progressNoteForm = {
          assessmentType: res?.assessmentType || '',
          assessmentMode: res?.assessmentMode || 'field',
          postHospitalizeVisit: res?.postHospitalizeVisit,
          progressNote: res?.progressNote || '',
          isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false
        }

          setTimeout(function () {
            $formService.setRadioValues('modeOfAssessment', ctrl.progressNoteForm.assessmentMode);
            $formService.resetRadios();
          }, 100);

        setupWatch();
        setTimeout(function () {
          if ($.fn.dirtyForms) {
            $('form').dirtyForms('setClean');
            $('.dirty').removeClass('dirty');
          }
        }, 100);
      } else {
        ctrl.progressNoteForm = {
          assessmentType: '',
          assessmentMode: 'field',
          postHospitalizeVisit: '',
          progressNote: ''
        };
        setTimeout(function () {
          $formService.resetRadios();
        }, 100);

        setupWatch();
      }
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      if (!$('#progress_note_form')[0].checkValidity()) {
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {

      var progressNoteFormToSave = angular.copy(ctrl.progressNoteForm);

      //save user data
      var pos = getCookie("pos");
      var fl = getCookie("fl");
      progressNoteFormToSave.flName = fl || '';
      progressNoteFormToSave.position = pos || ''
      progressNoteFormToSave.dateAdd = ctrl.currentDateWithFormat;
      progressNoteFormToSave.timeAdd = ctrl.currentTime;
      progressNoteFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;

      var progressNoteFormToSaveWithRecord = angular.copy(ctrl.record);
      progressNoteFormToSaveWithRecord.responses = JSON.stringify(progressNoteFormToSave);

      if (progressNoteFormToSave.isDraft === false) {
        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(progressNoteFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Progress Note updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Progress Note.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        // autosave on draft
        PatientRecordDAO.update(progressNoteFormToSaveWithRecord)
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

    ctrl.dataInit = function () {
      $formService.resetRadios()
    }

    function setupWatch() {
      $scope.$watch(
        function () {
          return ctrl.progressNoteForm;
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
  angular.module('xenon.controllers').controller('ProgressNotesCtrl', [
    "$rootScope", 
    "$formService", 
    "PatientRecordDAO", 
    "$state", 
    "$stateParams", 
    "$filter", 
    "$timeout", 
    "$scope", 
    "Page", 
    "AutoSaveService",
    "UtilService",
    ProgressNotesCtrl
  ]);
})();
