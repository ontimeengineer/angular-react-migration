(function () {
  function MedicalOrdersCtrl(
    $rootScope,
    $filter,
    PatientRecordDAO,
    $state,
    $stateParams,
    $http,
    $timeout,
    $scope,
    Page,
    AutoSaveService,
    UtilService
  ) {
    "use strict";
    var ctrl = this;
    Page.setTitle("Patient Record - Medical Order Form");
    ctrl.patientName;
    ctrl.record = [];
    ctrl.recordformFillData = {};
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType
    ctrl.recordId = $stateParams.id
    ctrl.currentDate = new Date();
    ctrl.currentDateWithFormat = $filter("date")(
      ctrl.currentDate,
      "MM/dd/yyyy"
    );

    ctrl.formUrl = ''
    ctrl.formDefinition = [];
    ctrl.formDefinitionKeyValue = {};
    ctrl.latestNursingAssessment = {};
    ctrl.isOrderFormValidationActive = false;
    ctrl.pageInitCall = pageInit;
    ctrl.activityOptionsKeyValue = [
      { key: "Complete Bedrest" },
      { key: "Bedrest BRP" },
      { key: "Up As Tolerated" },
      { key: "Transfer Bed/Chair" },
      { key: "Exercise Prescribed" },
      { key: "Partial Weight Bearing" },
      { key: "Independent At Home" },
      { key: "Crutches" },
      { key: "Cane" },
      { key: "Wheelchair" },
      { key: "Walker" },
      { key: "No Restrictions" },
      { key: "Other" },
    ];

    ctrl.mentalStatusKeyValue = [];
    ctrl.dmeSuppliesKeyValue = [];
    ctrl.safetyMeasuresKeyValue = [];
    ctrl.nutritionalsKeyValue = [];
    ctrl.allergiesKeyValue = [];
    ctrl.functionalLimitationKeyValue = [];
    ctrl.activityOtherText = "";
    ctrl.otheractivityCheckbox = false;

    ctrl.changesDetectedForAutoSave = false;
    ctrl.medicalOrderForm = {
      orders: [{ discipline: "", frequency: "", duration: "" }],
    };

    ctrl.addMoreOrders = function (form) {
      var lastOrder = ctrl.medicalOrderForm.orders[ctrl.medicalOrderForm.orders.length - 1];
      // Check if the last order has values
      ctrl.isOrderFormValidationActive = true;
      if (lastOrder.discipline && lastOrder.frequency && lastOrder.duration) {
        ctrl.medicalOrderForm.orders.push({
          discipline: "",
          frequency: "",
          duration: "",
        });
      } else {
        toastr.error("Please fill fields for order subform")
      }

      const orderForms = $('[name="orderForm"]');
      orderForms.each(function (index, item) {
        const formGroup = $(item).find('.form-group');
        const disciplineElement = $(item).find('[name="discipline' + index + '"]');
        const frequencyElement = $(item).find('[name="frequency' + index + '"]');
        const durationElement = $(item).find('[name="duration' + index + '"]');
      });

    };

    ctrl.removeOrder = function (index) {
      if (ctrl.medicalOrderForm.orders.length > 1) {
        ctrl.medicalOrderForm.orders.splice(index, 1);
      }
    };

    ctrl.generateFormCall = generateForms;
    ctrl.clearSignatureCall = clearSignature;

    ctrl.dataInit = function () {
      $rootScope.maskLoading();

      ctrl.formUrl = appHelper.dataConfigPath('nursing_assessment_form.json')
      $http.get(ctrl.formUrl).then(async function (res) {
        ctrl.formDefinition = await res.data;
        ctrl.formDefinition.forEach(function (field) {
          ctrl.formDefinitionKeyValue[field.name] = field;
        });
        ctrl.functionalLimitationKeyValue = ctrl.formDefinitionKeyValue["functional_limitations"].options;
        ctrl.mentalStatusKeyValue = ctrl.formDefinitionKeyValue["mental_status"].options;
        ctrl.dmeSuppliesKeyValue = ctrl.formDefinitionKeyValue["dme_supplies"].options;
        ctrl.safetyMeasuresKeyValue = ctrl.formDefinitionKeyValue["special_precations"].options;
        ctrl.nutritionalsKeyValue = ctrl.formDefinitionKeyValue["diet"].options;
        ctrl.allergiesKeyValue = ctrl.formDefinitionKeyValue["allergies"].options;

      })

    };

    function getLatestNursingRecord () {
      $rootScope.maskLoading();
      return PatientRecordDAO.getLatestRecord({ patientId: ctrl.patientId, type: 'Nursing_Assessment', currentPatientRecordId: ctrl.recordId, isDraft: false }).then(function (res) {
        var record;
        record = res;
        delete record["$promise"];
        delete record["$resolved"];

        try {
          // Attempt to parse the JSON string
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

      }).catch(function (data, status) {
        showLoadingBar({
          delay: .5,
          pct: 100,
          finish: function () {
          }
        });
        toastr.error("Failed to retrieve nursing assessment, record not found");
      }).then(function () {
        $rootScope.unmaskLoading();
      });

    }

    ctrl.refreshotherAllergies = function () {
      $timeout(function () {
        $("#otherAllergies").tagsinput(
          "add",
          ctrl.medicalOrderForm.otherAllergies
        );
      });
    };

    /*================   FUNCTION CALLS   ===================*/
    $rootScope.maskLoading();

    Promise.all([ctrl.pageInitCall(),])
      .then(ctrl.generateFormCall)
      .catch(function (error) {
        console.error("Error", error);
      })
      .finally(function () {
        $rootScope.unmaskLoading();
      });


    /*================   FORM FUNCTIONS   ===================*/

    // Function for page initialization
    function pageInit() {
      return PatientRecordDAO.getById(ctrl.patientId, ctrl.recordId)
        .then(async function (res) {
          ctrl.record = res;
          ctrl.patient = res.patient;
          ctrl.patientName = res.patient.fName;
          delete ctrl.record["$promise"];
          delete ctrl.record["$resolved"];

          // Assuming ctrl.record is your original object
          try {
            // Attempt to parse the JSON string
            if (typeof ctrl.record.responses !== 'undefined' && typeof ctrl.record.responses === 'string') {
              ctrl.record.responses = JSON.parse(ctrl.record.responses);
              ctrl.recordformFillData = angular.copy(ctrl.record.responses);
            } else {
              ctrl.record.responses = {};
            }
            if (ctrl.recordformFillData.isDraft == null || ctrl.recordformFillData.isDraft == undefined) {
              ctrl.medicalOrderForm.isDraft = true;
              AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            } else {
              ctrl.medicalOrderForm.isDraft = ctrl.recordformFillData.isDraft;
              console.log(ctrl.medicalOrderForm.isDraft);
              if (ctrl.medicalOrderForm.isDraft == false) {
                AutoSaveService.stop();
              } else {
                AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
              }
            }

            if (!Object.keys(ctrl.recordformFillData).length > 0) {
              await getLatestNursingRecord();
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
          toastr.error("Failed to retrieve medical order record");
          throw data;
        });
    }

    function generateForms() {
      $rootScope.isFormDirty = false;
      ctrl.clearSignatureCall();
      if (ctrl.recordId != '') {
        var res = ctrl.recordformFillData;

        ctrl.medicalOrderForm = {
          certificationPeriodFrom: res?.certificationPeriodFrom || "",
          certificationPeriodTo: res?.certificationPeriodTo || "",
          otherFunctionalLimitations: res?.otherFunctionalLimitations ? res?.otherFunctionalLimitations : "",
          otherMentalStatus: res?.otherMentalStatus ? res?.otherMentalStatus : "",
          otherDmeSupplies: res?.otherDmeSupplies ? res?.otherDmeSupplies : "",
          otherNutritionals: res?.otherNutritionals ? res?.otherNutritionals : "",
          otherAllergies: res?.otherAllergies ? res?.otherAllergies : "",
          prognosis: res?.prognosis || "",
          orders: res?.orders
            ? res?.orders
            : [{ discipline: "", frequency: "", duration: "" }],
          goals: res?.goals || "",
          signature: null,
          signatureDate: res?.signatureDate || ctrl.currentDateWithFormat,
          physicianName: res?.physicianName || "",
          physicianAddress: res?.physicianAddress || "",
          isDraft: res?.isDraft === undefined || res?.isDraft === null || res?.isDraft ? true : false
        };

        ctrl.medicalOrderForm.activityOptions = res?.activityOptions || "";
        ctrl.medicalOrderForm.otheractivitys = res?.otheractivitys
          ? res?.otheractivitys
          : "";
        // check by default if activityOptions has any value
        if (res.activityOptions != null) {
          var activitys = res.activityOptions;
          angular.forEach(ctrl.activityOptionsKeyValue, function (obj) {
            if (activitys.indexOf(obj.key) >= 0) {
              obj.value = true;
            }
          });
        }

        // Functional Limitations and otherFunctionalLimitations
        res.functionalLimitations = res.functionalLimitations ? res.functionalLimitations : ctrl.latestNursingAssessment.functional_limitations ? ctrl.latestNursingAssessment.functional_limitations : '';
        ctrl.medicalOrderForm.functionalLimitations = res?.functionalLimitations || "";
        if (res.functionalLimitations != null) {
          var functionalLimitations = res.functionalLimitations;
          angular.forEach(ctrl.functionalLimitationKeyValue, function (obj) {
            if (functionalLimitations[obj.value] == true) {
              obj.value = true;
              if (obj.title == "Other" && !ctrl.medicalOrderForm.otherFunctionalLimitations && ctrl.latestNursingAssessment[obj.subfield.name] && (ctrl.medicalOrderForm.otherFunctionalLimitations != null || ctrl.medicalOrderForm.otherFunctionalLimitations != "")) {
                ctrl.medicalOrderForm.otherFunctionalLimitations = ctrl.latestNursingAssessment[obj.subfield.name];
              }
            }
          });
        }

        // safety Measures / Special Precaution
        res.safetyMeasures = res.safetyMeasures ? res.safetyMeasures : ctrl.latestNursingAssessment.special_precations ? ctrl.latestNursingAssessment.special_precations : '';
        ctrl.medicalOrderForm.safetyMeasures = res?.safetyMeasures || "";
        if (res.safetyMeasures != null) {
          var safetyMeasureses = res.safetyMeasures;
          angular.forEach(ctrl.safetyMeasuresKeyValue, function (obj) {
            if (safetyMeasureses[obj.value] == true) {
              obj.value = true;
            }
          });
        }




        // Nutritionals and otherNutritionals
        res.nutritionals = res.nutritionals ? res.nutritionals : ctrl.latestNursingAssessment.diet ? ctrl.latestNursingAssessment.diet : '';
        ctrl.medicalOrderForm.nutritionals = res?.nutritionals || "";
        if (res.nutritionals != null) {
          var nutritionalses = res.nutritionals;
          angular.forEach(ctrl.nutritionalsKeyValue, function (obj) {
            if (nutritionalses[obj.value] == true) {
              obj.value = true;
              if (obj.title == "Other" && !ctrl.medicalOrderForm.otherNutritionals && ctrl.latestNursingAssessment[obj.subfield.name] && (ctrl.medicalOrderForm.otherNutritionals != null || ctrl.medicalOrderForm.otherNutritionals != "")) {
                ctrl.medicalOrderForm.otherNutritionals = ctrl.latestNursingAssessment[obj.subfield.name];
              }
            }
          });
        }




        // mental status and othermentalstatus
        res.mentalStatus = res.mentalStatus ? res.mentalStatus : ctrl.latestNursingAssessment.mental_status ? ctrl.latestNursingAssessment.mental_status : '';
        ctrl.medicalOrderForm.mentalStatus = res?.mentalStatus || "";
        if (res.mentalStatus != null) {
          var mentalStatuses = res.mentalStatus;
          angular.forEach(ctrl.mentalStatusKeyValue, function (obj) {
            if (mentalStatuses[obj.value] == true) {
              obj.value = true;
              if (obj.title == "Other" && !ctrl.medicalOrderForm.otherMentalStatus && ctrl.latestNursingAssessment[obj.subfield.name] && (ctrl.medicalOrderForm.otherMentalStatus != null || ctrl.medicalOrderForm.otherMentalStatus != "")) {
                ctrl.medicalOrderForm.otherMentalStatus = ctrl.latestNursingAssessment[obj.subfield.name];
              }
            }
          });
        }


        // dmeSupplies and otherdmeSupplies
        res.dmeSupplies = res.dmeSupplies ? res.dmeSupplies : ctrl.latestNursingAssessment.dme_supplies ? ctrl.latestNursingAssessment.dme_supplies : '';
        ctrl.medicalOrderForm.dmeSupplies = res?.dmeSupplies || "";
        if (res.dmeSupplies != null) {
          var dmeSupplieses = res.dmeSupplies;
          angular.forEach(ctrl.dmeSuppliesKeyValue, function (obj) {
            if (dmeSupplieses[obj.value] == true) {
              obj.value = true;
              if (obj.title == "Other" && !ctrl.medicalOrderForm.otherDmeSupplies && ctrl.latestNursingAssessment[obj.subfield.name] && (ctrl.medicalOrderForm.otherDmeSupplies != null || ctrl.medicalOrderForm.otherDmeSupplies != "")) {
                ctrl.medicalOrderForm.otherDmeSupplies = ctrl.latestNursingAssessment[obj.subfield.name];
              }
            }
          });
        }



        // Allergies and otherAllergies
        res.allergies = res.allergies ? res.allergies : ctrl.latestNursingAssessment.allergies ? ctrl.latestNursingAssessment.allergies : '';
        ctrl.medicalOrderForm.allergies = res?.allergies || "";
        if (res.allergies != null) {
          var allergieses = res.allergies;
          angular.forEach(ctrl.allergiesKeyValue, function (obj) {
            if (allergieses == obj.name) {
              if (obj.title == "Enter Allergies" && !ctrl.medicalOrderForm.otherAllergies && ctrl.latestNursingAssessment[obj.subfield.name] && (ctrl.medicalOrderForm.otherAllergies != null || ctrl.medicalOrderForm.otherAllergies != "")) {
                ctrl.medicalOrderForm.otherAllergies = ctrl.latestNursingAssessment[obj.subfield.name];
              }

            }
          });
        }
        // check by default if any value of otherAllergies and show input
        if (
          ctrl.medicalOrderForm?.otherAllergies != null &&
          ctrl.medicalOrderForm?.otherAllergies != ""
        ) {
          ctrl.refreshotherAllergies();
        }

        //signature
        ctrl.medicalOrderForm.signature = res?.signature
          ? `data:image/png;base64,${res?.signature}`
          : null;

        setupWatch();

      } else {
        ctrl.medicalOrderForm = {
          certificationPeriodFrom: "",
          certificationPeriodTo: "",
          functionalLimitations: "",
          otherFunctionalLimitations: "",
          mentalStatus: "",
          otherMentalStatus: "",
          dmeSupplies: "",
          otherNutritionals: "",
          otherDmeSupplies: "",
          allergies: "",
          otherAllergies: "",
          prognosis: "",
          orders: [{ discipline: "", frequency: "", duration: "" }],
          goals: "",
          signature: null,
          signatureDate: ctrl.currentDateWithFormat,
          physicianName: "",
          physicianAddress: "",
        };
      }
    }

    function clearSignature() {
      ctrl.medicalOrderForm.signature = "";
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      if (!$("#med_Order_form")[0].checkValidity()) {
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {

      ctrl.isOrderFormValidationActive = true;

      var medicalOrderFormToSave = angular.copy(ctrl.medicalOrderForm);
      // signature
      medicalOrderFormToSave.signature = medicalOrderFormToSave.signature
        ? medicalOrderFormToSave.signature.substring(
          medicalOrderFormToSave.signature.indexOf(",") + 1
        )
        : null;

      // ActivityOtions
      medicalOrderFormToSave.activityOptions = [];
      angular.forEach(ctrl.activityOptionsKeyValue, function (obj) {
        if (obj.value == true) {
          medicalOrderFormToSave.activityOptions.push(obj.key);
        }

        // otheractivitys
        if (
          (obj.value == false && obj.key == "Other") ||
          (obj.value == true &&
            obj.key == "Other" &&
            (medicalOrderFormToSave.otheractivitys == "" || medicalOrderFormToSave.otheractivitys == null || medicalOrderFormToSave.otheractivitys == undefined))
        ) {
          delete medicalOrderFormToSave.otheractivitys;
        }

      });
      medicalOrderFormToSave.activityOptions =
        medicalOrderFormToSave.activityOptions.toString();

      // functional Limitation
      medicalOrderFormToSave.functionalLimitations = {};
      angular.forEach(ctrl.functionalLimitationKeyValue, function (obj) {
        if (obj.value == true) {
          medicalOrderFormToSave.functionalLimitations[obj.name] = true; // change id into name

        }
        // otherFunctionalLimitations
        if (
          (obj.value == false && obj.title == "Other") || (obj.value == 'other' && obj.title == "Other") ||
          (obj.value == true &&
            obj.title == "Other" &&
            (medicalOrderFormToSave.otherFunctionalLimitations == "" ||
              medicalOrderFormToSave.otherFunctionalLimitations == null ||
              medicalOrderFormToSave.otherFunctionalLimitations == undefined))
        ) {
          delete medicalOrderFormToSave.otherFunctionalLimitations;
        }
      });

      // safetyMeasures
      medicalOrderFormToSave.safetyMeasures = {};
      angular.forEach(ctrl.safetyMeasuresKeyValue, function (obj) {
        if (obj.value == true) {
          medicalOrderFormToSave.safetyMeasures[obj.name] = true;
        }
      });

      // Nutritionals
      medicalOrderFormToSave.nutritionals = {};
      angular.forEach(ctrl.nutritionalsKeyValue, function (obj) {
        if (obj.value == true) {
          medicalOrderFormToSave.nutritionals[obj.name] = true;
        }
        // otherNutritionals
        if (
          (obj.value == false && obj.title == "Other") || (obj.value == 'diet_other' && obj.title == "Other") ||
          (obj.value == true &&
            obj.title == "Other" &&
            (medicalOrderFormToSave.otherNutritionals == "" ||
              medicalOrderFormToSave.otherNutritionals == null ||
              medicalOrderFormToSave.otherNutritionals == undefined))
        ) {
          delete medicalOrderFormToSave.otherNutritionals;
        }
      });

      // mentalStatus
      medicalOrderFormToSave.mentalStatus = {};
      angular.forEach(ctrl.mentalStatusKeyValue, function (obj) {
        if (obj.value == true) {
          medicalOrderFormToSave.mentalStatus[obj.name] = true;
        }
        // otherMentalStatus
        if (
          (obj.value == false && obj.title == "Other") || (obj.value == 'other_mental_status' && obj.title == "Other") ||
          (obj.value == true &&
            obj.title == "Other" &&
            (medicalOrderFormToSave.otherMentalStatus == "" ||
              medicalOrderFormToSave.otherMentalStatus == null ||
              medicalOrderFormToSave.otherMentalStatus == undefined))
        ) {
          delete medicalOrderFormToSave.otherMentalStatus;
        }
      });

      // dmeSupplies
      medicalOrderFormToSave.dmeSupplies = {};
      angular.forEach(ctrl.dmeSuppliesKeyValue, function (obj) {
        if (obj.value == true) {
          medicalOrderFormToSave.dmeSupplies[obj.name] = true;
        }
        // otherDmeSupplies
        if (
          (obj.value == false && obj.title == "Other") || (obj.value == 'other' && obj.title == "Other") ||
          (obj.value == true &&
            obj.title == "Other" &&
            (medicalOrderFormToSave.otherDmeSupplies == "" ||
              medicalOrderFormToSave.otherDmeSupplies == null ||
              medicalOrderFormToSave.otherDmeSupplies == undefined))
        ) {
          delete medicalOrderFormToSave.otherDmeSupplies;
        }
      });

      // allergies
      // otherAllergies
      if ((medicalOrderFormToSave?.allergies != "Enter Allergies") ||
        (medicalOrderFormToSave?.allergies == "Enter Allergies" && (medicalOrderFormToSave?.otherAllergies == "" || medicalOrderFormToSave?.otherAllergies == null || medicalOrderFormToSave?.otherAllergies == undefined))
      ) {
        delete medicalOrderFormToSave.otherAllergies;
      }

      medicalOrderFormToSave.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;

      var medicalOrderFormToSaveWithRecord = angular.copy(ctrl.record);
      medicalOrderFormToSaveWithRecord.responses = JSON.stringify(medicalOrderFormToSave);
      medicalOrderFormToSaveWithRecord.expiryDate = ctrl.medicalOrderForm.certificationPeriodTo

      if (medicalOrderFormToSave.isDraft == false) {

        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(medicalOrderFormToSaveWithRecord)
            .then((res) => {
              // ctrl.generateFormCall();
              $rootScope.isFormDirty = false;
              toastr.success("Medical Order updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }

              // $state.go('app.complaints', { status: 'open' });
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Medical Order.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        PatientRecordDAO.update(medicalOrderFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }


    };

    /*================   UTILITY FUNCTIONS   ===================*/

    $scope.$watch(
      function () {
        return ctrl.medicalOrderForm?.otherAllergies;
      },
      function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if (newVal) {
            ctrl.refreshotherAllergies();
          }
        }
      }
    );

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    };

    function setupWatch() {
      $scope.$watch(
        function () {
          return {
            medicalOrderForm: ctrl.medicalOrderForm,
            functionalLimitationKeyValue: ctrl.functionalLimitationKeyValue,
            mentalStatusKeyValue: ctrl.mentalStatusKeyValue,
            dmeSuppliesKeyValue: ctrl.dmeSuppliesKeyValue,
            safetyMeasuresKeyValue: ctrl.safetyMeasuresKeyValue,
            nutritionalsKeyValue: ctrl.nutritionalsKeyValue,
            allergiesKeyValue: ctrl.allergiesKeyValue,
            activityOptionsKeyValue: ctrl.activityOptionsKeyValue

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

  }
  angular
    .module("xenon.controllers")
    .controller("MedicalOrdersCtrl", [
      "$rootScope",
      "$filter",
      "PatientRecordDAO",
      "$state",
      "$stateParams",
      "$http",
      "$timeout",
      "$scope",
      "Page",
      "AutoSaveService",
      "UtilService",
      MedicalOrdersCtrl,
    ]);
})();
