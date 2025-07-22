
(function () {
  function MedicationReconciliationCtrl(
    $rootScope,
    PatientRecordDAO,
    MedicationBankRecordDAO,
    $state,
    $stateParams,
    $filter,
    $http,
    $timeout,
    $scope,
    $modal,
    Page,
    AutoSaveService,
    UtilService
  ) {
    'use strict';
    var ctrl = this;
    Page.setTitle("Patient Record - Medication Reconciliation Form");
    ctrl.companyCode = ontime_data.company_code;
    ctrl.medicationFrequency = angular.copy(ontime_data.medicationFrequency);
    ctrl.medicationRoutes = angular.copy(ontime_data.medicationRoutes);
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType;
    ctrl.recordId = $stateParams.id;
    ctrl.currentDate = new Date();
    ctrl.currentDateWithFormat = $filter("date")(
      ctrl.currentDate,
      "MM/dd/yyyy"
    );
    ctrl.nursingAssessmentDate;
    ctrl.medicalRecordDate;
    ctrl.showSignError = false;
    ctrl.latestNursingAssessment = {};
    ctrl.formDefinitionKeyValue = {};

    ctrl.medicationsData = [];
    ctrl.medicationChangePopulateCall = medicationChangePopulate;
    ctrl.addFdaMedication = addFdaMedicationPopUp;
    ctrl.medEducationOptionsKeyValue = [
      { key: "Patient teaching" },
      { key: "Family teaching" },
      { key: "Aide teaching" }
    ];
    ctrl.changesDetectedForAutoSave = false;

    // Initialize form data
    ctrl.medicalReconciliationForm = {
      medications: [{
        id: '',
        medicineName: '',
        dosageQuantity: null,
        dosageQuantityUnit: '',
        type: '',
        frequency: '',
        frquencyOther: '',
        freqOrder: 'withMeals',
        freqOrderComments: false,
        freqOrderOther: '',
        route: '',
        purpose: '',
        sideEffects: '',
        contraindication: ''
      }]
    };

    // Function to add a new medication
    ctrl.addMedication = function (index) {

      var lastMedication = ctrl.medicalReconciliationForm.medications[ctrl.medicalReconciliationForm.medications.length - 1];

      // Check if the last medication has values
      if (lastMedication.id) {

        $scope.initializeSelect2(index);

        ctrl.medicalReconciliationForm.medications.push({
          id: '',
          medicineName: '',
          dosageQuantity: null,
          dosageQuantityUnit: '',
          type: '',
          frequency: '',
          frquencyOther: '',
          freqOrder: 'withMeals',
          freqOrderComments: false,
          freqOrderOther: '',
          route: '',
          purpose: '',
          sideEffects: '',
          contraindication: ''
        });
      } else {
        toastr.error("Medication is not selected.");
      }
    };

    ctrl.removeMedication = function (index) {
      if (ctrl.medicalReconciliationForm.medications.length > 1) {
        ctrl.medicalReconciliationForm.medications.pop();
      }
    };


    $scope.initializeSelect2 = function (index, med) {
      $timeout(function () {
        const selectElement = $('.itemSearch' + index);

        selectElement.select2({
          multiple: false,
          allowClear: true,
          ajax: {
            url: ontime_data.weburl + 'medications',
            dataType: 'json',
            params: {
              headers: {
                "Authorization": getCookie("token"),
                'company_code': ontime_data.company_code,
                'requestToken': getCookie("token"),
                'userName': getCookie("un")
              }
            },
            delay: 500,
            quietMillis: 800,
            data: function (params) {
              return {
                pageNumber: 1,
                pageSize: 20,
                forCompanyOnly: false,
                search: params
              };
            },
            results: function (data) {
              ctrl.medicationsData = data;
              const results = data.map(item => ({
                id: item.id,
                text: item.medicineName + ' - ' + item.dosageQuantity + '' + item.dosageQuantityUnit + ' - ' + item.type || ''
              }));
              return { results: results };
            },
            cache: true
          },
          minimumInputLength: 2,
          placeholder: 'Search for medication...'
        });

        if (med && med.id && med.medicineName) {
          const selectedData = {
            id: med.id,
            text: med.medicineName + ' - ' + med.dosageQuantity + '' + med.dosageQuantityUnit + ' - ' + med.type || ''
          };

          selectElement.select2('data', selectedData);
          selectElement.trigger('change');
        }
      });
    };

    function medicationChangePopulate(index, medicationObj, update) {
      const selectedMedication = ctrl.medicationsData.find(item => item.id === +medicationObj.id);
      
      if (update)
      $scope.initializeSelect2(index, medicationObj);

      if (selectedMedication) {
        const medication = ctrl.medicalReconciliationForm.medications[index];
        medication.id = selectedMedication.id;
        medication.medicineName = selectedMedication.medicineName;
        medication.dosageQuantity = selectedMedication.dosageQuantity;;
        medication.dosageQuantityUnit = selectedMedication.dosageQuantityUnit;
        medication.type = selectedMedication.type;
        medication.medicineName = selectedMedication.medicineName;
        medication.dosageQuantity = selectedMedication.dosageQuantity;;
        medication.dosageQuantityUnit = selectedMedication.dosageQuantityUnit;
        medication.type = selectedMedication.type;
        medication.frequency = update ? medicationObj.frequency : selectedMedication.frequency;
        medication.freqOrder = update ? medicationObj.freqOrder : selectedMedication.freqOrder || 'withMeals';
        medication.freqOrderComments = update ? medicationObj.freqOrderComments : selectedMedication.freqOrderComments || false;
        medication.purpose = update ? medicationObj.purpose : selectedMedication.purpose;
        medication.sideEffects = update ? medicationObj.sideEffects : selectedMedication.sideEffects;
        medication.contraindication = update ? medicationObj.contraindication : selectedMedication.contraindication;
        medication.route = update ? medicationObj.route : selectedMedication.route;

        if (medication.frequency === 'Other') {
          medication.frquencyOther = update ? medicationObj.frquencyOther : selectedMedication.frquencyOther;
        }

        if (medication.freqOrderComments) {
          medication.freqOrderOther = update ? medicationObj.freqOrderOther : selectedMedication.freqOrderOther;
        }
      }
    }

    ctrl.generateFormCall = generateForms;
    ctrl.pageInitCall = pageInit;
    ctrl.dataInit = dataInit;
    ctrl.getLatestRecords = getLatestRecords;

    /*================   FUNCTION CALLS   ===================*/
    $rootScope.maskLoading(); // Start loading

    Promise.all([ctrl.dataInit(), ctrl.pageInitCall()])
      .then(ctrl.generateFormCall)
      .catch(function (error) {
        console.error("Error", error);
      })
      .finally(function () {
        $rootScope.unmaskLoading();
      });

    /*================   FORM FUNCTIONS   ===================*/

    function dataInit() {
      $rootScope.maskLoading();

      ctrl.formUrl = appHelper.dataConfigPath('nursing_assessment_form.json')
      $http.get(ctrl.formUrl).then(async function (res) {
        ctrl.formDefinition = await res.data;
        ctrl.formDefinition.forEach(function (field) {
          ctrl.formDefinitionKeyValue[field.name] = field;
        });
      })

    };


    function getLatestRecords() {
    
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
              record.responses = {};
            }
          } catch (error) {
            ctrl.record.responses = {};
          }
        })
        .catch(function (data, status) {
          showLoadingBar({
            delay: 0.5,
            pct: 100,
            finish: function () { },
          });
          toastr.error("Failed to retrieve medical reconciliation record");
          throw data;
        });
    }

    // All Position lists retrieve
    function retrieveMedicationBankData() {
      return MedicationBankRecordDAO.retrieveAll({ pageNumber: 1, pageSize: 99999 })
        .then(function (res) {
          delete res["$promise"];
          delete res["$resolved"];
          if (res) {
            ctrl.medicationsData = [];
            ctrl.medicationsData = res;
            ctrl.generateFormCall();
          } else {
            ctrl.medicationsData = [];
          }
        })
        .catch(function (data, status) {
          toastr.error("Failed to retrieve medication data");
          throw data;
        });
    }
    ctrl.insertAllergiesTags = function () {
      $timeout(function () {
        $("#otherAllergies").tagsinput(
          "add",
          ctrl.medicalReconciliationForm.otherAllergies
        );
      });
    };

    // Form initialization
    function initializeFormData() {
      ctrl.medicalReconciliationForm = {
        medEducation: '',
        nurseNote: '',
        nurseSignature: '',
        patientSignature: '',
        medications: [
          {
            id: '',
            medicineName: '',
            dosageQuantity: null,
            dosageQuantityUnit: '',
            type: '',
            frequency: '',
            frquencyOther: '',
            freqOrder: 'withMeals',
            freqOrderComments: false,
            freqOrderOther: '',
            route: '',
            purpose: '',
            sideEffects: '',
            contraindication: ''
          }
        ]
      }
    }

    // Form generation
    async function generateForms() {
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;

        ctrl.medicalReconciliationForm = {
          visitDate: res?.visitDate || '',
          medEducation: res?.medEducation || '',
          nurseNote: res?.nurseNote || '',
          nurseSignature: res?.nurseSignature || '',
          patientSignature: res?.patientSignature || '',
          medications: res.medications ? res.medications : ctrl.latestNursingAssessment.medications ? ctrl.latestNursingAssessment.medications : [{ id: '', medicineName: '', dosageQuantity: null, dosageQuantityUnit: '', type: '', frequency: '', frquencyOther: '', route: '', purpose: '', sideEffects: '', contraindication: '', freqOrderComments: false, freqOrderOther: '', }],
          allergyInfoSource: res?.allergyInfoSource || '',
          allergyMissingReason: res?.allergyMissingReason || '',
          otherAllergies: res?.otherAllergies || '',
          allergies: res?.allergies || 'nka'

        }

        if (ctrl.medicalReconciliationForm?.medications?.length) {
          ctrl.medicalReconciliationForm?.medications.forEach((item, i) => {
            medicationChangePopulate(i, item, true);
          })
        }

        ctrl.medicalReconciliationForm.medEducation = res?.medEducation || "";
        if (res.medEducation != null) {
          var edu = res.medEducation;
          angular.forEach(ctrl.medEducationOptionsKeyValue, function (obj) {
            if (edu.indexOf(obj.key) >= 0) {
              obj.value = true;
            }
          });
        }

        ctrl.medicalReconciliationForm.nurseSignature = res?.nurseSignature
          ? `data:image/png;base64,${res.nurseSignature}`
          : null;

        ctrl.medicalReconciliationForm.patientSignature = res?.patientSignature
          ? `data:image/png;base64,${res.patientSignature}`
          : null;

        if (Object.keys(ctrl.recordformFillData).length == 0) {
          try {
            await getLatestRecords();
            const source = ctrl.nursingAssessmentDate > ctrl.medicalRecordDate
              ? ctrl.latestNursingAssessment.allergies_enter_allergies_value
              : ctrl.latestMedicalRecord.otherAllergies;

            if (source != undefined) {
              ctrl.medicalReconciliationForm.otherAllergies = source;
              ctrl.medicalReconciliationForm.allergies = "other"
              ctrl.insertAllergiesTags();
            }
              
          } catch (error) {
            toastr.error("Couldn't get data for Allergies")
          }
        }

        if (res.isDraft == null || res.isDraft == undefined) {
          ctrl.medicalReconciliationForm.isDraft = true;
          AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
        } else {
          ctrl.medicalReconciliationForm.isDraft = res.isDraft;
          if (ctrl.medicalReconciliationForm.isDraft == false) {
            AutoSaveService.stop();
          } else {
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
          }
        }

        setupWatch();

      } else {
        initializeFormData();
      }
        // Allergies and otherAllergies
        if (ctrl.medicalReconciliationForm.allergies == 'other') {
          ctrl.insertAllergiesTags();
        }        
    }

    ctrl.allergyChanged = function () {
      ctrl.medicalReconciliationForm.allergyMissingReason = '';
      ctrl.medicalReconciliationForm.allergyInfoSource = '';
      ctrl.medicalReconciliationForm.otherAllergies = '';
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      if (ctrl.medicalReconciliationForm.nurseSignature == '' || ctrl.medicalReconciliationForm.nurseSignature == null) {
        ctrl.showSignError = true;
        return
      } else {
        ctrl.showSignError = false
      }

      if (!$('#medication_reconciliation_form')[0].checkValidity()) {
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {

      var medicalReconciliationFormToSave = angular.copy(ctrl.medicalReconciliationForm);
      medicalReconciliationFormToSave.nurseSignature = medicalReconciliationFormToSave.nurseSignature
        ? medicalReconciliationFormToSave.nurseSignature.substring(
          medicalReconciliationFormToSave.nurseSignature.indexOf(",") + 1
        )
        : null;

      medicalReconciliationFormToSave.patientSignature = medicalReconciliationFormToSave.patientSignature
        ? medicalReconciliationFormToSave.patientSignature.substring(
          medicalReconciliationFormToSave.patientSignature.indexOf(",") + 1
        )
        : null;

      medicalReconciliationFormToSave.medEducation = [];
      angular.forEach(ctrl.medEducationOptionsKeyValue, function (obj) {
        if (obj.value == true) {
          medicalReconciliationFormToSave.medEducation.push(obj.key);
        }
      });
      medicalReconciliationFormToSave.medEducation = medicalReconciliationFormToSave.medEducation.toString();

      medicalReconciliationFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;

      var pos = getCookie("pos");
      var fl = getCookie("fl");
      medicalReconciliationFormToSave.flName = fl || '';
      medicalReconciliationFormToSave.position = pos || ''
      medicalReconciliationFormToSave.dateAdd = ctrl.currentDateWithFormat;
      medicalReconciliationFormToSave.timeAdd = ctrl.currentTime;

      var medicalReconciliationFormToSaveWithRecord = angular.copy(ctrl.record);
      medicalReconciliationFormToSaveWithRecord.responses = JSON.stringify(medicalReconciliationFormToSave);
      
      if (medicalReconciliationFormToSave.isDraft == false) {

        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(medicalReconciliationFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Medical Reconciliation updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Medical Reconciliation.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        PatientRecordDAO.update(medicalReconciliationFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }
    }

    // WATCHER
    function setupWatch() {
      $scope.$watch('medRecon.medicalReconciliationForm.nurseSignature', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if (newVal == '') {
            ctrl.showSignError = true;
          } else {
            ctrl.showSignError = false;
          }
        }
      });
    }

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    }

    ctrl.clearNurseSignature = function () {
      if (ctrl.showSignError)
        return
      ctrl.medicalReconciliationForm.nurseSignature = ''
      ctrl.showSignError = true;
    }

    ctrl.clearPatientSignature = function () {
      ctrl.medicalReconciliationForm.patientSignature = ''
    }

    function addFdaMedicationPopUp(editMode) {
      AutoSaveService.stop();

      var modalInstance = $modal.open({
        templateUrl: appHelper.viewTemplatePath("common", "fdas-modal"),
        size: "lg",
        backdrop: "static",
        keyboard: false,
        controller: "FdasModalCtrl as fdasModal",
        resolve: {
          selectedType: function () {
            return ''
          },
          fdaSet: function () {
            return ''
          },
          editMode: function () {
            return editMode;
          },
        },
      });

      modalInstance.result.then(function (result) {
        if (result.reverse) {
          AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
        }
        if (result.fdaSet) {
          delete result.fdaSet["$promise"];
          delete result.fdaSet["$resolved"];
          ctrl.medicationsData.push(result.fdaSet);    
               
          const medIndex = ctrl.medicalReconciliationForm.medications.length - 1;
          const medObj = ctrl.medicalReconciliationForm.medications[medIndex];
          medObj.id = result.fdaSet.id;
          ctrl.medicationChangePopulateCall(medIndex, medObj, true);

          if (ctrl.medicalReconciliationForm.isDraft == true) {
            ctrl.submitDraft();
          }          
        }
      });
    };


    function setupWatch() {
      $scope.$watch(
        function () {
          return {
            medicalReconciliationForm: ctrl.medicalReconciliationForm,
            medEducationOptionsKeyValue: ctrl.medEducationOptionsKeyValue,
            medications: ctrl.medicalReconciliationForm.medications
          };
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
  angular.module('xenon.controllers').controller('MedicationReconciliationCtrl', [
    "$rootScope",
    "PatientRecordDAO",
    "MedicationBankRecordDAO",
    "$state",
    "$stateParams",
    "$filter",
    "$http",
    "$timeout",
    "$scope",
    "$modal",
    "Page",
    "AutoSaveService",
    "UtilService",
    MedicationReconciliationCtrl
  ]);
})();
