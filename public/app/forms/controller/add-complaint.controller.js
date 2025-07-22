(function () {
  function AddComplaintController(
    $scope,
    $state,
    $timeout,
    $rootScope,
    $stateParams,
    $modal,
    $filter,
    PatientDAO,
    EmployeeDAO,
    WorksiteDAO,
    FormsDAO,
    $window,
    Page
  ) {
    var ctrl = this;
    $rootScope.maskLoading();
    Page.setTitle("Add Complaint");
    ctrl.currentUser = $rootScope.currentUser;
    ctrl.currentDate = new Date();
    ctrl.fiveDaysAgo = new Date();
    ctrl.currentDateWithFormat = $filter("date")(
      ctrl.currentDate,
      "MM/dd/yyyy"
    );
    ctrl.resolutionNotifDate = $filter("date")(
      ctrl.fiveDaysAgo.setDate(ctrl.currentDate.getDate() - 5),
      "MM/dd/yyyy"
    );
    ctrl.searchParamsForEmployee = {
      limit: 10,
      subActio: "active",
      pageNo: 1,
      name: "",
    };
    ctrl.patientList = [];
    ctrl.employeeList = [];
    ctrl.complaintTypes = angular.copy(ontime_data.complaintTypes);
    ctrl.reviewedComplaint = true;
    ctrl.formSubmitted = false;
    ctrl.isSignAdded = false;
    ctrl.isSignTouched = false;
    ctrl.submitAction = true;
    ctrl.generateFormCall = generateForms;
    ctrl.clearSignatureCall = clearSignature;
    ctrl.getListsCall = getLists;
    ctrl.getListsCallForClosedCall = getListsCallForClosed;
    ctrl.complaint = {};
    ctrl.title = "Add Complaint";
    ctrl.subtitle = "Create A New Complaint By Entering Complaint Information";
    ctrl.params = $stateParams;
    ctrl.complaintReceiver = ctrl.currentUser.firstName + ' ' + ctrl.currentUser.lastName;
    if (ctrl.params?.id && !ctrl.print) {
      ctrl.title = "Edit Complaint";
      ctrl.subtitle = "Edit The Complaint By Entering Complaint Information";
      Page.setTitle("Edit Complaint");
    }
    ctrl.closingComplaint = true;

    // for printing only hit comes from complaint-list
    ctrl.printParam = $stateParams?.print;
    ctrl.print = ctrl?.printParam ? true : false;
    ctrl.signatureClosedByPrint = "";
    ctrl.signaturePrint = "";
    if (ctrl.params?.id && ctrl.print) {
      ctrl.title = "Closed Complaint";
      ctrl.subtitle = "Closed The Complaint Information";
      Page.setTitle("Print Complaint");
    }

    /*================   GETTING LISTS   ===================*/
    async function getLists() {
      $rootScope.maskLoading();
      try {
        await Promise.all([
          getPatientsList(),
          getEmployeesList(),
          getWorksiteList(),
          //form call
          generateForms(),
        ]);
      } catch (error) {
          toastr.error("An error occurred while fetching data.");
          $rootScope.unmaskLoading();
      } finally {
        $rootScope.unmaskLoading();
      }
    }

    async function getListsCallForClosed() {
      $rootScope.maskLoading();
      try {
        await Promise.all([
          generateForms(),
        ]);
      } catch (error) {
          toastr.error("An error occurred while fetching data.");
          $rootScope.unmaskLoading();
      } finally {
        // $rootScope.unmaskLoading();
      }
    }

    /*================   FUNCTION CALLS   ===================*/
    if(!ctrl.print){
      ctrl.getListsCall();
    }else {
      getListsCallForClosed()
    }


    /*================   FORM FUNCTIONS   ===================*/
    function generateForms() {
      $rootScope.isFormDirty = false;
      ctrl.clearSignatureCall();
      if (ctrl.params?.id) {
        FormsDAO.getComplaintById({ id: ctrl.params?.id })
          .then((res) => {
            ctrl.complaint = {
              complaintDate: ctrl.getDate(res.complaintDate),
              complainantName: res.complainantName,
              complainantContactType: res.complainantContactType,
              complaintMethod: res.complaintMethod,
              complainantRelationshipType: res.complainantRelationshipType,
              complainantRelationship: res.complainantRelationship,
              complaintType: res.complaintType,
              type: ctrl.getComplaintType(res.complaintType),
              complaintDescription: res.complaintDescription,
              isFollowUpNeeded: res.isFollowUpNeeded.toString(),
              complaintResolution: "",
              complainantSatisfied: "yes",
              dateProposedResolution: res.isFollowUpNeeded == true?  '' : ctrl.getDate(res.dateProposedResolution),
              signature: null,
              dateResolvedOn: res?.dateResolvedOn || ctrl.currentDateWithFormat,
            };

            // if(ctrl.print){
            //   ctrl.complaint.complainantRelationship = res.complainantRelationship
            // }

            ctrl.getContactValue(
              res.complainantContactType,
              res.complainantContact
            );

            if (ctrl?.print === true) {
              //These fields not populate on edit if already resolve so only use for print purpose
                ctrl.signatureClosedByPrint = `${res?.resolvedBy?.fName} ${res?.resolvedBy?.lName}`;
                ctrl.signaturePrint = res?.signature;
                ctrl.complaint.complaintResolution = res?.complaintResolution;
              
                if(res?.complainantSatisfied != "yes"){
                  ctrl.complaint.implementedFollowUp = res?.complainantSatisfied;
                  ctrl.complaint.complainantSatisfied = "no";
                }else{
                  ctrl.complaint.complainantSatisfied = res?.complainantSatisfied;
                }

                if (res.complainantContactType == "PHONE") {
                    var phoneFormate = $filter("tel")(res.complainantContact );
                    ctrl.complaint.complainantContactPhone = phoneFormate;
                }
                // Reset the form state only when ctrl.print is true
                $rootScope.isFormDirty = false;
                setupWatch();
            }
          })
          .catch((err) => {
            toastr.error("Couldn't get complaint");
            $window.history.back();
          })
          .finally(() => {
            if(ctrl.print){
              $timeout(function() {
                $rootScope.unmaskLoading();
              }, 800);
            }
          });
      } else {
        ctrl.complaint = {
          complaintDate: ctrl.currentDateWithFormat,
          complainantName: "",
          complainantContactType: "PHONE",
          complainantContact: "",
          complainantRelationshipType: "PATIENT",
          complainantRelationship: "",
          complaintMethod: "PHONE",
          complaintType: "",
          complaintDescription: "",
          isFollowUpNeeded: "true",
          complaintResolution: "",
          complainantSatisfied: "yes",
          dateProposedResolution: null,
          signature: null,
          dateResolvedOn: ctrl.currentDateWithFormat,
        };
        setupWatch();
      }
    }

    ctrl.resetForm = function () {
      ctrl.generateFormCall();
    };

    function clearSignature() {
      ctrl.complaint.signature = "";
    }

    ctrl.saveForm = function (action) {
      if ($("#add_complaint_form")[0].checkValidity()) {
        var complaintToSave = angular.copy(ctrl.complaint);

        if(complaintToSave.isFollowUpNeeded === "true" || complaintToSave.isFollowUpNeeded === true){
          complaintToSave.complaintResolution = ""
          complaintToSave.complainantSatisfied = "yes"
          complaintToSave.dateProposedResolution = null
          complaintToSave.signature = null,
          complaintToSave.dateResolvedOn = null
        }

        

        if(complaintToSave.type != 'other'){
          complaintToSave.complaintType = complaintToSave.type
        }
        delete complaintToSave.type
        complaintToSave.complainantRelationship =
          complaintToSave.complainantRelationship.toString();
        complaintToSave.signature = complaintToSave.signature
          ? complaintToSave.signature.substring(
              complaintToSave.signature.indexOf(",") + 1
            )
          : null;
        complaintToSave.isFollowUpNeeded = JSON.parse(
          complaintToSave.isFollowUpNeeded
        );

        if(complaintToSave.complainantSatisfied != "yes"){
          complaintToSave.complainantSatisfied = complaintToSave.implementedFollowUp;
          delete complaintToSave.implementedFollowUp;
      }

        // Check the value of the complainantContactType field
        switch (complaintToSave.complainantContactType) {
          case "PHONE":
            complaintToSave.complainantContact =
              complaintToSave.complainantContactPhone;
            deleteContactTypes(complaintToSave);
            break;
          case "EMAIL":
            complaintToSave.complainantContact =
              complaintToSave.complainantContactEmail;
            deleteContactTypes(complaintToSave);
            break;
          case "ADDRESS":
            complaintToSave.complainantContact =
              complaintToSave.complainantContactAddress;
            deleteContactTypes(complaintToSave);
            break;
        }

        $rootScope.maskLoading();
        if (ctrl.params?.id) {
          complaintToSave.id = ctrl.params?.id;
          FormsDAO.updateComplaint(complaintToSave)
            .then((res) => {
              // ctrl.generateFormCall();
              $rootScope.isFormDirty = false;
              toastr.success("Complaint updated successfully");
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }

              $state.go("app.complaints", { status: "open" });
            })
            .catch((err) => {
              toastr.error(err.data);
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        } else {
          FormsDAO.addComplaint(complaintToSave)
            .then((res) => {
              $rootScope.isFormDirty = false;
              const characterArray = Object.values(res).filter(
                (value) => typeof value === "string"
              );
              toastr.success(Object.values(characterArray));
              if ($.fn.dirtyForms) {
                $("form").dirtyForms("setClean");
                $(".dirty").removeClass("dirty");
              }

              $state.go("app.complaints", { status: "open" });
            })
            .catch((err) => {
              toastr.error(err.data);
            })
            .then(function () {
              $rootScope.unmaskLoading();
            });
        }
      }
    };

    ctrl.resolvingComplaint = function(resolving){
      if(!resolving){
        ctrl.complaint.complaintResolution = ""
        ctrl.complaint.complainantSatisfied = "yes"
        ctrl.complaint.dateProposedResolution = null
        ctrl.complaint.signature = ''
        ctrl.complaint.dateResolvedOn = null
      }
    }

    function deleteContactTypes(obj) {
      delete obj.complainantContactPhone;
      delete obj.complainantContactEmail;
      delete obj.complainantContactAddress;
    }

    function getPatientsList() {
      return PatientDAO.retrieveForSelect({ status: "active" })
        .then(function (res) {
          ctrl.patientList = res;
          // if ($state.params.patientId && $state.params.patientId !== '') {
          //     ctrl.search.patientId = $state.params.patientId;
          // }
        })
        .catch(function () {
          toastr.error("Failed to retrieve patient list.");
        });
    }

    function getEmployeesList() {
      return EmployeeDAO.retrieveAll({ subAction: "active" })
        .then(function (res) {
          showLoadingBar({
            delay: 0.5,
            pct: 100,
            finish: function () {},
          });
          ctrl.employeeList = res;
        })
        .catch(function (data, status) {
          toastr.error("Failed to retrieve employees.");
          showLoadingBar({
            delay: 0.5,
            pct: 100,
            finish: function () {},
          });
        });
    }

        function getWorksiteList() {
            return WorksiteDAO.retrieveAll({ subAction: 'active' }).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }

                }); // showLoadingBar                
                if (res) {
                    ctrl.worksiteList = res;
                }
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve worksites.");
            });
        }

    /*================   UTILITY FUNCTIONS   ===================*/
    ctrl.relationToOrgChange = function () {
      ctrl.complaint.complainantRelationship = "";
    };

    function autoCompleteLocation() {
      const placeInput = document.getElementById("placeInput");
      var autocompleteAddress = new google.maps.places.Autocomplete(placeInput);
      google.maps.event.addListener(
        autocompleteAddress,
        "place_changed",
        function () {
          const place = autocompleteAddress.getPlace();
          ctrl.complaint.contactInfo.value = place.formatted_address;
        }
      );
    }

    ctrl.contactChange = function () {
      ctrl.complaint.complainantContact = "";
      ctrl.complaint.complainantContactEmail = ""
      ctrl.complaint.complainantContactPhone = ""
      ctrl.complaint.complainantContactAddress = ""
      if (ctrl.complaint.complainantContactType == "ADDRESS") {
        $timeout(autoCompleteLocation, 200);
      }
    };

    ctrl.typeChange = function (value) {
      if(value == 'other')
      ctrl.complaint.complaintType = ''
    };

    ctrl.complainantSatisfiedChange = function () {
      if (ctrl.complaint.complainantSatisfied !== "no") {
        delete ctrl.complaint.implementedFollowUp;
      }
    };

    ctrl.sanitizeHtml = function (htmlContent) {
      return $sce.trustAsHtml(htmlContent);
    };

    function setupWatch() {
      $scope.$watch(
        function () {
          return ctrl.complaint;
        },
        function (newValue, oldValue) {
          if (newValue != oldValue) {
            $rootScope.isFormDirty = false;
            // Reset the form state only when ctrl.print is not true
            if (ctrl?.print === true) {
              $rootScope.isFormDirty = false;
              $("form").dirtyForms("setClean");
              $(".dirty").removeClass("dirty");
            }
          }
        },
        true
      );
    }

    ctrl.getDate = function (date) {
      return $filter("date")(date, "MM/dd/yyyy");
    };

    ctrl.getComplaintType = function(type){
      const typeExist = ctrl.complaintTypes.find(item => {
        return item.value === type
      })
      return typeExist ? type : 'other'
    }

    ctrl.getComplaintTypeTitle = function(type){
      const typeItem = ctrl.complaintTypes.filter(item => {
        return item.value === type
      })

      return typeItem.length > 0 ? typeItem.title: type     
    }

    ctrl.getContactValue = function (type, value) {
      if (type == "PHONE") ctrl.complaint.complainantContactPhone = value;
      else if (type == "EMAIL") ctrl.complaint.complainantContactEmail = value;
      else if (type == "ADDRESS") ctrl.complaint.complainantContactAddress = value;
    };

    ctrl.getRelationValue = function (type, value) {
      if (type == 1) ctrl.complaint.complainantContactPhone = value;
      else if (type == 2) ctrl.complaint.complainantContactEmail = value;
      else if (type == 3) ctrl.complaint.complainantContactAddress = value;
    };
  }
  angular
    .module("xenon.controllers")
    .controller("AddComplaintController", [
      "$scope",
      "$state",
      "$timeout",
      "$rootScope",
      "$stateParams",
      "$modal",
      "$filter",
      "PatientDAO",
      "EmployeeDAO",
      "WorksiteDAO",
      "FormsDAO",
      "$window",
      "Page",
      AddComplaintController,
    ]);
})();
