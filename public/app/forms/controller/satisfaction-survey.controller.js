
(function () {
  function SatisfactionSurveyController(
    $timeout,
    $rootScope,
    PatientDAO,
    EmployeeDAO,
    SatisfactionSurveyDAO,
    UtilService,
    $location,
    $anchorScroll,
    Page
  ) {
    var ctrl = this;
    Page.setTitle("Add Survey");
    ctrl.currentDate = new Date();
    ctrl.servicesKeyValue = [];
    ctrl.isSurveyStarted = false; 
    ctrl.patientList = [];
    ctrl.employeeList = [];
    ctrl.formSubmitted = false;
    ctrl.surveyMainForm = {};
    ctrl.surveyForm = {};
    services = {};
    ctrl.clientSurveyQuestions = [
      { title: 'Were you satisfied with the care you received?', reasonBox: true, name: 'careSatisfaction', options: ['Yes', 'No'] },
      { title: 'Did you participate in your plan of care?', reasonBox: false, name: 'participatePlanOfCare', options: ['Yes', 'No'] },
      { title: 'Did the staff visit as frequently as stated they would?', reasonBox: false, name: 'staffVisitFrequency', options: ['Yes', 'No'] },
      { title: 'Did you feel comfortable asking staff questions regarding your health?', reasonBox: false, name: 'comfortAskingQuestions', options: ['Yes', 'No'] },
      { title: 'Did the staff visit at a mutually agreeable time?', reasonBox: false, name: 'mutuallyAgreeableTime', options: ['Yes', 'No'] },
      { title: 'If you had therapy, were exercise instructions given to you in a clear, written manner that you could easily understand?', reasonBox: false, name: 'therapyInstructionsClarity', options: ['Yes', 'No', 'N/A'] },
      { title: 'Did you feel you were discharged appropriately?', reasonBox: false, name: 'dischargeAppropriateness', options: ['Yes', 'No', 'N/A'] },
    ]
    ctrl.employeeSurveyQuestions = [
      { title: 'Are you happy working at our agency?', reasonBox: true, name: 'happyWorkingAtAgency', options: ['Yes', 'No']},
      { title: 'Did the company provide an orientation that enabled you to feel competent and comfortable care for patients?', reasonBox: true, name: 'companyOrientation', options: ['Yes', 'No', 'N/A']},
      { title: 'Do you receive the support and supervision you feel you need in carrying out your duties?', reasonBox: true, name: 'supportAndSupervision', options: ['Yes', 'No'] },
      { title: 'Are Supervisory and management personnel available at all times?', reasonBox: true, name: 'supervisoryAvailability', options: ['Yes', 'No'] },
      { title: 'Do you feel comfortable asking questions when you don’t know something or require clarification?', reasonBox: true, name: 'comfortableAskingQuestions', options: ['Yes', 'No'] },
      { title: 'Do you feel that your company’s salary and benefits are competitive?', reasonBox: true, name: 'salaryAndBenefits', options: ['Yes', 'No'] },
    ]


    ctrl.resetForm = function () {
      UtilService.reloadRoute();
    };

    ctrl.saveForm = function (action) {
      if (!$('#add_satisfaction_survey_form')[0].checkValidity()) {
        return;
      } else if (ctrl.surveyTypeSelected == 'employee_survey' && ctrl.surveyMainForm.employeeId == null) {
        ctrl.formSubmitted = true;
        $location.hash('employeeDropdownSeparator');
        $anchorScroll();
        return;
      } else if (ctrl.surveyTypeSelected == 'client_survey' && ctrl.surveyMainForm.patientId == null) {
        ctrl.formSubmitted = true;
        $location.hash('clienteDropdownSeparator');
        $anchorScroll();
      } else {
        ctrl.submitSurvey();
      }
    };

    ctrl.onSurveyTypeChange = function () {
      ctrl.isSurveyStarted = false;
    };

    ctrl.conductSurvey = function (type) {
      ctrl.surveyTypeSelected = type;
      ctrl.isSurveyStarted = true;
      ctrl.surveyForm = {};

      if (ctrl.surveyTypeSelected === 'client_survey') {
        ctrl.getServices();
        ctrl.getPatients();
        ctrl.surveyForm.services = {};
        $timeout(function () {
          $('#employeedropdown').select2('data', null);
        }, 100)
      }
      else {
        ctrl.getEmployeesList();
        $timeout(function () {
          $('#patientdropdown').select2('data', null);
        }, 100)
      }
    }


    ctrl.submitSurvey = function () {
      ctrl.surveyFormCopy = angular.copy(ctrl.surveyForm);
      if (ctrl.surveyTypeSelected == 'client_survey') {
        var services = [];
       
        angular.forEach(Object.keys(ctrl.surveyForm.services), function (key) {
            services.push(key);
        });

        ctrl.surveyFormCopy.services = services.toString();

      }

      ctrl.surveyMainForm.type = ctrl.surveyTypeSelected;
      ctrl.surveyMainForm.responses = JSON.stringify(ctrl.surveyFormCopy);
      $rootScope.maskLoading();
      SatisfactionSurveyDAO.submitSurvey(ctrl.surveyMainForm).then(function (response) {
        toastr.success('Survey submitted successfully');
        UtilService.reloadRoute();
      }).catch(function (error) {
        toastr.error('Error submitting survey');
      }).finally(function () {
        $rootScope.unmaskLoading();
      });
    };

    ctrl.getServices = function () {
      if (ctrl.servicesKeyValue.length == 0) {
        $rootScope.maskLoading();
        SatisfactionSurveyDAO.getClientServices().then(function (res) {
          ctrl.servicesKeyValue = res;
        }).catch(function (error) {
          toastr.error('Error fetching client services');
        }).finally(function () {
          $rootScope.unmaskLoading();
        });
      }
    };

    ctrl.getPatients = function () {
      if (ctrl.patientList.length == 0) {
        PatientDAO.retrieveForSelect({ 'status': 'all' }).then(function (res) {
          ctrl.patientList = res;
        }).catch(function () {
          toastr.error("Failed to retrieve patient list.");
        });
      }
    }

    ctrl.getEmployeesList = function () {
      if (ctrl.employeeList.length == 0) {
        EmployeeDAO.retrieveByPosition().then(function (res) {
          ctrl.employeeList = res;
        })
        .catch(function (data, status) {
          toastr.error("Failed to retrieve employees.");
        });
      }
    }

  }
  angular
    .module("xenon.controllers")
    .controller("SatisfactionSurveyController", [
      "$timeout",
      "$rootScope",
      "PatientDAO",
      "EmployeeDAO",
      "SatisfactionSurveyDAO",
      "UtilService",
      "$location",
      "$anchorScroll",
      "Page",
      SatisfactionSurveyController,
    ]);
})();
