
(function () {
  function EmpSupervisionCtrl(
    $rootScope,
    $formService,
    PatientRecordDAO,
    $state,
    $stateParams,
    $timeout,
    $scope,
    Page,
    EmployeeDAO,
    $location,
    $anchorScroll,
    UtilService,
    AutoSaveService
  ) {
    'use strict';
    var ctrl = this;
    Page.setTitle("Patient Record - Employee Supervision");
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType
    ctrl.recordId = $stateParams.id
    ctrl.clearEmpSignatureCall = clearEmpSignature;
    ctrl.clearSupervisorSignatureCall = clearSupervisorSignature;
    ctrl.refreshSubfieldValue = function (key) {
      ctrl.empSupervisionForm[key] = null;
    }
    ctrl.employeeList = [];
    ctrl.subfieldCheckboxes = {};
    ctrl.assessmentTypes = [
      { title: "Caregiver Observation", value: "caregiver_observation" },
      { title: "Change In Patient Condition", value: "change_in_patient_condition" },
      { title: "Initial Assessment", value: "initial_assessment" },
      { title: "Patient/Proxy Request", value: "patient_Proxy_request" },
      { title: "Post Hospitalization Visit", value: "post_hospitalization_visit" },
      { title: "Re-Assessment", value: "reassessment" }
    ]
    ctrl.empSupervisionForm = {}
    ctrl.activities = [
      { title: "Reviewed, oriented / and follows plan of care.", value: "reviewed_oriented_follows_plan_of_care" },
      { title: "Follows respiratory hygiene guidelines.", value: "follows_respiratory_hygiene_guidelines" },
      { title: "Completes tasks as directed & demonstrated proper hand washing technique.", value: "completes_tasks_as_directed_proper_hand_washing" },
      { title: "Maintains patient's living area & environment in neat and clean fashion.", value: "maintains_patient_living_area_clean" },
      { title: "Develops relationship with patient and/or family.", value: "develops_relationship_with_patient_family" },
      { title: "Uniform/agency dress code is followed, and ID badge is worn or present.", value: "uniform_dress_code_followed_id_badge_present" },
      { title: "Verbalizes understanding of standard universal precautions and procedures.", value: "verbalizes_understanding_universal_precautions" },
      { title: "Verbalizes understanding of observing changes in the patient’s condition & means of reporting changes.", value: "verbalizes_understanding_observing_changes_patient_condition" }
    ];
    ctrl.observationsKeyValue = [{ key: "Bathing" }, { key: "Grooming" }, { key: "Transfer" }, { key: "Toileting" }, { key: "Ambulation" }, { key: "Respiration" }, { key: "Feeding" }, { key: "Meal Preparation" }, { key: "Temperature" }];
    ctrl.jobTrainingKeyValue = [{ key: "Documentation" }, { key: "Equipment Use" }, { key: "HIPAA Regulations" }, { key: "Reviewed job description" }, { key: "Fire Safety/Emergency Preparedness" },];

    ctrl.generateFormCall = generateForms;
    ctrl.pageInitCall = pageInit;

    ctrl.changesDetectedForAutoSave = false;

    /*================   FUNCTION CALLS   ===================*/
    $rootScope.maskLoading();

    Promise.all([ctrl.pageInitCall(), getEmployeesList()])
      .then(ctrl.generateFormCall)
      .catch(function (error) {
        console.error("Error:", error);
      })
      .finally(function () {
        $rootScope.unmaskLoading();
      });


    /*================   FORM FUNCTIONS   ===================*/
    function pageInit() {
      return PatientRecordDAO.getById(ctrl.patientId, ctrl.recordId)
        .then(function (res) {
          ctrl.record = res;
          ctrl.patient = res.patient;
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
              ctrl.empSupervisionForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.empSupervisionForm.isDraft = ctrl.recordformFillData.isDraft;
              if (ctrl.empSupervisionForm.isDraft == false) {
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
          toastr.error("Failed to retrieve Employee Supervision record");
          throw data;
        })
        .then(function () {
        });
    }

    function generateForms() {
      $rootScope.isFormDirty = false;
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;
        ctrl.empSupervisionForm = {
          assessmentType: res?.assessmentType || null,
          staffSupervisod: res?.staffSupervisod || 'present',
          absenceReason: res?.absenceReason || '',
          postHospitalizeVisit: res?.postHospitalizeVisit,
          supervisedEmployee: res?.supervisedEmployee || null,
          activities: res?.activities || {
            reviewed_oriented_follows_plan_of_care: "satisfactory",
            follows_respiratory_hygiene_guidelines: "satisfactory",
            completes_tasks_as_directed_proper_hand_washing: "satisfactory",
            maintains_patient_living_area_clean: "satisfactory",
            develops_relationship_with_patient_family: "satisfactory",
            uniform_dress_code_followed_id_badge_present: "satisfactory",
            verbalizes_understanding_universal_precautions: "satisfactory",
            verbalizes_understanding_observing_changes_patient_condition: "satisfactory"
          },
          observations: res?.observations || null,
          otherObservation: res?.otherObservation || null,
          checkSupplyNeeds: res?.checkSupplyNeeds || false,
          checkSupplyNeedsOther: res?.checkSupplyNeedsOther || null,
          jobTrainings: res?.jobTrainings || null,
          jobTrainingOther: res?.jobTrainingOther || null,
          comment: res?.comment || '',
          employeeSignature: res?.employeeSignature || null,
          supervisorSignature: res?.supervisorSignature || null,
          isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false
        }

        // CHECKS FOR OTHER OPTIONS
        function checkField(fieldValue, checkboxName) {
          if (fieldValue != null && fieldValue != '') {
            ctrl.subfieldCheckboxes[checkboxName] = true;
          }
        }

        checkField(ctrl.empSupervisionForm.otherObservation, 'otherObservationCheckbox');
        checkField(ctrl.empSupervisionForm.checkSupplyNeedsOther, 'checkSupplyNeedsOtherCheckbox');
        checkField(ctrl.empSupervisionForm.jobTrainingOther, 'jobTrainingOtherCheckbox');

        // SETTING CHECKBOXES VALUES
        var observations = ctrl.recordformFillData.observations;
        if (ctrl.recordformFillData.observations != null) {
          angular.forEach(ctrl.observationsKeyValue, function (obj) {
            if (observations.indexOf(obj.key) >= 0) {
              obj.value = true;
            }
          });
        }
        var jobTrainings = ctrl.recordformFillData.jobTrainings;
        if (ctrl.recordformFillData.jobTrainings != null) {
          angular.forEach(ctrl.jobTrainingKeyValue, function (obj) {
            if (jobTrainings.indexOf(obj.key) >= 0) {
              obj.value = true;
            }
          });
        }

        setTimeout(function () {
          $formService.setRadioValues('staffSupervisod', ctrl.empSupervisionForm.staffSupervisod);
          for (let activity in ctrl.empSupervisionForm.activities) {
            $formService.setRadioValues(activity, ctrl.empSupervisionForm.activities[activity]);
          }
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
        toastr.error('Failed to retrieve Patient Record');
      }
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      if (!$('#emp_supervision_form')[0].checkValidity()) {
        return;
      } else if (ctrl.empSupervisionForm.supervisedEmployee == null) {
        ctrl.formSubmitted = true;
        $location.hash('employeeDropdownSeparator');
        $anchorScroll();
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {
      var empSupervisionFormToSave = angular.copy(ctrl.empSupervisionForm);

      empSupervisionFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;

      // Setting Key Values to String
      empSupervisionFormToSave.observations = [];
      angular.forEach(ctrl.observationsKeyValue, function (obj) {
        if (obj.value == true) {
          empSupervisionFormToSave.observations.push(obj.key);
        }
      });
      empSupervisionFormToSave.observations = empSupervisionFormToSave.observations.toString();

      empSupervisionFormToSave.jobTrainings = [];
      angular.forEach(ctrl.jobTrainingKeyValue, function (obj) {
        if (obj.value == true) {
          empSupervisionFormToSave.jobTrainings.push(obj.key);
        }
      });
      empSupervisionFormToSave.jobTrainings = empSupervisionFormToSave.jobTrainings.toString();

      var empSupervisionFormToSaveWithRecord = angular.copy(ctrl.record);
      empSupervisionFormToSaveWithRecord.responses = JSON.stringify(empSupervisionFormToSave);

      if (empSupervisionFormToSave.isDraft === false) {
        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(empSupervisionFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Employee Supervision updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Employee Supervision.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        // autosave on draft
        PatientRecordDAO.update(empSupervisionFormToSaveWithRecord)
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

    function getEmployeesList() {
      EmployeeDAO.retrieveByPosition().then(function (res) {
        ctrl.employeeList = res;
        if (ctrl.empSupervisionForm.supervisedEmployee != null) {
          $timeout(function () {
            $("#employeeDropdown").select2("val", ctrl.empSupervisionForm.supervisedEmployee);
          });
        }
      });
    };

    ctrl.dataInit = function () {
      $formService.resetRadios()
    }

    function clearEmpSignature() {
      ctrl.empSupervisionForm.employeeSignature = '';
    }
    function clearSupervisorSignature() {
      ctrl.empSupervisionForm.supervisorSignature = '';
    }

    function setupWatch() {
      $scope.$watch(
        function () {
          return {
            empSupervisionForm: ctrl.empSupervisionForm,
            observations: ctrl.observationsKeyValue,
            jobTraining: ctrl.jobTrainingKeyValue
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
  angular.module('xenon.controllers').controller('EmpSupervisionCtrl', [
    "$rootScope",
    "$formService",
    "PatientRecordDAO",
    "$state",
    "$stateParams",
    "$timeout",
    "$scope",
    "Page",
    "EmployeeDAO",
    "$location",
    "$anchorScroll",
    "UtilService",
    "AutoSaveService",
    EmpSupervisionCtrl
  ]);
})();
