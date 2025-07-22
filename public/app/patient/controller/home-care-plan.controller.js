(function () {
  function HomeCarePlanCtrl(
    $rootScope,
    PositionDAO,
    TasksDAO,
    PatientDAO,
    PatientRecordDAO,
    $state,
    $formService,
    $http,
    $stateParams,
    $timeout,
    $scope,
    $modal,
    Page,
    AutoSaveService,
    UtilService
  ) {
    "use strict";
    var ctrl = this;
    Page.setTitle("Patient Record - Home Care Plan Form");
    ctrl.patientName;
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.subfieldChecks = {};
    ctrl.latestNursingAssessment = {};
    ctrl.formDefinitionKeyValue = {};
    ctrl.formDefinition = [];
    ctrl.nutritionalRequirementsKeyValue = {};
    ctrl.advancedDirectivesDNR = {};
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordId = $stateParams.id
    ctrl.formUrl = appHelper.dataConfigPath('nursing_assessment_form.json');
    ctrl.refreshSubfieldCheck = function (key) {
      ctrl.homeCarePlanForm[key] = null;
    }
    ctrl.changesDetectedForAutoSave = false;

    ctrl.goals = [
      { id: "fall_injury_prevention", label: "Fall & Injury Prevention" },
      { id: "hospitalization_reduction", label: "Hospitalization Reduction" },
      { id: "personal_care_needs", label: "Personal Care Needs Will Be Met" },
      { id: "rehabilitation", label: "Rehabilitation" },
      { id: "social_recreational_activities", label: "Social & Recreational Activities Met" }
    ];    

    ctrl.initializeParameters = function () {
      // Initialize dynamic properties for each parameter
      angular.forEach(ctrl.vitalSignParametersList, function (parameter) {
        ctrl[parameter + 'Low'] = null;
        ctrl[parameter + 'High'] = null;
      });
    };

    ctrl.initilizeData = function () {
      ctrl.servicesInTheHomeOptionsKeyValue = [
        { id: "skilled_nursing", label: "Skilled Nursing" },
        { id: "physical_therapy", label: "Physical Therapy" },
        { id: "occupational_therapy", label: "Occupational Therapy" },
        { id: "speech_therapy", label: "Speech Therapy" },
        { id: "medical_social_work", label: "Medical Social Work" },
        { id: "personal_care", label: "Personal Care" },
        { id: "housekeeping", label: "Housekeeping" }
      ];
      
      ctrl.thingsToReportOptionsKeyValue = [
        { id: "refusal_of_care", label: "Refusal of care" },
        { id: "no_bm_greater_than_3_days", label: "No BM greater than 3 days" },
        { id: "report_changes_to_patient_condition", label: "Report changes to patient condition" },
        { id: "red_broken_skin", label: "Red/broken skin" },
        { id: "falls_injury", label: "Falls/Injury" },
        { id: "reported_medication_issues", label: "Reported medication issues" }
      ];

      ctrl.vitalSignParametersList = [
        { title: 'Heart Rate', name: 'heartRate', lowValue: null, highValue: null, required: "required", },
        { title: 'Systolic BP', name: 'systolicBP', lowValue: null, highValue: null, required: "", },
        { title: 'Diastolic BP', name: 'diastolicBP', lowValue: null, highValue: null, required: "", },
        { title: 'Respiration Rate', name: 'respirationRate', lowValue: null, highValue: null, required: "", },
        { title: 'Temperature', name: 'temperature', lowValue: null, highValue: null, required: "", },
        // Add more parameters as needed
      ];

      ctrl.thingsToReportOtherText = "";
      ctrl.otherThingToReportCheckbox = false;
    }

    ctrl.initilizeData();
    // Call the initialization function
    ctrl.initializeParameters();

    ctrl.positionList = [];
    ctrl.retrievePositions = retrievePositionsData;

    ctrl.taskList = [];

    ctrl.positionTasksList = [];
    ctrl.positionTasksMap = [];
    ctrl.setPositionTaskDataCall = setPositionTaskData;

    ctrl.resetVar = false;
    ctrl.avoidWatch = true;
    ctrl.selectedTasks = [];
    ctrl.tasksErrorMsg = null;
    ctrl.isTasksSelected = false;

    ctrl.isGoalsSelected = false;

    ctrl.homeCarePlanForm = {};

    ctrl.refreshThingsToReport = function () {
      $timeout(function () {
        $("#thingsToReportOtherText").tagsinput(
          "add",
          ctrl.homeCarePlanForm.otherThingsToReport
        );
      });
    };

    ctrl.onChangeActivePermitted = function () {
      ctrl.homeCarePlanForm.otherActivities = '';
    }

          // CHECKS FOR OTHER OPTIONS
          function checkField(fieldValue, checkboxName) {
            return fieldValue != null && fieldValue != '' ? true : ctrl.subfieldChecks[checkboxName];
          }

          function dataInit() {
            return PatientRecordDAO.getLatestRecord({
              patientId: ctrl.patientId,
              type: 'Nursing_Assessment',
              currentPatientRecordId: ctrl.recordId,
              isDraft: false
            }).then(function(res) {
        
              var record = angular.copy(res);
              delete record["$promise"];
              delete record["$resolved"];
        
              try {
                if (typeof record.responses !== 'undefined' && typeof record.responses === 'string') {
                  record.responses = JSON.parse(record.responses);
                  ctrl.latestNursingAssessment = angular.copy(record.responses);
                } else {
                  console.error('Invalid JSON data or undefined.');
                }
              } catch (error) {
                console.error('Error parsing JSON:', error);
                ctrl.latestNursingAssessment = [];
              }
            }).catch(function(error) {
              toastr.error("Failed to retrieve nursing assessment, record not found");
            });
          };

    ctrl.onChange = function (title, value) {     
      ctrl.homeCarePlanForm.nutritionalRisks[title] = value
      if (title === "other" && value === true) {
        ctrl.showOtherInput = true;
      } else {
        ctrl.showOtherInput = false;
      }
    };
          ctrl.subfieldChecks.administeredByCheckbox = checkField(ctrl.homeCarePlanForm.administeredBy, 'administeredByCheckbox');

    ctrl.generateFormCall = generateForms;

    ctrl.clearPatientProxySignatureCall = clearPatientProxySignature;
    ctrl.clearNurseSignatureCall = clearNurseSignature;

    ctrl.pageInitCall = pageInit;
    ctrl.dataInitCall = dataInit;
    ctrl.fetchNurseFormJsonCall = fetchNurseFormJson;

    /*================   FUNCTION CALLS   ===================*/
    $rootScope.maskLoading(); // Start loading

    Promise.all([ctrl.pageInitCall(), ctrl.retrievePositions(), ctrl.fetchNurseFormJsonCall()]) // ctrl.retrieveTasks()])
      .then(ctrl.generateFormCall)
      .catch(function (error) {
        console.error("Error", error);
      })
      .finally(function () {
        $rootScope.unmaskLoading();
      });


    function retrievePositionsData() {
      return PositionDAO.view({ subAction: "all" })
        .then(function (res) {
          ctrl.positionList = res;
          delete ctrl.positionList["$promise"];
          delete ctrl.positionList["$resolved"];
        })
        .catch(function (data, status) {
          toastr.error("Failed to retrieve users.");
          throw data;
        });
    }

    function setPositionTaskData(positionIdVal) {
      ctrl.homeCarePlanForm.taskScheduleSet = [];
      if (ctrl.selectedTasks.length !== 0) {
        ctrl.avoidWatch = true;
        ctrl.selectedTasks = [];
      }
      ctrl.positionTasksList = [];
      $rootScope.maskLoading();
      TasksDAO.view({ subAction: "active", positionId: positionIdVal })
        .then(function (res) {
          ctrl.positionTasksList = res ? res : [];
        })
        .catch(function (data, status) {
          toastr.info("Tasks not found.");
          ctrl.positionTasksList = [];
          throw data;
        })
        .finally(function () {
          $timeout(function () {
            $("#tasks").multiSelect("refresh");
            $rootScope.unmaskLoading();
          });
        });
    }

    // Function for page initialization
    function pageInit() {
      return PatientRecordDAO.getById(ctrl.patientId, ctrl.recordId)
        .then(async function (res) {
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
              ctrl.record.responses = {};
              await ctrl.dataInitCall();
            }

            // save to draft
            if (ctrl.recordformFillData.isDraft == null || ctrl.recordformFillData.isDraft == undefined) {
              ctrl.homeCarePlanForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.homeCarePlanForm.isDraft = ctrl.recordformFillData.isDraft;
              if (ctrl.homeCarePlanForm.isDraft == false) {
                AutoSaveService.stop();
              } else {
                AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
              }
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
          toastr.error("Failed to retrieve home care plan record");
          throw data;
        })
        .then(function () {
        });
    }

    function fetchNurseFormJson () {
      return $http.get(ctrl.formUrl).then(function (res) {
        ctrl.formDefinition = res.data;

        ctrl.formDefinition.forEach(function (field) {
          ctrl.formDefinitionKeyValue[field.name] = field;
        });

        ctrl.advancedDirectivesDNR = ctrl.formDefinitionKeyValue["dnr"].options;

        ctrl.nutritionalRequirementsKeyValue = ctrl.formDefinitionKeyValue["diet"].options;

      }).catch(function (error) {
        toastr.error("Failed to retrieve form definition");
      });             
    }

    function initializeFormData() {

      ctrl.initilizeData();

      ctrl.refreshThingsToReport();

      ctrl.positionTasksList = [];
      ctrl.homeCarePlanForm = {
        positionId: "",
        taskScheduleSet: [],
        goals: "",
        thingsToReportOptions: "",

        serviceFrequency: "",
        otherDiet: "",
        caregiverStatus: "",
        culturalBeliefs: "",
        infectionControl: "",
        psychosocialStatus: "",
        specialConsiderations: "",

        canBeLeftAlone: "true",
        phoneNumber: "",
        name: "",
        patientProblems: "",
        patientAllergies: "",
        patientProxySignature: null,
        nurseSignature: null,
        isDraft: true
      };
    }

    function clearPatientProxySignature() {
      ctrl.homeCarePlanForm.patientProxySignature = null;
    }

    function clearNurseSignature() {
      ctrl.homeCarePlanForm.nurseSignature = null;
    }

    function generateForms() {
      $rootScope.isFormDirty = false;
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;
            // Initialize form data
            ctrl.homeCarePlanForm = {
              positionId: res?.positionId || 15,//for personal care show by default
              taskScheduleSet: res?.taskScheduleSet || [], // Added array to store task schedules

              serviceFrequency: res?.serviceFrequency,
              otherDiet: res?.otherDiet,
              caregiverStatus: res?.caregiverStatus,
              culturalBeliefs: res?.culturalBeliefs,
              infectionControl: res?.infectionControl,
              psychosocialStatus: res?.psychosocialStatus,
              specialConsiderations: res?.specialConsiderations,

              goals: res?.goals ? res.goals : [],
              canBeLeftAlone: res?.canBeLeftAlone || "true",
              phoneNumber: res?.phoneNumber,
              name: res?.name,
              patientProblems: res?.patientProblems,
              patientAllergies: res?.patientAllergies,
              patientProxySignature: res?.patientProxySignature || null,
              nurseSignature: res?.nurseSignature || null,
              isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false,
              otherActivities: res?.otherActivities || '',
              evacuationLevel: ctrl.patient.priorityCode == 10 ? 'red' : ctrl.patient.priorityCode == 20 ? 'yellow' : 'green',
              administeredBy: res?.administeredBy || null,
              advancedDirectivesDNR: res?.advancedDirectivesDNR || null,
              nutritionalRisks: res?.nutritionalRisks || ctrl.latestNursingAssessment.diet || {},
              activitiesPermitted: res?.activitiesPermitted || 'all',
              dnrPatientEducated: res?.dnrPatientEducated || ''
            };
            //either proxy or emergency radio selector in patient info ctrl.patient.secondaryContactType 'P' or 'E'
            ctrl.homeCarePlanForm.phoneNumber = ctrl.patient.secondaryContactNumber;
            ctrl.homeCarePlanForm.name = ctrl.patient.secondaryContactName;

            if (res?.positionId) {
              ctrl.setPositionTaskDataCall(ctrl.homeCarePlanForm.positionId);
            } else {
              //for personal care show by default
              ctrl.setPositionTaskDataCall(15);
            }

            if (ctrl.nutritionalRequirementsKeyValue && ctrl.homeCarePlanForm.nutritionalRisks) {
              ctrl.showOtherInput = false;
              angular.forEach(ctrl.nutritionalRequirementsKeyValue, function(option) {
                if (ctrl.homeCarePlanForm.nutritionalRisks[option.value] === true) {
                  option.value = true; 
                  if (option.title === 'Other') {
                    ctrl.showOtherInput = true;
                }
                } else {
                  option.value = false;
                }
              });
            }

            ctrl.homeCarePlanForm.taskScheduleSet = res?.taskScheduleSet; // Added array to store task schedules

            if (ctrl.homeCarePlanForm.taskScheduleSet == null) {
              ctrl.homeCarePlanForm.taskScheduleSet = [];
            } else {
              angular.forEach(ctrl.homeCarePlanForm.taskScheduleSet, function (obj) {
                if (ctrl.positionTasksList.indexOf(obj.taskType)) {
                  ctrl.avoidWatch = true;
                  ctrl.selectedTasks.push(parseInt(obj.taskType));
                }
              });
            }

            // Additional code for "vitalSignParametersList"
            angular.forEach(ctrl.vitalSignParametersList, function (parameter) {
              var paramName = parameter.name;
              if (res[paramName]) {
                ctrl.homeCarePlanForm[paramName] = res[paramName];
                parameter.lowValue = res[paramName].lowValue;
                parameter.highValue = res[paramName].highValue;
              }
            });

            ctrl.homeCarePlanForm.servicesInTheHomeOptions = res?.servicesInTheHomeOptions || "";

            // Check by default if thingsToReportOptions has any value
            if (res.servicesInTheHomeOptions != null) {
              var servicesInTheHomeOptions = res.servicesInTheHomeOptions;
              angular.forEach(ctrl.servicesInTheHomeOptionsKeyValue, function (obj) {
                if (servicesInTheHomeOptions.indexOf(obj.id) >= 0) {
                  obj.value = true;
                }
              });
            }

            // Additional code for "Things to Report"
            ctrl.homeCarePlanForm.thingsToReportOptions = res?.thingsToReportOptions || "";
            ctrl.homeCarePlanForm.otherThingsToReport = res?.otherThingsToReport
              ? res?.otherThingsToReport
              : "";

            // Check by default if thingsToReportOptions has any value
            if (res.thingsToReportOptions != null) {
              var thingsToReportOptions = res.thingsToReportOptions;
              angular.forEach(ctrl.thingsToReportOptionsKeyValue, function (obj) {
                if (thingsToReportOptions.indexOf(obj.id) >= 0) {
                  obj.value = true;
                }
              });
            }

            // Check by default if any value of otherThingsToReport and show input
            if (
              ctrl.homeCarePlanForm.otherThingsToReport != null &&
              ctrl.homeCarePlanForm.otherThingsToReport != ""
            ) {
              ctrl.otherThingToReportCheckbox = true;
              ctrl.refreshThingsToReport();
            }

            ctrl.homeCarePlanForm.patientProxySignature = res?.patientProxySignature
              ? `data:image/png;base64,${res.patientProxySignature}`
              : null;
            ctrl.homeCarePlanForm.nurseSignature = res?.nurseSignature
              ? `data:image/png;base64,${res.nurseSignature}`
              : null;


            $timeout(function () {
              $("#tasks").multiSelect("refresh");
              $("#goals").multiSelect("refresh");
              $formService.setRadioValues('evacuationLevel', ctrl.homeCarePlanForm.evacuationLevel);
              $formService.setRadioValues('advancedDirectivesDNR', ctrl.homeCarePlanForm.advancedDirectivesDNR);
              $formService.setRadioValues('activitiesPermittedField', ctrl.homeCarePlanForm.activitiesPermitted);
              $formService.resetRadios();
            });

            setupWatch();
      } else {
        initializeFormData();
      }

      if (ctrl.resetVar === true) {
        if (ctrl.selectedTasks.length != 0) {
          ctrl.avoidWatch = true;
          ctrl.selectedTasks = [];
        }
      }

    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      /*
      *  &&
      ctrl.isValidCustomCheck() === true &&
      ctrl.isVitalSignParametersValid() === true
      Add above conditions if custom validation for swipe boxes, but its not scrolling to top
      */
      if ($('#home_care_plan_form')[0].checkValidity()) {
        ctrl.saveForm(false);
      }
    }

    // Function to submit the form
    ctrl.saveForm = function (isDraftVal) {

      // Implement form submission logic here
      var homeCarePlanFormToSave = angular.copy(ctrl.homeCarePlanForm);

      // signature patientProxySignature
      homeCarePlanFormToSave.patientProxySignature = homeCarePlanFormToSave.patientProxySignature
        ? homeCarePlanFormToSave.patientProxySignature.substring(
          homeCarePlanFormToSave.patientProxySignature.indexOf(",") + 1
        )
        : null;
      // signature nurseSignature
      homeCarePlanFormToSave.nurseSignature = homeCarePlanFormToSave.nurseSignature
        ? homeCarePlanFormToSave.nurseSignature.substring(
          homeCarePlanFormToSave.nurseSignature.indexOf(",") + 1
        )
        : null;

      // ServicesInTheHomeOptions
      homeCarePlanFormToSave.servicesInTheHomeOptions = [];
      angular.forEach(ctrl.servicesInTheHomeOptionsKeyValue, function (obj) {
        if (obj.value == true) {
          homeCarePlanFormToSave.servicesInTheHomeOptions.push(obj.id);
        }
      });
      homeCarePlanFormToSave.servicesInTheHomeOptions =
        homeCarePlanFormToSave.servicesInTheHomeOptions.toString();

      // ThingsToReportOptions
      homeCarePlanFormToSave.thingsToReportOptions = [];
      angular.forEach(ctrl.thingsToReportOptionsKeyValue, function (obj) {
        if (obj.value == true) {
          homeCarePlanFormToSave.thingsToReportOptions.push(obj.id);
        }
      });
      homeCarePlanFormToSave.thingsToReportOptions =
        homeCarePlanFormToSave.thingsToReportOptions.toString();

      // OtherThingsToReport
      if (
        (homeCarePlanFormToSave.otherThingsToReport == "" &&
          ctrl.otherThingToReportCheckbox == true) ||
        ctrl.otherThingToReportCheckbox == false
      ) {
        delete homeCarePlanFormToSave.otherThingsToReport;
      }

      // save emergency contact update if change
      if (homeCarePlanFormToSave.name != ctrl?.patient?.secondaryContactName || homeCarePlanFormToSave.phoneNumber != ctrl?.patient?.secondaryContactNumber || compareEvacLevel(ctrl.homeCarePlanForm.evacuationLevel, ctrl.patient.priorityCode, ctrl.patient.transporatationAssistance)) {
        const evacLevelValue = ctrl.homeCarePlanForm.evacuationLevel == 'red' ? 10 : ctrl.homeCarePlanForm.evacuationLevel == 'yellow' ? 20 : 30;
        PatientDAO.updateEmergencyInfo({
          id: ctrl.patient.id,
          data: {
            secondaryContactType: ctrl.patient.secondaryContactType,
            secondaryContactName: ctrl.homeCarePlanForm.name,
            secondaryContactNumber: ctrl.homeCarePlanForm.phoneNumber,
            priorityCode : evacLevelValue,
            transporatationAssistance : evacLevelValue
          }
        }).then(function (res) {
          //  Update Successfull
        }).catch((err) => {
          toastr.error("Failed to update patient information.");
        })
      }

      homeCarePlanFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;
      var homeCarePlanFormToSaveWithRecord = angular.copy(ctrl.record);
      homeCarePlanFormToSaveWithRecord.responses = JSON.stringify(homeCarePlanFormToSave);

      if (homeCarePlanFormToSave.isDraft === false) {

        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(homeCarePlanFormToSaveWithRecord)
            .then((res) => {
              $rootScope.isFormDirty = false;
              toastr.success("Home Care Plan updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Home Care Plan.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        PatientRecordDAO.update(homeCarePlanFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }

    };

    function compareEvacLevel (levelColor, pCode, tal) {
      if (levelColor === 'red' && pCode === 10 && tal === 10) 
        return false;
      else if (levelColor === 'yellow' && pCode === 20 && tal === 20) 
        return false;
      else if (levelColor === 'green' && pCode === 30 && tal === 30)
        return false;
      return true;
    }

    ctrl.isValidCustomCheck = function () {
      var validCheckAll = true;
      if (ctrl.homeCarePlanForm?.taskScheduleSet?.length === 0) {
        ctrl.isTasksSelected = true;
        validCheckAll = false;
      }
      if (ctrl.homeCarePlanForm?.goals?.length === 0) {
        ctrl.isGoalsSelected = true;
        validCheckAll = false;
      }
      return validCheckAll;
    };

    ctrl.isVitalSignParametersValid = function () {
      var validCheckparame = true;
      // Validation for vitalSignParametersList
      angular.forEach(ctrl.vitalSignParametersList, function (parameter) {
        var paramName = parameter.name;

        // Check if paramName exists in ctrl.homeCarePlanForm and has lowValue and highValue
        if (parameter.required && (!ctrl.homeCarePlanForm[paramName] || !angular.isDefined(ctrl.homeCarePlanForm[paramName]?.lowValue) || !angular.isDefined(ctrl.homeCarePlanForm[paramName]?.highValue) || !ctrl.homeCarePlanForm[paramName]?.lowValue || !ctrl.homeCarePlanForm[paramName]?.highValue)) {
          parameter.validationError = true;
          validCheckparame = false;
        } else {
          parameter.validationError = false;
        }
      });

      return validCheckparame;
    };

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    };

    ctrl.openTaskModal = function (editMode) {
      var modalInstance = $modal.open({
        templateUrl: appHelper.viewTemplatePath("common", "tasks_modal"),
        size: "md",
        backdrop: "static",
        keyboard: false,
        controller: "TasksModalCtrl as tasksModal",
        resolve: {
          selectedType: function () {
            return ctrl.newSelectedType;
          },
          taskScheduleSet: function () {
            return angular.copy(ctrl.homeCarePlanForm.taskScheduleSet);
          },
          editMode: function () {
            return editMode;
          },
        },
      });

      modalInstance.result.then(function (result) {
        if (result.reverse) {
          ctrl.avoidWatch = true;
          if (!editMode) {
            ctrl.selectedTasks.splice(
              ctrl.selectedTasks.indexOf(parseInt(ctrl.newSelectedType)),
              1
            );
          } else {
            ctrl.selectedTasks.push(parseInt(ctrl.newSelectedType));
          }
        }
        if (result.taskScheduleSet) {
          ctrl.homeCarePlanForm.taskScheduleSet = angular.copy(
            result.taskScheduleSet
          ); // Update task schedules
        }
      });
    };

    $scope.$watch(
      function () {
        return ctrl.selectedTasks;
      },
      function (newValue, oldValue) {
        if (ctrl.avoidWatch === false) {
          $timeout(function () {
            $("#tasks").multiSelect("refresh");
          });

          if (
            newValue != null &&
            (oldValue == null || newValue.length > oldValue.length)
          ) {
            if (oldValue == null) {
              ctrl.newSelectedType = newValue;
            } else {
              ctrl.newSelectedType = arr_diff(newValue, oldValue);
            }

            ctrl.openTaskModal(false);
          } else if (oldValue !== null && newValue.length < oldValue.length) {
            ctrl.newSelectedType = arr_diff(oldValue, newValue);
            ctrl.openTaskModal(true); // Pass 'true' to indicate edit mode
          }
        } else {
          ctrl.avoidWatch = false;
          $timeout(function () {
            $("#tasks").multiSelect("refresh");
          });
        }
      },
      true
    );

    function setupWatch() {
      $scope.$watch(
        function () {
          return {
            homeCarePlanForm: ctrl.homeCarePlanForm,
            patientProxySignature: ctrl.homeCarePlanForm.patientProxySignature,
            otherThingToReportCheckbox: ctrl.homeCarePlanForm.otherThingToReportCheckbox,
            thingsToReportOptionsKeyValue: ctrl.thingsToReportOptionsKeyValue,
            nurseSignature: ctrl.homeCarePlanForm.nurseSignature,
            servicesInTheHomeOptionsKeyValue: ctrl.servicesInTheHomeOptionsKeyValue,
            nutritionalRequirementsKeyValue : ctrl.nutritionalRequirementsKeyValue
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

  }

  angular
    .module("xenon.controllers").controller("HomeCarePlanCtrl", [
      "$rootScope",
      "PositionDAO",
      "TasksDAO",
      "PatientDAO",
      "PatientRecordDAO",
      "$state",
      "$formService",
      "$http",
      "$stateParams",
      "$timeout",
      "$scope",
      "$modal",
      "Page",
      "AutoSaveService",
      "UtilService",
      HomeCarePlanCtrl,
    ]);
})();
