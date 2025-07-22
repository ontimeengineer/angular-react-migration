(function () {
  function NursingAssessmentCtrl(
    $rootScope,
    $stateParams,
    PatientDAO,
    PatientRecordDAO,
    $state,
    $http,
    $window,
    $timeout,
    AutoSaveService,
    $scope,
    $filter,
    $modal,
    Page,
    UtilService,
    PrintTitleService
  ) {
    'use strict';
    var ctrl = this;
    Page.setTitle("Patient Record - Nursing Assessment Form");
    ctrl.formUrl = appHelper.dataConfigPath('nursing_assessment_form.json');
    ctrl.patient = {}
    ctrl.record = [];
    ctrl.recordformFillData = [];
    ctrl.patientId = $stateParams.patientId;
    ctrl.recordType = $stateParams.recordType;
    ctrl.recordId = $stateParams.id;
    ctrl.currentDate = new Date();
    ctrl.formDefinition = []
    ctrl.formData = {};
    ctrl.selectedRadios = {};
    ctrl.subFields = {}; // Responsible for sending data in FormData
    ctrl.checkBoxSubs = {}; // Keeps track of showing subfields
    ctrl.checkBoxes = {}
    ctrl.showSibs = {};
    ctrl.oneSelectors = {}
    ctrl.listChecks = {}
    ctrl.previousRadio = {} // Responsible for previous radio buttons to be removed from formdata when some other is selected
    ctrl.pageInitCall = pageInit;
    ctrl.tagsObj = {}
    ctrl.getFormDataCall = getFormData;
    ctrl.populateFormCall = populateForm;
    ctrl.clearSignatureCall = clearSignature;
    ctrl.medicationFrequency = angular.copy(ontime_data.medicationFrequency);
    ctrl.medicationRoutes = angular.copy(ontime_data.medicationRoutes);
    ctrl.changesDetectedForAutoSave = false;

    ctrl.medicationsData = [];
    ctrl.medicationChangePopulateCall = medicationChangePopulate;
    ctrl.addFdaMedication = addFdaMedicationPopUp;

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
      $(document).ready(function ($) {
        setTimeout(function () {
          $('#medications' + (index)).select2({
            placeholder: 'Select Medication',
          }).on('select2-open', function () {
            $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
          });
        }, 200);
      });

      var selectedMedication = ctrl.medicationsData.find(item => item.id == medicationObj.id);

      if (update)
      $scope.initializeSelect2(index, medicationObj);

      if (selectedMedication) {
        const medication = ctrl.medicalReconciliationForm.medications[index];
        medication.id = selectedMedication.id;
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
        if (medication.frequency == 'Other') {
          medication.frquencyOther = update ? medicationObj.frquencyOther : selectedMedication.frquencyOther;
        }
        if (medication.freqOrderComments) {
          medication.freqOrderOther = update ? medicationObj.freqOrderOther : selectedMedication.freqOrderOther;
        }
      }
    }

    async function pageInit() {
        $rootScope.maskLoading();
        PatientRecordDAO.getById(ctrl.patientId, ctrl.recordId, true).then(function (res) {
          ctrl.record = res;
          ctrl.patient = res?.patient;
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

          // Assuming ctrl.record is your original object
          try {
            // Attempt to parse the JSON string
            if (typeof ctrl.record.responses !== 'undefined' && typeof ctrl.record.responses === 'string') {
              ctrl.record.responses = JSON.parse(ctrl.record.responses);
              ctrl.recordformFillData = angular.copy(ctrl.record.responses);
            }
            
            ctrl.getFormDataCall();
          } catch (error) {
            ctrl.record.responses = {}; // Set to an empty object or handle appropriately
          }

        }).catch(function (data, status) {
          showLoadingBar({
            delay: .5,
            pct: 100,
            finish: function () {
            }
          });
          toastr.error("Failed to retrieve nurssing assessment record");
        }).then(function () {
          $rootScope.unmaskLoading();
        });
    }

    ctrl.pageInitCall();

    /*================   FORM BUILDER   ===================*/
    function getFormData() {
      $http.get(ctrl.formUrl).then(async function (result) {
        $rootScope.isFormDirty = false;
        ctrl.formDefinition = await result.data;
        ctrl.makeFormData()

        ctrl.populateFormCall(ctrl.recordformFillData)

        if (ctrl.recordformFillData.isDraft == null || ctrl.recordformFillData.isDraft == undefined) {
          ctrl.formData.isDraft = true;
          AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
        } else {
          ctrl.formData.isDraft = ctrl.recordformFillData.isDraft;
          if (ctrl.formData.isDraft == false) {
            AutoSaveService.stop();
          } else {
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
          }
        }

        //medications
        var res = ctrl.recordformFillData;
        // Initialize form data
        ctrl.medicalReconciliationForm = {
          medications: res?.medications || [{ id: '', medicineName: '', dosageQuantity: null, dosageQuantityUnit: '', type: '', frequency: '', frquencyOther: '', route: '', purpose: '', sideEffects: '', contraindication: '', freqOrder: 'withMeals', freqOrderComments: false, freqOrderOther: '', }]
        }
        if (ctrl.medicalReconciliationForm?.medications?.length) {
          ctrl.medicalReconciliationForm?.medications.forEach((item, i) => {
            medicationChangePopulate(i, item, true);
          })
        }

        $timeout(function () {
          ctrl.formDefinition.forEach(function (field) {
            if (field.type === 'tags') {
              ctrl.initSelect2(field.id, field.name);
            }
          });
        });

        setupWatch();

      }).catch(function (data, status) {
        showLoadingBar({
          delay: .5,
          pct: 100,
          finish: function () {
          }
        });
        toastr.error("Failed to load form");
        $window.history.back();
      })
    }

    function populateForm(response) {
      //signature
      ctrl.formData['signature'] = response?.signature
        ? `data:image/png;base64,${response?.signature}`
        : null;

      for (var key in response) {
        if (response.hasOwnProperty(key)) {
          var field = ctrl.formDefinition.find(function (formField) {
            return formField.name === key;
          });

          if (field) {
            switch (field.type) {
              case 'text':
              case 'date':
              case 'phone':
                ctrl.formData[field.name] = response[key];
                if (field.name == "emergency_contact_name") {
                  ctrl.formData[field.name] = ctrl?.patient?.secondaryContactName;
                }
                if (field.name == "emergency_contact_number") {
                  ctrl.formData[field.name] = ctrl?.patient?.secondaryContactNumber;
                }
                break;

              // Handle other cases as needed
              case 'textarea':
              case 'number':
                ctrl.formData[field.name] = response[key];
                break;

              case 'select':
                field.options.find(function (option, i) {
                  if (option.value === response[key]) {
                    ctrl.formData[field.name] = response[key];
                    option.selected = true
                  }
                  return option.value === response[key];
                });
                break;

              case 'listing':
                createScoreListing(field, response[key]);
                break;

              case 'tags':
                ctrl.tagsGenerator(field, response[key]);
                break;

              case 'multiInput':
                ctrl.multiInputGenerator(field, response[key]);
                break;

              case 'multigroup':
                ctrl.formData[field.name] = []; // Clear existing data
                ctrl.createNestedArray(field, false, response[key]);
                break;

              // Add more cases for other field types as needed
              case 'radiocheck':
                setRadiosChecks(field, response[key]);
                break;

              default:
                break;
            }
          }
        }
      }
    };

    ctrl.makeFormData = function () {
      angular.forEach(ctrl.formDefinition, function (field) {
        switch (field.type) {
          case 'text':
          case 'date':
          case 'select':
          case 'textarea':
          case 'phone':
            ctrl.formData[field.name] = '';
            if (field.name == "emergency_contact_name") {
              ctrl.formData[field.name] = ctrl?.patient?.secondaryContactName;
            }
            if (field.name == "emergency_contact_number") {
              ctrl.formData[field.name] = ctrl?.patient?.secondaryContactNumber;
            }
            break;
          case 'number':
            ctrl.formData[field.name] = 0;
            break;            
          case 'radiocheck':
            setRadiosChecks(field)
            break;
          case 'listing':
            createScoreListing(field)
            break;
          case 'multigroup':
            ctrl.createNestedArray(field)
            break;
          case 'tags':
            ctrl.tagsGenerator(field);
            break;
          case 'multiInput':
            ctrl.multiInputGenerator(field);
          default:
            break;
        }
      });
    }

    // Add the checkCustomValidation function to your controller
    ctrl.checkCustomValidation = function (fieldName) {
      var field = ctrl.formDefinition.find(function (formField) {
        return formField.name === fieldName;
      });

      if (field && field.validation) {
        // field.validation.required && !ctrl.formData[fieldName] - for required
        // field.validation.number && isNaN(ctrl.formData[fieldName] - for number

        if (field.validation.maxlength && ctrl.formData[fieldName].toString().length > field.validation.maxlength) {
          ctrl.formData[fieldName] = parseInt(ctrl.formData[fieldName].toString().slice(0, field.validation.maxlength));
        }
      }
    };


    function setRadiosChecks(field, responseData) {
      if (responseData) {
        if (field.subtype === 'radio') {
          if (field.name == 'evacuation_level') {
            ctrl.formData[field.name] = ctrl.patient.priorityCode == 10 ? 'tal1' : ctrl.patient.priorityCode == 20 ? 'tal2' : 'tal3';
            return;
          }
          field.options.forEach(function (option) {
            if (responseData === option.value) {
              option.selected = true;
              ctrl.formData[field.name] = option.value;
              ctrl.selectedRadios[field.name] = option.value;
              if (option.subfield) {
                const fieldfind = ctrl.findFieldByName(field.name);
                const subfield = fieldfind.options.find(nam => {
                  if (nam?.subfield) {
                    if (nam?.subfield?.name == option?.subfield?.name) {
                      const subFieldVal = ctrl.recordformFillData[option?.subfield?.name];

                      if (subFieldVal !== undefined && subFieldVal !== null) {
                        const subfieldName = nam?.subfield?.name;
                        const subfieldType = option?.subfield?.type;

                        switch (subfieldType) {
                          case 'text':
                          case 'date':
                            ctrl.subFieldChanged(subfieldName, subFieldVal, true);
                            break;
                          case 'select':
                            // For select, you might need to find the corresponding option and set its value
                            option?.subfield?.options.find(opt => {
                              if (opt.value === subFieldVal) {
                                ctrl.formData[option?.subfield?.name] = subFieldVal;
                                option.selected = true
                                ctrl.subFieldChanged(subfieldName, subFieldVal, true);
                              }
                            });
                            break;

                          case 'tags':
                            // For select, you might need to find the corresponding option and set its value
                            ctrl.formData[option?.subfield?.name] = subFieldVal;
                            ctrl.tagsGenerator(option?.subfield, subFieldVal)
                            ctrl.subFieldChanged(subfieldName, subFieldVal, true);
                            break;

                          // Add more cases if needed
                          case 'multiInput':
                            ctrl.formData[subfieldName] = subFieldVal;
                            ctrl.subFieldChanged(subfieldName, subFieldVal, true);
                            ctrl.multiInputGenerator(nam?.subfield, subFieldVal);
                            break;

                          default:
                            // Handle other subfield types if necessary
                            break;
                        }
                      }
                    }
                  }
                })
              }
            }
          });
        } else if (field.subtype === 'checkbox') {
          if (field.dbType === 'array') {
            ctrl.formData[field.name] = responseData || [];

            if (responseData[field?.oneSelector?.id] === true) {
              ctrl.oneSelectors[field?.oneSelector?.id] = true;
              ctrl.formData[field.name] = responseData;
              field.oneSelector.selected = true;
              ctrl.oneSelectorChanged(field?.oneSelector?.id, true, field);
              return
            }

            angular.forEach(field.options, option => {
              const optionValueIncluded = responseData.includes(option.value)

              //field.dbType === 'array' others match
              if (optionValueIncluded) {
                option.checked = true;

                if (option.subfield) {

                  if (option?.subfield?.name) {
                    const subFieldVal = ctrl.recordformFillData[option?.subfield?.name];
                    ctrl.formData[option?.subfield?.name] = subFieldVal;

                    ctrl.checkBoxSubs[option?.id] = option?.id;
                    ctrl.subFieldChanged(option.subfield?.name, subFieldVal, true)

                    switch (option?.subfield?.type) {
                      case 'tags':
                        ctrl.tagsGenerator(option?.subfield, subFieldVal)
                        break;

                      // Add more cases if needed
                      case 'multiInput':
                        //field.dbType === 'array' subfields multiInput
                        ctrl.multiInputGenerator(option.subfield, subFieldVal);
                        break;

                      default:
                        // Handle other subfield types if necessary
                        break;
                    }

                  }

                }

              }
              else {
                //default checked false when there is response
                option.checked = false;
              }
            });
            return;
          }

          ctrl.formData[field.name] = {};

          if (responseData[field?.oneSelector?.id] === true) {
            ctrl.oneSelectors[field?.oneSelector?.id] = true;
            ctrl.formData[field.name] = responseData;
            field.oneSelector.selected = true;
            ctrl.oneSelectorChanged(field?.oneSelector?.id, true, field);
            return
          }

          angular.forEach(field.options, option => {
            const optionValue = responseData[option.value];
            if (optionValue === true) {
              option.checked = true;
              ctrl.formData[field.name][option.value] = true;

              if (option?.subfield) {
                if (option?.subfield?.name) {
                  const subFieldVal = ctrl.recordformFillData[option?.subfield?.name];
                  ctrl.formData[option?.subfield?.name] = subFieldVal;
                  ctrl.checkBoxSubs[option?.id] = option?.id;
                  ctrl.subFieldChanged(option.subfield?.name, subFieldVal, true)

                  switch (option?.subfield?.type) {
                    case 'tags':
                      //field.dbType === 'object' options and subfields
                      ctrl.tagsGenerator(option?.subfield, subFieldVal)
                      break;

                    // Add more cases if needed
                    case 'multiInput':
                      //field.dbType === 'object' subfields multiInput
                      ctrl.multiInputGenerator(option.subfield, subFieldVal);
                      break;

                    default:
                      // Handle other subfield types if necessary
                      break;
                  }


                }
              }

              const showSibs = ctrl.showSibs;
              if (option.siblings) {
                const sibs = option.siblings.split(',');
                angular.forEach(sibs, sib => {
                  if (sib in showSibs)
                    delete showSibs[sib];
                  else
                    showSibs[sib] = sib;
                })
              }

            }
            else {
              //default checked false when there is response
              option.checked = false;
            }
          });

        }
      } else {
        if (field.subtype == 'radio') {
          const selected = field.options.find(option => option.selected);
          ctrl.formData[field.name] = selected ? selected.value : '';
          ctrl.selectedRadios[field.name] = selected ? selected.value : '';
        }
        if (field.subtype == 'checkbox') {
          if (field.dbType === 'array') {
            ctrl.formData[field.name] = [];
            return
          }
          ctrl.formData[field.name] = {};
          angular.forEach(field.options, option => {
            ctrl.formData[field.name][option.value] = Boolean(option.checked);
          });
        }
      }
    }

    ctrl.radioChanged = function (fieldName, option, value) {
      const previousRadio = ctrl.previousRadio;

      if (option.subfield) {
        ctrl.subFieldChanged(option.subfield?.name)
        previousRadio[fieldName] = option.subfield?.name;
        //initialize initSelect2 on radio change
        if (option.subfield.type == "tags") {
          ctrl.tagsGenerator(option?.subfield, null)
        }
      } else {
        ctrl.subFieldChanged(previousRadio[fieldName], '', true)
      }

    };

    function createScoreListing(field, responseData) {
      if (field.dbType === 'array') {
        // Handle the case when when dbType is 'array'
        if (field.dbType === 'array') {
          ctrl.formData[field.name] = [];
        }
        return;
      }

      if (field.dbType === 'object' && responseData) { //when not create new, on edit mode
        ctrl.formData[field.name] = {};

        field.options.forEach(option => {
          const optionValue = responseData[option.value];
          if (field.subtype === 'score') {
            // Handle score type
            if (!ctrl.formData[field.name][field.total])
              ctrl.formData[field.name][field.total] = 0;

            if (optionValue === true) {
              ctrl.formData[field.name][option.value] = optionValue;
              ctrl.listCheckChanged(true, option, field)
              option.checked = true;
            } else {
              ctrl.formData[field.name][option.value] = optionValue;
            }
          } else if (field.subtype === 'radioselector') {
            // Handle radio selector type
            const selectedSuboption = option.suboptions.find(suboption => {
              if (suboption.value === optionValue) {
                //check which one is matched with responseData in edit mode then selected and checked true 
                ctrl.formData[field.name][option.value] = optionValue;
                suboption.selected = true;
                suboption.checked = true;
              } else {
                //already selected N/A remove when form initialize by default selected
                suboption.selected = false;
                suboption.checked = false;
              }

            });

          }
        });

        if (field.subtype === 'score') {
          // Calculate total score
          const totalScore = field.options.reduce((total, option) => {
            return total + (ctrl.formData[field.name][option.value] ? option.points : 0);
          }, 0);

          ctrl.formData[field.total] = totalScore;
        }

      } else if (!responseData && field.dbType === 'object') { //when create new Handle the case when when dbType is object and responseData is undefined
        ctrl.formData[field.name] = {};
        field.options.forEach(option => {
          ctrl.formData[field.name][option.value] = false;
        });

        if (field.subtype == 'radioselector') {
          angular.forEach(field.options, option => {
            const selected = option.suboptions.find(opt => opt.selected);
            ctrl.formData[field.name][option.value] = selected ? selected.value : undefined;
          });
        }

      }
    }

    /*================   LIST FUNCS   ===================*/
    ctrl.listCheckChanged = function (value, option, field) {
      const { listChecks } = ctrl;
      const formDataListChecks = ctrl.formData[field.name];
      if (option.value in listChecks) {
        delete listChecks[option.value];
        formDataListChecks[field.total] -= option.points;
      } else {
        listChecks[option.value] = value;
        formDataListChecks[field.total] = (formDataListChecks[field.total] || 0) + option.points;
      }
      formDataListChecks[option.value] = value;
    };

    ctrl.createNestedArray = function (field, action, data) {
      if (!angular.isArray(ctrl.formData[field.name]))
        ctrl.formData[field.name] = [];
      //CLICK ON REMOVE BUTTON ACTION IS TRUE
      if (action) {
        ctrl.formData[field.name].splice(-1);
        return;
      }
      //BINDING DATA IN EDIT MODE
      if (data && angular.isArray(data)) {
        data.forEach(item => {
          let newObj = {};
          angular.forEach(field.options, option => {
            if (option.type === 'select') {
              let selectedOption = option.select_options.find(selectOption => selectOption.value === item[option.value]);
              newObj[option.value] = selectedOption ? selectedOption.value : '';
            } else {
              newObj[option.value] = item[option.value] || '';
            }
          });
          ctrl.formData[field.name].push(newObj);
        });
      } else {
        //CLICK ON ADD MODE BUTTON
        let newObj = {};
        angular.forEach(field.options, option => {
          newObj[option.value] = '';
        });
        ctrl.formData[field.name].push(newObj);
      }

    }

    ctrl.tagsGenerator = function (field, selectedTags) {
      ctrl.formData[field.name] = selectedTags || [];
      $timeout(function () {
        ctrl.initSelect2(field.id, field.name);
      });
    };

    ctrl.multiInputGenerator = function (field, selectedMultiInput) {
      ctrl.formData[field.name] = selectedMultiInput || [];

      $timeout(function () {
        ctrl.multiInput2(field.id, selectedMultiInput);
      });
    };

    ctrl.groupCaller = function (members, fieldName, option, value, fieldObj) {
      const { selectedRadios, checkBoxes } = ctrl;
      angular.forEach(members, member => {
        if (member.checktype === 'radio') {
          if (fieldName === 'patient_pain' && value === 'no') {
            const field = ctrl.findFieldByName(member.name);
            const subfield = field.options.find(nam => {
              if (nam?.subfield) {
                ctrl.subFieldChanged(nam?.subfield?.name, '', true)
              }
            })

            fieldObj?.options.find(painOption => {
              if (painOption?.subfield) {
                delete ctrl.formData[painOption?.subfield?.name];
                delete ctrl.subFields[painOption?.subfield?.name];
              }
            })
          }
          selectedRadios[member.name] = member.value;

        } else if (member.checktype === 'checkbox') {

          const field = ctrl.findFieldByName(member.name);
          const subfield = field.options.find(nam => {
            if (nam.id != member.id) {
              checkBoxes[nam.id] = false;
              if (nam?.checked === true) {
                nam.checked = false;//unchecked checkbox
              }
              ctrl.handleCheckboxChange(false, field.dbType, field.name, nam);
              if (nam?.subfield) {
                if (nam?.subfield?.name) {
                  delete ctrl.formData[nam?.subfield?.name];
                }

                if (nam?.subfield?.name in ctrl.subFields) {
                  ctrl.showSubField(nam);
                }
              }
            }
            else {
              checkBoxes[member.id] = true;
              ctrl.handleCheckboxChange(true, field.dbType, field.name, nam);
            }

          })
        }
      });
    }

    function clearSignature() {
      ctrl.formData.signature = "";
    }

    // Function to find a field in the form definition by name
    ctrl.findFieldByName = function (fieldName) {
      var findObj = ctrl.formDefinition.find(field => field.name === fieldName);
      return findObj;
    };

    ctrl.handleCheckboxChange = function (value, type, fieldName, option) {
      const arr = ctrl.formData[fieldName];
      const showSibs = ctrl.showSibs;
      if (type == 'array') {
        const index = arr.indexOf(option.value);
        if (index != -1) {
          arr.splice(index, 1);
        } else {
          arr.push(option.value);
        }
        // // //initialize initSelect2 on radio change
        if (option?.subfield?.type == "tags") {
          ctrl.tagsGenerator(option?.subfield)
        }
      }
      else if (type == 'object') {
        arr[option.value] = value;

        //delete if subfield is exist in formData when edit mode data change not first time add
        if (value == false && option?.subfield) {
          if (ctrl.formData[option?.subfield?.name]) {
            delete ctrl.formData[option?.subfield?.name];
          }
        }

        // //initialize initSelect2 on radio change
        if (option?.subfield?.type == "tags") {
          ctrl.tagsGenerator(option?.subfield)
        }
      }

      if (option.siblings) {
        const sibs = option.siblings.split(',');
        angular.forEach(sibs, sib => {
          if (sib in showSibs)
            delete showSibs[sib];
          else
            showSibs[sib] = sib;

          if (value == false && ctrl?.formData[fieldName][sib]) {
            delete ctrl?.formData[fieldName][sib];
          }
        })
      }
    }

    ctrl.oneSelectorChanged = function (id, value, field) {
      if (value) {
        ctrl.formData[field.name] = { [id]: true }
        field.options.forEach(option => {
          if (option.checked === true) {
            option.checked = false;

            if (option?.subfield && option?.subfield?.name) {
              delete ctrl.formData[option.subfield.name];
            }

          }
          ctrl.checkBoxes[option.id] = false
          if (option.id in ctrl.checkBoxSubs)
            ctrl.showSubField(option)
        })
      } else {
        ctrl.formData[field.name] = field.dbType === 'object' ? {} : [];
        const optionsArr = ctrl.formData[field.name];
        field.options.forEach(option => {
          optionsArr[option.value] = false;
        })
      }
    }

    /*================   SUB FIELDS   ===================*/
    ctrl.showSubField = function (option) {
      const checkBoxSubsArr = ctrl.checkBoxSubs;
      if (option.id in checkBoxSubsArr) {
        delete checkBoxSubsArr[option.id];
        ctrl.subFieldChanged(option.subfield?.name, '', true)
      }
      else {
        checkBoxSubsArr[option.id] = option.id;
        ctrl.subFieldChanged(option.subfield?.name)
      }
    }

    ctrl.subFieldChanged = function (subfieldName, value, check) {
      const subFields = ctrl.subFields;
      if (check && subfieldName in subFields) {
        delete subFields[subfieldName];
      } else {
        subFields[subfieldName] = value || '';
      }
    }

    ctrl.subFieldDateChanged = function (subfield) {
      ctrl.subFields[subfield.name + '_pdf'] = $filter('date')(ctrl.subFields[subfield.name], 'MM-dd-yyyy');      
    }

    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    }

    ctrl.submitDraft = function () {
      AutoSaveService.stop();
      ctrl.changesDetectedForAutoSave = false;
      ctrl.saveForm(true);
    }

    ctrl.submitForm = function () {
      if (!$('#edit_patient_form')[0].checkValidity()) {
        return;
      } else {
        ctrl.saveForm(false);
      }
    }

    ctrl.saveForm = function (isDraftVal) {

      const nursingAssessmentForm = { ...ctrl.formData, ...ctrl.selectedRadios, ...ctrl.subFields }

      nursingAssessmentForm.signature = nursingAssessmentForm.signature
        ? nursingAssessmentForm.signature.substring(
          nursingAssessmentForm.signature.indexOf(",") + 1
        )
        : null;


      nursingAssessmentForm.isDraft = isDraftVal;
      ctrl.record.isDraft = isDraftVal;

      nursingAssessmentForm.medications = [];
      nursingAssessmentForm.medications = ctrl.medicalReconciliationForm.medications;
      // HERE IS THE OUTPUT OBJECT WITH KEY VALUE PAIRS

      // save emergency contact update if change
      if (nursingAssessmentForm["emergency_contact_name"] != ctrl?.patient?.secondaryContactName || nursingAssessmentForm["emergency_contact_number"] != ctrl?.patient?.secondaryContactNumber || compareEvacLevel(nursingAssessmentForm["evacuation_level"], ctrl.patient.priorityCode, ctrl.patient.transporatationAssistance)) {
        const evacLevelValue = nursingAssessmentForm["evacuation_level"] == 'tal1' ? 10 : nursingAssessmentForm["evacuation_level"] == 'tal2' ? 20 : 30;
        PatientDAO.updateEmergencyInfo({
          id: ctrl.patient.id,
          data: {
            secondaryContactType: ctrl.patient.secondaryContactType,
            secondaryContactName: nursingAssessmentForm["emergency_contact_name"] || "",
            secondaryContactNumber: nursingAssessmentForm["emergency_contact_number"] || "",
            priorityCode : evacLevelValue,
            transporatationAssistance : evacLevelValue
          }
        }).then(function (res) {
          // Update Successful;
        }).catch((err) => {
          toastr.error("Failed to update patient information.");
        })

      }

      var nursingAssessmentFormToSave = angular.copy(nursingAssessmentForm);
      var nursingAssessmentFormToSaveWithRecord = angular.copy(ctrl.record);
      nursingAssessmentFormToSaveWithRecord.responses = JSON.stringify(nursingAssessmentFormToSave);

      if (nursingAssessmentForm.isDraft == false) {
        //save on click submit button, not autosave
        $rootScope.maskLoading();
        if (ctrl.recordId != '') {
          PatientRecordDAO.update(nursingAssessmentFormToSaveWithRecord)
            .then((res) => {

              $rootScope.isFormDirty = false;
              toastr.success("Nursing Assessment updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }
              $state.go("app.patient_records_patient", {
                patientId: ctrl.patientId,
              });
            })
            .catch((err) => {
              toastr.error("Unable to update the Nursing Assessment.");
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      } else {
        PatientRecordDAO.update(nursingAssessmentFormToSaveWithRecord)
          .then((res) => {
            $rootScope.isFormDirty = false;
            AutoSaveService.init(ctrl.submitDraft, ctrl.changesDetectedForAutoSave);
            toastr.success("Saved to draft");
          })
      }

    };

    function compareEvacLevel (levelColor, pCode, tal) {
      if (levelColor === 'tal1' && pCode === 10 && tal === 10) 
        return false;
      else if (levelColor === 'tal2' && pCode === 20 && tal === 20) 
        return false;
      else if (levelColor === 'tal3' && pCode === 30 && tal === 30)
        return false;
      return true;
    }

    ctrl.setMaxDate = function (days) {
      var currentDate = new Date();
      var maxDate = new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);
      return maxDate.toISOString().split('T')[0];
    }

    ctrl.initSelect2 = function (fieldId, fieldName) {
      $("#" + fieldId).select2({
        placeholder: 'Select ' + fieldName + '...'
      }).on('select2-open', function () {
        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
      });
    }

    ctrl.multiInput2 = function (fieldId, fieldVal) {
      $("#" + fieldId).tagsinput(
        "add",
        fieldVal
      );
    }

    // Form initialization
    function initializeFormData() {
      ctrl.medicalReconciliationForm = {
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

    function addFdaMedicationPopUp(editMode) {
      // Call this function to stop autosaving
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
          AutoSaveService.init(ctrl.submitForm, ctrl.changesDetectedForAutoSave);
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
            formData: ctrl.formData,
            selectedRadios: ctrl.selectedRadios,
            subFields: ctrl.subFields,
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
  angular.module('xenon.controllers').controller('NursingAssessmentCtrl', [
    "$rootScope",
    "$stateParams",
    "PatientDAO",
    "PatientRecordDAO",
    "$state",
    "$http",
    "$window",
    "$timeout",
    "AutoSaveService",
    "$scope",
    "$filter",
    "$modal",
    "Page",
    "UtilService",
    "PrintTitleService",
    NursingAssessmentCtrl
  ]);
})();