
(function () {
  function EmergencyDisasterCtrl(
    $rootScope,
    $formService,
    PatientRecordDAO,
    $state,
    $stateParams,
    $timeout,
    $scope,
    Page,
    PatientDAO,
    AutoSaveService,
    UtilService
  ) {
    'use strict';
    var ctrl = this;
    Page.setTitle("Patient Record - Emergency & Disaster");
    ctrl.record = [];
    ctrl.currentDate = new Date();
    ctrl.recordformFillData = {};
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType
    ctrl.recordId = $stateParams.id
    ctrl.nursingAssessmentDate;
    ctrl.medicalRecordDate;
    ctrl.subfieldChecks = {};
    ctrl.latestMedicalRecord = {};
    ctrl.latestNursingAssessment = {};
    ctrl.emergencyDisasterForm = {}
    ctrl.refreshSubfieldCheck = function (key) {
      ctrl.emergencyDisasterForm[key] = null;
    }

    ctrl.setOtherAllergies = function () {
      $timeout(function () {
        $('#otherAllergies').tagsinput("add", ctrl.emergencyDisasterForm.otherAllergies);
      });
    };

    ctrl.administeredMedsKeyValue = [{ key: 'Needs Reminder' }, { key: 'Needs Assistance' }, { key: 'Medication Box Refill' }, { key: 'May Retain and Self-Medicate' }];
    ctrl.mentalStatusKeyValue = [{ key: 'Alert', model: 'alert' }, { key: 'Oriented - Person', model: 'oriented_person' }, { key: 'Oriented - Place', model: 'oriented_place' }, { key: 'Oriented - Time', model: 'oriented_time' }, { key: 'Forgetfull', model: 'forgetful' }, { key: 'Confused', model: 'confused' }, { key: 'Disorientated', model: 'disoriented' }, { key: 'Depressed', model: 'depressed' }, { key: 'Self-directing', model: 'self_directing' }, { key: 'Comatose', model: 'comatose' }]
    ctrl.dietKeyValue = [{ key: 'Reguar' }, { key: 'Fluid Restrictions' }]

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
              ctrl.emergencyDisasterForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.emergencyDisasterForm.isDraft = ctrl.recordformFillData.isDraft;
              if (ctrl.emergencyDisasterForm.isDraft == false) {
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
          toastr.error("Failed to retrieve emergency & disaster record");
          throw data;
        })
        .then(function () {
        });
    }

    async function generateForms() {
      $rootScope.isFormDirty = false;
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;
        ctrl.emergencyDisasterForm = {
          visitDate: res?.visitDate,
          evacuationLevel: ctrl.patient.priorityCode == 10 ? 'red' : ctrl.patient.priorityCode == 20 ? 'yellow' : 'green',
          name: ctrl.patient.secondaryContactName,
          phoneNumber: ctrl.patient.secondaryContactNumber,
          pharmacyName: res?.pharmacyName || null,
          physicianName: res?.physicianName || ctrl.latestMedicalRecord?.physicianName,
          physicianPhoneNumber: res?.physicianPhoneNumber || '',
          administeredBy: res?.administeredBy || null,
          specialInstructions: res?.specialInstructions || '',
          emergencyPlan: res?.emergencyPlan || '',
          allergies: res?.allergies || '',
          otherAllergies: res?.otherAllergies || null,
          dietSupplements: res?.dietSupplements || null,
          dietSpecial: res?.dietSpecial || null,
          dietOther: res?.dietOther || null,
          mentalStatusOptions: res?.mentalStatusOptions || null,
          isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false
        }

        // SETTING CHECKBOXES VALUES
        var administeredMeds = ctrl.recordformFillData.administeredMeds;
        if (ctrl.recordformFillData.administeredMeds != null) {
          angular.forEach(ctrl.administeredMedsKeyValue, function (obj) {
            if (administeredMeds.indexOf(obj.key) >= 0) {
              obj.value = true;
            }
          });
        }

        var mentalStatusOptions = ctrl.recordformFillData.mentalStatusOptions;

        function updateStatusFromSource(source) {
          angular.forEach(ctrl.mentalStatusKeyValue, function (obj) {
            if (source?.[obj.model] === true) {
              obj.value = true;
            }
          });
        }

        if (Object.keys(ctrl.recordformFillData).length > 0) {
          angular.forEach(ctrl.mentalStatusKeyValue, function (obj) {
            if (mentalStatusOptions.includes(obj.key)) {
              obj.value = true;
            }
          });
        } else {
          try {
            await dataInit();
            const source = ctrl.nursingAssessmentDate > ctrl.medicalRecordDate
              ? ctrl.latestNursingAssessment.mental_status
              : ctrl.latestMedicalRecord.mentalStatus;
  
            if (source != undefined)
              updateStatusFromSource(source);
          } catch (error) {
            toastr.error("Couldn't get data for Mental Status")
          }
        }


        var diet = ctrl.recordformFillData.diet;
        if (ctrl.recordformFillData.diet != null) {
          angular.forEach(ctrl.dietKeyValue, function (obj) {
            if (diet.indexOf(obj.key) >= 0) {
              obj.value = true;
            }
          });
        }

        // CHECKS FOR OTHER OPTIONS
        function checkField(fieldValue, checkboxName) {
          return fieldValue != null && fieldValue != '' ? true : ctrl.subfieldChecks[checkboxName];
        }

        ctrl.subfieldChecks.administeredByCheckbox = checkField(ctrl.emergencyDisasterForm.administeredBy, 'administeredByCheckbox');
        ctrl.subfieldChecks.dietSupplementsCheckbox = checkField(ctrl.emergencyDisasterForm.dietSupplements, 'dietSupplementsCheckbox');
        ctrl.subfieldChecks.dietSpecialCheckbox = checkField(ctrl.emergencyDisasterForm.dietSpecial, 'dietSpecialCheckbox');
        ctrl.subfieldChecks.dietOtherCheckbox = checkField(ctrl.emergencyDisasterForm.dietOther, 'dietOtherCheckbox');

        if (checkField(ctrl.emergencyDisasterForm.otherAllergies, 'otherAllergiesCheckbox')) {
          ctrl.subfieldChecks.otherAllergiesCheckbox = true;
          setTimeout(() => {
            ctrl.setOtherAllergies();
          }, 100);
        }

        setTimeout(function () {
          $formService.setRadioValues('evacuationLevel', ctrl.emergencyDisasterForm.evacuationLevel);
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
        ctrl.emergencyDisasterForm = {};
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
      if (!$('#emergency_disaster_form')[0].checkValidity()) {
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {

      var emergencyDisasterFormToSave = angular.copy(ctrl.emergencyDisasterForm);

      // Setting Key Values to String
      emergencyDisasterFormToSave.administeredMeds = [];
      angular.forEach(ctrl.administeredMedsKeyValue, function (obj) {
        if (obj.value == true) {
          emergencyDisasterFormToSave.administeredMeds.push(obj.key);
        }
      });
      emergencyDisasterFormToSave.administeredMeds = emergencyDisasterFormToSave.administeredMeds.toString();

      emergencyDisasterFormToSave.mentalStatusOptions = [];
      angular.forEach(ctrl.mentalStatusKeyValue, function (obj) {
        if (obj.value == true) {
          emergencyDisasterFormToSave.mentalStatusOptions.push(obj.key);
        }
      });
      emergencyDisasterFormToSave.mentalStatusOptions = emergencyDisasterFormToSave.mentalStatusOptions.toString();

      emergencyDisasterFormToSave.diet = [];
      angular.forEach(ctrl.dietKeyValue, function (obj) {
        if (obj.value == true) {
          emergencyDisasterFormToSave.diet.push(obj.key);
        }
      });
      emergencyDisasterFormToSave.diet = emergencyDisasterFormToSave.diet.toString();

      emergencyDisasterFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;
      if (emergencyDisasterFormToSave.name != ctrl?.patient?.secondaryContactName || emergencyDisasterFormToSave.phoneNumber != ctrl?.patient?.secondaryContactNumber || compareEvacLevel(emergencyDisasterFormToSave.evacuationLevel, ctrl.patient.priorityCode, ctrl.patient.transporatationAssistance)) {
        const evacLevelValue = emergencyDisasterFormToSave.evacuationLevel == 'red' ? 10 : emergencyDisasterFormToSave.evacuationLevel == 'yellow' ? 20 : 30;
        PatientDAO.updateEmergencyInfo({
          id: ctrl.patient.id,
          data: {
            secondaryContactType: ctrl.patient.secondaryContactType,
            secondaryContactName : emergencyDisasterFormToSave.name,
            secondaryContactNumber : emergencyDisasterFormToSave.phoneNumber,
            priorityCode : evacLevelValue,
            transporatationAssistance : evacLevelValue
          }
        }).then(function (res) {
          // Update Successful
        }).catch((err) => {
          toastr.error("Failed to update patient information.");
        })
      }

      var emergencyDisasterFormToSaveWithRecord = angular.copy(ctrl.record);
      emergencyDisasterFormToSaveWithRecord.responses = JSON.stringify(emergencyDisasterFormToSave);

      if (emergencyDisasterFormToSave.isDraft === false) {
        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(emergencyDisasterFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Emergency & Disaster Form updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Emergency & Disaster Form.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        // autosave on draft
        PatientRecordDAO.update(emergencyDisasterFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }
    }

    function compareEvacLevel (levelColor, pCode, tal) {
      if (levelColor === 'red' && pCode === 10 && tal === 10) 
        return false;
      else if (levelColor === 'yellow' && pCode === 20 && tal === 20) 
        return false;
      else if (levelColor === 'green' && pCode === 30 && tal === 30)
        return false;
      return true;
    }

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    }

    function dataInit() {
      $formService.resetRadios();
      $rootScope.maskLoading();
    
      function cleanRecord(record) {
        delete record["$promise"];
        delete record["$resolved"];
        return record;
      }
    
      // Return the promises from API calls
      const medicalRecordPromise = PatientRecordDAO.getLatestRecord({ patientId: ctrl.patientId, type: 'Medical_Orders', currentPatientRecordId: ctrl.recordId, isDraft: false })
        .then(res => {
          const record = cleanRecord(res);
          ctrl.medicalRecordDate = record.dateInserted;
          ctrl.latestMedicalRecord = JSON.parse(record.responses);
          if (!ctrl.emergencyDisasterForm.physicianName) {
            ctrl.emergencyDisasterForm.physicianName = ctrl.latestMedicalRecord?.physicianName;
          }
        })
        .catch(error => {
          toastr.error("Medical Record Not Found")
        });
    
      const nursingAssessmentPromise = PatientRecordDAO.getLatestRecord({ patientId: ctrl.patientId, type: 'Nursing_Assessment', currentPatientRecordId: ctrl.recordId, isDraft: false })
        .then(res => {
          const record = cleanRecord(res);
          ctrl.nursingAssessmentDate = record.dateInserted;
          ctrl.latestNursingAssessment = JSON.parse(record.responses);
        })
        .catch(error => {
          toastr.error("Nursing Assessment Record Not Found")
        });
    
      // Return both promises
      return Promise.all([medicalRecordPromise, nursingAssessmentPromise]);
    }

    function setupWatch() {
      $scope.$watch(
        function () {
          return {
            emergencyDisasterForm: ctrl.emergencyDisasterForm,
            dietKeyValue: ctrl.dietKeyValue,
            mentalStatusKeyValue: ctrl.mentalStatusKeyValue,
            administeredMeds: ctrl.administeredMedsKeyValue,
          }
        },
        function (newVal, oldVal) {
          if (newVal !== oldVal) {
            $rootScope.isFormDirty = true;
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
  angular.module('xenon.controllers').controller('EmergencyDisasterCtrl', [
    "$rootScope",
    "$formService",
    "PatientRecordDAO",
    "$state",
    "$stateParams",
    "$timeout",
    "$scope",
    "Page",
    "PatientDAO",
    "AutoSaveService",
    "UtilService",
    EmergencyDisasterCtrl
  ]);
})();
